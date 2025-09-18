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
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PartnerPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge variant="outline" className="mb-6">
          <Handshake className="h-3 w-3 mr-1" />
          Partnership & Advertising
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Grow Your Business With Us</h1>
        <p className="text-xl text-muted-foreground">
          Connect with thousands of Claude AI professionals and showcase your tools, services, and
          opportunities
        </p>
      </div>

      {/* Limited Time Offer Banner */}
      <Card className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">Limited Time Offer</p>
                <p className="text-muted-foreground">
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
      <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto mb-12">
        {/* Job Listings */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
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
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Premium Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    Featured placement in Jobs section
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Users className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Targeted Audience</p>
                  <p className="text-xs text-muted-foreground">
                    Reach Claude developers & AI engineers
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Zap className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">30-Day Listings</p>
                  <p className="text-xs text-muted-foreground">
                    Extended visibility for your positions
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Perfect for companies building with Claude and AI tools
              </p>
              <Button className="w-full" size="lg">
                Post a Job
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sponsored Listings */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
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
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Target className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Top Positions</p>
                  <p className="text-xs text-muted-foreground">Featured in category listings</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Sparkles className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">"Sponsored" Badge</p>
                  <p className="text-xs text-muted-foreground">
                    Stand out with premium designation
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Analytics Dashboard</p>
                  <p className="text-xs text-muted-foreground">Track views and engagement</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Available for all categories: Agents, MCP, Rules, Commands, Hooks
              </p>
              <Button className="w-full" size="lg" variant="default">
                Get Featured
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Value Props Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-lg font-bold text-primary">Featured</p>
            <p className="text-sm text-muted-foreground">Placement</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-lg font-bold text-primary">Targeted</p>
            <p className="text-sm text-muted-foreground">Audience</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-lg font-bold text-primary">Quick</p>
            <p className="text-sm text-muted-foreground">Setup</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-lg font-bold text-primary">Cancel</p>
            <p className="text-sm text-muted-foreground">Anytime</p>
          </CardContent>
        </Card>
      </div>

      {/* Other Partnership Types */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Other Partnership Opportunities</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-lg w-fit mb-3">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Integration Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-3">
                Integrate your tools with Claude configurations
              </CardDescription>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  API access
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Co-marketing
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Custom support
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-lg w-fit mb-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Content Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-3">
                Contribute premium configurations
              </CardDescription>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Featured status
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Priority review
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Attribution
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 bg-primary/10 rounded-lg w-fit mb-3">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Enterprise</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-3">
                Custom solutions for large teams
              </CardDescription>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Private listings
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Bulk postings
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  Custom terms
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center max-w-2xl mx-auto">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">
              Join the first 20 partners and get 50% off for your first 3 months. Let's discuss how
              we can help grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="mailto:partner@claudepro.directory">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Sales
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/submit">
                  Submit Configuration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Custom pricing available • No setup fees • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
