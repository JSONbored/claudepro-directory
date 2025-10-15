import Link from 'next/link';
import { Suspense, useId } from 'react';
import { ContentSearchClient } from '@/src/components/content-search-client';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { ROUTES } from '@/src/lib/constants';
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
      <div className={`container ${UI_CLASSES.MX_AUTO} px-4 py-20`}>
        <div className={`text-center ${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}>
          <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.JUSTIFY_CENTER} mb-6`}>
            <div
              className={`p-3 ${UI_CLASSES.BG_ACCENT_10} ${UI_CLASSES.ROUNDED_FULL}`}
              aria-hidden="true"
            >
              {(() => {
                const IconComponent = ICON_NAME_MAP[icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                return <IconComponent className="h-8 w-8 text-primary" />;
              })()}
            </div>
          </div>

          <h1 id={pageTitleId} className={UI_CLASSES.TEXT_HEADING_HERO}>
            {title}
          </h1>

          <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>{description}</p>

          <ul
            className={`${UI_CLASSES.FLEX} flex-wrap ${UI_CLASSES.JUSTIFY_CENTER} gap-2 mb-8 list-none`}
          >
            {displayBadges.map((badge, idx) => (
              <li key={badge.text || `badge-${idx}`}>
                <Badge variant={idx === 0 ? 'secondary' : 'outline'}>
                  {badge.icon &&
                    (() => {
                      if (typeof badge.icon === 'string') {
                        const BadgeIconComponent = ICON_NAME_MAP[badge.icon as keyof typeof ICON_NAME_MAP] || HelpCircle;
                        return <BadgeIconComponent className="h-3 w-3 mr-1" aria-hidden="true" />;
                      }
                      const BadgeIcon = badge.icon;
                      return <BadgeIcon className="h-3 w-3 mr-1" aria-hidden="true" />;
                    })()}
                  {badge.text}
                </Badge>
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
    <div className={`${UI_CLASSES.W_FULL} space-y-4 animate-pulse`}>
      <div className={`h-12 ${UI_CLASSES.BG_CARD_50} ${UI_CLASSES.ROUNDED_LG}`} />
      <div className={`${UI_CLASSES.FLEX} gap-2 ${UI_CLASSES.JUSTIFY_END}`}>
        <div className={`h-10 w-24 ${UI_CLASSES.BG_CARD_50} ${UI_CLASSES.ROUNDED_LG}`} />
        <div className={`h-10 w-20 ${UI_CLASSES.BG_CARD_50} ${UI_CLASSES.ROUNDED_LG}`} />
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
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Hero Section - Rendered immediately on server */}
      <ContentHeroSection
        title={title}
        description={description}
        icon={icon}
        items={items}
        badges={badges}
      />

      <section
        className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}
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

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        <InlineEmailCTA
          variant="hero"
          context="category-page"
          category={type}
          headline={'Join 1,000+ Claude Power Users'}
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
