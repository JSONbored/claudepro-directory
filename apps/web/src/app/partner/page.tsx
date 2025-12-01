import { getPartnerContactChannels, getPartnerCtas } from '@heyclaude/web-runtime/core';
import { getPartnerHeroStats, getPartnerPricing } from '@heyclaude/web-runtime/data';
import { iconSize, muted, spaceY, marginBottom, iconLeading, weight ,size  , gap , padding , row , radius , maxWidth } from '@heyclaude/web-runtime/design-system';
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
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import { RESPONSIVE_PATTERNS, UnifiedBadge, HoverCard , Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle  } from '@heyclaude/web-runtime/ui';


/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const revalidate = 86_400;

/**
 * Render the partner advertising and pricing landing page with real-time stats, pricing, features, FAQ, and contact CTAs.
 *
 * Loads pricing configuration, hero statistics, contact channels, and CTAs to compose the server-rendered marketing UI. If pricing configuration cannot be loaded, a sensible default pricing object is used so the page still renders. This route uses incremental static regeneration with a 1-day revalidation window.
 *
 * @returns The React element tree for the partner landing page.
 *
 * @see getPartnerPricing
 * @see getPartnerHeroStats
 * @see getPartnerContactChannels
 * @see getPartnerCtas
 */
export default async function PartnerPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'PartnerPage',
    route: '/partner',
    module: 'app/partner',
  });

  let pricing: ReturnType<typeof getPartnerPricing>;
  try {
    pricing = getPartnerPricing();
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

  const heroStats = await getPartnerHeroStats();
  const configCount = heroStats.configurationCount;

  const partnerContacts = getPartnerContactChannels();
  const partnerCtas = getPartnerCtas();

  return (
    <div className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
      {/* Hero Section */}
      <div className={`mx-auto mb-12 ${maxWidth['5xl']}`}>
        <h1
          className={`mb-4 ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_2XL} tracking-tight`}
        >
          Reach {heroStats.monthlyVisitors.toLocaleString()}+ Claude AI Developers
        </h1>
        <p className={`${marginBottom.comfortable} ${muted.lg}`}>
          The largest directory of Claude configurations. Attract engineers building the future of
          AI tooling.
        </p>

        {/* Real-Time Stats */}
        <div className={`mx-auto mb-8 grid ${maxWidth['3xl']} grid-cols-3 ${gap.comfortable}`}>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`${marginBottom.micro} ${weight.semibold} ${size['2xl']} text-primary`}
              >
                {heroStats.monthlyVisitors.toLocaleString()}+
              </p>
              <p className={`${muted.sm}`}>Monthly Visitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`${marginBottom.micro} ${weight.semibold} ${size['2xl']} text-primary`}
              >
                {heroStats.monthlyPageViews.toLocaleString()}+
              </p>
              <p className={`${muted.sm}`}>Page Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`${marginBottom.micro} ${weight.semibold} ${size['2xl']} text-primary`}
              >
                {configCount.toLocaleString()}+
              </p>
              <p className={`${muted.sm}`}>Configurations</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Launch Pricing Banner */}
      <Card
        className={`mx-auto mb-12 ${maxWidth['4xl']}`}
      >
        <CardContent className="pt-6 pb-6">
          <div
            className={`flex flex-col items-center ${gap.default} text-center md:flex-row md:justify-between md:text-left`}
          >
            <div className={`${row.default}`}>
              <div className={`rounded-full bg-primary/10 ${padding.tight}`}>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`${weight.semibold} ${size.lg}`}>
                  Launch Pricing: {pricing.launch.discountPercent}% Off Everything
                </p>
                <p className={muted.sm}>
                  Ends {pricing.launch.endDate} • Simple monthly billing, cancel anytime
                </p>
              </div>
            </div>
            <UnifiedBadge variant="base" className="border-primary/20 bg-primary/10 text-primary">
              <Clock className={iconLeading.xs} />
              Limited Time
            </UnifiedBadge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Options */}
      <div className={`mx-auto mb-16 ${maxWidth['5xl']}`}>
        <h2 className={`${marginBottom.relaxed} text-center ${weight.bold} ${size['3xl']}`}>Simple, Transparent Pricing</h2>
        <div className={`grid ${gap.loose} md:grid-cols-2`}>
          {/* Job Listings */}
          <HoverCard variant="strong">
            <Card className="relative overflow-hidden border-2">
              <CardHeader>
                <div className={`${marginBottom.default} flex items-start justify-between`}>
                  <div className={`${radius.lg} bg-blue-500/10 ${padding.compact}`}>
                    <Briefcase className={`${iconSize.lg} text-blue-600`} />
                  </div>
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className="border-blue-500/20 bg-blue-500/5"
                  >
                    Most Popular
                  </UnifiedBadge>
                </div>
                <CardTitle className={`${size['2xl']}`}>Job Listings</CardTitle>
                <CardDescription className="text-base">
                  Hire Claude AI engineers, ML experts, and automation specialists
                </CardDescription>
              </CardHeader>
              <CardContent className={spaceY.relaxed}>
                {/* Pricing */}
                <div className={`${radius.lg} border bg-muted/30 ${padding.default}`}>
                  <div className={`${marginBottom.tight} flex items-baseline ${gap.compact}`}>
                    <span className={`${weight.bold} ${muted.default} ${size.xl} line-through`}>
                      ${pricing.jobs.regular}
                    </span>
                    <span className={`${weight.bold} ${size['3xl']} text-primary`}>
                      ${pricing.jobs.discounted}
                    </span>
                    <span className={`${muted.sm}`}>/month</span>
                  </div>
                  <p className={`${muted.default} ${size.xs}`}>
                    {pricing.jobs.durationDays}-day featured placement • Launch pricing
                  </p>
                </div>

                {/* Features */}
                <div className={spaceY.default}>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Featured in /jobs section</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Company logo & branding</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Apply button to your ATS</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">{pricing.jobs.durationDays}-day visibility</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Analytics dashboard</p>
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
                <div className={`${marginBottom.default} flex items-start justify-between`}>
                  <div className={`${radius.lg} bg-purple-500/10 ${padding.compact}`}>
                    <Megaphone className={`${iconSize.lg} text-purple-500`} />
                  </div>
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className="border-purple-500/20 bg-purple-500/5"
                  >
                    High ROI
                  </UnifiedBadge>
                </div>
                <CardTitle className={`${size['2xl']}`}>Sponsored Listings</CardTitle>
                <CardDescription className="text-base">
                  Feature your MCP server, agent, or tool at the top of search results
                </CardDescription>
              </CardHeader>
              <CardContent className={spaceY.relaxed}>
                {/* Pricing */}
                <div className={`${radius.lg} border bg-muted/30 ${padding.default}`}>
                  <div className={`${marginBottom.tight} flex items-baseline ${gap.compact}`}>
                    <span className={`${weight.bold} ${muted.default} ${size.xl} line-through`}>
                      ${pricing.sponsored.regular}
                    </span>
                    <span className={`${weight.bold} ${size['3xl']} text-primary`}>
                      ${pricing.sponsored.discounted}
                    </span>
                    <span className={`${muted.sm}`}>/month</span>
                  </div>
                  <p className={`${muted.default} ${size.xs}`}>Per listing • Launch pricing</p>
                </div>

                {/* Features */}
                <div className={spaceY.default}>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Top placement in category</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">"Sponsored" badge</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Homepage feature rotation</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Analytics dashboard</p>
                  </div>
                  <div className={`${row.compact}`}>
                    <Check className={`mt-0.5 ${iconSize.sm} text-green-600`} />
                    <p className="text-sm">Custom call-to-action</p>
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
      <div className={`mx-auto mb-16 ${maxWidth['4xl']}`}>
        <h2 className={`${marginBottom.relaxed} text-center ${weight.bold} ${size['2xl']}`}>Why Claude Pro Directory?</h2>
        <div className={`grid ${gap.relaxed} md:grid-cols-3`}>
          <Card>
            <CardContent className="pt-6">
              <Eye className={`${marginBottom.compact} h-8 w-8 text-primary`} />
              <p className={`${marginBottom.tight} ${weight.semibold}`}>Highly Engaged Audience</p>
              <p className={`${muted.sm}`}>
                5.3 pages/visit average • Engineers actively building with Claude AI
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <MousePointer className={`${marginBottom.compact} h-8 w-8 text-primary`} />
              <p className={`${marginBottom.tight} ${weight.semibold}`}>Quality Over Quantity</p>
              <p className={`${muted.sm}`}>
                Focused community of AI engineers, not random traffic
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <BarChart className={`${marginBottom.compact} h-8 w-8 text-primary`} />
              <p className={`${marginBottom.tight} ${weight.semibold}`}>Transparent Analytics</p>
              <p className={`${muted.sm}`}>
                Real-time dashboard with views, clicks, and engagement metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ / Common Questions */}
      <div className={`mx-auto mb-16 ${maxWidth['3xl']}`}>
        <h2 className={`${marginBottom.relaxed} text-center ${weight.bold} ${size['2xl']}`}>Frequently Asked Questions</h2>
        <div className={spaceY.comfortable}>
          <Card>
            <CardContent className="pt-6">
              <p className={`${marginBottom.tight} ${weight.semibold}`}>How quickly can I get started?</p>
              <p className={`${muted.sm}`}>
                Email us today, and we'll have your listing live within 24 hours. No lengthy
                onboarding process.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className={`${marginBottom.tight} ${weight.semibold}`}>Can I cancel anytime?</p>
              <p className={`${muted.sm}`}>
                Yes, absolutely. No contracts, no commitments. Just email us and we'll process your
                cancellation immediately.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className={`${marginBottom.tight} ${weight.semibold}`}>Do you offer bulk pricing?</p>
              <p className={`${muted.sm}`}>
                Yes! Email us for custom pricing if you need multiple job listings or sponsored
                placements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className={`mx-auto ${maxWidth['2xl']}`}>
        <Card className="border-primary/20 bg-linear-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-8 pb-8">
            <h2 className={`${marginBottom.default} ${weight.bold} ${size['2xl']}`}>
              Ready to Reach {heroStats.monthlyVisitors.toLocaleString()}+ AI Engineers?
            </h2>
            <p className={`${marginBottom.comfortable} ${muted.default}`}>
              Get started with launch pricing ({pricing.launch.discountPercent}% off) before{' '}
              {pricing.launch.endDate}
            </p>
            <Button size="lg" asChild>
              <a href={partnerCtas.partnershipInquiry.href}>
                <Mail className="mr-2 h-4 w-4" />
                Email: {partnerContacts.partnerEmail}
              </a>
            </Button>
            <p className={`${muted.default} ${size.xs} mt-4`}>
              Response time: Within 24 hours • No setup fees • Simple monthly billing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}