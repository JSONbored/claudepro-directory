import { generatePageMetadata, getCompaniesList } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  animateDuration,
  between,
  bgColor,
  borderBottom,
  flexDir,
  flexWrap,
  gap,
  grid,
  iconLeading,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  maxWidth,
  minHeight,
  muted,
  overflow,
  padding,
  radius,
  row,
  shadow,
  size,
  textColor,
  tracking,
  transition,
  weight,
  zLayer,
  squareSize,
} from '@heyclaude/web-runtime/design-system';
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
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';

/**
 * ISR: 30 minutes (1800s) - Matches CACHE_TTL.company_list
 * Company listings should reflect new companies and updates promptly.
 */
export const revalidate = 1800;

/**
 * Validate and sanitize external website URL for safe use in href attributes
 * Only allows HTTPS URLs (or HTTP for localhost in development)
 * Returns canonicalized URL or null if invalid
 */
function getSafeWebsiteUrl(url: null | string | undefined): null | string {
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

/**
 * Provide page metadata for the Companies directory.
 *
 * @returns Metadata for the Companies directory page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return await generatePageMetadata('/companies');
}

/**
 * Renders the Companies directory page: loads a list of companies, logs request-scoped events, and returns the server-rendered UI.
 *
 * Fetches up to 50 companies, renders a hero, a responsive grid of company cards (or an empty-state card), and a newsletter CTA.
 * The page validates external company websites before rendering external links and marks featured companies and basic stats when present.
 *
 * @returns The page's JSX element rendering the companies directory.
 * @throws Normalized error when loading the companies list fails (rethrows the result of `normalizeError`).
 * @see getCompaniesList
 * @see getSafeWebsiteUrl
 * @see generateRequestId
 * @see normalizeError
 * @remarks This page uses ISR with a revalidation interval of 86,400 seconds (24 hours).
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
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Hero */}
      <section className={`relative ${overflow.hidden} ${borderBottom.default}`}>
        <div className={`container mx-auto ${padding.xDefault} py-20`}>
          <div className={`mx-auto ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} flex ${justify.center}`}>
              <div className={`${radius.full} ${bgColor['accent/10']} ${padding.compact}`}>
                <Building className={`${iconSize.xl} ${textColor.primary}`} />
              </div>
            </div>

            <h1 className={`${marginBottom.default} ${weight.bold} ${size['4xl']} ${tracking.tight} sm:${size['5xl']}`}>Companies Directory</h1>

            <p className={`mx-auto ${marginTop.default} ${maxWidth.xl} ${muted.default} ${size.lg}`}>
              Discover companies building the future with Claude and Cursor
            </p>

            <div className={`${marginBottom.relaxed} flex ${justify.center} ${gap.compact}`}>
              <UnifiedBadge variant="base" style="secondary">
                <Building className={iconLeading.xs} />
                {companies.length} Companies
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Verified Profiles
              </UnifiedBadge>
            </div>

            <Button variant="outline" asChild>
              <Link href={ROUTES.ACCOUNT_COMPANIES}>
                <Plus className={`mr-2 ${iconSize.sm}`} />
                Add Your Company
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
        {companies.length === 0 ? (
          <Card>
            <CardContent className={`flex ${flexDir.col} ${alignItems.center} ${padding.ySection}`}>
              <Building className={`${marginBottom.default} ${iconSize['3xl']} ${muted.default}`} />
              <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No companies yet</h3>
              <p className={`${marginBottom.default} ${maxWidth.md} text-center ${muted.default}`}>
                Be the first company to join the directory!
              </p>
              <Button asChild>
                <Link href={ROUTES.ACCOUNT_COMPANIES}>
                  <Plus className={`mr-2 ${iconSize.sm}`} />
                  Add Your Company
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={grid.responsive3}>
            {companies.map((company, index) => (
              <Card key={company.id} className={`card-gradient ${transition.all} ${animateDuration.default} hover:${shadow.lg}`}>
                {company.featured ? <div className={`-top-2 -right-2 absolute ${zLayer.raised}`}>
                    <UnifiedBadge variant="base" className={`bg-accent ${textColor.accentForeground}`}>
                      <Star className={iconLeading.xs} />
                      Featured
                    </UnifiedBadge>
                  </div> : null}

                  <CardHeader>
                  <div className={`${row.default}`}>
                    {(() => {
                      // Validate logo URL is safe (from trusted sources only)
                      if (!company.logo) {
                        return (
                          <div className={`flex ${squareSize.avatarLg} ${alignItems.center} ${justify.center} ${radius.lg} border ${bgColor.accent}`}>
                            <Building className={`${iconSize.lg} ${muted.default}`} />
                          </div>
                        );
                      }
                      try {
                        const parsed = new URL(company.logo);
                        // Only allow HTTPS
                        if (parsed.protocol !== 'https:') {
                          return (
                            <div className={`flex ${squareSize.avatarLg} ${alignItems.center} ${justify.center} ${radius.lg} border ${bgColor.accent}`}>
                              <Building className={`${iconSize.lg} ${muted.default}`} />
                            </div>
                          );
                        }
                        // Allow Supabase storage (public bucket path) or common CDN domains
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
                        if (!isTrustedSource) {
                          return (
                            <div className={`flex ${squareSize.avatarLg} ${alignItems.center} ${justify.center} ${radius.lg} border ${bgColor.accent}`}>
                              <Building className={`${iconSize.lg} ${muted.default}`} />
                            </div>
                          );
                        }
                        return (
                          <Image
                            src={company.logo}
                            alt={`${company.name} logo`}
                            width={48}
                            height={48}
                            className={`${squareSize.avatarLg} ${radius.lg} object-cover`}
                            priority={index < 6}
                          />
                        );
                      } catch {
                        return (
                          <div className={`flex ${squareSize.avatarLg} ${alignItems.center} ${justify.center} ${radius.lg} border ${bgColor.accent}`}>
                            <Building className={`${iconSize.lg} ${muted.default}`} />
                          </div>
                        );
                      }
                    })()}
                    <div className="flex-1">
                      <CardTitle>
                        <Link
                          href={`/companies/${company.slug}`}
                          className="transition-colors-smooth group-hover:text-accent"
                        >
                          {company.name}
                        </Link>
                      </CardTitle>
                      {company.industry ? <CardDescription>{company.industry}</CardDescription> : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {company.description ? <p className={`${marginBottom.default} line-clamp-2 ${muted.sm}`}>
                      {company.description}
                    </p> : null}

                  {/* Job Statistics from RPC/data layer (getCompanyProfile RPC) */}
                  {company.stats && (company.stats.active_jobs ?? 0) > 0 ? <div className={`${marginBottom.default} flex ${flexWrap.wrap} ${gap.compact}`}>
                      <UnifiedBadge variant="base" style="secondary" className={size.xs}>
                        <Briefcase className={iconLeading.xs} />
                        {company.stats.active_jobs ?? 0} Active{' '}
                        {(company.stats.active_jobs ?? 0) === 1 ? 'Job' : 'Jobs'}
                      </UnifiedBadge>

                      {(company.stats.total_views ?? 0) > 0 && (
                        <UnifiedBadge variant="base" style="outline" className={size.xs}>
                          <TrendingUp className={iconLeading.xs} />
                          {(company.stats.total_views ?? 0).toLocaleString()} views
                        </UnifiedBadge>
                      )}

                      {(company.stats.remote_jobs ?? 0) > 0 && (
                        <UnifiedBadge variant="base" style="outline" className={size.xs}>
                          {company.stats.remote_jobs ?? 0} Remote
                        </UnifiedBadge>
                      )}
                    </div> : null}

                  <div className={between.center}>
                    {/* eslint-disable-next-line unicorn/explicit-length-check -- company.size is an enum value, not a Set/Map */}
                    {company.size ? <UnifiedBadge variant="base" style="outline" className={size.xs}>
                        {company.size} employees
                      </UnifiedBadge> : null}

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
                            <ExternalLink className={iconSize.xs} />
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
      <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}