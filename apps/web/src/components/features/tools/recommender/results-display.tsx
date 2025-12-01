'use client';

/**
 * Results Display - Database-First Architecture
 * Uses RPC function returns + minimal UI enrichment only.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { addBookmarkBatch } from '@heyclaude/web-runtime/actions';
import { getContentItemUrl, isValidCategory, sanitizeSlug } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
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
} from '@heyclaude/web-runtime/icons';
import { between, cluster, iconLeading, iconSize, absolute, spaceY, muted, marginBottom, marginTop, weight ,size , padding , gap , row , radius , maxWidth } from '@heyclaude/web-runtime/design-system';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { BookmarkButton } from '@heyclaude/web-runtime/ui';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { BaseCard } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@heyclaude/web-runtime/ui';
import { Separator } from '@heyclaude/web-runtime/ui';
import { Slider } from '@heyclaude/web-runtime/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heyclaude/web-runtime/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@heyclaude/web-runtime/ui';

// Type matching DecodedQuizAnswers from results page
type DecodedQuizAnswers = {
  useCase: Database['public']['Enums']['use_case_type'];
  experienceLevel: Database['public']['Enums']['experience_level'];
  toolPreferences: string[];
  p_integrations?: Database['public']['Enums']['integration_type'][];
  p_focus_areas?: Database['public']['Enums']['focus_area_type'][];
  teamSize?: string;
  timestamp?: string;
};

type RecommendationResponse = Database['public']['Functions']['get_recommendations']['Returns'] & {
  answers: DecodedQuizAnswers;
  id: string;
  generatedAt: string;
};

import { toasts } from '@heyclaude/web-runtime/ui';
import { ShareResults } from './share-results';

interface ResultsDisplayProps {
  recommendations: RecommendationResponse;
  shareUrl: string;
}

/**
 * Render a results UI that presents personalized recommendations and tools for filtering, sharing, and saving them.
 *
 * Displays summary metrics and the user's selections, lets the user refine results by minimum match score and maximum count, switch between category tabs, open a share modal, and save visible recommendations to the user's library.
 *
 * @param recommendations - Recommendation response containing `results`, `summary`, `total_matches`, and the original `answers` used to generate recommendations.
 * @param shareUrl - URL used by the share modal when sharing results.
 * @returns A React element containing the recommendations UI.
 *
 * @see {@link ShareResults}
 * @see {@link addBookmarkBatch}
 * @see {@link getContentItemUrl}
 */
