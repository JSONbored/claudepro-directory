/**
 * StepByStepGuide - Server-rendered tutorial steps with syntax highlighting
 * Uses edge function for syntax highlighting (cached, fast)
 */

import { highlightCodeEdge } from '@heyclaude/web-runtime/data';
import { Zap } from '@heyclaude/web-runtime/icons';
import {
  animateDuration,
  borderColor,
  cluster,
  iconSize,
  leading,
  marginBottom,
  muted,
  opacityLevel,
  size,
  spaceY,
  transition,
  weight,
  bgColor,
  justify,
  textColor,
  alignItems,
  flexGrow,
  radius,
  shadow,
  bgGradient,
  gradientFrom,
  gradientTo,
  absolute,
  width,
  gradientVia,
  animate,
  position,
  borderWidth,
  paddingLeft,
  marginY,
  marginLeft,
} from '@heyclaude/web-runtime/design-system';
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
    <section itemScope={true} itemType="https://schema.org/HowTo" className={marginY.loose}>
      <div className={marginBottom.comfortable}>
        <h2 className={`${marginBottom.tight} ${weight.bold} ${size['2xl']}`} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className={`${marginBottom.default} ${muted.default}`} itemProp="description">
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
            <div key={step.title} className={position.relative}>
              {/* Connecting line */}
              {!isLastStep && (
                <div
                  className={
                    `${position.absolute} ${absolute.top14} ${absolute.bottom0Value} ${absolute.left5} ${width.hairline} ${bgGradient.toB} ${gradientFrom.primary50} ${gradientTo.primary10}`
                  }
                />
              )}

              <Card
                itemScope={true}
                itemType="https://schema.org/HowToStep"
                className={`${borderWidth['2']} ${borderColor['primary/20']} ${bgGradient.toBR} ${gradientFrom.card} ${gradientVia.card80} ${gradientTo.transparent} ${transition.all} ${animateDuration.slow} hover:${shadow['2xl']}`}
              >
                <CardHeader>
                  <CardTitle className={cluster.comfortable} itemProp="name">
                    <div className={position.relative}>
                      <div
                        className={
                          `flex ${iconSize['2xl']} ${flexGrow.shrink0} ${alignItems.center} ${justify.center} ${radius.full} ${bgGradient.toBR} ${gradientFrom.primary} ${gradientTo.primary70} ${shadow.lg}`
                        }
                      >
                        <span className={`${weight.bold} ${size.base} ${textColor.primaryForeground}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div
                        className={
                          `${absolute.inset} ${animate.ping} ${radius.full} ${bgColor.primary} ${opacityLevel[20]}`
                        }
                      />
                    </div>
                    <span className={`${weight.bold} ${size.xl}`}>{step.title}</span>
                    {step.time && (
                      <UnifiedBadge
                        variant="base"
                        style="secondary"
                        className={`${marginLeft.auto} ${borderColor['primary/30']} ${bgColor['primary/10']} ${textColor.primary}`}
                      >
                        ⏱ {step.time}
                      </UnifiedBadge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className={paddingLeft.hero}>
                  {(step.content || step.description) && (
                    <div itemProp="text" className={`${marginBottom.comfortable} ${size.base} ${leading.relaxed}`}>
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