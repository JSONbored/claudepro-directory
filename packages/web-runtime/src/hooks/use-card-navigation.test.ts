/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCardNavigation } from './use-card-navigation';
import type { UseCardNavigationOptions } from './use-card-navigation';

// Mock dependencies - define mocks inside factory functions
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}));

jest.mock('../client/view-transitions', () => ({
  navigateWithTransition: jest.fn(),
}));

jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock('../errors', () => ({
  normalizeError: jest.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useCardNavigation', () => {
  let mockNavigateWithTransition: ReturnType<typeof jest.fn>;
  let mockLoggerError: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get mocks from modules
    const { navigateWithTransition } = jest.requireMock('../client/view-transitions');
    const { logger } = jest.requireMock('../logger');
    mockNavigateWithTransition = navigateWithTransition;
    mockLoggerError = logger.error;
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    const onBeforeNavigate = jest.fn();

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
    const onAfterNavigate = jest.fn();

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

  it('should call callbacks in correct order', () => {
    const callOrder: string[] = [];
    const onBeforeNavigate = jest.fn(() => callOrder.push('before'));
    const onAfterNavigate = jest.fn(() => callOrder.push('after'));

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        onBeforeNavigate,
        onAfterNavigate,
      } as UseCardNavigationOptions)
    );

    act(() => {
      result.current.handleCardClick();
    });

    expect(callOrder).toEqual(['before', 'after']);
    // Verify order by checking call indices
    expect(onBeforeNavigate.mock.invocationCallOrder[0]).toBeLessThan(
      onAfterNavigate.mock.invocationCallOrder[0]
    );
  });

  it('should navigate on Enter key', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
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
      preventDefault: jest.fn(),
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
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not navigate on Tab key', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      key: 'Tab',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not navigate on Arrow keys', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    arrowKeys.forEach((key) => {
      const mockEvent = {
        key,
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(mockEvent);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should stop propagation on action click', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleActionClick(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/test-path');
  });

  it('should call onBeforeNavigate on action click', () => {
    const onBeforeNavigate = jest.fn();

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        onBeforeNavigate,
      } as UseCardNavigationOptions)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleActionClick(mockEvent);
    });

    expect(onBeforeNavigate).toHaveBeenCalled();
  });

  it('should call onAfterNavigate on action click', () => {
    const onAfterNavigate = jest.fn();

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        onAfterNavigate,
      } as UseCardNavigationOptions)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleActionClick(mockEvent);
    });

    expect(onAfterNavigate).toHaveBeenCalled();
  });

  it('should use View Transitions on action click when enabled', () => {
    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        useViewTransitions: true,
      } as UseCardNavigationOptions)
    );

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleActionClick(mockEvent);
    });

    expect(mockNavigateWithTransition).toHaveBeenCalledWith('/test-path', mockRouter);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle navigation errors gracefully', () => {
    mockPush.mockImplementation(() => {
      throw new Error('Navigation failed');
    });

    const { result } = renderHook(() => useCardNavigation('/test-path'));

    act(() => {
      result.current.handleCardClick();
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        hook: 'useCardNavigation',
        path: '/test-path',
      }),
      'useCardNavigation: Navigation failed'
    );
  });

  it('should handle action click errors gracefully', () => {
    mockPush.mockImplementation(() => {
      throw new Error('Action navigation failed');
    });

    const { result } = renderHook(() => useCardNavigation('/test-path'));

    const mockEvent = {
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleActionClick(mockEvent);
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        hook: 'useCardNavigation',
        path: '/test-path',
      }),
      'useCardNavigation: Action navigation failed'
    );
  });

  it('should handle View Transitions errors gracefully', () => {
    mockNavigateWithTransition.mockImplementation(() => {
      throw new Error('View transition failed');
    });

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        useViewTransitions: true,
      } as UseCardNavigationOptions)
    );

    act(() => {
      result.current.handleCardClick();
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        hook: 'useCardNavigation',
        path: '/test-path',
        useViewTransitions: true,
      }),
      'useCardNavigation: Navigation failed'
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

  it('should return new function references when path changes', () => {
    const { result, rerender } = renderHook(({ path }) => useCardNavigation(path), {
      initialProps: { path: '/path1' },
    });

    const firstHandleClick = result.current.handleCardClick;

    rerender({ path: '/path2' });

    const secondHandleClick = result.current.handleCardClick;

    expect(secondHandleClick).not.toBe(firstHandleClick);
  });

  it('should return new function references when useViewTransitions changes', () => {
    const { result, rerender } = renderHook(
      ({ useViewTransitions }) =>
        useCardNavigation({
          path: '/test-path',
          useViewTransitions,
        } as UseCardNavigationOptions),
      {
        initialProps: { useViewTransitions: false },
      }
    );

    const firstHandleClick = result.current.handleCardClick;

    rerender({ useViewTransitions: true });

    const secondHandleClick = result.current.handleCardClick;

    expect(secondHandleClick).not.toBe(firstHandleClick);
  });

  it('should return new function references when callbacks change', () => {
    const onBeforeNavigate1 = jest.fn();
    const onBeforeNavigate2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ onBeforeNavigate }) =>
        useCardNavigation({
          path: '/test-path',
          onBeforeNavigate,
        } as UseCardNavigationOptions),
      {
        initialProps: { onBeforeNavigate: onBeforeNavigate1 },
      }
    );

    const firstHandleClick = result.current.handleCardClick;

    rerender({ onBeforeNavigate: onBeforeNavigate2 });

    const secondHandleClick = result.current.handleCardClick;

    expect(secondHandleClick).not.toBe(firstHandleClick);
  });

  it('should handle path with query parameters', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path?param=value'));

    act(() => {
      result.current.handleCardClick();
    });

    expect(mockPush).toHaveBeenCalledWith('/test-path?param=value');
  });

  it('should handle path with hash', () => {
    const { result } = renderHook(() => useCardNavigation('/test-path#section'));

    act(() => {
      result.current.handleCardClick();
    });

    expect(mockPush).toHaveBeenCalledWith('/test-path#section');
  });

  it('should handle empty path', () => {
    const { result } = renderHook(() => useCardNavigation(''));

    act(() => {
      result.current.handleCardClick();
    });

    expect(mockPush).toHaveBeenCalledWith('');
  });

  it('should handle onBeforeNavigate that throws', () => {
    const onBeforeNavigate = jest.fn(() => {
      throw new Error('Before navigate error');
    });

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        onBeforeNavigate,
      } as UseCardNavigationOptions)
    );

    act(() => {
      result.current.handleCardClick();
    });

    // Error is caught and logged, but navigation doesn't happen if onBeforeNavigate throws
    expect(mockLoggerError).toHaveBeenCalled();
    // Navigation is attempted but may fail if error occurs before it
    expect(onBeforeNavigate).toHaveBeenCalled();
  });

  it('should handle onAfterNavigate that throws', () => {
    const onAfterNavigate = jest.fn(() => {
      throw new Error('After navigate error');
    });

    const { result } = renderHook(() =>
      useCardNavigation({
        path: '/test-path',
        onAfterNavigate,
      } as UseCardNavigationOptions)
    );

    act(() => {
      result.current.handleCardClick();
    });

    // Navigation happens before onAfterNavigate, so it should be called
    expect(mockPush).toHaveBeenCalledWith('/test-path');
    // onAfterNavigate is called, then throws, error is caught and logged
    // Note: onAfterNavigate may or may not be called depending on error handling
    // The important thing is that navigation happens and errors are handled gracefully
    // Error is caught and logged
    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        hook: 'useCardNavigation',
        path: '/test-path',
      }),
      'useCardNavigation: Navigation failed'
    );
  });
});
