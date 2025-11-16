'use client';

/** ConfigCard consuming componentConfigs for runtime-tunable card behaviors */

import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkButton } from '@/src/components/core/buttons/interaction/bookmark-button';
import { SimpleCopyButton } from '@/src/components/core/buttons/shared/simple-copy-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { HighlightedText } from '@/src/components/core/shared/highlighted-text';
import { BorderBeam } from '@/src/components/primitives/animation/border-beam';
import { ReviewRatingCompact } from '@/src/components/primitives/feedback/review-rating-compact';
import { Button } from '@/src/components/primitives/ui/button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { usePulse } from '@/src/hooks/use-pulse';
import { getComponentConfig } from '@/src/lib/actions/feature-flags.actions';
import { addBookmark } from '@/src/lib/actions/user.actions';
import { type CategoryId, isValidCategory } from '@/src/lib/data/config/category';
import { Award, ExternalLink, Eye, Github, Layers, Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import type { ConfigCardProps } from '@/src/lib/types/component.types';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { formatViewCount, getContentItemUrl } from '@/src/lib/utils/content.utils';
import { ensureStringArray } from '@/src/lib/utils/data.utils';
import { logClientWarning, logUnhandledPromise } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ContentCategory, ExperienceLevel } from '@/src/types/database-overrides';

