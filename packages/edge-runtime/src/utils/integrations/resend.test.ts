import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/email-config.ts', () => ({
  RESEND_ENV: {
    apiKey: 're_test_key',
    audienceId: 'audience_test',
  },
}));

vi.mock(
  '@heyclaude/database-types',
  () => ({
    Constants: {
      public: {
        Enums: {
          newsletter_interest: ['general', 'agents', 'skills'],
          content_category: ['agents', 'skills'],
          copy_type: ['code', 'markdown', 'llmstxt'],
        },
      },
    },
  }),
  { virtual: true }
);

vi.mock(
  '@heyclaude/shared-runtime',
  () => ({
    createUtilityContext: (_domain: string, _action: string, meta?: Record<string, unknown>) =>
      meta ?? {},
    logError: vi.fn(),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    TIMEOUT_PRESETS: { external: 10000 },
    withTimeout: <T>(promise: Promise<T>) => promise,
    createPinoConfig: vi.fn((options?: { service?: string }) => ({
      level: 'info',
      ...(options?.service && { service: options.service }),
    })),
    normalizeError: vi.fn((error: unknown) => {
      if (error instanceof Error) return error;
      return new Error(String(error));
    }),
  }),
  { virtual: true }
);

import {
  buildContactProperties,
  callResendApi,
  resolveNewsletterInterest,
  ResendApiError,
} from './resend.ts';

describe('resolveNewsletterInterest', () => {
  it('returns matching enum when copy category is known', () => {
    expect(resolveNewsletterInterest('agents')).toBe('agents');
  });

  it('falls back to provided default when category is unknown', () => {
    expect(resolveNewsletterInterest('unknown', 'skills')).toBe('skills');
  });
});

describe('buildContactProperties', () => {
  it('maps newsletter metadata to Resend properties', () => {
    const props = buildContactProperties({
      source: 'footer',
      copyType: 'code',
      referrer: '/foo',
      primaryInterest: 'agents',
    });

    expect(props.signup_source).toBe('footer');
    expect(props.copy_type).toBe('code');
    expect(props.primary_interest).toBe('agents');
    expect(typeof props.engagement_score).toBe('number');
  });
});

describe('callResendApi', () => {
  it('returns parsed JSON payloads', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => '{"id":"contact_123"}',
    }));

    const result = await callResendApi<{ id: string }>({
      path: 'contacts/contact_123/topics',
      method: 'PATCH',
      payload: { topics: [] },
      apiKey: 're_test_key',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(result.data).toEqual({ id: 'contact_123' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/v1/contacts/contact_123/topics',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_key',
        }),
      })
    );
  });

  it('throws ResendApiError on non-2xx responses', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      headers: new Headers(),
      text: async () => '{"error":"boom"}',
    }));

    await expect(
      callResendApi({
        path: 'contacts/contact_123/topics',
        apiKey: 're_test_key',
        fetchImpl: fetchMock as unknown as typeof fetch,
      })
    ).rejects.toBeInstanceOf(ResendApiError);
  });
});
