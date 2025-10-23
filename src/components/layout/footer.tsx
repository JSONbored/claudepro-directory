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
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { DiscordIcon, ExternalLink, Github, Sparkles } from '@/src/lib/icons';

/**
 * Footer Component
 *
 * @returns Footer with navigation links, social links, and llms.txt discovery
 *
 * @remarks
 * Includes llms.txt link for AI assistant discoverability per LLMs.txt specification
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={'border-t border-border/50 bg-background/95 backdrop-blur'}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Three-column grid with better mobile stacking */}
        <div className="grid gap-8 md:gap-12 grid-cols-1 md:grid-cols-3">
          {/* About Section - Takes full width on mobile */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
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
                <motion.div
                  key={social.label}
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-7 w-7 md:h-5 md:w-5" />
                  </Link>
                </motion.div>
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
          </motion.div>

          {/* Quick Links - Staggered fade-in */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className={'font-semibold mb-4 text-lg md:text-base'}>Quick Links</h3>
            <ul className={'space-y-3 md:space-y-2'}>
              {[
                { href: ROUTES.GUIDES, label: 'Guides' },
                { href: ROUTES.COLLECTIONS, label: 'Collections' },
                { href: ROUTES.CHANGELOG, label: 'Changelog' },
                { href: ROUTES.COMMUNITY, label: 'Community' },
                { href: ROUTES.SUBMIT, label: 'Submit' },
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
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="inline-block"
                  >
                    <Link
                      href={link.href}
                      className="text-base md:text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* AI & Resources */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className={'font-semibold mb-4 text-lg md:text-base'}>AI & Resources</h3>
            <ul className={'space-y-3 md:space-y-2'}>
              {[
                { href: ROUTES.LLMS_TXT, label: 'LLMs.txt', icon: Sparkles },
                { href: ROUTES.PARTNER, label: 'Partner Program', icon: null },
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
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="inline-block"
                  >
                    <Link
                      href={link.href}
                      className="text-base md:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      aria-label={link.label}
                    >
                      {link.icon && <link.icon className="h-4 w-4" />}
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar - Better mobile layout */}
        <motion.div
          className={
            'mt-8 md:mt-12 pt-6 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4'
          }
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className={'text-sm text-muted-foreground text-center md:text-left'}>
            © {currentYear} {APP_CONFIG.author}. All rights reserved.
          </p>
          <motion.p className={'text-xs text-muted-foreground'} whileHover={{ scale: 1.05 }}>
            <Link
              href={ROUTES.LLMS_TXT}
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3" />
              AI-optimized content available
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </footer>
  );
}
