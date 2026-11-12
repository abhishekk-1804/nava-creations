export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CollectionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ProductImageDto {
  id: string;
  url: string;
  altText: string | null;
  publicId?: string | null;
  width?: number | null;
  height?: number | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  title: string;
  size: string | null;
  colour: string | null;
  pricePaise: number;
  mrpPaise: number;
  weightGrams: number | null;
  isActive: boolean;
  availableStock?: number;
}

export interface CategorySummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface CollectionSummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  pricePaise: number;
  compareAtPricePaise: number | null;
  status: ProductStatus;
  isFeatured: boolean;
  isAvailable: boolean;
  categoryId: string;
  category?: CategorySummaryDto;
  images?: ProductImageDto[];
  variants?: ProductVariantDto[];
  collections?: CollectionSummaryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  hsnCode?: string | null;
  isActive: boolean;
  children?: CategoryDto[];
}

export interface CollectionDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  status: CollectionStatus;
  displayOrder: number;
  productCount?: number;
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  categoryId?: string;
  collectionId?: string;
  isFeatured?: boolean;
  status?: ProductStatus;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
