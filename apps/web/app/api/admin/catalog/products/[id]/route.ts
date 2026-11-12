import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { CatalogService, DatabaseUnavailableError } from '@/lib/catalog-service';
import { ValidationError, NotFoundError } from '@nava/shared';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrative session required for catalog mutation' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    await CatalogService.updateProduct(id, body);
    return NextResponse.json({ success: true, message: 'Product updated successfully' }, { status: 200 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrative session required for catalog mutation' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    await CatalogService.archiveProduct(id);
    return NextResponse.json({ success: true, message: 'Product archived successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: 'Database service is currently unconfigured or unavailable' },
        { status: 503 }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
