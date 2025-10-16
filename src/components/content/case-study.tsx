'use client';

/**
 * CaseStudy - Rich case study presentation component
 * Used in 1 MDX file across the codebase - Specialized component for business case studies
 */

import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { BookOpen } from '@/src/lib/icons';
import { type CaseStudyProps, caseStudyPropsSchema } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function CaseStudy(props: CaseStudyProps) {
  const validated = caseStudyPropsSchema.parse(props);
  const { company, industry, challenge, solution, results, metrics, testimonial, logo } = validated;

  return (
    <Card itemScope itemType="https://schema.org/Article" className={'my-8 overflow-hidden'}>
      <CardHeader className="pb-4">
        <div className={`flex ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN}`}>
          <div>
            <CardTitle className="text-2xl" itemProp="headline">
              {company} Case Study
            </CardTitle>
            {industry && (
              <Badge variant="outline" className="mt-2">
                {industry}
              </Badge>
            )}
          </div>
          {logo && (
            <div
              className={`w-16 h-16 bg-muted rounded-lg flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER}`}
            >
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className={`${UI_CLASSES.FONT_SEMIBOLD} text-destructive ${UI_CLASSES.MB_2}`}>
            Challenge
          </h4>
          <p className="text-muted-foreground">{challenge}</p>
        </div>

        <div>
          <h4 className={`${UI_CLASSES.FONT_SEMIBOLD} text-primary ${UI_CLASSES.MB_2}`}>
            Solution
          </h4>
          <p className="text-muted-foreground">{solution}</p>
        </div>

        <div>
          <h4
            className={`${UI_CLASSES.FONT_SEMIBOLD} text-green-600 dark:text-green-400 ${UI_CLASSES.MB_2}`}
          >
            Results
          </h4>
          <p className="text-muted-foreground">{results}</p>
        </div>

        {metrics && Array.isArray(metrics) && metrics.length > 0 && (
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 ${UI_CLASSES.BORDER_T}`}>
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p
                  className={`text-2xl ${UI_CLASSES.FONT_BOLD} flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} gap-1`}
                >
                  {metric.value}
                  {metric.trend && (
                    <span
                      className={
                        metric.trend === 'up' || metric.trend === '+'
                          ? 'text-green-500'
                          : metric.trend === 'down'
                            ? 'text-red-500'
                            : 'text-gray-500'
                      }
                    >
                      {metric.trend === 'up' || metric.trend === '+'
                        ? '↑'
                        : metric.trend === 'down'
                          ? '↓'
                          : '→'}
                    </span>
                  )}
                </p>
                <p className={UI_CLASSES.TEXT_SM_MUTED}>{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {testimonial && (
          <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg">
            <p className={`italic text-muted-foreground ${UI_CLASSES.MB_2}`}>
              "{testimonial.quote}"
            </p>
            <footer className="text-sm">
              <cite className={`not-italic ${UI_CLASSES.FONT_SEMIBOLD}`}>{testimonial.author}</cite>
              {testimonial.role && (
                <span className="text-muted-foreground">, {testimonial.role}</span>
              )}
            </footer>
          </blockquote>
        )}
      </CardContent>
    </Card>
  );
}
