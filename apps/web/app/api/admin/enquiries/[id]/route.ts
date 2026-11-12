import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { prisma } from '@nava/db';
import { isDatabaseAvailable } from '@/lib/catalog-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const validStatuses = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Valid status required (NEW, CONTACTED, CONVERTED, CLOSED)' },
        { status: 422 }
      );
    }

    if (isDatabaseAvailable()) {
      try {
        const updated = await prisma.enquiry.update({
          where: { enquiryNumber: id },
          data: { status: body.status },
        });

        return NextResponse.json({
          success: true,
          enquiry: updated,
          message: 'Enquiry status updated successfully',
        });
      } catch (_e) {
        // Fallback to memory
      }
    }

    const globalForEnquiryRegistry = globalThis as unknown as {
      memoryEnquiries?: Map<string, any>;
    };
    const registry = globalForEnquiryRegistry.memoryEnquiries;
    if (registry && registry.has(id)) {
      const enq = registry.get(id);
      enq.status = body.status;
      enq.updatedAt = new Date();
      registry.set(id, enq);
      return NextResponse.json({
        success: true,
        enquiry: enq,
        message: 'Enquiry status updated successfully',
      });
    }

    return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update enquiry';
    return NextResponse.json({ error: 'Failed to update enquiry', message }, { status: 400 });
  }
}
