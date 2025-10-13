/**
 * Authentication Request Handlers
 *
 * Mocks for authentication/authorization flows using Supabase Auth.
 * Provides realistic session management for testing authenticated features.
 *
 * **Test Coverage:**
 * - User login/logout
 * - Session validation
 * - JWT token verification
 * - Password reset flows
 * - OAuth callbacks
 *
 * @see src/lib/supabase/ directory
 */

import { http, HttpResponse, delay } from 'msw';
import { mockUsers } from '../fixtures/users';

/**
 * Mock session data structure (matches Supabase Auth)
 */
export const mockSession = {
  access_token: 'mock-access-token-12345',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token-67890',
  user: mockUsers.authenticated,
};

/**
 * Authentication handlers
 */
export const authHandlers = [
  /**
   * POST /auth/v1/token - Login
   * Supabase Auth endpoint for password login
   */
  http.post('https://*.supabase.co/auth/v1/token', async ({ request }) => {
    await delay(200);

    const body = (await request.json()) as { email: string; password: string };

    // Validate credentials (mock validation)
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json(mockSession);
    }

    return HttpResponse.json(
      {
        error: 'invalid_credentials',
        error_description: 'Invalid login credentials',
      },
      { status: 400 }
    );
  }),

  /**
   * GET /auth/v1/user - Get current user
   * Supabase Auth endpoint for fetching current user
   */
  http.get('https://*.supabase.co/auth/v1/user', async ({ request }) => {
    await delay(100);

    const authHeader = request.headers.get('authorization');

    // Validate bearer token
    if (authHeader === 'Bearer mock-access-token-12345') {
      return HttpResponse.json(mockUsers.authenticated);
    }

    return HttpResponse.json(
      {
        error: 'invalid_token',
        error_description: 'Invalid or expired token',
      },
      { status: 401 }
    );
  }),

  /**
   * POST /auth/v1/logout - Logout
   * Supabase Auth endpoint for logout
   */
  http.post('https://*.supabase.co/auth/v1/logout', async () => {
    await delay(100);

    return HttpResponse.json({ success: true });
  }),

  /**
   * POST /auth/v1/signup - Sign up
   * Supabase Auth endpoint for registration
   */
  http.post('https://*.supabase.co/auth/v1/signup', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as { email: string; password: string };

    // Mock email already exists
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        {
          error: 'user_already_exists',
          error_description: 'User already registered',
        },
        { status: 422 }
      );
    }

    // Successful registration
    return HttpResponse.json({
      ...mockSession,
      user: {
        ...mockUsers.authenticated,
        email: body.email,
        created_at: new Date().toISOString(),
      },
    });
  }),

  /**
   * POST /auth/v1/recover - Password reset
   * Supabase Auth endpoint for password recovery
   */
  http.post('https://*.supabase.co/auth/v1/recover', async ({ request }) => {
    await delay(150);

    const body = (await request.json()) as { email: string };

    return HttpResponse.json({
      success: true,
      message: `Password reset email sent to ${body.email}`,
    });
  }),
];

/**
 * Error scenario handlers
 */
export const authErrorHandlers = {
  /**
   * Expired session token
   */
  expiredToken: http.get('https://*.supabase.co/auth/v1/user', () => {
    return HttpResponse.json(
      {
        error: 'token_expired',
        error_description: 'Session expired. Please log in again.',
      },
      { status: 401 }
    );
  }),

  /**
   * Rate limited login attempts
   */
  rateLimitedLogin: http.post('https://*.supabase.co/auth/v1/token', () => {
    return HttpResponse.json(
      {
        error: 'too_many_requests',
        error_description: 'Too many login attempts. Please try again later.',
      },
      { status: 429 }
    );
  }),

  /**
   * Network error during authentication
   */
  networkError: http.post('https://*.supabase.co/auth/v1/token', () => {
    return HttpResponse.error();
  }),
};
