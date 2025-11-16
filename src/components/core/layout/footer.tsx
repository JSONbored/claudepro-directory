/**
 * Site Footer Component
 * Provides navigation links and llms.txt discovery
 * Enhanced with Motion.dev magnetic hover effects (Phase 1.5 - October 2025)
 *
 * @module components/layout/footer
 */

'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { memo, useEffect, useMemo, useState } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
import { ThemeToggle } from '@/src/components/core/layout/theme-toggle';
import { getAnimationConfig } from '@/src/lib/actions/feature-flags.actions';
import { APP_CONFIG, EXTERNAL_SERVICES, ROUTES } from '@/src/lib/data/config/constants';
import { getContactChannels } from '@/src/lib/data/marketing/contact';
import { DiscordIcon, ExternalLink, Github, Rss, Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { RESPONSIVE_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Footer Component
 *
 * @returns Footer with navigation links, social links, and llms.txt discovery
 *
 * @remarks
 * Includes llms.txt link for AI assistant discoverability per LLMs.txt specification
 */
const CONTACT_CHANNELS = getContactChannels();

function FooterComponent() {
  const currentYear = new Date().getFullYear();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });

  // Context-aware RSS feed - shows most relevant feed for current page
  const rssFeed = useMemo(() => {
    if (pathname?.startsWith('/agents')) return { url: '/agents/rss.xml', label: 'Agents Feed' };
    if (pathname?.startsWith('/mcp')) return { url: '/mcp/rss.xml', label: 'MCP Feed' };
    if (pathname?.startsWith('/rules')) return { url: '/rules/rss.xml', label: 'Rules Feed' };
    if (pathname?.startsWith('/commands'))
      return { url: '/commands/rss.xml', label: 'Commands Feed' };
    if (pathname?.startsWith('/hooks')) return { url: '/hooks/rss.xml', label: 'Hooks Feed' };
    if (pathname?.startsWith('/statuslines'))
      return { url: '/statuslines/rss.xml', label: 'Statuslines Feed' };
    if (pathname?.startsWith('/skills')) return { url: '/skills/rss.xml', label: 'Skills Feed' };
    if (pathname?.startsWith('/collections'))
      return { url: '/collections/rss.xml', label: 'Collections Feed' };
    if (pathname?.startsWith('/guides')) return { url: '/guides/rss.xml', label: 'Guides Feed' };
    if (pathname?.startsWith('/changelog'))
      return { url: '/changelog/rss.xml', label: 'Changelog Feed' };
    return { url: '/rss.xml', label: 'RSS Feed' }; // Default: site-wide feed
  }, [pathname]);

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getAnimationConfig({})
      .then((result) => {
        if (!result?.data) return;
        const config = result.data;
        setSpringDefault({
          type: 'spring' as const,
          stiffness: config['animation.spring.default.stiffness'],
          damping: config['animation.spring.default.damping'],
        });
      })
      .catch((error) => {
        logger.error('Footer: failed to load animation config', error);
      });
  }, []);

  return (
    <footer className={'border-border/50 border-t bg-background/95 backdrop-blur'}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Four-column grid with better mobile stacking */}
        <div className={UI_CLASSES.GRID_COLS_1_MD_2_LG_4}>
          {/* About Section - Takes full width on mobile */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className={'mb-4 flex justify-center md:justify-start'}>
              <HeyClaudeLogo size="md" inView={true} duration={1.5} />
            </div>
            <p
              className={`mx-auto mb-6 max-w-sm text-muted-foreground md:mx-0 ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_SM}`}
            >
              {APP_CONFIG.description}
            </p>

            {/* Social Icons + Theme Toggle + Badge - Vertical stack */}
            <div className={UI_CLASSES.FLEX_COL_MD_ITEMS_START}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_4}>
                {[
                  { href: CONTACT_CHANNELS.github, icon: Github, label: 'GitHub' },
                  { href: CONTACT_CHANNELS.discord, icon: DiscordIcon, label: 'Discord' },
                ].map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-icon text-muted-foreground"
                    aria-label={social.label}
                  >
                    <social.icon className={UI_CLASSES.ICON_MD} />
                  </Link>
                ))}
                {/* Theme Toggle */}
                <ThemeToggle />
              </div>

              {/* Open Source Badge */}
              <UnifiedBadge
                variant="base"
                style="outline"
                className="border-accent/20 bg-accent/5 text-accent"
              >
                <ExternalLink className="mr-1 h-3 w-3 text-accent" />
                Open Source
              </UnifiedBadge>
            </div>
          </motion.div>

          {/* Browse - All 8 main categories */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className={`mb-4 font-semibold ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_MD}`}>
              Browse
            </h3>
            <ul className={'space-y-3 md:space-y-2'}>
              {[
                { href: ROUTES.AGENTS, label: 'Agents' },
                { href: ROUTES.MCP, label: 'MCP Servers' },
                { href: ROUTES.COMMANDS, label: 'Commands' },
                { href: ROUTES.RULES, label: 'Rules' },
                { href: ROUTES.HOOKS, label: 'Hooks' },
                { href: ROUTES.STATUSLINES, label: 'Statuslines' },
                { href: ROUTES.SKILLS, label: 'Skills' },
                { href: ROUTES.COLLECTIONS, label: 'Collections' },
              ].map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, x: 3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springDefault}
                    className="inline-block"
                  >
                    <Link
                      href={link.href}
                      className={`link-accent-underline text-muted-foreground transition-colors hover:text-foreground ${UI_CLASSES.TEXT_XS}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className={`mb-4 font-semibold ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_MD}`}>
              Resources
            </h3>
            <ul className={'space-y-3 md:space-y-2'}>
              {[
                { href: ROUTES.GUIDES, label: 'Guides', icon: null },
                { href: ROUTES.CHANGELOG, label: 'Changelog', icon: null },
                { href: ROUTES.COMMUNITY, label: 'Community', icon: null },
                { href: ROUTES.SUBMIT, label: 'Submit Content', icon: null },
                { href: ROUTES.PARTNER, label: 'Partner Program', icon: null },
                { href: rssFeed.url, label: rssFeed.label, icon: Rss },
                { href: ROUTES.LLMS_TXT, label: 'LLMs.txt', icon: Sparkles },
              ].map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, x: 3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springDefault}
                    className="inline-block"
                  >
                    <Link
                      href={link.href}
                      className={`inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground ${UI_CLASSES.TEXT_XS}`}
                      aria-label={link.label}
                    >
                      {link.icon && <link.icon className={UI_CLASSES.ICON_SM} />}
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h3 className={`mb-4 font-semibold ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_MD}`}>
              Support
            </h3>
            <ul className={'space-y-3 md:space-y-2'}>
              {[
                { href: '/consulting', label: 'Work with JSONbored' },
                { href: '/cookies', label: 'Cookie Policy' },
                { href: '/contact', label: 'Contact Us' },
                { href: '/help', label: 'Help Center' },
                { href: '/accessibility', label: 'Accessibility' },
                { href: '/sitemap.xml', label: 'Sitemap' },
              ].map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, x: 3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springDefault}
                    className="inline-block"
                  >
                    <Link
                      href={link.href}
                      className={`link-accent-underline text-muted-foreground transition-colors hover:text-foreground ${UI_CLASSES.TEXT_XS}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar - Clean layout */}
        <motion.div
          className={
            'mt-8 flex flex-col items-center justify-between gap-4 border-border/30 border-t pt-6 md:mt-12 md:flex-row'
          }
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {/* Left: Copyright */}
          <div className="text-muted-foreground text-sm">
            <p>© {currentYear} heyclau.de / Claude Pro Directory. All rights reserved.</p>
          </div>

          {/* Right: Status Badge */}
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER}>
            {/* BetterStack Status Badge - Theme-aware */}
            {mounted && (
              <iframe
                src={`${EXTERNAL_SERVICES.betterstack.status}/badge?theme=${resolvedTheme === 'light' ? 'light' : 'dark'}`}
                width="250"
                height="30"
                frameBorder="0"
                scrolling="no"
                title="System Status"
                className="rounded-md"
                loading="lazy"
                style={{ colorScheme: 'normal' }}
              />
            )}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

export const Footer = memo(FooterComponent);
Footer.displayName = 'Footer';
