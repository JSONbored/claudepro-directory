/**
 * QuestionCard - Form layout wrapper for quiz questions with optional required indicator
 */

interface QuestionCardProps {
  children: React.ReactNode;
  description?: string;
  question: string;
  required?: boolean;
}

export function QuestionCard({ question, description, required, children }: QuestionCardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-1 text-lg font-semibold">
          {question}
          {required ? (
            <span className="text-sm text-destructive" title="Required">
              *
            </span>
          ) : null}
        </h3>
        {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
