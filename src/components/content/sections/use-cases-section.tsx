'use client';

/**
 * Use Cases Section - Displays common scenarios and applications
 */

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import type { CategoryId } from '@/src/lib/config/category-config.types';
import {
  Bookmark,
  BookOpen,
  Bot,
  Briefcase,
  Code,
  FileText,
  type LucideIcon,
  Package,
  Rocket,
  Sparkles,
  Terminal,
  Zap,
} from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  agents: Sparkles,
  mcp: Package,
  commands: Terminal,
  rules: FileText,
  hooks: Code,
  statuslines: Zap,
  collections: Bookmark,
  skills: Rocket,
  guides: BookOpen,
  jobs: Briefcase,
  changelog: Bot,
};

const SCROLL_REVEAL_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

interface UseCasesSectionProps {
  useCases: string[];
  category: CategoryId;
  className?: string;
}

export default function UseCasesSection({ useCases, category, className }: UseCasesSectionProps) {
  if (useCases.length === 0) return null;

  const Icon = CATEGORY_ICONS[category];

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className={UI_CLASSES.ICON_MD} />
            Use Cases
          </CardTitle>
          <CardDescription>Common scenarios and applications</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {useCases.map((useCase) => (
              <li key={useCase.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                <span className="text-sm leading-relaxed">{useCase}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
