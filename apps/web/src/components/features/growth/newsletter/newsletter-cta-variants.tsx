'use client';

import type { Database } from '@heyclaude/database-types';
import {
  animate,
  backdrop,
  bgColor,
  border,
  borderColor,
  cluster,
  flexDir,
  flexGrow,
  gap,
  iconSize,
  alignItems,
  justify,
  leading,
  marginBottom,
  marginTop,
  maxWidth,
  minWidth,
  muted,
  padding,
  radius,
  shadow,
  size,
  spaceY,
  textColor,
  tracking,
  weight,
  skeletonSize,
} from '@heyclaude/web-runtime/design-system';
import { logUnhandledPromise, NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Mail } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';

import { NewsletterForm } from './newsletter-form';
import {
  formatSubscriberCount,
  getContextualMessage,
  getCTAVariantCopy,
  loadNewsletterConfig,
} from './newsletter-utils';

export interface NewsletterCTABaseProps {
  source: Database['public']['Enums']['newsletter_source'];
  className?: string;
  category?: string;
  headline?: string;
  description?: string;
  ctaVariant?: 'aggressive' | 'social_proof' | 'value_focused';
}

export interface NewsletterHeroProps extends NewsletterCTABaseProps {
  variant: 'hero';
}

export interface NewsletterInlineProps extends NewsletterCTABaseProps {
  variant: 'inline';
}

export interface NewsletterMinimalProps extends NewsletterCTABaseProps {
  variant: 'minimal';
}

export interface NewsletterCardProps extends NewsletterCTABaseProps {
  variant: 'card';
}

export type NewsletterCTAVariantProps =
  | NewsletterHeroProps
  | NewsletterInlineProps
  | NewsletterMinimalProps
  | NewsletterCardProps;

/**
 * Render a newsletter CTA UI for the specified variant using contextual copy, experiment-driven copy, and runtime newsletter configuration.
 *
 * Loads newsletter configuration and subscriber count to determine final headline and description, then renders one of the supported variants ('hero', 'inline', 'minimal', 'card') or `null` when the variant is unrecognized.
 *
 * @param props - Component props.
 * @param props.variant - Visual variant to render: 'hero' | 'inline' | 'minimal' | 'card'.
 * @param props.source - Tracking/source identifier passed to the NewsletterForm.
 * @param props.className - Optional additional CSS classes applied to the root container.
 * @param props.category - Optional newsletter category used to select contextual copy.
 * @param props.headline - Optional explicit headline to override contextual/variant copy.
 * @param props.description - Optional explicit description to override contextual/variant copy.
 * @param props.ctaVariant - Optional CTA copy variant; defaults to 'value_focused' when omitted.
 * @returns The rendered CTA element corresponding to `props.variant`, or `null` if the variant is unsupported.
 *
 * @see NewsletterForm
 * @see loadNewsletterConfig
 * @see useNewsletterCount
 */
