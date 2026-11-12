import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@nava/db';
import { buildWhatsAppLink } from '@/lib/config';
import { isDatabaseAvailable } from '@/lib/catalog-service';
import { EmailService } from '@/lib/email-service';

interface EnquiryPayload {
  name: string;
  phone: string;
  email?: string;
  eventType: string;
  eventDate?: string;
  bangleSize?: string;
  notes: string;
  honeypot?: string;
  clientTimestamp?: number;
}

export type EnquiryOutcome = 'RECORDED' | 'UNPERSISTED_FALLBACK';

interface CachedEnquiry {
  enquiryId: string;
  outcome: EnquiryOutcome;
  whatsappDirectUrl: string;
  timestamp: number;
}

// In-memory deduplication cache: retains submissions for 60 seconds to prevent double-clicks
const globalForEnquiries = globalThis as unknown as {
  recentSubmissions?: Map<string, CachedEnquiry>;
};

const recentSubmissions =
  globalForEnquiries.recentSubmissions ?? new Map<string, CachedEnquiry>();

if (process.env.NODE_ENV !== 'production') {
  globalForEnquiries.recentSubmissions = recentSubmissions;
}

function cleanDeduplicationCache() {
  const cutoff = Date.now() - 60 * 1000;
  for (const [key, value] of recentSubmissions.entries()) {
    if (value.timestamp < cutoff) {
      recentSubmissions.delete(key);
    }
  }
}

