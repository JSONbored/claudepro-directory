'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { Building, Clock, DollarSign, ExternalLink, MapPin, Star } from '@/src/lib/icons';
import type { JobCardProps } from '@/src/lib/schemas/component.schema';
import { BADGE_COLORS, type JobType, UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';

export const JobCard = memo(({ job }: JobCardProps) => {
  return (
    <Card className={`${UI_CLASSES.CARD_GRADIENT_HOVER} relative`}>
      {job.featured && (
        <div className={'-top-2 -right-2 absolute z-10'}>
          <UnifiedBadge variant="base" style="default" className="bg-accent text-accent-foreground">
            <Star className="mr-1 h-3 w-3" />
            Featured
          </UnifiedBadge>
        </div>
      )}

      <CardHeader className="pb-4">
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
                <CardTitle className={'text-xl transition-colors-smooth group-hover:text-accent'}>
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                </CardTitle>
                <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-muted-foreground`}>
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>

            <div className={`${UI_CLASSES.FLEX_WRAP_GAP_3} text-muted-foreground text-sm`}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              {job.posted_at && (
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Clock className="h-4 w-4" />
                  {formatRelativeDate(job.posted_at)}
                </div>
              )}
              {job.salary && (
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          <div className={'flex flex-col items-end gap-2'}>
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

      <CardContent className="pt-0">
        <p className={'mb-4 line-clamp-2 text-muted-foreground'}>{job.description}</p>

        <div className="mb-4">
          <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
            {Array.isArray(job.tags) &&
              (job.tags as string[]).slice(0, 4).map((tag: string) => (
                <UnifiedBadge key={tag} variant="base" style="outline" className="text-xs">
                  {tag}
                </UnifiedBadge>
              ))}
            {Array.isArray(job.tags) && job.tags.length > 4 && (
              <UnifiedBadge variant="base" style="outline" className="text-xs">
                +{job.tags.length - 4} more
              </UnifiedBadge>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <a href={job.link} target="_blank" rel="noopener noreferrer">
              Apply Now
              <ExternalLink className="ml-2 h-4 w-4" />
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
