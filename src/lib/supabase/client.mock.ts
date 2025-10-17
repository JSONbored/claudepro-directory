/**
 * Supabase Client - Storybook Mock Implementation
 *
 * This file provides a no-op mock implementation of the Supabase client
 * for Storybook component isolation. Real implementation uses @supabase/ssr.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real client.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/supabase/client.ts for production implementation
 */

/**
 * Mock Supabase client factory
 * Returns a mock client with no-op auth methods
 */
export function createClient() {
  return {
    auth: {
      signInWithOAuth: async (_options: any) => {
        return { data: null, error: null };
      },
      signOut: async () => {
        return { error: null };
      },
      getUser: async () => {
        return { data: { user: null }, error: null };
      },
      getSession: async () => {
        return { data: { session: null }, error: null };
      },
    },
  };
}