function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags and their content
    .replace(/<[^>]*>/g, '') // Strip any remaining HTML tags
    .replace(/javascript:/gi, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    cleanDeduplicationCache();

    const rawBody = await request.text();
    if (rawBody.length > 10000) {
      return NextResponse.json({ error: 'Payload size exceeds allowable limit' }, { status: 413 });
    }

    let body: EnquiryPayload;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload format' }, { status: 400 });
    }

    // 1. Anti-spam honeypot verification
    if (body.honeypot && body.honeypot.trim() !== '') {
      return NextResponse.json({ error: 'Spam submission detected' }, { status: 400 });
    }

    // 2. Anti-bot minimum dwell time (reject submissions faster than 1 second or timestamp manipulation)
    const dwellMs = body.clientTimestamp ? Date.now() - body.clientTimestamp : null;
    if (dwellMs !== null && (dwellMs < 1000 || dwellMs > 86400000)) {
      return NextResponse.json({ error: 'Automated burst submission detected' }, { status: 400 });
    }

    // 3. Server-side validation & sanitization
    const rawName = (body.name || '').trim();
    const name = sanitizeText(rawName);
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Please provide a valid full name (2–100 characters)' }, { status: 422 });
    }

    const phone = (body.phone || '').trim();
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ error: 'Please provide a valid phone or WhatsApp number (minimum 10 digits)' }, { status: 422 });
    }

    const eventType = sanitizeText(body.eventType || 'Bridal Wedding Set');
    const eventDate = sanitizeText(body.eventDate || '');
    const bangleSize = sanitizeText(body.bangleSize || '2.6');
    const rawNotes = (body.notes || '').trim();
    const notes = sanitizeText(rawNotes);

    if (!notes || notes.length < 5 || notes.length > 2000) {
      return NextResponse.json({ error: 'Please provide notes regarding your requirements or preferences (5–2000 characters)' }, { status: 422 });
    }

    // 4. Duplicate Submission Protection (60-second window on phone + notes signature)
    const dedupeKey = crypto
      .createHash('sha256')
      .update(`${cleanPhone}|${notes.slice(0, 50)}`)
      .digest('hex');

    const cached = recentSubmissions.get(dedupeKey);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return NextResponse.json(
        {
          success: cached.outcome === 'RECORDED',
          duplicated: true,
          outcome: cached.outcome,
          enquiryId: cached.enquiryId,
          persistedToDb: cached.outcome === 'RECORDED',
          message: 'An identical enquiry was recently received. Please use your existing reference or contact us on WhatsApp.',
          whatsappDirectUrl: cached.whatsappDirectUrl,
        },
        { status: cached.outcome === 'RECORDED' ? 200 : 202 }
      );
    }

    const enquiryId = `ENQ-${Date.now().toString(36).toUpperCase()}`;
    const receivedAt = new Date().toISOString();

    // 5. Compose formatted WhatsApp direct link
    const whatsappText =
      `Hello NAVA Creations! I have submitted a bespoke consultation enquiry [Ref: ${enquiryId}]:\n\n` +
      `*Name:* ${name}\n` +
      `*Phone:* ${phone}\n` +
      `*Event Type:* ${eventType}\n` +
      (eventDate ? `*Approx Date:* ${eventDate}\n` : '') +
      `*Bangle Size:* ${bangleSize}\n` +
      `*Design Notes:* ${notes}\n\n` +
      `Looking forward to discussing bespoke options!`;

    const whatsappDirectUrl = buildWhatsAppLink(whatsappText);

    // 6. Transactional Email notification (real or simulated)
    const emailResult = await EmailService.sendEnquiryNotification({
      enquiryNumber: enquiryId,
      customerName: name,
      customerPhone: phone,
      customerEmail: body.email,
      eventType,
      eventDate: eventDate || undefined,
      bangleSize: bangleSize || undefined,
      notes,
      receivedAt,
    });

    // 7. Persist to PostgreSQL if database connection is available
    let persistedToDb = false;
    if (isDatabaseAvailable()) {
      try {
        await prisma.enquiry.create({
          data: {
            enquiryNumber: enquiryId,
            name,
            phone,
            email: body.email || null,
            eventType,
            eventDate: eventDate || null,
            bangleSize: bangleSize || null,
            notes,
            whatsappUrl: whatsappDirectUrl,
            emailSent: emailResult.status === 'ACCEPTED_BY_PROVIDER',
          },
        });
        persistedToDb = true;
      } catch (dbErr) {
        console.error(
          `[EnquiryPersistence] Failed to write enquiry ${enquiryId} to database:`,
          dbErr instanceof Error ? dbErr.message : dbErr
        );
      }
    }

    // Always mirror to memory registry for seamless administration during development and tests
    const globalForEnquiryRegistry = globalThis as unknown as {
      memoryEnquiries?: Map<string, any>;
    };
    if (!globalForEnquiryRegistry.memoryEnquiries) {
      globalForEnquiryRegistry.memoryEnquiries = new Map<string, any>();
    }
    globalForEnquiryRegistry.memoryEnquiries.set(enquiryId, {
      id: enquiryId,
      enquiryNumber: enquiryId,
      name,
      phone,
      email: body.email || null,
      eventType,
      eventDate: eventDate || null,
      bangleSize: bangleSize || null,
      notes,
      status: 'NEW',
      whatsappUrl: `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hello ${name}, thank you for contacting NAVA Creations regarding enquiry #${enquiryId}.`)}`,
      emailSent: emailResult.status === 'ACCEPTED_BY_PROVIDER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const outcome: EnquiryOutcome = persistedToDb ? 'RECORDED' : 'UNPERSISTED_FALLBACK';

    // Store in deduplication cache
    recentSubmissions.set(dedupeKey, {
      enquiryId,
      outcome,
      whatsappDirectUrl,
      timestamp: Date.now(),
    });

    // Structured audit trail log
    console.log(
      `[ENQUIRY_OUTCOME] ID=${enquiryId} Outcome=${outcome} PersistedDB=${persistedToDb} EmailStatus=${emailResult.status} ReceivedAt=${receivedAt}`
    );

    if (outcome === 'RECORDED') {
      return NextResponse.json(
        {
          success: true,
          outcome: 'RECORDED',
          enquiryId,
          receivedAt,
          persistedToDb: true,
          emailStatus: emailResult.status,
          message: 'Your bridal enquiry has been recorded in our system. Our atelier team will review your requirements.',
          whatsappDirectUrl,
        },
        { status: 201 }
      );
    }

    // Honest Unpersisted Fallback Response
    return NextResponse.json(
      {
        success: false,
        outcome: 'UNPERSISTED_FALLBACK',
        enquiryId,
        receivedAt,
        persistedToDb: false,
        emailStatus: emailResult.status,
        message:
          'Our database is currently offline and could not store your enquiry. Please click below to send your details directly via WhatsApp or contact our Bengaluru atelier.',
        whatsappDirectUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
