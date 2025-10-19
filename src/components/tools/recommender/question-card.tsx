'use client';

/**
 * QuestionCard Component - Form Layout Wrapper
 *
 * **ARCHITECTURAL DECISION: NOT CONSOLIDATED WITH BaseCard**
 *
 * QuestionCard is a specialized form layout component for quiz questions,
 * NOT a content display card. It serves a fundamentally different purpose
 * than BaseCard and should remain standalone.
 *
 * **Why QuestionCard is separate from BaseCard:**
 *
 * 1. **Different Semantic Purpose**
 *    - QuestionCard: Form layout wrapper (wraps form controls like buttons/inputs)
 *    - BaseCard: Content display component (shows metadata, tags, actions)
 *
 * 2. **Zero Functional Overlap**
 *    - QuestionCard has: question text, optional description, required indicator, children slot
 *    - BaseCard has: navigation, badges, tags, metadata badges, action buttons, author links
 *    - NO shared features or rendering logic
 *
 * 3. **Composition Pattern Mismatch**
 *    - QuestionCard: Accepts arbitrary children (form controls, inputs, buttons)
 *    - BaseCard: Uses specific render slots (renderTopBadges, renderActions, etc.)
 *
 * 4. **Simplicity & Maintainability**
 *    - QuestionCard: Only 32 lines - consolidation would ADD complexity
 *    - Clean, focused component with single responsibility
 *
 * 5. **Different Parent Context**
 *    - Used exclusively in quiz-form.tsx for recommender tool
 *    - Not part of content card ecosystem (agents, mcp, guides, etc.)
 *
 * **Usage:**
 * ```tsx
 * <QuestionCard question="What's your use case?" required>
 *   <div className="grid gap-3">
 *     <button>Option 1</button>
 *     <button>Option 2</button>
 *   </div>
 * </QuestionCard>
 * ```
 *
 * @see src/components/tools/recommender/quiz-form.tsx - Usage context
 * @see src/components/shared/base-card.tsx - Content display cards (different purpose)
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
