'use client';

/**
 * Quiz Progress Component
 * Displays progress bar and question counter for quiz
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import {
  absolute,
  animateDuration,
  between,
  bgColor,
  borderColor,
  cluster,
  iconSize,
  alignItems,
  justify,
  muted,
  overflow,
  radius,
  size,
  spaceY,
  textColor,
  transition,
  weight,
  display,
  position,
  height,
  width,
  borderWidth,
} from '@heyclaude/web-runtime/design-system';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  percentComplete: number;
}

/**
 * Displays a quiz progress summary with a counter badge, a horizontal progress bar, and step indicators.
 *
 * Renders the current question over the total in a badge, shows a "Complete!" indicator when `percentComplete` is 100,
 * provides a visual progress bar with appropriate ARIA attributes, and renders circular step indicators that reflect
 * completed, current, and pending states.
 *
 * @param currentQuestion - The 1-based index of the currently active question.
 * @param totalQuestions - The total number of questions in the quiz.
 * @param percentComplete - The overall completion percentage (0–100) used to size the progress bar.
 * @returns The rendered quiz progress UI element.
 *
 * @see UnifiedBadge
 * @see between
 * @see cluster
 * @see absolute
 */
export function QuizProgress({
  currentQuestion,
  totalQuestions,
  percentComplete,
}: QuizProgressProps) {
  return (
    <div className={spaceY.default}>
      {/* Question counter */}
      <div className={between.center}>
        <div className={cluster.compact}>
          <span className={`${weight.medium} ${size.sm}`}>Progress</span>
          <UnifiedBadge variant="base" style="secondary">
            {currentQuestion} / {totalQuestions}
          </UnifiedBadge>
        </div>
        {percentComplete === 100 && (
          <div className={`${cluster.compact} ${textColor.primary} ${size.sm}`}>
            <CheckCircle className={iconSize.sm} />
            <span>Complete!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className={`${position.relative} ${height.slider} ${width.full} ${overflow.hidden} ${radius.full} ${bgColor.muted}`}>
        <div
          className={`${absolute.topLeft} ${height.full} ${bgColor.primary} ${transition.all} ${animateDuration.slow}`}
          style={{ width: `${percentComplete}%` }}
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Quiz progress: ${percentComplete}% complete`}
        />
      </div>

      {/* Step indicators */}
      <div className={between.center}>
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`${display.flex} ${iconSize.xl} ${alignItems.center} ${justify.center} ${radius.full} ${weight.medium} ${size.xs} ${transition.colors} ${
              step < currentQuestion
                ? `${bgColor.primary} ${textColor.primaryForeground}`
                : step === currentQuestion
                  ? `${borderWidth['2']} ${borderColor.primary} ${bgColor['primary/20']} ${textColor.primary}`
                  : `${bgColor.muted} ${muted.default}`
            }`}
            title={`Question ${step}${step < currentQuestion ? ' (completed)' : step === currentQuestion ? ' (current)' : ''}`}
          >
            {step < currentQuestion ? <CheckCircle className={iconSize.sm} /> : step}
          </div>
        ))}
      </div>
    </div>
  );
}