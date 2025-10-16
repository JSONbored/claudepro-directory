'use client';

/**
 * Quiz Progress Component
 * Displays progress bar and question counter for quiz
 */

import { Badge } from '@/src/components/ui/badge';
import { CheckCircle } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
          <span className="text-sm font-medium">Progress</span>
          <Badge variant="secondary">
            {currentQuestion} / {totalQuestions}
          </Badge>
        </div>
        {percentComplete === 100 && (
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm text-primary`}>
            <CheckCircle className="h-4 w-4" />
            <span>Complete!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-in-out"
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
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
              step < currentQuestion
                ? 'bg-primary text-primary-foreground'
                : step === currentQuestion
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
            title={`Question ${step}${step < currentQuestion ? ' (completed)' : step === currentQuestion ? ' (current)' : ''}`}
          >
            {step < currentQuestion ? <CheckCircle className="h-4 w-4" /> : step}
          </div>
        ))}
      </div>
    </div>
  );
}
