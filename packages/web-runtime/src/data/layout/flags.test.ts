import { describe, expect, it } from 'vitest';
import { getLayoutFlags } from './flags';

describe('layout flags', () => {
  describe('getLayoutFlags', () => {
    it('should return default flags', () => {
      const flags = getLayoutFlags();
      
      expect(flags).toHaveProperty('ctaVariant', 'value_focused');
      expect(flags).toHaveProperty('fabNotifications', false);
      expect(flags).toHaveProperty('footerDelayVariant', '30s');
      expect(flags).toHaveProperty('notificationsEnabled', false);
    });

    it('should compute derived flags correctly', () => {
      const flags = getLayoutFlags();
      
      // Derived flags should be computed
      expect(flags).toHaveProperty('fabNotificationsEnabled');
      expect(flags).toHaveProperty('notificationsEnabled');
      expect(flags).toHaveProperty('notificationsSheetEnabled');
      expect(flags).toHaveProperty('notificationsToastsEnabled');
    });

    it('should return all required flag properties', () => {
      const flags = getLayoutFlags();
      
      expect(flags).toHaveProperty('ctaVariant');
      expect(flags).toHaveProperty('fabNotifications');
      expect(flags).toHaveProperty('fabNotificationsEnabled');
      expect(flags).toHaveProperty('footerDelayVariant');
      expect(flags).toHaveProperty('notificationsEnabled');
      expect(flags).toHaveProperty('notificationsProvider');
      expect(flags).toHaveProperty('notificationsSheet');
      expect(flags).toHaveProperty('notificationsSheetEnabled');
      expect(flags).toHaveProperty('notificationsToasts');
      expect(flags).toHaveProperty('notificationsToastsEnabled');
    });
  });
});

