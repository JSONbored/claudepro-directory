import { getPartnerContactChannels, getPartnerCtas } from '@heyclaude/web-runtime/core';
import { getPartnerHeroStats, getPartnerPricing } from '@heyclaude/web-runtime/data';
import {
  BarChart,
  Briefcase,
  Check,
  Clock,
  Eye,
  Mail,
  Megaphone,
  MousePointer,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  RESPONSIVE_PATTERNS,
  UI_CLASSES,
  UnifiedBadge,
  HoverCard,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { connection } from 'next/server';
import { Suspense } from 'react';

/**
 * Render the Partner marketing page showing pricing, benefits, real-time stats, and CTAs.
 *
 * Fetches partner pricing, hero statistics, contact channels, and CTA links on the server.
 * If pricing or hero-stat fetches fail, built-in default values are used to ensure the page renders.
 * A request-scoped logger is created for telemetry and error reporting. The component leverages
 * Cache Components for efficient, streaming-friendly data loading with Suspense boundaries.
 *
 * @returns The React element for the partner marketing page.
 *
 * @see getPartnerPricing
 * @see getPartnerHeroStats
 * @see getPartnerContactChannels
 * @see getPartnerCtas
 * @see generateRequestId
 * @see logger
 */
export default async function PartnerPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'PartnerPage',
    route: '/partner',
    module: 'app/partner',
  });

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading partner page...</div>}>
      <PartnerPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the partner landing page content — loads pricing, hero statistics, contact channels,
 * and CTAs, falling back to safe defaults on fetch failures and emitting request-scoped logs.
 *
 * Fetch behavior:
 * - Attempts to load partner pricing and hero stats; on failure each falls back to built-in defaults
 *   and logs the error via `reqLogger`.
 * - Retrieves contact channels and CTA links for page CTAs.
 *
 * @param props.reqLogger - A request-scoped logger created via `logger.child` used for telemetry
 *                          and error reporting during data fetches.
 * @returns The JSX element tree for the Partner page content.
 *
 * @see getPartnerPricing
 * @see getPartnerHeroStats
 * @see getPartnerContactChannels
 * @see getPartnerCtas
 * @see logger
 */
