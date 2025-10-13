'use client';

/**
 * Question Card Component
 * Displays individual quiz questions with consistent styling
 */

import { UI_CLASSES } from '@/src/lib/ui-constants';

interface QuestionCardProps {
  question: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function QuestionCard({ question, description, required, children }: QuestionCardProps) {
  return (
    <div className={UI_CLASSES.SPACE_Y_4}>
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {question}
          {required && (
            <span className="text-destructive text-sm" title="Required">
              *
            </span>
          )}
        </h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}
