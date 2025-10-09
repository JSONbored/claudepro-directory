/**
 * Site Footer Component
 * Provides navigation links and llms.txt discovery
 *
 * @module components/layout/footer
 */

import { ExternalLink, Github, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { DiscordIcon } from '@/src/lib/custom-icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Fetches GitHub repository stars count
 * Uses GitHub API with revalidation every 1 hour
 */
async function getGitHubStars(): Promise<number | null> {
  try {
    // Extract owner/repo from SOCIAL_LINKS.github
    const githubUrl = SOCIAL_LINKS.github;
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

    if (!match) {
      return null;
    }

    const [, owner, repo] = match;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      next: {
        revalidate: 3600, // Revalidate every 1 hour
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.stargazers_count || null;
  } catch {
    return null;
  }
}

/**
 * Footer Component
 *
 * @returns Footer with navigation links, social links, and llms.txt discovery
 *
 * @remarks
 * Includes llms.txt link for AI assistant discoverability per LLMs.txt specification
 */
export async function Footer() {
  const currentYear = new Date().getFullYear();
  const stars = await getGitHubStars();

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

            {/* Social Links */}
            <div className={`flex flex-col ${UI_CLASSES.GAP_3} ${UI_CLASSES.MB_4}`}>
              <div className={`flex ${UI_CLASSES.GAP_3}`}>
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

              {/* GitHub Stars Badge */}
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-border/50 bg-card hover:bg-accent/10 hover:border-accent/30 transition-colors w-fit"
                aria-label={stars ? `Star us on GitHub - ${stars} stars` : 'Star us on GitHub'}
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                {stars !== null ? (
                  <>
                    <span className="font-semibold">{stars.toLocaleString()}</span>
                    <span className="text-muted-foreground">stars</span>
                  </>
                ) : (
                  <span>Star us on GitHub</span>
                )}
                <Github className="h-3.5 w-3.5" />
              </a>

              {/* Open Source Badge */}
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-accent/20 ${UI_CLASSES.BG_ACCENT_5} text-accent hover:bg-accent/10 hover:border-accent/30 transition-colors w-fit`}
                aria-label="View source code on GitHub"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open Source</span>
              </a>
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
