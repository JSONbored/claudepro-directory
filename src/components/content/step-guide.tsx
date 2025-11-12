/**
 * StepByStepGuide - Server-rendered tutorial steps with syntax highlighting
 * Uses React cache() memoization for highlightCode() (0ms overhead for duplicates)
 */

import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { UnifiedContentBox } from '@/src/components/core/domain/content/featured-content-box';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { highlightCode } from '@/src/lib/content/syntax-highlighting';
import { Zap } from '@/src/lib/icons';
import type { StepByStepGuideProps } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function StepByStepGuide(props: StepByStepGuideProps) {
  const { steps, title, description, totalTime } = props;

  const highlightedSteps = steps.map((step) => {
    if (!step.code) return { ...step, highlightedHtml: null };
    const html = highlightCode(step.code, 'bash');
    return { ...step, highlightedHtml: html };
  });

  return (
    <section itemScope itemType="https://schema.org/HowTo" className="my-8">
      <div className="mb-6">
        <h2 className={'mb-2 font-bold text-2xl'} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className={'mb-4 text-muted-foreground'} itemProp="description">
            {description}
          </p>
        )}
        {totalTime && (
          <div className={'flex items-center gap-2 text-muted-foreground text-sm'}>
            <Zap className={UI_CLASSES.ICON_SM} />
            <span itemProp="totalTime">Total time: {totalTime}</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {highlightedSteps.map((step, index) => {
          const isLastStep = index === highlightedSteps.length - 1;
          return (
            <div key={step.title} className="relative">
              {/* Connecting line */}
              {!isLastStep && (
                <div
                  className={
                    'absolute top-14 bottom-0 left-5 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10'
                  }
                />
              )}

              <Card
                itemScope
                itemType="https://schema.org/HowToStep"
                className="border-2 border-primary/20 bg-gradient-to-br from-card via-card/80 to-transparent transition-all duration-300 hover:shadow-2xl"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-4" itemProp="name">
                    <div className="relative">
                      <div
                        className={
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg'
                        }
                      >
                        <span className={'font-bold text-base text-primary-foreground'}>
                          {index + 1}
                        </span>
                      </div>
                      <div
                        className={
                          'absolute inset-0 animate-ping rounded-full bg-primary opacity-20'
                        }
                      />
                    </div>
                    <span className={'font-bold text-xl'}>{step.title}</span>
                    {step.time && (
                      <UnifiedBadge
                        variant="base"
                        style="secondary"
                        className="ml-auto border-primary/30 bg-primary/10 text-primary"
                      >
                        ⏱ {step.time}
                      </UnifiedBadge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-14">
                  {(step.content || step.description) && (
                    <div itemProp="text" className={'mb-6 text-base leading-relaxed'}>
                      {(step.content as React.ReactNode) || (step.description as React.ReactNode)}
                    </div>
                  )}

                  {step.highlightedHtml && step.code && (
                    <div className="mb-6">
                      <ProductionCodeBlock
                        html={step.highlightedHtml}
                        code={step.code}
                        language="bash"
                        filename={`step-${index + 1}.sh`}
                        maxLines={20}
                      />
                    </div>
                  )}

                  {step.tip && (
                    <UnifiedContentBox contentType="callout" type="tip" title="💡 Pro tip">
                      {step.tip}
                    </UnifiedContentBox>
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