export function ResultsDisplay({ recommendations, shareUrl }: ResultsDisplayProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [minScore, setMinScore] = useState(60);
  const [maxResults, setMaxResults] = useState(10);
  const [showRefinePanel, setShowRefinePanel] = useState(false);

  const { results, summary, total_matches, answers } = recommendations;

  const handleSaveAll = () => {
    startTransition(async () => {
      try {
        const items = (results ?? [])
          .filter(
            (
              result
            ): result is typeof result & {
              category: Database['public']['Enums']['content_category'];
              slug: string;
            } => {
              if (!(result.category && result.slug)) return false;
              return isValidCategory(result.category);
            }
          )
          .map((result) => ({
            content_type: result.category,
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

  const filteredResults = (results ?? [])
    .filter((r) => selectedCategory === 'all' || r.category === selectedCategory)
    .filter((r) => (r.match_score ?? 0) >= minScore)
    .slice(0, maxResults);

  const categories = ['all', ...new Set((results ?? []).map((r) => r.category).filter(Boolean))];

  return (
    <div className={spaceY.loose}>
      <div className={`${spaceY.comfortable} text-center`}>
        <div className={`flex items-center justify-center ${gap.compact}`}>
          <Sparkles className={`${iconSize.lg} text-primary`} />
          <h1 className={`${weight.bold} ${size['3xl']} md:${size['4xl']}`}>Your Personalized Recommendations</h1>
        </div>

        <p className={`mx-auto ${maxWidth['2xl']} ${muted.lg}`}>
          Based on your preferences, we found{' '}
          <strong>{total_matches ?? 0} matching configurations</strong>. Here are the top{' '}
          {results?.length ?? 0} best fits for your needs.
        </p>

        <div className={'flex-wrap items-center justify-center ${gap.default}'}>
          <UnifiedBadge variant="base" style="secondary" className="text-sm">
            <TrendingUp className={iconLeading.xs} />
            {(summary?.avg_match_score ?? 0).toFixed(0)}% Avg Match
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="secondary" className="text-sm">
            <BarChart className={iconLeading.xs} />
            {(summary?.diversity_score ?? 0).toFixed(0)}% Diversity
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="outline" className="text-sm">
            Top Category: {summary?.top_category ?? 'General'}
          </UnifiedBadge>
        </div>

        <div className={'flex-wrap items-center justify-center ${gap.default}'}>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAll}
            disabled={isPending}
            className={`${gap.compact}`}
          >
            <Bookmark className={iconSize.sm} />
            {isPending ? 'Saving...' : 'Save All to Library'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className={`${gap.compact}`}
          >
            <Share2 className={iconSize.sm} />
            Share Results
          </Button>
          <Button variant="outline" size="sm" asChild={true}>
            <Link href={ROUTES.TOOLS_CONFIG_RECOMMENDER} className={`${gap.compact}`}>
              <RefreshCw className={iconSize.sm} />
              Start Over
            </Link>
          </Button>
        </div>
      </div>

      <Collapsible open={showRefinePanel} onOpenChange={setShowRefinePanel}>
        <CollapsibleTrigger asChild={true}>
          <Button variant="ghost" size="sm" className={`w-full ${gap.compact}`}>
            <Settings className={iconSize.sm} />
            Adjust Preferences
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showRefinePanel ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className={marginTop.default}>
            <CardHeader>
              <CardTitle className="text-lg">Refine Your Results</CardTitle>
              <CardDescription>
                Adjust these settings to fine-tune your recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className={spaceY.relaxed}>
              <div className={spaceY.compact}>
                <div className={between.center}>
                  <span className={`${weight.medium} ${size.sm}`}>Minimum Match Score</span>
                  <span className={muted.sm}>{minScore}%</span>
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
                <p className={`${muted.default} ${size.xs}`}>
                  Only show configurations with at least {minScore}% match
                </p>
              </div>

              <div className={spaceY.compact}>
                <div className={between.center}>
                  <span className={`${weight.medium} ${size.sm}`}>Maximum Results</span>
                  <span className={muted.sm}>{maxResults}</span>
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
                <p className={`${muted.default} ${size.xs}`}>
                  Show up to {maxResults} recommendations
                </p>
              </div>

              <div className="pt-4">
                <Separator className={marginBottom.default} />
                <div className={`${between.center} ${size.sm}`}>
                  <span className={muted.default}>Showing results:</span>
                  <span className={weight.medium}>
                    {filteredResults.length} of {results?.length ?? 0}
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
          <div className={`grid ${gap.default} sm:grid-cols-2 md:grid-cols-3`}>
            <div>
              <span className={`${weight.medium} ${size.sm}`}>Use Case</span>
              <p className={`${marginTop.tight} ${muted.sm} capitalize`}>
                {String(answers.useCase).replace('-', ' ')}
              </p>
            </div>
            <div>
              <span className={`${weight.medium} ${size.sm}`}>Experience Level</span>
              <p className={`${marginTop.tight} ${muted.sm} capitalize`}>
                {String(answers.experienceLevel)}
              </p>
            </div>
            <div>
              <span className={`${weight.medium} ${size.sm}`}>Tool Preferences</span>
              <p className={`${marginTop.tight} ${muted.sm}`}>
                {Array.isArray(answers.toolPreferences) ? answers.toolPreferences.join(', ') : ''}
              </p>
            </div>
            {answers.p_integrations &&
              Array.isArray(answers.p_integrations) &&
              answers.p_integrations.length > 0 && (
                <div>
                  <span className={`${weight.medium} ${size.sm}`}>Integrations</span>
                  <p className={`${marginTop.tight} ${muted.sm}`}>
                    {answers.p_integrations.join(', ')}
                  </p>
                </div>
              )}
            {answers.p_focus_areas &&
              Array.isArray(answers.p_focus_areas) &&
              answers.p_focus_areas.length > 0 && (
                <div>
                  <span className={`${weight.medium} ${size.sm}`}>Focus Areas</span>
                  <p className={`${marginTop.tight} ${muted.sm}`}>
                    {answers.p_focus_areas.join(', ')}
                  </p>
                </div>
              )}
            {answers.teamSize && (
              <div>
                <span className={`${weight.medium} ${size.sm}`}>Team Size</span>
                <p className={`${marginTop.tight} ${muted.sm} capitalize`}>
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
                ? (results?.length ?? 0)
                : (results ?? []).filter((r) => r.category === category).length;
            return (
              <TabsTrigger key={category ?? 'all'} value={category ?? 'all'} className="capitalize">
                {category === 'all' ? 'All Results' : (category ?? 'all')} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className={marginTop.comfortable}>
          <div className={`grid ${gap.relaxed} md:grid-cols-2 lg:grid-cols-3`}>
            {filteredResults
              .filter(
                (
                  result
                ): result is typeof result & {
                  category: Database['public']['Enums']['content_category'];
                  slug: string;
                } => {
                  if (!(result.category && result.slug)) return false;
                  return isValidCategory(result.category);
                }
              )
              .map((result) => {
                // Only allow categories from the explicit allowlist - use Constants
                const allowedCategories = Constants.public.Enums.content_category;
                // Validate slug pattern: alphanumeric start, then alphanumeric/hyphens/underscores, 3-32 chars
                const slugPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_]{2,32}$/;
                if (
                  !(
                    allowedCategories.includes(
                      result.category as (typeof allowedCategories)[number]
                    ) && slugPattern.test(result.slug)
                  )
                ) {
                  // Skip rendering for invalid categories or invalid slugs
                  return null;
                }
                const targetPath = getContentItemUrl({
                  category: result.category,
                  slug: sanitizeSlug(result.slug ?? ''),
                });
                const matchScore = typeof result.match_score === 'number' ? result.match_score : 0;
                const rank = typeof result.rank === 'number' ? result.rank : null;
                const tags = Array.isArray(result.tags)
                  ? result.tags.filter((tag): tag is string => typeof tag === 'string')
                  : [];
                const reasons = Array.isArray(result.reasons) ? result.reasons : [];
                const primaryReason =
                  result.primary_reason ?? 'Hand-picked based on your preferences.';
                const author =
                  typeof result.author === 'string' && result.author.length > 0
                    ? result.author
                    : undefined;
                const getMatchScoreColor = (score: number) => {
                  if (score >= 90) return 'text-green-500';
                  if (score >= 75) return 'text-blue-500';
                  if (score >= 60) return 'text-yellow-500';
                  return muted.default;
                };
                const getMatchGradient = (score: number) => {
                  if (score >= 90) return 'from-green-500/20 to-transparent';
                  if (score >= 75) return 'from-blue-500/20 to-transparent';
                  if (score >= 60) return 'from-yellow-500/20 to-transparent';
                  return 'from-muted/20 to-transparent';
                };

                return (
                  <div key={result.slug} className="relative">
                    <div className={`${absolute.topRightOffsetXl} z-10`}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild={true}>
                            <UnifiedBadge
                              variant="base"
                              style="secondary"
                              className={`${getMatchScoreColor(matchScore)} ${padding.xCompact} ${padding.yMicro} ${weight.bold} ${size.base}`}
                            >
                              <Sparkles className={iconLeading.xs} />
                              {matchScore}%
                            </UnifiedBadge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Match Score: How well this fits your needs</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {rank !== null && rank <= 3 && (
                      <div className={`${absolute.topLeftOffsetXl} z-10`}>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <Award className={iconLeading.xs} />#{rank}
                        </UnifiedBadge>
                      </div>
                    )}

                    <div className={`${absolute.bottomRightOffset} z-10`}>
                      <BookmarkButton
                        contentType={result.category}
                        contentSlug={result.slug}
                        initialBookmarked={false}
                      />
                    </div>

                    <div
                      className={`${absolute.inset} bg-linear-to-br ${getMatchGradient(matchScore)} pointer-events-none opacity-50`}
                    />

                    <Link href={targetPath}>
                      <BaseCard
                        targetPath={targetPath}
                        displayTitle={result.title}
                        description={result.description}
                        ariaLabel={`${result.title} - ${matchScore}% match`}
                        {...(tags.length ? { tags } : {})}
                        maxVisibleTags={4}
                        {...(author ? { author } : {})}
                        className="relative overflow-hidden transition-all hover:shadow-lg"
                        renderTopBadges={() => (
                          <UnifiedBadge variant="base" style="outline" className="w-fit capitalize">
                            {result.category}
                          </UnifiedBadge>
                        )}
                        renderContent={() => (
                          <>
                            <div
                              className={`${row.compact} mb-3 ${radius.lg} bg-accent/50 ${padding.compact}`}
                            >
                              <Info
                                className={`h-4 w-4 text-primary ${marginTop.micro} shrink-0`}
                              />
                              <div>
                                <p className={`${weight.medium} ${size.sm}`}>Why recommended:</p>
                                <p className={muted.sm}>{primaryReason}</p>
                              </div>
                            </div>

                            {reasons.length > 1 && (
                              <div className={`flex flex-wrap ${gap.tight}`}>
                                {reasons.slice(1, 4).map((reason) => (
                                  <UnifiedBadge
                                    key={`${result.slug}-${reason.message}`}
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
                            className={`group -mx-4 -mb-4 ${marginTop.compact} w-full`}
                            asChild={true}
                          >
                            <span className={`flex items-center justify-center ${gap.compact}`}>
                              View Details
                              <ArrowRight
                                className={`${iconSize.sm} transition-transform group-hover:translate-x-1`}
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
              <CardContent className={`flex flex-col items-center justify-center ${padding.yRelaxed}`}>
                <p className={muted.default}>No results in this category</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className={cluster.compact}>
            <Sparkles className={`${iconSize.md} text-primary`} />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          <p className={muted.sm}>
            Ready to start using these configurations? Click any card to view detailed setup
            instructions, examples, and documentation.
          </p>
          <div className={`flex flex-wrap ${gap.default}`}>
            <Button asChild={true}>
              <Link href="/" className={`${gap.compact}`}>
                Browse All Configs
                <ArrowRight className={iconSize.sm} />
              </Link>
            </Button>
            <Button variant="outline" asChild={true}>
              <Link href={ROUTES.GUIDES}>View Setup Guides</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {showShareModal && (
        <ShareResults
          shareUrl={shareUrl}
          resultCount={results?.length ?? 0}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}