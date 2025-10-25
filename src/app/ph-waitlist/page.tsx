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
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
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
      <div className={'max-w-3xl mx-auto text-center mb-16'}>
        <div
          className={
            'inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6'
          }
        >
          <Bell className="h-10 w-10 text-primary" />
        </div>
        <h1 className={'text-4xl md:text-6xl font-bold mb-6'}>Join the Launch Community</h1>
        <p className={'text-xl md:text-2xl text-muted-foreground mb-8'}>
          Be the first to know when we launch on Product Hunt and help us{' '}
          <span className="text-primary font-semibold">reach #1 Product of the Day</span>
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <UnifiedBadge variant="base" className="bg-primary/10 text-primary border-primary/20">
            <Calendar className="h-3 w-3 mr-1" />
            November 4, 2025
          </UnifiedBadge>
          <UnifiedBadge
            variant="base"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            <Rocket className="h-3 w-3 mr-1" />
            Community Launch
          </UnifiedBadge>
        </div>
      </div>

      {/* Email Signup Form - Using UnifiedNewsletterCapture */}
      <div className={'max-w-2xl mx-auto mb-16'}>
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-6">
              <Sparkles className={'h-12 w-12 text-primary mx-auto mb-4'} />
              <h2 className={'text-2xl font-bold mb-2'}>Get Notified on Launch Day</h2>
              <p className="text-sm text-muted-foreground">
                Join our community and be first to support us on Product Hunt
              </p>
            </div>

            <UnifiedNewsletterCapture source="homepage" variant="card" context="ph-waitlist-main" />

            <div className={'mt-6 space-y-3'}>
              <div className="flex items-center gap-3 justify-center">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Launch day notification via email</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Early access to new configurations</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Community contributor badge</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Why Join Section */}
      <div className={'max-w-4xl mx-auto mb-16'}>
        <h2 className={'text-3xl font-bold text-center mb-12'}>Why Join Our Community?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className={'p-3 bg-primary/10 rounded-lg w-fit mb-3'}>
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Help Us Launch</CardTitle>
              <CardDescription>Your upvote on Product Hunt makes a huge difference</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Early momentum is critical. Be notified the moment we go live so you can support us
                with your upvote and help us reach #1 Product of the Day.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={'p-3 bg-green-500/10 rounded-lg w-fit mb-3'}>
                <Sparkles className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-xl">Early Access</CardTitle>
              <CardDescription>Get new configurations before anyone else</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Community members get early access to new Claude configurations, experimental
                features, and beta testing opportunities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className={'p-3 bg-blue-500/10 rounded-lg w-fit mb-3'}>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Shape the Future</CardTitle>
              <CardDescription>Your feedback drives our roadmap</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Community members influence what we build next, contribute configurations, and help
                shape the directory's direction.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <div className={'max-w-3xl mx-auto mb-16'}>
        <h2 className={'text-3xl font-bold text-center mb-12'}>Launch Timeline</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Day Before */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full'
                    }
                  >
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className={'w-px h-full bg-border mt-2'} />
                </div>
                <div className="pb-6">
                  <p className={'font-semibold mb-1'}>November 3rd - Day Before</p>
                  <p className="text-sm text-muted-foreground">
                    Pre-launch email reminder with Product Hunt link
                  </p>
                </div>
              </div>

              {/* Launch Day Morning */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-full'
                    }
                  >
                    <Rocket className="h-5 w-5 text-green-500" />
                  </div>
                  <div className={'w-px h-full bg-border mt-2'} />
                </div>
                <div className="pb-6">
                  <p className={'font-semibold mb-1'}>November 4th - 12:01 AM PST</p>
                  <p className="text-sm text-muted-foreground">
                    Official Product Hunt launch - upvote to help us reach #1
                  </p>
                </div>
              </div>

              {/* Mid-Day Reminder */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-full'
                    }
                  >
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className={'w-px h-full bg-border mt-2'} />
                </div>
                <div className="pb-6">
                  <p className={'font-semibold mb-1'}>November 4th - 12:00 PM PST</p>
                  <p className="text-sm text-muted-foreground">
                    Mid-day reminder to share and upvote
                  </p>
                </div>
              </div>

              {/* End of Day */}
              <div className="flex gap-4">
                <div className={'flex flex-col items-center'}>
                  <div
                    className={
                      'flex items-center justify-center w-10 h-10 bg-purple-500/10 rounded-full'
                    }
                  >
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <div>
                  <p className={'font-semibold mb-1'}>November 4th - 11:59 PM PST</p>
                  <p className="text-sm text-muted-foreground">
                    Launch day ends - thank you for your support!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Proof */}
      <div className={'max-w-4xl mx-auto mb-16'}>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <p className={'text-2xl font-bold text-primary'}>1,000+</p>
                </div>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <p className={'text-2xl font-bold text-primary'}>4.9/5</p>
                </div>
                <p className="text-xs text-muted-foreground">User Rating</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <p className={'text-2xl font-bold text-primary'}>500+</p>
                </div>
                <p className="text-xs text-muted-foreground">Configurations</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <p className={'text-2xl font-bold text-primary'}>100%</p>
                </div>
                <p className="text-xs text-muted-foreground">Free Forever</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className={'max-w-3xl mx-auto mb-16'}>
        <h2 className={'text-3xl font-bold text-center mb-12'}>Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When exactly does the launch happen?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Yes! All configurations, agents, MCP servers, and resources are 100% free. We're
                building the best community-driven directory for Claude configurations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className={'text-center max-w-2xl mx-auto'}>
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h2 className={'text-2xl font-bold mb-4'}>Ready to Join Our Community?</h2>
            <p className={'text-muted-foreground mb-6'}>
              Enter your email above to get notified when we launch. Be part of the Product Hunt
              launch day!
            </p>
            <div className={'flex flex-col sm:flex-row gap-4 justify-center'}>
              <Button size="lg" asChild>
                <Link href={ROUTES.HOME}>
                  <Sparkles className={'h-4 w-4 mr-2'} />
                  Explore Configurations
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={ROUTES.HOME}>
                  <Users className={'h-4 w-4 mr-2'} />
                  Join the Community
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Unsubscribe anytime • 100% free, forever
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
