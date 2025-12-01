/**
 * StepByStepGuide - Server-rendered tutorial steps with syntax highlighting
 * Uses edge function for syntax highlighting (cached, fast)
 */

import { highlightCodeEdge } from '@heyclaude/web-runtime/data';
import { Zap } from '@heyclaude/web-runtime/icons';
import { iconSize, spaceY, cluster, marginBottom, muted, weight, size } from '@heyclaude/web-runtime/design-system';
import type { StepByStepGuideProps } from '@heyclaude/web-runtime/types/component.types';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { UnifiedContentBox } from '@/src/components/core/domain/content/featured-content-box';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

/**
 * Renders a server-side HowTo guide composed of ordered steps with optional syntax-highlighted code blocks.
 *
 * Renders a semantic HowTo section containing a header (title, optional description, optional total time) and an ordered list of step cards; steps that include code are highlighted server-side and displayed with a ProductionCodeBlock, and steps may optionally include a duration and a tip callout.
 *
 * @param props - Component properties.
 * @param props.steps - Array of steps to render; each step may include `title`, `content` or `description`, optional `code` (shell script content), optional `time`, and optional `tip`. Steps with `code` will be highlighted and shown as a code block.
 * @param props.title - Title displayed at the top of the guide.
 * @param props.description - Optional description displayed under the title.
 * @param props.totalTime - Optional total estimated time displayed in the header.
 * @returns The rendered HowTo section as a React element.
 *
 * @see highlightCodeEdge
 * @see ProductionCodeBlock
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
    <section itemScope={true} itemType="https://schema.org/HowTo" className="my-8">
      <div className={marginBottom.comfortable}>
        <h2 className={`mb-2 ${weight.bold} ${size['2xl']}`} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className={`mb-4 ${muted.default}`} itemProp="description">
            {description}
          </p>
        )}
        {totalTime && (
          <div className={`${cluster.compact} ${muted.sm}`}>
            <Zap className={iconSize.sm} />
            <span itemProp="totalTime">Total time: {totalTime}</span>
          </div>
        )}
      </div>

      <div className={spaceY.loose}>
        {highlightedSteps.map((step, index) => {
          const isLastStep = index === highlightedSteps.length - 1;
          return (
            <div key={step.title} className="relative">
              {/* Connecting line */}
              {!isLastStep && (
                <div
                  className={
                    'absolute top-14 bottom-0 left-5 w-0.5 bg-linear-to-b from-primary/50 to-primary/10'
                  }
                />
              )}

              <Card
                itemScope={true}
                itemType="https://schema.org/HowToStep"
                className="border-2 border-primary/20 bg-linear-to-br from-card via-card/80 to-transparent transition-all duration-300 hover:shadow-2xl"
              >
                <CardHeader>
                  <CardTitle className={cluster.comfortable} itemProp="name">
                    <div className="relative">
                      <div
                        className={
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70 shadow-lg'
                        }
                      >
                        <span className={`${weight.bold} ${size.base} text-primary-foreground`}>
                          {index + 1}
                        </span>
                      </div>
                      <div
                        className={
                          'absolute inset-0 animate-ping rounded-full bg-primary opacity-20'
                        }
                      />
                    </div>
                    <span className={`${weight.bold} ${size.xl}`}>{step.title}</span>
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
                    <div itemProp="text" className={'mb-6 ${size.base} leading-relaxed'}>
                      {(step.content as React.ReactNode) || (step.description as React.ReactNode)}
                    </div>
                  )}

                  {step.highlightedHtml && step.code && (
                    <div className={marginBottom.comfortable}>
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