/**
 * Site Footer Component
 * Provides navigation links and llms.txt discovery
 * Enhanced with Motion.dev magnetic hover effects (Phase 1.5 - October 2025)
 *
 * @module components/layout/footer
 */

'use client';

import { useEffect } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { PrefetchLink } from '@/src/components/shared/prefetch-link';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { DiscordIcon, ExternalLink, Github, Sparkles } from '@/src/lib/icons';
import { preloadMotion, useLazyMotion } from '@/src/lib/utils/use-lazy-motion';

/**
 * Footer Component
 *
 * @returns Footer with navigation links, social links, and llms.txt discovery
 *
 * @remarks
 * Includes llms.txt link for AI assistant discoverability per LLMs.txt specification
 */
export function Footer() {
  const motionModule = useLazyMotion();
  const motion = motionModule?.motion;
  const MotionDiv =
    motion?.div ??
    ((props: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{props.children}</div>);
  const MotionP =
    motion?.p ??
    ((props: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{props.children}</p>);

  useEffect(() => {
    preloadMotion();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className={'border-t border-border/50 bg-background/95 backdrop-blur'}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Three-column grid with better mobile stacking */}
        <div className="grid gap-8 md:gap-12 grid-cols-1 md:grid-cols-3">
          {/* About Section - Takes full width on mobile */}
          <MotionDiv className="text-center md:text-left">
            <h3 className={'font-semibold mb-4 text-lg md:text-base'}>{APP_CONFIG.name}</h3>
            <p className={'text-sm md:text-xs text-muted-foreground mb-6 max-w-sm mx-auto md:mx-0'}>
              {APP_CONFIG.description}
            </p>

            {/* Social Icons - Larger on mobile */}
            <div className="flex items-center justify-center md:justify-start gap-6 md:gap-4">
              {[
                { href: SOCIAL_LINKS.github || '#', icon: Github, label: 'GitHub' },
                { href: SOCIAL_LINKS.discord || '#', icon: DiscordIcon, label: 'Discord' },
              ].map((social) => (
                <MotionDiv key={social.label}>
                  <PrefetchLink
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                    prefetchDelay={150}
                  >
                    <social.icon className="h-7 w-7 md:h-5 md:w-5" />
                  </PrefetchLink>
                </MotionDiv>
              ))}

              {/* Open Source Badge - Hide on small mobile */}
              <div className="hidden sm:block">
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className="border-accent/20 bg-accent/5 text-accent"
                >
                  <ExternalLink className="h-3 w-3 mr-1 text-accent" />
                  Open Source
                </UnifiedBadge>
              </div>
            </div>
          </MotionDiv>

          {/* Quick Links - Staggered fade-in */}
          <MotionDiv className="text-center md:text-left">
            <h3 className={'font-semibold mb-4 text-lg md:text-base'}>Quick Links</h3>
            <ul className={'space-y-3 md:space-y-2'}>
              {[
                { href: ROUTES.GUIDES, label: 'Guides' },
                { href: ROUTES.COLLECTIONS, label: 'Collections' },
                { href: ROUTES.CHANGELOG, label: 'Changelog' },
                { href: ROUTES.COMMUNITY, label: 'Community' },
                { href: ROUTES.SUBMIT, label: 'Submit' },
              ].map((link) => (
                <MotionDiv key={link.href}>
                  <div className="inline-block">
                    <PrefetchLink
                      href={link.href}
                      className="text-base md:text-sm text-muted-foreground hover:text-foreground transition-colors"
                      prefetchDelay={200}
                    >
                      {link.label}
                    </PrefetchLink>
                  </div>
                </MotionDiv>
              ))}
            </ul>
          </MotionDiv>

          {/* AI & Resources */}
          <MotionDiv className="text-center md:text-left">
            <h3 className={'font-semibold mb-4 text-lg md:text-base'}>AI & Resources</h3>
            <ul className={'space-y-3 md:space-y-2'}>
              {[
                { href: ROUTES.LLMS_TXT, label: 'LLMs.txt', icon: Sparkles },
                { href: ROUTES.API_DOCS, label: 'API Docs', icon: null },
                { href: ROUTES.PARTNER, label: 'Partner Program', icon: null },
              ].map((link) => (
                <MotionDiv key={link.href}>
                  <div className="inline-block">
                    <PrefetchLink
                      href={link.href}
                      className="text-base md:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      aria-label={link.label}
                      prefetchDelay={200}
                    >
                      {link.icon && <link.icon className="h-4 w-4" />}
                      <span>{link.label}</span>
                    </PrefetchLink>
                  </div>
                </MotionDiv>
              ))}
            </ul>
          </MotionDiv>
        </div>

        {/* Bottom Bar - Better mobile layout */}
        <MotionDiv
          className={
            'mt-8 md:mt-12 pt-6 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4'
          }
        >
          <p className={'text-sm text-muted-foreground text-center md:text-left'}>
            © {currentYear} {APP_CONFIG.author}. All rights reserved.
          </p>
          <MotionP className={'text-xs text-muted-foreground'}>
            <PrefetchLink
              href={ROUTES.LLMS_TXT}
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              prefetchDelay={150}
            >
              <Sparkles className="h-3 w-3" />
              AI-optimized content available
            </PrefetchLink>
          </MotionP>
        </MotionDiv>
      </div>
    </footer>
  );
}
