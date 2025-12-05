import { getSafeWebsiteUrl } from '@heyclaude/web-runtime/core';
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
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

/**
 * ISR: 24 hours (86400s) - Companies list updates infrequently
 * Uses ISR instead of force-dynamic for better performance and SEO
 */

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then(
      (module_) => ({
        default: module_.NewsletterCTAVariant,
      })
    ),
  {
    loading: () => <div className="bg-muted/20 h-32 animate-pulse rounded-lg" />,
  }
);

/**
 * ISR: 24 hours (86400s) - Companies list updates infrequently
 * Uses ISR instead of force-dynamic for better performance and SEO
 */
export const revalidate = 86_400;

export async function generateMetadata(): Promise<Metadata> {
  return await generatePageMetadata('/companies');
}

/**
 * Renders the Companies directory page and its list of company cards.
 *
 * Fetches up to 50 companies, logs request-scoped diagnostics, and renders a hero, a responsive grid of company cards (with optional logo, industry, description, stats, featured badge, and validated external website links), and a newsletter CTA.
 *
 * @throws When loading the companies list fails — the underlying error is normalized and rethrown.
 * @returns The page's React element tree for the /companies route.
 *
 * @see getCompaniesList
 * @see getSafeWebsiteUrl from @heyclaude/web-runtime/core
 * @see generatePageMetadata
 * @see revalidate (defined on line 48 in this file)
 */
export default async function CompaniesPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'CompaniesPage',
    route: '/companies',
    module: 'apps/web/src/app/companies',
  });

  // Section: Companies List
  let companiesResponse: Awaited<ReturnType<typeof getCompaniesList>> | null = null;
  try {
    companiesResponse = await getCompaniesList(50, 0);
    reqLogger.info('CompaniesPage: companies list loaded', {
      section: 'companies-list',
      companiesCount: companiesResponse.companies?.length ?? 0,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load companies list');
    reqLogger.error('CompaniesPage: getCompaniesList failed', normalized, {
      section: 'companies-list',
    });
    throw normalized;
  }

  if (!companiesResponse.companies) {
    reqLogger.warn('CompaniesPage: companies response is empty', {
      section: 'companies-list',
    });
  }

  const companies = companiesResponse.companies ?? [];

  // Final summary log
  reqLogger.info('CompaniesPage: page render completed', {
    section: 'page-render',
    companiesCount: companies.length,
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className={`${UI_CLASSES.CONTAINER_OVERFLOW_BORDER}`}>
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-accent/10 rounded-full p-3">
                <Building className="text-primary h-8 w-8" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Companies Directory</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover companies building the future with Claude and Cursor
            </p>

            <div className="mb-8 flex justify-center gap-2">
              <UnifiedBadge variant="base" style="secondary">
                <Building className="mr-1 h-3 w-3" />
                {companies.length} Companies
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Verified Profiles
              </UnifiedBadge>
            </div>

            <Button variant="outline" asChild>
              <Link href={ROUTES.ACCOUNT_COMPANIES}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your Company
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="container mx-auto px-4 py-12">
        {companies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Building className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-xl font-semibold">No companies yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md text-center">
                Be the first company to join the directory!
              </p>
              <Button asChild>
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
                {company.featured ? (
                  <div className="absolute -top-2 -right-2 z-10">
                    <UnifiedBadge variant="base" className="bg-accent text-accent-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </UnifiedBadge>
                  </div>
                ) : null}

                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={`${company.name} logo`}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                        priority={index < 6}
                      />
                    ) : null}
                    <div className="flex-1">
                      <CardTitle>
                        <Link
                          href={`/companies/${company.slug}`}
                          className="transition-colors-smooth group-hover:text-accent"
                        >
                          {company.name}
                        </Link>
                      </CardTitle>
                      {company.industry ? (
                        <CardDescription>{company.industry}</CardDescription>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {company.description ? (
                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                      {company.description}
                    </p>
                  ) : null}

                  {/* Job Statistics from RPC/data layer (getCompanyProfile RPC) */}
                  {company.stats && (company.stats.active_jobs ?? 0) > 0 ? (
                    <div className="mb-4 flex flex-wrap gap-2">
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
                  ) : null}

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    {/* eslint-disable-next-line unicorn/explicit-length-check -- company.size is an enum value, not a Set/Map */}
                    {company.size ? (
                      <UnifiedBadge variant="base" style="outline" className="text-xs">
                        {company.size} employees
                      </UnifiedBadge>
                    ) : null}

                    {(() => {
                      const safeWebsiteUrl = getSafeWebsiteUrl(company.website);
                      if (!safeWebsiteUrl) return null;
                      // Explicit validation: getSafeWebsiteUrl guarantees the URL is safe
                      // It validates protocol (HTTPS only, or HTTP for localhost), removes credentials,
                      // normalizes hostname, and returns null for any invalid URLs
                      // At this point, safeWebsiteUrl is validated and safe for use in external links
                      const validatedUrl: string = safeWebsiteUrl;
                      return (
                        <Button variant="ghost" size="sm" asChild>
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
      <section className="container mx-auto px-4 py-12">
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}
