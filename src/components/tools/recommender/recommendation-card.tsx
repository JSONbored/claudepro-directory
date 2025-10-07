'use client';

/**
 * Recommendation Card Component
 * Displays individual configuration recommendation with match score
 */

import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { ArrowRight, Award, Eye, Info, Sparkles } from '@/src/lib/icons';
import type { RecommendationResult } from '@/src/lib/schemas/recommender.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface RecommendationCardProps {
  result: RecommendationResult;
}

export function RecommendationCard({ result }: RecommendationCardProps) {
  const targetPath = `/${result.category}/${result.slug}`;

  // Match score color coding
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-muted-foreground';
  };

  // Match score gradient
  const getMatchGradient = (score: number) => {
    if (score >= 90) return 'from-green-500/20 to-transparent';
    if (score >= 75) return 'from-blue-500/20 to-transparent';
    if (score >= 60) return 'from-yellow-500/20 to-transparent';
    return 'from-muted/20 to-transparent';
  };

  return (
    <Card
      className={`relative overflow-hidden ${UI_CLASSES.CARD_INTERACTIVE} hover:shadow-lg transition-all`}
    >
      {/* Match score badge (top right) */}
      <div className="absolute top-4 right-4 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={`${getMatchScoreColor(result.matchScore)} font-bold text-base px-3 py-1`}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {result.matchScore}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Match Score: How well this fits your needs</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Rank badge (top left) */}
      {result.rank <= 3 && (
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            <Award className="h-3 w-3 mr-1" />#{result.rank}
          </Badge>
        </div>
      )}

      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getMatchGradient(result.matchScore)} opacity-50`}
      />

      {/* Card content */}
      <Link href={targetPath} className="relative">
        <CardHeader className="pb-3">
          <div className={UI_CLASSES.SPACE_Y_2}>
            {/* Category badge */}
            <Badge variant="outline" className="w-fit capitalize">
              {result.category}
            </Badge>

            {/* Title */}
            <CardTitle className="text-lg line-clamp-2">{result.title}</CardTitle>

            {/* Description */}
            <CardDescription className="line-clamp-2">{result.description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Primary reason for recommendation */}
          <div className="flex items-start gap-2 p-3 bg-accent/50 rounded-lg">
            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Why recommended:</p>
              <p className="text-sm text-muted-foreground">{result.primaryReason}</p>
            </div>
          </div>

          {/* Additional reasons */}
          {result.reasons.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {result.reasons.slice(1, 4).map((reason) => (
                <Badge key={reason.message} variant="secondary" className="text-xs">
                  {reason.message}
                </Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{result.tags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Metadata row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-3">
              <span>by {result.author}</span>
              {result.viewCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {result.viewCount}
                </span>
              )}
            </div>
          </div>

          {/* View details button */}
          <Button variant="ghost" size="sm" className="w-full group" asChild>
            <span className="flex items-center justify-center gap-2">
              View Details
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
}
