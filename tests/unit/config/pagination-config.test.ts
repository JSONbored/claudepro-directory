import { describe, expect, it } from 'vitest';
import { UI_CONFIG } from '@/src/lib/constants';
import { cursorPaginationQuerySchema } from '@/src/lib/schemas/primitives/cursor-pagination.schema';

describe('Pagination config alignment', () => {
  it('cursorPaginationQuerySchema defaults to UI_CONFIG.pagination.defaultLimit', () => {
    const parsed = cursorPaginationQuerySchema.parse({});
    expect(parsed.limit).toBe(UI_CONFIG.pagination.defaultLimit);
  });

  it('cursorPaginationQuerySchema enforces UI_CONFIG.pagination.maxLimit', () => {
    const over = UI_CONFIG.pagination.maxLimit + 100;
    const parsed = cursorPaginationQuerySchema.parse({ limit: over });
    // The schema by itself validates max; routes clamp. Ensure config sanity and schema cap.
    expect(UI_CONFIG.pagination.maxLimit).toBeGreaterThanOrEqual(UI_CONFIG.pagination.defaultLimit);
    expect(parsed.limit).toBeLessThanOrEqual(UI_CONFIG.pagination.maxLimit);
  });
});
