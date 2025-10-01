'use client';

/**
 * StepByStepGuide - Tutorial step component with animated progression
 * Used in 24+ MDX files across the codebase
 */

import { Zap } from 'lucide-react';
import { Callout } from '@/components/content/callout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type StepByStepGuideProps, stepGuidePropsSchema } from '@/lib/schemas/shared.schema';

export function StepByStepGuide(props: StepByStepGuideProps) {
  const validated = stepGuidePropsSchema.parse(props);
  const { steps, title, description, totalTime } = validated;
  const validSteps = steps;

  return (
    <section itemScope itemType="https://schema.org/HowTo" className="my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" itemProp="name">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mb-4" itemProp="description">
            {description}
          </p>
        )}
        {totalTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span itemProp="totalTime">Total time: {totalTime}</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {validSteps.map((step, index) => {
          const isLastStep = index === validSteps.length - 1;
          return (
            <div key={step.title} className="relative">
              {/* Connecting line */}
              {!isLastStep && (
                <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10" />
              )}

              <Card
                itemScope
                itemType="https://schema.org/HowToStep"
                className="border-2 border-primary/20 bg-gradient-to-br from-card via-card/80 to-transparent hover:shadow-2xl transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-4" itemProp="name">
                    <div className="relative">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-primary-foreground text-base font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
                    </div>
                    <span className="text-xl font-bold">{step.title}</span>
                    {step.time && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-primary/10 text-primary border-primary/30"
                      >
                        ⏱ {step.time}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-14">
                  <div itemProp="text" className="text-base mb-6 leading-relaxed">
                    {step.content || step.description}
                  </div>

                  {step.code && (
                    <div className="mb-6">
                      <div className="rounded-xl overflow-hidden shadow-xl bg-black border border-accent/20">
                        <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          </div>
                          <span className="text-xs text-zinc-400 font-mono">
                            step-{index + 1}.sh
                          </span>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed bg-black">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {step.tip && (
                    <Callout type="tip" title="💡 Pro tip">
                      {step.tip}
                    </Callout>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}
