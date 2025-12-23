import { describe, expect, it } from '@jest/globals';
import {
  isValidContentCategory,
  isValidJobType,
  isValidExperienceLevel,
  isValidJobCategory,
} from './type-guards';
import {
  content_category,
  job_type,
  experience_level,
  job_category,
} from '@prisma/client';

describe('type-guards', () => {
  describe('isValidContentCategory', () => {
    it('should return true for valid content categories', () => {
      expect(isValidContentCategory('agents')).toBe(true);
      expect(isValidContentCategory('mcp')).toBe(true);
      expect(isValidContentCategory('rules')).toBe(true);
    });

    it('should return false for invalid content categories', () => {
      expect(isValidContentCategory('invalid')).toBe(false);
      expect(isValidContentCategory('')).toBe(false);
      expect(isValidContentCategory('AGENTS')).toBe(false); // Case sensitive
    });

    it('should work as type guard', () => {
      const value: string = 'agents';
      if (isValidContentCategory(value)) {
        const category: content_category = value; // TypeScript should accept this
        expect(category).toBe('agents');
      }
    });
  });

  describe('isValidJobType', () => {
    it('should return true for valid job types', () => {
      expect(isValidJobType('full-time')).toBe(true);
      expect(isValidJobType('part-time')).toBe(true);
      expect(isValidJobType('contract')).toBe(true);
    });

    it('should return false for invalid job types', () => {
      expect(isValidJobType('invalid')).toBe(false);
      expect(isValidJobType('fulltime')).toBe(false);
    });

    it('should work as type guard', () => {
      const value: string = 'full-time';
      if (isValidJobType(value)) {
        const jobType: job_type = value;
        expect(jobType).toBe('full-time');
      }
    });
  });

  describe('isValidExperienceLevel', () => {
    it('should return true for valid experience levels', () => {
      expect(isValidExperienceLevel('beginner')).toBe(true);
      expect(isValidExperienceLevel('intermediate')).toBe(true);
      expect(isValidExperienceLevel('advanced')).toBe(true);
    });

    it('should return false for invalid experience levels', () => {
      expect(isValidExperienceLevel('invalid')).toBe(false);
      expect(isValidExperienceLevel('entry')).toBe(false);
      expect(isValidExperienceLevel('mid')).toBe(false);
      expect(isValidExperienceLevel('senior')).toBe(false);
    });

    it('should work as type guard', () => {
      const value: string = 'advanced';
      if (isValidExperienceLevel(value)) {
        const level: experience_level = value;
        expect(level).toBe('advanced');
      }
    });
  });

  describe('isValidJobCategory', () => {
    it('should return true for valid job categories', () => {
      expect(isValidJobCategory('engineering')).toBe(true);
      expect(isValidJobCategory('design')).toBe(true);
      expect(isValidJobCategory('product')).toBe(true);
    });

    it('should return false for invalid job categories', () => {
      expect(isValidJobCategory('invalid')).toBe(false);
      expect(isValidJobCategory('')).toBe(false);
    });

    it('should work as type guard', () => {
      const value: string = 'engineering';
      if (isValidJobCategory(value)) {
        const category: job_category = value;
        expect(category).toBe('engineering');
      }
    });
  });
});

