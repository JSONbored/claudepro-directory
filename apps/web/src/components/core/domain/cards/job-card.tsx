'use client';

import { formatRelativeDate, type JobType, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { cluster, stack, iconSize, iconLeading, cardHeader, cardBody, badge, marginBottom, jobTypeBadge, muted, weight, size, gap, transition, zLayer, shadow, shadowColor,   radius, flexWrap,
  flexGrow,
  bgGradient,
  flexDir,
  gradientFrom,
  gradientTo,
  justify,
  textColor,
  alignItems,
  display,
  position,
  bgColor,
  truncate,
  marginLeft,
  borderColor,
  objectFit,
} from '@heyclaude/web-runtime/design-system';
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
 * Return a sanitized HTTPS job application URL or a fallback '#'.
 *
 * Normalizes and validates the provided link: enforces the `https` protocol,
 * strips username/password credentials, lowercases and trims a trailing dot
 * from the hostname, and removes the default `443` port. If the input is
 * missing, not a string, invalid, or not `https`, returns `'#'`.
 *
 * @param link - The candidate URL to validate and sanitize; may be `null` or `undefined`.
 * @returns The sanitized HTTPS URL string, or `'#'` if the link is invalid or not HTTPS.
 *
 * @see JobCard - uses this helper to sanitize external job application links.
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
    if (!url.hostname) {
      return '#';
    }
    if (url.port === '443') {
      url.port = '';
    }

    return url.href;
  } catch {
    return '#';
  }
}

/**
 * Render a job card displaying job metadata, visual highlights, tags, and primary actions.
 *
 * The component shows company information (logo, name), a title (uses pre-highlighted HTML when available),
 * a short description (also using pre-highlighted HTML when provided), location, posted date, salary,
 * type and remote badges, up to four tag badges with a "+N more" indicator, and two action buttons:
 * "Apply Now" (opens the job link in a new tab after sanitization via `getSafeJobLink`) and "View Details"
 * (navigates to the internal job detail route). If the job is featured, a prominent "Featured" badge is shown.
 *
 * @param job - Job data used to populate the card. Expected fields include:
 *   `slug`, `title`, `title_highlighted?`, `description?`, `description_highlighted?`,
 *   `company`, `company_logo?`, `location?`, `posted_at?`, `salary?`, `type?`, `remote?`,
 *   `tags?`, `link?`, and `tier?`.
 * @returns A React element representing the job card for the provided `job`.
 *
 * @see getSafeJobLink - used to sanitize and validate external job links before navigation
 * @see HighlightedText - renders server-provided highlighted HTML with a fallback
 * @see usePulse - analytics hook used for click telemetry on action buttons
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
      className={`group ${position.relative} ${transition.all} hover:${shadow.lg} hover:${borderColor['accent/20']} ${
        isFeatured
          ? `border-amber-400/50 ${bgGradient.toBR} ${gradientFrom.amber50_10} ${gradientTo.transparent} ${shadowColor.amber}`
          : ''
      }`}
    >
      {isFeatured && (
        <div className={`-top-2 -right-2 ${position.absolute} ${zLayer.raised}`}>
          <UnifiedBadge variant="base" style="default" className={`${bgColor.amber} ${textColor.white} ${shadow.lg}`}>
            <Star className={iconLeading.xs} />
            Featured
          </UnifiedBadge>
        </div>
      )}

      <CardHeader className={cardHeader.default}>
        <div className={`${display.flex} ${alignItems.start} ${justify.between}`}>
          <div className={flexGrow['1']}>
            <div className={`${cluster.default} ${marginBottom.tight}`}>
              {job.company_logo && (
                <Image
                  src={job.company_logo}
                  alt={`${job.company} logo`}
                  width={48}
                  height={48}
                  className={`${radius.lg} ${objectFit.cover}`}
                  loading="lazy"
                />
              )}
              <div>
                <CardTitle
                  className={`${weight.semibold} ${size.xl} ${transition.colors} group-hover:${textColor.accent}`}
                >
                  <Link href={`/jobs/${job.slug}`}>{highlightedTitle}</Link>
                </CardTitle>
                <div
                  className={`${cluster.compact} ${size.xs} ${muted.default}`}
                >
                  <Building className={iconSize.sm} />
                  <span className={weight.medium}>{job.company}</span>
                </div>
              </div>
            </div>

            <div className={`${display.flex} ${flexWrap.wrap} ${gap.default} ${muted.sm}`}>
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

          <div className={`${display.flex} ${flexDir.col} ${alignItems.end} ${stack.compact}`}>
            {job.type && (
              <UnifiedBadge
                variant="base"
                style="default"
                className={
                  jobTypeBadge[job.type as JobType] || `${bgColor.muted} ${muted.default}`
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
        <p className={`${marginBottom.comfortable} ${truncate.lines2}`}>{highlightedDescription}</p>

        <div className={marginBottom.comfortable}>
          <div className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
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

        <div className={`${display.flex} ${stack.comfortable}`}>
          <Button
            asChild={true}
            className={flexGrow['1']}
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
              return (
                <a href={safeJobLink} target="_blank" rel="noopener noreferrer">
                  Apply Now
                  <ExternalLink className={`${marginLeft.compact} ${iconSize.sm}`} />
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