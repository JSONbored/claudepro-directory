import { describe, expect, it } from 'vitest';
import { getItemPublishedDate, isNewSince, getTrendingSlugs } from './content-highlights';
import type { DisplayableContent } from '../types/component.types';

describe('content-highlights', () => {
  describe('getItemPublishedDate', () => {
    it('should return date_added if available', () => {
      const item: DisplayableContent = {
        slug: 'test',
        date_added: new Date('2024-01-01'),
      } as DisplayableContent;
      const result = getItemPublishedDate(item);
      expect(result).toEqual(new Date('2024-01-01'));
    });

    it('should return published_at if date_added not available', () => {
      const item: DisplayableContent = {
        slug: 'test',
        published_at: new Date('2024-01-02'),
      } as DisplayableContent;
      const result = getItemPublishedDate(item);
      expect(result).toEqual(new Date('2024-01-02'));
    });

    it('should return created_at if date_added and published_at not available', () => {
      const item: DisplayableContent = {
        slug: 'test',
        created_at: new Date('2024-01-03'),
      } as DisplayableContent;
      const result = getItemPublishedDate(item);
      expect(result).toEqual(new Date('2024-01-03'));
    });

    it('should return updated_at if other dates not available', () => {
      const item: DisplayableContent = {
        slug: 'test',
        updated_at: new Date('2024-01-04'),
      } as DisplayableContent;
      const result = getItemPublishedDate(item);
      expect(result).toEqual(new Date('2024-01-04'));
    });

    it('should parse ISO string dates', () => {
      const item: DisplayableContent = {
        slug: 'test',
        date_added: '2024-01-01T00:00:00Z',
      } as DisplayableContent;
      const result = getItemPublishedDate(item);
      expect(result).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('should return null if no valid date found', () => {
      const item: DisplayableContent = {
        slug: 'test',
      } as DisplayableContent;
      const result = getItemPublishedDate(item);
      expect(result).toBeNull();
    });

    it('should return null for invalid date strings', () => {
      const item: DisplayableContent = {
        slug: 'test',
        date_added: 'invalid-date',
      } as DisplayableContent;
      const result = getItemPublishedDate(item);
      expect(result).toBeNull();
    });
  });

  describe('isNewSince', () => {
    it('should return true if item is published on or after cutoff', () => {
      const cutoff = new Date('2024-01-01');
      const item: DisplayableContent = {
        slug: 'test',
        date_added: new Date('2024-01-02'),
      } as DisplayableContent;
      expect(isNewSince(item, cutoff)).toBe(true);
    });

    it('should return true if item is published exactly on cutoff', () => {
      const cutoff = new Date('2024-01-01');
      const item: DisplayableContent = {
        slug: 'test',
        date_added: new Date('2024-01-01'),
      } as DisplayableContent;
      expect(isNewSince(item, cutoff)).toBe(true);
    });

    it('should return false if item is published before cutoff', () => {
      const cutoff = new Date('2024-01-02');
      const item: DisplayableContent = {
        slug: 'test',
        date_added: new Date('2024-01-01'),
      } as DisplayableContent;
      expect(isNewSince(item, cutoff)).toBe(false);
    });

    it('should return false if cutoff is null', () => {
      const item: DisplayableContent = {
        slug: 'test',
        date_added: new Date('2024-01-01'),
      } as DisplayableContent;
      expect(isNewSince(item, null)).toBe(false);
    });

    it('should return false if item has no published date', () => {
      const cutoff = new Date('2024-01-01');
      const item: DisplayableContent = {
        slug: 'test',
      } as DisplayableContent;
      expect(isNewSince(item, cutoff)).toBe(false);
    });
  });

  describe('getTrendingSlugs', () => {
    it('should return top N slugs from items', () => {
      const items: DisplayableContent[] = [
        { slug: 'item-1' } as DisplayableContent,
        { slug: 'item-2' } as DisplayableContent,
        { slug: 'item-3' } as DisplayableContent,
        { slug: 'item-4' } as DisplayableContent,
      ];
      const result = getTrendingSlugs(items, 3);
      expect(result.size).toBe(3);
      expect(result.has('item-1')).toBe(true);
      expect(result.has('item-2')).toBe(true);
      expect(result.has('item-3')).toBe(true);
      expect(result.has('item-4')).toBe(false);
    });

    it('should use default topN of 3', () => {
      const items: DisplayableContent[] = [
        { slug: 'item-1' } as DisplayableContent,
        { slug: 'item-2' } as DisplayableContent,
        { slug: 'item-3' } as DisplayableContent,
        { slug: 'item-4' } as DisplayableContent,
      ];
      const result = getTrendingSlugs(items);
      expect(result.size).toBe(3);
    });

    it('should filter out items without slugs', () => {
      const items: DisplayableContent[] = [
        { slug: 'item-1' } as DisplayableContent,
        { slug: null } as DisplayableContent,
        { slug: 'item-3' } as DisplayableContent,
      ];
      const result = getTrendingSlugs(items, 3);
      expect(result.size).toBe(2);
      expect(result.has('item-1')).toBe(true);
      expect(result.has('item-3')).toBe(true);
    });

    it('should return empty set for empty array', () => {
      const result = getTrendingSlugs([], 3);
      expect(result.size).toBe(0);
    });

    it('should return empty set for null/undefined items', () => {
      expect(getTrendingSlugs(null as any, 3).size).toBe(0);
      expect(getTrendingSlugs(undefined as any, 3).size).toBe(0);
    });

    it('should return empty set for topN <= 0', () => {
      const items: DisplayableContent[] = [
        { slug: 'item-1' } as DisplayableContent,
      ];
      expect(getTrendingSlugs(items, 0).size).toBe(0);
      expect(getTrendingSlugs(items, -1).size).toBe(0);
    });
  });
});

