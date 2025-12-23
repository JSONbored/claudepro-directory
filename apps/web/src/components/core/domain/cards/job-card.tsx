'use client';

import { logUnhandledPromise } from '@heyclaude/web-runtime/errors';
import { formatRelativeDate } from '@heyclaude/web-runtime/data/utils';
import { usePulse } from '@heyclaude/web-runtime/hooks/use-pulse';
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
          className="text-muted-foreground text-sm"
        />
      );
    }
    return job.description;
  }, [job]);

  return (
    <Card
      className={cn(
        'card-gradient transition-smooth group relative',
        isFeatured &&
          'border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg shadow-primary/10'
      )}
    >
      {isFeatured ? (
        <div className="absolute -top-2 -right-2 z-10">
          <UnifiedBadge
            variant="base"
            style="default"
            className="border-primary bg-primary text-primary-foreground"
          >
            <Star className="mr-1 h-3 w-3" />
            Featured
          </UnifiedBadge>
        </div>
      ) : null}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
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
                <CardTitle className="transition-colors-smooth group-hover:text-accent text-lg text-xl font-semibold">
                  <Link href={`/jobs/${job.slug}`}>{highlightedTitle}</Link>
                </CardTitle>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              {job.posted_at ? (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatRelativeDate(job.posted_at)}
                </div>
              ) : null}
              {job.salary ? (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {job.type ? (
              <UnifiedBadge
                variant="base"
                style="default"
                className={
                  job.type === 'full-time'
                    ? 'bg-color-badge-jobtype-fulltime-bg text-color-badge-jobtype-fulltime-text border-color-badge-jobtype-fulltime-border'
                    : job.type === 'part-time'
                      ? 'bg-color-badge-jobtype-parttime-bg text-color-badge-jobtype-parttime-text border-color-badge-jobtype-parttime-border'
                      : job.type === 'contract'
                        ? 'bg-color-badge-jobtype-contract-bg text-color-badge-jobtype-contract-text border-color-badge-jobtype-contract-border'
                        : job.type === 'freelance'
                          ? 'bg-color-badge-jobtype-freelance-bg text-color-badge-jobtype-freelance-text border-color-badge-jobtype-freelance-border'
                          : job.type === 'internship'
                            ? 'bg-color-badge-jobtype-internship-bg text-color-badge-jobtype-internship-text border-color-badge-jobtype-internship-border'
                            : job.type === 'remote'
                              ? 'bg-color-badge-jobtype-remote-bg text-color-badge-jobtype-remote-text border-color-badge-jobtype-remote-border'
                              : 'bg-muted text-muted-foreground'
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

      <CardContent className="pt-4">
        <p className="mb-4 line-clamp-2">{highlightedDescription}</p>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {(job.tags || []).slice(0, 4).map((tag: string) => (
              <UnifiedBadge
                key={tag}
                variant="base"
                style="outline"
                className="text-xs font-semibold"
              >
                {tag}
              </UnifiedBadge>
            ))}
            {Array.isArray(job.tags) && job.tags.length > 4 && (
              <UnifiedBadge
                variant="base"
                style="outline"
                className="text-foreground text-xs font-semibold"
              >
                +{job.tags.length - 4} more
              </UnifiedBadge>
            )}
          </div>
        </div>

        <div className="flex gap-3">
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
                  <ExternalLink className={cn('ml-2', 'h-4 w-4')} />
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
