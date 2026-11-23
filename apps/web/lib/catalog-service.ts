import { prisma } from '@nava/db';
import {
  PricingEngine,
  InventoryValidator,
  normalizePagination,
  buildPaginatedResult,
  ProductDto,
  CategoryDto,
  CollectionDto,
  ProductQueryOptions,
  PaginatedResult,
} from '@nava/domain';
import { ValidationError, NotFoundError, ConflictError } from '@nava/shared';
import {
  SAMPLE_PRODUCTS,
  SAMPLE_CATEGORIES,
  SAMPLE_COLLECTIONS,
} from './sample-data';

// Global singletons for in-memory catalog persistence during development/tests without DB
const globalForCatalog = globalThis as unknown as {
  __nava_memory_categories__?: CategoryDto[];
  __nava_memory_collections__?: CollectionDto[];
};

if (!globalForCatalog.__nava_memory_categories__) {
  globalForCatalog.__nava_memory_categories__ = JSON.parse(JSON.stringify(SAMPLE_CATEGORIES));
}

if (!globalForCatalog.__nava_memory_collections__) {
  globalForCatalog.__nava_memory_collections__ = JSON.parse(JSON.stringify(SAMPLE_COLLECTIONS));
}

const memoryCategories = globalForCatalog.__nava_memory_categories__!;
const memoryCollections = globalForCatalog.__nava_memory_collections__!;

export class DatabaseUnavailableError extends Error {
  constructor(message = 'Database is unconfigured or temporarily unreachable') {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  sku?: string;
  pricePaise: number;
  compareAtPricePaise?: number | null;
  categoryId: string;
  isFeatured?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  initialStock?: number;
  variants?: {
    sku: string;
    title: string;
    size?: string;
    colour?: string;
    pricePaise: number;
    mrpPaise: number;
    initialStock?: number;
  }[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
  pricePaise?: number;
  compareAtPricePaise?: number | null;
  isFeatured?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  hsnCode?: string;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  hsnCode?: string;
  isActive?: boolean;
}

export interface CreateCollectionInput {
  name: string;
  slug?: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  displayOrder?: number;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  displayOrder?: number;
}

export function isDatabaseAvailable(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim() !== '' && !url.includes('placeholder') && !url.includes('ep-sample'));
}

export function isDemoModePermitted(): boolean {
  // In production, fallback to fake inventory is STRICTLY FORBIDDEN unless NEXT_PUBLIC_DEMO_MODE === 'true'
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return false;
  }
  return true;
}

function checkReadAvailability() {
  if (!isDatabaseAvailable() && !isDemoModePermitted()) {
    throw new DatabaseUnavailableError(
      'Production database connection is offline. Mock inventory fallback is prohibited in production.'
    );
  }
}

