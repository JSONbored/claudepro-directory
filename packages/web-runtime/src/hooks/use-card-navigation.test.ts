import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardNavigation } from './use-card-navigation';
import type { UseCardNavigationOptions } from './use-card-navigation';

// Mock dependencies - use vi.hoisted() for variables used in vi.mock()
const mockPush = vi.hoisted(() => vi.fn());
const mockRouter = vi.hoisted(() => ({
  push: mockPush,
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

const mockNavigateWithTransition = vi.hoisted(() => vi.fn());
vi.mock('../client/view-transitions', () => ({
  navigateWithTransition: mockNavigateWithTransition,
}));

vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../errors', () => ({
  normalizeError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useCardNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should accept string path', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    expect(typeof result.current.handleCardClick).toBe('function');
    expect(typeof result.current.handleKeyDown).toBe('function');
    expect(typeof result.current.handleActionClick).toBe('function');
  });

  it('should accept options object', () => {
    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
      } as UseCardNavigationOptions)
    );

    expect(typeof result.current.handleCardClick).toBe('function');
  });

  it('should navigate on card click', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    act(() => {
      result.current.handleCardClick();
    });

    expect(mockPush).toHaveBeenCalledWith('/test-path');
  });

  it('should use View Transitions when enabled', () => {
    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        useViewTransitions: true,
      } as UseCardNavigationOptions)
    );

    act(() => {
      result.current.handleCardClick();
    });

    expect(mockNavigateWithTransition).toHaveBeenCalledWith('/test-path', mockRouter);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should call onBeforeNavigate callback', () => {
    const onBeforeNavigate = vi.fn();

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        onBeforeNavigate,
      } as UseCardNavigationOptions)
    );

    act(() => {
      result.current.handleCardClick();
    });

    expect(onBeforeNavigate).toHaveBeenCalled();
  });

  it('should call onAfterNavigate callback', () => {
    const onAfterNavigate = vi.fn();

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        onAfterNavigate,
      } as UseCardNavigationOptions)
    );

    act(() => {
      result.current.handleCardClick();
    });

    expect(onAfterNavigate).toHaveBeenCalled();
  });

  it('should navigate on Enter key', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      key: 'Enter',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/test-path');
  });

  it('should navigate on Space key', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      key: ' ',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/test-path');
  });

  it('should not navigate on other keys', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      key: 'Escape',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should stop propagation on action click', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleActionClick(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/test-path');
  });

  it('should handle navigation errors gracefully', async () => {
    const { logger } = await import('../logger');
    mockPush.mockImplementation(() => {
      throw new Error('Navigation failed');
    });

    const { result } = renderHook(() => useCardNavigation('/test-path'));

    act(() => {
      result.current.handleCardClick();
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        hook: 'useCardNavigation',
        path: '/test-path',
      }),
      'useCardNavigation: Navigation failed'
    );
  });

  it('should handle action click errors gracefully', async () => {
    const { logger } = await import('../logger');
    mockPush.mockImplementation(() => {
      throw new Error('Action navigation failed');
    });

    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleActionClick(mockEvent);
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        hook: 'useCardNavigation',
        path: '/test-path',
      }),
      'useCardNavigation: Action navigation failed'
    );
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useCardNavigation('/test-path'));

    const firstHandleClick = result.current.handleCardClick;
    const firstHandleKeyDown = result.current.handleKeyDown;
    const firstHandleActionClick = result.current.handleActionClick;

    rerender();

    const secondHandleClick = result.current.handleCardClick;
    const secondHandleKeyDown = result.current.handleKeyDown;
    const secondHandleActionClick = result.current.handleActionClick;

    expect(firstHandleClick).toBe(secondHandleClick);
    expect(firstHandleKeyDown).toBe(secondHandleKeyDown);
    expect(firstHandleActionClick).toBe(secondHandleActionClick);
  });
});
