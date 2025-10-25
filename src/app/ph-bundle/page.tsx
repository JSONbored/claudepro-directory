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
      <div className={'max-w-4xl mx-auto text-center mb-16'}>
        <UnifiedBadge variant="base" style="outline" className="mb-6">
          <Rocket className="h-3 w-3 mr-1" />
          Product Hunt Launch - November 4th
        </UnifiedBadge>
        <h1
          className={
            'text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'
          }
        >
          Featured Claude Configurations
        </h1>
        <p className={'text-xl md:text-2xl text-muted-foreground mb-8'}>
          Discover <span className="text-primary font-semibold">500+ free configurations</span> to
          supercharge your Claude workflows
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <UnifiedBadge
            variant="base"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            100% Free
          </UnifiedBadge>
          <UnifiedBadge variant="base" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Users className="h-3 w-3 mr-1" />
            Community-Driven
          </UnifiedBadge>
          <UnifiedBadge
            variant="base"
            className="bg-purple-500/10 text-purple-500 border-purple-500/20"
          >
            <Download className="h-3 w-3 mr-1" />
            Ready to Use
          </UnifiedBadge>
        </div>
      </div>

      {/* Product Hunt CTA */}
      <Card
        className={
          'max-w-2xl mx-auto mb-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20'
        }
      >
        <CardContent className="pt-6">
          <div className="text-center">
            <p className={'text-sm font-semibold text-muted-foreground mb-2'}>
              Support Us on Product Hunt
            </p>
            <p className={'text-4xl font-bold text-primary mb-2'}>November 4, 2025</p>
            <p className="text-sm text-muted-foreground">
              Help us reach #1 Product of the Day with your upvote
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Featured Collections */}
      <div className={'max-w-5xl mx-auto mb-16'}>
        <h2 className={'text-3xl font-bold text-center mb-12'}>
          What's Available in the Directory
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Claude Agents Collection */}
          <Card className={'border-2 hover:border-primary/50 transition-colors'}>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
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
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">API Development Specialist</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Security Audit Expert</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Database Optimization Pro</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Code Review Automation</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">+ 11 more specialized agents</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* MCP Servers Collection */}
          <Card className={'border-2 hover:border-primary/50 transition-colors'}>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
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
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">GitHub Advanced Integration</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Database Query Assistant</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Cloud Services Connector</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">API Testing Suite</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">+ 6 more integrations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Rules & Commands Collection */}
          <Card className={'border-2 hover:border-primary/50 transition-colors'}>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
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
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">TypeScript Strict Mode Expert</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Security Best Practices</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">Performance Optimization Rules</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">API Design Standards</span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">+ 16 more rule sets</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Community Features */}
          <Card className={'border-2 border-primary/50 bg-primary/5'}>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
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
                  <Star className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-sm">Contribute your own configurations</span>
                </li>
                <li className="flex gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-sm">Bookmark and organize favorites</span>
                </li>
                <li className="flex gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-sm">Request new configurations</span>
                </li>
                <li className="flex gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-sm">Rate and review community content</span>
                </li>
                <li className="flex gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5" />
                  <span className="text-sm">Early access to beta features</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Get Started - Free */}
      <div className={'max-w-3xl mx-auto mb-16'}>
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <p className={'text-sm font-semibold text-muted-foreground mb-2'}>
                Everything is Free, Forever
              </p>
              <div className={'flex items-center justify-center gap-4 mb-6'}>
                <span className={'text-6xl font-bold text-primary'}>$0</span>
              </div>
              <UnifiedBadge
                variant="base"
                className="bg-green-500/10 text-green-500 border-green-500/20 mb-6"
              >
                100% Free • No Credit Card Required
              </UnifiedBadge>
              <p className="text-sm text-muted-foreground mb-8">
                All configurations • Community-driven • Open access
              </p>

              <div className="flex items-center justify-center gap-3 mb-6">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Instant access to 500+ configurations</span>
              </div>
              <div className="flex items-center justify-center gap-3 mb-6">
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
      <div className={'max-w-4xl mx-auto mb-16'}>
        <h2 className={'text-3xl font-bold text-center mb-12'}>How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div
              className={
                'inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4'
              }
            >
              <span className={'text-2xl font-bold text-primary'}>1</span>
            </div>
            <h3 className={'text-lg font-semibold mb-2'}>Join the Waitlist</h3>
            <p className="text-sm text-muted-foreground">
              Sign up below to get notified when we launch on Product Hunt on November 4th
            </p>
          </div>
          <div className="text-center">
            <div
              className={
                'inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4'
              }
            >
              <span className={'text-2xl font-bold text-primary'}>2</span>
            </div>
            <h3 className={'text-lg font-semibold mb-2'}>Upvote on Product Hunt</h3>
            <p className="text-sm text-muted-foreground">
              Help us reach #1 Product of the Day with your upvote on November 4th
            </p>
          </div>
          <div className="text-center">
            <div
              className={
                'inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4'
              }
            >
              <span className={'text-2xl font-bold text-primary'}>3</span>
            </div>
            <h3 className={'text-lg font-semibold mb-2'}>Explore & Contribute</h3>
            <p className="text-sm text-muted-foreground">
              Browse 500+ free configurations, bookmark favorites, and contribute your own
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className={'max-w-4xl mx-auto mb-16'}>
        <Card>
          <CardContent className="pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className={'text-3xl font-bold text-primary mb-1'}>1,000+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div>
                <p className={'text-3xl font-bold text-primary mb-1'}>500+</p>
                <p className="text-sm text-muted-foreground">Configurations</p>
              </div>
              <div>
                <p className={'text-3xl font-bold text-primary mb-1'}>50+</p>
                <p className="text-sm text-muted-foreground">MCP Servers</p>
              </div>
              <div>
                <p className={'text-3xl font-bold text-primary mb-1'}>4.9/5</p>
                <p className="text-sm text-muted-foreground">User Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className={'text-center max-w-2xl mx-auto mb-16'}>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <Rocket className={'h-12 w-12 text-primary mx-auto mb-4'} />
            <h2 className={'text-2xl font-bold mb-4'}>Join Us on Product Hunt Launch Day</h2>
            <p className={'text-muted-foreground mb-6'}>
              Be part of our community launch on November 4th. Get notified when we go live and help
              us reach #1 Product of the Day with your upvote.
            </p>
            <div className={'flex flex-col gap-4'}>
              <Button size="lg" asChild className="w-full">
                <Link href={ROUTES.PH_WAITLIST}>
                  Join Launch Waitlist
                  <Sparkles className={'h-4 w-4 ml-2'} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full">
                <Link href={ROUTES.HOME}>
                  <Sparkles className={'h-4 w-4 mr-2'} />
                  Explore Free Configurations
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
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
