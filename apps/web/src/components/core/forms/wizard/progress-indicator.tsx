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
import {
  bgColor,
  borderColor,
  cluster,
  flexGrow,
  gap,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  opacityLevel,
  overflow,
  padding,
  radius,
  iconSize,
  size,
  textColor,
  transition,
  weight,
  zLayer,
  skeletonSize,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/ui/design-tokens/submission-form';
import { motion } from 'motion/react';

export interface WizardStep {
  id: string;
  number: number;
  label: string;
  shortLabel?: string; // For mobile
  description?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean; // Can navigate to this step
}

interface ProgressIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  qualityScore?: number;
  className?: string;
}

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
          className={`${marginBottom.default} flex ${alignItems.center} ${justify.between} ${radius.lg} border ${borderColor['border/50']} bg-background-secondary ${padding.compact}`}
          style={{
            borderColor: TOKENS.colors.border.light,
            backgroundColor: TOKENS.colors.background.secondary,
          }}
        >
          <span className={muted.sm}>Form Completion</span>
          <div className={cluster.compact}>
            <div className={`${skeletonSize.progressBar} ${overflow.hidden} ${radius.full} ${bgColor.background}`}>
              <motion.div
                className={`h-full ${radius.full}`}
                initial={{ width: 0 }}
                animate={{ width: `${qualityScore}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
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
            <span className={`min-w-[3ch] text-right ${weight.semibold} ${size.sm}`}>{qualityScore}%</span>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className={`relative ${marginBottom.relaxed} h-1 w-full ${overflow.hidden} ${radius.full} ${bgColor.background}`}>
        <motion.div
          className={`absolute top-0 left-0 h-full ${radius.full}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={TOKENS.animations.spring.smooth}
          style={{
            backgroundColor: TOKENS.colors.accent.primary,
            boxShadow: TOKENS.shadows.glow.orange,
          }}
        />
      </div>

      {/* Step Indicators - Desktop */}
      <div className={`hidden ${alignItems.center} ${justify.between} md:flex`}>
        {steps.map((step, index) => (
          <div key={step.id} className={`flex ${flexGrow['1']} ${alignItems.center}`}>
            {/* Step Circle */}
            <button
              type="button"
              onClick={() => step.isAccessible && onStepClick?.(step.number)}
              disabled={!step.isAccessible}
              className={cn(
                `group relative flex ${iconSize['2xl']} ${alignItems.center} ${justify.center} ${radius.full} border-2 ${transition.all}`,
                step.isCurrent && 'scale-110',
                step.isAccessible && 'cursor-pointer hover:scale-110',
                !step.isAccessible && `cursor-not-allowed ${opacityLevel[50]}`
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
                  transition={TOKENS.animations.spring.bouncy}
                >
                  <CheckCircle className={`${iconSize.md} ${textColor.white}`} />
                </motion.div>
              ) : (
                <span
                  className={cn(
                    `${weight.semibold} ${size.sm}`,
                    step.isCurrent ? 'text-accent-primary' : muted.default
                  )}
                >
                  {step.number}
                </span>
              )}

              {/* Tooltip on hover */}
              {step.description && step.isAccessible && (
                <div
                  className={`-top-12 -translate-x-1/2 pointer-events-none absolute left-1/2 ${zLayer.modal} whitespace-nowrap ${radius.md} ${padding.xCompact} ${padding.ySnug} ${size.xs} ${opacityLevel[0]} ${transition.opacity} group-hover:opacity-100`}
                  style={{
                    backgroundColor: TOKENS.colors.background.elevated,
                    border: `1px solid ${TOKENS.colors.border.medium}`,
                    boxShadow: TOKENS.shadows.lg,
                  }}
                >
                  {step.description}
                </div>
              )}
            </button>

            {/* Label */}
            <div className={`ml-3 ${flexGrow['1']}`}>
              <div
                className={cn(
                  `${weight.medium} ${size.sm}`,
                  step.isCurrent ? 'text-foreground' : muted.default
                )}
              >
                {step.label}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`relative mx-4 h-0.5 ${flexGrow['1']}`}>
                <div
                  className={`absolute inset-0 ${radius.full}`}
                  style={{ backgroundColor: TOKENS.colors.border.default }}
                />
                <motion.div
                  className={`absolute inset-0 ${radius.full}`}
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: step.isCompleted ? 1 : 0,
                  }}
                  transition={TOKENS.animations.spring.smooth}
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
      <div className={`flex ${alignItems.center} ${justify.center} ${gap.compact} md:hidden`}>
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => step.isAccessible && onStepClick?.(step.number)}
            disabled={!step.isAccessible}
            className={cn(
              `flex ${iconSize.xl} ${alignItems.center} ${justify.center} ${radius.full} border-2 ${transition.all}`,
              step.isCurrent && 'scale-125',
              step.isAccessible && 'cursor-pointer',
              !step.isAccessible && `cursor-not-allowed ${opacityLevel[50]}`
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
              <CheckCircle className={`${iconSize.sm} ${textColor.white}`} />
            ) : (
              <span
                className={cn(
                  `${weight.semibold} ${size.xs}`,
                  step.isCurrent ? 'text-accent-primary' : muted.default
                )}
              >
                {step.number}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current Step Label - Mobile Only */}
      <div className={`${marginTop.default} text-center md:hidden`}>
        <div className={`${weight.medium} ${textColor.foreground} ${size.sm}`}>
          {steps.find((s) => s.isCurrent)?.label || 'Step'}
        </div>
        <div className={`${marginTop.tight} ${muted.default} ${size.xs}`}>
          Step {currentStep} of {steps.length}
        </div>
      </div>
    </div>
  );
}
