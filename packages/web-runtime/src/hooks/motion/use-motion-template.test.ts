import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMotionTemplate } from './use-motion-template';

// Mock motion/react
const mockUseMotionTemplate = vi.fn((strings: TemplateStringsArray, ...values: any[]) => ({
  get: () => '',
}));

vi.mock('motion/react', () => ({
  useMotionTemplate: mockUseMotionTemplate,
}));

describe('useMotionTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a re-export of motion/react useMotionTemplate', () => {
    // Note: This is a tagged template function, so we can't easily test it directly
    // We can verify it's exported correctly
    expect(typeof useMotionTemplate).toBe('function');
  });

  it('should be the same function as motion/react useMotionTemplate', () => {
    // Since it's a direct re-export, they should be the same reference
    const { useMotionTemplate: original } = require('motion/react');
    expect(useMotionTemplate).toBe(original);
  });
});
