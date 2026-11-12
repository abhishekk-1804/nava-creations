import { NextRequest, NextResponse } from 'next/server';
import { CatalogService, DatabaseUnavailableError } from '@/lib/catalog-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Collection slug is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const result = await CatalogService.getCollectionProducts(slug, { page, limit });
    if (!result) {
      return NextResponse.json(
        { error: `Collection with slug "${slug}" not found or not published` },
        { status: 404 }
      );
    }

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
