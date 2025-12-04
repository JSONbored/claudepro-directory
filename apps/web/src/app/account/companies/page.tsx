/**
 * Company Management Page - Database-First via Edge Function
 * Manages user's companies with CRUD operations via companies-handler
 */

import { type Database } from '@heyclaude/database-types';
import { formatRelativeDate } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserCompanies,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  Briefcase,
  Building2,
  Calendar,
  Edit,
  ExternalLink,
  Eye,
  Plus,
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
import Image from 'next/image';
import Link from 'next/link';

/**
 * Dynamic Rendering Required
 * Authenticated user companies
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Validate company website URL is safe for use in href
 * Only allows absolute URLs with http:// or https:// protocol
 * Strictly validates to prevent XSS and protocol-relative URLs
 */
function isAllowedHttpUrl(url: null | string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  // Reject any leading whitespace or suspicious chars
  if (!/^(https?:\/\/)/i.test(url.trim())) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/companies');
}

export default async function CompaniesPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'CompaniesPage';
  const route = '/account/companies';
  const module = 'apps/web/src/app/account/companies/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'CompaniesPage' });

  if (!user) {
    reqLogger.warn('CompaniesPage: unauthenticated access attempt detected', {
      section: 'authentication',
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('CompaniesPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Companies Data Fetch
  let companies: Database['public']['Functions']['get_user_companies']['Returns']['companies'] = [];
  let hasError = false;

  // User-scoped edge-cached RPC via centralized data layer
  try {
    const data = await getUserCompanies(user.id);

    if (data) {
      companies = data.companies ?? [];
      userLogger.info('CompaniesPage: companies data loaded', {
        section: 'companies-data-fetch',
        companiesCount: companies.length,
      });
    } else {
      userLogger.warn('CompaniesPage: getUserCompanies returned null', {
        section: 'companies-data-fetch',
      });
      hasError = true;
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch user companies');
    userLogger.error('CompaniesPage: getUserCompanies threw', normalized, {
      section: 'companies-data-fetch',
    });
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Companies unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your companies. Please refresh the page or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (companies.length === 0) {
    userLogger.info('CompaniesPage: user has no companies', {
      section: 'companies-data-fetch',
    });
  }

  // Final summary log
  userLogger.info('CompaniesPage: page render completed', {
    section: 'page-render',
    companiesCount: companies.length,
  });

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 text-3xl font-bold">My Companies</h1>
          <p className="text-muted-foreground">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
        <Button asChild>
          <Link href={`${ROUTES.ACCOUNT_COMPANIES}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Building2 className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">No companies yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md text-center">
              Create a company profile to showcase your organization and post job listings
            </p>
            <Button asChild>
              <Link href={`${ROUTES.ACCOUNT_COMPANIES}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Company
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies
            .filter(
              (
                company
              ): company is NonNullable<typeof company> & {
                id: string;
                name: string;
                slug: string;
              } => company.id !== null && company.name !== null && company.slug !== null
            )
            .map((company, index) => {
              return (
                <Card key={company.id}>
                  <CardHeader>
                    <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                      <div className="flex flex-1 items-start gap-4">
                        {(() => {
                          // Validate logo URL is safe (should be from Supabase storage or trusted domain)
                          if (!company.logo) return null;
                          try {
                            const parsed = new URL(company.logo);
                            // Only allow HTTPS
                            if (parsed.protocol !== 'https:') return null;
                            // Allow Supabase storage (public bucket path) or common CDN domains
                            // Restrict to specific CDN patterns to prevent subdomain abuse
                            const isSupabaseHost =
                              parsed.hostname.endsWith('.supabase.co') ||
                              parsed.hostname.endsWith('.supabase.in');
                            const isCloudinary =
                              parsed.hostname === 'res.cloudinary.com' ||
                              /^[a-z0-9-]+\.cloudinary\.com$/.test(parsed.hostname);
                            const isAwsS3 =
                              /^[a-z0-9-]+\.s3\.amazonaws\.com$/.test(parsed.hostname) ||
                              /^s3\.[a-z0-9-]+\.amazonaws\.com$/.test(parsed.hostname);
                            const isTrustedSource =
                              (isSupabaseHost &&
                                parsed.pathname.startsWith('/storage/v1/object/public/')) ||
                              isCloudinary ||
                              isAwsS3;
                            if (!isTrustedSource) return null;
                            return (
                              <Image
                                src={company.logo}
                                alt={`${company.name} logo`}
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-lg border object-cover"
                                priority={index === 0}
                              />
                            );
                          } catch {
                            return null;
                          }
                        })()}
                        {!company.logo && (
                          <div className="bg-accent flex h-16 w-16 items-center justify-center rounded-lg border">
                            <Building2 className="text-muted-foreground h-8 w-8" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                            <CardTitle>{company.name}</CardTitle>
                            {company.featured ? (
                              <UnifiedBadge variant="base" style="default">
                                Featured
                              </UnifiedBadge>
                            ) : null}
                          </div>
                          <CardDescription className="mt-1">
                            {company.description ?? 'No description provided'}
                          </CardDescription>
                          {(() => {
                            const website = company.website;
                            // Validate protocol (http/https) and sanitize URL to prevent XSS and redirect attacks
                            if (!(website && isAllowedHttpUrl(website))) {
                              return null;
                            }
                            // Canonicalize and sanitize URL
                            // Parse URL to get normalized, canonicalized version for safe use in href
                            let safeHref = '';
                            let displayText = '';
                            try {
                              const parsed = new URL(website.trim());
                              // Remove all potentially dangerous components
                              parsed.username = '';
                              parsed.password = '';
                              parsed.search = '';
                              parsed.hash = '';
                              // Normalize hostname (remove trailing dots, lowercase)
                              parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
                              // Remove port if it's the default (80 for http, 443 for https)
                              if (parsed.port === '80' || parsed.port === '443') {
                                parsed.port = '';
                              }
                              // Use parsed.href for guaranteed normalized absolute URL
                              // This is safer than toString() as it's guaranteed to be canonicalized
                              safeHref = parsed.href;
                              // Safe display text: hostname + pathname (no query/fragment)
                              // Pathname is already URL-encoded by the URL constructor, so it's safe
                              displayText =
                                parsed.hostname + (parsed.pathname === '/' ? '' : parsed.pathname);
                            } catch {
                              // If parsing fails, don't render the link
                              return null;
                            }
                            // Explicit validation: safeHref is guaranteed to be safe
                            // It's constructed from a validated URL (isAllowedHttpUrl)
                            // with all dangerous components removed (credentials, query, hash)
                            // and hostname normalized. At this point, safeHref is validated and safe for use
                            const validatedUrl: string = safeHref;
                            return (
                              <a
                                href={validatedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`mt-2 inline-flex items-center gap-1 text-sm ${UI_CLASSES.LINK_ACCENT}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                                {displayText}
                              </a>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                        <Briefcase className="h-4 w-4" />
                        {company.stats?.active_jobs ?? 0} active job
                        {(company.stats?.active_jobs ?? 0) === 1 ? '' : 's'}
                      </div>
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                        <Eye className="h-4 w-4" />
                        {(company.stats?.total_views ?? 0).toLocaleString()} views
                      </div>
                      {company.stats?.latest_job_posted_at ? (
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                          <Calendar className="h-4 w-4" />
                          Last job posted {formatRelativeDate(company.stats.latest_job_posted_at)}
                        </div>
                      ) : null}
                    </div>

                    <div className={UI_CLASSES.FLEX_GAP_2}>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`${ROUTES.ACCOUNT_COMPANIES}/${company.id}/edit`}>
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Link>
                      </Button>

                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/companies/${company.slug}`}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
