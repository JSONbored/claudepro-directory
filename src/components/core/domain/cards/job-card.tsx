'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/unified-badge';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { Building, Clock, DollarSign, ExternalLink, MapPin, Star } from '@/src/lib/icons';
import type { JobCardProps } from '@/src/lib/types/component.types';
import { BADGE_COLORS, type JobType, UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';

export const JobCard = memo(({ job }: JobCardProps) => {
  const isFeatured = job.tier === 'featured';

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
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
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
            <UnifiedBadge
              variant="base"
              style="default"
              className={
                BADGE_COLORS.jobType[job.type as JobType] || 'bg-muted text-muted-foreground'
              }
            >
              {job.type.replace('-', ' ')}
            </UnifiedBadge>
            {job.remote && (
              <UnifiedBadge variant="base" style="secondary">
                Remote
              </UnifiedBadge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={UI_CLASSES.CARD_CONTENT_DEFAULT}>
        <p
          className={`${UI_CLASSES.MARGIN_DEFAULT} line-clamp-2 ${UI_CLASSES.TEXT_CARD_DESCRIPTION}`}
        >
          {job.description}
        </p>

        <div className={UI_CLASSES.MARGIN_DEFAULT}>
          <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
            {Array.isArray(job.tags) &&
              (job.tags as string[]).slice(0, 4).map((tag: string) => (
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
          <Button asChild className="flex-1">
            <a href={job.link} target="_blank" rel="noopener noreferrer">
              Apply Now
              <ExternalLink className={`ml-2 ${UI_CLASSES.ICON_SM}`} />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/jobs/${job.slug}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

JobCard.displayName = 'JobCard';
