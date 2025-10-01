import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useId } from 'react';
import { ContentSearchClient } from '@/components/content-search-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getIconByName } from '@/lib/icons';
import type { ContentListServerProps, UnifiedContentItem } from '@/lib/schemas/component.schema';

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
    <section
      className="relative overflow-hidden border-b border-border/50 bg-card/30"
      aria-labelledby={pageTitleId}
    >
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-accent/10 rounded-full" aria-hidden="true">
              {(() => {
                const IconComponent = getIconByName(icon);
                return <IconComponent className="h-8 w-8 text-primary" />;
              })()}
            </div>
          </div>

          <h1 id={pageTitleId} className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
            {title}
          </h1>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{description}</p>

          <ul className="flex flex-wrap justify-center gap-2 mb-8 list-none">
            {displayBadges.map((badge, idx) => (
              <li key={badge.text || `badge-${idx}`}>
                <Badge variant={idx === 0 ? 'secondary' : 'outline'}>
                  {badge.icon &&
                    (() => {
                      if (typeof badge.icon === 'string') {
                        const BadgeIconComponent = getIconByName(badge.icon);
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
              href="/submit"
              className="flex items-center gap-2"
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
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-12 bg-card/50 rounded-lg" />
      <div className="flex gap-2 justify-end">
        <div className="h-10 w-24 bg-card/50 rounded-lg" />
        <div className="h-10 w-20 bg-card/50 rounded-lg" />
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
    <div className="min-h-screen bg-background">
      {/* Hero Section - Rendered immediately on server */}
      <ContentHeroSection
        title={title}
        description={description}
        icon={icon}
        items={items}
        badges={badges}
      />

      <section className="container mx-auto px-4 py-12" aria-label={`${title} content and search`}>
        <div className="space-y-8">
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
        </div>
      </section>
    </div>
  );
}
