import { NextRequest, NextResponse } from 'next/server';
import { CatalogService, DatabaseUnavailableError } from '@/lib/catalog-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    const product = await CatalogService.getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: `Product with slug "${slug}" not found` }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
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
