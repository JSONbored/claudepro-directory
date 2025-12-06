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
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          {question}
          {required ? (
            <span className="text-destructive text-sm" title="Required">
              *
            </span>
          ) : null}
        </h3>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
