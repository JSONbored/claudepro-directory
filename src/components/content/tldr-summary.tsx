'use client';

/**
 * TLDRSummary - Opening summary component for all templates
 * Schema: Article with abstract for AI citation
 * Used in 27+ MDX files across the codebase
 */

import { CheckCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { type TLDRSummaryProps, tldrSummaryPropsSchema } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function TLDRSummary(props: TLDRSummaryProps) {
  const validated = tldrSummaryPropsSchema.parse(props);
  const { content, keyPoints, title } = validated;
  return (
    <Card
      itemScope
      itemType="https://schema.org/Article"
      className="my-8 border-l-4 border-primary bg-primary/5"
    >
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Zap className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p itemProp="abstract" className="text-muted-foreground leading-relaxed mb-4">
          {content}
        </p>

        {keyPoints && keyPoints.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Key Takeaways:</h4>
            <ul className="space-y-1">
              {keyPoints.map((point) => (
                <li key={point} className={`flex ${UI_CLASSES.ITEMS_START} gap-2 text-sm`}>
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
