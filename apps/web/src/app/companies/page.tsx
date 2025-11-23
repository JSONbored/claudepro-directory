import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';

const NewsletterCTAVariant = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getCompaniesList } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  Briefcase,
  Building,
  ExternalLink,
  Plus,
  Star,
  TrendingUp,
} from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

/**
 * Validate and sanitize external website URL for safe use in href attributes
 * Only allows HTTPS URLs (or HTTP for localhost in development)
 * Returns canonicalized URL or null if invalid
 */
function getSafeWebsiteUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Only allow HTTPS protocol (or HTTP for localhost/development)
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1';
    if (parsed.protocol === 'https:') {
      // HTTPS always allowed
    } else if (parsed.protocol === 'http:' && isLocalhost) {
      // HTTP allowed only for local development
    } else {
      return null;
    }
    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Sanitize: remove credentials
    parsed.username = '';
    parsed.password = '';
    // Normalize hostname
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    // Remove default ports
    if (parsed.port === '80' || parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href (guaranteed to be normalized and safe)
    return parsed.href;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return await generatePageMetadata('/companies');
}

// Edge-cached via data layer (30min TTL from Statsig)
export const revalidate = false;

export default async function CompaniesPage() {
  // Single RPC call via edge-cached data layer
  let companiesResponse: Awaited<ReturnType<typeof getCompaniesList>> | null = null;
  try {
    companiesResponse = await getCompaniesList(50, 0);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load companies list');
    logger.error('CompaniesPage: getCompaniesList failed', normalized, {
      limit: 50,
      offset: 0,
    });
    throw normalized;
  }

  if (!companiesResponse?.companies) {
    logger.warn('CompaniesPage: companies response is empty', { limit: 50, offset: 0 });
  }

  const companies = companiesResponse?.companies ?? [];

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero */}
      <section className={`${UI_CLASSES.CONTAINER_OVERFLOW_BORDER}`}>
        <div className={'container mx-auto px-4 py-20'}>
          <div className={'mx-auto max-w-3xl text-center'}>
            <div className={'mb-6 flex justify-center'}>
              <div className={'rounded-full bg-accent/10 p-3'}>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Companies Directory</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover companies building the future with Claude and Cursor
            </p>

            <div className={'mb-8 flex justify-center gap-2'}>
              <UnifiedBadge variant="base" style="secondary">
                <Building className="mr-1 h-3 w-3" />
                {companies?.length || 0} Companies
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Verified Profiles
              </UnifiedBadge>
            </div>

            <Button variant="outline" asChild={true}>
              <Link href={ROUTES.ACCOUNT_COMPANIES}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your Company
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className={'container mx-auto px-4 py-12'}>
        {!companies || companies.length === 0 ? (
          <Card>
            <CardContent className={'flex flex-col items-center py-12'}>
              <Building className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-xl">No companies yet</h3>
              <p className={'mb-4 max-w-md text-center text-muted-foreground'}>
                Be the first company to join the directory!
              </p>
              <Button asChild={true}>
                <Link href={ROUTES.ACCOUNT_COMPANIES}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your Company
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
            {companies.map((company, index) => (
              <Card key={company.id} className={UI_CLASSES.CARD_GRADIENT_HOVER}>
                {company.featured && (
                  <div className="-top-2 -right-2 absolute z-10">
                    <UnifiedBadge variant="base" className="bg-accent text-accent-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </UnifiedBadge>
                  </div>
                )}

                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    {company.logo && (
                      <Image
                        src={company.logo}
                        alt={`${company.name} logo`}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                        priority={index < 6}
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle>
                        <Link
                          href={`/companies/${company.slug}`}
                          className="transition-colors-smooth group-hover:text-accent"
                        >
                          {company.name}
                        </Link>
                      </CardTitle>
                      {company.industry && <CardDescription>{company.industry}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {company.description && (
                    <p className={'mb-4 line-clamp-2 text-muted-foreground text-sm'}>
                      {company.description}
                    </p>
                  )}

                  {/* Job Statistics from RPC/data layer (getCompanyProfile RPC) */}
                  {company.stats && (company.stats.active_jobs ?? 0) > 0 && (
                    <div className={'mb-4 flex flex-wrap gap-2'}>
                      <UnifiedBadge variant="base" style="secondary" className="text-xs">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {company.stats.active_jobs ?? 0} Active{' '}
                        {(company.stats.active_jobs ?? 0) === 1 ? 'Job' : 'Jobs'}
                      </UnifiedBadge>

                      {(company.stats.total_views ?? 0) > 0 && (
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {(company.stats.total_views ?? 0).toLocaleString()} views
                        </UnifiedBadge>
                      )}

                      {(company.stats.remote_jobs ?? 0) > 0 && (
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          {company.stats.remote_jobs ?? 0} Remote
                        </UnifiedBadge>
                      )}
                    </div>
                  )}

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    {company.size && (
                      <UnifiedBadge variant="base" style="outline" className="text-xs">
                        {company.size} employees
                      </UnifiedBadge>
                    )}

                    {(() => {
                      const safeWebsiteUrl = getSafeWebsiteUrl(company.website);
                      if (!safeWebsiteUrl) return null;
                      // Explicit validation: getSafeWebsiteUrl guarantees the URL is safe
                      // It validates protocol (HTTPS only, or HTTP for localhost), removes credentials,
                      // normalizes hostname, and returns null for any invalid URLs
                      // At this point, safeWebsiteUrl is validated and safe for use in external links
                      const validatedUrl: string = safeWebsiteUrl;
                      return (
                        <Button variant="ghost" size="sm" asChild={true}>
                          <a href={validatedUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}
