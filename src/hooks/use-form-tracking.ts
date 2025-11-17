/**
 * Form Tracking Hook
 *
 * Wraps usePulse() for form-specific event tracking.
 * Tracks all form interactions for analytics and funnel optimization.
 *
 * Usage:
 * ```tsx
 * const formTracking = useFormTracking();
 * formTracking.trackStart('agents');
 * formTracking.trackStepCompleted(2, 'basic_info');
 * ```
 */

import { useCallback, useMemo } from 'react';
import { usePulse } from '@/src/hooks/use-pulse';
import type { SubmissionContentType } from '@/src/lib/types/component.types';

/**
 * Form tracking event metadata
 */
export interface FormTrackingMetadata {
  submission_type?: SubmissionContentType;
  step?: number;
  step_name?: string;
  field_name?: string;
  template_id?: string;
  template_name?: string;
  quality_score?: number;
  validation_errors?: string[];
  time_spent?: number;
  [key: string]: unknown;
}

/**
 * Form tracking hook
 */
export function useFormTracking() {
  const pulse = usePulse();

  /**
   * Track form started
   */
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

  /**
   * Track step completed
   */
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

  /**
   * Track field focused
   */
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

  /**
   * Track template selected
   */
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

  /**
   * Track form abandoned
   */
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

  /**
   * Track form submitted
   */
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

  /**
   * Track validation error
   */
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

  /**
   * Track draft saved
   */
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

  /**
   * Track draft loaded
   */
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
 * Track time spent on a step
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
