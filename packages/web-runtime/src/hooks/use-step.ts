'use client';

import { useCallback, useState } from 'react';

/**
 * Step navigation actions
 */
export interface UseStepActions {
  /**
   * Whether navigation to next step is possible
   */
  canGoToNextStep: boolean;
  /**
   * Whether navigation to previous step is possible
   */
  canGoToPrevStep: boolean;
  /**
   * Memoized function to advance to the next step
   */
  goToNextStep: () => void;
  /**
   * Memoized function to go back to the previous step
   */
  goToPrevStep: () => void;
  /**
   * Memoized function to reset to step 1
   */
  reset: () => void;
  /**
   * Direct step setter with boundary validation
   */
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * React hook for step navigation in multi-step processes.
 *
 * Manages step state with automatic boundary checking and convenient navigation methods.
 * Perfect for wizards, onboarding flows, and multi-step forms.
 *
 * **When to use:**
 * - ✅ Onboarding sequences - Guide users through registration, setup, or tutorial flows
 * - ✅ Form wizards - Break complex forms into digestible, validated steps
 * - ✅ Checkout processes - Navigate through cart, shipping, payment, and confirmation
 * - ✅ Installation guides - Step-by-step software configuration or setup processes
 * - ✅ Survey flows - Multi-page questionnaires with conditional logic
 * - ✅ Tutorial systems - Interactive guided tours with progress tracking
 * - ❌ For simple page navigation - React Router handles route-based flows better
 *
 * **Features:**
 * - Automatic boundary checking - Prevents navigation beyond step range
 * - Convenient helpers - goToNextStep, goToPrevStep, reset methods
 * - Boundary validation - Boolean flags for navigation state
 * - Flexible step setting - Direct setter with boundary validation
 * - Memoized callbacks - Prevents unnecessary re-renders
 *
 * **Note:** Steps use 1-based numbering (starts at 1, not 0) to match UI conventions.
 *
 * @param maxStep - The maximum step in the process (must be >= 1)
 * @returns Tuple `[currentStep, actions]` where actions contains navigation methods
 *
 * @example
 * ```tsx
 * // Basic wizard
 * const [currentStep, { goToNextStep, goToPrevStep, canGoToNextStep }] = useStep(5);
 *
 * <div>Step {currentStep} of 5</div>
 * <button onClick={goToPrevStep} disabled={currentStep === 1}>Back</button>
 * <button onClick={goToNextStep} disabled={!canGoToNextStep}>Next</button>
 * ```
 *
 * @example
 * ```tsx
 * // With validation
 * const [step, { goToNextStep }] = useStep(3);
 * const [isValid, setIsValid] = useState(false);
 *
 * <button onClick={goToNextStep} disabled={!isValid || step === 3}>
 *   Next
 * </button>
 * ```
 *
 * @example
 * ```tsx
 * // Jump to specific step
 * const [step, { setStep }] = useStep(10);
 *
 * <button onClick={() => setStep(5)}>Go to step 5</button>
 * ```
 */
export function useStep(maxStep: number): [number, UseStepActions] {
  if (maxStep < 1) {
    throw new Error('useStep: maxStep must be >= 1');
  }

  const [currentStep, setCurrentStep] = useState(1);

  const canGoToNextStep = currentStep < maxStep;
  const canGoToPrevStep = currentStep > 1;

  const goToNextStep = useCallback(() => {
    if (canGoToNextStep) {
      setCurrentStep((prev) => Math.min(prev + 1, maxStep));
    }
  }, [canGoToNextStep, maxStep]);

  const goToPrevStep = useCallback(() => {
    if (canGoToPrevStep) {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  }, [canGoToPrevStep]);

  const reset = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const setStep = useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (value) => {
      setCurrentStep((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        // Clamp to valid range
        return Math.max(1, Math.min(next, maxStep));
      });
    },
    [maxStep]
  );

  return [
    currentStep,
    {
      canGoToNextStep,
      canGoToPrevStep,
      goToNextStep,
      goToPrevStep,
      reset,
      setStep,
    },
  ];
}
