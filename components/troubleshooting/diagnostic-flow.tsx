'use client';

/**
 * DiagnosticFlow - Interactive diagnostic flowchart (simplified version)
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting workflows
 */

import { CheckCircle } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type DiagnosticFlowProps, diagnosticFlowPropsSchema } from '@/lib/schemas/shared.schema';

export function DiagnosticFlow(props: DiagnosticFlowProps) {
  const validated = diagnosticFlowPropsSchema.parse(props);
  const { title, steps, description } = validated;

  const validSteps =
    steps && Array.isArray(steps) && steps.length > 0
      ? steps
      : [{ question: 'No diagnostic steps available', solution: 'Please check configuration' }];

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
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Diagnostic Path:</p>
              <ol className="list-decimal list-inside space-y-1">
                {path.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              {!isComplete ? (
                <div className="space-y-4">
                  <p className="text-lg font-medium">{currentStepData?.question}</p>
                  <div className="flex gap-4">
                    <Button onClick={() => handleAnswer('yes')} variant="default">
                      Yes
                    </Button>
                    <Button onClick={() => handleAnswer('no')} variant="outline">
                      No
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Solution Found:</p>
                  </div>
                  <p className="text-muted-foreground">{currentStepData?.solution}</p>
                  <Button onClick={reset} variant="outline">
                    Start Over
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
