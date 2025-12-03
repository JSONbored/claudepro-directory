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

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import {
  alignItems,
  backdrop,
  borderBottom,
  borderTop,
  gap,
  iconSize,
  justify,
  marginTop,
  maxWidth,
  minHeight,
  muted,
  display,
  padding,
  size,
  weight,
  zLayer,
  flexGrow,
  position,
  sticky,
  container,
  textAlign,
  radius,
  border,
} from '@heyclaude/web-runtime/design-system';
import { ArrowLeft, ArrowRight, Save, X } from '@heyclaude/web-runtime/icons';
import type { SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
import { bgColor, borderColor, submissionFormColors } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import { useFormTracking } from '@heyclaude/web-runtime/hooks';
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
      className={cn(`${position.relative} ${minHeight.screen}`, bgColor.background, className)}
    >
      {/* Header */}
      <header
        className={`${sticky.top} ${zLayer.fixed} ${borderBottom.default} ${backdrop.sm}`}
        style={{
          backgroundColor: `${submissionFormColors.background.primary}e6`,
          borderColor: submissionFormColors.border.light,
        }}
      >
        <div className={`${container.default} ${maxWidth['4xl']} ${padding.xDefault} ${padding.yDefault}`}>
          <div className={`${display.flex} ${alignItems.center} ${justify.between}`}>
            {/* Exit Button */}
            <Button type="button" variant="ghost" size="sm" onClick={handleExit} className={`${gap.compact}`}>
              <X className={iconSize.sm} />
              <span className={`${display.none} sm:inline`}>Exit</span>
            </Button>

            {/* Title */}
            <div className={`${flexGrow['1']} ${textAlign.center}`}>
              <h1 className={`${weight.semibold} ${size.lg}`}>Submit Configuration</h1>
              <p className={muted.sm}>
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
              className={`${gap.compact}`}
            >
              <Save className={iconSize.sm} />
              <span className={`${display.none} sm:inline`}>{isSaving ? 'Saving...' : saveLabel}</span>
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className={marginTop.default}>
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
      <main className={`${container.default} ${maxWidth['4xl']} ${padding.xDefault} ${padding.yRelaxed}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={animation.spring.smooth}
            className={minHeight.viewport60}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer
        className={cn(`${sticky.bottom} ${zLayer.fixed} ${borderTop.default} ${backdrop.sm}`)}
        style={{
          backgroundColor: `${submissionFormColors.background.primary}e6`,
          borderColor: submissionFormColors.border.light,
        }}
      >
        <div className={`${container.default} ${maxWidth['4xl']} ${padding.xDefault} ${padding.yDefault}`}>
          <div className={`${display.flex} ${alignItems.center} ${justify.between} ${gap.comfortable}`}>
            {/* Previous Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious || currentStep === 1}
              className={`${gap.compact}`}
            >
              <ArrowLeft className={iconSize.sm} />
              {previousLabel}
            </Button>

            {/* Step Indicator (Mobile) */}
            <div className={`${textAlign.center} ${muted.sm} md:${display.none}`}>
              {currentStep} / {steps.length}
            </div>

            {/* Next/Submit Button */}
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext || isNavigating}
              className={`${gap.compact}`}
            >
              {isNavigating ? (
                'Loading...'
              ) : isLastStep ? (
                'Submit for Review'
              ) : (
                <>
                  {nextLabel || 'Next'}
                  <ArrowRight className={iconSize.sm} />
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className={`${marginTop.compact} ${textAlign.center} ${muted.default} ${size.xs}`}>
            <kbd
              className={cn(`${radius.default} ${border.default} ${padding.xSnug} ${padding.yHair} font-mono ${size.xs}`, borderColor.border, bgColor.muted)}
            >
              ⌘S
            </kbd>{' '}
            to save draft •{' '}
            <kbd
              className={cn(`rounded border ${padding.xSnug} ${padding.yHair} font-mono ${size.xs}`, borderColor.border, bgColor.muted)}
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
