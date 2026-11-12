import { NextRequest, NextResponse } from 'next/server';
import { CatalogService } from '@/lib/catalog-service';
import { SAMPLE_PRODUCTS } from '@/lib/sample-data';

interface CartValidateInputItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawItems: CartValidateInputItem[] = Array.isArray(body.items) ? body.items : [];

    if (rawItems.length === 0) {
      return NextResponse.json({
        isValid: true,
        items: [],
        totalItems: 0,
        subtotalPaise: 0,
        warnings: [],
      });
    }

    if (rawItems.length > 50) {
      return NextResponse.json(
        { error: 'Cart exceeds maximum allowed limit of 50 unique items' },
        { status: 422 }
      );
    }

    const warnings: string[] = [];
    const validatedItems = [];
    let subtotalPaise = 0;
    let totalItems = 0;

    // Fetch catalogue to resolve authoritative prices and inventory
    const productsResult = await CatalogService.getPublishedProducts({ limit: 100 });
    const allProducts = productsResult.items.length > 0 ? productsResult.items : SAMPLE_PRODUCTS;

    for (const raw of rawItems) {
      if (!raw.productId || typeof raw.productId !== 'string') {
        warnings.push('Invalid cart item format: missing or invalid product identifier.');
        continue;
      }

      // Strict validation of quantity: must be positive integer
      if (
        typeof raw.quantity !== 'number' ||
        isNaN(raw.quantity) ||
        !Number.isInteger(raw.quantity) ||
        raw.quantity < 1
      ) {
        warnings.push(`Invalid quantity for item "${raw.productId}". Quantity must be a positive integer.`);
        continue;
      }

      let cleanQty = raw.quantity;
      if (cleanQty > 20) {
        cleanQty = 20;
        warnings.push(`Quantity for item "${raw.productId}" exceeded the maximum limit and was capped at 20.`);
      }

      const product = allProducts.find((p) => p.id === raw.productId || p.slug === raw.productId);
      if (!product || (product.status && product.status !== 'PUBLISHED')) {
        warnings.push(`Item "${raw.productId}" is not available in the published catalogue and was removed.`);
        continue;
      }

      // Check variant existence
      const variant = raw.variantId
        ? product.variants?.find((v) => v.id === raw.variantId)
        : product.variants?.[0];

      if (raw.variantId && !variant) {
        warnings.push(`Requested variant "${raw.variantId}" for "${product.name}" does not exist and was adjusted.`);
      }
      const activeVariant = variant || product.variants?.[0];
      const authoritativePricePaise = activeVariant?.pricePaise || product.pricePaise;
      const authoritativeMrpPaise = activeVariant?.mrpPaise || product.compareAtPricePaise;
      const authoritativeStock = activeVariant?.availableStock ?? (product.isAvailable ? 10 : 0);

      if (authoritativeStock <= 0) {
        warnings.push(`"${product.name}" (${activeVariant?.size || 'Standard'}) is currently sold out.`);
        continue;
      }

      let finalQty = cleanQty;
      if (cleanQty > authoritativeStock) {
        finalQty = authoritativeStock;
        warnings.push(`Quantity for "${product.name}" was adjusted to available workshop stock (${authoritativeStock}).`);
      }

      const itemTotal = authoritativePricePaise * finalQty;
      subtotalPaise += itemTotal;
      totalItems += finalQty;

      validatedItems.push({
        id: `${product.id}_${activeVariant?.id || 'standard'}`,
        productId: product.id,
        variantId: activeVariant?.id || 'standard',
        name: product.name,
        size: activeVariant?.size || null,
        sku: activeVariant?.sku || product.sku || product.id,
        pricePaise: authoritativePricePaise,
        compareAtPricePaise: authoritativeMrpPaise,
        imageUrl: product.images?.[0]?.url || null,
        quantity: finalQty,
        maxStock: authoritativeStock,
      });
    }

    return NextResponse.json({
      isValid: warnings.length === 0,
      items: validatedItems,
      totalItems,
      subtotalPaise,
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
