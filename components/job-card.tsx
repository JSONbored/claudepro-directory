'use client';

import { Building, Clock, DollarSign, ExternalLink, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Job } from '@/data/jobs';

interface JobCardProps {
  job: Job;
}

export const JobCard = memo(({ job }: JobCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
      'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      contract: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      freelance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="card-gradient hover-lift transition-smooth group relative">
      {job.featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-accent text-accent-foreground">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {job.companyLogo && (
                <Image
                  src={job.companyLogo}
                  alt={`${job.company} logo`}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              )}
              <div>
                <CardTitle className="text-xl group-hover:text-accent transition-colors">
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                </CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(job.postedAt)}
              </div>
              {job.salary && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={getTypeColor(job.type)}>{job.type.replace('-', ' ')}</Badge>
            {job.remote && <Badge variant="secondary">Remote</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {job.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{job.tags.length - 4} more
              </Badge>
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
