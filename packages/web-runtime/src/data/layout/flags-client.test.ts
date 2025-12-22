import { describe, expect, it } from '@jest/globals';
import { getLayoutFlags } from './flags-client';

describe('layout flags client', () => {
  describe('getLayoutFlags', () => {
    it('should return default flags', () => {
      const flags = getLayoutFlags();
      
      expect(flags).toHaveProperty('ctaVariant', 'value_focused');
      expect(flags).toHaveProperty('fabNotifications', false);
      expect(flags).toHaveProperty('footerDelayVariant', '30s');
    });

    it('should compute derived flags correctly', () => {
      const flags = getLayoutFlags();
      
      expect(flags).toHaveProperty('fabNotificationsEnabled');
      expect(flags).toHaveProperty('notificationsEnabled');
      expect(flags).toHaveProperty('notificationsSheetEnabled');
      expect(flags).toHaveProperty('notificationsToastsEnabled');
    });
  });
});

