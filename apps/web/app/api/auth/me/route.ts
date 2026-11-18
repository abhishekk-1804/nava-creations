import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerSession } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyCustomerSession(request);

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        phone: session.phone,
        role: session.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
