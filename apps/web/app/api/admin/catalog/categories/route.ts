import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { CatalogService, DatabaseUnavailableError } from '@/lib/catalog-service';
import { ValidationError, ConflictError, NotFoundError } from '@nava/shared';

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrative session required' },
      { status: 401 }
    );
  }

  try {
    const categories = await CatalogService.getAllCategoriesFlat(true);
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: 'Database service is currently unconfigured or unavailable' },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrative session required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const category = await CatalogService.createCategory(body);
    return NextResponse.json({ success: true, category }, { status: 201 });
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
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
