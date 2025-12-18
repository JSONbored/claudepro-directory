'use client';

/**
 * ConfigCard Component
 *
 * Comprehensive content card component with runtime-tunable behaviors.
 * Displays content items (agents, MCP servers, hooks, etc.) with rich metadata,
 * actions, and interactive features.
 *
 * Architecture:
 * - Client-side only (uses hooks, Next.js router)
 * - Accepts app-specific components/hooks as props (Button, BookmarkButton, etc.)
 * - Uses web-runtime utilities extensively
 * - Structured logging throughout
 * - Performance optimized with React.memo
 *
 * Features:
 * - Search highlighting (server-side pre-highlighted HTML)
 * - Swipe gestures for mobile (copy/bookmark)
 * - View Transitions API support
 * - Featured content indicators
 * - Rating display
 * - Sponsored content tracking
 * - Pinboard integration
 * - Copy actions (link, pnpm command, config JSON)
 * - External links (repository, documentation)
 * - Border beam animation for featured items
 *
 * Usage:
 * ```tsx
 * import { ConfigCard } from '@heyclaude/web-runtime/ui';
 * import { Button } from '@/components/ui/button';
 *
 * <ConfigCard
 *   item={contentItem}
 *   Button={Button}
 *   BookmarkButton={BookmarkButton}
 *   // ... other app-specific components
 * />
 * ```
 */

import type { experience_level, content_category } from '@heyclaude/data-layer/prisma';
import { ExperienceLevel, ContentCategory } from '@heyclaude/data-layer/prisma';
import { ensureStringArray, getMetadata } from '../../../utils/content-helpers.ts';
import { getCategoryDisplayName } from '../../../utils/category-display-names.ts';
// Import client-safe utilities directly from content.ts
import { formatViewCount, getContentItemUrl } from '../../../content.ts';
import { isValidCategory } from '../../../utils/category-validation.ts';
import { normalizeError, logClientError, logClientWarn } from '../../../logging/client';
import { useCopyToClipboard } from '../../../hooks/use-copy-to-clipboard.ts';
import { usePulse } from '../../../hooks/use-pulse.ts';
import { usePinboard } from '../../../hooks/use-pinboard.ts';
import { useComponentCardConfig } from '../../../hooks/use-component-card-config.tsx';
import { useAuthenticatedUser } from '../../../hooks/use-authenticated-user.ts';
import { Button } from '../button.tsx';
import { BookmarkButton } from '../buttons/bookmark-button.tsx';
import { SimpleCopyButton } from '../buttons/simple-copy-button.tsx';
import { BorderBeam } from '../animation/border-beam.tsx';
import { ReviewRatingCompact } from '../feedback/review-rating-compact.tsx';
import {
  Award,
  ExternalLink,
  Eye,
  FileJson,
  Github,
  Layers,
  Pin,
  Sparkles,
} from '../../../icons.tsx';
import type { ConfigCardProps, ContentItem } from '../../../types/component.types.ts';
// COLORS removed - using direct Tailwind utilities
import { getDisplayTitle } from '../../utils.ts';
import { toasts } from '../../../client/toast.ts';
import { BaseCard, type BaseCardProps } from './base-card.tsx';
import { HighlightedText } from '../highlighted-text.tsx';
import { UnifiedBadge } from '../badges/unified-badge.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip.tsx';
import { MICROINTERACTIONS } from '../../../design-system/index.ts';
import {
  getSafeRepositoryUrl,
  isSafeCategoryAndSlug,
  isTrustedDocumentationUrl,
  isValidInternalPath,
} from '../../../utils/url-validation.ts';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Types are now exported from their respective modules:
// - ComponentCardConfig from hooks/use-component-card-config.tsx
// - UsePinboardReturn from hooks/use-pinboard.ts
// - BookmarkButtonProps from ui/components/buttons/bookmark-button.tsx

// Component prop types are now exported from their respective modules:
// - SimpleCopyButton props from ui/components/buttons/simple-copy-button.tsx
// - BorderBeam props from ui/components/animation/border-beam.tsx
// - ReviewRatingCompact props from ui/components/feedback/review-rating-compact.tsx

/**
 * ConfigCard props (no longer needs app-specific components - uses web-runtime directly)
 */
export interface GenericConfigCardProps extends ConfigCardProps {
  item: ConfigCardProps['item'];
}

