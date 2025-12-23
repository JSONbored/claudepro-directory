import { describe, expect, it } from '@jest/globals';
import { getLayoutFlags, type LayoutFlags } from './flags-client';

describe('layout flags client', () => {
  describe('getLayoutFlags', () => {
    it('should return all default flags with correct values', () => {
      const flags = getLayoutFlags();

      // Verify all flags are present
      expect(flags).toHaveProperty('ctaVariant', 'value_focused');
      expect(flags).toHaveProperty('fabNotifications', false);
      expect(flags).toHaveProperty('fabNotificationsEnabled', false);
      expect(flags).toHaveProperty('footerDelayVariant', '30s');
      expect(flags).toHaveProperty('notificationsEnabled', false);
      expect(flags).toHaveProperty('notificationsProvider', false);
      expect(flags).toHaveProperty('notificationsSheet', false);
      expect(flags).toHaveProperty('notificationsSheetEnabled', false);
      expect(flags).toHaveProperty('notificationsToasts', false);
      expect(flags).toHaveProperty('notificationsToastsEnabled', false);
    });

    it('should compute derived flags correctly based on default values', () => {
      const flags = getLayoutFlags();

      // Derived flags computation:
      // notificationsEnabled = DEFAULT_FLAGS.notificationsProvider (false)
      // notificationsSheetEnabled = DEFAULT_FLAGS.notificationsSheet (false)
      // notificationsToastsEnabled = DEFAULT_FLAGS.notificationsToasts (false)
      // fabNotificationsEnabled = Boolean(DEFAULT_FLAGS.fabNotifications && notificationsEnabled)
      //   = Boolean(false && false) = false

      expect(flags.notificationsEnabled).toBe(false); // Derived from notificationsProvider
      expect(flags.notificationsSheetEnabled).toBe(false); // Derived from notificationsSheet
      expect(flags.notificationsToastsEnabled).toBe(false); // Derived from notificationsToasts
      expect(flags.fabNotificationsEnabled).toBe(false); // Derived from fabNotifications && notificationsEnabled
    });

    it('should return flags matching LayoutFlags type', () => {
      const flags = getLayoutFlags();

      // Type check: verify all required properties exist
      const requiredProps: (keyof LayoutFlags)[] = [
        'ctaVariant',
        'fabNotifications',
        'fabNotificationsEnabled',
        'footerDelayVariant',
        'notificationsEnabled',
        'notificationsProvider',
        'notificationsSheet',
        'notificationsSheetEnabled',
        'notificationsToasts',
        'notificationsToastsEnabled',
      ];

      for (const prop of requiredProps) {
        expect(flags).toHaveProperty(prop);
      }
    });

    it('should return consistent results on multiple calls', () => {
      const flags1 = getLayoutFlags();
      const flags2 = getLayoutFlags();

      expect(flags1).toEqual(flags2);
    });

    it('should compute fabNotificationsEnabled correctly (requires both fabNotifications and notificationsEnabled)', () => {
      const flags = getLayoutFlags();

      // fabNotificationsEnabled = Boolean(fabNotifications && notificationsEnabled)
      // With default values: Boolean(false && false) = false
      expect(flags.fabNotificationsEnabled).toBe(false);
      expect(flags.fabNotifications).toBe(false);
      expect(flags.notificationsEnabled).toBe(false);
    });
  });
});
