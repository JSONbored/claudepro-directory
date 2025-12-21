import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  formatChangelogDate,
  formatChangelogDateShort,
  formatChangelogDateISO8601,
  getRelativeTime,
  getChangelogUrl,
  getChangelogPath,
  getNonEmptyCategories,
} from './changelog';

// Mock formatDate and formatRelativeDate
const mockFormatDate = vi.fn();
const mockFormatRelativeDate = vi.fn();

vi.mock('../data.ts', () => ({
  formatDate: (...args: any[]) => mockFormatDate(...args),
  formatRelativeDate: (...args: any[]) => mockFormatRelativeDate(...args),
}));

// Mock APP_CONFIG
vi.mock('../data/config/constants.ts', () => ({
  APP_CONFIG: {
    url: 'https://example.com',
  },
}));

describe('changelog utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatChangelogDate', () => {
    it('should call formatDate with long format', () => {
      mockFormatDate.mockReturnValue('January 15, 2024');
      const result = formatChangelogDate('2024-01-15');
      expect(mockFormatDate).toHaveBeenCalledWith('2024-01-15', 'long');
      expect(result).toBe('January 15, 2024');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15');
      mockFormatDate.mockReturnValue('January 15, 2024');
      formatChangelogDate(date);
      expect(mockFormatDate).toHaveBeenCalledWith(date, 'long');
    });
  });

  describe('formatChangelogDateShort', () => {
    it('should call formatDate with short format', () => {
      mockFormatDate.mockReturnValue('Jan 15, 2024');
      const result = formatChangelogDateShort('2024-01-15');
      expect(mockFormatDate).toHaveBeenCalledWith('2024-01-15', 'short');
      expect(result).toBe('Jan 15, 2024');
    });
  });

  describe('formatChangelogDateISO8601', () => {
    it('should call formatDate with iso format', () => {
      mockFormatDate.mockReturnValue('2024-01-15');
      const result = formatChangelogDateISO8601('2024-01-15');
      expect(mockFormatDate).toHaveBeenCalledWith('2024-01-15', 'iso');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('getRelativeTime', () => {
    it('should call formatRelativeDate with simple style', () => {
      mockFormatRelativeDate.mockReturnValue('2 days ago');
      const result = getRelativeTime('2024-01-13T00:00:00Z');
      expect(mockFormatRelativeDate).toHaveBeenCalledWith('2024-01-13T00:00:00Z', { style: 'simple' });
      expect(result).toBe('2 days ago');
    });
  });

  describe('getChangelogUrl', () => {
    it('should generate full URL for changelog entry', () => {
      const result = getChangelogUrl('my-feature');
      expect(result).toBe('https://example.com/changelog/my-feature');
    });
  });

  describe('getChangelogPath', () => {
    it('should generate relative path for changelog entry', () => {
      const result = getChangelogPath('my-feature');
      expect(result).toBe('/changelog/my-feature');
    });
  });

  describe('getNonEmptyCategories', () => {
    it('should return categories with non-empty arrays', () => {
      const changes = {
        Added: ['Feature 1', 'Feature 2'],
        Changed: [],
        Fixed: ['Bug 1'],
        Deprecated: [],
        Removed: [],
        Security: [],
      };
      const result = getNonEmptyCategories(changes);
      expect(result).toEqual(['Added', 'Fixed']);
    });

    it('should return empty array for all empty categories', () => {
      const changes = {
        Added: [],
        Changed: [],
        Fixed: [],
      };
      const result = getNonEmptyCategories(changes);
      expect(result).toEqual([]);
    });

    it('should return all categories when all have entries', () => {
      const changes = {
        Added: ['Feature 1'],
        Changed: ['Change 1'],
        Fixed: ['Bug 1'],
        Deprecated: ['Deprecated 1'],
        Removed: ['Removed 1'],
        Security: ['Security 1'],
      };
      const result = getNonEmptyCategories(changes);
      expect(result).toEqual(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);
    });

    it('should handle null/undefined categories', () => {
      expect(getNonEmptyCategories(null)).toEqual([]);
      expect(getNonEmptyCategories(undefined)).toEqual([]);
    });

    it('should handle categories with non-array values', () => {
      const changes = {
        Added: 'not-an-array',
        Changed: [],
      };
      const result = getNonEmptyCategories(changes);
      expect(result).toEqual([]);
    });
  });
});

