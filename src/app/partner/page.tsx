'use client';

import { motion } from 'motion/react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/unified-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { SOCIAL_LINKS } from '@/src/lib/constants';
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
} from '@/src/lib/icons';
import { ANIMATION_CONSTANTS, RESPONSIVE_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';

export default function PartnerPage() {
  const configCount = 282; // Static count for client component

  return (
    <div className={'container mx-auto px-4 py-12'}>
      {/* Hero Section */}
      <div className={'mx-auto mb-12 max-w-5xl text-center'}>
        <h1
          className={`mb-4 ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_2XL} ${UI_CLASSES.HEADING_H1.split(' ')[1]}`}
        >
          Reach 3,000+ Claude AI Developers
        </h1>
        <p className={`mb-6 ${UI_CLASSES.TEXT_BODY_LG} text-muted-foreground`}>
          The largest directory of Claude configurations. Attract engineers building the future of
          AI tooling.
        </p>

        {/* Real-Time Stats */}
        <div className={'mx-auto mb-8 grid max-w-3xl grid-cols-3 gap-4'}>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`mb-1 ${UI_CLASSES.HEADING_H3.split(' ').slice(0, 2).join(' ')} text-primary`}
              >
                3,000+
              </p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>Monthly Visitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 pb-6">
              <p
                className={`mb-1 ${UI_CLASSES.HEADING_H3.split(' ').slice(0, 2).join(' ')} text-primary`}
              >
                16,000+
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
      <Card
        className={
          'mx-auto mb-12 max-w-4xl border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5'
        }
      >
        <CardContent className="pt-6 pb-6">
          <div
            className={
              'flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left'
            }
          >
            <div className={'flex items-start gap-3'}>
              <div className={'rounded-full bg-primary/10 p-2'}>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={'font-semibold text-lg'}>Launch Pricing: 40% Off Everything</p>
                <p className="text-muted-foreground text-sm">
                  Ends December 31st, 2025 • Simple monthly billing, cancel anytime
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
      <div className={'mx-auto mb-16 max-w-5xl'}>
        <h2 className={'mb-8 text-center font-bold text-3xl'}>Simple, Transparent Pricing</h2>
        <div className={'grid gap-8 md:grid-cols-2'}>
          {/* Job Listings */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
          >
            <Card className={'relative overflow-hidden border-2'}>
              <CardHeader>
                <div className={'mb-4 flex items-start justify-between'}>
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
                <div className={'rounded-lg border bg-muted/30 p-4'}>
                  <div className={'mb-2 flex items-baseline gap-2'}>
                    <span className={'font-bold text-muted-foreground text-xl line-through'}>
                      $249
                    </span>
                    <span className={'font-bold text-3xl text-primary'}>$149</span>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>/month</span>
                  </div>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>
                    30-day featured placement • Launch pricing
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Featured in /jobs section</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Company logo & branding</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Apply button to your ATS</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>30-day visibility</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Analytics dashboard</p>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full" size="lg" asChild>
                  <a href={`mailto:${SOCIAL_LINKS.partnerEmail}?subject=Job Listing - Get Started`}>
                    <Mail className={'mr-2 h-4 w-4'} />
                    Post a Job
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sponsored Listings */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
          >
            <Card className={'relative overflow-hidden border-2'}>
              <CardHeader>
                <div className={'mb-4 flex items-start justify-between'}>
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
                <div className={'rounded-lg border bg-muted/30 p-4'}>
                  <div className={'mb-2 flex items-baseline gap-2'}>
                    <span className={'font-bold text-muted-foreground text-xl line-through'}>
                      $199
                    </span>
                    <span className={'font-bold text-3xl text-primary'}>$119</span>
                    <span className={UI_CLASSES.TEXT_SM_MUTED}>/month</span>
                  </div>
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Per listing • Launch pricing</p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Top placement in category</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>"Sponsored" badge</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Homepage feature rotation</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Analytics dashboard</p>
                  </div>
                  <div className={'flex items-start gap-2'}>
                    <Check className={`mt-0.5 ${UI_CLASSES.ICON_SM} ${UI_CLASSES.ICON_SUCCESS}`} />
                    <p className={UI_CLASSES.TEXT_SM}>Custom call-to-action</p>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full" size="lg" variant="default" asChild>
                  <a
                    href={`mailto:${SOCIAL_LINKS.partnerEmail}?subject=Sponsored Listing - Get Started`}
                  >
                    <Mail className={'mr-2 h-4 w-4'} />
                    Get Featured
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Why Advertise Here */}
      <div className={'mx-auto mb-16 max-w-4xl'}>
        <h2 className={'mb-8 text-center font-bold text-2xl'}>Why Claude Pro Directory?</h2>
        <div className={'grid gap-6 md:grid-cols-3'}>
          <Card>
            <CardContent className="pt-6">
              <Eye className="mb-3 h-8 w-8 text-primary" />
              <p className={'mb-2 font-semibold'}>Highly Engaged Audience</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                5.3 pages/visit average • Engineers actively building with Claude AI
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <MousePointer className="mb-3 h-8 w-8 text-primary" />
              <p className={'mb-2 font-semibold'}>Quality Over Quantity</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Focused community of AI engineers, not random traffic
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <BarChart className="mb-3 h-8 w-8 text-primary" />
              <p className={'mb-2 font-semibold'}>Transparent Analytics</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Real-time dashboard with views, clicks, and engagement metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ / Common Questions */}
      <div className={'mx-auto mb-16 max-w-3xl'}>
        <h2 className={'mb-8 text-center font-bold text-2xl'}>Frequently Asked Questions</h2>
        <div className={'space-y-4'}>
          <Card>
            <CardContent className="pt-6">
              <p className={'mb-2 font-semibold'}>How quickly can I get started?</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Email us today, and we'll have your listing live within 24 hours. No lengthy
                onboarding process.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className={'mb-2 font-semibold'}>Can I cancel anytime?</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Yes, absolutely. No contracts, no commitments. Just email us and we'll process your
                cancellation immediately.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className={'mb-2 font-semibold'}>Do you offer bulk pricing?</p>
              <p className={UI_CLASSES.TEXT_SM_MUTED}>
                Yes! Email us for custom pricing if you need multiple job listings or sponsored
                placements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className={'mx-auto max-w-2xl text-center'}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-8 pb-8">
            <h2 className={'mb-4 font-bold text-2xl'}>Ready to Reach 3,000+ AI Engineers?</h2>
            <p className={'mb-6 text-muted-foreground'}>
              Get started with launch pricing (40% off) before December 31st, 2025
            </p>
            <Button size="lg" asChild>
              <a href={`mailto:${SOCIAL_LINKS.partnerEmail}?subject=Partnership Inquiry`}>
                <Mail className={'mr-2 h-4 w-4'} />
                Email: partner@claudepro.directory
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
