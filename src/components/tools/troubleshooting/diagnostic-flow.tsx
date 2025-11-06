'use client';

/**
 * DiagnosticFlow - Interactive diagnostic flowchart (simplified version)
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting workflows
 */

import React from 'react';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { CheckCircle } from '@/src/lib/icons';
import type { DiagnosticFlowProps } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    <Card itemScope itemType="https://schema.org/HowTo" className="my-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {path.length > 0 && (
            <div className={UI_CLASSES.TEXT_SM_MUTED}>
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
                    className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-green-600 dark:text-green-400`}
                  >
                    <CheckCircle className="h-5 w-5" />
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
