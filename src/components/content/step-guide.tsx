/**
 * StepByStepGuide - Tutorial step component with animated progression (SERVER COMPONENT)
 *
 * @server This is a SERVER-ONLY component (async, imports batch.utils → cache.server)
 *
 * PRODUCTION-GRADE: Server-side Shiki syntax highlighting
 * - Used in 24+ MDX files across the codebase
 * - Zero client-side JavaScript for syntax highlighting
 * - Secure: Uses trusted Shiki renderer
 * - Performant: Pre-rendered on server
 *
 * **Architecture:**
 * - Server Component: Uses batchMap from batch.utils (imports cache.server)
 * - NOT Storybook-compatible (requires server-side execution)
 * - Correct usage: Server components can import server-only code
 */

import { ProductionCodeBlock } from '@/src/components/content/production-code-block';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedContentBox } from '@/src/components/domain/unified-content-box';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { highlightCode } from '@/src/lib/content/syntax-highlighting';
import { Zap } from '@/src/lib/icons';
import { type StepByStepGuideProps, stepGuidePropsSchema } from '@/src/lib/schemas/shared.schema';
import { batchMap } from '@/src/lib/utils/batch.utils';

export async function StepByStepGuide(props: StepByStepGuideProps) {
  const validated = stepGuidePropsSchema.parse(props);
  const { steps, title, description, totalTime } = validated;
  const validSteps = steps;

  // Pre-render all code blocks with Shiki on the server
  const highlightedSteps = await batchMap(validSteps, async (step) => {
    if (!step.code) return { ...step, highlightedHtml: null };

    const html = await highlightCode(step.code, 'bash');
    return { ...step, highlightedHtml: html };
  });

  return (
    <section itemScope itemType="https://schema.org/HowTo" className="my-8">
      <div className="mb-6">
        <h2 className={'text-2xl font-bold mb-2'} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className={'text-muted-foreground mb-4'} itemProp="description">
            {description}
          </p>
        )}
        {totalTime && (
          <div className={'flex items-center gap-2 text-sm text-muted-foreground'}>
            <Zap className="h-4 w-4" />
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
                    'absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10'
                  }
                />
              )}

              <Card
                itemScope
                itemType="https://schema.org/HowToStep"
                className="border-2 border-primary/20 bg-gradient-to-br from-card via-card/80 to-transparent hover:shadow-2xl transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-4" itemProp="name">
                    <div className="relative">
                      <div
                        className={
                          'flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg'
                        }
                      >
                        <span className={'text-primary-foreground text-base font-bold'}>
                          {index + 1}
                        </span>
                      </div>
                      <div
                        className={
                          'absolute inset-0 animate-ping rounded-full bg-primary opacity-20'
                        }
                      />
                    </div>
                    <span className={'text-xl font-bold'}>{step.title}</span>
                    {step.time && (
                      <UnifiedBadge
                        variant="base"
                        style="secondary"
                        className="ml-auto bg-primary/10 text-primary border-primary/30"
                      >
                        ⏱ {step.time}
                      </UnifiedBadge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-14">
                  <div itemProp="text" className={'text-base mb-6 leading-relaxed'}>
                    {step.content || step.description}
                  </div>

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
