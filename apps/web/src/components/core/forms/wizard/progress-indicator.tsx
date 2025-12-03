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
  display,
  padding,
  radius,
  iconSize,
  size,
  textColor,
  transition,
  weight,
  zLayer,
  skeletonSize,
  glowShadow,
  shadow,
  submissionFormColors,
  position,
  absolute,
  width,
  height,
  borderWidth,
  marginLeft,
  textAlign,
  cursor,
  pointerEvents,
  whitespace,
  minWidth,
  marginX,
  border,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
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
    <div className={cn(width.full, className)}>
      {/* Quality Score Badge (if provided) */}
      {qualityScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(`${marginBottom.default} ${display.flex} ${alignItems.center} ${justify.between} ${radius.lg} ${border.default} ${borderColor['border/50']} ${padding.compact}`)}
        >
          <span className={muted.sm}>Form Completion</span>
          <div className={cluster.compact}>
            <div className={`${skeletonSize.progressBar} ${overflow.hidden} ${radius.full} ${bgColor.background}`}>
              <motion.div
                className={`${height.full} ${radius.full}`}
                initial={{ width: 0 }}
                animate={{ width: `${qualityScore}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  style: {
                    backgroundColor:
                      qualityScore >= 90
                        ? submissionFormColors.success.text
                        : qualityScore >= 70
                          ? submissionFormColors.accent.primary
                          : qualityScore >= 40
                            ? submissionFormColors.warning.text
                            : submissionFormColors.error.text,
                  },
                }}
              />
            </div>
            <span className={`${minWidth.char3} ${textAlign.right} ${weight.semibold} ${size.sm}`}>{qualityScore}%</span>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className={`${position.relative} ${marginBottom.relaxed} ${height.slider} ${width.full} ${overflow.hidden} ${radius.full} ${bgColor.background}`}>
        <motion.div
          className={cn(`${absolute.topLeft} ${height.full} ${radius.full}`, bgColor.accent)}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={animation.spring.smooth}
          style={{
            boxShadow: glowShadow.orange,
          }}
        />
      </div>

      {/* Step Indicators - Desktop */}
      <div className={`${display.none} ${alignItems.center} ${justify.between} md:${display.flex}`}>
        {steps.map((step, index) => (
          <div key={step.id} className={`${display.flex} ${flexGrow['1']} ${alignItems.center}`}>
            {/* Step Circle */}
            <button
              type="button"
              onClick={() => step.isAccessible && onStepClick?.(step.number)}
              disabled={!step.isAccessible}
              className={cn(
                `group ${position.relative} ${display.flex} ${iconSize['2xl']} ${alignItems.center} ${justify.center} ${radius.full} ${borderWidth['2']} ${transition.all}`,
                step.isCurrent && 'scale-110',
                step.isAccessible && `${cursor.pointer} hover:scale-110`,
                !step.isAccessible && `${cursor.notAllowed} ${opacityLevel[50]}`
              )}
              style={{
                borderColor:
                  step.isCompleted || step.isCurrent
                    ? submissionFormColors.accent.primary
                    : submissionFormColors.border.default,
                backgroundColor: step.isCompleted
                  ? submissionFormColors.accent.primary
                  : step.isCurrent
                    ? submissionFormColors.background.elevated
                    : submissionFormColors.background.secondary,
                boxShadow: step.isCurrent ? glowShadow.orange : 'none',
              }}
            >
              {step.isCompleted ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={animation.spring.bouncy}
                >
                  <CheckCircle className={`${iconSize.md} ${textColor.white}`} />
                </motion.div>
              ) : (
                <span
                  className={cn(
                    `${weight.semibold} ${size.sm}`,
                    step.isCurrent ? textColor.accent : muted.default
                  )}
                >
                  {step.number}
                </span>
              )}

              {/* Tooltip on hover */}
              {step.description && step.isAccessible && (
                <div
                  className={`-top-12 -translate-x-1/2 ${pointerEvents.none} ${absolute.centerX} ${zLayer.modal} ${whitespace.nowrap} ${radius.md} ${padding.xCompact} ${padding.ySnug} ${size.xs} ${opacityLevel[0]} ${transition.opacity} group-hover:${opacityLevel[100]}`}
                  style={{
                    backgroundColor: submissionFormColors.background.elevated,
                    border: `1px solid ${submissionFormColors.border.medium}`,
                    boxShadow: shadow.lg,
                  }}
                >
                  {step.description}
                </div>
              )}
            </button>

            {/* Label */}
            <div className={`${marginLeft.default} ${flexGrow['1']}`}>
              <div
                className={cn(
                  `${weight.medium} ${size.sm}`,
                  step.isCurrent ? textColor.foreground : muted.default
                )}
              >
                {step.label}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`${position.relative} ${marginX.comfortable} ${height.hairline} ${flexGrow['1']}`}>
                <div
                  className={`${absolute.inset} ${radius.full}`}
                  style={{ backgroundColor: submissionFormColors.border.default }}
                />
                <motion.div
                  className={`${absolute.inset} ${radius.full}`}
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: step.isCompleted ? 1 : 0,
                  }}
                  transition={animation.spring.smooth}
                  style={{
                    backgroundColor: submissionFormColors.accent.primary,
                    transformOrigin: 'left',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Indicators - Mobile (Compact) */}
      <div className={`${display.flex} ${alignItems.center} ${justify.center} ${gap.compact} md:${display.none}`}>
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => step.isAccessible && onStepClick?.(step.number)}
            disabled={!step.isAccessible}
            className={cn(
              `${display.flex} ${iconSize.xl} ${alignItems.center} ${justify.center} ${radius.full} ${borderWidth['2']} ${transition.all}`,
              step.isCurrent && 'scale-125',
              step.isAccessible && cursor.pointer,
              !step.isAccessible && `${cursor.notAllowed} ${opacityLevel[50]}`
            )}
              style={{
                borderColor:
                  step.isCompleted || step.isCurrent
                    ? submissionFormColors.accent.primary
                    : submissionFormColors.border.default,
                backgroundColor: step.isCompleted
                  ? submissionFormColors.accent.primary
                  : step.isCurrent
                    ? submissionFormColors.background.elevated
                    : submissionFormColors.background.secondary,
                boxShadow: step.isCurrent ? glowShadow.orange : 'none',
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
      <div className={`${marginTop.default} ${textAlign.center} md:${display.none}`}>
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
