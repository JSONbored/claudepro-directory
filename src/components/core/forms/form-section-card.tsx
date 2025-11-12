/**
 * Form Section Card
 * Wraps form sections with visual hierarchy and animations
 * Color-coded sections guide users through the form
 */

'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { BorderBeam } from '@/src/components/primitives/animation/border-beam';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import type { LucideIcon } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

type SectionTheme = 'primary' | 'blue' | 'green' | 'purple';

interface FormSectionCardProps {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  theme?: SectionTheme;
  children: ReactNode;
  showBorderBeam?: boolean;
  className?: string;
}

const THEME_CONFIG: Record<
  SectionTheme,
  {
    border: string;
    iconBg: string;
    iconText: string;
    beamFrom: string;
    beamTo: string;
  }
> = {
  primary: {
    border: 'border-primary/20',
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
    beamFrom: '#9333ea',
    beamTo: '#a855f7',
  },
  blue: {
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-500',
    beamFrom: '#3b82f6',
    beamTo: '#60a5fa',
  },
  green: {
    border: 'border-green-500/20',
    iconBg: 'bg-green-500/10',
    iconText: 'text-green-500',
    beamFrom: '#22c55e',
    beamTo: '#4ade80',
  },
  purple: {
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/10',
    iconText: 'text-purple-500',
    beamFrom: '#a855f7',
    beamTo: '#c084fc',
  },
};

/**
 * Section entrance animation
 */
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export function FormSectionCard({
  step,
  title,
  description,
  icon: Icon,
  theme = 'primary',
  children,
  showBorderBeam = false,
  className,
}: FormSectionCardProps) {
  const themeConfig = THEME_CONFIG[theme];

  return (
    <motion.div initial="hidden" animate="visible" variants={sectionVariants} className={className}>
      <Card className={cn('relative overflow-hidden', themeConfig.border)}>
        {/* BorderBeam for active/focused sections */}
        {showBorderBeam && (
          <BorderBeam
            size={200}
            duration={15}
            colorFrom={themeConfig.beamFrom}
            colorTo={themeConfig.beamTo}
            borderWidth={1}
          />
        )}

        <CardHeader className={UI_CLASSES.CARD_HEADER_DEFAULT}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3}>
            {/* Icon with step number */}
            <div
              className={cn(
                'rounded-lg',
                UI_CLASSES.PADDING_TIGHT,
                themeConfig.iconBg,
                UI_CLASSES.FLEX_SHRINK_0
              )}
            >
              <Icon className={cn(UI_CLASSES.ICON_MD, themeConfig.iconText)} />
            </div>

            {/* Title and description */}
            <div className={UI_CLASSES.FLEX_1}>
              <CardTitle
                className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2, UI_CLASSES.TEXT_CARD_TITLE)}
              >
                <span className={cn('font-semibold', themeConfig.iconText)}>{step}.</span>
                {title}
              </CardTitle>
              <p className={cn(UI_CLASSES.TEXT_CARD_DESCRIPTION, UI_CLASSES.MARGIN_TOP_MICRO)}>
                {description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className={UI_CLASSES.CARD_CONTENT_DEFAULT}>{children}</CardContent>
      </Card>
    </motion.div>
  );
}
