import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nava/db';
import {
  issueCustomerSession,
  sendEmailOtp,
  verifyEmailOtp,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_DURATION,
} from '@/lib/customer-auth';
import { authRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';

export async function POST(request: NextRequest) {
  try {
    const ipResolution = resolveClientIp(request);
    const clientIp = ipResolution.clientIp;

    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();
    const action = body.action; // 'send_otp' | undefined
    const otp = (body.otp || body.code || '').trim();
    const password = body.password || '';

    // Rate limiting: 15 attempts per 15 mins per IP
    const rateCheck = await authRateLimiter.checkDistributed(`login:${clientIp}`, 15, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please retry in ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // 1. Dispatch Email OTP request
    if (action === 'send_otp' || (!otp && !password)) {
      const otpRes = await sendEmailOtp(email);
      return NextResponse.json({
        success: true,
        message: otpRes.message,
        isTestMode: otpRes.isTestMode,
        testOtp: otpRes.testOtp,
      });
    }

    // 2. Verify Email OTP passcode (Passwordless flow)
    if (otp) {
      const userAgent = request.headers.get('user-agent');
      const verifyRes = await verifyEmailOtp(email, otp, {
        userAgent,
        ipAddress: clientIp,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Authenticated successfully via Email OTP',
        user: verifyRes.user,
      });

      response.cookies.set({
        name: CUSTOMER_SESSION_COOKIE,
        value: verifyRes.sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: CUSTOMER_SESSION_DURATION,
      });

      await authRateLimiter.reset(`login:${clientIp}`);
      return response;
    }

    // 3. Fallback for Local / Test Automation (e.g. seed customer in dev/test)
    if (password && process.env.NODE_ENV !== 'production') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await authRateLimiter.recordFailure(`login:${clientIp}`, 900);
        return NextResponse.json({ error: 'Account not found' }, { status: 401 });
      }

      const userAgent = request.headers.get('user-agent');
      const session = await issueCustomerSession(user.id, {
        userAgent,
        ipAddress: clientIp,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Logged in successfully (Test Mode)',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });

      response.cookies.set({
        name: CUSTOMER_SESSION_COOKIE,
        value: session.sessionToken,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: CUSTOMER_SESSION_DURATION,
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Please enter the 6-digit OTP passcode sent to your email.' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
