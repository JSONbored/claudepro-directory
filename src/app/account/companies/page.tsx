/**
 * Company Management Page - Database-First via Edge Function
 * Manages user's companies with CRUD operations via companies-handler
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserCompanies } from '@/src/lib/data/account/user-data';
import { ROUTES } from '@/src/lib/data/config/constants';
import { Briefcase, Building2, Calendar, Edit, ExternalLink, Eye, Plus } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetGetUserCompaniesReturn } from '@/src/types/database-overrides';

/**
 * Validate company website URL is safe for use in href
 * Only allows absolute URLs with http:// or https:// protocol
 * Strictly validates to prevent XSS and protocol-relative URLs
 */
function isAllowedHttpUrl(url: string | null | undefined): boolean {
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

/**
 * Validate that URL belongs to a trusted public domain (TLD-based check)
 * Only allows URLs with common, trusted top-level domains to prevent redirect attacks
 * This provides an additional layer of security beyond protocol validation
 */
function isTrustedPublicDomain(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return false;
  }
  // List of allowed public TLDs for company websites
  // These are common, trusted TLDs used by legitimate businesses
  const allowedTlds = [
    '.com',
    '.org',
    '.net',
    '.io',
    '.ai',
    '.dev',
    '.co',
    '.xyz',
    '.info',
    '.edu',
    '.gov',
    '.us',
    '.uk',
    '.ca',
    '.au',
    '.de',
    '.fr',
    '.jp',
    '.cn',
  ];
  const hostname = parsed.hostname.toLowerCase();
  // Only allow hostnames ending with one of the trusted TLDs
  return allowedTlds.some((tld) => hostname.endsWith(tld));
}

export const metadata: Promise<Metadata> = generatePageMetadata('/account/companies');

export default async function CompaniesPage() {
  const { user } = await getAuthenticatedUser({ context: 'CompaniesPage' });

  if (!user) {
    logger.warn('CompaniesPage: unauthenticated access attempt detected');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let companies: GetGetUserCompaniesReturn['companies'] = [];
  let hasError = false;

  // User-scoped edge-cached RPC via centralized data layer
  try {
    const data = await getUserCompanies(user.id);

    if (data) {
      companies = data.companies ?? [];
    } else {
      logger.warn('CompaniesPage: getUserCompanies returned null', { userId: user.id });
      hasError = true;
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch user companies');
    logger.error('CompaniesPage: getUserCompanies threw', normalized, { userId: user.id });
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
            <Button asChild={true} variant="outline">
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (companies.length === 0) {
    logger.info('CompaniesPage: user has no companies', { userId: user.id });
  }

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 font-bold text-3xl">My Companies</h1>
          <p className="text-muted-foreground">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
        <Button asChild={true}>
          <Link href={`${ROUTES.ACCOUNT_COMPANIES}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className={'flex flex-col items-center py-12'}>
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-xl">No companies yet</h3>
            <p className={'mb-4 max-w-md text-center text-muted-foreground'}>
              Create a company profile to showcase your organization and post job listings
            </p>
            <Button asChild={true}>
              <Link href={`${ROUTES.ACCOUNT_COMPANIES}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Company
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company, index) => {
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
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-accent">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                          <CardTitle>{company.name}</CardTitle>
                          {company.featured && (
                            <UnifiedBadge variant="base" style="default">
                              Featured
                            </UnifiedBadge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {company.description || 'No description provided'}
                        </CardDescription>
                        {(() => {
                          const website = company.website;
                          // Defense in depth: validate both protocol and trusted domain
                          if (
                            !(
                              website &&
                              isAllowedHttpUrl(website) &&
                              isTrustedPublicDomain(website)
                            )
                          ) {
                            return null;
                          }
                          // Canonicalize and sanitize URL to prevent XSS and redirect attacks
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
                              parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
                          } catch {
                            // If parsing fails, don't render the link
                            return null;
                          }
                          // Explicit validation: safeHref is guaranteed to be safe
                          // It's constructed from a validated URL (isAllowedHttpUrl + isTrustedPublicDomain)
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
                  <div className={'mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm'}>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Briefcase className="h-4 w-4" />
                      {company.stats?.active_jobs || 0} active job
                      {(company.stats?.active_jobs || 0) !== 1 ? 's' : ''}
                    </div>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Eye className="h-4 w-4" />
                      {(company.stats?.total_views || 0).toLocaleString()} views
                    </div>
                    {company.stats?.latest_job_posted_at && (
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                        <Calendar className="h-4 w-4" />
                        Last job posted {formatRelativeDate(company.stats.latest_job_posted_at)}
                      </div>
                    )}
                  </div>

                  <div className={UI_CLASSES.FLEX_GAP_2}>
                    <Button variant="outline" size="sm" asChild={true}>
                      <Link href={`${ROUTES.ACCOUNT_COMPANIES}/${company.id}/edit`}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild={true}>
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
