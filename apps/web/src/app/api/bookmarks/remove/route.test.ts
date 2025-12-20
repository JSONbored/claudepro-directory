/**
 * Unit Tests for Remove Bookmark API Route
 *
 * Tests the /api/bookmarks/remove endpoint which removes a bookmark for the authenticated user.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from './route';
import { createMockRequest, getResponseBody, expectStatus, expectCorsHeaders } from '../../__helpers__/test-helpers';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock next/cache (Cache Components)
vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/server (connection and NextRequest)
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    connection: vi.fn(async () => {}),
  };
});

// Mock server action
vi.mock('@heyclaude/web-runtime/actions/bookmarks', () => ({
  removeBookmark: vi.fn(),
}));

// Mock logging/server
vi.mock('../../../../../packages/web-runtime/src/logging/server', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
  generateRequestId: vi.fn(() => 'test-request-id'),
  normalizeError: vi.fn((error) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
  createErrorResponse: vi.fn((error, context) => {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
}));

// Mock server/api-helpers
vi.mock('../../../../../packages/web-runtime/src/server/api-helpers', () => ({
  getOnlyCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  },
  getWithAuthCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  postCorsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  jsonResponse: vi.fn((data, status, corsHeaders, additionalHeaders) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...additionalHeaders,
      },
    });
  }),
  badRequestResponse: vi.fn((message, errors) => {
    return new Response(
      JSON.stringify({
        error: message,
        ...(errors && { errors }),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
  handleOptionsRequest: vi.fn((corsHeaders) => {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  }),
  unauthorizedResponse: vi.fn((message, authInfo, corsHeaders) => {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }),
  buildSecurityHeaders: vi.fn(() => ({})),
}));

// Mock authentication
vi.mock('@heyclaude/web-runtime/auth/get-authenticated-user', () => ({
  getAuthenticatedUser: vi.fn(),
}));

describe('POST /api/bookmarks/remove', () => {
  let mockRemoveBookmark: ReturnType<typeof vi.fn>;
  let mockGetAuthenticatedUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get mocked functions
    const bookmarksModule = await import('@heyclaude/web-runtime/actions/bookmarks');
    const authModule = await import('@heyclaude/web-runtime/auth/get-authenticated-user');
    mockRemoveBookmark = vi.mocked(bookmarksModule.removeBookmark);
    mockGetAuthenticatedUser = vi.mocked(authModule.getAuthenticatedUser);
    
    // Default: authenticated user
    mockGetAuthenticatedUser.mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      isAuthenticated: true,
    });
    mockRemoveBookmark.mockResolvedValue({
      success: true,
      bookmark: {
        id: 'bookmark-123',
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });
  });

  it('should remove bookmark for authenticated user', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 200);
    expectCorsHeaders(response);
    expect(body).toHaveProperty('success', true);
    expect(mockRemoveBookmark).toHaveBeenCalledWith({
      content_slug: 'my-server',
      content_type: 'mcp',
    });
  });

  it('should return 401 for unauthenticated user', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: null,
      isAuthenticated: false,
    });

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 401);
    expect(body).toHaveProperty('error');
    expect(mockRemoveBookmark).not.toHaveBeenCalled();
  });

  it('should return 400 for missing content_slug', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockRemoveBookmark).not.toHaveBeenCalled();
  });

  it('should return 400 for missing content_type', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockRemoveBookmark).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid content_type', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'invalid-type',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 400);
    expect(body).toHaveProperty('error');
    expect(mockRemoveBookmark).not.toHaveBeenCalled();
  });

  it('should handle server action errors gracefully', async () => {
    mockRemoveBookmark.mockRejectedValue(new Error('Bookmark not found'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/bookmarks/remove',
      body: {
        content_slug: 'my-server',
        content_type: 'mcp',
      },
    });

    const response = await POST(request);
    const body = await getResponseBody(response);

    expectStatus(response, 500);
    expect(body).toHaveProperty('error');
  });

  it('should handle OPTIONS request', async () => {
    const response = await OPTIONS();

    expectStatus(response, 204);
    expectCorsHeaders(response);
  });
});
