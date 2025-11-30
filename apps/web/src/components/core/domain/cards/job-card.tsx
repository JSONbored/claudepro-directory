'use client';

import { formatRelativeDate, type JobType, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { cluster, stack, iconSize, iconLeading, cardHeader, cardBody, badge, marginBottom, jobTypeBadge } from '@heyclaude/web-runtime/design-system';
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
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { HighlightedText } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

/**
 * Validate and sanitize job application link.
 * Enforces HTTPS protocol and removes credentials.
 * Returns '#' for any invalid URLs.
 */
function getSafeJobLink(link?: string | null): string {
  if (!link || typeof link !== 'string') return '#';
  try {
    const url = new URL(link.trim());
    if (url.protocol !== 'https:') {
      return '#';
    }

    url.username = '';
    url.password = '';
    url.hostname = url.hostname.replace(/\.$/, '').toLowerCase();
    if (url.port === '443') {
      url.port = '';
    }

    return url.href;
  } catch {
    return '#';
  }
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
          className="text-sm text-muted-foreground"
        />
      );
    }
    return job.description;
  }, [job]);

  return (
    <Card
      className={`group relative transition-all hover:shadow-lg hover:border-accent/20 ${
        isFeatured
          ? 'border-amber-400/50 bg-gradient-to-br from-amber-50/10 to-transparent shadow-amber-500/5'
          : ''
      }`}
    >
      {isFeatured && (
        <div className="-top-2 -right-2 absolute z-10">
          <UnifiedBadge variant="base" style="default" className="bg-amber-500 text-white shadow-lg">
            <Star className={iconLeading.xs} />
            Featured
          </UnifiedBadge>
        </div>
      )}

      <CardHeader className={cardHeader.default}>
        <div className={'flex items-start justify-between'}>
          <div className="flex-1">
            <div className={`${cluster.default} mb-2`}>
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
                  className="font-semibold text-xl transition-colors-smooth group-hover:text-accent"
                >
                  <Link href={`/jobs/${job.slug}`}>{highlightedTitle}</Link>
                </CardTitle>
                <div
                  className={`${cluster.compact} text-xs text-muted-foreground`}
                >
                  <Building className={iconSize.sm} />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-muted-foreground text-sm">
              <div className={cluster.tight}>
                <MapPin className={iconSize.sm} />
                {job.location}
              </div>
              {job.posted_at && (
                <div className={cluster.tight}>
                  <Clock className={iconSize.sm} />
                  {formatRelativeDate(job.posted_at)}
                </div>
              )}
              {job.salary && (
                <div className={cluster.tight}>
                  <DollarSign className={iconSize.sm} />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          <div className={`flex flex-col items-end ${stack.compact}`}>
            {job.type && (
              <UnifiedBadge
                variant="base"
                style="default"
                className={
                  jobTypeBadge[job.type as JobType] || 'bg-muted text-muted-foreground'
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

      <CardContent className={cardBody.default}>
        <p className={`${marginBottom.comfortable} line-clamp-2`}>{highlightedDescription}</p>

        <div className={marginBottom.comfortable}>
          <div className="flex flex-wrap gap-2">
            {(job.tags || []).slice(0, 4).map((tag: string) => (
              <UnifiedBadge
                key={tag}
                variant="base"
                style="outline"
                className={badge.default}
              >
                {tag}
              </UnifiedBadge>
            ))}
            {Array.isArray(job.tags) && job.tags.length > 4 && (
              <UnifiedBadge variant="base" style="outline" className={badge.default}>
                +{job.tags.length - 4} more
              </UnifiedBadge>
            )}
          </div>
        </div>

        <div className={`flex ${stack.comfortable}`}>
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
              // getSafeJobLink guarantees the URL uses HTTPS protocol,
              // removes credentials, and returns '#' for invalid URLs
              const validatedUrl: string = safeJobLink;
              return (
                <a href={validatedUrl} target="_blank" rel="noopener noreferrer">
                  Apply Now
                  <ExternalLink className={`ml-2 ${iconSize.sm}`} />
                </a>
              );
            })()}
          </Button>
          <Button
            variant="outline"
            asChild={true}
          >
            <Link 
              href={`/jobs/${job.slug}`}
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
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
