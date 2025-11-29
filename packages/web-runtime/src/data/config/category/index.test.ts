import { describe, expect, it } from 'vitest';
import { CATEGORY_CONFIGS } from './index.ts';

describe('category index', () => {
  it('should export CATEGORY_CONFIGS', () => {
    expect(CATEGORY_CONFIGS).toBeDefined();
    expect(typeof CATEGORY_CONFIGS).toBe('object');
  });

  it('should have at least one category config', () => {
    const keys = Object.keys(CATEGORY_CONFIGS);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should export configs with proper structure', () => {
    const keys = Object.keys(CATEGORY_CONFIGS);
    
    for (const key of keys) {
      const config = CATEGORY_CONFIGS[key as keyof typeof CATEGORY_CONFIGS];
      expect(config).toBeDefined();
      expect(config.id).toBe(key);
    }
  });
});