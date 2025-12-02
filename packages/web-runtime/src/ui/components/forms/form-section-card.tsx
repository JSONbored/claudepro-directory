'use client';

/**
 * Form Section Card
 *
 * Wraps form sections with visual hierarchy and animations.
 * Color-coded sections guide users through multi-step forms.
 *
 * @module web-runtime/ui/components/forms/form-section-card
 *
 * @example Basic usage
 * ```tsx
 * <FormSectionCard
 *   step={1}
 *   title="Basic Information"
 *   description="Enter your profile details"
 *   icon={User}
 *   theme="primary"
 * >
 *   <FormField variant="input" label="Name" ... />
 * </FormSectionCard>
 * ```
 *
 * @example With border beam for active section
 * ```tsx
 * <FormSectionCard
 *   step={2}
 *   title="Configuration"
 *   description="Set up your preferences"
 *   icon={Settings}
 *   theme="blue"
 *   showBorderBeam={isActive}
 * >
 *   {children}
 * </FormSectionCard>
 * ```
 */

import type { IconComponent } from '../../../icons.tsx';
import { cn } from '../../utils.ts';
// Design System imports
import { cluster, padding, marginTop } from '../../../design-system/styles/layout.ts';
import { iconSize } from '../../../design-system/styles/icons.ts';
import { cardHeader, cardBody } from '../../../design-system/styles/cards.ts';
import { size } from '../../../design-system/styles/typography.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { BorderBeam } from '../animation/border-beam.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../card.tsx';

/** Available color themes for form sections */
export type SectionTheme = 'primary' | 'blue' | 'green' | 'purple';

/** Props for FormSectionCard component */
export interface FormSectionCardProps {
  /** Step number displayed with the icon */
  step: number;
  /** Section title */
  title: string;
  /** Section description */
  description: string;
  /** Lucide icon component */
  icon: IconComponent;
  /** Color theme for the section */
  theme?: SectionTheme;
  /** Section content */
  children: ReactNode;
  /** Show animated border beam (for active sections) */
  showBorderBeam?: boolean;
  /** Additional CSS classes */
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

/** Section entrance animation variants */
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

/**
 * FormSectionCard Component
 *
 * Animated card wrapper for form sections with color-coded themes.
 * Includes optional BorderBeam animation for highlighting active sections.
 */
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

        <CardHeader className={cardHeader.default}>
          <div className={cluster.default}>
            {/* Icon with step number */}
            <div
              className={cn(
                radius.lg,
                padding.tight,
                themeConfig.iconBg,
                'shrink-0'
              )}
            >
              <Icon className={cn(iconSize.md, themeConfig.iconText)} />
            </div>

            {/* Title and description */}
            <div className="flex-1">
              <CardTitle
                className={cn(cluster.compact, `${size.lg} font-semibold`)}
              >
                <span className={cn('font-semibold', themeConfig.iconText)}>{step}.</span>
                {title}
              </CardTitle>
              <p className={cn(`${size.sm} text-muted-foreground`, marginTop.micro)}>
                {description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cardBody.default}>{children}</CardContent>
      </Card>
    </motion.div>
  );
}
