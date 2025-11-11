'use client';

/**
 * Results Display - Database-First Architecture
 * Uses RPC function returns + minimal UI enrichment only.
 */

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { BaseCard } from '@/src/components/core/domain/base-card';
import { UnifiedBadge } from '@/src/components/core/domain/unified-badge';
import { UnifiedButton } from '@/src/components/core/domain/unified-button';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/components/primitives/collapsible';
import { Separator } from '@/src/components/primitives/separator';
import { Slider } from '@/src/components/primitives/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/primitives/tooltip';
import { addBookmarkBatch } from '@/src/lib/actions/user.actions';
import { ROUTES } from '@/src/lib/constants';
import {
  ArrowRight,
  Award,
  BarChart,
  Bookmark,
  ChevronDown,
  Info,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
} from '@/src/lib/icons';
import { POSITION_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';
import type { Database } from '@/src/types/database.types';

type RecommendationResponse = {
  results: Array<{
    slug: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    author: string;
    match_score: number;
    match_percentage: number;
    primary_reason: string;
    rank: number;
    reasons: Array<{ type: string; message: string }>;
  }>;
  totalMatches: number;
  answers: {
    useCase: string;
    experienceLevel: string;
    toolPreferences: string[];
    integrations?: string[];
    focusAreas?: string[];
    teamSize?: string;
  };
  id: string;
  generatedAt: string;
  algorithm: string;
  summary: {
    topCategory: string;
    avgMatchScore: number;
    diversityScore: number;
  };
};

import { toasts } from '@/src/lib/utils/toast.utils';
import { ShareResults } from './share-results';

interface ResultsDisplayProps {
  recommendations: RecommendationResponse;
  shareUrl: string;
}

export function ResultsDisplay({ recommendations, shareUrl }: ResultsDisplayProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [minScore, setMinScore] = useState(60);
  const [maxResults, setMaxResults] = useState(10);
  const [showRefinePanel, setShowRefinePanel] = useState(false);

  const { results, summary, totalMatches, answers } = recommendations;

  const handleSaveAll = () => {
    startTransition(async () => {
      try {
        const items = results.map((result) => ({
          content_type: result.category as Database['public']['Enums']['content_category'],
          content_slug: result.slug,
        }));

        const response = await addBookmarkBatch({ items });

        if (response?.data?.success) {
          toasts.raw.success(
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
          toasts.error.saveFailed();
        }
      } catch {
        toasts.error.saveFailed();
      }
    });
  };

  const filteredResults = results
    .filter((r) => selectedCategory === 'all' || r.category === selectedCategory)
    .filter((r) => r.match_score >= minScore)
    .slice(0, maxResults);

  const categories = ['all', ...new Set(results.map((r) => r.category))];

  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2}>
          <Sparkles className={`${UI_CLASSES.ICON_LG} text-primary`} />
          <h1 className="font-bold text-3xl md:text-4xl">Your Personalized Recommendations</h1>
        </div>

        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Based on your preferences, we found{' '}
          <strong>{totalMatches} matching configurations</strong>. Here are the top {results.length}{' '}
          best fits for your needs.
        </p>

        <div className={'flex-wrap items-center justify-center gap-3'}>
          <UnifiedBadge variant="base" style="secondary" className="text-sm">
            <TrendingUp className={UI_CLASSES.ICON_XS_LEADING} />
            {summary.avgMatchScore}% Avg Match
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="secondary" className="text-sm">
            <BarChart className={UI_CLASSES.ICON_XS_LEADING} />
            {summary.diversityScore}% Diversity
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="outline" className="text-sm">
            Top Category: {summary.topCategory}
          </UnifiedBadge>
        </div>

        <div className={'flex-wrap items-center justify-center gap-3'}>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAll}
            disabled={isPending}
            className="gap-2"
          >
            <Bookmark className={UI_CLASSES.ICON_SM} />
            {isPending ? 'Saving...' : 'Save All to Library'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="gap-2"
          >
            <Share2 className={UI_CLASSES.ICON_SM} />
            Share Results
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.TOOLS_CONFIG_RECOMMENDER} className="gap-2">
              <RefreshCw className={UI_CLASSES.ICON_SM} />
              Start Over
            </Link>
          </Button>
        </div>
      </div>

      <Collapsible open={showRefinePanel} onOpenChange={setShowRefinePanel}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full gap-2">
            <Settings className={UI_CLASSES.ICON_SM} />
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
              <div className="space-y-2">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className="font-medium text-sm">Minimum Match Score</span>
                  <span className="text-muted-foreground text-sm">{minScore}%</span>
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
                <p className="text-muted-foreground text-xs">
                  Only show configurations with at least {minScore}% match
                </p>
              </div>

              <div className="space-y-2">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <span className="font-medium text-sm">Maximum Results</span>
                  <span className="text-muted-foreground text-sm">{maxResults}</span>
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
                <p className="text-muted-foreground text-xs">
                  Show up to {maxResults} recommendations
                </p>
              </div>

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

      <Card className="bg-accent/5">
        <CardHeader>
          <CardTitle className="text-lg">Your Selections</CardTitle>
          <CardDescription>We matched configurations based on these preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <span className="font-medium text-sm">Use Case</span>
              <p className="mt-1 text-muted-foreground text-sm capitalize">
                {String(answers.useCase).replace('-', ' ')}
              </p>
            </div>
            <div>
              <span className="font-medium text-sm">Experience Level</span>
              <p className="mt-1 text-muted-foreground text-sm capitalize">
                {String(answers.experienceLevel)}
              </p>
            </div>
            <div>
              <span className="font-medium text-sm">Tool Preferences</span>
              <p className="mt-1 text-muted-foreground text-sm">
                {Array.isArray(answers.toolPreferences) ? answers.toolPreferences.join(', ') : ''}
              </p>
            </div>
            {answers.integrations &&
              Array.isArray(answers.integrations) &&
              answers.integrations.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Integrations</span>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {answers.integrations.join(', ')}
                  </p>
                </div>
              )}
            {answers.focusAreas &&
              Array.isArray(answers.focusAreas) &&
              answers.focusAreas.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Focus Areas</span>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {answers.focusAreas.join(', ')}
                  </p>
                </div>
              )}
            {answers.teamSize && (
              <div>
                <span className="font-medium text-sm">Team Size</span>
                <p className="mt-1 text-muted-foreground text-sm capitalize">
                  {String(answers.teamSize)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className={'h-auto flex-wrap'}>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((result) => {
              const targetPath = getContentItemUrl({
                category: result.category as Database['public']['Enums']['content_category'],
                slug: result.slug,
              });
              const matchScore = result.match_score;
              const getMatchScoreColor = (score: number) => {
                if (score >= 90) return UI_CLASSES.SCORE_EXCELLENT;
                if (score >= 75) return UI_CLASSES.SCORE_GOOD;
                if (score >= 60) return UI_CLASSES.SCORE_FAIR;
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
                  <div className="${POSITION_PATTERNS.ABSOLUTE_TOP_RIGHT_OFFSET_XL} z-10">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <UnifiedBadge
                            variant="base"
                            style="secondary"
                            className={`${getMatchScoreColor(matchScore)} px-3 py-1 font-bold text-base`}
                          >
                            <Sparkles className={UI_CLASSES.ICON_XS_LEADING} />
                            {matchScore}%
                          </UnifiedBadge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Match Score: How well this fits your needs</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {result.rank <= 3 && (
                    <div className="${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT_OFFSET_XL} z-10">
                      <UnifiedBadge
                        variant="base"
                        style="outline"
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <Award className={UI_CLASSES.ICON_XS_LEADING} />#{result.rank}
                      </UnifiedBadge>
                    </div>
                  )}

                  <div className="${POSITION_PATTERNS.ABSOLUTE_BOTTOM_RIGHT_OFFSET} z-10">
                    <UnifiedButton
                      variant="bookmark"
                      contentType={result.category}
                      contentSlug={result.slug}
                      initialBookmarked={false}
                    />
                  </div>

                  <div
                    className={`${POSITION_PATTERNS.ABSOLUTE_INSET} bg-gradient-to-br ${getMatchGradient(matchScore)} pointer-events-none opacity-50`}
                  />

                  <Link href={targetPath}>
                    <BaseCard
                      targetPath={targetPath}
                      displayTitle={result.title}
                      description={result.description}
                      ariaLabel={`${result.title} - ${matchScore}% match`}
                      tags={result.tags}
                      maxVisibleTags={4}
                      author={result.author}
                      className="relative overflow-hidden transition-all hover:shadow-lg"
                      renderTopBadges={() => (
                        <UnifiedBadge variant="base" style="outline" className="w-fit capitalize">
                          {result.category}
                        </UnifiedBadge>
                      )}
                      renderContent={() => (
                        <>
                          <div
                            className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_2} mb-3 rounded-lg bg-accent/50 p-3`}
                          >
                            <Info
                              className={`h-4 w-4 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                            />
                            <div>
                              <p className="font-medium text-sm">Why recommended:</p>
                              <p className="text-muted-foreground text-sm">
                                {result.primary_reason}
                              </p>
                            </div>
                          </div>

                          {result.reasons && result.reasons.length > 1 && (
                            <div className="flex flex-wrap gap-1">
                              {result.reasons
                                .slice(1, 4)
                                .map((reason: { type: string; message: string }) => (
                                  <UnifiedBadge
                                    key={reason.message}
                                    variant="base"
                                    style="secondary"
                                    className="text-xs"
                                  >
                                    {reason.message}
                                  </UnifiedBadge>
                                ))}
                            </div>
                          )}
                        </>
                      )}
                      customMetadataText={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="group -mx-4 -mb-4 mt-2 w-full"
                          asChild
                        >
                          <span className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2}>
                            View Details
                            <ArrowRight
                              className={`${UI_CLASSES.ICON_SM} transition-transform group-hover:translate-x-1`}
                            />
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

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Sparkles className={`${UI_CLASSES.ICON_MD} text-primary`} />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Ready to start using these configurations? Click any card to view detailed setup
            instructions, examples, and documentation.
          </p>
          <div className={UI_CLASSES.FLEX_WRAP_GAP_3}>
            <Button asChild>
              <Link href="/" className="gap-2">
                Browse All Configs
                <ArrowRight className={UI_CLASSES.ICON_SM} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.GUIDES}>View Setup Guides</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
