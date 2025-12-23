/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useMotionTemplate } from './use-motion-template';

// Mock motion/react
jest.mock('motion/react', () => {
  const mockUseMotionTemplate = jest.fn((strings: TemplateStringsArray, ...values: any[]) => ({
    get: () => '',
  }));
  return {
    useMotionTemplate: mockUseMotionTemplate,
    __mockUseMotionTemplate: mockUseMotionTemplate,
  };
});

describe('useMotionTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be a re-export of motion/react useMotionTemplate', () => {
    // Note: This is a tagged template function, so we can't easily test it directly
    // We can verify it's exported correctly
    expect(typeof useMotionTemplate).toBe('function');
  });

  it('should be the same function as motion/react useMotionTemplate', () => {
    // Since it's a direct re-export, they should be the same reference
    const { useMotionTemplate: original } = jest.requireMock('motion/react');
    expect(useMotionTemplate).toBe(original);
  });
});
