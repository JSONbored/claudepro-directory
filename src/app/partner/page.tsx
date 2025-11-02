import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Handshake,
  Mail,
  Megaphone,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = generatePageMetadata('/partner');

// Enable ISR - revalidate every 24 hours for static marketing pages

export default function PartnerPage() {
  return (
    <div className={'container mx-auto px-4 py-12'}>
      {/* Header */}
      <div className={'mx-auto mb-16 max-w-4xl text-center'}>
        <UnifiedBadge variant="base" style="outline" className="mb-6">
          <Handshake className="mr-1 h-3 w-3" />
          Partnership & Advertising
        </UnifiedBadge>
        <h1 className={'mb-6 font-bold text-4xl md:text-5xl'}>Grow Your Business With Us</h1>
        <p className={'text-muted-foreground text-xl'}>
          Connect with thousands of Claude AI professionals and showcase your tools, services, and
          opportunities
        </p>
      </div>

      {/* Limited Time Offer Banner */}
      <Card
        className={
          'mx-auto mb-12 max-w-4xl border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5'
        }
      >
        <CardContent className="pt-6">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} flex-wrap gap-4`}>
            <div className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3}`}>
              <div className={'rounded-full bg-primary/10 p-2'}>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={'font-semibold text-lg'}>Limited Time Offer</p>
                <p className="text-muted-foreground">
                  First 20 partners get 50% off for 3 months - Limited spots remaining!
                </p>
              </div>
            </div>
            <UnifiedBadge variant="base" className="border-primary/20 bg-primary/10 text-primary">
              Early Partner Discount
            </UnifiedBadge>
          </div>
        </CardContent>
      </Card>

      {/* Primary Monetization Options */}
      <div className={'mx-auto mb-12 grid max-w-5xl gap-8 md:grid-cols-2'}>
        {/* Job Listings */}
        <Card
          className={'relative overflow-hidden border-2 transition-colors hover:border-primary/50'}
        >
          <div
            className={
              'absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-blue-500/10 to-transparent'
            }
          />
          <CardHeader>
            <div className={'mb-4 flex items-start justify-between'}>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Briefcase className="h-6 w-6 text-blue-500" />
              </div>
              <UnifiedBadge variant="base" style="outline" className="bg-blue-500/5">
                Popular
              </UnifiedBadge>
            </div>
            <CardTitle className="text-2xl">Job Listings</CardTitle>
            <CardDescription className="text-base">
              Hire top Claude AI talent from our engaged community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <TrendingUp className="mt-0.5 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <p className={'font-medium text-sm'}>Premium Visibility</p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Featured placement in Jobs section</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Users className="mt-0.5 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <p className={'font-medium text-sm'}>Targeted Audience</p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Reach Claude developers & AI engineers</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Zap className="mt-0.5 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <p className={'font-medium text-sm'}>30-Day Listings</p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Extended visibility for your positions</p>
                </div>
              </div>
            </div>
            <div className={'border-t pt-4'}>
              <p className={`${UI_CLASSES.TEXT_SM_MUTED} mb-4`}>
                Perfect for companies building with Claude and AI tools
              </p>
              <Button className="w-full" size="lg" asChild>
                <a
                  href={`mailto:${SOCIAL_LINKS.partnerEmail}?subject=${encodeURIComponent(
                    'Job Listing Inquiry - Claude Pro Directory'
                  )}&body=${encodeURIComponent(
                    `Hi Claude Pro Directory Team,

I'm interested in posting a job listing on your platform.

Company Name: [Your Company]
Position Title: [Position Title]
Location: [Location/Remote]
Type: [Full-time/Part-time/Contract]

Job Description:
[Brief description of the role]

Requirements:
- [Key requirement 1]
- [Key requirement 2]
- [Key requirement 3]

Why this role is perfect for Claude AI professionals:
[Explain how this role involves Claude/AI]

Budget Range: [Salary/Rate Range]

Please let me know the next steps and pricing details.

Best regards,
[Your Name]
[Your Email]
[Your Phone]`
                  )}`}
                >
                  Post a Job
                  <ArrowRight className={'ml-2 h-4 w-4'} />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sponsored Listings */}
        <Card
          className={'relative overflow-hidden border-2 transition-colors hover:border-primary/50'}
        >
          <div
            className={
              'absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-purple-500/10 to-transparent'
            }
          />
          <CardHeader>
            <div className={'mb-4 flex items-start justify-between'}>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Megaphone className="h-6 w-6 text-purple-500" />
              </div>
              <UnifiedBadge variant="base" style="outline" className="bg-purple-500/5">
                High Impact
              </UnifiedBadge>
            </div>
            <CardTitle className="text-2xl">Sponsored Placements</CardTitle>
            <CardDescription className="text-base">
              Promote your tools, MCP servers, or services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Target className="mt-0.5 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <p className={'font-medium text-sm'}>Top Positions</p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Featured in category listings</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Sparkles className="mt-0.5 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <p className={'font-medium text-sm'}>"Sponsored" Badge</p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Stand out with premium designation</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <TrendingUp className="mt-0.5 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <p className={'font-medium text-sm'}>Analytics Dashboard</p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Track views and engagement</p>
                </div>
              </div>
            </div>
            <div className={'border-t pt-4'}>
              <p className={`${UI_CLASSES.TEXT_SM_MUTED} mb-4`}>
                Available for all categories: Agents, MCP, Rules, Commands, Hooks
              </p>
              <Button className="w-full" size="lg" variant="default" asChild>
                <a
                  href={`mailto:${SOCIAL_LINKS.partnerEmail}?subject=${encodeURIComponent(
                    'Sponsored Placement Inquiry - Claude Pro Directory'
                  )}&body=${encodeURIComponent(
                    `Hi Claude Pro Directory Team,

I'm interested in sponsoring a configuration on your platform.

Configuration Type: [Agent/MCP Server/Rule/Command/Hook]
Configuration Name: [Your Configuration Name]
Current URL (if already listed): [URL or N/A]

What we offer:
[Brief description of your tool/service/configuration]

Target Audience:
[Who would benefit from this configuration]

Sponsorship Goals:
- [ ] Increase visibility
- [ ] Drive adoption
- [ ] Generate leads
- [ ] Other: [Specify]

Preferred Sponsorship Duration: [1 month/3 months/6 months]

Additional Services Interested In:
- [ ] Featured badge
- [ ] Top placement in category
- [ ] Homepage feature
- [ ] Analytics dashboard

Please send me information about:
- Pricing options
- Available placements
- Performance metrics
- Early partner discount eligibility

Best regards,
[Your Name]
[Your Company]
[Your Email]
[Your Phone]`
                  )}`}
                >
                  Get Featured
                  <ArrowRight className={'ml-2 h-4 w-4'} />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Props Section */}
      <div className={'mx-auto mb-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4'}>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className={'font-bold text-lg text-primary'}>Featured</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Placement</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className={'font-bold text-lg text-primary'}>Targeted</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Audience</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className={'font-bold text-lg text-primary'}>Quick</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Setup</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className={'font-bold text-lg text-primary'}>Cancel</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Anytime</p>
          </CardContent>
        </Card>
      </div>

      {/* Other Partnership Types */}
      <div className={'mx-auto mb-16 max-w-4xl'}>
        <h2 className={'mb-8 text-center font-bold text-2xl'}>Other Partnership Opportunities</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className={'mb-3 w-fit rounded-lg bg-primary/10 p-2'}>
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Integration Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={'mb-3 text-sm'}>
                Integrate your tools with Claude configurations
              </CardDescription>
              <ul className={`space-y-1 ${UI_CLASSES.TEXT_SM_MUTED}`}>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  API access
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Co-marketing
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Custom support
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={'mb-3 w-fit rounded-lg bg-primary/10 p-2'}>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Content Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={'mb-3 text-sm'}>
                Contribute premium configurations
              </CardDescription>
              <ul className={`space-y-1 ${UI_CLASSES.TEXT_SM_MUTED}`}>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Featured status
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Priority review
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Attribution
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={'mb-3 w-fit rounded-lg bg-primary/10 p-2'}>
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Enterprise</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={'mb-3 text-sm'}>
                Custom solutions for large teams
              </CardDescription>
              <ul className={`space-y-1 ${UI_CLASSES.TEXT_SM_MUTED}`}>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Private listings
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Bulk postings
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className="text-green-500">✓</span>
                  Custom terms
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className={'mx-auto max-w-2xl text-center'}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-8 pb-8">
            <h2 className={'mb-4 font-bold text-2xl'}>Ready to Get Started?</h2>
            <p className={'mb-6 text-muted-foreground'}>
              Join the first 20 partners and get 50% off for your first 3 months. Let's discuss how
              we can help grow your business.
            </p>
            <div className={'flex flex-col justify-center gap-4 sm:flex-row'}>
              <Button size="lg" asChild>
                <a href={`mailto:${SOCIAL_LINKS.partnerEmail}`}>
                  <Mail className={'mr-2 h-4 w-4'} />
                  Contact Sales
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.SUBMIT}>
                  Submit Configuration
                  <ArrowRight className={'ml-2 h-4 w-4'} />
                </Link>
              </Button>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS_MUTED} mt-4`}>
              Custom pricing available • No setup fees • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture source="content_page" variant="hero" context="partner-page" />
      </section>
    </div>
  );
}