export function NewsletterCTAVariant(props: NewsletterCTAVariantProps) {
  const {
    variant,
    source,
    className,
    category,
    headline,
    description,
    ctaVariant: propCtaVariant,
  } = props;
  const { count, isLoading } = useNewsletterCount();
  const [newsletterConfig, setNewsletterConfig] = useState<Record<string, unknown>>({});
  const loadConfig = useLoggedAsync({
    scope: 'NewsletterCTAVariant',
    defaultMessage: 'Failed to load newsletter config',
    defaultLevel: 'warn',
    defaultRethrow: false,
  });

  // Load newsletter config from static defaults
  useEffect(() => {
    loadConfig(
      async () => {
        const config = await loadNewsletterConfig();
        setNewsletterConfig(config);
      },
      {
        context: {
          variant,
          category,
        },
      }
    ).catch((error) => {
      logUnhandledPromise('NewsletterCTAVariant: loadConfig failed', error, {
        variant,
        category,
      });
    });
  }, [category, loadConfig, variant]);

  // Use prop if provided, otherwise default to 'value_focused'
  const ctaVariant = propCtaVariant || 'value_focused';
  const subscriberCount = formatSubscriberCount(count);

  // Copy priority: explicit prop > contextual (if category) > experiment variant > default
  const { headline: contextHeadline, description: contextDescription } = getContextualMessage(
    category,
    newsletterConfig
  );
  const { headline: variantHeadline, description: variantDescription } = getCTAVariantCopy(
    ctaVariant,
    subscriberCount,
    newsletterConfig
  );

  const finalHeadline = headline || (category ? contextHeadline : variantHeadline);
  const finalDescription = description || (category ? contextDescription : variantDescription);

  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'w-full',
          `${radius.xl} border ${borderColor['border/50']}`,
          'bg-card/50',
          `${padding.xComfortable} ${padding.ySpacious} md:${padding.xSpacious} md:${padding.ySection} lg:${padding.xSpacious} lg:${padding.yLargish}`,
          'text-center',
          className
        )}
      >
        {/* Icon */}
        <motion.div 
          className={`${marginBottom.comfortable} inline-flex`}
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className={`${radius.xl} ${border.default} ${bgColor.background} ${padding.compact}`}>
            <Mail className={`${iconSize.md} ${textColor.foreground}`} aria-hidden="true" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2 
          className={`mx-auto ${marginBottom.compact} ${maxWidth.md} ${weight.semibold} ${size.xl} ${textColor.foreground} ${leading.tight} ${tracking.tight} md:${size['2xl']}`}
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {finalHeadline}
        </motion.h2>

        {/* Description */}
        <motion.p 
          className={`mx-auto ${marginBottom.comfortable} ${maxWidth.lg} ${muted.smRelaxed} md:${size.base}`}
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          {finalDescription}
        </motion.p>

        {/* Form */}
        <motion.div 
          className={`mx-auto ${maxWidth.sm}`}
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <NewsletterForm source={source} className="w-full" />
        </motion.div>

        {/* Footer info */}
        <motion.div 
          className={`${marginTop.default} flex ${flexDir.col} ${alignItems.center} ${gap.compact}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          <div className={cluster.compact}>
            <span className={`inline-flex h-1.5 w-1.5 ${radius.full} bg-green-500`} />
            {isLoading ? (
              <span className={`${muted.default} ${size.xs}`}>
                <span className={`inline-block ${skeletonSize.barXs} ${animate.pulse} rounded ${bgColor['muted/50']}`} />
              </span>
            ) : (
              <span className={`${muted.default} ${size.xs}`}>{subscriberCount} subscribers</span>
            )}
          </div>
          <p className={`${muted.default}/60 ${size.xs}`}>{NEWSLETTER_CTA_CONFIG.footerText}</p>
        </motion.div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Card
        className={cn(
          'border-primary/20 bg-linear-to-br from-primary/5 via-accent/5 to-background/95',
          `${shadow.lg} ${backdrop.sm}`,
          className
        )}
      >
        <CardHeader className="pb-5">
          <div className={`${cluster.default} ${marginBottom.compact}`}>
            <div className={`${radius.lg} border ${borderColor['primary/20']} ${bgColor['primary/10']} ${padding.between}`}>
              <Mail className={`${iconSize.md} ${textColor.primary}`} aria-hidden="true" />
            </div>
            <CardTitle className={`${weight.bold} ${size.xl}`}>{finalHeadline}</CardTitle>
          </div>
          <CardDescription className={`${size.base} ${leading.relaxed}`}>
            {finalDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          <NewsletterForm source={source} />
          <div className={`text-center ${muted.default} ${size.xs}`}>
            <span>{NEWSLETTER_CTA_CONFIG.footerText}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          `flex ${flexDir.col} ${alignItems.stretch} ${justify.between} ${gap.comfortable} ${padding.default} sm:flex-row sm:items-center sm:${padding.medium}`,
          `${radius.lg} border ${borderColor[`border/50`]} ${bgColor['accent/5']}`,
          className
        )}
      >
        <div className={`${cluster.default} min-w-0 ${flexGrow['1']}`}>
          <Mail className={`${iconSize.md} ${flexGrow.shrink0} ${textColor.primary}`} aria-hidden="true" />
          <div className={`min-w-0 ${flexGrow['1']}`}>
            <p className={`truncate ${weight.medium} ${size.sm}`}>{finalHeadline}</p>
            <p className={`truncate ${muted.default} ${size.xs}`}>{finalDescription}</p>
          </div>
        </div>
        <NewsletterForm
          source={source}
          className={`w-full sm:w-auto sm:${minWidth.newsletterForm} sm:${maxWidth.newsletterForm}`}
        />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card
        className={cn(
          `flex h-full ${shadow.lg} bg-linear-to-br from-primary/5 via-accent/5 to-background/95`,
          flexDir.col,
          borderColor['primary/20'],
          backdrop.sm,
          className
        )}
      >
        <CardHeader className="flex-1">
          <div className={marginBottom.default}>
            <div className={cn('inline-flex border', radius.lg, borderColor['primary/20'], bgColor['primary/10'], padding.compact)}>
              <Mail className={cn(iconSize.lg, textColor.primary)} aria-hidden="true" />
            </div>
          </div>
          <CardTitle className={cn(marginBottom.compact, weight.bold, size.xl)}>{finalHeadline}</CardTitle>
          <CardDescription className={cn(size.sm, leading.relaxed)}>{finalDescription}</CardDescription>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          <NewsletterForm source={source} />
          <div className="text-center">
            <p className={cn(muted.default, size.xs)}>{NEWSLETTER_CTA_CONFIG.footerText}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}