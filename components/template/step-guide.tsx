'use client';

/**
 * StepByStepGuide - Tutorial step component with animated progression
 * Used in 24+ MDX files across the codebase
 */

import { Callout } from '@/components/content/callout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from '@/lib/icons';
import { type StepByStepGuideProps, stepGuidePropsSchema } from '@/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

export function StepByStepGuide(props: StepByStepGuideProps) {
  const validated = stepGuidePropsSchema.parse(props);
  const { steps, title, description, totalTime } = validated;
  const validSteps = steps;

  return (
    <section itemScope itemType="https://schema.org/HowTo" className="my-8">
      <div className={UI_CLASSES.MB_6}>
        <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className={`text-muted-foreground ${UI_CLASSES.MB_4}`} itemProp="description">
            {description}
          </p>
        )}
        {totalTime && (
          <div
            className={`flex items-center ${UI_CLASSES.GAP_2} ${UI_CLASSES.TEXT_SM} text-muted-foreground`}
          >
            <Zap className="h-4 w-4" />
            <span itemProp="totalTime">Total time: {totalTime}</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {validSteps.map((step, index) => {
          const isLastStep = index === validSteps.length - 1;
          return (
            <div key={step.title} className={UI_CLASSES.RELATIVE}>
              {/* Connecting line */}
              {!isLastStep && (
                <div
                  className={`${UI_CLASSES.ABSOLUTE} left-5 top-14 ${UI_CLASSES.BOTTOM_0} w-0.5 bg-gradient-to-b from-primary/50 to-primary/10`}
                />
              )}

              <Card
                itemScope
                itemType="https://schema.org/HowToStep"
                className="border-2 border-primary/20 bg-gradient-to-br from-card via-card/80 to-transparent hover:shadow-2xl transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-4" itemProp="name">
                    <div className={UI_CLASSES.RELATIVE}>
                      <div
                        className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} shadow-lg`}
                      >
                        <span
                          className={`text-primary-foreground ${UI_CLASSES.TEXT_BASE} ${UI_CLASSES.FONT_BOLD}`}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div
                        className={`${UI_CLASSES.ABSOLUTE} ${UI_CLASSES.INSET_0} animate-ping rounded-full bg-primary opacity-20`}
                      />
                    </div>
                    <span className={`text-xl ${UI_CLASSES.FONT_BOLD}`}>{step.title}</span>
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
                  <div
                    itemProp="text"
                    className={`${UI_CLASSES.TEXT_BASE} ${UI_CLASSES.MB_6} leading-relaxed`}
                  >
                    {step.content || step.description}
                  </div>

                  {step.code && (
                    <div className={UI_CLASSES.MB_6}>
                      <div
                        className={`rounded-xl ${UI_CLASSES.OVERFLOW_HIDDEN} shadow-xl bg-black border border-accent/20`}
                      >
                        <div
                          className={`bg-zinc-900 px-4 ${UI_CLASSES.PY_2} ${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} border-b border-zinc-800`}
                        >
                          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          </div>
                          <span className={`${UI_CLASSES.TEXT_XS} text-zinc-400 font-mono`}>
                            step-{index + 1}.sh
                          </span>
                        </div>
                        <pre
                          className={`${UI_CLASSES.P_4} ${UI_CLASSES.OVERFLOW_X_AUTO} ${UI_CLASSES.TEXT_SM} font-mono text-zinc-300 leading-relaxed bg-black`}
                        >
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
