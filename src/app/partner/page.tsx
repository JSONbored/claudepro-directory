import Link from 'next/link';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { ROUTES, SOCIAL_LINKS } from '@/src/lib/constants';
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
    <div className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
      {/* Header */}
      <div
        className={`${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.TEXT_CENTER} mb-16`}
      >
        <Badge variant="outline" className={UI_CLASSES.MB_6}>
          <Handshake className="h-3 w-3 mr-1" />
          Partnership & Advertising
        </Badge>
        <h1 className={`text-4xl md:text-5xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_6}`}>
          Grow Your Business With Us
        </h1>
        <p className={`${UI_CLASSES.TEXT_XL} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
          Connect with thousands of Claude AI professionals and showcase your tools, services, and
          opportunities
        </p>
      </div>

      {/* Limited Time Offer Banner */}
      <Card
        className={`${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO} mb-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20`}
      >
        <CardContent className={UI_CLASSES.PT_6}>
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} flex-wrap gap-4`}>
            <div className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3}`}>
              <div className={`${UI_CLASSES.P_2} bg-primary/10 ${UI_CLASSES.ROUNDED_FULL}`}>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`font-semibold ${UI_CLASSES.TEXT_LG}`}>Limited Time Offer</p>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  First 20 partners get 50% off for 3 months - Limited spots remaining!
                </p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Early Partner Discount
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Primary Monetization Options */}
      <div
        className={`${UI_CLASSES.GRID_RESPONSIVE_2_GAP_8} ${UI_CLASSES.MAX_W_5XL} ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.MB_12}`}
      >
        {/* Job Listings */}
        <Card
          className={`${UI_CLASSES.RELATIVE} overflow-hidden border-2 hover:border-primary/50 ${UI_CLASSES.TRANSITION_COLORS}`}
        >
          <div
            className={`${UI_CLASSES.ABSOLUTE} ${UI_CLASSES.TOP_0} ${UI_CLASSES.RIGHT_0} w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full`}
          />
          <CardHeader>
            <div
              className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN} mb-4`}
            >
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-500" />
              </div>
              <Badge variant="outline" className="bg-blue-500/5">
                Popular
              </Badge>
            </div>
            <CardTitle className="text-2xl">Job Listings</CardTitle>
            <CardDescription className="text-base">
              Hire top Claude AI talent from our engaged community
            </CardDescription>
          </CardHeader>
          <CardContent className={UI_CLASSES.SPACE_Y_4}>
            <div className={UI_CLASSES.SPACE_Y_3}>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                <div className={UI_CLASSES.FLEX_COL}>
                  <p className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.TEXT_SM}`}>
                    Premium Visibility
                  </p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Featured placement in Jobs section</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Users className="h-4 w-4 text-green-500 mt-0.5" />
                <div className={UI_CLASSES.FLEX_COL}>
                  <p className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.TEXT_SM}`}>
                    Targeted Audience
                  </p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Reach Claude developers & AI engineers</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Zap className="h-4 w-4 text-green-500 mt-0.5" />
                <div className={UI_CLASSES.FLEX_COL}>
                  <p className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.TEXT_SM}`}>
                    30-Day Listings
                  </p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Extended visibility for your positions</p>
                </div>
              </div>
            </div>
            <div className={`${UI_CLASSES.PT_4} ${UI_CLASSES.BORDER_T}`}>
              <p className={`${UI_CLASSES.TEXT_SM_MUTED} mb-4`}>
                Perfect for companies building with Claude and AI tools
              </p>
              <Button className={UI_CLASSES.W_FULL} size="lg" asChild>
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
                  <ArrowRight className={`h-4 w-4 ${UI_CLASSES.ML_2}`} />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sponsored Listings */}
        <Card
          className={`${UI_CLASSES.RELATIVE} overflow-hidden border-2 hover:border-primary/50 ${UI_CLASSES.TRANSITION_COLORS}`}
        >
          <div
            className={`${UI_CLASSES.ABSOLUTE} ${UI_CLASSES.TOP_0} ${UI_CLASSES.RIGHT_0} w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full`}
          />
          <CardHeader>
            <div
              className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN} mb-4`}
            >
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Megaphone className="h-6 w-6 text-purple-500" />
              </div>
              <Badge variant="outline" className="bg-purple-500/5">
                High Impact
              </Badge>
            </div>
            <CardTitle className="text-2xl">Sponsored Placements</CardTitle>
            <CardDescription className="text-base">
              Promote your tools, MCP servers, or services
            </CardDescription>
          </CardHeader>
          <CardContent className={UI_CLASSES.SPACE_Y_4}>
            <div className={UI_CLASSES.SPACE_Y_3}>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Target className="h-4 w-4 text-green-500 mt-0.5" />
                <div className={UI_CLASSES.FLEX_COL}>
                  <p className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.TEXT_SM}`}>Top Positions</p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Featured in category listings</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <Sparkles className="h-4 w-4 text-green-500 mt-0.5" />
                <div className={UI_CLASSES.FLEX_COL}>
                  <p className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.TEXT_SM}`}>
                    "Sponsored" Badge
                  </p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Stand out with premium designation</p>
                </div>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                <div className={UI_CLASSES.FLEX_COL}>
                  <p className={`${UI_CLASSES.FONT_MEDIUM} ${UI_CLASSES.TEXT_SM}`}>
                    Analytics Dashboard
                  </p>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Track views and engagement</p>
                </div>
              </div>
            </div>
            <div className={`${UI_CLASSES.PT_4} ${UI_CLASSES.BORDER_T}`}>
              <p className={`${UI_CLASSES.TEXT_SM_MUTED} mb-4`}>
                Available for all categories: Agents, MCP, Rules, Commands, Hooks
              </p>
              <Button className={UI_CLASSES.W_FULL} size="lg" variant="default" asChild>
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
                  <ArrowRight className={`h-4 w-4 ${UI_CLASSES.ML_2}`} />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Props Section */}
      <div
        className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO} mb-16`}
      >
        <Card className={UI_CLASSES.TEXT_CENTER}>
          <CardContent className={UI_CLASSES.PT_6}>
            <p className={`text-lg ${UI_CLASSES.FONT_BOLD} text-primary`}>Featured</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Placement</p>
          </CardContent>
        </Card>
        <Card className={UI_CLASSES.TEXT_CENTER}>
          <CardContent className={UI_CLASSES.PT_6}>
            <p className={`text-lg ${UI_CLASSES.FONT_BOLD} text-primary`}>Targeted</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Audience</p>
          </CardContent>
        </Card>
        <Card className={UI_CLASSES.TEXT_CENTER}>
          <CardContent className={UI_CLASSES.PT_6}>
            <p className={`text-lg ${UI_CLASSES.FONT_BOLD} text-primary`}>Quick</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Setup</p>
          </CardContent>
        </Card>
        <Card className={UI_CLASSES.TEXT_CENTER}>
          <CardContent className={UI_CLASSES.PT_6}>
            <p className={`text-lg ${UI_CLASSES.FONT_BOLD} text-primary`}>Cancel</p>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>Anytime</p>
          </CardContent>
        </Card>
      </div>

      {/* Other Partnership Types */}
      <div className={`${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO} mb-16`}>
        <h2
          className={`text-2xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.TEXT_CENTER} ${UI_CLASSES.MB_8}`}
        >
          Other Partnership Opportunities
        </h2>
        <div className={UI_CLASSES.GRID_RESPONSIVE_3_NO_LG}>
          <Card>
            <CardHeader>
              <div
                className={`${UI_CLASSES.P_2} bg-primary/10 rounded-lg w-fit ${UI_CLASSES.MB_3}`}
              >
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Integration Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.MB_3}`}>
                Integrate your tools with Claude configurations
              </CardDescription>
              <ul className={`${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.TEXT_SM_MUTED}`}>
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
              <div
                className={`${UI_CLASSES.P_2} bg-primary/10 rounded-lg w-fit ${UI_CLASSES.MB_3}`}
              >
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Content Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.MB_3}`}>
                Contribute premium configurations
              </CardDescription>
              <ul className={`${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.TEXT_SM_MUTED}`}>
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
              <div
                className={`${UI_CLASSES.P_2} bg-primary/10 rounded-lg w-fit ${UI_CLASSES.MB_3}`}
              >
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Enterprise</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.MB_3}`}>
                Custom solutions for large teams
              </CardDescription>
              <ul className={`${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.TEXT_SM_MUTED}`}>
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
      <div className={`${UI_CLASSES.TEXT_CENTER} ${UI_CLASSES.MAX_W_2XL} ${UI_CLASSES.MX_AUTO}`}>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD} mb-4`}>Ready to Get Started?</h2>
            <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MB_6}`}>
              Join the first 20 partners and get 50% off for your first 3 months. Let's discuss how
              we can help grow your business.
            </p>
            <div
              className={`${UI_CLASSES.FLEX_COL} sm:flex-row gap-4 ${UI_CLASSES.JUSTIFY_CENTER}`}
            >
              <Button size="lg" asChild>
                <a href={`mailto:${SOCIAL_LINKS.partnerEmail}`}>
                  <Mail className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />
                  Contact Sales
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.SUBMIT}>
                  Submit Configuration
                  <ArrowRight className={`h-4 w-4 ${UI_CLASSES.ML_2}`} />
                </Link>
              </Button>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS_MUTED} ${UI_CLASSES.MT_4}`}>
              Custom pricing available • No setup fees • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        <InlineEmailCTA
          variant="hero"
          context="partner-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
