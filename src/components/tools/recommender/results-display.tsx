'use client';

/**
 * Results Display Component
 * Displays personalized configuration recommendations
 *
 * Features:
 * - Ranked recommendation cards
 * - Match score visualization
 * - Filter/sort capabilities
 * - Share results functionality
 * - Bulk bookmark functionality
 * - Responsive grid layout
 */

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { BaseCard } from '@/src/components/shared/base-card';
import { BookmarkButton } from '@/src/components/shared/bookmark-button';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/components/ui/collapsible';
import { Separator } from '@/src/components/ui/separator';
import { Slider } from '@/src/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { addBookmarkBatch } from '@/src/lib/actions/user.actions';
import { ROUTES } from '@/src/lib/constants';
import {
  ArrowRight,
  Award,
  BarChart,
  Bookmark,
  ChevronDown,
  Eye,
  Info,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
} from '@/src/lib/icons';
import type { RecommendationResponse } from '@/src/lib/schemas/recommender.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';
import { ShareResults } from './share-results';

interface ResultsDisplayProps {
  recommendations: RecommendationResponse;
  shareUrl: string;
}

export function ResultsDisplay({ recommendations, shareUrl }: ResultsDisplayProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  // Refine results state
  const [minScore, setMinScore] = useState(60);
  const [maxResults, setMaxResults] = useState(10);
  const [showRefinePanel, setShowRefinePanel] = useState(false);

  const { results, summary, totalMatches, answers } = recommendations;

  // Handle bulk bookmark
  const handleSaveAll = () => {
    startTransition(async () => {
      try {
        const items = results.map((result) => ({
          content_type: result.category,
          content_slug: result.slug,
        }));

        const response = await addBookmarkBatch({ items });

        if (response?.data?.success) {
          toast.success(
            `Saved ${response.data.saved_count} of ${response.data.total_requested} recommendations to your library`,
            {
              description: 'View them in your library',
              action: {
                label: 'View Library',
                onClick: () => {
                  window.location.href = '/account/library';
                },
              },
            }
          );
        } else {
          toast.error('Failed to save recommendations. Please try again.');
        }
      } catch {
        toast.error('Failed to save recommendations. Please try again.');
      }
    });
  };

  // Apply filters and refinements
  const filteredResults = results
    .filter((r) => selectedCategory === 'all' || r.category === selectedCategory)
    .filter((r) => r.matchScore >= minScore)
    .slice(0, maxResults);

  // Get unique categories from results
  const categories = ['all', ...new Set(results.map((r) => r.category))];

  return (
    <div className={UI_CLASSES.SPACE_Y_8}>
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2}>
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">Your Personalized Recommendations</h1>
        </div>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Based on your preferences, we found{' '}
          <strong>{totalMatches} matching configurations</strong>. Here are the top {results.length}{' '}
          best fits for your needs.
        </p>

        {/* Summary Stats */}
        <div className={`${UI_CLASSES.FLEX_WRAP} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.GAP_3}`}>
          <Badge variant="secondary" className="text-sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            {summary.avgMatchScore}% Avg Match
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <BarChart className="h-3 w-3 mr-1" />
            {summary.diversityScore}% Diversity
          </Badge>
          <Badge variant="outline" className="text-sm">
            Top Category: {summary.topCategory}
          </Badge>
        </div>

        {/* Actions */}
        <div className={`${UI_CLASSES.FLEX_WRAP} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.GAP_3}`}>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAll}
            disabled={isPending}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            {isPending ? 'Saving...' : 'Save All to Library'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.CONFIG_RECOMMENDER} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Start Over
            </Link>
          </Button>
        </div>
      </div>

      {/* Refine Results Panel */}
      <Collapsible open={showRefinePanel} onOpenChange={setShowRefinePanel}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full gap-2">
            <Settings className="h-4 w-4" />
            Adjust Preferences
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showRefinePanel ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Refine Your Results</CardTitle>
              <CardDescription>
                Adjust these settings to fine-tune your recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Minimum Score Slider */}
              <div className="space-y-2">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className="text-sm font-medium">Minimum Match Score</span>
                  <span className="text-sm text-muted-foreground">{minScore}%</span>
                </div>
                <Slider
                  value={[minScore]}
                  onValueChange={(value) => setMinScore(value[0] || 60)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                  aria-label="Minimum match score"
                />
                <p className="text-xs text-muted-foreground">
                  Only show configurations with at least {minScore}% match
                </p>
              </div>

              {/* Max Results Slider */}
              <div className="space-y-2">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className="text-sm font-medium">Maximum Results</span>
                  <span className="text-sm text-muted-foreground">{maxResults}</span>
                </div>
                <Slider
                  value={[maxResults]}
                  onValueChange={(value) => setMaxResults(value[0] || 10)}
                  min={3}
                  max={20}
                  step={1}
                  className="w-full"
                  aria-label="Maximum number of results"
                />
                <p className="text-xs text-muted-foreground">
                  Show up to {maxResults} recommendations
                </p>
              </div>

              {/* Stats */}
              <div className="pt-4">
                <Separator className="mb-4" />
                <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} text-sm`}>
                  <span className="text-muted-foreground">Showing results:</span>
                  <span className="font-medium">
                    {filteredResults.length} of {results.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Your Selections Summary */}
      <Card className="bg-accent/5">
        <CardHeader>
          <CardTitle className="text-lg">Your Selections</CardTitle>
          <CardDescription>We matched configurations based on these preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <span className="text-sm font-medium">Use Case</span>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {answers.useCase.replace('-', ' ')}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Experience Level</span>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {answers.experienceLevel}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Tool Preferences</span>
              <p className="text-sm text-muted-foreground mt-1">
                {answers.toolPreferences.join(', ')}
              </p>
            </div>
            {answers.integrations && answers.integrations.length > 0 && (
              <div>
                <span className="text-sm font-medium">Integrations</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {answers.integrations.join(', ')}
                </p>
              </div>
            )}
            {answers.focusAreas && answers.focusAreas.length > 0 && (
              <div>
                <span className="text-sm font-medium">Focus Areas</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {answers.focusAreas.join(', ')}
                </p>
              </div>
            )}
            {answers.teamSize && (
              <div>
                <span className="text-sm font-medium">Team Size</span>
                <p className="text-sm text-muted-foreground mt-1 capitalize">{answers.teamSize}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className={`${UI_CLASSES.FLEX_WRAP} h-auto`}>
          {categories.map((category) => {
            const count =
              category === 'all'
                ? results.length
                : results.filter((r) => r.category === category).length;
            return (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === 'all' ? 'All Results' : category} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Results Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((result) => {
              const targetPath = getContentItemUrl(result);
              const getMatchScoreColor = (score: number) => {
                if (score >= 90) return 'text-green-600 dark:text-green-400';
                if (score >= 75) return 'text-blue-600 dark:text-blue-400';
                if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
                return 'text-muted-foreground';
              };
              const getMatchGradient = (score: number) => {
                if (score >= 90) return 'from-green-500/20 to-transparent';
                if (score >= 75) return 'from-blue-500/20 to-transparent';
                if (score >= 60) return 'from-yellow-500/20 to-transparent';
                return 'from-muted/20 to-transparent';
              };

              return (
                <div key={result.slug} className="relative">
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

                  {/* Bookmark button (bottom right) */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <BookmarkButton
                      contentType={result.category}
                      contentSlug={result.slug}
                      initialBookmarked={false}
                    />
                  </div>

                  {/* Gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${getMatchGradient(result.matchScore)} opacity-50 pointer-events-none`}
                  />

                  <Link href={targetPath}>
                    <BaseCard
                      targetPath={targetPath}
                      displayTitle={result.title}
                      description={result.description}
                      ariaLabel={`${result.title} - ${result.matchScore}% match`}
                      tags={result.tags}
                      maxVisibleTags={4}
                      author={result.author}
                      className="relative overflow-hidden hover:shadow-lg transition-all"
                      renderTopBadges={() => (
                        <Badge variant="outline" className="w-fit capitalize">
                          {result.category}
                        </Badge>
                      )}
                      renderContent={() => (
                        <>
                          {/* Primary reason for recommendation */}
                          <div className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_2} p-3 bg-accent/50 rounded-lg mb-3`}>
                            <Info className={`h-4 w-4 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                            <div>
                              <p className="text-sm font-medium">Why recommended:</p>
                              <p className="text-sm text-muted-foreground">
                                {result.primaryReason}
                              </p>
                            </div>
                          </div>

                          {/* Additional reasons */}
                          {result.reasons.length > 1 && (
                            <div className={UI_CLASSES.FLEX_WRAP_GAP_1}>
                              {result.reasons.slice(1, 4).map((reason) => (
                                <Badge key={reason.message} variant="secondary" className="text-xs">
                                  {reason.message}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      renderMetadataBadges={() =>
                        result.viewCount !== undefined ? (
                          <span className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} text-sm text-muted-foreground`}>
                            <Eye className="h-3 w-3" />
                            {result.viewCount}
                          </span>
                        ) : null
                      }
                      customMetadataText={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full group -mx-4 -mb-4 mt-2"
                          asChild
                        >
                          <span className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2}>
                            View Details
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      }
                      showActions={false}
                    />
                  </Link>
                </div>
              );
            })}
          </div>

          {filteredResults.length === 0 && (
            <Card>
              <CardContent className={UI_CLASSES.FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER}>
                <p className="text-muted-foreground">No results in this category</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Next Steps CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Sparkles className="h-5 w-5 text-primary" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to start using these configurations? Click any card to view detailed setup
            instructions, examples, and documentation.
          </p>
          <div className={UI_CLASSES.FLEX_WRAP_GAP_3}>
            <Button asChild>
              <Link href="/" className="gap-2">
                Browse All Configs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.GUIDES}>View Setup Guides</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      {showShareModal && (
        <ShareResults
          shareUrl={shareUrl}
          resultCount={results.length}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
