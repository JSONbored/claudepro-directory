/**
 * QuestionCard - Form layout wrapper for quiz questions with optional required indicator
 */

import { spaceY, cluster, marginTop, muted, helper, weight ,size } from '@heyclaude/web-runtime/design-system';

interface QuestionCardProps {
  question: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function QuestionCard({ question, description, required, children }: QuestionCardProps) {
  return (
    <div className={spaceY.comfortable}>
      <div>
        <h3 className={`${cluster.compact} ${weight.semibold} ${size.lg}`}>
          {question}
          {required && (
            <span className={helper.destructive} title="Required">
              *
            </span>
          )}
        </h3>
        {description && <p className={`${marginTop.tight} ${muted.sm}`}>{description}</p>}
      </div>
      {children}
    </div>
  );
}
