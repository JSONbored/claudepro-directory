/**
 * Tests for createAccount Tool Handler
 *
 * Tests the tool that provides OAuth URLs and instructions for creating an account.
 * Includes OAuth URL generation for different providers, newsletter opt-in handling, and redirect URL handling.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleCreateAccount } from './account.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';

// Mock env-config module
jest.mock('../../lib/env-config.js', () => ({
  parseSimpleEnv: jest.fn((env: Record<string, unknown>) => ({
    supabase: {
      url: env['SUPABASE_URL'] || 'https://test.supabase.co',
    },
  })),
}));

describe('createAccount Tool Handler', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;
  let mockElicit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    mockLogger = createMockLogger();
    mockEnv = createMockEnv({
      APP_URL: 'https://claudepro.directory',
      SUPABASE_URL: 'https://test.supabase.co',
    });
    mockElicit = jest.fn();

    context = {
      prisma: undefined as any, // Not used in account tool
      user: createMockUser(),
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
      elicit: mockElicit,
    };
  });

  describe('Unit Tests', () => {
    describe('OAuth URL Generation', () => {
      it('should generate GitHub OAuth URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
          },
          context
        );

        expect(result._meta.oauthUrl).toContain('provider=github');
        expect(result._meta.oauthUrl).toContain('https://test.supabase.co/auth/v1/authorize');
        expect(result._meta.provider).toBe('github');
      });

      it('should generate Google OAuth URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'google',
            newsletterOptIn: false,
          },
          context
        );

        expect(result._meta.oauthUrl).toContain('provider=google');
        expect(result._meta.provider).toBe('google');
      });

      it('should generate Discord OAuth URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'discord',
            newsletterOptIn: false,
          },
          context
        );

        expect(result._meta.oauthUrl).toContain('provider=discord');
        expect(result._meta.provider).toBe('discord');
      });

      it('should include newsletter opt-in in callback URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: true,
          },
          context
        );

        expect(result._meta.oauthUrl).toContain('newsletter=true');
        expect(result._meta.newsletterOptIn).toBe(true);
      });

      it('should include newsletter opt-out in callback URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
          },
          context
        );

        expect(result._meta.oauthUrl).toContain('newsletter=false');
        expect(result._meta.newsletterOptIn).toBe(false);
      });

      it('should include redirectTo in callback URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
            redirectTo: 'https://example.com/dashboard',
          },
          context
        );

        expect(result._meta.oauthUrl).toContain('next=https%3A%2F%2Fexample.com%2Fdashboard');
        expect(result._meta.redirectTo).toBe('https://example.com/dashboard');
      });

      it('should use default provider (github) when not provided', async () => {
        const result = await handleCreateAccount({}, context);

        expect(result._meta.provider).toBe('github');
        expect(result._meta.oauthUrl).toContain('provider=github');
      });

      it('should use default newsletter opt-in (false) when not provided', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
          },
          context
        );

        expect(result._meta.newsletterOptIn).toBe(false);
        expect(result._meta.oauthUrl).toContain('newsletter=false');
      });
    });

    describe('Input Validation', () => {
      it('should reject invalid provider', async () => {
        await expect(
          handleCreateAccount(
            {
              provider: 'invalid-provider' as any,
            },
            context
          )
        ).rejects.toThrow('Invalid provider');
      });

      it('should reject invalid redirectTo URL', async () => {
        await expect(
          handleCreateAccount(
            {
              provider: 'github',
              redirectTo: 'not-a-valid-url',
            },
            context
          )
        ).rejects.toThrow('Invalid redirectTo URL');
      });

      it('should accept valid redirectTo URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            redirectTo: 'https://example.com/redirect',
          },
          context
        );

        expect(result._meta.redirectTo).toBe('https://example.com/redirect');
      });
    });

    describe('Elicitation', () => {
      it('should elicit provider when not provided', async () => {
        mockElicit.mockResolvedValue('google');

        const result = await handleCreateAccount({}, context);

        expect(mockElicit).toHaveBeenCalledWith({
          type: 'string',
          description: 'Which OAuth provider would you like to use to create your account?',
          enum: ['github', 'google', 'discord'],
        });
        expect(result._meta.provider).toBe('google');
      });

      it('should elicit newsletter opt-in when not provided', async () => {
        mockElicit.mockResolvedValue(true);

        const result = await handleCreateAccount(
          {
            provider: 'github',
          },
          context
        );

        expect(mockElicit).toHaveBeenCalledWith({
          type: 'boolean',
          description: 'Would you like to subscribe to our newsletter for updates and new content?',
        });
        expect(result._meta.newsletterOptIn).toBe(true);
      });

      it('should not elicit when provider is provided', async () => {
        await handleCreateAccount(
          {
            provider: 'github',
          },
          context
        );

        expect(mockElicit).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'string',
            description: expect.stringContaining('OAuth provider'),
          })
        );
      });

      it('should not elicit when newsletterOptIn is provided', async () => {
        await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: true,
          },
          context
        );

        expect(mockElicit).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'boolean',
            description: expect.stringContaining('newsletter'),
          })
        );
      });
    });

    describe('Instructions Generation', () => {
      it('should generate instructions with OAuth URL', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
          },
          context
        );

        expect(result.content[0].text).toContain('Create Account with Github');
        expect(result.content[0].text).toContain('Option 1: Use the OAuth URL');
        expect(result.content[0].text).toContain(result._meta.oauthUrl);
      });

      it('should include newsletter information when opted in', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: true,
          },
          context
        );

        expect(result.content[0].text).toContain('Newsletter Subscription');
        expect(result.content[0].text).toContain('automatically subscribed');
        expect(result._meta.instructions).toContain('Newsletter subscription will be enabled');
      });

      it('should not include newsletter information when not opted in', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
          },
          context
        );

        expect(result.content[0].text).not.toContain('Newsletter Subscription');
        expect(result._meta.instructions).toContain('Newsletter subscription is optional');
      });

      it('should include account benefits in instructions', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
          },
          context
        );

        expect(result.content[0].text).toContain('What You Get');
        expect(result.content[0].text).toContain('personalized content recommendations');
        expect(result.content[0].text).toContain('bookmark and save');
        expect(result.content[0].text).toContain('Submit your own content');
      });

      it('should include after account creation steps', async () => {
        const result = await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
          },
          context
        );

        expect(result.content[0].text).toContain('After Account Creation');
        expect(result.content[0].text).toContain('Use the MCP server');
        expect(result.content[0].text).toContain('Access protected resources');
      });
    });

    describe('Environment Configuration', () => {
      it('should use APP_URL from environment', async () => {
        const customEnv = createMockEnv({
          APP_URL: 'https://custom.app.com',
          SUPABASE_URL: 'https://test.supabase.co',
        });

        const customContext: ToolContext = {
          ...context,
          env: customEnv as any,
        };

        const result = await handleCreateAccount(
          {
            provider: 'github',
          },
          customContext
        );

        expect(result._meta.appUrl).toBe('https://custom.app.com');
        expect(result._meta.callbackUrl).toBe('https://custom.app.com/auth/callback');
      });

      it('should use default APP_URL when not in environment', async () => {
        const customEnv = createMockEnv({
          SUPABASE_URL: 'https://test.supabase.co',
        });

        const customContext: ToolContext = {
          ...context,
          env: customEnv as any,
        };

        const result = await handleCreateAccount(
          {
            provider: 'github',
          },
          customContext
        );

        expect(result._meta.appUrl).toBe('https://claudepro.directory');
      });

      it('should use SUPABASE_URL from environment', async () => {
        const customEnv = createMockEnv({
          APP_URL: 'https://claudepro.directory',
          SUPABASE_URL: 'https://custom.supabase.co',
        });

        const customContext: ToolContext = {
          ...context,
          env: customEnv as any,
        };

        const result = await handleCreateAccount(
          {
            provider: 'github',
          },
          customContext
        );

        expect(result._meta.oauthUrl).toContain('https://custom.supabase.co');
      });
    });

    describe('Logging', () => {
      it('should log successful completion', async () => {
        await handleCreateAccount(
          {
            provider: 'github',
            newsletterOptIn: false,
          },
          context
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
          'createAccount completed successfully',
          expect.objectContaining({
            tool: 'createAccount',
            provider: 'github',
            newsletterOptIn: false,
            duration_ms: expect.any(Number),
          })
        );
      });

      it('should log errors', async () => {
        await expect(
          handleCreateAccount(
            {
              provider: 'invalid-provider' as any,
            },
            context
          )
        ).rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(
          'createAccount tool error',
          expect.any(Error),
          expect.objectContaining({
            tool: 'createAccount',
            provider: 'invalid-provider',
          })
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle full OAuth flow with all options', async () => {
      const result = await handleCreateAccount(
        {
          provider: 'google',
          newsletterOptIn: true,
          redirectTo: 'https://example.com/dashboard',
        },
        context
      );

      // Verify OAuth URL structure
      const oauthUrl = new URL(result._meta.oauthUrl);
      expect(oauthUrl.hostname).toContain('supabase.co');
      expect(oauthUrl.pathname).toBe('/auth/v1/authorize');
      expect(oauthUrl.searchParams.get('provider')).toBe('google');

      const redirectTo = new URL(oauthUrl.searchParams.get('redirect_to')!);
      expect(redirectTo.searchParams.get('newsletter')).toBe('true');
      expect(redirectTo.searchParams.get('next')).toBe('https://example.com/dashboard');

      // Verify metadata
      expect(result._meta.provider).toBe('google');
      expect(result._meta.newsletterOptIn).toBe(true);
      expect(result._meta.redirectTo).toBe('https://example.com/dashboard');
      expect(result._meta.appUrl).toBe('https://claudepro.directory');
      expect(result._meta.callbackUrl).toBe('https://claudepro.directory/auth/callback');
    });

    it('should handle provider elicitation flow', async () => {
      mockElicit
        .mockResolvedValueOnce('discord') // Provider elicitation
        .mockResolvedValueOnce(true); // Newsletter elicitation

      const result = await handleCreateAccount({}, context);

      expect(mockElicit).toHaveBeenCalledTimes(2);
      expect(result._meta.provider).toBe('discord');
      expect(result._meta.newsletterOptIn).toBe(true);
    });

    it('should handle all three providers correctly', async () => {
      const providers = ['github', 'google', 'discord'] as const;

      for (const provider of providers) {
        const result = await handleCreateAccount(
          {
            provider,
            newsletterOptIn: false,
          },
          context
        );

        expect(result._meta.provider).toBe(provider);
        expect(result._meta.oauthUrl).toContain(`provider=${provider}`);
      }
    });

    it('should generate correct callback URL structure', async () => {
      const result = await handleCreateAccount(
        {
          provider: 'github',
          newsletterOptIn: true,
          redirectTo: 'https://example.com/redirect',
        },
        context
      );

      const oauthUrl = new URL(result._meta.oauthUrl);
      const callbackUrl = new URL(oauthUrl.searchParams.get('redirect_to')!);

      expect(callbackUrl.pathname).toBe('/auth/callback');
      expect(callbackUrl.searchParams.get('newsletter')).toBe('true');
      expect(callbackUrl.searchParams.get('next')).toBe('https://example.com/redirect');
    });
  });
});
