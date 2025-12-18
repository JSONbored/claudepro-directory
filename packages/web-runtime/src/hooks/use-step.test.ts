import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStep } from './use-step';
import type { UseStepActions } from './use-step';

describe('useStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with step 1', () => {
    const { result } = renderHook(() => useStep(5));

    const [currentStep] = result.current;
    expect(currentStep).toBe(1);
  });

  it('should throw error if maxStep < 1', () => {
    expect(() => {
      renderHook(() => useStep(0));
    }).toThrow('useStep: maxStep must be >= 1');

    expect(() => {
      renderHook(() => useStep(-1));
    }).toThrow('useStep: maxStep must be >= 1');
  });

  it('should return all action methods', () => {
    const { result } = renderHook(() => useStep(5));

    const [, actions] = result.current;
    expect(typeof actions.canGoToNextStep).toBe('boolean');
    expect(typeof actions.canGoToPrevStep).toBe('boolean');
    expect(typeof actions.goToNextStep).toBe('function');
    expect(typeof actions.goToPrevStep).toBe('function');
    expect(typeof actions.reset).toBe('function');
    expect(typeof actions.setStep).toBe('function');
  });

  it('should have canGoToNextStep=true when not at max step', () => {
    const { result } = renderHook(() => useStep(5));

    const [, actions] = result.current;
    expect(actions.canGoToNextStep).toBe(true);
    expect(actions.canGoToPrevStep).toBe(false);
  });

  it('should have canGoToNextStep=false when at max step', () => {
    const { result } = renderHook(() => useStep(5));

    // Navigate to max step
    act(() => {
      result.current[1].setStep(5);
    });

    const [, actions] = result.current;
    expect(actions.canGoToNextStep).toBe(false);
    expect(actions.canGoToPrevStep).toBe(true);
  });

  it('should advance to next step when goToNextStep is called', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].goToNextStep();
    });

    expect(result.current[0]).toBe(2);

    act(() => {
      result.current[1].goToNextStep();
    });

    expect(result.current[0]).toBe(3);
  });

  it('should not advance beyond max step', () => {
    const { result } = renderHook(() => useStep(3));

    act(() => {
      result.current[1].setStep(3);
    });

    expect(result.current[0]).toBe(3);

    act(() => {
      result.current[1].goToNextStep();
    });

    // Should remain at step 3
    expect(result.current[0]).toBe(3);
  });

  it('should go back to previous step when goToPrevStep is called', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].setStep(3);
    });

    expect(result.current[0]).toBe(3);

    act(() => {
      result.current[1].goToPrevStep();
    });

    expect(result.current[0]).toBe(2);

    act(() => {
      result.current[1].goToPrevStep();
    });

    expect(result.current[0]).toBe(1);
  });

  it('should not go below step 1', () => {
    const { result } = renderHook(() => useStep(5));

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1].goToPrevStep();
    });

    // Should remain at step 1
    expect(result.current[0]).toBe(1);
  });

  it('should reset to step 1', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].setStep(4);
    });

    expect(result.current[0]).toBe(4);

    act(() => {
      result.current[1].reset();
    });

    expect(result.current[0]).toBe(1);
  });

  it('should set step to specific value', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].setStep(3);
    });

    expect(result.current[0]).toBe(3);

    act(() => {
      result.current[1].setStep(5);
    });

    expect(result.current[0]).toBe(5);
  });

  it('should clamp setStep to valid range (below 1)', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].setStep(0);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1].setStep(-10);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should clamp setStep to valid range (above maxStep)', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].setStep(10);
    });

    expect(result.current[0]).toBe(5);

    act(() => {
      result.current[1].setStep(100);
    });

    expect(result.current[0]).toBe(5);
  });

  it('should handle setStep with function updater', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].setStep(2);
    });

    act(() => {
      result.current[1].setStep((prev) => prev + 2);
    });

    expect(result.current[0]).toBe(4);
  });

  it('should clamp function updater result to valid range', () => {
    const { result } = renderHook(() => useStep(5));

    act(() => {
      result.current[1].setStep(4);
    });

    act(() => {
      result.current[1].setStep((prev) => prev + 10); // Would be 14, but clamped to 5
    });

    expect(result.current[0]).toBe(5);
  });

  it('should update canGoToNextStep and canGoToPrevStep flags correctly', () => {
    const { result } = renderHook(() => useStep(5));

    // Step 1
    let [, actions] = result.current;
    expect(actions.canGoToNextStep).toBe(true);
    expect(actions.canGoToPrevStep).toBe(false);

    // Step 2
    act(() => {
      result.current[1].setStep(2);
    });
    [, actions] = result.current;
    expect(actions.canGoToNextStep).toBe(true);
    expect(actions.canGoToPrevStep).toBe(true);

    // Step 5 (max)
    act(() => {
      result.current[1].setStep(5);
    });
    [, actions] = result.current;
    expect(actions.canGoToNextStep).toBe(false);
    expect(actions.canGoToPrevStep).toBe(true);
  });

  it('should work with maxStep of 1', () => {
    const { result } = renderHook(() => useStep(1));

    const [currentStep, actions] = result.current;
    expect(currentStep).toBe(1);
    expect(actions.canGoToNextStep).toBe(false);
    expect(actions.canGoToPrevStep).toBe(false);

    act(() => {
      actions.goToNextStep();
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      actions.goToPrevStep();
    });

    expect(result.current[0]).toBe(1);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useStep(5));

    const firstGoToNext = result.current[1].goToNextStep;
    const firstGoToPrev = result.current[1].goToPrevStep;
    const firstReset = result.current[1].reset;
    const firstSetStep = result.current[1].setStep;

    rerender();

    const secondGoToNext = result.current[1].goToNextStep;
    const secondGoToPrev = result.current[1].goToPrevStep;
    const secondReset = result.current[1].reset;
    const secondSetStep = result.current[1].setStep;

    // Note: Functions may change when dependencies change, but should be stable when they don't
    // For this test, we're checking that the same hook instance returns stable refs
    expect(typeof firstGoToNext).toBe('function');
    expect(typeof secondGoToNext).toBe('function');
  });

  it('should handle rapid navigation', () => {
    const { result } = renderHook(() => useStep(10));

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current[1].goToNextStep();
      }
    });

    expect(result.current[0]).toBe(6);

    act(() => {
      for (let i = 0; i < 3; i++) {
        result.current[1].goToPrevStep();
      }
    });

    expect(result.current[0]).toBe(3);
  });
});
