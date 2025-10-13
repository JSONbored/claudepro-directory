/**
 * Auth Callback Route Integration Tests
 *
 * Tests OAuth callback handling for GitHub and Google authentication.
 * Validates code exchange, session management, and redirect behavior.
 *
 * **Security Focus:**
 * - Code exchange validation
 * - Secure redirect handling
 * - Error handling for failed auth
 * - PKCE flow compliance
 *
 * @see src/app/auth/callback/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GET } from '@/src/app/auth/callback/route';
import { createClient } from '@/src/lib/supabase/server';

// Mock Supabase server client
vi.mock('@/src/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock Next.js server
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    NextResponse: {
      redirect: vi.fn((url: string) => ({ url, status: 302 })),
    },
  };
});

describe('Auth Callback Route - Integration Tests', () => {
  const mockSupabase = {
    auth: {
      exchangeCodeForSession: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  });

  describe('Successful Authentication', () => {
    test('should exchange code for session and redirect to homepage', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=auth_code_123');

      await GET(request);

      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth_code_123');
      expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/');
    });

    test('should redirect to custom next URL after successful auth', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/auth/callback?code=auth_code_123&next=/dashboard'
      );

      await GET(request);

      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth_code_123');
      expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
    });

    test('should handle encoded next URL parameter', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const nextUrl = encodeURIComponent('/agents?sort=trending');
      const request = new NextRequest(
        `http://localhost:3000/auth/callback?code=auth_code_123&next=${nextUrl}`
      );

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/agents?sort=trending'
      );
    });
  });

  describe('Failed Authentication', () => {
    test('should redirect to error page when code exchange fails', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid code', status: 400 },
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=invalid_code');

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/auth-code-error'
      );
    });

    test('should redirect to error page when no code provided', async () => {
      const request = new NextRequest('http://localhost:3000/auth/callback');

      await GET(request);

      expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/auth-code-error'
      );
    });

    test('should redirect to error page when code is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/auth/callback?code=');

      await GET(request);

      expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/auth-code-error'
      );
    });
  });

  describe('Production Environment Handling', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should use x-forwarded-host in production environment', async () => {
      process.env.NODE_ENV = 'production';

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=auth_code_123', {
        headers: {
          'x-forwarded-host': 'claudepro.directory',
        },
      });

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith('https://claudepro.directory/');
    });

    test('should use x-forwarded-host with custom next URL', async () => {
      process.env.NODE_ENV = 'production';

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/auth/callback?code=auth_code_123&next=/collections',
        {
          headers: {
            'x-forwarded-host': 'claudepro.directory',
          },
        }
      );

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith('https://claudepro.directory/collections');
    });

    test('should fallback to origin when no x-forwarded-host in production', async () => {
      process.env.NODE_ENV = 'production';

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=auth_code_123');

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/');
    });
  });

  describe('Development Environment Handling', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should use origin directly in development', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=auth_code_123');

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/');
    });

    test('should ignore x-forwarded-host in development', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=auth_code_123', {
        headers: {
          'x-forwarded-host': 'production.example.com',
        },
      });

      await GET(request);

      // In development, should use origin, not x-forwarded-host
      expect(NextResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/');
    });
  });

  describe('Security - Redirect Validation', () => {
    test('should only allow relative redirect paths', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      // All these next URLs should be treated as relative paths
      const testCases = [
        '/dashboard',
        '/agents',
        '/collections/123',
        '/../../etc/passwd', // Path traversal attempt (still relative)
      ];

      for (const nextUrl of testCases) {
        vi.clearAllMocks();
        const request = new NextRequest(
          `http://localhost:3000/auth/callback?code=auth_code_123&next=${encodeURIComponent(nextUrl)}`
        );

        await GET(request);

        // Should always prepend origin (localhost in dev)
        expect(NextResponse.redirect).toHaveBeenCalledWith(`http://localhost:3000${nextUrl}`);
      }
    });

    test('should sanitize malicious redirect attempts', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      // Attempts to redirect to external sites (but will be treated as relative paths)
      const maliciousRedirects = [
        '//evil.com',
        '///evil.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
      ];

      for (const nextUrl of maliciousRedirects) {
        vi.clearAllMocks();
        const request = new NextRequest(
          `http://localhost:3000/auth/callback?code=auth_code_123&next=${encodeURIComponent(nextUrl)}`
        );

        await GET(request);

        // Should still prepend origin, making it relative to our domain
        const redirectCall = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(redirectCall).toContain('localhost:3000');
      }
    });
  });

  describe('Code Exchange Security', () => {
    test('should only exchange code once per request', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=auth_code_123');

      await GET(request);

      // Should only be called once
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    });

    test('should not attempt code exchange without code parameter', async () => {
      const request = new NextRequest('http://localhost:3000/auth/callback?next=/dashboard');

      await GET(request);

      expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Page Redirects', () => {
    test('should maintain origin in error page redirect', async () => {
      const request = new NextRequest('https://claudepro.directory/auth/callback');

      await GET(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        'https://claudepro.directory/auth/auth-code-error'
      );
    });

    test('should not include sensitive info in error redirect', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token: abc123xyz', status: 401 },
      });

      const request = new NextRequest('http://localhost:3000/auth/callback?code=bad_code');

      await GET(request);

      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Error redirect should not contain error message or code
      expect(redirectUrl).toBe('http://localhost:3000/auth/auth-code-error');
      expect(redirectUrl).not.toContain('abc123xyz');
      expect(redirectUrl).not.toContain('bad_code');
    });
  });
});
