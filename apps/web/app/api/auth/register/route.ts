import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nava/db';
import { issueCustomerSession, CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_DURATION } from '@/lib/customer-auth';
import { authRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';

export async function POST(request: NextRequest) {
  try {
    const ipResolution = resolveClientIp(request);
    const clientIp = ipResolution.clientIp;

    // Rate limiting: max 10 registrations per 15 mins per IP
    const rateCheck = await authRateLimiter.checkDistributed(`reg:${clientIp}`, 10, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please retry in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Full name is required (minimum 2 characters)' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    // Check duplicate account
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (!user) {
      // Create user without custom password (Passwordless identity)
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          role: 'CUSTOMER',
          isActive: true,
        },
      });
    } else {
      // Update name/phone if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || name,
          phone: user.phone || (phone || null),
        },
      });
    }

    // Issue session for immediate login
    const userAgent = request.headers.get('user-agent');
    const session = await issueCustomerSession(user.id, {
      userAgent,
      ipAddress: clientIp,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully (Passwordless)',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: CUSTOMER_SESSION_COOKIE,
      value: session.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CUSTOMER_SESSION_DURATION,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
