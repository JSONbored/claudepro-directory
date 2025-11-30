'use client';

/**
 * DiagnosticFlow - Interactive diagnostic flowchart (simplified version)
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting workflows
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import type { DiagnosticFlowProps } from '@heyclaude/web-runtime/types/component.types';
import { cluster, iconSize, muted } from '@heyclaude/web-runtime/design-system';
import React from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

/**
 * Renders an interactive diagnostic flowchart that guides users through yes/no questions and
 * presents a solution when a terminal step is reached.
 *
 * The component normalizes `steps` (falls back to a default step if none provided), tracks the
 * current step index and the sequence of answered questions, advances according to each step's
 * `yesPath`/`noPath`, and exposes a control to restart the flow.
 *
 * @param props - Component props
 * @param props.title - Visible title shown at the top of the card
 * @param props.steps - Ordered array of diagnostic steps. Each step should include at least a `question`
 *                      string; optional `yesPath`/`noPath` values select the next step by matching a
 *                      step's `question`. A step with a `solution` string is treated as terminal.
 * @param props.description - Optional descriptive text displayed under the title
 * @returns A React element containing the interactive diagnostic flow UI
 *
 * @see DiagnosticFlowProps
 */
export function DiagnosticFlow(props: DiagnosticFlowProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, steps, description } = props;

  const validSteps =
    steps && Array.isArray(steps) && steps.length > 0
      ? steps
      : [
          {
            question: 'No diagnostic steps available',
            solution: 'Please check configuration',
          },
        ];

  const [currentStep, setCurrentStep] = React.useState(0);
  const [path, setPath] = React.useState<string[]>([]);

  const handleAnswer = (answer: 'yes' | 'no') => {
    const step = validSteps[currentStep];
    if (!step) return;

    const newPath = [...path, `${step.question} - ${answer.toUpperCase()}`];
    setPath(newPath);

    const nextStepId = answer === 'yes' ? step.yesPath : step.noPath;
    if (nextStepId) {
      const nextIndex = validSteps.findIndex((s) => s.question === nextStepId);
      if (nextIndex !== -1) {
        setCurrentStep(nextIndex);
      }
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setPath([]);
  };

  const currentStepData = validSteps[currentStep];
  const isComplete = currentStepData?.solution !== undefined;

  return (
    <Card itemScope={true} itemType="https://schema.org/HowTo" className="my-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {path.length > 0 && (
            <div className={`${muted.default} text-sm`}>
              <p className={'mb-2 font-medium'}>Diagnostic Path:</p>
              <ol className={'list-inside list-decimal space-y-1'}>
                {path.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              {isComplete ? (
                <div className="space-y-4">
                  <div
                    className={`${cluster.compact} text-green-600 dark:text-green-400`}
                  >
                    <CheckCircle className={iconSize.md} />
                    <p className="font-medium">Solution Found:</p>
                  </div>
                  <p className="text-muted-foreground">{currentStepData?.solution}</p>
                  <Button onClick={reset} variant="outline">
                    Start Over
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className={'font-medium text-lg'}>{currentStepData?.question}</p>
                  <div className="flex gap-4">
                    <Button onClick={() => handleAnswer('yes')} variant="default">
                      Yes
                    </Button>
                    <Button onClick={() => handleAnswer('no')} variant="outline">
                      No
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}