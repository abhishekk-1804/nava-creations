import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nava/db';
import { verifyCustomerSession } from '@/lib/customer-auth';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyCustomerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership: customer can only delete their own address
    const address = await prisma.customerAddress.findUnique({
      where: { id },
    });

    if (!address || address.userId !== session.userId) {
      return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 });
    }

    await prisma.customerAddress.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Address removed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete address';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
