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
  // Use centralized badge colors from ui-constants.ts
  const getTypeColor = (type: string) => {
    return BADGE_COLORS.jobType[type as JobType] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card className={`${UI_CLASSES.CARD_GRADIENT_HOVER} relative`}>
      {job.featured && (
        <div className={'absolute -top-2 -right-2 z-10'}>
          <UnifiedBadge variant="base" style="default" className="bg-accent text-accent-foreground">
            <Star className="h-3 w-3 mr-1" />
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
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              )}
              <div>
                <CardTitle className={'text-xl group-hover:text-accent transition-colors-smooth'}>
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                </CardTitle>
                <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-muted-foreground`}>
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>

            <div className={`${UI_CLASSES.FLEX_WRAP_GAP_3} text-sm text-muted-foreground`}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <Clock className="h-4 w-4" />
                {formatRelativeDate(job.posted_at)}
              </div>
              {job.salary && (
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          <div className={'flex flex-col items-end gap-2'}>
            <UnifiedBadge variant="base" style="default" className={getTypeColor(job.type)}>
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
        <p className={'text-muted-foreground mb-4 line-clamp-2'}>{job.description}</p>

        <div className="mb-4">
          <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
            {job.tags.slice(0, 4).map((tag: string) => (
              <UnifiedBadge key={tag} variant="base" style="outline" className="text-xs">
                {tag}
              </UnifiedBadge>
            ))}
            {job.tags.length > 4 && (
              <UnifiedBadge variant="base" style="outline" className="text-xs">
                +{job.tags.length - 4} more
              </UnifiedBadge>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply Now
              <ExternalLink className="h-4 w-4 ml-2" />
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
