import { NextRequest, NextResponse } from 'next/server';
import { revokeCustomerSession, CUSTOMER_SESSION_COOKIE } from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  try {
    await revokeCustomerSession(request);

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set({
      name: CUSTOMER_SESSION_COOKIE,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
