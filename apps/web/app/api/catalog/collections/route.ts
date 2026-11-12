import { NextResponse } from 'next/server';
import { CatalogService, DatabaseUnavailableError } from '@/lib/catalog-service';

export async function GET() {
  try {
    const collections = await CatalogService.getPublishedCollections();
    return NextResponse.json({ collections }, { status: 200 });
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
