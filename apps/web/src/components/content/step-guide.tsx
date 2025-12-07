/**
 * StepByStepGuide - Server-rendered tutorial steps with syntax highlighting
 * Uses edge function for syntax highlighting (cached, fast)
 */

import { highlightCodeEdge } from '@heyclaude/web-runtime/data';
import { Zap } from '@heyclaude/web-runtime/icons';
import { type StepByStepGuideProps } from '@heyclaude/web-runtime/types/component.types';
import {
  UI_CLASSES,
  UnifiedBadge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedContentBox } from '@/src/components/core/domain/content/featured-content-box';

/**
 * Render a server-side, step-by-step HowTo guide with optional code highlighting, timings, and tips.
 *
 * This component parallelizes syntax highlighting for any step that includes `code` and attaches
 * the resulting highlighted HTML to each step as `highlightedHtml` before rendering. It emits
 * schema.org markup for a HowTo and HowToStep for improved SEO.
 *
 * @param props - Component props
 * @param props.steps - Ordered list of steps. Each step may include: `title`, `content`, `description`, `code` (string), `time`, and `tip`. When `code` is present, highlighted HTML is produced and attached as `highlightedHtml`.
 * @param props.title - Guide title displayed as the main heading.
 * @param props.description - Optional guide description rendered under the title.
 * @param props.totalTime - Optional human-readable total duration displayed in the header.
 *
 * @returns A JSX element representing the fully rendered HowTo guide.
 *
 * @see highlightCodeEdge - used to produce highlighted HTML for step code
 * @see ProductionCodeBlock - renders highlighted code blocks for steps that include `code`
 * @see StepByStepGuideProps - expected props shape
 */
export async function StepByStepGuide(props: StepByStepGuideProps) {
  const { steps, title, description, totalTime } = props;

  const highlightedSteps = await Promise.all(
    steps.map(async (step) => {
      if (!step.code) return { ...step, highlightedHtml: null };
      const html = await highlightCodeEdge(step.code, { language: 'bash' });
      return { ...step, highlightedHtml: html };
    })
  );

  return (
    <section itemScope itemType="https://schema.org/HowTo" className="my-8">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold" itemProp="name">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground mb-4" itemProp="description">
            {description}
          </p>
        ) : null}
        {totalTime ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Zap className={UI_CLASSES.ICON_SM} />
            <span itemProp="totalTime">Total time: {totalTime}</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-8">
        {highlightedSteps.map((step, index) => {
          const isLastStep = index === highlightedSteps.length - 1;
          return (
            <div key={step.title} className="relative">
              {/* Connecting line */}
              {!isLastStep && (
                <div className="from-primary/50 to-primary/10 absolute top-14 bottom-0 left-5 w-0.5 bg-linear-to-b" />
              )}

              <Card
                itemScope
                itemType="https://schema.org/HowToStep"
                className="border-primary/20 from-card via-card/80 border-2 bg-linear-to-br to-transparent transition-all duration-300 hover:shadow-2xl"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-4" itemProp="name">
                    <div className="relative">
                      <div className="from-primary to-primary/70 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br shadow-lg">
                        <span className="text-primary-foreground text-base font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="bg-primary absolute inset-0 animate-ping rounded-full opacity-20" />
                    </div>
                    <span className="text-xl font-bold">{step.title}</span>
                    {step.time ? (
                      <UnifiedBadge
                        variant="base"
                        style="secondary"
                        className="border-primary/30 bg-primary/10 text-primary ml-auto"
                      >
                        ⏱ {step.time}
                      </UnifiedBadge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-14">
                  {step.content || step.description ? (
                    <div itemProp="text" className="mb-6 text-base leading-relaxed">
                      {(step.content as React.ReactNode) || (step.description as React.ReactNode)}
                    </div>
                  ) : null}

                  {step.highlightedHtml && step.code ? (
                    <div className="mb-6">
                      <ProductionCodeBlock
                        html={step.highlightedHtml}
                        code={step.code}
                        language="bash"
                        filename={`step-${index + 1}.sh`}
                        maxLines={20}
                      />
                    </div>
                  ) : null}

                  {step.tip ? (
                    <UnifiedContentBox contentType="callout" type="tip" title="💡 Pro tip">
                      {step.tip}
                    </UnifiedContentBox>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}