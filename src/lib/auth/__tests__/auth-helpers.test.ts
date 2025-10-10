/**
 * Auth Helpers Test Suite
 *
 * Tests all authentication helper functions to ensure:
 * - Correct error handling
 * - Proper null checking
 * - Type safety
 * - Consistent behavior
 */

import type { User } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  getCurrentUser,
  getCurrentUserId,
  getUserEmail,
  getUserWithClient,
  isAuth,
  isResourceOwner,
  requireAuth,
  requireAuthWithClient,
  requireResourceOwnership,
  requireUserId,
} from '../auth-helpers';

// Mock Supabase client
vi.mock('@/src/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => mockAuthResponse,
    },
  }),
}));

// Mock auth responses
let mockAuthResponse: { data: { user: User | null } };

const mockUser: User = {
  id: 'test-user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
};

describe('Auth Helpers', () => {
  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const user = await getCurrentUser();
      expect(user).toEqual(mockUser);
      expect(user?.id).toBe('test-user-123');
    });

    it('returns null when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('returns user when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const user = await requireAuth('test action');
      expect(user).toEqual(mockUser);
    });

    it('throws error when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      await expect(requireAuth('test action')).rejects.toThrow(
        'You must be signed in to test action'
      );
    });

    it('includes action name in error message', async () => {
      mockAuthResponse = { data: { user: null } };
      await expect(requireAuth('view bookmarks')).rejects.toThrow(
        'You must be signed in to view bookmarks'
      );
    });
  });

  describe('isAuth', () => {
    it('returns true when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const authenticated = await isAuth();
      expect(authenticated).toBe(true);
    });

    it('returns false when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      const authenticated = await isAuth();
      expect(authenticated).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    it('returns user ID when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const userId = await getCurrentUserId();
      expect(userId).toBe('test-user-123');
    });

    it('returns null when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      const userId = await getCurrentUserId();
      expect(userId).toBeNull();
    });
  });

  describe('requireUserId', () => {
    it('returns user ID when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const userId = await requireUserId('test action');
      expect(userId).toBe('test-user-123');
    });

    it('throws error when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      await expect(requireUserId('test action')).rejects.toThrow(
        'You must be signed in to test action'
      );
    });
  });

  describe('getUserEmail', () => {
    it('returns user email when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const email = await getUserEmail();
      expect(email).toBe('test@example.com');
    });

    it('returns null when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      const email = await getUserEmail();
      expect(email).toBeNull();
    });

    it('returns null when email not available', async () => {
      mockAuthResponse = { data: { user: { ...mockUser, email: undefined } } };
      const email = await getUserEmail();
      expect(email).toBeNull();
    });
  });

  describe('isResourceOwner', () => {
    it('returns true when user owns resource', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const isOwner = await isResourceOwner('test-user-123');
      expect(isOwner).toBe(true);
    });

    it('returns false when user does not own resource', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const isOwner = await isResourceOwner('different-user-456');
      expect(isOwner).toBe(false);
    });

    it('returns false when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      const isOwner = await isResourceOwner('test-user-123');
      expect(isOwner).toBe(false);
    });
  });

  describe('requireResourceOwnership', () => {
    it('succeeds when user owns resource', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      await expect(
        requireResourceOwnership('test-user-123', 'collection')
      ).resolves.toBeUndefined();
    });

    it('throws error when user does not own resource', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      await expect(requireResourceOwnership('different-user-456', 'collection')).rejects.toThrow(
        'You are not authorized to modify this collection'
      );
    });

    it('throws error when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      await expect(requireResourceOwnership('test-user-123', 'collection')).rejects.toThrow(
        'You must be signed in to modify this collection'
      );
    });

    it('includes resource type in error message', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      await expect(requireResourceOwnership('different-user-456', 'bookmark')).rejects.toThrow(
        'You are not authorized to modify this bookmark'
      );
    });
  });

  describe('getUserWithClient', () => {
    it('returns user and client when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const { user, supabase } = await getUserWithClient();
      expect(user).toEqual(mockUser);
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
    });

    it('returns null user and client when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      const { user, supabase } = await getUserWithClient();
      expect(user).toBeNull();
      expect(supabase).toBeDefined();
    });
  });

  describe('requireAuthWithClient', () => {
    it('returns user and client when authenticated', async () => {
      mockAuthResponse = { data: { user: mockUser } };
      const { user, supabase } = await requireAuthWithClient('test action');
      expect(user).toEqual(mockUser);
      expect(supabase).toBeDefined();
    });

    it('throws error when not authenticated', async () => {
      mockAuthResponse = { data: { user: null } };
      await expect(requireAuthWithClient('test action')).rejects.toThrow(
        'You must be signed in to test action'
      );
    });
  });
});