function checkDatabaseConfigured() {
  if (!isDatabaseAvailable()) {
    throw new DatabaseUnavailableError();
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CatalogService {
  /**
   * Retrieves published products for public storefront listing.
   * Supports pagination, category filter, collection filter, and search.
   * Falls back to clearly labelled development placeholders when database is unconfigured.
   */
  static async getPublishedProducts(
    options: ProductQueryOptions = {}
  ): Promise<PaginatedResult<ProductDto>> {
    const { page, limit, offset } = normalizePagination(options.page, options.limit);

    if (!isDatabaseAvailable()) {
      checkReadAvailability();
      let filtered = [...SAMPLE_PRODUCTS];

      if (options.categoryId) {
        filtered = filtered.filter(
          (p) => p.categoryId === options.categoryId || p.category?.slug === options.categoryId
        );
      }

      if (options.isFeatured !== undefined) {
        filtered = filtered.filter((p) => p.isFeatured === options.isFeatured);
      }

      if (options.collectionId) {
        filtered = filtered.filter((p) =>
          p.collections?.some((c) => c.id === options.collectionId || c.slug === options.collectionId)
        );
      }

      if (options.search && options.search.trim() !== '') {
        const term = options.search.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term) ||
            p.sku?.toLowerCase().includes(term)
        );
      }

      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limit);
      return buildPaginatedResult(paginated, total, page, limit);
    }

    const andConditions: any[] = [{ status: 'PUBLISHED' }];

    if (options.categoryId) {
      andConditions.push({
        OR: [
          { categoryId: options.categoryId },
          { category: { slug: options.categoryId } },
        ],
      });
    }

    if (options.isFeatured !== undefined) {
      andConditions.push({ isFeatured: options.isFeatured });
    }

    if (options.collectionId) {
      andConditions.push({
        collections: {
          some: {
            OR: [
              { collectionId: options.collectionId },
              { collection: { slug: options.collectionId } },
            ],
          },
        },
      });
    }

    if (options.search && options.search.trim() !== '') {
      const term = options.search.trim();
      andConditions.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    const where: any = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
          },
          variants: {
            where: { isActive: true },
            include: {
              inventoryItem: true,
            },
          },
          collections: {
            include: {
              collection: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
    ]);

    const items: ProductDto[] = products.map((prod) => {
      const variantsDto = prod.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        title: v.title,
        size: v.size,
        colour: v.colour,
        pricePaise: v.pricePaise,
        mrpPaise: v.mrpPaise,
        weightGrams: v.weightGrams,
        isActive: v.isActive,
        availableStock: v.inventoryItem
          ? InventoryValidator.calculateAvailableStock(v.inventoryItem)
          : 0,
      }));

      const totalAvailableStock = variantsDto.reduce(
        (sum, v) => sum + (v.availableStock || 0),
        0
      );

      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        sku: prod.sku,
        pricePaise: prod.pricePaise,
        compareAtPricePaise: prod.compareAtPricePaise,
        status: prod.status,
        isFeatured: prod.isFeatured,
        isAvailable: prod.isAvailable && totalAvailableStock > 0,
        categoryId: prod.categoryId,
        category: prod.category,
        images: prod.images.map((img) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          publicId: img.publicId,
          displayOrder: img.displayOrder,
          isPrimary: img.isPrimary,
        })),
        variants: variantsDto,
        collections: prod.collections.map((c) => ({
          id: c.collection.id,
          name: c.collection.name,
          slug: c.collection.slug,
        })),
        createdAt: prod.createdAt.toISOString(),
        updatedAt: prod.updatedAt.toISOString(),
      };
    });

    return buildPaginatedResult(items, total, page, limit);
  }

  /**
   * Retrieves single published product by slug with complete details.
   */
  static async getProductBySlug(slug: string): Promise<ProductDto | null> {
    if (!slug || slug.trim() === '') return null;
    const cleanSlug = slug.trim();

    if (!isDatabaseAvailable()) {
      checkReadAvailability();
      const found = SAMPLE_PRODUCTS.find((p) => p.slug === cleanSlug);
      return found ?? null;
    }

    const prod = await prisma.product.findUnique({
      where: { slug: cleanSlug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
        },
        variants: {
          where: { isActive: true },
          include: {
            inventoryItem: true,
          },
        },
        collections: {
          include: {
            collection: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!prod || prod.status !== 'PUBLISHED') {
      return null;
    }

    const variantsDto = prod.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title,
      size: v.size,
      colour: v.colour,
      pricePaise: v.pricePaise,
      mrpPaise: v.mrpPaise,
      weightGrams: v.weightGrams,
      isActive: v.isActive,
      availableStock: v.inventoryItem
        ? InventoryValidator.calculateAvailableStock(v.inventoryItem)
        : 0,
    }));

    const totalAvailableStock = variantsDto.reduce(
      (sum, v) => sum + (v.availableStock || 0),
      0
    );

    return {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      sku: prod.sku,
      pricePaise: prod.pricePaise,
      compareAtPricePaise: prod.compareAtPricePaise,
      status: prod.status,
      isFeatured: prod.isFeatured,
      isAvailable: prod.isAvailable && totalAvailableStock > 0,
      categoryId: prod.categoryId,
      category: prod.category,
      images: prod.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        publicId: img.publicId,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary,
      })),
      variants: variantsDto,
      collections: prod.collections.map((c) => ({
        id: c.collection.id,
        name: c.collection.name,
        slug: c.collection.slug,
      })),
      createdAt: prod.createdAt.toISOString(),
      updatedAt: prod.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves single published product by product variant ID.
   */
  static async getProductByVariantId(variantId: string): Promise<ProductDto | null> {
    if (!variantId || variantId.trim() === '') return null;
    const cleanId = variantId.trim();

    if (!isDatabaseAvailable()) {
      checkReadAvailability();
      const found = SAMPLE_PRODUCTS.find((p) =>
        p.variants?.some((v) => v.id === cleanId) || p.id === cleanId
      );
      return found ?? null;
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: cleanId },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }] },
            variants: { where: { isActive: true }, include: { inventoryItem: true } },
            collections: { include: { collection: { select: { id: true, name: true, slug: true } } } },
          },
        },
      },
    });

    if (!variant || !variant.product) return null;
    const prod = variant.product;

    const variantsDto = prod.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title,
      size: v.size ?? null,
      colour: v.colour ?? null,
      pricePaise: v.pricePaise,
      mrpPaise: v.mrpPaise,
      weightGrams: v.weightGrams ?? null,
      isActive: v.isActive,
      availableStock: v.inventoryItem?.availableQty ?? 0,
    }));

    const isAvailable = variantsDto.some((v) => v.availableStock > 0);

    return {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description ?? null,
      sku: variantsDto[0]?.sku ?? '',
      pricePaise: prod.pricePaise,
      compareAtPricePaise: prod.compareAtPricePaise,
      status: prod.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      isFeatured: prod.isFeatured,
      isAvailable,
      categoryId: prod.categoryId,
      category: prod.category
        ? {
            id: prod.category.id,
            name: prod.category.name,
            slug: prod.category.slug,
          }
        : undefined,
      images: prod.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        publicId: img.publicId,
        displayOrder: img.displayOrder,
        isPrimary: img.isPrimary,
      })),
      variants: variantsDto,
      collections: prod.collections.map((c) => ({
        id: c.collection.id,
        name: c.collection.name,
        slug: c.collection.slug,
      })),
      createdAt: prod.createdAt.toISOString(),
      updatedAt: prod.updatedAt.toISOString(),
    };
  }

  /**
   * Lists active categories in hierarchical order.
   */
  static async getCategories(): Promise<CategoryDto[]> {
    if (!isDatabaseAvailable()) {
      checkReadAvailability();
      const categoryMap = new Map<string, CategoryDto>();
      const roots: CategoryDto[] = [];

      for (const cat of memoryCategories) {
        if (!cat.isActive) continue;
        categoryMap.set(cat.id, {
          ...cat,
          children: [],
        });
      }

      for (const cat of categoryMap.values()) {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          categoryMap.get(cat.parentId)!.children!.push(cat);
        } else {
          roots.push(cat);
        }
      }

      return roots;
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const categoryMap = new Map<string, CategoryDto>();
    const roots: CategoryDto[] = [];

    for (const cat of categories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId: cat.parentId,
        hsnCode: cat.hsnCode,
        isActive: cat.isActive,
        children: [],
      });
    }

    for (const cat of categoryMap.values()) {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children!.push(cat);
      } else {
        roots.push(cat);
      }
    }

    return roots;
  }

  /**
   * Lists all categories in flat format (for admin dropdowns and management).
   */
  static async getAllCategoriesFlat(includeInactive = false): Promise<CategoryDto[]> {
    if (!isDatabaseAvailable()) {
      checkReadAvailability();
      return memoryCategories
        .filter((c) => includeInactive || c.isActive)
        .map((c) => ({ ...c }));
    }

    const categories = await prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      hsnCode: c.hsnCode,
      isActive: c.isActive,
      children: [],
    }));
  }

  /**
   * Creates a new product category.
   */
  static async createCategory(input: CreateCategoryInput): Promise<CategoryDto> {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Category name is required');
    }

    const slug = input.slug ? generateSlug(input.slug) : generateSlug(input.name);

    if (!isDatabaseAvailable()) {
      const existing = memoryCategories.find((c) => c.slug === slug);
      if (existing) {
        throw new ConflictError(`Category with slug "${slug}" already exists`);
      }

      const newCat: CategoryDto = {
        id: `cat-${Date.now()}`,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        parentId: input.parentId || null,
        hsnCode: input.hsnCode?.trim() || '7117',
        isActive: input.isActive ?? true,
        children: [],
      };
      memoryCategories.push(newCat);
      return newCat;
    }

    const existingSlug = await prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictError(`Category with slug "${slug}" already exists`);
    }

    const cat = await prisma.category.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        parentId: input.parentId || null,
        hsnCode: input.hsnCode?.trim() || '7117',
        isActive: input.isActive ?? true,
      },
    });

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parentId: cat.parentId,
      hsnCode: cat.hsnCode,
      isActive: cat.isActive,
      children: [],
    };
  }

  /**
   * Updates an existing category.
   */
  static async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
    if (!isDatabaseAvailable()) {
      const cat = memoryCategories.find((c) => c.id === id);
      if (!cat) {
        throw new NotFoundError(`Category with ID ${id} not found`);
      }
      if (input.name !== undefined) cat.name = input.name.trim();
      if (input.slug !== undefined) cat.slug = generateSlug(input.slug);
      if (input.description !== undefined) cat.description = input.description?.trim() || null;
      if (input.parentId !== undefined) cat.parentId = input.parentId;
      if (input.hsnCode !== undefined) cat.hsnCode = input.hsnCode?.trim() || null;
      if (input.isActive !== undefined) cat.isActive = Boolean(input.isActive);
      return { ...cat };
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Category with ID ${id} not found`);
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.slug !== undefined) data.slug = generateSlug(input.slug);
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.parentId !== undefined) data.parentId = input.parentId;
    if (input.hsnCode !== undefined) data.hsnCode = input.hsnCode?.trim() || null;
    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      parentId: updated.parentId,
      hsnCode: updated.hsnCode,
      isActive: updated.isActive,
      children: [],
    };
  }

  /**
   * Lists published collections for merchandising.
   */
  static async getPublishedCollections(): Promise<CollectionDto[]> {
    return this.getAllCollections(false);
  }

  /**
   * Lists collections for merchandising, optionally including drafts.
   */
  static async getAllCollections(includeUnpublished = true): Promise<CollectionDto[]> {
    if (!isDatabaseAvailable()) {
      checkReadAvailability();
      return memoryCollections
        .filter((c) => includeUnpublished || c.status === 'PUBLISHED')
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((c) => ({ ...c }));
    }

    const collections = await prisma.collection.findMany({
      where: includeUnpublished ? undefined : { status: 'PUBLISHED' },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      status: c.status,
      displayOrder: c.displayOrder,
      productCount: c._count.products,
    }));
  }

  /**
   * Creates a new merchandising collection.
   */
  static async createCollection(input: CreateCollectionInput): Promise<CollectionDto> {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Collection name is required');
    }

    const slug = input.slug ? generateSlug(input.slug) : generateSlug(input.name);

    if (!isDatabaseAvailable()) {
      const existing = memoryCollections.find((c) => c.slug === slug);
      if (existing) {
        throw new ConflictError(`Collection with slug "${slug}" already exists`);
      }

      const newCol: CollectionDto = {
        id: `col-${Date.now()}`,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        status: input.status || 'DRAFT',
        displayOrder: input.displayOrder ?? (memoryCollections.length + 1),
        productCount: 0,
      };
      memoryCollections.push(newCol);
      return newCol;
    }

    const existingSlug = await prisma.collection.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictError(`Collection with slug "${slug}" already exists`);
    }

    const created = await prisma.collection.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        status: input.status || 'DRAFT',
        displayOrder: input.displayOrder ?? 0,
      },
    });

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      description: created.description,
      coverImageUrl: created.coverImageUrl,
      status: created.status,
      displayOrder: created.displayOrder,
      productCount: 0,
    };
  }

  /**
   * Updates an existing merchandising collection.
   */
  static async updateCollection(id: string, input: UpdateCollectionInput): Promise<CollectionDto> {
    if (!isDatabaseAvailable()) {
      const col = memoryCollections.find((c) => c.id === id);
      if (!col) {
        throw new NotFoundError(`Collection with ID ${id} not found`);
      }
      if (input.name !== undefined) col.name = input.name.trim();
      if (input.description !== undefined) col.description = input.description?.trim() || null;
      if (input.coverImageUrl !== undefined) col.coverImageUrl = input.coverImageUrl?.trim() || null;
      if (input.status !== undefined) col.status = input.status;
      if (input.displayOrder !== undefined) col.displayOrder = input.displayOrder;
      return { ...col };
    }

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Collection with ID ${id} not found`);
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl?.trim() || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.displayOrder !== undefined) data.displayOrder = input.displayOrder;

    const updated = await prisma.collection.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      coverImageUrl: updated.coverImageUrl,
      status: updated.status,
      displayOrder: updated.displayOrder,
      productCount: updated._count.products,
    };
  }

  /**
   * Retrieves products in a collection with pagination.
   */
  static async getCollectionProducts(
    slug: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ collection: CollectionDto; products: PaginatedResult<ProductDto> } | null> {
    const cleanSlug = slug.trim();
    let collection: CollectionDto | undefined;

    if (!isDatabaseAvailable()) {
      checkReadAvailability();
      collection = SAMPLE_COLLECTIONS.find((c) => c.slug === cleanSlug);
    } else {
      const dbCol = await prisma.collection.findUnique({
        where: { slug: cleanSlug },
      });
      if (dbCol && dbCol.status === 'PUBLISHED') {
        collection = {
          id: dbCol.id,
          name: dbCol.name,
          slug: dbCol.slug,
          description: dbCol.description,
          coverImageUrl: dbCol.coverImageUrl,
          status: dbCol.status,
          displayOrder: dbCol.displayOrder,
        };
      }
    }

    if (!collection || collection.status !== 'PUBLISHED') {
      // Fallback: check if an active category matching this slug exists to present as a curated collection
      const allCategories = await this.getAllCategoriesFlat(true);
      const matchingCat = allCategories.find((c: CategoryDto) => c.slug === cleanSlug);
      if (matchingCat && matchingCat.isActive) {
        const catCollection: CollectionDto = {
          id: `col-${matchingCat.id}`,
          name: matchingCat.name,
          slug: matchingCat.slug,
          description: matchingCat.description || `Curated artisanal collection featuring handcrafted ${matchingCat.name}.`,
          coverImageUrl: 'https://images.unsplash.com/photo-1611591475850-53818e69234b?auto=format&fit=crop&w=1200&q=80',
          status: 'PUBLISHED',
          displayOrder: 99,
        };

        const productsResult = await this.getPublishedProducts({
          categoryId: matchingCat.id,
          page: options.page,
          limit: options.limit,
        });

        return {
          collection: catCollection,
          products: productsResult,
        };
      }

      return null;
    }

    const productsResult = await this.getPublishedProducts({
      collectionId: collection.id,
      page: options.page,
      limit: options.limit,
    });

    return {
      collection,
      products: productsResult,
    };
  }

  // ---------------------------------------------------------------------------
  // Administrative Operations (Strictly Authenticated)
  // ---------------------------------------------------------------------------

  /**
   * Creates a new product with server-authoritative price validation and inventory initialization.
   */
  static async createProduct(input: CreateProductInput): Promise<ProductDto> {
    checkDatabaseConfigured();
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Product name is required');
    }

    const pricing = PricingEngine.validatePricingPair(
      input.pricePaise,
      input.compareAtPricePaise
    );
    if (pricing.isFailure) {
      throw pricing.error;
    }

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new NotFoundError(`Category with ID ${input.categoryId} not found`);
    }

    const slug = input.slug ? generateSlug(input.slug) : generateSlug(input.name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictError(`Product with slug "${slug}" already exists`);
    }

    const created = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name: input.name.trim(),
          slug,
          description: input.description,
          sku: input.sku,
          pricePaise: pricing.value.price.paise,
          compareAtPricePaise: pricing.value.compareAtPrice?.paise ?? null,
          status: input.status || 'DRAFT',
          isFeatured: input.isFeatured ?? false,
          categoryId: input.categoryId,
        },
      });

      if (input.variants && input.variants.length > 0) {
        for (const v of input.variants) {
          const vPricing = PricingEngine.validatePricingPair(v.pricePaise, v.mrpPaise);
          if (vPricing.isFailure) throw vPricing.error;

          const variant = await tx.productVariant.create({
            data: {
              productId: prod.id,
              sku: v.sku.trim(),
              title: v.title.trim(),
              size: v.size,
              colour: v.colour,
              pricePaise: vPricing.value.price.paise,
              mrpPaise: vPricing.value.compareAtPrice?.paise ?? vPricing.value.price.paise,
            },
          });

          await tx.inventoryItem.create({
            data: {
              variantId: variant.id,
              availableQty: v.initialStock ?? 0,
            },
          });
        }
      } else {
        const defaultSku = input.sku || `NAV-${prod.id.substring(0, 8).toUpperCase()}`;
        const variant = await tx.productVariant.create({
          data: {
            productId: prod.id,
            sku: defaultSku,
            title: 'Standard',
            pricePaise: pricing.value.price.paise,
            mrpPaise: pricing.value.compareAtPrice?.paise ?? pricing.value.price.paise,
          },
        });

        await tx.inventoryItem.create({
          data: {
            variantId: variant.id,
            availableQty: input.initialStock ?? 0,
          },
        });
      }

      return prod;
    });

    const full = await this.getProductBySlug(created.slug);
    return full!;
  }

  /**
   * Updates an existing product.
   */
  static async updateProduct(id: string, input: UpdateProductInput): Promise<void> {
    checkDatabaseConfigured();
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    const data: any = {};
    if (input.name) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description;
    if (input.categoryId) data.categoryId = input.categoryId;
    if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
    if (input.status) data.status = input.status;

    if (input.pricePaise !== undefined) {
      const compare = input.compareAtPricePaise !== undefined ? input.compareAtPricePaise : existing.compareAtPricePaise;
      const pricing = PricingEngine.validatePricingPair(input.pricePaise, compare);
      if (pricing.isFailure) throw pricing.error;
      data.pricePaise = pricing.value.price.paise;
      data.compareAtPricePaise = pricing.value.compareAtPrice?.paise ?? null;
    }

    await prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Archives a product (soft retirement).
   */
  static async archiveProduct(id: string): Promise<void> {
    checkDatabaseConfigured();
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Updates inventory stock levels with boundary validation.
   */
  static async updateInventory(
    variantId: string,
    availableQty: number,
    safetyStock?: number
  ): Promise<void> {
    checkDatabaseConfigured();
    const validation = InventoryValidator.validateStockUpdate(availableQty, safetyStock);
    if (validation.isFailure) {
      throw validation.error;
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new NotFoundError(`Variant with ID ${variantId} not found`);
    }

    await prisma.inventoryItem.upsert({
      where: { variantId },
      update: {
        availableQty: validation.value.availableQty,
        safetyStock: validation.value.safetyStock,
      },
      create: {
        variantId,
        availableQty: validation.value.availableQty,
        safetyStock: validation.value.safetyStock,
      },
    });
  }
}
