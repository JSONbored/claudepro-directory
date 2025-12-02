'use client';

import type { Database } from '@heyclaude/database-types';
import { getAppSettings, getNewsletterConfig } from '@heyclaude/web-runtime/config/static-configs';
import {
  ensureNumber,
  ensureStringArray,
  logUnhandledPromise,
  NEWSLETTER_CTA_CONFIG,
} from '@heyclaude/web-runtime/core';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Mail, X } from '@heyclaude/web-runtime/icons';
import {
  absolute,
  animateDuration,
  between,
  bgColor,
  borderColor,
  borderTop,
  cluster,
  fixed,
  flexGrow,
  gap,
  iconSize,
  alignItems,
  justify,
  maxWidth,
  muted,
  padding,
  radius,
  size,
  stack,
  textColor,
  weight,
  zLayer,
} from '@heyclaude/web-runtime/design-system';
import { minWidth } from '@heyclaude/web-runtime/design-system';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';

import { NewsletterForm } from './newsletter-form';

export interface NewsletterFooterBarProps {
  source: Database['public']['Enums']['newsletter_source'];
  dismissible?: boolean;
  showAfterDelay?: number;
  respectInlineCTA?: boolean;
  ctaVariant?: 'aggressive' | 'social_proof' | 'value_focused';
}

/**
 * Renders a bottom-fixed newsletter signup bar that appears after a configurable delay and can be dismissed.
 *
 * The bar respects an inline-CTA whitelist from app settings, supports three copy variants, and renders
 * responsive layouts (desktop and mobile). If dismissed or if an inline CTA is active on the current path,
 * the component does not render.
 *
 * @param props.source - Source identifier used by NewsletterForm for signups
 * @param props.dismissible - Whether a dismiss button is shown and dismissal state is persisted to localStorage (default: true)
 * @param props.showAfterDelay - Milliseconds to wait before showing the bar; if undefined, the value is loaded from newsletter config or defaults to 30000
 * @param props.respectInlineCTA - When true, suppresses the footer bar on pages configured to show an inline CTA (default: true)
 * @param props.ctaVariant - Copy variant to use: 'aggressive', 'social_proof', or 'value_focused' (default: 'value_focused')
 * @returns The newsletter footer bar element when visible, or `null` when hidden or suppressed
 *
 * @see NewsletterForm
 * @see NEWSLETTER_CTA_CONFIG
 */
export function NewsletterFooterBar({
  source,
  dismissible = true,
  showAfterDelay,
  respectInlineCTA = true,
  ctaVariant = 'value_focused',
}: NewsletterFooterBarProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pagesWithInlineCTA, setPagesWithInlineCTA] = useState<string[]>([]);
  const [delayMs, setDelayMs] = useState(showAfterDelay ?? 30000);
  const loadConfigs = useLoggedAsync({
    scope: 'NewsletterFooterBar',
    defaultMessage: 'Failed to load newsletter footer configs',
    defaultLevel: 'warn',
    defaultRethrow: false,
  });

  useEffect(() => {
    loadConfigs(
      async () => {
        // Get configs from static defaults
        const appConfig = getAppSettings();
        const newsletterConfig = getNewsletterConfig();

        const excludedPages = ensureStringArray(appConfig['newsletter.excluded_pages']);
        if (excludedPages.length > 0) {
          setPagesWithInlineCTA(excludedPages);
        }

        if (showAfterDelay === undefined) {
          const configDelay = ensureNumber(
            newsletterConfig['newsletter.footer_bar.show_after_delay_ms'],
            30000
          );
          setDelayMs(configDelay);
        }
      },
      {
        context: {
          pathname,
          respectInlineCTA,
          dismissible,
        },
      }
    ).catch((error) => {
      logUnhandledPromise('NewsletterFooterBar: loadConfigs failed', error, {
        pathname,
        respectInlineCTA,
        dismissible,
      });
    });
  }, [dismissible, loadConfigs, pathname, respectInlineCTA, showAfterDelay]);

  const hasInlineCTA =
    respectInlineCTA && pagesWithInlineCTA.some((page) => pathname?.startsWith(page));

  useEffect(() => {
    setIsClient(true);

    const isDismissed = localStorage.getItem('newsletter-bar-dismissed');

    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);

      return () => {
        clearTimeout(timer);
      };
    }

    return undefined;
  }, [delayMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter-bar-dismissed', 'true');
  };

  if (!(isClient && isVisible) || hasInlineCTA) {
    return null;
  }

  return (
    <aside
      className={`slide-in-from-bottom ${fixed.bottomFullResponsive} ${zLayer.modal} animate-in ${borderTop.strong} bg-background/95 backdrop-blur-xl ${animateDuration.slow}`}
      aria-label="Newsletter signup"
    >
      <div
        className={`${absolute.topFull} h-px bg-linear-to-r from-transparent via-(--color-accent)/30 to-transparent`}
      />
      <div className={`container mx-auto ${padding.xDefault} ${padding.yComfortable} md:py-4`}>
        {/* Desktop layout */}
        <div className={`mx-auto hidden ${maxWidth['5xl']} ${alignItems.center} ${justify.between} ${gap.relaxed} md:flex`}>
          <div className={`flex ${flexGrow.shrink0} ${alignItems.center} ${gap.default}`}>
            <div className={`${radius.lg} border ${borderColor['accent/20']} ${bgColor['accent/10']} ${padding.between}`}>
              <Mail className={`${iconSize.md} ${textColor.accent}`} aria-hidden="true" />
            </div>
            <div>
              <p className={`${weight.semibold} ${size.base} ${textColor.foreground}`}>
                {ctaVariant === 'aggressive'
                  ? "⚡ Don't miss out!"
                  : ctaVariant === 'social_proof'
                    ? '✨ Join 12,000+ Claude builders'
                    : NEWSLETTER_CTA_CONFIG.headline}
              </p>
              <p className={muted.sm}>
                {ctaVariant === 'aggressive'
                  ? 'Get weekly AI updates before everyone else'
                  : ctaVariant === 'social_proof'
                    ? 'The best Claude resources, curated weekly'
                    : NEWSLETTER_CTA_CONFIG.description}
              </p>
            </div>
          </div>
          <div className={`flex ${flexGrow.shrink0} ${alignItems.center} ${gap.default}`}>
            <NewsletterForm source={source} className={minWidth.newsletterFormLg} />
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
                className="shrink-0"
              >
                <X className={iconSize.sm} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className={`${stack.default} md:hidden`}>
          <div className={between.center}>
            <div className={cluster.compact}>
              <Mail className={`${iconSize.sm} ${flexGrow.shrink0}`} aria-hidden="true" />
              <p className={`${weight.medium} ${textColor.foreground} ${size.sm}`}>
                {ctaVariant === 'aggressive'
                  ? "⚡ Don't miss out!"
                  : ctaVariant === 'social_proof'
                    ? '✨ Join 12k+ builders'
                    : NEWSLETTER_CTA_CONFIG.headline}
              </p>
            </div>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
              >
                <X className={iconSize.sm} aria-hidden="true" />
              </Button>
            )}
          </div>
          <NewsletterForm source={source} />
        </div>
      </div>
    </aside>
  );
}