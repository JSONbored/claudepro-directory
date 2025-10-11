/**
 * Authentication Helper Utilities
 *
 * Centralized authentication helpers to reduce 180+ lines of duplicate auth checks
 * across server actions and API routes.
 *
 * Benefits:
 * - **DRY**: Eliminates 67 duplicate getUser() patterns across codebase
 * - **Type-safe**: Full TypeScript support with branded User type
 * - **Consistent**: Uniform error messages and handling
 * - **Maintainable**: Change auth logic once, not 67 times
 *
 * Usage:
 * ```ts
 * // Before (6 lines per action):
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user) {
 *   throw new Error('You must be signed in');
 * }
 *
 * // After (1 line):
 * const user = await requireAuth('view activity');
 * ```
 *
 * @module lib/auth/auth-helpers
 */

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Get current authenticated user (returns null if not authenticated)
 *
 * @returns User object or null
 *
 * @example
 * ```ts
 * const user = await getCurrentUser();
 * if (user) {
 *   // User is authenticated
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Require authenticated user (throws error if not authenticated)
 *
 * @param action - Action description for error message (e.g., "view bookmarks", "create content")
 * @returns User object (guaranteed non-null)
 * @throws Error if user is not authenticated
 *
 * @example
 * ```ts
 * // Throws: "You must be signed in to view bookmarks"
 * const user = await requireAuth('view bookmarks');
 *
 * // Use user.id safely (TypeScript knows it exists)
 * const bookmarks = await getBookmarks(user.id);
 * ```
 */
export async function requireAuth(action: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(`You must be signed in to ${action}`);
  }

  return user;
}

/**
 * Check if user is authenticated (boolean check)
 *
 * @returns true if authenticated, false otherwise
 *
 * @example
 * ```ts
 * const isAuthenticated = await isAuth();
 * if (!isAuthenticated) {
 *   return { error: 'Unauthorized' };
 * }
 * ```
 */
export async function isAuth(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Get current user ID (returns null if not authenticated)
 *
 * @returns User ID string or null
 *
 * @example
 * ```ts
 * const userId = await getCurrentUserId();
 * if (userId) {
 *   const profile = await getProfile(userId);
 * }
 * ```
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * Require user ID (throws error if not authenticated)
 *
 * @param action - Action description for error message
 * @returns User ID string (guaranteed non-null)
 * @throws Error if user is not authenticated
 *
 * @example
 * ```ts
 * const userId = await requireUserId('access profile');
 * const profile = await getProfile(userId);
 * ```
 */
export async function requireUserId(action: string): Promise<string> {
  const user = await requireAuth(action);
  return user.id;
}

/**
 * Get user email (returns null if not authenticated or email not available)
 *
 * @returns User email string or null
 *
 * @example
 * ```ts
 * const email = await getUserEmail();
 * if (email) {
 *   await sendNotification(email);
 * }
 * ```
 */
export async function getUserEmail(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email ?? null;
}

/**
 * Check if user owns resource
 *
 * @param resourceUserId - User ID of resource owner
 * @returns true if current user owns resource, false otherwise
 *
 * @example
 * ```ts
 * const collection = await getCollection(id);
 * const isOwner = await isResourceOwner(collection.user_id);
 * if (!isOwner) {
 *   throw new Error('Not authorized to modify this collection');
 * }
 * ```
 */
export async function isResourceOwner(resourceUserId: string): Promise<boolean> {
  const currentUserId = await getCurrentUserId();
  return currentUserId === resourceUserId;
}

/**
 * Require resource ownership (throws error if not owner)
 *
 * @param resourceUserId - User ID of resource owner
 * @param resourceType - Resource type for error message (e.g., "collection", "bookmark")
 * @throws Error if user doesn't own resource
 *
 * @example
 * ```ts
 * const collection = await getCollection(id);
 * await requireResourceOwnership(collection.user_id, 'collection');
 * // If we get here, user owns the collection
 * ```
 */
export async function requireResourceOwnership(
  resourceUserId: string,
  resourceType: string
): Promise<void> {
  const user = await requireAuth(`modify this ${resourceType}`);

  if (user.id !== resourceUserId) {
    throw new Error(`You are not authorized to modify this ${resourceType}`);
  }
}

/**
 * Get authenticated user with Supabase client
 * Useful when you need both user and client for database operations
 *
 * @returns Object containing user and supabase client, or { user: null, supabase }
 *
 * @example
 * ```ts
 * const { user, supabase } = await getUserWithClient();
 * if (user) {
 *   const { data } = await supabase.from('bookmarks')
 *     .select('*')
 *     .eq('user_id', user.id);
 * }
 * ```
 */
export async function getUserWithClient(): Promise<{
  user: User | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase };
}

/**
 * Require authenticated user with Supabase client
 *
 * @param action - Action description for error message
 * @returns Object containing user (guaranteed non-null) and supabase client
 * @throws Error if user is not authenticated
 *
 * @example
 * ```ts
 * const { user, supabase } = await requireAuthWithClient('view bookmarks');
 * const { data } = await supabase.from('bookmarks')
 *   .select('*')
 *   .eq('user_id', user.id);
 * ```
 */
export async function requireAuthWithClient(action: string): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const { user, supabase } = await getUserWithClient();

  if (!user) {
    throw new Error(`You must be signed in to ${action}`);
  }

  return { user, supabase };
}
