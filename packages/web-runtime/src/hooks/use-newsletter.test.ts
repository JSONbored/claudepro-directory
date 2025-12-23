/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNewsletter } from './use-newsletter.ts';

// Mock dependencies - define mocks inside factory functions to avoid hoisting issues
jest.mock('./use-pulse.ts', () => {
  const mockNewsletter = jest.fn().mockResolvedValue(undefined);
  const mockUsePulse = jest.fn(() => ({
    newsletter: mockNewsletter,
  }));
  return {
    usePulse: mockUsePulse,
    __mockNewsletter: mockNewsletter,
    __mockUsePulse: mockUsePulse,
  };
});

jest.mock('../actions/newsletter.ts', () => {
  const mockSubscribeNewsletterAction = jest.fn();
  return {
    subscribeNewsletterAction: mockSubscribeNewsletterAction,
    __mockSubscribeNewsletterAction: mockSubscribeNewsletterAction,
  };
});

// Define toast mocks inside factory to avoid hoisting issues
jest.mock('../client/toast.ts', () => {
  const mockValidation = jest.fn();
  const mockSuccess = jest.fn();
  const mockError = jest.fn();
  return {
    toasts: {
      error: {
        validation: mockValidation,
      },
      raw: {
        success: mockSuccess,
        error: mockError,
      },
    },
    // Export mocks for use in tests
    __mockValidation: mockValidation,
    __mockSuccess: mockSuccess,
    __mockError: mockError,
  };
});

// Define logger mocks inside factory
jest.mock('../utils/client-logger.ts', () => {
  const mockLogClientError = jest.fn();
  const mockLogClientWarn = jest.fn();
  return {
    logClientError: mockLogClientError,
    logClientWarn: mockLogClientWarn,
    // Export mocks for use in tests
    __mockLogClientError: mockLogClientError,
    __mockLogClientWarn: mockLogClientWarn,
  };
});

// Get mocks for use in tests
const { usePulse, __mockNewsletter, __mockUsePulse } = jest.requireMock('./use-pulse.ts');
const mockNewsletter = __mockNewsletter;
const mockUsePulse = __mockUsePulse;

const { subscribeNewsletterAction, __mockSubscribeNewsletterAction } = jest.requireMock(
  '../actions/newsletter.ts'
);
const mockSubscribeNewsletterAction = __mockSubscribeNewsletterAction;

const { toasts } = jest.requireMock('../client/toast');
const mockValidationToast = toasts.error.validation;
const mockSuccessToast = toasts.raw.success;
const mockErrorToast = toasts.raw.error;

const { logClientError, logClientWarn } = jest.requireMock('../utils/client-logger');
const mockLogClientError = logClientError;
const mockLogClientWarn = logClientWarn;

describe('useNewsletter', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset mocks to default behavior
    mockSubscribeNewsletterAction.mockClear();
    // Ensure newsletter mock returns a Promise (required for .catch() calls)
    mockNewsletter.mockResolvedValue(undefined);
    mockUsePulse.mockReturnValue({
      newsletter: mockNewsletter,
    });
  });

  it('should initialize with empty email and no error', () => {
    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any }));

    expect(result.current.email).toBe('');
    expect(result.current.error).toBe(null);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update email when setEmail is called', () => {
    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any }));

    act(() => {
      result.current.setEmail('test@example.com');
    });

    expect(result.current.email).toBe('test@example.com');
  });

  it('should reset form state', () => {
    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any }));

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
    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any, showToasts: true })
    );

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe('Please enter your email address');
    expect(mockValidationToast).toHaveBeenCalledWith('Please enter your email address');
  });

  it('should call subscribeNewsletterAction with normalized email', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      data: { success: true },
    });

    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any }));

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

    const onSuccess = jest.fn();
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
    expect(mockSuccessToast).toHaveBeenCalledWith('Welcome!', {
      description: 'Custom success message',
    });
  });

  it('should handle subscription errors', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      serverError: 'Email already subscribed',
    });

    const onError = jest.fn();
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
    expect(mockErrorToast).toHaveBeenCalledWith('Subscription Error', {
      description: 'Email already subscribed',
    });
  });

  it('should handle exceptions during subscription', async () => {
    mockSubscribeNewsletterAction.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any }));

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe('Network error');
    expect(mockLogClientError).toHaveBeenCalled();
  });

  it('should track newsletter signup success', async () => {
    mockSubscribeNewsletterAction.mockResolvedValue({
      data: { success: true },
    });

    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any }));

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

    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any }));

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

    const { result } = renderHook(() =>
      useNewsletter({ source: 'footer' as any, showToasts: false })
    );

    act(() => {
      result.current.setEmail('test@example.com');
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSuccessToast).not.toHaveBeenCalled();
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

    const { result } = renderHook(() => useNewsletter({ source: 'footer' as any, metadata }));

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