// Experience level validation helper
function isExperienceLevel(
  value: unknown
): value is experience_level {
  const EXPERIENCE_LEVEL_VALUES = Object.values(ExperienceLevel) as readonly experience_level[];
  return (
    typeof value === 'string' &&
    EXPERIENCE_LEVEL_VALUES.includes(value as experience_level)
  );
}

/**
 * ConfigCard component
 *
 * Comprehensive content card with runtime-tunable behaviors.
 * Accepts app-specific components and hooks as props for full flexibility.
 */
export const ConfigCard = memo(
  ({
    item,
    variant = 'default',
    showCategory = true,
    showActions = true,
    enableSwipeGestures = true,
    useViewTransitions = true,
    showBorderBeam,
    searchQuery,
    onAuthRequired,
    initialBookmarked,
  }: GenericConfigCardProps) => {
    try {
      const displayTitle = getDisplayTitle({
        title: 'title' in item ? (typeof item.title === 'string' ? item.title : null) : null,
        slug: 'slug' in item ? (typeof item.slug === 'string' ? item.slug : null) : null,
        category: 'category' in item && isValidCategory(item.category) ? item.category : null,
      });
      const cardCategory: content_category = isValidCategory(
        item.category ?? ContentCategory.agents
      )
        ? ((item.category ?? ContentCategory.agents) as content_category)
        : ContentCategory.agents;
      const cardSlug = typeof item.slug === 'string' ? item.slug : null;
      const { togglePin, isPinned } = usePinboard();
      const cardConfig = useComponentCardConfig();
      const pinned = cardSlug ? isPinned(cardCategory, cardSlug) : false;

      // Use pre-highlighted HTML from edge function (unified-search)
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
          return tags.map((tag: string, index: number) => ({
            original: tag,
            highlighted: <HighlightedText html={highlightedTagsArray[index] || tag} fallback={tag} />,
          }));
        }

        return tags.map((tag: string) => ({
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

      const metadata = useMemo(() => getMetadata(item as ContentItem), [item]);
      const configurationObject =
        metadata['configuration'] && typeof metadata['configuration'] === 'object'
          ? metadata['configuration']
          : null;

      // Initialize all hooks at the top level
      const pulse = usePulse();
      const router = useRouter();
      const { user, status } = useAuthenticatedUser({ context: 'ConfigCard' });
      const { copy: copyLink } = useCopyToClipboard({
        context: {
          component: 'ConfigCard',
          action: 'swipe_copy',
        },
      });

      // Track highlight visibility for analytics
      const hasTrackedHighlight = useRef(false);

      // Extract position metadata
      const position: number | undefined =
        'position' in item && typeof item.position === 'number' ? item.position : undefined;

      // Track card clicks
      const handleCardClickPulse = useCallback(() => {
        if (!item.slug) return;
        const category = isValidCategory(item.category ?? ContentCategory.agents)
          ? (item.category ?? ContentCategory.agents)
          : ContentCategory.agents;
        pulse
          .click({
            category: category as content_category,
            slug: item.slug,
            metadata: {
              action: 'card_click',
              source: 'card_grid',
              ...(position !== undefined && { position }),
              ...(searchQuery?.trim() && { search_query: searchQuery.trim() }),
            },
          })
          .catch((error) => {
            logClientError('ConfigCard: card click pulse failed', normalizeError(error), 'ConfigCard.handleCardClick', {
              category: (item.category ?? ContentCategory.agents) as content_category,
              slug: item.slug ?? '',
            });
          });
      }, [pulse, item.category, item.slug, position, searchQuery]);

      useEffect(() => {
        if (searchQuery?.trim() && !hasTrackedHighlight.current) {
          const hasHighlights =
            ('title_highlighted' in item && item.title_highlighted) ||
            ('description_highlighted' in item && item.description_highlighted) ||
            ('tags_highlighted' in item && item.tags_highlighted) ||
            ('author_highlighted' in item && item.author_highlighted);

          if (hasHighlights && item.slug) {
            hasTrackedHighlight.current = true;
            const category = isValidCategory(item.category ?? ContentCategory.agents)
              ? (item.category ?? ContentCategory.agents)
              : ContentCategory.agents;
            pulse
              .search({
                category: category as content_category,
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
                logClientError('ConfigCard: highlight analytics pulse failed', normalizeError(error), 'ConfigCard.handleHighlight', {
                  category: category as content_category,
                  slug: item.slug ?? '',
                });
              });
          }
        }
      }, [searchQuery, item, pulse]);

      // Compute targetPath early
      const targetPath = item.slug
        ? getContentItemUrl({
            category: (isValidCategory(item.category ?? ContentCategory.agents)
              ? (item.category ?? ContentCategory.agents)
              : ContentCategory.agents) as content_category,
            slug: item.slug,
            subcategory:
              'subcategory' in item ? (item.subcategory as string | null | undefined) : undefined,
          })
        : '';

      // Swipe gesture handlers
      const handleSwipeRightCopy = useCallback(async () => {
        if (!(item.slug && targetPath)) return;
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`;
        await copyLink(url);

        const category = isValidCategory(item.category ?? ContentCategory.agents)
          ? (item.category ?? ContentCategory.agents)
          : ContentCategory.agents;
        pulse
          .copy({
            category: category as content_category,
            slug: item.slug,
          })
          .catch((error) => {
            logClientError('ConfigCard: swipe copy pulse failed', normalizeError(error), 'ConfigCard.handleSwipeLeftCopy', {
              category: category as content_category,
              slug: item.slug ?? undefined,
            });
          });

        toasts.success.copied();
      }, [targetPath, copyLink, item, pulse]);

      const handleSwipeLeftBookmark = useCallback(async () => {
        if (!item.slug) return;

        // Proactive auth check - show modal before attempting action
        if (status === 'loading') {
          // Wait for auth check to complete
          return;
        }

        if (!user) {
          // User is not authenticated - use callback if provided, otherwise show toast with action button
          if (onAuthRequired) {
            onAuthRequired();
          } else {
            // Fallback toast with "Sign In" button (for backwards compatibility)
            toasts.raw.error('Please sign in to bookmark this', {
              action: {
                label: 'Sign In',
                onClick: () => {
                  if (typeof window !== 'undefined') {
                    window.location.href = `/login?redirect=${window.location.pathname}`;
                  }
                },
              },
            });
          }
          return;
        }

        const categoryValue = item.category ?? ContentCategory.agents;
        if (!isValidCategory(categoryValue)) {
          const normalized = normalizeError(
            'Invalid content type',
            'Invalid content type for bookmark'
          );
          logClientError('Invalid content type for bookmark', normalized, 'ConfigCard.handleSwipeLeftBookmark', {
            component: 'ConfigCard',
            contentType: categoryValue,
            contentSlug: item.slug,
          });
          toasts.error.fromError(new Error(`Invalid content type: ${categoryValue}`));
          return;
        }

        const validatedCategory = categoryValue as content_category;

        // User is authenticated - proceed with bookmark action
        try {
          // Use API route instead of server action to avoid HMR issues
          const response = await fetch('/api/bookmarks/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content_type: validatedCategory,
              content_slug: item.slug,
              notes: '',
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `API returned ${response.status}`);
          }

          const result = await response.json();

          if (result?.data?.success) {
            toasts.success.bookmarkAdded();

            pulse
              .bookmark({
                category: validatedCategory,
                slug: item.slug,
                action: 'add',
              })
              .catch((error) => {
                logClientWarn('ConfigCard: bookmark addition pulse failed', error, 'ConfigCard.handleSwipeLeftBookmark', {
                  category: validatedCategory,
                  slug: item.slug ?? undefined,
                });
              });

            router.refresh();
          }
        } catch (error) {
          const normalized = normalizeError(error, 'ConfigCard: Failed to add bookmark via swipe');
          logClientError('ConfigCard: Failed to add bookmark via swipe', normalized, 'ConfigCard.handleSwipeLeftBookmark', {
            component: 'ConfigCard',
            contentType: validatedCategory,
            contentSlug: item.slug,
          });
          if (error instanceof Error && error.message.includes('signed in')) {
            // Auth error - use callback if provided, otherwise show toast with action button
            if (onAuthRequired) {
              onAuthRequired();
            } else {
              // Fallback toast with "Sign In" button (for backwards compatibility)
              toasts.raw.error('Please sign in to bookmark this', {
                action: {
                  label: 'Sign In',
                  onClick: () => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/login?redirect=${window.location.pathname}`;
                    }
                  },
                },
              });
            }
          } else {
            // Non-auth errors - show toast with retry option
            toasts.raw.error('Failed to bookmark', {
              action: {
                label: 'Retry',
                onClick: () => {
                  handleSwipeLeftBookmark();
                },
              },
            });
          }
        }
      }, [item.category, item.slug, router, pulse, user, status, onAuthRequired]);

      const copyInlineValue = useCallback(
        async (value: string, successDescription: string, metadata?: Record<string, unknown>) => {
          try {
            if (navigator?.clipboard?.writeText) {
              await navigator.clipboard.writeText(value);
            } else {
              await copyLink(value);
            }
            toasts.raw.success('Copied!', { description: successDescription });
            if (cardSlug) {
              pulse
                .copy({
                  category: cardCategory,
                  slug: cardSlug,
                  ...(metadata ? { metadata } : {}),
                })
                .catch((error) => {
                  const normalized = normalizeError(error, 'Failed to track copy action');
                  logClientWarn('[Clipboard] Failed to track copy action', normalized, 'ConfigCard.copyInlineValue', {
                    category: 'clipboard',
                    component: 'ConfigCard',
                    nonCritical: true,
                    context: 'config_card_quick_copy',
                    itemCategory: cardCategory,
                    itemSlug: cardSlug,
                  });
                });
            }
          } catch (error) {
            const normalized = normalizeError(error, 'ConfigCard: quick action copy failed');
            logClientWarn('[Clipboard] Quick action copy failed', normalized, 'ConfigCard.copyInlineValue', {
              category: 'clipboard',
              component: 'ConfigCard',
              recoverable: true,
              userRetryable: true,
            });
            // Show error toast with "Retry" button
            // Note: Retry will attempt to copy the same value again
            toasts.raw.error('Copy failed', {
              description: 'Unable to copy to clipboard.',
              action: {
                label: 'Retry',
                onClick: () => {
                  // Retry with the same value (user may need to click copy button again if value is not available)
                  copyInlineValue(value, successDescription, metadata).catch(() => {
                    // Error already handled in copyInlineValue
                  });
                },
              },
            });
          }
        },
        [cardCategory, cardSlug, copyLink, pulse]
      );

      const handlePinToggle = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          if (!cardSlug) {
            toasts.raw.error('Unable to save item', {
              description: 'Missing identifier for this configuration.',
            });
            return;
          }

          const pinPayload = {
            category: cardCategory,
            slug: cardSlug,
            title: displayTitle || cardSlug,
            description: typeof item.description === 'string' ? item.description.slice(0, 240) : '',
            typeName: item.category ?? 'configuration',
            tags,
          };

          try {
            togglePin(pinPayload);
            toasts.raw.success(pinned ? 'Removed from pinboard' : 'Pinned for later', {
              description: pinned
                ? 'Removed from your local pinboard.'
                : 'Open the pinboard to review your saved configs.',
            });
          } catch (error) {
            const normalized = normalizeError(error, 'ConfigCard: failed to toggle pinboard state');
            logClientError('ConfigCard: failed to toggle pinboard state', normalized, 'ConfigCard.handlePinToggle', {
              component: 'ConfigCard',
            });
            // Show error toast with "Retry" button
            toasts.raw.error('Unable to update pinboard', {
              description: 'Please try again.',
              action: {
                label: 'Retry',
                onClick: () => {
                  // Retry with the same pin payload
                  try {
                    togglePin(pinPayload);
                    toasts.raw.success(pinned ? 'Removed from pinboard' : 'Pinned for later', {
                      description: pinned
                        ? 'Removed from your local pinboard.'
                        : 'Open the pinboard to review your saved configs.',
                    });
                  } catch (retryError) {
                    // Error will be handled by the toast above if it fails again
                    const retryNormalized = normalizeError(retryError, 'ConfigCard: retry pinboard toggle failed');
                    logClientError('ConfigCard: retry pinboard toggle failed', retryNormalized, 'ConfigCard.handlePinToggle.retry', {
                      component: 'ConfigCard',
                    });
                  }
                },
              },
            });
          }
        },
        [
          cardCategory,
          cardSlug,
          displayTitle,
          item.description,
          item.category,
          tags,
          togglePin,
          pinned,
        ]
      );

      const viewCount =
        'view_count' in item && typeof item.view_count === 'number' ? item.view_count : undefined;
      const copyCount =
        'copy_count' in item && typeof item.copy_count === 'number' ? item.copy_count : undefined;
      const bookmarkCount =
        'bookmark_count' in item && typeof item.bookmark_count === 'number'
          ? item.bookmark_count
          : undefined;

      // Extract featured metadata
      const featuredData = (item as { _featured?: { rank: number; score: number } })._featured;
      const isFeatured = !!featuredData;
      const featuredRank = featuredData?.rank;

      // Auto-enable border beam for featured items if not explicitly set
      const shouldShowBeam = showBorderBeam !== undefined ? showBorderBeam : isFeatured;

      // Extract rating metadata
      const ratingData = (item as { _rating?: { average: number; count: number } })._rating;
      const hasRating = ratingData && ratingData.count > 0;

      // Extract collection-specific metadata
      const isCollection = item.category === ContentCategory.collections;
      const collectionType = 'collectionType' in item ? item.collectionType : undefined;
      const collectionDifficulty = 'difficulty' in item ? item.difficulty : undefined;
      const itemCount = 'itemCount' in item ? item.itemCount : undefined;

      // Collection type label mapping
      const COLLECTION_TYPE_LABELS = isCollection
        ? {
            'starter-kit': 'Starter Kit',
            workflow: 'Workflow',
            'advanced-system': 'Advanced System',
            'use-case': 'Use Case',
          }
        : undefined;

      const baseCardProps: BaseCardProps = {
        targetPath,
        displayTitle: highlightedTitle,
        description: highlightedDescription,
        ...('author' in item && item.author
          ? {
              author: highlightedAuthor ?? item.author,
            }
          : {}),
        ...('author_profile_url' in item && item.author_profile_url
          ? { authorProfileUrl: item.author_profile_url }
          : {}),
        ...('source' in item && item.source ? { source: item.source as string } : {}),
        ...(tags.length
          ? {
              tags: highlightedTags.map((t) => t.original),
              ...(highlightedTags.length > 0 ? { highlightedTags } : {}),
            }
          : {}),
        variant,
        showActions,
        ariaLabel: `${displayTitle} - ${item.category ?? 'content'} by ${('author' in item && item.author) || 'Community'}`,
        enableSwipeGestures,
        onSwipeRight: handleSwipeRightCopy,
        onSwipeLeft: handleSwipeLeftBookmark,
        useViewTransitions,
        ...(item.slug ? { viewTransitionSlug: item.slug } : {}),
        onBeforeNavigate: handleCardClickPulse,
        renderTopBadges: () => {
          const rawCategory = item.category ?? ContentCategory.agents;
          const category: content_category = isValidCategory(
            rawCategory
          )
            ? (rawCategory as content_category)
            : ContentCategory.agents;
          return (
            <>
              {showCategory && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="overflow-visible">
                        <UnifiedBadge variant="category" category={category}>
                          {/* Display name is automatically handled by UnifiedBadge (rules → "CLAUDE.md") */}
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getCategoryDisplayName(category).pluralTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryDisplayName(category).description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Collection-specific badges */}
              {isCollection && collectionType && COLLECTION_TYPE_LABELS && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className={`text-xs font-semibold ${
                            collectionType === 'starter-kit' ? 'bg-color-badge-collectiontype-starter-kit-bg text-color-badge-collectiontype-starter-kit-text border-color-badge-collectiontype-starter-kit-border' :
                            collectionType === 'workflow' ? 'bg-color-badge-collectiontype-workflow-bg text-color-badge-collectiontype-workflow-text border-color-badge-collectiontype-workflow-border' :
                            collectionType === 'advanced-system' ? 'bg-color-badge-collectiontype-advanced-system-bg text-color-badge-collectiontype-advanced-system-text border-color-badge-collectiontype-advanced-system-border' :
                            collectionType === 'use-case' ? 'bg-color-badge-collectiontype-use-case-bg text-color-badge-collectiontype-use-case-text border-color-badge-collectiontype-use-case-border' :
                            ''
                          }`}
                        >
                          <Layers className="mr-1 h-3 w-3" aria-hidden="true" />
                          {COLLECTION_TYPE_LABELS[collectionType as keyof typeof COLLECTION_TYPE_LABELS]}
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Collection type: {COLLECTION_TYPE_LABELS[collectionType as keyof typeof COLLECTION_TYPE_LABELS]}</p>
                      <p className="text-xs text-muted-foreground">Type of collection content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {isCollection &&
                collectionDifficulty &&
                typeof collectionDifficulty === 'string' &&
                isExperienceLevel(collectionDifficulty) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <UnifiedBadge
                            variant="base"
                            style="outline"
                            className={`text-xs font-semibold ${
                              collectionDifficulty === 'beginner' ? 'bg-color-badge-difficulty-beginner-bg text-color-badge-difficulty-beginner-text border-color-badge-difficulty-beginner-border' :
                              collectionDifficulty === 'intermediate' ? 'bg-color-badge-difficulty-intermediate-bg text-color-badge-difficulty-intermediate-text border-color-badge-difficulty-intermediate-border' :
                              collectionDifficulty === 'advanced' ? 'bg-color-badge-difficulty-advanced-bg text-color-badge-difficulty-advanced-text border-color-badge-difficulty-advanced-border' :
                              ''
                            }`}
                          >
                            {collectionDifficulty}
                          </UnifiedBadge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Experience level: {collectionDifficulty}</p>
                        <p className="text-xs text-muted-foreground">
                          {collectionDifficulty === 'beginner' 
                            ? 'Suitable for users new to Claude'
                            : collectionDifficulty === 'intermediate'
                            ? 'Requires some Claude experience'
                            : 'For power users and developers'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

              {isCollection && itemCount !== undefined && typeof itemCount === 'number' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <UnifiedBadge
                          variant="base"
                          style="outline"
                          className="border-muted-foreground/20 text-xs font-semibold text-muted-foreground"
                        >
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Collection contains {itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Featured badge */}
              {isFeatured && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="isolate text-color-featured-text-dark border-color-featured-border bg-gradient-to-r from-color-featured-gradient-from to-color-featured-gradient-to"
                      >
                        <UnifiedBadge
                          variant="base"
                          style="secondary"
                          className="fade-in slide-in-from-top-2 animate-in gap-1 font-semibold shadow-sm transition-all duration-300 hover:from-amber-500/15 hover:to-yellow-500/15 hover:shadow-md"
                        >
                          {featuredRank && featuredRank <= 3 ? (
                            <Award
                              className="h-3 w-3 text-amber-500"
                              aria-hidden="true"
                            />
                          ) : (
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                          )}
                          Featured
                          {featuredRank && <span className="text-xs opacity-75">#{featuredRank}</span>}
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Featured by our team</p>
                      <p className="text-xs text-muted-foreground">
                        {featuredRank 
                          ? `Ranked #${featuredRank} in featured content`
                          : 'Hand-picked by our team'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* New indicator */}
              {'isNew' in item && item.isNew && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <UnifiedBadge variant="new-indicator" label="New content" className="ml-0.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New content</p>
                      <p className="text-xs text-muted-foreground">Added or updated within the last 7 days</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          );
        },
        renderMetadataBadges: () => (
          <>
            {/* Rating badge */}
            {cardConfig.showRating && hasRating && ratingData && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                        }
                      }}
                      className="cursor-default border-0 bg-transparent p-0"
                      aria-label={`Average rating: ${ratingData.average.toFixed(1)} based on ${ratingData.count} reviews`}
                    >
                      <ReviewRatingCompact
                        average={ratingData.average}
                        count={ratingData.count}
                        size="sm"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average rating: {ratingData.average.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">
                      Based on {ratingData.count} {ratingData.count === 1 ? 'review' : 'reviews'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view reviews</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        ),
        renderActions: () => (
          <>
            {/* Group 1: External Links */}
            <div className="flex items-center gap-1">
              {'repository' in item && item.repository ? (
                <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!item.slug) return;
                        const category = isValidCategory(item.category ?? ContentCategory.agents)
                          ? (item.category ?? ContentCategory.agents)
                          : ContentCategory.agents;
                        pulse
                          .click({
                            category: category as content_category,
                            slug: item.slug,
                            metadata: {
                              action: 'external_link',
                              link_type: 'github',
                              target_url: item.repository as string,
                            },
                          })
                          .catch((error) => {
                            logClientError('ConfigCard: GitHub link click pulse failed', normalizeError(error), 'ConfigCard.handleGitHubClick', {
                              category: category as content_category,
                              slug: item.slug ?? undefined,
                            });
                          });
                        const safeRepoUrl = getSafeRepositoryUrl(item.repository as string);
                        if (safeRepoUrl) {
                          window.open(safeRepoUrl, '_blank');
                          toasts.raw.success('Opening repository', {
                            description: 'Opening in new tab...',
                          });
                        } else {
                          logClientWarn('ConfigCard: Unsafe repository URL blocked', undefined, 'ConfigCard.handleRepositoryClick', {
                            url: item.repository,
                            slug: item.slug,
                          });
                          toasts.raw.error('Repository link is invalid or untrusted.');
                        }
                      }}
                      aria-label={`View ${displayTitle} repository on GitHub`}
                    >
                      <Github className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View repository on GitHub</p>
                    <p className="text-xs text-muted-foreground">Opens in new tab</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              ) : null}

              {'documentation_url' in item && item.documentation_url ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!item.slug) return;
                          const category = isValidCategory(item.category ?? ContentCategory.agents)
                            ? (item.category ?? ContentCategory.agents)
                            : ContentCategory.agents;
                          pulse
                            .click({
                              category: category as content_category,
                              slug: item.slug,
                              metadata: {
                                action: 'external_link',
                                link_type: 'documentation',
                                target_url: item.documentation_url as string,
                              },
                            })
                            .catch((error) => {
                              logClientError('ConfigCard: documentation link click pulse failed', normalizeError(error), 'ConfigCard.handleDocClick', {
                                category,
                                slug: item.slug ?? undefined,
                              });
                            });
                          const safeDocUrl = isTrustedDocumentationUrl(item.documentation_url as string);
                          if (safeDocUrl) {
                            window.open(safeDocUrl, '_blank');
                            toasts.raw.success('Opening documentation', {
                              description: 'Opening in new tab...',
                            });
                          } else {
                            logClientWarn('ConfigCard: Blocked untrusted documentation URL', undefined, 'ConfigCard.handleDocumentationClick', {
                              url: item.documentation_url,
                            });
                            toasts.raw.error?.('Invalid or unsafe documentation link.', {
                              description: 'Documentation link is not available.',
                            });
                          }
                        }}
                        aria-label={`View ${displayTitle} documentation`}
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View documentation</p>
                      <p className="text-xs text-muted-foreground">Opens in new tab</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>

            {/* Group 2: Primary Actions (Bookmark, Pin) */}
            <div className="flex items-center gap-1">
              {/* Bookmark button */}
            {cardConfig.showBookmark && (
              <div className="relative">
                {item.slug && (
                  <BookmarkButton
                    contentType={
                      isValidCategory(item.category ?? ContentCategory.agents)
                        ? (item.category as content_category)
                        : ContentCategory.agents
                    }
                    contentSlug={item.slug}
                    {...(initialBookmarked !== undefined ? { initialBookmarked } : {})}
                    {...(onAuthRequired ? { onAuthRequired } : {})}
                  />
                )}
                {bookmarkCount !== undefined && bookmarkCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <UnifiedBadge
                            variant="notification-count"
                            count={bookmarkCount}
                            type="bookmark"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{bookmarkCount} {bookmarkCount === 1 ? 'user has' : 'users have'} bookmarked this</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Pin button */}
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={pinned ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`h-7 w-7 p-0 ${pinned ? '' : 'hover:bg-accent/10 hover:text-accent'}`}
                      onClick={handlePinToggle}
                      aria-label={pinned ? 'Unpin from pinboard' : 'Pin to pinboard'}
                    >
                      <AnimatePresence mode="wait">
                        {pinned ? (
                          <motion.div
                            key="pinned"
                            initial={MICROINTERACTIONS.iconTransition.initial}
                            animate={MICROINTERACTIONS.iconTransition.animate}
                            exit={MICROINTERACTIONS.iconTransition.exit}
                            transition={MICROINTERACTIONS.iconTransition.transition}
                            className="text-color-accent-primary"
                          >
                            <Pin className="h-3 w-3" fill="currentColor" aria-hidden="true" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="unpinned"
                            initial={MICROINTERACTIONS.iconTransition.initial}
                            animate={MICROINTERACTIONS.iconTransition.animate}
                            exit={MICROINTERACTIONS.iconTransition.exit}
                            transition={MICROINTERACTIONS.iconTransition.transition}
                          >
                            <Pin className="h-3 w-3" aria-hidden="true" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{pinned ? 'Unpin from pinboard' : 'Pin to pinboard'}</p>
                    <p className="text-xs text-muted-foreground">
                      {pinned ? 'Remove from saved items' : 'Save for later without an account'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            </div>

            {/* Group 3: Copy Actions */}
            <div className="flex items-center gap-1">
              {/* Config copy button */}
            {configurationObject && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyInlineValue(
                          JSON.stringify(configurationObject, null, 2),
                          'Configuration JSON copied',
                          {
                            action_type: 'copy_configuration',
                          }
                        ).catch((error) => {
                          const normalized = normalizeError(error, 'Failed to copy configuration');
                          logClientWarn('[Clipboard] Copy configuration failed', normalized, 'ConfigCard.handleConfigCopy', {
                            category: 'clipboard',
                            component: 'ConfigCard',
                            recoverable: true,
                            userRetryable: true,
                          });
                        });
                      }}
                      aria-label="Copy configuration JSON"
                    >
                      <FileJson className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy configuration JSON</p>
                    <p className="text-xs text-muted-foreground">Copies the full config to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Copy button */}
            {cardConfig.showCopyButton && (
              <div className="relative">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <SimpleCopyButton
                          content={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
                          successMessage="Link copied to clipboard!"
                          errorMessage="Failed to copy link"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          iconClassName="h-3 w-3"
                          ariaLabel={`Copy link to ${displayTitle}`}
                          onCopySuccess={() => {
                            const category: content_category =
                              isValidCategory(item.category ?? ContentCategory.agents)
                                ? (item.category as content_category)
                                : ContentCategory.agents;
                            if (item.slug) {
                              pulse.copy({ category, slug: item.slug }).catch((error) => {
                                logClientError('ConfigCard: copy button pulse failed', normalizeError(error), 'ConfigCard.handleCopyButton', {
                                  category,
                                  slug: item.slug ?? undefined,
                                });
                              });
                            }
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy link</p>
                      <p className="text-xs text-muted-foreground">Share this item</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {cardConfig.showCopyCount && copyCount !== undefined && copyCount > 0 && (
                  <UnifiedBadge variant="notification-count" count={copyCount} type="copy" />
                )}
              </div>
            )}
            </div>

            {/* Group 4: View Action */}
            <div className="flex items-center gap-1">
              {/* View button */}
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSafeCategoryAndSlug(item.category, item.slug)) {
                          if (!isValidInternalPath(targetPath)) {
                            logClientWarn('ConfigCard: Blocked invalid internal path', undefined, 'ConfigCard.handleInternalLinkClick', {
                              attemptedCategory: item.category,
                              attemptedSlug: item.slug,
                              targetPath,
                            });
                            return;
                          }
                          window.location.href = targetPath;
                        } else {
                          logClientWarn('ConfigCard: Blocked potentially unsafe redirect', undefined, 'ConfigCard.handleInternalLinkClick', {
                      attemptedCategory: item.category,
                      attemptedSlug: item.slug,
                      targetPath,
                    });
                  }
                        }}
                        aria-label={`View details for ${displayTitle}${cardConfig.showViewCount && viewCount !== undefined && typeof viewCount === 'number' ? ` - ${formatViewCount(viewCount)}` : ''}`}
                      >
                        <Eye className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View details</p>
                      <p className="text-xs text-muted-foreground">
                        {cardConfig.showViewCount && viewCount !== undefined && typeof viewCount === 'number'
                          ? `Viewed ${viewCount.toLocaleString()} ${viewCount === 1 ? 'time' : 'times'}`
                          : 'Open full page'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {cardConfig.showViewCount &&
                  viewCount !== undefined &&
                  typeof viewCount === 'number' &&
                  viewCount > 0 && (
                    <UnifiedBadge variant="notification-count" count={viewCount} type="view" />
                  )}
              </div>
            </div>
          </>
        ),
        ...(viewCount === undefined &&
        'popularity' in item &&
        typeof item.popularity === 'number'
          ? {
              customMetadataText: (
                <>
                  <span>?</span>
                  <span>{item.popularity}% popular</span>
                </>
              ),
            }
          : {}),
      };

      return (
        <div className="relative">
          {/* BorderBeam animation */}
          {shouldShowBeam && (
            <BorderBeam
              size={200}
              duration={15}
              colorFrom={featuredRank === 1 ? '#ffaa40' : '#9333ea'}
              colorTo={featuredRank === 1 ? '#ffd700' : '#a855f7'}
              borderWidth={1.5}
            />
          )}

          <BaseCard {...baseCardProps} />
        </div>
      );
    } catch (error) {
      const normalized = normalizeError(error, 'ConfigCard: Rendering failed');
      logClientWarn('[Render] ConfigCard rendering failed', normalized, 'ConfigCard.render', {
        category: 'render',
        component: 'ConfigCard',
        recoverable: true,
        hasSlug: Boolean(item.slug),
        hasCategory: Boolean(item.category),
      });
      // Return minimal fallback
      return (
        <div className="rounded-lg border p-4" role="article">
          <h3 className="font-semibold">
            {'title' in item && typeof item.title === 'string' ? item.title : 'Content'}
          </h3>
          {'description' in item && item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
      );
    }
  }
);

ConfigCard.displayName = 'ConfigCard';
