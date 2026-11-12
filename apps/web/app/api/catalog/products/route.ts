import { NextRequest, NextResponse } from 'next/server';
import { CatalogService, DatabaseUnavailableError } from '@/lib/catalog-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const collectionId = searchParams.get('collectionId') || undefined;
    const isFeatured = searchParams.has('featured')
      ? searchParams.get('featured') === 'true'
      : undefined;
    const search = searchParams.get('search') || undefined;

    const result = await CatalogService.getPublishedProducts({
      page,
      limit,
      categoryId,
      collectionId,
      isFeatured,
      search,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        {
          error: 'Database is unconfigured or temporarily unreachable',
          service: 'nava-creations-web',
          status: 'unavailable',
        },
        { status: 503 }
      );
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
