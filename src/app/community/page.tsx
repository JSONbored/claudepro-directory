import dynamic from 'next/dynamic';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';

const NewsletterCTAVariant = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { ROUTES, SOCIAL_LINKS } from '@/src/lib/constants';
import { Github, MessageCircle, MessageSquare, Twitter, Users } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = generatePageMetadata('/community');

/**
 * ISR Configuration: Marketing pages update infrequently
 * revalidate: 86400 = Revalidate every 24 hours
 */
export const revalidate = false;

export default function CommunityPage() {
  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero Section */}
      <section className={'relative overflow-hidden px-4 py-24'}>
        <div className={'container mx-auto text-center'}>
          <div className={'mx-auto max-w-3xl'}>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={'mb-6 border-accent/20 bg-accent/5 text-accent'}
            >
              <Users className="mr-1 h-3 w-3 text-accent" />
              Community
            </UnifiedBadge>

            <h1 className={'mb-6 font-bold text-4xl md:text-6xl'}>Join the Claude Community</h1>

            <p className={UI_CLASSES.TEXT_HEADING_LARGE}>
              Connect with developers and AI enthusiasts building with Claude. Share your
              configurations, learn from the community, and contribute to our open-source directory.
            </p>

            <div className={'flex flex-wrap justify-center gap-4'}>
              <Button size="lg" asChild>
                <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer">
                  <Github className={'mr-2 h-5 w-5'} />
                  GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className={'mr-2 h-5 w-5'} />
                  Discord
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className={'mr-2 h-5 w-5'} />X (Twitter)
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className={'px-4 py-16'}>
        <div className={'container mx-auto'}>
          <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
            <Card>
              <CardHeader>
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <Github className="h-5 w-5 text-primary" />
                  Open Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={'font-bold text-3xl'}>100%</div>
                <p className="text-muted-foreground">Free and open source</p>
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
                <div className={'font-bold text-3xl'}>50+</div>
                <p className="text-muted-foreground">Curated configurations</p>
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
                <div className={'font-bold text-3xl'}>Growing</div>
                <p className="text-muted-foreground">Join us on GitHub</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contributing Section */}
      <section className={'px-4 py-16'}>
        <div className={'container mx-auto'}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How to Contribute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className={'mb-2 font-semibold'}>1. Fork the Repository</h3>
                <p className="text-muted-foreground">
                  Start by forking our GitHub repository and cloning it to your local machine.
                </p>
              </div>
              <div>
                <h3 className={'mb-2 font-semibold'}>2. Add Your Configuration</h3>
                <p className="text-muted-foreground">
                  Create a new JSON file with your Claude configuration in the appropriate content
                  directory.
                </p>
              </div>
              <div>
                <h3 className={'mb-2 font-semibold'}>3. Submit a Pull Request</h3>
                <p className="text-muted-foreground">
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
      <section className={'container mx-auto px-4 py-12'}>
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}
