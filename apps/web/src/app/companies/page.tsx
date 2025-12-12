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
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UI_CLASSES,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import Loading from './loading';

/**
 * Companies list page - uses request-time rendering via connection()
 * Caching is handled by the data layer (getCompaniesList)
 */

/**
 * Produce metadata for the /companies page.
 *
 * This defers non-deterministic work to request time to satisfy Cache Component requirements
 * before delegating to the shared page metadata generator.
 *
 * @returns The metadata object for the `/companies` route.
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return await generatePageMetadata('/companies');
}

/**
 * Render the Companies directory page and initialize request-scoped logging for the request.
 *
 * This server component awaits `connection()` to ensure non-deterministic operations occur at request time,
 * creates a request-scoped child logger, and renders the page content inside
 * a React `Suspense` boundary which mounts `CompaniesPageContent`.
 *
 * @returns The React element tree for the /companies route.
 *
 * @see CompaniesPageContent
 * @see connection from next/server
 * @see logger
 */
export default async function CompaniesPage() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/companies',
    operation: 'CompaniesPage',
    route: '/companies',
  });

  return (
    <Suspense fallback={<Loading />}>
      <CompaniesPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Render the companies directory content by fetching and displaying a list of companies.
 *
 * Fetches up to 50 companies, logs load and render events with the provided request-scoped logger,
 * and throws a normalized error if the companies list cannot be loaded.
 *
 * @param reqLogger - A request-scoped logger (result of `logger.child`) used to record load, warning, error, and render events.
 * @param reqLogger.reqLogger
 * @returns A React element containing the hero section and a responsive grid of company cards (or an empty-state card when no companies exist).
 *
 * @see getCompaniesList
 * @see normalizeError
 * @see getSafeWebsiteUrl
 * @see logger.child
 * @see ROUTES.ACCOUNT_COMPANIES
 */
async function CompaniesPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  // Section: Companies List
  let companiesResponse: Awaited<ReturnType<typeof getCompaniesList>> | null = null;
  try {
    companiesResponse = await getCompaniesList(50, 0);
    reqLogger.info(
      {
        companiesCount: companiesResponse.companies?.length ?? 0,
        section: 'data-fetch',
      },
      'CompaniesPage: companies list loaded'
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load companies list');
    reqLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'CompaniesPage: getCompaniesList failed'
    );
    throw normalized;
  }

  if (!companiesResponse.companies) {
    reqLogger.warn({ section: 'data-fetch' }, 'CompaniesPage: companies response is empty');
  }

  const companies = companiesResponse.companies ?? [];

  // Final summary log
  reqLogger.info(
    {
      companiesCount: companies.length,
      section: 'data-fetch',
    },
    'CompaniesPage: page render completed'
  );

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
              <UnifiedBadge style="secondary" variant="base">
                <Building className="mr-1 h-3 w-3" />
                {companies.length} Companies
              </UnifiedBadge>
              <UnifiedBadge style="outline" variant="base">
                Verified Profiles
              </UnifiedBadge>
            </div>

            <Button asChild variant="outline">
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
              <Card className={UI_CLASSES.CARD_GRADIENT_HOVER} key={company.id}>
                {company.featured ? (
                  <div className="absolute -top-2 -right-2 z-10">
                    <UnifiedBadge className="bg-accent text-accent-foreground" variant="base">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </UnifiedBadge>
                  </div>
                ) : null}

                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    {company.logo ? (
                      <Image
                        alt={`${company.name} logo`}
                        className="h-12 w-12 rounded-lg object-cover"
                        height={48}
                        priority={index < 6}
                        src={company.logo}
                        width={48}
                      />
                    ) : null}
                    <div className="flex-1">
                      <CardTitle>
                        <Link
                          className="transition-colors-smooth group-hover:text-accent"
                          href={`/companies/${company.slug}`}
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
                      <UnifiedBadge className="text-xs" style="secondary" variant="base">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {company.stats.active_jobs ?? 0} Active{' '}
                        {(company.stats.active_jobs ?? 0) === 1 ? 'Job' : 'Jobs'}
                      </UnifiedBadge>

                      {(company.stats.total_views ?? 0) > 0 && (
                        <UnifiedBadge className="text-xs" style="outline" variant="base">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {(company.stats.total_views ?? 0).toLocaleString()} views
                        </UnifiedBadge>
                      )}

                      {(company.stats.remote_jobs ?? 0) > 0 && (
                        <UnifiedBadge className="text-xs" style="outline" variant="base">
                          {company.stats.remote_jobs ?? 0} Remote
                        </UnifiedBadge>
                      )}
                    </div>
                  ) : null}

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    {/* eslint-disable-next-line unicorn/explicit-length-check -- company.size is an enum value, not a Set/Map */}
                    {company.size ? (
                      <UnifiedBadge className="text-xs" style="outline" variant="base">
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
                        <Button asChild size="sm" variant="ghost">
                          <a href={validatedUrl} rel="noopener noreferrer" target="_blank">
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
    </div>
  );
}
