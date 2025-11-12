'use client';

/**
 * Content Section - Displays main code/content with syntax highlighting
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

interface ContentSectionProps {
  title: string;
  description?: string;
  html: string;
  code: string;
  language: string;
  filename: string;
  className?: string;
}

export default function ContentSection({
  title,
  description,
  html,
  code,
  language,
  filename,
  className,
}: ContentSectionProps) {
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
          <ProductionCodeBlock
            html={html}
            code={code}
            language={language}
            filename={filename}
            maxLines={20}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
