import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { prisma } from '@nava/db';
import { isDatabaseAvailable } from '@/lib/catalog-service';

export interface AdminEnquiryDto {
  id: string;
  enquiryNumber: string;
  name: string;
  phone: string;
  email?: string | null;
  eventType: string;
  eventDate?: string | null;
  bangleSize?: string | null;
  notes: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  whatsappUrl?: string | null;
  emailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Global in-memory registry for enquiries during offline development
const globalForEnquiryRegistry = globalThis as unknown as {
  memoryEnquiries?: Map<string, AdminEnquiryDto>;
};

const memoryEnquiries =
  globalForEnquiryRegistry.memoryEnquiries ?? new Map<string, AdminEnquiryDto>();

if (process.env.NODE_ENV !== 'production') {
  globalForEnquiryRegistry.memoryEnquiries = memoryEnquiries;
}

function initializeSampleEnquiries() {
  if (memoryEnquiries.size === 0) {
    const now = new Date();
    const enq1: AdminEnquiryDto = {
      id: 'enq-001',
      enquiryNumber: 'ENQ-KDN-7801',
      name: 'Dr. Radhika Menon',
      phone: '+919845012345',
      email: 'radhika.menon@example.in',
      eventType: 'Bridal Wedding Set',
      eventDate: '15 Dec 2026',
      bangleSize: '2.4',
      notes: 'Looking for a bespoke royal bridal Kundan kada set with matching maroon velvet bangles for my wedding reception.',
      status: 'NEW',
      whatsappUrl:
        'https://wa.me/919845012345?text=Hello%20Dr.%20Radhika%20Menon%2C%20regarding%20your%20NAVA%20Creations%20enquiry%20%23ENQ-KDN-7801',
      emailSent: true,
      createdAt: new Date(now.getTime() - 3600000),
      updatedAt: new Date(now.getTime() - 3600000),
    };

    const enq2: AdminEnquiryDto = {
      id: 'enq-002',
      enquiryNumber: 'ENQ-KDN-7802',
      name: 'Sushmitha Hegde',
      phone: '+919900112233',
      email: 'sushmitha@example.in',
      eventType: 'Housewarming / Pooja',
      eventDate: '28 Nov 2026',
      bangleSize: '2.6',
      notes: 'Need 50 sets of traditional return gift bangles boxed in red brocade packaging.',
      status: 'CONTACTED',
      whatsappUrl:
        'https://wa.me/919900112233?text=Hello%20Sushmitha%20Hegde%2C%20regarding%20your%20NAVA%20Creations%20enquiry%20%23ENQ-KDN-7802',
      emailSent: false,
      createdAt: new Date(now.getTime() - 86400000),
      updatedAt: new Date(now.getTime() - 43200000),
    };

    memoryEnquiries.set(enq1.enquiryNumber, enq1);
    memoryEnquiries.set(enq2.enquiryNumber, enq2);
  }
}

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  initializeSampleEnquiries();

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    if (isDatabaseAvailable()) {
      try {
        const whereClause = statusFilter ? { status: statusFilter as any } : {};
        const enquiries = await prisma.enquiry.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
          success: true,
          enquiries,
          total: enquiries.length,
        });
      } catch (_e) {
        // Fallback to memory
      }
    }

    let list = Array.from(memoryEnquiries.values());
    if (statusFilter) {
      list = list.filter((e) => e.status === statusFilter);
    }
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      success: true,
      enquiries: list,
      total: list.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve enquiries';
    return NextResponse.json({ error: 'Failed to retrieve enquiries', message }, { status: 500 });
  }
}
