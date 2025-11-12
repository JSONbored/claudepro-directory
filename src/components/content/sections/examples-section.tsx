'use client';

/**
 * Examples Section - Displays usage examples with syntax highlighting
 */

import { motion } from 'motion/react';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { Copy } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

const SCROLL_REVEAL_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

interface ExamplesSectionProps {
  examples: Array<{
    title: string;
    description?: string;
    html: string;
    code: string;
    language: string;
    filename: string;
  }>;
  title?: string;
  description?: string;
  maxLines?: number;
  showLineNumbers?: boolean;
  className?: string;
}

export default function ExamplesSection({
  examples,
  title = 'Usage Examples',
  description = 'Practical code examples demonstrating common use cases and implementation patterns',
  maxLines = 20,
  showLineNumbers = false,
  className,
}: ExamplesSectionProps) {
  if (examples.length === 0) return null;

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className={UI_CLASSES.ICON_MD} />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {examples.map((example, index) => (
              <article
                key={`${example.title}-${index}`}
                className="space-y-3"
                itemScope
                itemType="https://schema.org/SoftwareSourceCode"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-base text-foreground" itemProp="name">
                    {example.title}
                  </h4>
                  {example.description && (
                    <p
                      className="text-muted-foreground text-sm leading-relaxed"
                      itemProp="description"
                    >
                      {example.description}
                    </p>
                  )}
                </div>
                <div className="not-prose" itemProp="text">
                  <meta itemProp="programmingLanguage" content={example.language} />
                  <ProductionCodeBlock
                    html={example.html}
                    code={example.code}
                    language={example.language}
                    filename={example.filename}
                    maxLines={maxLines}
                    showLineNumbers={showLineNumbers}
                    className="shadow-sm"
                  />
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
