/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useFormTracking, useStepTimer } from './use-form-tracking';
import type { FormTrackingMetadata } from './use-form-tracking';

// Mock usePulse - define mock inside factory to avoid hoisting issues
const mockClick = jest.fn().mockResolvedValue(undefined);

jest.mock('./use-pulse', () => ({
  usePulse: jest.fn(() => ({
    click: mockClick,
    view: jest.fn(),
    copy: jest.fn(),
    share: jest.fn(),
    screenshot: jest.fn(),
    download: jest.fn(),
    bookmark: jest.fn(),
    filter: jest.fn(),
    search: jest.fn(),
    newsletter: jest.fn(),
  })),
}));

describe('useFormTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should return all tracking functions', () => {
    const { result } = renderHook(() => useFormTracking());

    expect(typeof result.current.trackStart).toBe('function');
    expect(typeof result.current.trackStepCompleted).toBe('function');
    expect(typeof result.current.trackFieldFocused).toBe('function');
    expect(typeof result.current.trackTemplateSelected).toBe('function');
    expect(typeof result.current.trackAbandoned).toBe('function');
    expect(typeof result.current.trackSubmitted).toBe('function');
    expect(typeof result.current.trackValidationError).toBe('function');
    expect(typeof result.current.trackDraftSaved).toBe('function');
    expect(typeof result.current.trackDraftLoaded).toBe('function');
  });

  it('should track form start', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackStart('agents');
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_started',
        submission_type: 'agents',
      }),
    });
  });

  it('should track step completed', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackStepCompleted(1, 'basic_info', {
        time_spent: 5000,
      } as FormTrackingMetadata);
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_step_completed',
        step: 1,
        step_name: 'basic_info',
        time_spent: 5000,
      }),
    });
  });

  it('should track field focused', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackFieldFocused('email');
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_field_focused',
        field_name: 'email',
      }),
    });
  });

  it('should track template selected', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackTemplateSelected('template-1', 'Basic Template', 'agents');
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_template_selected',
        template_id: 'template-1',
        template_name: 'Basic Template',
        submission_type: 'agents',
      }),
    });
  });

  it('should track form abandoned', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackAbandoned(2, 'details', {
        time_spent: 10000,
      } as FormTrackingMetadata);
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_abandoned',
        step: 2,
        step_name: 'details',
        time_spent: 10000,
      }),
    });
  });

  it('should track form submitted', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackSubmitted('agents', {
        quality_score: 0.9,
      } as FormTrackingMetadata);
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_submitted',
        submission_type: 'agents',
        quality_score: 0.9,
      }),
    });
  });

  it('should track validation error', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackValidationError('email', 'Invalid email format');
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_validation_error',
        field_name: 'email',
        error_message: 'Invalid email format',
      }),
    });
  });

  it('should track draft saved', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackDraftSaved({
        step: 3,
      } as FormTrackingMetadata);
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_draft_saved',
        step: 3,
      }),
    });
  });

  it('should track draft loaded', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackDraftLoaded({
        step: 2,
      } as FormTrackingMetadata);
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_draft_loaded',
        step: 2,
      }),
    });
  });

  it('should include timestamp in all tracking events', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackStart('agents');
    });

    expect(mockClick).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          timestamp: expect.any(String),
        }),
      })
    );
  });

  it('should merge custom metadata', async () => {
    const { result } = renderHook(() => useFormTracking());

    await act(async () => {
      await result.current.trackStepCompleted(1, 'basic_info', {
        custom_field: 'custom_value',
        step: 1,
      } as FormTrackingMetadata);
    });

    expect(mockClick).toHaveBeenCalledWith({
      category: null,
      slug: null,
      metadata: expect.objectContaining({
        event: 'form_step_completed',
        custom_field: 'custom_value',
        step: 1,
      }),
    });
  });
});

describe('useStepTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z').getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should initialize timer', () => {
    const { result } = renderHook(() => useStepTimer());

    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.getElapsed).toBe('function');
  });

  it('should calculate elapsed time', () => {
    const { result } = renderHook(() => useStepTimer());

    act(() => {
      jest.advanceTimersByTime(5000); // 5 seconds
    });

    expect(result.current.getElapsed()).toBe(5000);
  });

  it('should reset timer', () => {
    const { result } = renderHook(() => useStepTimer());

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.getElapsed()).toBe(5000);

    act(() => {
      result.current.reset();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.getElapsed()).toBe(2000);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useStepTimer());

    const firstReset = result.current.reset;
    const firstGetElapsed = result.current.getElapsed;

    rerender();

    const secondReset = result.current.reset;
    const secondGetElapsed = result.current.getElapsed;

    expect(firstReset).toBe(secondReset);
    expect(firstGetElapsed).toBe(secondGetElapsed);
  });
});
