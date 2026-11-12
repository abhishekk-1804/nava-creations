import { PaginatedResult } from './types.js';

export function normalizePagination(
  rawPage?: unknown,
  rawLimit?: unknown,
  defaultLimit = 12,
  maxLimit = 50
): { page: number; limit: number; offset: number } {
  let page = 1;
  if (typeof rawPage === 'number' && Number.isInteger(rawPage) && rawPage > 0) {
    page = rawPage;
  } else if (typeof rawPage === 'string') {
    const parsed = parseInt(rawPage, 10);
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed;
    }
  }

  let limit = defaultLimit;
  if (typeof rawLimit === 'number' && Number.isInteger(rawLimit) && rawLimit > 0) {
    limit = Math.min(rawLimit, maxLimit);
  } else if (typeof rawLimit === 'string') {
    const parsed = parseInt(rawLimit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, maxLimit);
    }
  }

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
