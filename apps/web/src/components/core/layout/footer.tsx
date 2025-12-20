/**
 * Site Footer Component
 * Modern, engaging footer with visual hierarchy and responsive design
 * Enhanced with Motion.dev animations (November 2025)
 *
 * @module components/layout/footer
 */

'use client';

import { getContactChannels } from '@heyclaude/web-runtime/config/marketing-client';
import {
  APP_CONFIG,
  EXTERNAL_SERVICES,
  ROUTES,
} from '@heyclaude/web-runtime/data/config/constants';
import {
  DiscordIcon,
  ExternalLink,
  Github,
  Heart,
  Rss,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import { cn, UnifiedBadge, ThemeToggle } from '@heyclaude/web-runtime/ui';
import { STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { memo, useEffect, useMemo } from 'react';

import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';

import { APP_VERSION } from '@heyclaude/web-runtime/data/config/version';

// Type for resource links with optional icon
interface ResourceLink {
  href: string;
  icon?: typeof Rss;
  label: string;
}

/**
 * Footer Component
 *
 * @returns Footer with navigation links, social links, and llms.txt discovery
 *
 * @remarks
 * Includes llms.txt link for AI assistant discoverability per LLMs.txt specification
 */
const CONTACT_CHANNELS = getContactChannels();

/**
 * Renders the site footer with branding, navigation columns (Browse, Resources, Support, Legal), social links, a theme toggle, and a theme-aware system status badge.
 *
 * The Resources column adapts its RSS entry to the current pathname. Rendering of the external status badge is deferred until client mount to avoid hydration mismatches and to apply the current theme.
 *
 * @returns The footer element containing branding, navigation links, social icons, and a status badge.
 *
 * @see APP_CONFIG
 * @see ROUTES
 * @see CONTACT_CHANNELS
 */
function FooterComponent() {
  const currentYear = new Date().getFullYear();
  const { resolvedTheme } = useTheme();
  const { value: mounted, setTrue: setMountedTrue } = useBoolean();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

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
    setMountedTrue();
  }, []);

  // Navigation link groups
  const browseLinks = [
    { href: ROUTES.AGENTS, label: 'Agents' },
    { href: ROUTES.MCP, label: 'MCP Servers' },
    { href: ROUTES.COMMANDS, label: 'Commands' },
    { href: ROUTES.RULES, label: 'Rules' },
    { href: ROUTES.HOOKS, label: 'Hooks' },
    { href: ROUTES.STATUSLINES, label: 'Statuslines' },
    { href: ROUTES.SKILLS, label: 'Skills' },
    { href: ROUTES.COLLECTIONS, label: 'Collections' },
  ];

  const resourceLinks: ResourceLink[] = [
    { href: ROUTES.GUIDES, label: 'Guides' },
    { href: ROUTES.CHANGELOG, label: 'Changelog' },
    { href: ROUTES.COMMUNITY, label: 'Community' },
    { href: ROUTES.SUBMIT, label: 'Submit' },
    { href: rssFeed.url, label: 'RSS', icon: Rss },
    { href: ROUTES.LLMS_TXT, label: 'LLMs.txt', icon: Sparkles },
    { href: CONTACT_CHANNELS.github, label: 'View on GitHub', icon: Github },
  ];

  const supportLinks = [
    { href: '/consulting', label: 'Work with JSONbored' },
    { href: '/contact', label: 'Contact' },
    { href: '/help', label: 'Help' },
    { href: '/accessibility', label: 'Accessibility' },
  ];

  const legalLinks = [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/cookies', label: 'Cookies' },
  ];

  return (
    <footer className="border-border/50 bg-background border-t">
      {/* Newsletter CTA - Full width above footer links, same as homepage */}
      <LazySection rootMargin="0px 0px -500px 0px">
        <NewsletterCTAVariant variant="hero" source="footer" />
      </LazySection>

      <div className="container mx-auto px-4 py-4 lg:py-12">
        {/* Main footer content - Two section layout */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_2.5fr] lg:gap-3">
          {/* Left section - Brand & Social */}
          {mounted ? (
            <motion.div
              className="space-y-6"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: DURATION.slow }}
            >
              {/* Logo */}
              <div>
                <HeyClaudeLogo size="md" inView duration={1.5} />
              </div>

              {/* Description */}
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                {APP_CONFIG.description}
              </p>

              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { href: CONTACT_CHANNELS.github, icon: Github, label: 'GitHub' },
                  { href: CONTACT_CHANNELS.discord, icon: DiscordIcon, label: 'Discord' },
                ].map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </Link>
                ))}
                <ThemeToggle />
              </div>

              {/* Badge */}
              <UnifiedBadge
                variant="base"
                style="outline"
                className="border-accent/20 bg-accent/5 text-accent"
              >
                <ExternalLink className={cn('mr-0.5', 'h-3 w-3')} />
                Open Source
              </UnifiedBadge>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <HeyClaudeLogo size="md" inView duration={1.5} />
              </div>

              {/* Description */}
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                {APP_CONFIG.description}
              </p>

              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { href: CONTACT_CHANNELS.github, icon: Github, label: 'GitHub' },
                  { href: CONTACT_CHANNELS.discord, icon: DiscordIcon, label: 'Discord' },
                ].map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </Link>
                ))}
                <ThemeToggle />
              </div>

              {/* Badge */}
              <UnifiedBadge
                variant="base"
                style="outline"
                className="border-accent/20 bg-accent/5 text-accent"
              >
                <ExternalLink className={cn('mr-0.5', 'h-3 w-3')} />
                Open Source
              </UnifiedBadge>
            </div>
          )}

          {/* Right section - Navigation grid */}
          {mounted ? (
            <motion.div
              className="grid grid-cols-2 gap-6 sm:grid-cols-4"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: DURATION.slow, delay: STAGGER.fast }}
            >
              {/* Browse column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Browse</h3>
                <ul className="space-y-1.5">
                  {browseLinks.map((link) => (
                    <li key={`browse-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Resources</h3>
                <ul className="space-y-1.5">
                  {resourceLinks.map((link) => {
                    const isExternal = link.href.startsWith('http');
                    return (
                      <li key={`resources-${link.label}`}>
                        <Link
                          href={link.href}
                          className={cn(
                            'text-muted-foreground hover:text-foreground inline-flex items-center text-sm',
                            'gap-1.5',
                            'transition-colors'
                          )}
                          {...(isExternal && {
                            target: '_blank',
                            rel: 'noopener noreferrer',
                          })}
                        >
                          {link.icon ? <link.icon className="h-3.5 w-3.5" /> : null}
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Support column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Support</h3>
                <ul className="space-y-1.5">
                  {supportLinks.map((link) => (
                    <li key={`support-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Legal</h3>
                <ul className="space-y-1.5">
                  {legalLinks.map((link) => (
                    <li key={`legal-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {/* Browse column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Browse</h3>
                <ul className="space-y-1.5">
                  {browseLinks.map((link) => (
                    <li key={`browse-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Resources</h3>
                <ul className="space-y-1.5">
                  {resourceLinks.map((link) => {
                    const isExternal = link.href.startsWith('http');
                    return (
                      <li key={`resources-${link.label}`}>
                        <Link
                          href={link.href}
                          className={cn(
                            'text-muted-foreground hover:text-foreground inline-flex items-center text-sm',
                            'gap-1.5',
                            'transition-colors'
                          )}
                          {...(isExternal && {
                            target: '_blank',
                            rel: 'noopener noreferrer',
                          })}
                        >
                          {link.icon ? <link.icon className="h-3.5 w-3.5" /> : null}
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Support column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Support</h3>
                <ul className="space-y-1.5">
                  {supportLinks.map((link) => (
                    <li key={`support-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal column */}
              <div>
                <h3 className="text-foreground mb-4 text-sm font-semibold">Legal</h3>
                <ul className="space-y-1.5">
                  {legalLinks.map((link) => (
                    <li key={`legal-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar - Modern divider and layout */}
        {mounted ? (
          <motion.div
            className="border-border/30 mt-4 border-t pt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: STAGGER.slow }}
          >
            <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
              {/* Left - Copyright with heart and version */}
              <div className={cn('text-muted-foreground flex items-center text-sm', 'gap-1.5')}>
                <span>© {currentYear}</span>
                <span className="text-border">•</span>
                <span>Made with</span>
                <Heart className="h-3.5 w-3.5 fill-red-500/80 text-red-500/80" />
                <span>by</span>
                <Link
                  href="/consulting"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  JSONbored
                </Link>
                <span className="text-border">•</span>
                {/* 
                  Version Display - Links to changelog page
                  
                  Displays the current application version from root package.json.
                  The version links to /changelog where users can see all release entries.
                  
                  **Version Management Workflow:**
                  1. Generate changelog: `pnpm changelog:generate`
                  2. Bump version: `pnpm bump:patch/minor/major`
                  3. Commit: `git commit -m "chore: bump version to X.Y.Z"`
                  4. Tag: `git tag vX.Y.Z && git push origin main --tags`
                  5. GitHub Actions automatically creates release
                  
                  **When to Bump:**
                  - Patch: Bug fixes, small improvements, docs
                  - Minor: New features, new pages, significant improvements
                  - Major: Breaking changes, major redesigns, architecture changes
                  
                  @see {@link ../../../../../../packages/generators/src/commands/bump-version.ts | Version Bump Script}
                  @see {@link ../../../../../../.github/workflows/release.yml | GitHub Release Workflow}
                */}
                <Link
                  href="/changelog"
                  className="hover:text-foreground font-mono text-xs transition-colors"
                  title={`Version ${APP_VERSION} - View changelog and release history`}
                >
                  v{APP_VERSION}
                </Link>
              </div>

              {/* Right - Status badge */}
              <div className="flex items-center gap-3">
                {mounted ? (
                  <iframe
                    src={`${EXTERNAL_SERVICES.betterstack.status}/badge?theme=${resolvedTheme === 'light' ? 'light' : 'dark'}`}
                    width="250"
                    height="30"
                    title="System Status"
                    className={cn('overflow-hidden rounded-md border-0 [color-scheme:normal]')}
                    loading="lazy"
                  />
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="border-border/30 mt-4 border-t pt-8">
            <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
              {/* Left - Copyright with heart and version */}
              <div className={cn('text-muted-foreground flex items-center text-sm', 'gap-1.5')}>
                <span>© {currentYear}</span>
                <span className="text-border">•</span>
                <span>Made with</span>
                <Heart className="h-3.5 w-3.5 fill-red-500/80 text-red-500/80" />
                <span>by</span>
                <Link
                  href="/consulting"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  JSONbored
                </Link>
                <span className="text-border">•</span>
                {/* 
                  Version Display - Links to changelog page
                  
                  Displays the current application version from root package.json.
                  The version links to /changelog where users can see all release entries.
                  
                  **Version Management Workflow:**
                  1. Generate changelog: `pnpm changelog:generate`
                  2. Bump version: `pnpm bump:patch/minor/major`
                  3. Commit: `git commit -m "chore: bump version to X.Y.Z"`
                  4. Tag: `git tag vX.Y.Z && git push origin main --tags`
                  5. GitHub Actions automatically creates release
                  
                  **When to Bump:**
                  - Patch: Bug fixes, small improvements, docs
                  - Minor: New features, new pages, significant improvements
                  - Major: Breaking changes, major redesigns, architecture changes
                  
                  @see {@link ../../../../../../packages/generators/src/commands/bump-version.ts | Version Bump Script}
                  @see {@link ../../../../../../.github/workflows/release.yml | GitHub Release Workflow}
                */}
                <Link
                  href="/changelog"
                  className="hover:text-foreground font-mono text-xs transition-colors"
                  title={`Version ${APP_VERSION} - View changelog and release history`}
                >
                  v{APP_VERSION}
                </Link>
              </div>

              {/* Right - Status badge */}
              <div className="flex items-center gap-3">
                {/* Status badge only renders after mount */}
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

export const Footer = memo(FooterComponent);
Footer.displayName = 'Footer';
