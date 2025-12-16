'use client';

/**
 * Quiz Progress Component
 * Displays progress bar and question counter for quiz
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import { POSITION_PATTERNS, UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { between, cluster, iconSize, spaceY } from "@heyclaude/web-runtime/design-system";

interface QuizProgressProps {
  currentQuestion: number;
  percentComplete: number;
  totalQuestions: number;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  percentComplete,
}: QuizProgressProps) {
  return (
    <div className={`${spaceY.default}`}>
      {/* Question counter */}
      <div className={between.center}>
        <div className={cluster.compact}>
          <span className="text-sm font-medium">Progress</span>
          <UnifiedBadge variant="base" style="secondary">
            {currentQuestion} / {totalQuestions}
          </UnifiedBadge>
        </div>
        {percentComplete === 100 && (
          <div className={`${cluster.compact} text-primary text-sm`}>
            <CheckCircle className={iconSize.sm} />
            <span>Complete!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
        <div
          className={`${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} bg-primary h-full transition-all duration-300 ease-in-out`}
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
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              step < currentQuestion
                ? 'bg-primary text-primary-foreground'
                : step === currentQuestion
                  ? 'border-primary bg-primary/20 text-primary border-2'
                  : 'bg-muted text-muted-foreground'
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
