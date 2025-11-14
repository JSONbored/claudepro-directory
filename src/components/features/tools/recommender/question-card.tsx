/**
 * QuestionCard - Form layout wrapper for quiz questions with optional required indicator
 */

interface QuestionCardProps {
  question: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function QuestionCard({ question, description, required, children }: QuestionCardProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-lg">
          {question}
          {required && (
            <span className="text-destructive text-sm" title="Required">
              *
            </span>
          )}
        </h3>
        {description && <p className="mt-1 text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
}
