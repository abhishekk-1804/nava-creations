import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { CatalogService, DatabaseUnavailableError } from '@/lib/catalog-service';
import { ValidationError, NotFoundError } from '@nava/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrative session required for inventory mutation' },
      { status: 401 }
    );
  }

  try {
    const { variantId } = await params;
    const body = await request.json();
    await CatalogService.updateInventory(variantId, body.availableQty, body.safetyStock);
    return NextResponse.json({ success: true, message: 'Inventory updated successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: 'Database service is currently unconfigured or unavailable' },
        { status: 503 }
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