async function PartnerPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  let pricing: ReturnType<typeof getPartnerPricing>;
  try {
    pricing = getPartnerPricing();
    reqLogger.info('PartnerPage: pricing config loaded', {
      section: 'pricing-config',
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load pricing config');
    reqLogger.error('PartnerPage: getPartnerPricing failed', normalized, {
      section: 'pricing-config',
    });
    // Use defaults instead of throwing to prevent page crash
    pricing = {
      jobs: {
        regular: 99,
        discounted: 79,
        durationDays: 30,
      },
      sponsored: {
        regular: 199,
        discounted: 149,
      },
      launch: {
        discountPercent: 20,
        enabled: false,
        endDate: '',
      },
    };
  }

  let heroStats;
  try {
    heroStats = await getPartnerHeroStats();
    reqLogger.info('PartnerPage: hero stats loaded', { section: 'hero-stats' });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load hero stats');
    reqLogger.error('PartnerPage: getPartnerHeroStats failed', normalized, {
      section: 'hero-stats',
    });
    heroStats = {
      monthlyVisitors: 10_000,
      monthlyPageViews: 50_000,
      configurationCount: 500,
    };
  }
  const configCount = heroStats.configurationCount;

  let partnerContacts;
  try {
    partnerContacts = getPartnerContactChannels();
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load partner contact channels');
    reqLogger.error('PartnerPage: getPartnerContactChannels failed', normalized, {
      section: 'partner-contacts',
    });
    // Use empty defaults instead of throwing to prevent page crash
    // Match the expected shape: partnerEmail, hiEmail, supportEmail, securityEmail
    partnerContacts = {
      partnerEmail: '',
      hiEmail: '',
      supportEmail: '',
      securityEmail: '',
    };
  }

  let partnerCtas: ReturnType<typeof getPartnerCtas>;
  try {
    partnerCtas = getPartnerCtas();
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load partner CTAs');
    reqLogger.error('PartnerPage: getPartnerCtas failed', normalized, {
      section: 'partner-ctas',
    });
    // Use safe default shape instead of empty object to prevent runtime TypeErrors
    // All CTAs must exist with safe values (empty hrefs) to match expected structure
    partnerCtas = {
      jobListing: { href: '', subject: '' },
      sponsoredListing: { href: '', subject: '' },
      partnershipInquiry: { href: '', subject: '' },
    };
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mx-auto mb-12 max-w-5xl text-center">
        <h1
          className={`mb-4 ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_2XL} ${UI_CLASSES.HEADING_H1.split(' ')[1]}`}
        >
          Reach {heroStats.monthlyVisitors.toLocaleString()}+ Claude AI Developers
        </h1>
        <p className={`mb-6 ${UI_CLASSES.TEXT_BODY_LG} text-muted-foreground`}>
          The largest directory of Claude configurations. Attract engineers building the future of
          AI tooling.
        </p>

        {/* Real-Time Stats */}
        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`mb-1 ${UI_CLASSES.HEADING_H3.split(' ').slice(0, 2).join(' ')} text-primary`}
              >
                {heroStats.monthlyVisitors.toLocaleString()}+
              </p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>Monthly Visitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`mb-1 ${UI_CLASSES.HEADING_H3.split(' ').slice(0, 2).join(' ')} text-primary`}
              >
                {heroStats.monthlyPageViews.toLocaleString()}+
              </p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>Page Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`mb-1 ${UI_CLASSES.HEADING_H3.split(' ').slice(0, 2).join(' ')} text-primary`}
              >
                {configCount.toLocaleString()}+
              </p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>Configurations</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Launch Pricing Banner */}
      <Card className="border-primary/20 from-primary/10 to-primary/5 mx-auto mb-12 max-w-4xl bg-linear-to-r">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Sparkles className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  Launch Pricing: {pricing.launch.discountPercent}% Off Everything
                </p>
                <p className="text-muted-foreground text-sm">
                  {pricing.launch.endDate ? `Ends ${pricing.launch.endDate} • ` : null}
                  Simple monthly billing, cancel anytime
                </p>
              </div>
            </div>
            <UnifiedBadge variant="base" className="border-primary/20 bg-primary/10 text-primary">
              <Clock className="mr-1 h-3 w-3" />
              Limited Time
            </UnifiedBadge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Options */}
      <div className="mx-auto mb-16 max-w-5xl">
        <h2 className="mb-8 text-center text-3xl font-bold">Simple, Transparent Pricing</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Job Listings */}
          <HoverCard variant="strong">
            <Card className="relative overflow-hidden border-2">
              <CardHeader>
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <Briefcase className={`${UI_CLASSES.ICON_LG} ${UI_CLASSES.ICON_INFO}`} />
                  </div>
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className="border-blue-500/20 bg-blue-500/5"
                  >
                    Most Popular
                  </UnifiedBadge>
                </div>
                <CardTitle className="text-2xl">Job Listings</CardTitle>
                <CardDescription className="text-base">
                  Hire Claude AI engineers, ML experts, and automation specialists
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="bg-muted/30 rounded-lg border p-4">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-muted-foreground text-xl font-bold line-through">
                      ${pricing.jobs.regular}
                    </span>
                    <span className="text-primary text-3xl font-bold">
                      ${pricing.jobs.discounted}
                    </span>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>/month</span>
                  </div>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>
                    {pricing.jobs.durationDays}-day featured placement • Launch pricing
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Featured in /jobs section</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Company logo & branding</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Apply button to your ATS</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>{pricing.jobs.durationDays}-day visibility</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Analytics dashboard</p>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full" size="lg" asChild>
                  <a href={partnerCtas.jobListing.href}>
                    <Mail className="mr-2 h-4 w-4" />
                    Post a Job
                  </a>
                </Button>
              </CardContent>
            </Card>
          </HoverCard>

          {/* Sponsored Listings */}
          <HoverCard variant="strong">
            <Card className="relative overflow-hidden border-2">
              <CardHeader>
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-purple-500/10 p-3">
                    <Megaphone className={`${UI_CLASSES.ICON_LG} text-purple-500`} />
                  </div>
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className="border-purple-500/20 bg-purple-500/5"
                  >
                    High ROI
                  </UnifiedBadge>
                </div>
                <CardTitle className="text-2xl">Sponsored Listings</CardTitle>
                <CardDescription className="text-base">
                  Feature your MCP server, agent, or tool at the top of search results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="bg-muted/30 rounded-lg border p-4">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-muted-foreground text-xl font-bold line-through">
                      ${pricing.sponsored.regular}
                    </span>
                    <span className="text-primary text-3xl font-bold">
                      ${pricing.sponsored.discounted}
                    </span>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>/month</span>
                  </div>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Per listing • Launch pricing</p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Top placement in category</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>"Sponsored" badge</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Homepage feature rotation</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Analytics dashboard</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Custom call-to-action</p>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full" size="lg" variant="default" asChild>
                  <a href={partnerCtas.sponsoredListing.href}>
                    <Mail className="mr-2 h-4 w-4" />
                    Get Featured
                  </a>
                </Button>
              </CardContent>
            </Card>
          </HoverCard>
        </div>
      </div>

      {/* Why Advertise Here */}
      <div className="mx-auto mb-16 max-w-4xl">
        <h2 className="mb-8 text-center text-2xl font-bold">Why Claude Pro Directory?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <Eye className="text-primary mb-3 h-8 w-8" />
              <p className="mb-2 font-semibold">Highly Engaged Audience</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                5.3 pages/visit average • Engineers actively building with Claude AI
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <MousePointer className="text-primary mb-3 h-8 w-8" />
              <p className="mb-2 font-semibold">Quality Over Quantity</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Focused community of AI engineers, not random traffic
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <BarChart className="text-primary mb-3 h-8 w-8" />
              <p className="mb-2 font-semibold">Transparent Analytics</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Real-time dashboard with views, clicks, and engagement metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ / Common Questions */}
      <div className="mx-auto mb-16 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-2 font-semibold">How quickly can I get started?</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Email us today, and we'll have your listing live within 24 hours. No lengthy
                onboarding process.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-2 font-semibold">Can I cancel anytime?</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Yes, absolutely. No contracts, no commitments. Just email us and we'll process your
                cancellation immediately.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-2 font-semibold">Do you offer bulk pricing?</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Yes! Email us for custom pricing if you need multiple job listings or sponsored
                placements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mx-auto max-w-2xl text-center">
        <Card className="border-primary/20 from-primary/10 to-primary/5 bg-linear-to-r">
          <CardContent className="pt-8 pb-8">
            <h2 className="mb-4 text-2xl font-bold">
              Ready to Reach {heroStats.monthlyVisitors.toLocaleString()}+ AI Engineers?
            </h2>
            <p className="text-muted-foreground mb-6">
              Get started with launch pricing ({pricing.launch.discountPercent}% off)
              {pricing.launch.endDate ? ` before ${pricing.launch.endDate}` : null}
            </p>
            <Button size="lg" asChild>
              <a href={partnerCtas.partnershipInquiry.href}>
                <Mail className="mr-2 h-4 w-4" />
                Email: {partnerContacts.partnerEmail}
              </a>
            </Button>
            <p className={`${UI_CLASSES.TEXT_XS_MUTED} mt-4`}>
              Response time: Within 24 hours • No setup fees • Simple monthly billing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