export const ConfigCard = memo(
  ({
    item,
    variant = 'default',
    showCategory = true,
    showActions = true,
    enableSwipeGestures = true, // Enable mobile swipe gestures (copy/bookmark)
    useViewTransitions = true, // Enable smooth page morphing with View Transitions API (Baseline as of October 2025)
    showBorderBeam, // Auto-enable for featured items if not explicitly set
    searchQuery, // Optional search query for highlighting
  }: ConfigCardProps) => {
    const displayTitle = getDisplayTitle(item);

    // Use pre-highlighted HTML from edge function (unified-search)
    // All highlighting is now done server-side at the edge
    const highlightedTitle = useMemo(() => {
      if ('title_highlighted' in item && item.title_highlighted) {
        return <HighlightedText html={item.title_highlighted as string} fallback={displayTitle} />;
      }
      return displayTitle;
    }, [displayTitle, item]);

    const highlightedDescription = useMemo(() => {
      if ('description_highlighted' in item && item.description_highlighted && item.description) {
        return (
          <HighlightedText
            html={item.description_highlighted as string}
            fallback={item.description}
          />
        );
      }
      return item.description;
    }, [item.description, item]);

    // Get tags from item
    const tags = ensureStringArray(
      'tags' in item ? (item.tags as string[] | null | undefined) : []
    );

    // Use pre-highlighted tags from edge function
    const highlightedTags = useMemo(() => {
      if (!tags.length) return [];

      if ('tags_highlighted' in item && item.tags_highlighted) {
        const highlightedTagsArray = item.tags_highlighted as string[];
        return tags.map((tag, index) => ({
          original: tag,
          highlighted: <HighlightedText html={highlightedTagsArray[index] || tag} fallback={tag} />,
        }));
      }

      // No highlighting - return original tags
      return tags.map((tag) => ({
        original: tag,
        highlighted: tag,
      }));
    }, [tags, item]);

    // Use pre-highlighted author from edge function
    const highlightedAuthor = useMemo(() => {
      if (!('author' in item && item.author)) {
        return null;
      }

      if ('author_highlighted' in item && item.author_highlighted) {
        return <HighlightedText html={item.author_highlighted as string} fallback={item.author} />;
      }

      return item.author;
    }, [item]);

    // Initialize pulse hook (must be before useEffect that uses it)
    const pulse = usePulse();

    // Track highlight visibility for analytics (fire and forget)
    const hasTrackedHighlight = useRef(false);
    useEffect(() => {
      if (searchQuery?.trim() && !hasTrackedHighlight.current) {
        // Check if any highlighting occurred (edge function provides pre-highlighted fields)
        const hasHighlights =
          ('title_highlighted' in item && item.title_highlighted) ||
          ('description_highlighted' in item && item.description_highlighted) ||
          ('tags_highlighted' in item && item.tags_highlighted) ||
          ('author_highlighted' in item && item.author_highlighted);

        if (hasHighlights) {
          hasTrackedHighlight.current = true;
          // Track highlight interaction (non-blocking)
          pulse
            .search({
              category: item.category as ContentCategory,
              slug: item.slug,
              query: searchQuery.trim(),
              metadata: {
                has_title_highlight: Boolean('title_highlighted' in item && item.title_highlighted),
                has_description_highlight: Boolean(
                  'description_highlighted' in item &&
                    item.description_highlighted &&
                    item.description
                ),
                has_tag_highlight: Boolean('tags_highlighted' in item && item.tags_highlighted),
                has_author_highlight: Boolean(
                  'author_highlighted' in item && item.author_highlighted
                ),
              },
            })
            .catch((error) => {
              logUnhandledPromise('ConfigCard: highlight analytics pulse failed', error, {
                category: item.category,
                slug: item.slug,
              });
            });
        }
      }
    }, [searchQuery, item, pulse]);
    const targetPath = getContentItemUrl({
      category: item.category as CategoryId,
      slug: item.slug,
      subcategory:
        'subcategory' in item ? (item.subcategory as string | null | undefined) : undefined,
    });
    const router = useRouter();

    // Extract position metadata (needed for click tracking)
    const position: number | undefined =
      'position' in item && typeof item.position === 'number' ? item.position : undefined;

    // Track card clicks
    const handleCardClickPulse = useCallback(() => {
      pulse
        .click({
          category: item.category as ContentCategory,
          slug: item.slug,
          metadata: {
            action: 'card_click',
            source: 'card_grid',
            ...(position !== undefined && { position }),
            ...(searchQuery?.trim() && { search_query: searchQuery.trim() }),
          },
        })
        .catch((error) => {
          logUnhandledPromise('ConfigCard: card click pulse failed', error, {
            category: item.category,
            slug: item.slug,
          });
        });
    }, [pulse, item.category, item.slug, position, searchQuery]);

    const { copy } = useCopyToClipboard({
      context: {
        component: 'ConfigCard',
        action: 'swipe_copy',
      },
    });

    const [cardConfig, setCardConfig] = useState({
      showCopyButton: true,
      showBookmark: true,
      showViewCount: true,
      showCopyCount: true,
      showRating: false,
    });

    useEffect(() => {
      getComponentConfig({})
        .then((result) => {
          if (!result?.data) return;
          const config = result.data;
          setCardConfig({
            showCopyButton: config['cards.show_copy_button'],
            showBookmark: config['cards.show_bookmark'],
            showViewCount: config['cards.show_view_count'],
            showCopyCount: config['cards.show_copy_count'],
            showRating: config['cards.show_rating'],
          });
        })
        .catch((error) => {
          logClientWarning('ConfigCard: failed to load component config', error);
        });
    }, []);

    // Swipe gesture handlers for mobile quick actions
    const handleSwipeRightCopy = useCallback(async () => {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`;
      await copy(url);

      // Track user interaction for analytics and personalization
      pulse.copy({ category: item.category as ContentCategory, slug: item.slug }).catch((error) => {
        logUnhandledPromise('ConfigCard: swipe copy pulse failed', error, {
          category: item.category,
          slug: item.slug,
        });
      });

      toasts.success.copied();
    }, [targetPath, copy, item.category, item.slug, pulse]);

    const handleSwipeLeftBookmark = useCallback(async () => {
      // Type guard validation
      if (!isValidCategory(item.category)) {
        logger.error('Invalid content type for bookmark', new Error('Invalid content type'), {
          contentType: item.category,
          contentSlug: item.slug,
        });
        toasts.error.fromError(new Error(`Invalid content type: ${item.category}`));
        return;
      }

      const validatedCategory = item.category;

      try {
        const result = await addBookmark({
          content_type: validatedCategory,
          content_slug: item.slug,
        });

        if (result?.data?.success) {
          toasts.success.bookmarkAdded();

          // Track bookmark addition
          pulse
            .bookmark({
              category: validatedCategory,
              slug: item.slug,
              action: 'add',
            })
            .catch((error) => {
              logClientWarning('ConfigCard: bookmark addition pulse failed', error, {
                category: item.category,
                slug: item.slug,
              });
            });

          router.refresh();
        }
      } catch (error) {
        logger.error('ConfigCard: Failed to add bookmark via swipe', error as Error, {
          contentType: validatedCategory,
          contentSlug: item.slug,
        });
        if (error instanceof Error && error.message.includes('signed in')) {
          toasts.error.authRequired();
        } else {
          toasts.error.actionFailed('bookmark');
        }
      }
    }, [item.category, item.slug, router, pulse]);

    // Extract sponsored metadata - ContentItem already includes these properties (when from enriched RPC)
    const isSponsored: boolean | undefined =
      'isSponsored' in item && typeof item.isSponsored === 'boolean' ? item.isSponsored : undefined;
    const sponsoredId: string | undefined =
      'sponsoredId' in item && typeof item.sponsoredId === 'string' ? item.sponsoredId : undefined;
    const sponsorTier = 'sponsorTier' in item ? item.sponsorTier : undefined;
    const viewCount = 'viewCount' in item ? item.viewCount : undefined;

    // copyCount is a runtime property added by analytics (not in schema)
    const copyCount = (item as { copyCount?: number }).copyCount;

    // bookmarkCount is a runtime property added by analytics (not in schema)
    const bookmarkCount = (item as { bookmarkCount?: number }).bookmarkCount;

    // Extract featured metadata (weekly algorithm selection)
    // Note: _featured is a computed property added by trending algorithm, not in schema
    const featuredData = (item as { _featured?: { rank: number; score: number } })._featured;
    const isFeatured = !!featuredData;
    const featuredRank = featuredData?.rank;

    // Auto-enable border beam for featured items if not explicitly set
    const shouldShowBeam = showBorderBeam !== undefined ? showBorderBeam : isFeatured;

    // Extract rating metadata (if available)
    // Note: _rating is a computed property added by rating aggregator, not in schema
    const ratingData = (item as { _rating?: { average: number; count: number } })._rating;
    const hasRating = ratingData && ratingData.count > 0;

    // Extract collection-specific metadata (tree-shakeable - only loaded for collections)
    const isCollection = item.category === ('collections' as const);
    const collectionType = 'collectionType' in item ? item.collectionType : undefined;
    const collectionDifficulty = 'difficulty' in item ? item.difficulty : undefined;
    const itemCount = 'itemCount' in item ? item.itemCount : undefined;
    // Tags already declared above

    // Collection type label mapping (tree-shakeable)
    const COLLECTION_TYPE_LABELS = isCollection
      ? {
          'starter-kit': 'Starter Kit',
          workflow: 'Workflow',
          'advanced-system': 'Advanced System',
          'use-case': 'Use Case',
        }
      : undefined;

    return (
      <div className="relative">
        {/* BorderBeam animation - auto-enabled for featured items */}
        {shouldShowBeam && (
          <BorderBeam
            size={200}
            duration={15}
            colorFrom={featuredRank === 1 ? '#ffaa40' : '#9333ea'}
            colorTo={featuredRank === 1 ? '#ffd700' : '#a855f7'}
            borderWidth={1.5}
          />
        )}

        <BaseCard
          targetPath={targetPath}
          displayTitle={highlightedTitle}
          description={highlightedDescription}
          {...('author' in item && item.author
            ? {
                author: highlightedAuthor ?? item.author,
              }
            : {})}
          {...('author_profile_url' in item && item.author_profile_url
            ? { authorProfileUrl: item.author_profile_url }
            : {})}
          {...('source' in item && item.source ? { source: item.source as string } : {})}
          {...(tags.length
            ? {
                tags: highlightedTags.map((t) => t.original),
                ...(highlightedTags.length > 0 ? { highlightedTags } : {}),
              }
            : {})}
          variant={variant}
          showActions={showActions}
          ariaLabel={`${displayTitle} - ${item.category} by ${('author' in item && item.author) || 'Community'}`}
          {...(isSponsored !== undefined ? { isSponsored } : {})}
          {...(sponsoredId !== undefined ? { sponsoredId } : {})}
          {...(position !== undefined ? { position } : {})}
          enableSwipeGestures={enableSwipeGestures}
          onSwipeRight={handleSwipeRightCopy}
          onSwipeLeft={handleSwipeLeftBookmark}
          useViewTransitions={useViewTransitions}
          viewTransitionSlug={item.slug}
          onBeforeNavigate={handleCardClickPulse}
          renderTopBadges={() => {
            // Runtime type guard ensures category is valid CategoryId (excludes 'changelog' and 'jobs')
            // Type assertion is safe because isValidCategory() validates at runtime
            const rawCategory = item.category;
            const category: CategoryId = (isValidCategory(rawCategory)
              ? rawCategory
              : 'agents') as unknown as CategoryId;
            return (
              <>
                {showCategory && (
                  <UnifiedBadge variant="category" category={category}>
                    {(() => {
                      const cat = item.category as ContentCategory;
                      switch (cat) {
                        case 'mcp':
                          return 'MCP';
                        case 'agents':
                          return 'Agent';
                        case 'commands':
                          return 'Command';
                        case 'hooks':
                          return 'Hook';
                        case 'rules':
                          return 'Rule';
                        case 'statuslines':
                          return 'Statusline';
                        case 'collections':
                          return 'Collection';
                        case 'guides':
                          return 'Guide';
                        case 'skills':
                          return 'Skill';
                        case 'jobs':
                          return 'Job';
                        case 'changelog':
                          return 'Changelog';
                        default:
                          return 'Agent';
                      }
                    })()}
                  </UnifiedBadge>
                )}

                {/* Collection-specific badges (tree-shakeable) */}
                {isCollection && collectionType && COLLECTION_TYPE_LABELS && (
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className={`${UI_CLASSES.TEXT_BADGE} ${BADGE_COLORS.collectionType[collectionType as keyof typeof BADGE_COLORS.collectionType] || ''}`}
                  >
                    <Layers className={UI_CLASSES.ICON_XS_LEADING} aria-hidden="true" />
                    {COLLECTION_TYPE_LABELS[collectionType as keyof typeof COLLECTION_TYPE_LABELS]}
                  </UnifiedBadge>
                )}

                {isCollection &&
                  collectionDifficulty &&
                  (collectionDifficulty === 'beginner' ||
                    collectionDifficulty === 'intermediate' ||
                    collectionDifficulty === 'advanced') && (
                    <UnifiedBadge
                      variant="base"
                      style="outline"
                      className={`${UI_CLASSES.TEXT_BADGE} ${BADGE_COLORS.difficulty[collectionDifficulty as ExperienceLevel]}`}
                    >
                      {collectionDifficulty}
                    </UnifiedBadge>
                  )}

                {isCollection && itemCount !== undefined && typeof itemCount === 'number' && (
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className={`${UI_CLASSES.BADGE_METADATA} ${UI_CLASSES.TEXT_BADGE}`}
                  >
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </UnifiedBadge>
                )}

                {/* Featured badge - weekly algorithm selection */}
                {isFeatured && (
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className={`fade-in slide-in-from-top-2 animate-in ${UI_CLASSES.SPACE_TIGHT} font-semibold shadow-sm transition-all duration-300 hover:from-amber-500/15 hover:to-yellow-500/15 hover:shadow-md ${SEMANTIC_COLORS.FEATURED}`}
                  >
                    {featuredRank && featuredRank <= 3 ? (
                      <Award
                        className={`${UI_CLASSES.ICON_XS} text-amber-500`}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                    )}
                    Featured
                    {featuredRank && <span className="text-xs opacity-75">#{featuredRank}</span>}
                  </UnifiedBadge>
                )}
                {isSponsored && sponsorTier && (
                  <UnifiedBadge
                    variant="sponsored"
                    tier={sponsorTier as 'featured' | 'promoted' | 'spotlight'}
                    showIcon={true}
                  />
                )}

                {/* New indicator - 0-7 days old content (server-computed) */}
                {'isNew' in item && item.isNew && (
                  <UnifiedBadge variant="new-indicator" label="New content" className="ml-0.5" />
                )}
              </>
            );
          }}
          renderMetadataBadges={() => (
            <>
              {/* Rating badge - shows average rating and count */}
              {cardConfig.showRating && hasRating && ratingData && (
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="cursor-default border-0 bg-transparent p-0"
                >
                  <ReviewRatingCompact
                    average={ratingData.average}
                    count={ratingData.count}
                    size="sm"
                  />
                </button>
              )}
            </>
          )}
          renderActions={() => (
            <>
              {'repository' in item && item.repository && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    pulse
                      .click({
                        category: item.category as ContentCategory,
                        slug: item.slug,
                        metadata: {
                          action: 'external_link',
                          link_type: 'github',
                          target_url: item.repository as string,
                        },
                      })
                      .catch((error) => {
                        logUnhandledPromise('ConfigCard: GitHub link click pulse failed', error, {
                          category: item.category,
                          slug: item.slug,
                        });
                      });
                    window.open(item.repository as string, '_blank');
                  }}
                  aria-label={`View ${displayTitle} repository on GitHub`}
                >
                  <Github className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                </Button>
              )}

              {'documentation_url' in item && item.documentation_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    pulse
                      .click({
                        category: item.category as ContentCategory,
                        slug: item.slug,
                        metadata: {
                          action: 'external_link',
                          link_type: 'documentation',
                          target_url: item.documentation_url as string,
                        },
                      })
                      .catch((error) => {
                        logUnhandledPromise(
                          'ConfigCard: documentation link click pulse failed',
                          error,
                          {
                            category: item.category,
                            slug: item.slug,
                          }
                        );
                      });
                    window.open(item.documentation_url as string, '_blank');
                  }}
                  aria-label={`View ${displayTitle} documentation`}
                >
                  <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                </Button>
              )}

              {/* Bookmark button with count overlay */}
              {cardConfig.showBookmark && (
                <div className="relative">
                  <BookmarkButton
                    contentType={isValidCategory(item.category) ? item.category : 'agents'}
                    contentSlug={item.slug}
                  />
                  {bookmarkCount !== undefined && bookmarkCount > 0 && (
                    <UnifiedBadge
                      variant="notification-count"
                      count={bookmarkCount}
                      type="bookmark"
                    />
                  )}
                </div>
              )}

              {/* Copy button with count overlay */}
              {cardConfig.showCopyButton && (
                <div className="relative">
                  <SimpleCopyButton
                    content={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
                    successMessage="Link copied to clipboard!"
                    errorMessage="Failed to copy link"
                    variant="ghost"
                    size="sm"
                    className={UI_CLASSES.ICON_BUTTON_SM}
                    iconClassName={UI_CLASSES.ICON_XS}
                    ariaLabel={`Copy link to ${displayTitle}`}
                    onCopySuccess={() => {
                      pulse
                        .copy({ category: item.category as ContentCategory, slug: item.slug })
                        .catch((error) => {
                          logUnhandledPromise('ConfigCard: copy button pulse failed', error, {
                            category: item.category,
                            slug: item.slug,
                          });
                        });
                    }}
                  />
                  {cardConfig.showCopyCount && copyCount !== undefined && copyCount > 0 && (
                    <UnifiedBadge variant="notification-count" count={copyCount} type="copy" />
                  )}
                </div>
              )}

              {/* View button with count overlay */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = targetPath;
                  }}
                  aria-label={`View details for ${displayTitle}${cardConfig.showViewCount && viewCount !== undefined && typeof viewCount === 'number' ? ` - ${formatViewCount(viewCount)}` : ''}`}
                >
                  <Eye className={UI_CLASSES.ICON_XS} aria-hidden="true" />
                </Button>
                {cardConfig.showViewCount &&
                  viewCount !== undefined &&
                  typeof viewCount === 'number' &&
                  viewCount > 0 && (
                    <UnifiedBadge variant="notification-count" count={viewCount} type="view" />
                  )}
              </div>
            </>
          )}
          customMetadataText={
            viewCount === undefined &&
            'popularity' in item &&
            typeof item.popularity === 'number' ? (
              <>
                <span>?</span>
                <span>{item.popularity}% popular</span>
              </>
            ) : undefined
          }
        />
      </div>
    );
  }
);

ConfigCard.displayName = 'ConfigCard';
