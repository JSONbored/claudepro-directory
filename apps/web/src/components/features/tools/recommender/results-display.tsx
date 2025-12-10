'use client';

/**
 * Results Display - Database-First Architecture
 * Uses RPC function returns + minimal UI enrichment only.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { addBookmarkBatch } from '@heyclaude/web-runtime/actions';
import { getContentItemUrl, isValidCategory, sanitizeSlug } from '@heyclaude/web-runtime/core';
import { getCategoryConfig } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks';
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
import {
  POSITION_PATTERNS,
  UI_CLASSES,
  BookmarkButton,
  UnifiedBadge,
  BaseCard,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Separator,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toasts,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { ShareResults } from './share-results';

// Type matching DecodedQuizAnswers from results page
interface DecodedQuizAnswers {
  experienceLevel: Database['public']['Enums']['experience_level'];
  p_focus_areas?: Database['public']['Enums']['focus_area_type'][];
  p_integrations?: Database['public']['Enums']['integration_type'][];
  teamSize?: string;
  timestamp?: string;
  toolPreferences: string[];
  useCase: Database['public']['Enums']['use_case_type'];
}

type RecommendationResponse = Database['public']['Functions']['get_recommendations']['Returns'] & {
  answers: DecodedQuizAnswers;
  generatedAt: string;
  id: string;
};

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
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'ResultsDisplay' });

  const { results, summary, total_matches, answers } = recommendations;

  const handleSaveAll = useCallback(() => {
    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal
      openAuthModal({
        valueProposition: 'Sign in to save recommendations',
        redirectTo: pathname ?? undefined,
      });
      return;
    }

    // User is authenticated - proceed with save action
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
                  globalThis.location.href = '/account/library';
                },
              },
            }
          );
        } else {
          toasts.error.saveFailed();
        }
      } catch (error) {
        // Check if error is auth-related and show modal if so
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
          openAuthModal({
            valueProposition: 'Sign in to save recommendations',
            redirectTo: pathname ?? undefined,
          });
        } else {
          // Non-auth errors - show toast with retry option
          toasts.raw.error('Failed to save recommendations', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleSaveAll();
              },
            },
          });
        }
      }
    });
  }, [user, status, openAuthModal, pathname, results]);

  const filteredResults = (results ?? [])
    .filter((r) => selectedCategory === 'all' || r.category === selectedCategory)
    .filter((r) => (r.match_score ?? 0) >= minScore)
    .slice(0, maxResults);

  const categories = ['all', ...new Set((results ?? []).map((r) => r.category).filter(Boolean))];

  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2}>
          <Sparkles className={`${UI_CLASSES.ICON_LG} text-primary`} />
          <h1 className="text-3xl font-bold md:text-4xl">Your Personalized Recommendations</h1>
        </div>

        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Based on your preferences, we found{' '}
          <strong>{total_matches ?? 0} matching configurations</strong>. Here are the top{' '}
          {results?.length ?? 0} best fits for your needs.
        </p>

        <div className="flex-wrap items-center justify-center gap-3">
          <UnifiedBadge variant="base" style="secondary" className="text-sm">
            <TrendingUp className={UI_CLASSES.ICON_XS_LEADING} />
            {(summary?.avg_match_score ?? 0).toFixed(0)}% Avg Match
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="secondary" className="text-sm">
            <BarChart className={UI_CLASSES.ICON_XS_LEADING} />
            {(summary?.diversity_score ?? 0).toFixed(0)}% Diversity
          </UnifiedBadge>
          <UnifiedBadge variant="base" style="outline" className="text-sm">
            Top Category:{' '}
            {summary?.top_category && isValidCategory(summary.top_category)
              ? getCategoryConfig(summary.top_category)?.typeName ?? summary.top_category
              : summary?.top_category ?? 'General'}
          </UnifiedBadge>
        </div>

        <div className="flex-wrap items-center justify-center gap-3">
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
                  <span className="text-sm font-medium">Minimum Match Score</span>
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
                  <span className="text-sm font-medium">Maximum Results</span>
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
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <span className="text-sm font-medium">Use Case</span>
              <p className="text-muted-foreground mt-1 text-sm capitalize">
                {String(answers.useCase).replace('-', ' ')}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Experience Level</span>
              <p className="text-muted-foreground mt-1 text-sm capitalize">
                {String(answers.experienceLevel)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Tool Preferences</span>
              <p className="text-muted-foreground mt-1 text-sm">
                {Array.isArray(answers.toolPreferences) ? answers.toolPreferences.join(', ') : ''}
              </p>
            </div>
            {answers.p_integrations &&
            Array.isArray(answers.p_integrations) &&
            answers.p_integrations.length > 0 ? (
              <div>
                <span className="text-sm font-medium">Integrations</span>
                <p className="text-muted-foreground mt-1 text-sm">
                  {answers.p_integrations.join(', ')}
                </p>
              </div>
            ) : null}
            {answers.p_focus_areas &&
            Array.isArray(answers.p_focus_areas) &&
            answers.p_focus_areas.length > 0 ? (
              <div>
                <span className="text-sm font-medium">Focus Areas</span>
                <p className="text-muted-foreground mt-1 text-sm">
                  {answers.p_focus_areas.join(', ')}
                </p>
              </div>
            ) : null}
            {answers.teamSize ? (
              <div>
                <span className="text-sm font-medium">Team Size</span>
                <p className="text-muted-foreground mt-1 text-sm capitalize">
                  {String(answers.teamSize)}
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="h-auto flex-wrap">
          {categories.map((category) => {
            const count =
              category === 'all'
                ? (results?.length ?? 0)
                : (results ?? []).filter((r) => r.category === category).length;
            const displayName =
              category === 'all'
                ? 'All Results'
                : category && isValidCategory(category)
                  ? getCategoryConfig(category)?.typeName ?? category
                  : category ?? 'all';
            return (
              <TabsTrigger key={category ?? 'all'} value={category ?? 'all'}>
                {displayName} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  !(allowedCategories.includes(result.category) && slugPattern.test(result.slug))
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
                    <div className={`${POSITION_PATTERNS.ABSOLUTE_TOP_RIGHT_OFFSET_XL} z-10`}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <UnifiedBadge
                              variant="base"
                              style="secondary"
                              className={`${getMatchScoreColor(matchScore)} px-3 py-1 text-base font-bold`}
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

                    {rank !== null && rank <= 3 && (
                      <div className={`${POSITION_PATTERNS.ABSOLUTE_TOP_LEFT_OFFSET_XL} z-10`}>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          <Award className={UI_CLASSES.ICON_XS_LEADING} />#{rank}
                        </UnifiedBadge>
                      </div>
                    )}

                    <div className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_RIGHT_OFFSET} z-10`}>
                      <BookmarkButton
                        contentType={result.category}
                        contentSlug={result.slug}
                        initialBookmarked={false}
                        onAuthRequired={() => {
                          openAuthModal({
                            valueProposition: 'Sign in to save recommendations',
                            redirectTo: window.location.pathname,
                          });
                        }}
                      />
                    </div>

                    <div
                      className={`${POSITION_PATTERNS.ABSOLUTE_INSET} bg-linear-to-br ${getMatchGradient(matchScore)} pointer-events-none opacity-50`}
                    />

                    <Link href={targetPath}>
                      <BaseCard
                        targetPath={targetPath}
                        displayTitle={result.title}
                        description={result.description}
                        ariaLabel={`${result.title} - ${matchScore}% match`}
                        {...(tags.length > 0 ? { tags } : {})}
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
                              className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_2} bg-accent/50 mb-3 rounded-lg p-3`}
                            >
                              <Info
                                className={`text-primary h-4 w-4 ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                              />
                              <div>
                                <p className="text-sm font-medium">Why recommended:</p>
                                <p className="text-muted-foreground text-sm">{primaryReason}</p>
                              </div>
                            </div>

                            {reasons.length > 1 && (
                              <div className="flex flex-wrap gap-1">
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
                            className="group -mx-4 mt-2 -mb-4 w-full"
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

      {showShareModal ? (
        <ShareResults
          shareUrl={shareUrl}
          resultCount={results?.length ?? 0}
          onClose={() => setShowShareModal(false)}
        />
      ) : null}
    </div>
  );
}
