import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { Bot, Check, Code, Download, Rocket, Sparkles, Star, Users, Zap } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/ph-bundle', {
  title: 'Product Hunt Launch - Featured Claude Configurations',
  description:
    'Join our Product Hunt launch and explore 500+ free Claude configurations, MCP servers, agents, and rules. Everything you need to supercharge Claude.',
});

export default function PHBundlePage() {
  return (
    <div className={'container mx-auto px-4 py-12'}>
      {/* Hero Section */}
      <div className={'mx-auto mb-16 max-w-4xl text-center'}>
        <UnifiedBadge variant="base" style="outline" className="mb-6">
          <Rocket className="mr-1 h-3 w-3" />
          Product Hunt Launch - November 4th
        </UnifiedBadge>
        <h1
          className={
            'mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent md:text-6xl'
          }
        >
          Featured Claude Configurations
        </h1>
        <p className={'mb-8 text-muted-foreground text-xl md:text-2xl'}>
          Discover <span className="font-semibold text-primary">500+ free configurations</span> to
          supercharge your Claude workflows
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <UnifiedBadge
            variant="base"
            className="border-green-500/20 bg-green-500/10 text-green-500"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            100% Free
          </UnifiedBadge>
          <UnifiedBadge variant="base" className="border-blue-500/20 bg-blue-500/10 text-blue-500">
            <Users className="mr-1 h-3 w-3" />
            Community-Driven
          </UnifiedBadge>
          <UnifiedBadge
            variant="base"
            className="border-purple-500/20 bg-purple-500/10 text-purple-500"
          >
            <Download className="mr-1 h-3 w-3" />
            Ready to Use
          </UnifiedBadge>
        </div>
      </div>

      {/* Product Hunt CTA */}
      <Card
        className={
          'mx-auto mb-12 max-w-2xl border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5'
        }
      >
        <CardContent className="pt-6">
          <div className="text-center">
            <p className={'mb-2 font-semibold text-muted-foreground text-sm'}>
              Support Us on Product Hunt
            </p>
            <p className={'mb-2 font-bold text-4xl text-primary'}>November 4, 2025</p>
            <p className="text-muted-foreground text-sm">
              Help us reach #1 Product of the Day with your upvote
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Featured Collections */}
      <div className={'mx-auto mb-16 max-w-5xl'}>
        <h2 className={'mb-12 text-center font-bold text-3xl'}>
          What's Available in the Directory
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Claude Agents Collection */}
          <Card className={'border-2 transition-colors hover:border-primary/50'}>
            <CardHeader>
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Bot className="h-6 w-6 text-blue-500" />
                </div>
                <UnifiedBadge variant="base" className="bg-green-500/10 text-green-500">
                  Free
                </UnifiedBadge>
              </div>
              <CardTitle className="text-xl">Claude Agents Collection</CardTitle>
              <CardDescription>
                150+ production-ready Claude agents for specialized tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">API Development Specialist</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">Security Audit Expert</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">Database Optimization Pro</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">Code Review Automation</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">+ 11 more specialized agents</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* MCP Servers Collection */}
          <Card className={'border-2 transition-colors hover:border-primary/50'}>
            <CardHeader>
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Zap className="h-6 w-6 text-purple-500" />
                </div>
                <UnifiedBadge variant="base" className="bg-green-500/10 text-green-500">
                  Free
                </UnifiedBadge>
              </div>
              <CardTitle className="text-xl">MCP Servers Collection</CardTitle>
              <CardDescription>
                50+ production-ready Model Context Protocol integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">GitHub Advanced Integration</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">Database Query Assistant</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">Cloud Services Connector</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">API Testing Suite</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">+ 6 more integrations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Rules & Commands Collection */}
          <Card className={'border-2 transition-colors hover:border-primary/50'}>
            <CardHeader>
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <Code className="h-6 w-6 text-orange-500" />
                </div>
                <UnifiedBadge variant="base" className="bg-green-500/10 text-green-500">
                  Free
                </UnifiedBadge>
              </div>
              <CardTitle className="text-xl">Rules & Commands Library</CardTitle>
              <CardDescription>
                200+ coding standards, best practices, and slash commands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">TypeScript Strict Mode Expert</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">Security Best Practices</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">Performance Optimization Rules</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">API Design Standards</span>
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">+ 16 more rule sets</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Community Features */}
          <Card className={'border-2 border-primary/50 bg-primary/5'}>
            <CardHeader>
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <UnifiedBadge variant="base" className="bg-primary/10 text-primary">
                  Community
                </UnifiedBadge>
              </div>
              <CardTitle className="text-xl">Community Features</CardTitle>
              <CardDescription>Join a thriving community of Claude power users</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <Star className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">Contribute your own configurations</span>
                </li>
                <li className="flex gap-2">
                  <Star className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">Bookmark and organize favorites</span>
                </li>
                <li className="flex gap-2">
                  <Star className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">Request new configurations</span>
                </li>
                <li className="flex gap-2">
                  <Star className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">Rate and review community content</span>
                </li>
                <li className="flex gap-2">
                  <Star className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">Early access to beta features</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Get Started - Free */}
      <div className={'mx-auto mb-16 max-w-3xl'}>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <p className={'mb-2 font-semibold text-muted-foreground text-sm'}>
                Everything is Free, Forever
              </p>
              <div className={'mb-6 flex items-center justify-center gap-4'}>
                <span className={'font-bold text-6xl text-primary'}>$0</span>
              </div>
              <UnifiedBadge
                variant="base"
                className="mb-6 border-green-500/20 bg-green-500/10 text-green-500"
              >
                100% Free • No Credit Card Required
              </UnifiedBadge>
              <p className="mb-8 text-muted-foreground text-sm">
                All configurations • Community-driven • Open access
              </p>

              <div className="mb-6 flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Instant access to 500+ configurations</span>
              </div>
              <div className="mb-6 flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Use in personal and commercial projects</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Contribute and shape the community</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <div className={'mx-auto mb-16 max-w-4xl'}>
        <h2 className={'mb-12 text-center font-bold text-3xl'}>How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div
              className={
                'mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'
              }
            >
              <span className={'font-bold text-2xl text-primary'}>1</span>
            </div>
            <h3 className={'mb-2 font-semibold text-lg'}>Join the Waitlist</h3>
            <p className="text-muted-foreground text-sm">
              Sign up below to get notified when we launch on Product Hunt on November 4th
            </p>
          </div>
          <div className="text-center">
            <div
              className={
                'mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'
              }
            >
              <span className={'font-bold text-2xl text-primary'}>2</span>
            </div>
            <h3 className={'mb-2 font-semibold text-lg'}>Upvote on Product Hunt</h3>
            <p className="text-muted-foreground text-sm">
              Help us reach #1 Product of the Day with your upvote on November 4th
            </p>
          </div>
          <div className="text-center">
            <div
              className={
                'mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'
              }
            >
              <span className={'font-bold text-2xl text-primary'}>3</span>
            </div>
            <h3 className={'mb-2 font-semibold text-lg'}>Explore & Contribute</h3>
            <p className="text-muted-foreground text-sm">
              Browse 500+ free configurations, bookmark favorites, and contribute your own
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className={'mx-auto mb-16 max-w-4xl'}>
        <Card>
          <CardContent className="pt-8">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              <div>
                <p className={'mb-1 font-bold text-3xl text-primary'}>1,000+</p>
                <p className="text-muted-foreground text-sm">Active Users</p>
              </div>
              <div>
                <p className={'mb-1 font-bold text-3xl text-primary'}>500+</p>
                <p className="text-muted-foreground text-sm">Configurations</p>
              </div>
              <div>
                <p className={'mb-1 font-bold text-3xl text-primary'}>50+</p>
                <p className="text-muted-foreground text-sm">MCP Servers</p>
              </div>
              <div>
                <p className={'mb-1 font-bold text-3xl text-primary'}>4.9/5</p>
                <p className="text-muted-foreground text-sm">User Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className={'mx-auto mb-16 max-w-2xl text-center'}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-8 pb-8">
            <Rocket className={'mx-auto mb-4 h-12 w-12 text-primary'} />
            <h2 className={'mb-4 font-bold text-2xl'}>Join Us on Product Hunt Launch Day</h2>
            <p className={'mb-6 text-muted-foreground'}>
              Be part of our community launch on November 4th. Get notified when we go live and help
              us reach #1 Product of the Day with your upvote.
            </p>
            <div className={'flex flex-col gap-4'}>
              <Button size="lg" asChild className="w-full">
                <Link href={ROUTES.PH_WAITLIST}>
                  Join Launch Waitlist
                  <Sparkles className={'ml-2 h-4 w-4'} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full">
                <Link href={ROUTES.HOME}>
                  <Sparkles className={'mr-2 h-4 w-4'} />
                  Explore Free Configurations
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-muted-foreground text-xs">
              100% free • No credit card required • Community-driven
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Capture */}
      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture source="homepage" variant="hero" context="ph-bundle-footer" />
      </section>
    </div>
  );
}
