'use client';

/** ConfigCard consuming componentConfigs for runtime-tunable card behaviors */

import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';
import { BookmarkButton } from '@/src/components/core/buttons/interaction/bookmark-button';
import { SimpleCopyButton } from '@/src/components/core/buttons/shared/simple-copy-button';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { BorderBeam } from '@/src/components/primitives/animation/border-beam';
import { ReviewRatingCompact } from '@/src/components/primitives/feedback/review-rating-compact';
import { Button } from '@/src/components/primitives/ui/button';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';
import { getComponentConfig } from '@/src/lib/actions/feature-flags.actions';
import { addBookmark } from '@/src/lib/actions/user.actions';
import { type CategoryId, isValidCategory } from '@/src/lib/data/config/category';
import { trackInteraction } from '@/src/lib/edge/client';
import { Award, ExternalLink, Eye, Github, Layers, Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { SEMANTIC_COLORS } from '@/src/lib/semantic-colors';
import type { ConfigCardProps } from '@/src/lib/types/component.types';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { formatViewCount, getContentItemUrl } from '@/src/lib/utils/content.utils';
import { logClientWarning, logUnhandledPromise } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';

export const ConfigCard = memo(
  ({
    item,
    variant = 'default',
    showCategory = true,
    showActions = true,
    enableSwipeGestures = true, // Enable mobile swipe gestures (copy/bookmark)
    useViewTransitions = true, // Enable smooth page morphing with View Transitions API (Baseline as of October 2025)
    showBorderBeam, // Auto-enable for featured items if not explicitly set
  }: ConfigCardProps) => {
    const displayTitle = getDisplayTitle(item);
    const targetPath = getContentItemUrl({
      category: item.category as CategoryId,
      slug: item.slug,
      subcategory:
        'subcategory' in item ? (item.subcategory as string | null | undefined) : undefined,
    });
    const router = useRouter();
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
      getComponentConfig()
        .then((config) => {
          setCardConfig({
            showCopyButton: (config['cards.show_copy_button'] as boolean) ?? true,
            showBookmark: (config['cards.show_bookmark'] as boolean) ?? true,
            showViewCount: (config['cards.show_view_count'] as boolean) ?? true,
            showCopyCount: (config['cards.show_copy_count'] as boolean) ?? true,
            showRating: (config['cards.show_rating'] as boolean) ?? false,
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
      trackInteraction({
        interaction_type: 'copy',
        content_type: item.category,
        content_slug: item.slug,
      }).catch((error) => {
        logUnhandledPromise('ConfigCard: swipe copy tracking failed', error, {
          category: item.category,
          slug: item.slug,
        });
      });

      toasts.success.copied();
    }, [targetPath, copy, item.category, item.slug]);

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
    }, [item.category, item.slug, router]);

    // Extract sponsored metadata - ContentItem already includes these properties (when from enriched RPC)
    const isSponsored: boolean | undefined =
      'isSponsored' in item && typeof item.isSponsored === 'boolean' ? item.isSponsored : undefined;
    const sponsoredId: string | undefined =
      'sponsoredId' in item && typeof item.sponsoredId === 'string' ? item.sponsoredId : undefined;
    const sponsorTier = 'sponsorTier' in item ? item.sponsorTier : undefined;
    const position: number | undefined =
      'position' in item && typeof item.position === 'number' ? item.position : undefined;
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
    const isCollection = item.category === 'collections';
    const collectionType = 'collectionType' in item ? item.collectionType : undefined;
    const collectionDifficulty = 'difficulty' in item ? item.difficulty : undefined;
    const itemCount = 'itemCount' in item ? item.itemCount : undefined;

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
          displayTitle={displayTitle}
          description={item.description}
          {...('author' in item && item.author ? { author: item.author } : {})}
          {...('author_profile_url' in item && item.author_profile_url
            ? { authorProfileUrl: item.author_profile_url }
            : {})}
          {...('source' in item && item.source ? { source: item.source as string } : {})}
          {...('tags' in item && item.tags && Array.isArray(item.tags)
            ? { tags: item.tags as string[] }
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
          renderTopBadges={() => (
            <>
              {showCategory && (
                <UnifiedBadge
                  variant="category"
                  category={
                    (item.category || 'agents') as
                      | 'hooks'
                      | 'agents'
                      | 'mcp'
                      | 'rules'
                      | 'commands'
                      | 'guides'
                      | 'collections'
                      | 'skills'
                      | 'statuslines'
                  }
                >
                  {item.category === 'mcp'
                    ? 'MCP'
                    : item.category === 'agents'
                      ? 'Agent'
                      : item.category === 'commands'
                        ? 'Command'
                        : item.category === 'hooks'
                          ? 'Hook'
                          : item.category === 'rules'
                            ? 'Rule'
                            : item.category === 'statuslines'
                              ? 'Statusline'
                              : item.category === 'collections'
                                ? 'Collection'
                                : item.category === 'guides'
                                  ? 'Guide'
                                  : item.category === 'skills'
                                    ? 'Skill'
                                    : 'Agent'}
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
                    className={`${UI_CLASSES.TEXT_BADGE} ${BADGE_COLORS.difficulty[collectionDifficulty as 'beginner' | 'intermediate' | 'advanced']}`}
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
                    <Award className={`${UI_CLASSES.ICON_XS} text-amber-500`} aria-hidden="true" />
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
                  showIcon
                />
              )}

              {/* New indicator - 0-7 days old content (server-computed) */}
              {'isNew' in item && item.isNew && (
                <UnifiedBadge variant="new-indicator" label="New content" className="ml-0.5" />
              )}
            </>
          )}
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
                  <BookmarkButton contentType={item.category || 'agents'} contentSlug={item.slug} />
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
                      trackInteraction({
                        interaction_type: 'copy',
                        content_type: item.category,
                        content_slug: item.slug,
                      }).catch((error) => {
                        logUnhandledPromise('ConfigCard: copy button tracking failed', error, {
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
