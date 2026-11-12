import { describe, it, expect } from 'vitest';
import { normalizePagination, buildPaginatedResult } from '../src/catalog/pagination.js';

describe('Catalog Pagination Helpers', () => {
  it('normalizes valid numeric inputs', () => {
    const { page, limit, offset } = normalizePagination(2, 10);
    expect(page).toBe(2);
    expect(limit).toBe(10);
    expect(offset).toBe(10);
  });

  it('normalizes string inputs from query parameters', () => {
    const { page, limit, offset } = normalizePagination('3', '15');
    expect(page).toBe(3);
    expect(limit).toBe(15);
    expect(offset).toBe(30);
  });

  it('falls back to default limit and page 1 on invalid inputs', () => {
    const { page, limit, offset } = normalizePagination(-1, 'invalid');
    expect(page).toBe(1);
    expect(limit).toBe(12);
    expect(offset).toBe(0);
  });

  it('clamps limit to maxLimit', () => {
    const { limit } = normalizePagination(1, 100, 12, 50);
    expect(limit).toBe(50);
  });

  it('builds paginated result structure with navigation flags', () => {
    const items = ['item1', 'item2', 'item3'];
    const result = buildPaginatedResult(items, 25, 2, 10);

    expect(result.items).toEqual(items);
    expect(result.total).toBe(25);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPrevPage).toBe(true);
  });

  it('correctly handles boundary edges on first and last page', () => {
    const firstPage = buildPaginatedResult(['item1'], 5, 1, 5);
    expect(firstPage.hasPrevPage).toBe(false);
    expect(firstPage.hasNextPage).toBe(false);

    const empty = buildPaginatedResult([], 0, 1, 10);
    expect(empty.totalPages).toBe(1);
    expect(empty.hasNextPage).toBe(false);
    expect(empty.hasPrevPage).toBe(false);
  });
});
