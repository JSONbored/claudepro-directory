import { generatePageMetadata, getCompaniesList } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  alignItems,
  animateDuration,
  between,
  bgColor,
  borderBottom,
  container,
  display,
  flexDir,
  flexGrow,
  flexWrap,
  gap,
  grid,
  iconLeading,
  iconSize,
  justify,
  marginBottom,
  marginRight,
  marginTop,
  marginX,
  maxWidth,
  minHeight,
  muted,
  overflow,
  padding,
  position,
  radius,
  row,
  size,
  squareSize,
  textAlign,
  textColor,
  tracking,
  transition,
  truncate,
  weight,
  zLayer,
  objectFit,
  border,
  groupHover,
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
 * Validate and canonicalize an external website URL for safe use in link hrefs.
 *
 * Allows only `https:` URLs except `http:` when the host is `localhost`, `127.0.0.1`, or `::1`.
 * Rejects URLs containing username or password, strips credentials, normalizes the hostname (removes a trailing dot and lowercases), and removes default ports 80 and 443.
 *
 * @param url - The raw URL string to validate and sanitize
 * @returns The canonicalized href string if the URL is allowed and valid, or `null` if it is invalid or disallowed
 *
 * @see CompaniesPage - caller that uses this helper to render external company website links
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
 * Render the Companies directory page and its server-side data.
 *
 * Loads up to 50 companies, sets up request-scoped logging for the request, and returns the server-rendered UI containing a hero, a responsive grid of company cards or an empty state, and a newsletter CTA. External company websites and logos are validated before rendering external links or images; featured companies and basic job/size statistics are surfaced when present.
 *
 * @returns The page's JSX element for the Companies directory.
 * @throws A normalized error when loading the companies list fails.
 * @see getCompaniesList
 * @see getSafeWebsiteUrl
 * @see generateRequestId
 * @see normalizeError
 * @remarks This page uses ISR with a revalidation interval of 1800 seconds (30 minutes).
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

  /**
   * Render a company logo element from a provided URL, falling back to a styled placeholder when the URL is missing, invalid, or not from a trusted host.
   *
   * @param logo - The logo URL to render; may be null or undefined to indicate no logo.
   * @param name - The company name used for the image alt text fallback.
   * @param priority - If true, mark the Image as high-priority for loading.
   * @returns A JSX element containing the company logo image when valid and trusted, otherwise a placeholder icon block.
   *
   * @see getSafeWebsiteUrl
   * @see normalizeError
   * @see Image
   */
  function renderCompanyLogo(logo: null | string | undefined, name: null | string, priority: boolean) {
    const placeholderIcon = (
      <div className={`${display.flex} ${squareSize.avatarLg} ${alignItems.center} ${justify.center} ${radius.lg} ${border.default} ${bgColor.accent}`}>
        <Building className={`${iconSize.lg} ${muted.default}`} />
      </div>
    );

    if (!logo) return placeholderIcon;

    try {
      const parsed = new URL(logo);
      // Only allow HTTPS
      if (parsed.protocol !== 'https:') {
        return placeholderIcon;
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
        return placeholderIcon;
      }
          return (
            <Image
              src={logo}
              alt={`${name ?? 'Company'} logo`}
              width={48}
              height={48}
              className={`${squareSize.avatarLg} ${radius.lg} ${objectFit.cover}`}
              priority={priority}
            />
          );
    } catch (error: unknown) {
      const normalized = normalizeError(error, 'Failed to render company logo');
      reqLogger.warn('CompaniesPage: failed to render company logo', {
        section: 'render-company-logo',
        logo,
        companyName: name,
        err: normalized,
      });
      return placeholderIcon;
    }
  }

  return (
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Hero */}
      <section className={`${position.relative} ${overflow.hidden} ${borderBottom.default}`}>
        <div className={`${container.default} ${padding.xDefault} ${padding.yLarge}`}>
          <div className={`${marginX.auto} ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} ${display.flex} ${justify.center}`}>
              <div className={`${radius.full} ${bgColor['accent/10']} ${padding.compact}`}>
                <Building className={`${iconSize.xl} ${textColor.primary}`} />
              </div>
            </div>

            <h1 className={`${marginBottom.default} ${weight.bold} ${size['4xl']} ${tracking.tight} sm:text-5xl`}>Companies Directory</h1>

            <p className={`${marginX.auto} ${marginTop.default} ${maxWidth.xl} ${muted.default} ${size.lg}`}>
              Discover companies building the future with Claude and Cursor
            </p>

            <div className={`${marginBottom.relaxed} ${display.flex} ${justify.center} ${gap.compact}`}>
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
                <Plus className={`${marginRight.compact} ${iconSize.sm}`} />
                Add Your Company
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className={`${container.default} ${padding.xDefault} ${padding.ySection}`}>
        {companies.length === 0 ? (
          <Card>
            <CardContent className={`${display.flex} ${flexDir.col} ${alignItems.center} ${padding.ySection}`}>
              <Building className={`${marginBottom.default} ${iconSize['3xl']} ${muted.default}`} />
              <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No companies yet</h3>
              <p className={`${marginBottom.default} ${maxWidth.md} ${textAlign.center} ${muted.default}`}>
                Be the first company to join the directory!
              </p>
              <Button asChild>
                <Link href={ROUTES.ACCOUNT_COMPANIES}>
                  <Plus className={`${marginRight.compact} ${iconSize.sm}`} />
                  Add Your Company
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={grid.responsive3}>
            {companies.map((company, index) => (
              <Card key={company.id} className={`card-gradient ${transition.all} ${animateDuration.default} hover:shadow-lg`}>
                {company.featured ? <div className={`-top-2 -right-2 ${position.absolute} ${zLayer.raised}`}>
                    <UnifiedBadge variant="base" className={`${bgColor.accent} ${textColor.accentForeground}`}>
                      <Star className={iconLeading.xs} />
                      Featured
                    </UnifiedBadge>
                  </div> : null}

                  <CardHeader>
                  <div className={`${row.default}`}>
                    {renderCompanyLogo(company.logo ?? null, company.name, index < 6)}
                    <div className={flexGrow['1']}>
                      <CardTitle>
                        <Link
                          href={`/companies/${company.slug}`}
                          className={`${transition.colors} ${groupHover.accent}`}
                        >
                          {company.name}
                        </Link>
                      </CardTitle>
                      {company.industry ? <CardDescription>{company.industry}</CardDescription> : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {company.description ? <p className={`${marginBottom.default} ${truncate.lines2} ${muted.sm}`}>
                      {company.description}
                    </p> : null}

                  {/* Job Statistics from RPC/data layer (getCompanyProfile RPC) */}
                  {company.stats && (company.stats.active_jobs ?? 0) > 0 ? <div className={`${marginBottom.default} ${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
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
      <section className={`${container.default} ${padding.xDefault} ${padding.ySection}`}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}