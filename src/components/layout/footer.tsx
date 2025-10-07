/**
 * Site Footer Component
 * Provides navigation links and llms.txt discovery
 *
 * @module components/layout/footer
 */

import Link from 'next/link';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { DiscordIcon, Github, Sparkles } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    <footer className={`${UI_CLASSES.BORDER_T} border-border/50 bg-background/95 backdrop-blur`}>
      <div className="container mx-auto px-4 py-8">
        <div className={`${UI_CLASSES.GRID_RESPONSIVE_3} ${UI_CLASSES.GAP_8}`}>
          {/* About Section */}
          <div>
            <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_4}`}>{APP_CONFIG.name}</h3>
            <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED} ${UI_CLASSES.MB_4}`}>
              {APP_CONFIG.description}
            </p>
            <div className={`flex ${UI_CLASSES.GAP_4}`}>
              <Link
                href={SOCIAL_LINKS.github || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href={SOCIAL_LINKS.discord || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                aria-label="Discord"
              >
                <DiscordIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_4}`}>Quick Links</h3>
            <ul className={`space-y-2 ${UI_CLASSES.TEXT_SM}`}>
              <li>
                <Link
                  href="/guides"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                >
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                >
                  Submit
                </Link>
              </li>
            </ul>
          </div>

          {/* AI & Resources Section */}
          <div>
            <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_4}`}>AI & Resources</h3>
            <ul className={`space-y-2 ${UI_CLASSES.TEXT_SM}`}>
              <li>
                <Link
                  href="/llms.txt"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH} inline-flex items-center ${UI_CLASSES.GAP_2}`}
                  aria-label="LLMs.txt - AI-optimized content"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>LLMs.txt</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/api-docs"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                >
                  API Docs
                </Link>
              </li>
              <li>
                <Link
                  href="/partner"
                  className={`${UI_CLASSES.TEXT_MUTED} hover:text-foreground ${UI_CLASSES.TRANSITION_COLORS_SMOOTH}`}
                >
                  Partner Program
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`${UI_CLASSES.MT_8} ${UI_CLASSES.PT_6} ${UI_CLASSES.BORDER_T} border-border/30 flex flex-col sm:flex-row ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_BETWEEN} ${UI_CLASSES.GAP_4}`}
        >
          <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED}`}>
            © {currentYear} {APP_CONFIG.author}. All rights reserved.
          </p>
          <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED}`}>
            <Link
              href="/llms.txt"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              AI-optimized content available
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
