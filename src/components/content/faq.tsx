"use client";

/**
 * AIOptimizedFAQ - FAQ component optimized for AI citation and SEO
 * Used in 26+ MDX files across the codebase
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { type FAQProps, faqPropsSchema } from "@/src/lib/schemas/shared.schema";
import { UI_CLASSES } from "@/src/lib/ui-constants";

export function AIOptimizedFAQ(props: FAQProps) {
  const validated = faqPropsSchema.parse(props);
  const { questions, title, description } = validated;
  const validQuestions = questions;

  if (validQuestions.length === 0) {
    return null;
  }

  return (
    <section
      itemScope
      itemType="https://schema.org/FAQPage"
      className="my-8 space-y-6"
    >
      <div className={UI_CLASSES.MB_6}>
        <h2
          className={`text-2xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`}
          itemProp="headline"
        >
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
            className="border border-border bg-code/50 backdrop-blur-sm"
          >
            <CardHeader>
              <CardTitle
                className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} flex ${UI_CLASSES.ITEMS_START} gap-3`}
                itemProp="name"
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 bg-primary/10 ${UI_CLASSES.ROUNDED_FULL} flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} mt-0.5`}
                >
                  <span
                    className={`text-primary text-sm ${UI_CLASSES.FONT_BOLD}`}
                  >
                    Q
                  </span>
                </div>
                {faq.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                itemScope
                itemType="https://schema.org/Answer"
                className="pl-9"
              >
                <div
                  itemProp="text"
                  className="text-muted-foreground leading-relaxed"
                >
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
