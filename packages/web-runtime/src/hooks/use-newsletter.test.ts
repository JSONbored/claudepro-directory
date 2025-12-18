import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNewsletter } from './use-newsletter.ts';

// Mock dependencies
vi.mock('./use-pulse.ts', () => ({
  usePulse: vi.fn(() => ({
    newsletter: vi.fn(),
  })),
}));

vi.mock('../actions/newsletter.ts', () => ({
  subscribeNewsletterAction: vi.fn(),
}));

vi.mock('../client/toast.ts', () => ({
  toasts: {
    error: {
      validation: vi.fn(),
    },
    raw: {
      success: vi.fn(),
      error: vi.fn(),
    },
  },
}));

vi.mock('../utils/client-logger.ts', () => ({
  logClientError: vi.fn(),
  logClientWarn: vi.fn(),
}));

describe('useNewsletter', () => {
  let mockSubscribeNewsletterAction: ReturnType<typeof vi.fn>;
  let mockPulse: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { subscribeNewsletterAction } = await import('../actions/newsletter.ts');
    mockSubscribeNewsletterAction = vi.mocked(subscribeNewsletterAction);

    const { usePulse } = await import('./use-pulse.ts');
    mockPulse = vi.mocked(usePulse);
    mockPulse.mockReturnValue({
      newsletter: vi.fn(),
    });
  });

  it('should initialize with empty email and no error', () => {
    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any })
    );

    expect(result.current.email).toBe('');
    expect(result.current.error).toBe(null);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update email when setEmail is called', () => {
    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    expect(result.current.email).toBe('test@example.com');
  });

  it('should reset form state', () => {
    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.email).toBe('');
    expect(result.current.error).toBe(null);
  });

  it('should show validation error for empty email', async () => {
    const { toasts } = await import('../client/toast.ts');
    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any, showToasts: true })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe('Please enter your email address');
    expect(vi.mocked(toasts.error.validation)).toHaveBeenCalledWith(
      'Please enter your email address'
    );
  });

  it('should call subscribeNewsletterAction with normalized email', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      data: { success: true },
    });

    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any })
    );

    act(() => {
      result.current.setEmail('  Test@Example.COM  ');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSubscribeNewsletterAction).toHaveBeenCalledWith({
      email: 'test@example.com',
      source: 'footer',
      metadata: expect.objectContaining({}),
    });
  });

  it('should handle successful subscription', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      data: { success: true },
    });

    const onSuccess = vi.fn();
    const { toasts } = await import('../client/toast.ts');
    const { result } = renderHook(() =>
      useNewsletter({
        source: 'footer' as any,
        onSuccess,
        successMessage: 'Custom success message',
      })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(result.current.email).toBe('');
      expect(result.current.error).toBe(null);
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(vi.mocked(toasts.raw.success)).toHaveBeenCalledWith('Welcome!', {
      description: 'Custom success message',
    });
  });

  it('should handle subscription errors', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      serverError: 'Email already subscribed',
    });

    const onError = vi.fn();
    const { toasts } = await import('../client/toast.ts');
    const { result } = renderHook(() =>
      useNewsletter({
        source: 'footer' as any,
        onError,
        errorTitle: 'Subscription Error',
      })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe('Email already subscribed');
    expect(onError).toHaveBeenCalledWith('Email already subscribed');
    expect(vi.mocked(toasts.raw.error)).toHaveBeenCalledWith(
      'Subscription Error',
      {
        description: 'Email already subscribed',
      }
    );
  });

  it('should handle exceptions during subscription', async () => {
    mockSubscribeNewsletterAction.mockRejectedValue(new Error('Network error'));

    const { logClientError } = await import('../utils/client-logger.ts');
    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe('Network error');
    expect(vi.mocked(logClientError)).toHaveBeenCalled();
  });

  it('should track newsletter signup success', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      data: { success: true },
    });

    const { usePulse } = await import('./use-pulse.ts');
    const mockNewsletter = vi.fn();
    vi.mocked(usePulse).mockReturnValue({
      newsletter: mockNewsletter,
    } as any);

    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(mockNewsletter).toHaveBeenCalledWith({
        event: 'subscribe',
        metadata: expect.objectContaining({ source: 'footer' }),
      });
      expect(mockNewsletter).toHaveBeenCalledWith({
        event: 'signup_success',
        metadata: expect.objectContaining({ source: 'footer' }),
      });
    });
  });

  it('should track newsletter signup errors', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      serverError: 'Error',
    });

    const { usePulse } = await import('./use-pulse.ts');
    const mockNewsletter = vi.fn();
    vi.mocked(usePulse).mockReturnValue({
      newsletter: mockNewsletter,
    } as any);

    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(mockNewsletter).toHaveBeenCalledWith({
        event: 'signup_error',
        metadata: expect.objectContaining({
          source: 'footer',
          error: 'Error',
        }),
      });
    });
  });

  it('should not show toasts when showToasts is false', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      data: { success: true },
    });

    const { toasts } = await import('../client/toast.ts');
    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any, showToasts: false })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(vi.mocked(toasts.raw.success)).not.toHaveBeenCalled();
  });

  it('should include metadata in subscription request', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      data: { success: true },
    });

    const metadata = {
      copy_type: 'agent' as any,
      copy_category: 'agents' as any,
      copy_slug: 'test-agent',
    };

    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any, metadata })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSubscribeNewsletterAction).toHaveBeenCalledWith({
      email: 'test@example.com',
      source: 'footer',
      metadata: expect.objectContaining(metadata),
    });
  });
});
