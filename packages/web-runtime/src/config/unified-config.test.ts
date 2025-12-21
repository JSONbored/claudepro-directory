/**
 * Unified Config Tests
 *
 * Tests for unified configuration including Infisical feature flag:
 * - Feature flag structure
 * - Infisical feature flag value
 * - Configuration exports
 */

import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS } from './unified-config';

describe('Unified Config - Infisical Feature Flag', () => {
  describe('FEATURE_FLAGS', () => {
    it('should have infisical.enabled feature flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('infisical.enabled');
    });

    it('should have infisical.enabled set to true', () => {
      expect(FEATURE_FLAGS['infisical.enabled']).toBe(true);
    });

    it('should export all required feature flags', () => {
      expect(FEATURE_FLAGS).toHaveProperty('exit_intent.enabled');
      expect(FEATURE_FLAGS).toHaveProperty('network_status.enabled');
      expect(FEATURE_FLAGS).toHaveProperty('analytics.vercel_enabled');
      expect(FEATURE_FLAGS).toHaveProperty('infisical.enabled');
    });

    it('should have infisical.enabled as a boolean', () => {
      expect(typeof FEATURE_FLAGS['infisical.enabled']).toBe('boolean');
    });
  });
});

