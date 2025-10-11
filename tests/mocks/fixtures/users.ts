/**
 * Mock User Fixtures
 *
 * Test data for authentication and user-related features.
 * Provides consistent user objects matching Supabase Auth structure.
 *
 * **Usage:**
 * ```ts
 * import { mockUsers } from '@/tests/mocks/fixtures/users';
 *
 * test('should display user profile', () => {
 *   render(<UserProfile user={mockUsers.authenticated} />);
 *   expect(screen.getByText(mockUsers.authenticated.email)).toBeInTheDocument();
 * });
 * ```
 */

/**
 * Mock user data (matches Supabase Auth User type)
 */
export const mockUsers = {
  /**
   * Authenticated user with complete profile
   */
  authenticated: {
    id: 'user-123-authenticated',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    phone: null,
    confirmed_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
      username: 'testuser',
    },
    identities: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },

  /**
   * GitHub OAuth user
   */
  githubUser: {
    id: 'user-456-github',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'github@example.com',
    email_confirmed_at: '2024-01-15T00:00:00Z',
    phone: null,
    confirmed_at: '2024-01-15T00:00:00Z',
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'github',
      providers: ['github'],
    },
    user_metadata: {
      full_name: 'GitHub User',
      avatar_url: 'https://avatars.githubusercontent.com/u/789012?v=4',
      username: 'githubuser',
      preferred_username: 'githubuser',
      provider_id: '789012',
    },
    identities: [
      {
        id: 'github-identity-789012',
        user_id: 'user-456-github',
        identity_data: {
          email: 'github@example.com',
          name: 'GitHub User',
          avatar_url: 'https://avatars.githubusercontent.com/u/789012?v=4',
        },
        provider: 'github',
        last_sign_in_at: new Date().toISOString(),
        created_at: '2024-01-15T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString(),
  },

  /**
   * Unauthenticated/anonymous user
   */
  anonymous: null,

  /**
   * New user (just registered)
   */
  newUser: {
    id: 'user-789-new',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'newuser@example.com',
    email_confirmed_at: null,
    phone: null,
    confirmed_at: null,
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  /**
   * Admin user (for authorization testing)
   */
  admin: {
    id: 'user-admin-001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'admin@example.com',
    email_confirmed_at: '2023-12-01T00:00:00Z',
    phone: null,
    confirmed_at: '2023-12-01T00:00:00Z',
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email'],
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users'],
    },
    user_metadata: {
      full_name: 'Admin User',
      avatar_url: 'https://avatars.githubusercontent.com/u/999999?v=4',
      username: 'admin',
    },
    identities: [],
    created_at: '2023-12-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
};

/**
 * Helper: Create custom mock user
 */
export function createMockUser(overrides: Partial<typeof mockUsers.authenticated>) {
  return {
    id: `user-${Math.random().toString(36).substring(7)}`,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'custom@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
