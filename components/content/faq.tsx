'use client';

/**
 * AIOptimizedFAQ - FAQ component optimized for AI citation and SEO
 * Used in 26+ MDX files across the codebase
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type FAQProps, faqPropsSchema } from '@/lib/schemas';

export function AIOptimizedFAQ(props: FAQProps) {
  const validated = faqPropsSchema.parse(props);
  const { questions, title, description } = validated;
  const validQuestions = questions;

  if (validQuestions.length === 0) {
    return null;
  }

  return (
    <section itemScope itemType="https://schema.org/FAQPage" className="my-8 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" itemProp="headline">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground" itemProp="description">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {validQuestions.map((faq) => (
          <Card
            key={faq.question}
            itemScope
            itemType="https://schema.org/Question"
            className="border border-border/50 bg-card/30"
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-start gap-3" itemProp="name">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-primary text-sm font-bold">Q</span>
                </div>
                {faq.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div itemScope itemType="https://schema.org/Answer" className="pl-9">
                <div itemProp="text" className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
