"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Building,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Star,
} from "@/src/lib/icons";
import type { JobCardProps } from "@/src/lib/schemas/component.schema";
import { UI_CLASSES } from "@/src/lib/ui-constants";
import { formatRelativeDate } from "@/src/lib/utils/date-utils";

export const JobCard = memo(({ job }: JobCardProps) => {
  const getTypeColor = (type: string) => {
    const colors = {
      "full-time": "bg-green-500/10 text-green-400 border-green-500/20",
      "part-time": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      contract: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      freelance: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      remote: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return (
      colors[type as keyof typeof colors] || "bg-muted text-muted-foreground"
    );
  };

  return (
    <Card className={`${UI_CLASSES.CARD_GRADIENT_HOVER} relative`}>
      {job.featured && (
        <div className={`absolute -top-2 -right-2 ${UI_CLASSES.Z_10}`}>
          <Badge className="bg-accent text-accent-foreground">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div
          className={`flex ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN}`}
        >
          <div className={UI_CLASSES.FLEX_1}>
            <div className="flex items-center gap-3 mb-2">
              {job.companyLogo && (
                <Image
                  src={job.companyLogo}
                  alt={`${job.company} logo`}
                  width={48}
                  height={48}
                  className={`${UI_CLASSES.ROUNDED_LG} object-cover`}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              )}
              <div>
                <CardTitle
                  className={`text-xl ${UI_CLASSES.HOVER_TEXT_ACCENT}`}
                >
                  <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
                </CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span className={UI_CLASSES.FONT_MEDIUM}>{job.company}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <Clock className="h-4 w-4" />
                {formatRelativeDate(job.postedAt)}
              </div>
              {job.salary && (
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          <div
            className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_END} gap-2`}
          >
            <Badge className={getTypeColor(job.type)}>
              {job.type.replace("-", " ")}
            </Badge>
            {job.remote && <Badge variant="secondary">Remote</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p
          className={`text-muted-foreground ${UI_CLASSES.MB_4} ${UI_CLASSES.LINE_CLAMP_2}`}
        >
          {job.description}
        </p>

        <div className={UI_CLASSES.MB_4}>
          <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
            {job.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className={UI_CLASSES.TEXT_XS}>
                {tag}
              </Badge>
            ))}
            {job.tags.length > 4 && (
              <Badge variant="outline" className={UI_CLASSES.TEXT_XS}>
                +{job.tags.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        <div className={UI_CLASSES.FLEX_GAP_3}>
          <Button asChild className={UI_CLASSES.FLEX_1}>
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

JobCard.displayName = "JobCard";
