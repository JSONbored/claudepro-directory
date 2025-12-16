'use client';

import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { formatRelativeDate } from '@heyclaude/web-runtime/data/utils';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import {
  Building,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Star,
} from '@heyclaude/web-runtime/icons';
import { type JobCardProps } from '@heyclaude/web-runtime/types/component.types';
import {
  UnifiedBadge,
  HighlightedText,
  Button,
  Card,
  cn,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { size, muted, weight, paddingBottom, cluster, iconSize, wrap, gap, marginRight, spaceY, marginBottom, paddingTop, marginLeft } from '@heyclaude/web-runtime/design-system';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

/**
 * Produce a sanitized, safe href for a job link or a fallback when the input is missing or invalid.
 *
 * Removes credentials, trims trailing dots from hostnames, lowercases the hostname, and omits default HTTPS port 443; only HTTPS URLs are accepted.
 *
 * @param link - The raw job URL (may be null or undefined) sourced from external data
 * @returns The normalized `href` for a valid HTTPS URL, or `'#'` when the input is absent, invalid, or not HTTPS
 *
 * @see JobCard
 */
function getSafeJobLink(link?: null | string): string {
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

/**
 * Renders a job listing card with metadata, badges, tags, description, and action buttons.
 *
 * Displays company logo, highlighted title and description when available, location, posted date,
 * salary, job type and remote badges, up to four tags (with a "+N more" indicator), and two actions:
 * "Apply Now" (opens the job link in a new tab) and "View Details" (navigates to the job details page).
 *
 * The component records click telemetry for the action buttons.
 *
 * @param job - The job data used to populate the card (title, company, logo, location, posted_at, salary, type, remote, tags, link, slug, tier, and optional highlighted fields).
 * @returns The rendered JSX element for the job card.
 *
 * @see getSafeJobLink - used to produce a validated external URL for the "Apply Now" action.
 * @see formatRelativeDate - used to render relative posted dates.
 * @see HighlightedText - used to render pre-highlighted title/description HTML.
 * @see UnifiedBadge - used for job type, remote, tag, and featured badges.
 */
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
          className={`${size.sm} ${muted.default}`}
        />
      );
    }
    return job.description;
  }, [job]);

  return (
    <Card
      className={`card-gradient transition-smooth group relative ${
        isFeatured
          ? `border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/5 to-orange-600/10 shadow-lg shadow-orange-500/10`
          : ''
      }`}
    >
      {isFeatured ? (
        <div className="absolute -top-2 -right-2 z-10">
          <UnifiedBadge variant="base" style="default" className="bg-orange-500 text-white border-orange-500">
            <Star className={`${iconSize.xs} ${marginRight.tight}`} />
            Featured
          </UnifiedBadge>
        </div>
      ) : null}

      <CardHeader className={paddingBottom.default}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={`${cluster.default} ${marginBottom.compact}`}>
              {job.company_logo ? (
                <Image
                  src={job.company_logo}
                  alt={`${job.company} logo`}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                  loading="lazy"
                />
              ) : null}
              <div>
                <CardTitle
                  className={`${size.lg} ${weight.semibold} transition-colors-smooth group-hover:text-accent text-xl`}
                >
                  <Link href={`/jobs/${job.slug}`}>{highlightedTitle}</Link>
                </CardTitle>
                <div
                  className={`${cluster.compact} ${size.xs} ${muted.default}`}
                >
                  <Building className={iconSize.sm} />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>

            <div className={`${wrap} ${gap.default} text-muted-foreground text-sm`}>
              <div className={cluster.tight}>
                <MapPin className={iconSize.sm} />
                {job.location}
              </div>
              {job.posted_at ? (
                <div className={cluster.tight}>
                  <Clock className={iconSize.sm} />
                  {formatRelativeDate(job.posted_at)}
                </div>
              ) : null}
              {job.salary ? (
                <div className={cluster.tight}>
                  <DollarSign className={iconSize.sm} />
                  {job.salary}
                </div>
              ) : null}
            </div>
          </div>

          <div className={`flex flex-col items-end ${spaceY.tight}`}>
            {job.type ? (
              <UnifiedBadge
                variant="base"
                style="default"
                className={
                  job.type === 'full-time' ? 'bg-color-badge-jobtype-fulltime-bg text-color-badge-jobtype-fulltime-text border-color-badge-jobtype-fulltime-border' :
                  job.type === 'part-time' ? 'bg-color-badge-jobtype-parttime-bg text-color-badge-jobtype-parttime-text border-color-badge-jobtype-parttime-border' :
                  job.type === 'contract' ? 'bg-color-badge-jobtype-contract-bg text-color-badge-jobtype-contract-text border-color-badge-jobtype-contract-border' :
                  job.type === 'freelance' ? 'bg-color-badge-jobtype-freelance-bg text-color-badge-jobtype-freelance-text border-color-badge-jobtype-freelance-border' :
                  job.type === 'internship' ? 'bg-color-badge-jobtype-internship-bg text-color-badge-jobtype-internship-text border-color-badge-jobtype-internship-border' :
                  job.type === 'remote' ? 'bg-color-badge-jobtype-remote-bg text-color-badge-jobtype-remote-text border-color-badge-jobtype-remote-border' :
                  'bg-muted text-muted-foreground'
                }
              >
                {job.type.replace('-', ' ')}
              </UnifiedBadge>
            ) : null}
            {job.remote ? (
              <UnifiedBadge variant="base" style="secondary">
                Remote
              </UnifiedBadge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${paddingTop.default}`}>
        <p className={`${marginBottom.default} line-clamp-2`}>{highlightedDescription}</p>

        <div className={marginBottom.default}>
          <div className={`${wrap} ${gap.compact}`}>
            {(job.tags || []).slice(0, 4).map((tag: string) => (
              <UnifiedBadge
                key={tag}
                variant="base"
                style="outline"
                className={`${size.xs} ${weight.semibold}`}
              >
                {tag}
              </UnifiedBadge>
            ))}
            {Array.isArray(job.tags) && job.tags.length > 4 && (
              <UnifiedBadge variant="base" style="outline" className={`${size.xs} ${weight.semibold} text-foreground`}>
                +{job.tags.length - 4} more
              </UnifiedBadge>
            )}
          </div>
        </div>

        <div className={`flex ${gap.default}`}>
          <Button
            asChild
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
              // Explicit validation: getSafeJobLink normalizes the URL and enforces HTTPS-only links.
              // It strips credentials, normalizes the hostname, removes default port 443,
              // and returns '#' for any invalid or non-HTTPS URLs. At this point, safeJobLink is sanitized.
              const validatedUrl: string = safeJobLink;
              return (
                <a href={validatedUrl} target="_blank" rel="noopener noreferrer">
                  Apply Now
                  <ExternalLink className={cn(marginLeft.compact, iconSize.sm)} />
                </a>
              );
            })()}
          </Button>
          <Button variant="outline" asChild>
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