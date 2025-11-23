import { formatRelativeDate, type JobType, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import {
  Building,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Star,
} from '@heyclaude/web-runtime/icons';
import type { JobCardProps } from '@heyclaude/web-runtime/types/component.types';
import { BADGE_COLORS, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { HighlightedText } from '@/src/components/core/shared/highlighted-text';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';

/**
 * Validate job link is safe for use in href
 * Only allows absolute HTTPS URLs and whitelisted hostnames
 */
const TRUSTED_JOB_LINK_HOSTNAMES = [
  'jobs.example.com',
  'www.example.com',
  'indeed.com',
  'www.indeed.com',
  'greenhouse.io',
  'www.greenhouse.io',
  // Add other trusted job board/external application hostnames here as needed
] as const;

function getSafeJobLink(link?: string | null): string {
  if (!link || typeof link !== 'string') return '#';
  try {
    // Only allow absolute URLs (must start with https://)
    if (!link.startsWith('https://')) return '#';
    const url = new URL(link);
    // Only allow HTTPS protocol and whitelisted hostnames
    if (
      url.protocol === 'https:' &&
      TRUSTED_JOB_LINK_HOSTNAMES.includes(
        url.hostname as (typeof TRUSTED_JOB_LINK_HOSTNAMES)[number]
      )
    ) {
      // Return normalized URL instead of original input
      return url.href;
    }
  } catch {
    // Invalid URL
  }
  return '#';
}

export function JobCard({ job }: JobCardProps) {
  const pulse = usePulse();
  const isFeatured = job.tier === 'featured';

  // Use pre-highlighted HTML from edge function (unified-search)
  // All highlighting is now done server-side at the edge
  const highlightedTitle = useMemo(() => {
    if (
      'title_highlighted' in job &&
      job.title_highlighted &&
      typeof job.title_highlighted === 'string'
    ) {
      return <HighlightedText html={job.title_highlighted} fallback={job.title} />;
    }
    return job.title;
  }, [job]);

  const highlightedDescription = useMemo(() => {
    if (
      'description_highlighted' in job &&
      job.description_highlighted &&
      typeof job.description_highlighted === 'string' &&
      job.description
    ) {
      return (
        <HighlightedText
          html={job.description_highlighted}
          fallback={job.description}
          className={UI_CLASSES.TEXT_CARD_DESCRIPTION}
        />
      );
    }
    return job.description;
  }, [job]);

  return (
    <Card
      className={`${UI_CLASSES.CARD_GRADIENT_HOVER} relative ${
        isFeatured
          ? `${UI_CLASSES.JOB_FEATURED_BORDER} ${UI_CLASSES.JOB_FEATURED_GRADIENT} ${UI_CLASSES.JOB_FEATURED_GLOW}`
          : ''
      }`}
    >
      {isFeatured && (
        <div className="-top-2 -right-2 absolute z-10">
          <UnifiedBadge variant="base" style="default" className={UI_CLASSES.JOB_FEATURED_BADGE}>
            <Star className={UI_CLASSES.ICON_XS_LEADING} />
            Featured
          </UnifiedBadge>
        </div>
      )}

      <CardHeader className={UI_CLASSES.CARD_HEADER_DEFAULT}>
        <div className={'flex items-start justify-between'}>
          <div className="flex-1">
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} mb-2`}>
              {job.company_logo && (
                <Image
                  src={job.company_logo}
                  alt={`${job.company} logo`}
                  width={48}
                  height={48}
                  className={'rounded-lg object-cover'}
                  loading="lazy"
                />
              )}
              <div>
                <CardTitle
                  className={`${UI_CLASSES.TEXT_CARD_TITLE} text-xl transition-colors-smooth group-hover:text-accent`}
                >
                  <Link href={`/jobs/${job.slug}`}>{highlightedTitle}</Link>
                </CardTitle>
                <div
                  className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_METADATA}`}
                >
                  <Building className={UI_CLASSES.ICON_SM} />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>

            <div className={`${UI_CLASSES.FLEX_WRAP_GAP_3} text-muted-foreground text-sm`}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <MapPin className={UI_CLASSES.ICON_SM} />
                {job.location}
              </div>
              {job.posted_at && (
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Clock className={UI_CLASSES.ICON_SM} />
                  {formatRelativeDate(job.posted_at)}
                </div>
              )}
              {job.salary && (
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <DollarSign className={UI_CLASSES.ICON_SM} />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          <div className={`flex flex-col items-end ${UI_CLASSES.SPACE_COMPACT}`}>
            {job.type && (
              <UnifiedBadge
                variant="base"
                style="default"
                className={
                  BADGE_COLORS.jobType[job.type as JobType] || 'bg-muted text-muted-foreground'
                }
              >
                {job.type.replace('-', ' ')}
              </UnifiedBadge>
            )}
            {job.remote && (
              <UnifiedBadge variant="base" style="secondary">
                Remote
              </UnifiedBadge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={UI_CLASSES.CARD_CONTENT_DEFAULT}>
        <p className={`${UI_CLASSES.MARGIN_DEFAULT} line-clamp-2`}>{highlightedDescription}</p>

        <div className={UI_CLASSES.MARGIN_DEFAULT}>
          <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
            {(job.tags || []).slice(0, 4).map((tag: string) => (
              <UnifiedBadge
                key={tag}
                variant="base"
                style="outline"
                className={UI_CLASSES.TEXT_BADGE}
              >
                {tag}
              </UnifiedBadge>
            ))}
            {Array.isArray(job.tags) && job.tags.length > 4 && (
              <UnifiedBadge variant="base" style="outline" className={UI_CLASSES.TEXT_BADGE}>
                +{job.tags.length - 4} more
              </UnifiedBadge>
            )}
          </div>
        </div>

        <div className={`flex ${UI_CLASSES.SPACE_DEFAULT}`}>
          <Button
            asChild={true}
            className="flex-1"
            onClick={() => {
              pulse
                .click({
                  category: 'jobs',
                  slug: job.slug,
                  metadata: {
                    action: 'apply_now',
                    target_url: job.link,
                    external_link: true,
                  },
                })
                .catch((error) => {
                  logUnhandledPromise('JobCard: apply now click pulse failed', error, {
                    slug: job.slug,
                  });
                });
            }}
          >
            {(() => {
              const safeJobLink = getSafeJobLink(job.link);
              // Explicit validation: getSafeJobLink guarantees the URL is safe
              // It validates protocol (HTTPS only), hostname (whitelisted job board domains only),
              // and returns '#' for any invalid URLs. At this point, safeJobLink is validated
              const validatedUrl: string = safeJobLink;
              return (
                <a href={validatedUrl} target="_blank" rel="noopener noreferrer">
                  Apply Now
                  <ExternalLink className={`ml-2 ${UI_CLASSES.ICON_SM}`} />
                </a>
              );
            })()}
          </Button>
          <Button
            variant="outline"
            asChild={true}
            onClick={() => {
              pulse
                .click({
                  category: 'jobs',
                  slug: job.slug,
                  metadata: {
                    action: 'view_details',
                  },
                })
                .catch((error) => {
                  logUnhandledPromise('JobCard: view details click pulse failed', error, {
                    slug: job.slug,
                  });
                });
            }}
          >
            <Link href={`/jobs/${job.slug}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
