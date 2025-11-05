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
import { ROUTES } from '@/src/lib/constants/routes';
import {
  Bell,
  Calendar,
  Check,
  Rocket,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/ph-waitlist', {
  title: 'Product Hunt Launch - Join Our Community on November 4th',
  description:
    'Join our Product Hunt launch waitlist! Be first to know when we go live, support us with your upvote, and get exclusive early access to new configurations and features.',
});

export default function PHWaitlistPage() {
  return (
    <div className={'container mx-auto px-4 py-12'}>
      {/* Hero Section */}
      <div className={'mx-auto mb-16 max-w-3xl text-center'}>
        <div
          className={
            'mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10'
          }
        >
          <Bell className="h-10 w-10 text-primary" />
        </div>
        <h1 className={'mb-6 font-bold text-4xl md:text-6xl'}>Join the Launch Community</h1>
        <p className={'mb-8 text-muted-foreground text-xl md:text-2xl'}>
          Be the first to know when we launch on Product Hunt and help us{' '}
          <span className="font-semibold text-primary">reach #1 Product of the Day</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <UnifiedBadge variant="base" className="border-primary/20 bg-primary/10 text-primary">
            <Calendar className="mr-1 h-3 w-3" />
            November 4, 2025
          </UnifiedBadge>
          <UnifiedBadge
            variant="base"
            className="border-green-500/20 bg-green-500/10 text-green-500"
          >
            <Rocket className="mr-1 h-3 w-3" />
            Community Launch
          </UnifiedBadge>
        </div>
      </div>

      {/* Email Signup Form - Using UnifiedNewsletterCapture */}
      <div className={'mx-auto mb-16 max-w-2xl'}>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardContent className="pt-8 pb-8">
            <div className="mb-6 text-center">
              <Sparkles className={'mx-auto mb-4 h-12 w-12 text-primary'} />
              <h2 className={'mb-2 font-bold text-2xl'}>Get Notified on Launch Day</h2>
              <p className="text-muted-foreground text-sm">
                Join our community and be first to support us on Product Hunt
              </p>
            </div>

            <UnifiedNewsletterCapture source="homepage" variant="card" context="ph-waitlist-main" />

            <div className={'mt-6 space-y-3'}>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Launch day notification via email</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Early access to new configurations</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Community contributor badge</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Why Join Section */}
      <div className={'mx-auto mb-16 max-w-4xl'}>
        <h2 className={'mb-12 text-center font-bold text-3xl'}>Why Join Our Community?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className={'mb-3 w-fit rounded-lg bg-primary/10 p-3'}>
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Help Us Launch</CardTitle>
              <CardDescription>Your upvote on Product Hunt makes a huge difference</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Early momentum is critical. Be notified the moment we go live so you can support us
                with your upvote and help us reach #1 Product of the Day.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={'mb-3 w-fit rounded-lg bg-green-500/10 p-3'}>
                <Sparkles className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-xl">Early Access</CardTitle>
              <CardDescription>Get new configurations before anyone else</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Community members get early access to new Claude configurations, experimental
                features, and beta testing opportunities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={'mb-3 w-fit rounded-lg bg-blue-500/10 p-3'}>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Shape the Future</CardTitle>
              <CardDescription>Your feedback drives our roadmap</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Community members influence what we build next, contribute configurations, and help
                shape the directory's direction.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <div className={'mx-auto mb-16 max-w-3xl'}>
        <h2 className={'mb-12 text-center font-bold text-3xl'}>Launch Timeline</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Day Before */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'
                    }
                  >
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className={'mt-2 h-full w-px bg-border'} />
                </div>
                <div className="pb-6">
                  <p className={'mb-1 font-semibold'}>November 3rd - Day Before</p>
                  <p className="text-muted-foreground text-sm">
                    Pre-launch email reminder with Product Hunt link
                  </p>
                </div>
              </div>

              {/* Launch Day Morning */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10'
                    }
                  >
                    <Rocket className="h-5 w-5 text-green-500" />
                  </div>
                  <div className={'mt-2 h-full w-px bg-border'} />
                </div>
                <div className="pb-6">
                  <p className={'mb-1 font-semibold'}>November 4th - 12:01 AM PST</p>
                  <p className="text-muted-foreground text-sm">
                    Official Product Hunt launch - upvote to help us reach #1
                  </p>
                </div>
              </div>

              {/* Mid-Day Reminder */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10'
                    }
                  >
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className={'mt-2 h-full w-px bg-border'} />
                </div>
                <div className="pb-6">
                  <p className={'mb-1 font-semibold'}>November 4th - 12:00 PM PST</p>
                  <p className="text-muted-foreground text-sm">
                    Mid-day reminder to share and upvote
                  </p>
                </div>
              </div>

              {/* End of Day */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10'
                    }
                  >
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <div>
                  <p className={'mb-1 font-semibold'}>November 4th - 11:59 PM PST</p>
                  <p className="text-muted-foreground text-sm">
                    Launch day ends - thank you for your support!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Proof */}
      <div className={'mx-auto mb-16 max-w-4xl'}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-8 pb-8">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <div>
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <p className={'font-bold text-2xl text-primary'}>1,000+</p>
                </div>
                <p className="text-muted-foreground text-xs">Active Users</p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <p className={'font-bold text-2xl text-primary'}>4.9/5</p>
                </div>
                <p className="text-muted-foreground text-xs">User Rating</p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <p className={'font-bold text-2xl text-primary'}>500+</p>
                </div>
                <p className="text-muted-foreground text-xs">Configurations</p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <p className={'font-bold text-2xl text-primary'}>100%</p>
                </div>
                <p className="text-muted-foreground text-xs">Free Forever</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className={'mx-auto mb-16 max-w-3xl'}>
        <h2 className={'mb-12 text-center font-bold text-3xl'}>Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When exactly does the launch happen?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                We launch on Product Hunt on November 4th, 2025 at 12:01 AM PST. Waitlist
                subscribers will receive an email notification as soon as we go live.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why should I upvote on Product Hunt?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Your upvote helps us reach more developers who need quality Claude configurations.
                Higher visibility means a stronger community and better resources for everyone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What benefits do community members get?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Early access to new configurations, beta testing opportunities, influence on our
                roadmap, contributor badges, and direct connection with other Claude power users.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is everything really free?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Yes! All configurations, agents, MCP servers, and resources are 100% free. We're
                building the best community-driven directory for Claude configurations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className={'mx-auto max-w-2xl text-center'}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-8 pb-8">
            <h2 className={'mb-4 font-bold text-2xl'}>Ready to Join Our Community?</h2>
            <p className={'mb-6 text-muted-foreground'}>
              Enter your email above to get notified when we launch. Be part of the Product Hunt
              launch day!
            </p>
            <div className={'flex flex-col justify-center gap-4 sm:flex-row'}>
              <Button size="lg" asChild>
                <Link href={ROUTES.HOME}>
                  <Sparkles className={'mr-2 h-4 w-4'} />
                  Explore Configurations
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.HOME}>
                  <Users className={'mr-2 h-4 w-4'} />
                  Join the Community
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-muted-foreground text-xs">
              Unsubscribe anytime • 100% free, forever
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
