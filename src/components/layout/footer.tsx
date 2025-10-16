/**
 * Site Footer Component
 * Provides navigation links and llms.txt discovery
 *
 * @module components/layout/footer
 */

import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { DiscordIcon, ExternalLink, Github, Sparkles } from '@/src/lib/icons';
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
    <footer className={'border-t border-border/50 bg-background/95 backdrop-blur'}>
      <div className="container mx-auto px-4 py-8">
        <div className={`${UI_CLASSES.GRID_RESPONSIVE_3} gap-8`}>
          {/* About Section */}
          <div>
            <h3 className={'font-semibold mb-4'}>{APP_CONFIG.name}</h3>
            <p className={'text-sm text-muted-foreground mb-4'}>{APP_CONFIG.description}</p>
            <div className={'flex items-center gap-4'}>
              <Link
                href={SOCIAL_LINKS.github || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href={SOCIAL_LINKS.discord || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                aria-label="Discord"
              >
                <DiscordIcon className="h-5 w-5" />
              </Link>
              <Badge variant="outline" className="border-accent/20 bg-accent/5 text-accent ml-2">
                <ExternalLink className="h-3 w-3 mr-1 text-accent" />
                Open Source
              </Badge>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className={'font-semibold mb-4'}>Quick Links</h3>
            <ul className={'space-y-2 text-sm'}>
              <li>
                <Link
                  href={ROUTES.GUIDES}
                  className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                >
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.COLLECTIONS}
                  className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CHANGELOG}
                  className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.COMMUNITY}
                  className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                >
                  Community
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.SUBMIT}
                  className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                >
                  Submit
                </Link>
              </li>
            </ul>
          </div>

          {/* AI & Resources Section */}
          <div>
            <h3 className={'font-semibold mb-4'}>AI & Resources</h3>
            <ul className={'space-y-2 text-sm'}>
              <li>
                <Link
                  href={ROUTES.LLMS_TXT}
                  className={
                    'text-muted-foreground hover:text-foreground transition-colors-smooth inline-flex items-center gap-2'
                  }
                  aria-label="LLMs.txt - AI-optimized content"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>LLMs.txt</span>
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.API_DOCS}
                  className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                >
                  API Docs
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.PARTNER}
                  className={'text-muted-foreground hover:text-foreground transition-colors-smooth'}
                >
                  Partner Program
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={
            'mt-8 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4'
          }
        >
          <p className={'text-sm text-muted-foreground'}>
            © {currentYear} {APP_CONFIG.author}. All rights reserved.
          </p>
          <p className={'text-xs text-muted-foreground'}>
            <Link
              href={ROUTES.LLMS_TXT}
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
