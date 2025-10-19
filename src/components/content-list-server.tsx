import Link from 'next/link';
import { Suspense, useId } from 'react';
import { ContentSearchClient } from '@/src/components/content-search-client';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { LazySection } from '@/src/components/infra/lazy-section';
import { Button } from '@/src/components/primitives/button';
import { ROUTES } from '@/src/lib/constants/routes';
import { ExternalLink, HelpCircle } from '@/src/lib/icons';
import type {
  ContentListServerProps,
  UnifiedContentItem,
} from '@/src/lib/schemas/component.schema';
import { ICON_NAME_MAP, UI_CLASSES } from '@/src/lib/ui-constants';

function ContentHeroSection<T extends UnifiedContentItem>({
  title,
  description,
  icon,
  items,
  badges = [],
}: Pick<ContentListServerProps<T>, 'title' | 'description' | 'icon' | 'items' | 'badges'>) {
  const pageTitleId = useId();
  const displayBadges =
    badges.length > 0
      ? badges
      : [
          { icon: 'sparkles', text: `${items.length} ${title} Available` },
          { text: 'Community Driven' },
          { text: 'Production Ready' },
        ];

  return (
    <section className={UI_CLASSES.CONTAINER_OVERFLOW_BORDER} aria-labelledby={pageTitleId}>
      <div className={'container mx-auto px-4 py-20'}>
        <div className={'text-center max-w-3xl mx-auto'}>
          <div className={'flex justify-center mb-6'}>
            <div className={'p-3 bg-accent/10 rounded-full'} aria-hidden="true">
              {(() => {
                const IconComponent =
                  ICON_NAME_MAP[icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                return <IconComponent className="h-8 w-8 text-primary" />;
              })()}
            </div>
          </div>

          <h1 id={pageTitleId} className={UI_CLASSES.TEXT_HEADING_HERO}>
            {title}
          </h1>

          <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>{description}</p>

          <ul className={'flex flex-wrap justify-center gap-2 mb-8 list-none'}>
            {displayBadges.map((badge, idx) => (
              <li key={badge.text || `badge-${idx}`}>
                <UnifiedBadge variant="base" style={idx === 0 ? 'secondary' : 'outline'}>
                  {badge.icon &&
                    (() => {
                      if (typeof badge.icon === 'string') {
                        const BadgeIconComponent =
                          ICON_NAME_MAP[badge.icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                        return <BadgeIconComponent className="h-3 w-3 mr-1" aria-hidden="true" />;
                      }
                      const BadgeIcon = badge.icon;
                      return <BadgeIcon className="h-3 w-3 mr-1" aria-hidden="true" />;
                    })()}
                  {badge.text}
                </UnifiedBadge>
              </li>
            ))}
          </ul>

          <Button variant="outline" size="sm" asChild>
            <Link
              href={ROUTES.SUBMIT}
              className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
              aria-label={`Submit a new ${title.slice(0, -1).toLowerCase()}`}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              Submit {title.slice(0, -1)}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ContentSearchSkeleton() {
  return (
    <div className={'w-full space-y-4 animate-pulse'}>
      <div className={'h-12 bg-card/50 rounded-lg'} />
      <div className={'flex gap-2 justify-end'}>
        <div className={'h-10 w-24 bg-card/50 rounded-lg'} />
        <div className={'h-10 w-20 bg-card/50 rounded-lg'} />
      </div>
    </div>
  );
}

export function ContentListServer<T extends UnifiedContentItem>({
  title,
  description,
  icon,
  items,
  type,
  searchPlaceholder = `Search ${title.toLowerCase()}...`,
  badges = [],
}: ContentListServerProps<T>) {
  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero Section - Rendered immediately on server */}
      <ContentHeroSection
        title={title}
        description={description}
        icon={icon}
        items={items}
        badges={badges}
      />

      <section
        className={'container mx-auto px-4 py-12'}
        aria-label={`${title} content and search`}
      >
        {/* Search Component with Suspense boundary */}
        <Suspense fallback={<ContentSearchSkeleton />}>
          <ContentSearchClient
            items={items}
            type={type}
            searchPlaceholder={searchPlaceholder}
            title={title}
            icon={icon}
          />
        </Suspense>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) with fade-in animation */}
      <section className={'container mx-auto px-4 py-12'}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <UnifiedNewsletterCapture
              source="content_page"
              variant="hero"
              context="category-page"
              category={type}
              headline={'Join 1,000+ Claude Power Users'}
              description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
