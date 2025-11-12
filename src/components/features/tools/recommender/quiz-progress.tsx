'use client';

/**
 * Quiz Progress Component
 * Displays progress bar and question counter for quiz
 */

import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { CheckCircle } from '@/src/lib/icons';
import { POSITION_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  percentComplete: number;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  percentComplete,
}: QuizProgressProps) {
  return (
    <div className="space-y-3">
      {/* Question counter */}
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <span className="font-medium text-sm">Progress</span>
          <UnifiedBadge variant="base" style="secondary">
            {currentQuestion} / {totalQuestions}
          </UnifiedBadge>
        </div>
        {percentComplete === 100 && (
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-primary text-sm`}>
            <CheckCircle className={UI_CLASSES.ICON_SM} />
            <span>Complete!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT} h-full bg-primary transition-all duration-300 ease-in-out`}
          style={{ width: `${percentComplete}%` }}
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Quiz progress: ${percentComplete}% complete`}
        />
      </div>

      {/* Step indicators */}
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-xs transition-colors ${
              step < currentQuestion
                ? 'bg-primary text-primary-foreground'
                : step === currentQuestion
                  ? 'border-2 border-primary bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
            title={`Question ${step}${step < currentQuestion ? ' (completed)' : step === currentQuestion ? ' (current)' : ''}`}
          >
            {step < currentQuestion ? <CheckCircle className={UI_CLASSES.ICON_SM} /> : step}
          </div>
        ))}
      </div>
    </div>
  );
}
