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

import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { useFormTracking } from '@/src/hooks/use-form-tracking';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@/src/lib/design-tokens/submission-form';
import { ArrowLeft, ArrowRight, Save, X } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { SubmissionContentType } from '@/src/lib/types/component.types';
import { cn } from '@/src/lib/utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import { ProgressIndicator, type WizardStep } from './progress-indicator';

interface WizardLayoutProps {
  children: ReactNode;
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext?: () => void | Promise<void>;
  onPrevious?: () => void;
  onSave?: () => void | Promise<void>;
  onExit?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  isLastStep?: boolean;
  qualityScore?: number;
  submissionType?: SubmissionContentType;
  className?: string;
  nextLabel?: string;
  previousLabel?: string;
  saveLabel?: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle exit confirmation
  const handleExit = useCallback(() => {
    if (onExit) {
      onExit();
    } else {
      // Default: navigate back to submit page
      const hasChanges = qualityScore && qualityScore > 0;
      if (hasChanges) {
        const confirmed = window.confirm(
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

    setIsSaving(true);
    try {
      await onSave();
      await formTracking.trackDraftSaved({
        submission_type: submissionType,
        step: currentStep,
        ...(qualityScore !== undefined ? { quality_score: qualityScore } : {}),
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to save draft');
      logger.warn('Failed to save draft', { error: normalized.message });
    } finally {
      setIsSaving(false);
    }
  }, [onSave, formTracking, submissionType, currentStep, qualityScore]);

  // Handle next step
  const handleNext = useCallback(async () => {
    if (!(canGoNext && onNext)) return;

    setIsNavigating(true);
    try {
      await onNext();
      await formTracking.trackStepCompleted(currentStep, steps[currentStep - 1]?.label || '', {
        submission_type: submissionType,
        ...(qualityScore !== undefined ? { quality_score: qualityScore } : {}),
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to navigate to next step');
      logger.warn('Failed to navigate to next step', { error: normalized.message });
    } finally {
      setIsNavigating(false);
    }
  }, [canGoNext, onNext, formTracking, currentStep, steps, submissionType, qualityScore]);

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
          logger.error('WizardLayout: handleSave failed in keyboard shortcut', normalized);
        });
      }

      // Escape to exit
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
              <h1 className="font-semibold text-lg">Submit Configuration</h1>
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
              {...(qualityScore !== undefined ? { qualityScore } : {})}
            />
          </div>
        </div>
      </header>

      {/* Main Content with Step Transition */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={TOKENS.animations.spring.smooth}
            className="min-h-[60vh]"
          >
            {children}
          </motion.div>
        </AnimatePresence>
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
            <div className="text-center text-muted-foreground text-sm md:hidden">
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
          <div className="mt-3 text-center text-muted-foreground text-xs">
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
