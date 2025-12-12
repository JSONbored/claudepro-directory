'use client';

/**
 * Progress Indicator - Wizard Step Navigation
 *
 * Displays current step progress with visual feedback.
 * Supports step navigation, completion states, and animations.
 *
 * Features:
 * - Visual step progress (completed/current/upcoming)
 * - Click-to-navigate (only to completed steps)
 * - Responsive design (stacked on mobile, horizontal on desktop)
 * - Animated transitions with motion.dev
 * - Quality score integration
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/design-tokens';
import { SPRING, DURATION } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';

export interface WizardStep {
  description?: string;
  id: string;
  isAccessible: boolean; // Can navigate to this step
  isCompleted: boolean;
  isCurrent: boolean;
  label: string;
  number: number;
  shortLabel?: string; // For mobile
}

interface ProgressIndicatorProps {
  className?: string;
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  qualityScore?: number;
  steps: WizardStep[];
}

/**
 * Renders a responsive wizard progress indicator with optional quality score and interactive step controls.
 *
 * Renders a horizontal progress bar, desktop step indicators with labels and connectors, compact mobile step buttons, and an optional "Form Completion" quality badge. Step buttons are interactive only when the step's `isAccessible` is true; completed steps show a checkmark and the current step is visually emphasized.
 *
 * @param steps - Array of wizard steps to display; each step controls its label, number, completion, current state, accessibility, and optional description tooltip.
 * @param currentStep - The 1-based index or number of the current step for display in the mobile summary.
 * @param onStepClick - Optional callback invoked with a step's `number` when an accessible step is clicked.
 * @param qualityScore - Optional numeric score (0–100) shown in the quality badge and its progress bar.
 * @param className - Optional additional CSS classes applied to the root container.
 * @returns The rendered progress indicator React element.
 *
 * @see WizardStep
 * @see ProgressIndicatorProps
 */
export function ProgressIndicator({
  steps,
  currentStep,
  onStepClick,
  qualityScore,
  className,
}: ProgressIndicatorProps) {
  const completedSteps = steps.filter((s) => s.isCompleted).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Quality Score Badge (if provided) */}
      {qualityScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-border/50 bg-background-secondary mb-4 flex items-center justify-between rounded-lg border p-3"
          style={{
            borderColor: TOKENS.colors.border.light,
            backgroundColor: TOKENS.colors.background.secondary,
          }}
        >
          <span className="text-muted-foreground text-sm">Form Completion</span>
          <div className="flex items-center gap-2">
            <div className="bg-background h-2 w-32 overflow-hidden rounded-full">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${qualityScore}%` }}
                transition={{ duration: DURATION.moderate, ease: 'easeOut' }}
                style={{
                  backgroundColor:
                    qualityScore >= 90
                      ? TOKENS.colors.success.text
                      : qualityScore >= 70
                        ? TOKENS.colors.accent.primary
                        : qualityScore >= 40
                          ? TOKENS.colors.warning.text
                          : TOKENS.colors.error.text,
                }}
              />
            </div>
            <span className="min-w-[3ch] text-right text-sm font-semibold">{qualityScore}%</span>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="bg-background relative mb-8 h-1 w-full overflow-hidden rounded-full">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={SPRING.smooth}
          style={{
            backgroundColor: TOKENS.colors.accent.primary,
            boxShadow: TOKENS.shadows.glow.orange,
          }}
        />
      </div>

      {/* Step Indicators - Desktop */}
      <div className="hidden items-center justify-between md:flex">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            {/* Step Circle */}
            <button
              type="button"
              onClick={() => step.isAccessible && onStepClick?.(step.number)}
              disabled={!step.isAccessible}
              className={cn(
                'group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                step.isCurrent && 'scale-110',
                step.isAccessible && 'cursor-pointer hover:scale-110',
                !step.isAccessible && 'cursor-not-allowed opacity-50'
              )}
              style={{
                borderColor:
                  step.isCompleted || step.isCurrent
                    ? TOKENS.colors.accent.primary
                    : TOKENS.colors.border.default,
                backgroundColor: step.isCompleted
                  ? TOKENS.colors.accent.primary
                  : step.isCurrent
                    ? TOKENS.colors.background.elevated
                    : TOKENS.colors.background.secondary,
                boxShadow: step.isCurrent ? TOKENS.shadows.glow.orange : 'none',
              }}
            >
              {step.isCompleted ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={SPRING.bouncy}
                >
                  <CheckCircle className="h-5 w-5 text-white" />
                </motion.div>
              ) : (
                <span
                  className={cn(
                    'text-sm font-semibold',
                    step.isCurrent ? 'text-accent-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.number}
                </span>
              )}

              {/* Tooltip on hover */}
              {step.description && step.isAccessible ? (
                <div
                  className="pointer-events-none absolute -top-12 left-1/2 z-50 -translate-x-1/2 rounded-md px-3 py-1.5 text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    backgroundColor: TOKENS.colors.background.elevated,
                    border: `1px solid ${TOKENS.colors.border.medium}`,
                    boxShadow: TOKENS.shadows.lg,
                  }}
                >
                  {step.description}
                </div>
              ) : null}
            </button>

            {/* Label */}
            <div className="ml-3 flex-1">
              <div
                className={cn(
                  'text-sm font-medium',
                  step.isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="relative mx-4 h-0.5 flex-1">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: TOKENS.colors.border.default }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: step.isCompleted ? 1 : 0,
                  }}
                  transition={SPRING.smooth}
                  style={{
                    backgroundColor: TOKENS.colors.accent.primary,
                    transformOrigin: 'left',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Indicators - Mobile (Compact) */}
      <div className="flex items-center justify-center gap-2 md:hidden">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => step.isAccessible && onStepClick?.(step.number)}
            disabled={!step.isAccessible}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
              step.isCurrent && 'scale-125',
              step.isAccessible && 'cursor-pointer',
              !step.isAccessible && 'cursor-not-allowed opacity-50'
            )}
            style={{
              borderColor:
                step.isCompleted || step.isCurrent
                  ? TOKENS.colors.accent.primary
                  : TOKENS.colors.border.default,
              backgroundColor: step.isCompleted
                ? TOKENS.colors.accent.primary
                : step.isCurrent
                  ? TOKENS.colors.background.elevated
                  : TOKENS.colors.background.secondary,
              boxShadow: step.isCurrent ? TOKENS.shadows.glow.orange : 'none',
            }}
            aria-label={step.label}
            title={step.label}
          >
            {step.isCompleted ? (
              <CheckCircle className="h-4 w-4 text-white" />
            ) : (
              <span
                className={cn(
                  'text-xs font-semibold',
                  step.isCurrent ? 'text-accent-primary' : 'text-muted-foreground'
                )}
              >
                {step.number}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current Step Label - Mobile Only */}
      <div className="mt-4 text-center md:hidden">
        <div className="text-foreground text-sm font-medium">
          {steps.find((s) => s.isCurrent)?.label || 'Step'}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          Step {currentStep} of {steps.length}
        </div>
      </div>
    </div>
  );
}