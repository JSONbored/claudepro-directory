/**
 * Form Tracking Hook
 *
 * Wraps usePulse() for form-specific event tracking.
 * Tracks all form interactions for analytics and funnel optimization.
 *
 * @example
 * ```tsx
 * function SubmissionWizard() {
 *   const formTracking = useFormTracking();
 *
 *   useEffect(() => {
 *     formTracking.trackStart('agents');
 *   }, []);
 *
 *   const handleStepComplete = async (step: number) => {
 *     await formTracking.trackStepCompleted(step, 'basic_info');
 *   };
 *
 *   return <form>...</form>;
 * }
 * ```
 *
 * @module web-runtime/hooks/use-form-tracking
 */

import { usePulse } from './use-pulse.ts';
import type { SubmissionContentType } from '../types/component.types.ts';
import { useCallback, useMemo } from 'react';

/**
 * Metadata for form tracking events
 */
export interface FormTrackingMetadata {
  /** Type of submission being tracked */
  submission_type?: SubmissionContentType;
  /** Current step number */
  step?: number;
  /** Name of the current step */
  step_name?: string;
  /** Name of the field being interacted with */
  field_name?: string;
  /** ID of applied template */
  template_id?: string;
  /** Name of applied template */
  template_name?: string;
  /** Quality score of submission */
  quality_score?: number;
  /** List of validation errors */
  validation_errors?: string[];
  /** Time spent on current step in ms */
  time_spent?: number;
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Return type for useFormTracking hook
 */
export interface UseFormTrackingReturn {
  /** Track when form is started */
  trackStart: (submissionType: SubmissionContentType) => Promise<void>;
  /** Track when a step is completed */
  trackStepCompleted: (step: number, stepName: string, metadata?: FormTrackingMetadata) => Promise<void>;
  /** Track when a field receives focus */
  trackFieldFocused: (fieldName: string, metadata?: FormTrackingMetadata) => Promise<void>;
  /** Track when a template is selected */
  trackTemplateSelected: (templateId: string, templateName: string, submissionType: SubmissionContentType) => Promise<void>;
  /** Track when form is abandoned */
  trackAbandoned: (step: number, stepName: string, metadata?: FormTrackingMetadata) => Promise<void>;
  /** Track when form is submitted */
  trackSubmitted: (submissionType: SubmissionContentType, metadata?: FormTrackingMetadata) => Promise<void>;
  /** Track validation errors */
  trackValidationError: (fieldName: string, errorMessage: string, metadata?: FormTrackingMetadata) => Promise<void>;
  /** Track when draft is saved */
  trackDraftSaved: (metadata?: FormTrackingMetadata) => Promise<void>;
  /** Track when draft is loaded */
  trackDraftLoaded: (metadata?: FormTrackingMetadata) => Promise<void>;
}

/**
 * Hook for tracking form interactions
 * @returns Object with tracking functions for various form events
 */
export function useFormTracking(): UseFormTrackingReturn {
  const pulse = usePulse();

  const trackStart = useCallback(
    async (submissionType: SubmissionContentType) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_started',
          submission_type: submissionType,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackStepCompleted = useCallback(
    async (step: number, stepName: string, metadata?: FormTrackingMetadata) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_step_completed',
          step,
          step_name: stepName,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackFieldFocused = useCallback(
    async (fieldName: string, metadata?: FormTrackingMetadata) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_field_focused',
          field_name: fieldName,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackTemplateSelected = useCallback(
    async (templateId: string, templateName: string, submissionType: SubmissionContentType) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_template_selected',
          template_id: templateId,
          template_name: templateName,
          submission_type: submissionType,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackAbandoned = useCallback(
    async (step: number, stepName: string, metadata?: FormTrackingMetadata) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_abandoned',
          step,
          step_name: stepName,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackSubmitted = useCallback(
    async (submissionType: SubmissionContentType, metadata?: FormTrackingMetadata) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_submitted',
          submission_type: submissionType,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackValidationError = useCallback(
    async (fieldName: string, errorMessage: string, metadata?: FormTrackingMetadata) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_validation_error',
          field_name: fieldName,
          error_message: errorMessage,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackDraftSaved = useCallback(
    async (metadata?: FormTrackingMetadata) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_draft_saved',
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  const trackDraftLoaded = useCallback(
    async (metadata?: FormTrackingMetadata) => {
      await pulse.click({
        category: null,
        slug: null,
        metadata: {
          event: 'form_draft_loaded',
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [pulse]
  );

  return useMemo(
    () => ({
      trackStart,
      trackStepCompleted,
      trackFieldFocused,
      trackTemplateSelected,
      trackAbandoned,
      trackSubmitted,
      trackValidationError,
      trackDraftSaved,
      trackDraftLoaded,
    }),
    [
      trackStart,
      trackStepCompleted,
      trackFieldFocused,
      trackTemplateSelected,
      trackAbandoned,
      trackSubmitted,
      trackValidationError,
      trackDraftSaved,
      trackDraftLoaded,
    ]
  );
}

/**
 * Hook for tracking time spent on form steps
 *
 * @example
 * ```tsx
 * function WizardStep() {
 *   const timer = useStepTimer();
 *   const formTracking = useFormTracking();
 *
 *   const handleNext = async () => {
 *     await formTracking.trackStepCompleted(1, 'basic_info', {
 *       time_spent: timer.getElapsed(),
 *     });
 *     timer.reset();
 *   };
 * }
 * ```
 */
export function useStepTimer() {
  const startTimeRef = useMemo(() => ({ current: Date.now() }), []);

  const reset = useCallback(() => {
    startTimeRef.current = Date.now();
  }, [startTimeRef]);

  const getElapsed = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, [startTimeRef]);

  return useMemo(
    () => ({
      reset,
      getElapsed,
    }),
    [reset, getElapsed]
  );
}
