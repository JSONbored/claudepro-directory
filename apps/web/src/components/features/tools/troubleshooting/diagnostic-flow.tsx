'use client';

/**
 * DiagnosticFlow - Interactive diagnostic flowchart (simplified version)
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting workflows
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import { type DiagnosticFlowProps } from '@heyclaude/web-runtime/types/component.types';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import React from 'react';
import { marginY, spaceY, marginBottom, paddingTop, gap, cluster, iconSize, size, muted } from "@heyclaude/web-runtime/design-system";

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

  const handleAnswer = (answer: 'no' | 'yes') => {
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
    <Card itemScope itemType="https://schema.org/HowTo" className={`${marginY.relaxed}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className={`${spaceY.comfortable}`}>
          {path.length > 0 && (
            <div className={`${size.sm} ${muted.default}`}>
              <p className={`${marginBottom.compact} font-medium`}>Diagnostic Path:</p>
              <ol className={`list-inside list-decimal ${spaceY.tight}`}>
                {path.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <Card className="bg-muted/30">
            <CardContent className={`${paddingTop.comfortable}`}>
              {isComplete ? (
                <div className={`${spaceY.comfortable}`}>
                  <div
                    className={`${cluster.compact} text-green-600 dark:text-green-400`}
                  >
                    <CheckCircle className={iconSize.md} />
                    <p className="font-medium">Solution Found:</p>
                  </div>
                  <p className={`${muted.default}`}>{currentStepData?.solution}</p>
                  <Button onClick={reset} variant="outline">
                    Start Over
                  </Button>
                </div>
              ) : (
                <div className={`${spaceY.comfortable}`}>
                  <p className="text-lg font-medium">{currentStepData?.question}</p>
                  <div className={`flex ${gap.default}`}>
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
