import Link from 'next/link';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { Github, MessageCircle, MessageSquare, Twitter, Users } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = generatePageMetadata('/community');

// Enable ISR - revalidate every 24 hours for community page

export default function CommunityPage() {
  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Hero Section */}
      <section className={`relative py-24 ${UI_CLASSES.PX_4} overflow-hidden`}>
        <div className={`container ${UI_CLASSES.MX_AUTO} text-center`}>
          <div className={`${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}>
            <Badge
              variant="outline"
              className={`${UI_CLASSES.MB_6} border-accent/20 bg-accent/5 text-accent`}
            >
              <Users className="h-3 w-3 mr-1 text-accent" />
              Community
            </Badge>

            <h1 className={`text-4xl md:text-6xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_6}`}>
              Join the Claude Community
            </h1>

            <p className={UI_CLASSES.TEXT_HEADING_LARGE}>
              Connect with developers and AI enthusiasts building with Claude. Share your
              configurations, learn from the community, and contribute to our open-source directory.
            </p>

            <div className={`flex flex-wrap gap-4 ${UI_CLASSES.JUSTIFY_CENTER}`}>
              <Button size="lg" asChild>
                <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer">
                  <Github className={`h-5 w-5 ${UI_CLASSES.MR_2}`} />
                  GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className={`h-5 w-5 ${UI_CLASSES.MR_2}`} />
                  Discord
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className={`h-5 w-5 ${UI_CLASSES.MR_2}`} />X (Twitter)
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className={`${UI_CLASSES.PX_4} py-16`}>
        <div className={`container ${UI_CLASSES.MX_AUTO}`}>
          <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
            <Card>
              <CardHeader>
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <Github className="h-5 w-5 text-primary" />
                  Open Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl ${UI_CLASSES.FONT_BOLD}`}>100%</div>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Free and open source</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Configurations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl ${UI_CLASSES.FONT_BOLD}`}>50+</div>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Curated configurations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <Users className="h-5 w-5 text-primary" />
                  Community Driven
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl ${UI_CLASSES.FONT_BOLD}`}>Growing</div>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Join us on GitHub</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contributing Section */}
      <section className={`${UI_CLASSES.PX_4} py-16`}>
        <div className={`container ${UI_CLASSES.MX_AUTO}`}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How to Contribute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2}`}>
                  1. Fork the Repository
                </h3>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Start by forking our GitHub repository and cloning it to your local machine.
                </p>
              </div>
              <div>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2}`}>
                  2. Add Your Configuration
                </h3>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Create a new JSON file with your Claude configuration in the appropriate content
                  directory.
                </p>
              </div>
              <div>
                <h3 className={`${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2}`}>
                  3. Submit a Pull Request
                </h3>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Submit a pull request with your contribution. Our team will review it promptly.
                </p>
              </div>
              <div className="pt-4">
                <Button asChild>
                  <Link href={ROUTES.SUBMIT}>Submit Your Configuration</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        <InlineEmailCTA
          variant="hero"
          context="community-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
