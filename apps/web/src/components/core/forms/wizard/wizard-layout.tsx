'use client';

/**
 * Wizard Layout - Full-Screen Wizard Container
 *
 * Provides the main container for the multi-step submission wizard.
 * Handles step transitions, navigation, and layout structure.
 *
 * Features:
 * - Full-screen immersive experience
 * - Step-based navigation with validation
 * - Progress tracking
 * - Draft auto-save integration
 * - Mobile-responsive layout
 * - Animated step transitions
 */

import { useFormTracking } from '@heyclaude/web-runtime/hooks';
import { ArrowLeft, ArrowRight, Save, X } from '@heyclaude/web-runtime/icons';
import { logClientError, logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { type SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { cn, Button } from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/design-tokens';
import { useAnimateScoped } from '@heyclaude/web-runtime/hooks/motion';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks';

import { ProgressIndicator, type WizardStep } from './progress-indicator';

interface WizardLayoutProps {
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  children: ReactNode;
  className?: string;
  currentStep: number;
  isLastStep?: boolean;
  nextLabel?: string;
  onExit?: () => void;
  onNext?: () => Promise<void> | void;
  onPrevious?: () => void;
  onSave?: () => Promise<void> | void;
  onStepChange: (step: number) => void;
  previousLabel?: string;
  qualityScore?: number;
  saveLabel?: string;
  steps: WizardStep[];
  submissionType?: SubmissionContentType;
}

export function WizardLayout({
  children,
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onSave,
  onExit,
  canGoNext = true,
  canGoPrevious = true,
  isLastStep = false,
  qualityScore,
  submissionType = 'agents',
  className,
  nextLabel,
  previousLabel = 'Back',
  saveLabel = 'Save Draft',
}: WizardLayoutProps) {
  const router = useRouter();
  const formTracking = useFormTracking();
  const { value: isSaving, setTrue: setIsSavingTrue, setFalse: setIsSavingFalse } = useBoolean();
  const { value: isNavigating, setTrue: setIsNavigatingTrue, setFalse: setIsNavigatingFalse } = useBoolean();
  const [, animate] = useAnimateScoped();
  const previousStepRef = useRef(currentStep);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle exit confirmation
  const handleExit = useCallback(() => {
    if (onExit) {
      onExit();
    } else {
      // Default: navigate back to submit page
      const hasChanges = qualityScore && qualityScore > 0;
      if (hasChanges) {
        const confirmed = globalThis.confirm(
          'You have unsaved changes. Your draft will be saved automatically. Continue?'
        );
        if (!confirmed) return;
      }
      router.push('/submit');
    }
  }, [onExit, qualityScore, router]);

  // Handle save draft
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setIsSavingTrue();
    try {
      await onSave();
      await formTracking.trackDraftSaved({
        submission_type: submissionType,
        step: currentStep,
        ...(qualityScore === undefined ? {} : { quality_score: qualityScore }),
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to save draft');
      logClientWarn(
        'Failed to save draft',
        normalized,
        'WizardLayout.handleSave',
        {
          component: 'WizardLayout',
          action: 'save-draft',
          error: normalized.message,
        }
      );
    } finally {
      setIsSavingFalse();
    }
  }, [onSave, formTracking, submissionType, currentStep, qualityScore, setIsSavingTrue, setIsSavingFalse]);

  // Handle next step
  // Animate step transition programmatically
  useEffect(() => {
    if (previousStepRef.current !== currentStep && contentRef.current) {
      const stepDirection = currentStep > previousStepRef.current ? 1 : -1;
      
      // Coordinate animations: fade out, then fade in with slide
      animate(contentRef.current, { opacity: 0, x: stepDirection * 20 }, { duration: 0.15 })
        .then(() => {
          if (contentRef.current) {
            animate(contentRef.current, { opacity: 1, x: 0 }, { duration: 0.3, ease: [0.22, 1, 0.36, 1] });
          }
        });
      
      previousStepRef.current = currentStep;
    }
  }, [currentStep, animate]);

  const handleNext = useCallback(async () => {
    if (!(canGoNext && onNext)) return;

    setIsNavigatingTrue();
    try {
      await onNext();
      await formTracking.trackStepCompleted(currentStep, steps[currentStep - 1]?.label || '', {
        submission_type: submissionType,
        ...(qualityScore === undefined ? {} : { quality_score: qualityScore }),
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to navigate to next step');
      logClientWarn(
        'Failed to navigate to next step',
        normalized,
        'WizardLayout.handleNext',
        {
          component: 'WizardLayout',
          action: 'navigate-next',
          error: normalized.message,
        }
      );
    } finally {
      setIsNavigatingFalse();
    }
  }, [canGoNext, onNext, formTracking, currentStep, steps, submissionType, qualityScore, setIsNavigatingTrue, setIsNavigatingFalse]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (!(canGoPrevious && onPrevious)) return;
    onPrevious();
  }, [canGoPrevious, onPrevious]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave().catch((error) => {
          // Error handling is done inside handleSave, but we need to catch to prevent floating promise
          const normalized = normalizeError(
            error,
            'WizardLayout: handleSave failed in keyboard shortcut'
          );
          logClientError(
            '[Form] HandleSave failed in keyboard shortcut',
            normalized,
            'WizardLayout.handleKeyDown',
            {
              component: 'WizardLayout',
              action: 'keyboard-shortcut-save',
              category: 'form',
            }
          );
        });
      }

      // Escape to exit
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleExit]);

  return (
    <div
      className={cn('relative min-h-screen', className)}
      style={{
        backgroundColor: TOKENS.colors.background.primary,
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-sm"
        style={{
          backgroundColor: `${TOKENS.colors.background.primary}e6`, // 90% opacity
          borderColor: TOKENS.colors.border.light,
        }}
      >
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Exit Button */}
            <Button type="button" variant="ghost" size="sm" onClick={handleExit} className="gap-2">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>

            {/* Title */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Submit Configuration</h1>
              <p className="text-muted-foreground text-sm">
                {steps[currentStep - 1]?.label || 'Loading...'}
              </p>
            </div>

            {/* Save Draft Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !onSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : saveLabel}</span>
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <ProgressIndicator
              steps={steps}
              currentStep={currentStep}
              onStepClick={onStepChange}
              {...(qualityScore === undefined ? {} : { qualityScore })}
            />
          </div>
        </div>
      </header>

      {/* Main Content with Step Transition */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div ref={contentRef} className="min-h-[60vh]">
          {children}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer
        className="sticky bottom-0 z-30 border-t backdrop-blur-sm"
        style={{
          backgroundColor: `${TOKENS.colors.background.primary}e6`, // 90% opacity
          borderColor: TOKENS.colors.border.light,
        }}
      >
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious || currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {previousLabel}
            </Button>

            {/* Step Indicator (Mobile) */}
            <div className="text-muted-foreground text-center text-sm md:hidden">
              {currentStep} / {steps.length}
            </div>

            {/* Next/Submit Button */}
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext || isNavigating}
              className="gap-2"
            >
              {isNavigating ? (
                'Loading...'
              ) : isLastStep ? (
                'Submit for Review'
              ) : (
                <>
                  {nextLabel || 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-muted-foreground mt-3 text-center text-xs">
            <kbd
              className="rounded border px-1.5 py-0.5 font-mono text-xs"
              style={{
                borderColor: TOKENS.colors.border.default,
                backgroundColor: TOKENS.colors.background.secondary,
              }}
            >
              ⌘S
            </kbd>{' '}
            to save draft •{' '}
            <kbd
              className="rounded border px-1.5 py-0.5 font-mono text-xs"
              style={{
                borderColor: TOKENS.colors.border.default,
                backgroundColor: TOKENS.colors.background.secondary,
              }}
            >
              ESC
            </kbd>{' '}
            to exit
          </div>
        </div>
      </footer>
    </div>
  );
}
