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

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { addBookmark } from '../../../actions/add-bookmark.generated.ts';
import {
  ensureStringArray,
  formatViewCount,
  getContentItemUrl,
  getMetadata,
  isValidCategory,
  logClientWarning,
  logger,
  logUnhandledPromise,
  normalizeError,
} from '../../../entries/core.ts';
import { useCopyToClipboard, usePulse, usePinboard, useComponentCardConfig } from '../../../hooks/index.ts';
import { Button } from '../button.tsx';
import { BookmarkButton } from '../buttons/bookmark-button.tsx';
import { SimpleCopyButton } from '../buttons/simple-copy-button.tsx';
import { BorderBeam } from '../animation/border-beam.tsx';
import { UseCountBadgeCompact } from '../voting/use-count-badge.tsx';
import {
  Award,
  ExternalLink,
  Eye,
  FileJson,
  Github,
  Layers,
  Pencil,
  Pin,
  PinOff,
  Sparkles,
} from '../../../icons.tsx';
import type { ConfigCardProps, ContentItem } from '../../../types/component.types.ts';
import { ContentIndicators } from '../indicators/content-indicators.tsx';
// Design System imports
import { cluster, padding, position, marginLeft } from '../../../design-system/styles/layout.ts';
import { iconSize, iconLeading } from '../../../design-system/styles/icons.ts';
import { buttonSize, buttonGhost } from '../../../design-system/styles/buttons.ts';
import { badge, size, weight, muted } from '../../../design-system/styles/typography.ts';
import { collectionTypeBadge, difficultyBadge } from '../../../design-system/styles/badges.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { shadow, opacityLevel } from '../../../design-system/styles/effects.ts';
import { borderColor, bgColor, textColor } from '../../../design-system/styles/colors.ts';
import { transition } from '../../../design-system/styles/interactive.ts';
import { gradientFrom, gradientTo, stateColor } from '../../../design-system/styles/colors.ts';
import { getDisplayTitle } from '../../utils.ts';
import { toasts } from '../../../client/toast.ts';
import { BaseCard, type BaseCardProps } from './base-card.tsx';
import { HighlightedText } from '../highlighted-text.tsx';
import { UnifiedBadge } from '../badges/unified-badge.tsx';
import {
  getSafeRepositoryUrl,
  isSafeCategoryAndSlug,
  isTrustedDocumentationUrl,
  isValidInternalPath,
} from '../../../utils/url-validation.ts';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

// GitHub repository URL for suggest edit feature
const GITHUB_REPO_URL = 'https://github.com/JSONbored/claudepro-directory';

// Categories that should not have the "Suggest Edit" button
const NON_EDITABLE_CATEGORIES = ['jobs', 'changelog'] as const;

// Types are now exported from their respective modules:
// - ComponentCardConfig from hooks/use-component-card-config.tsx
// - UsePinboardReturn from hooks/use-pinboard.ts
// - BookmarkButtonProps from ui/components/buttons/bookmark-button.tsx

// Component prop types are now exported from their respective modules:
// - SimpleCopyButton props from ui/components/buttons/simple-copy-button.tsx
// - BorderBeam props from ui/components/animation/border-beam.tsx
// - UseCountBadgeCompact props from ui/components/voting/use-count-badge.tsx

/**
 * ConfigCard props (no longer needs app-specific components - uses web-runtime directly)
 */
export interface GenericConfigCardProps extends ConfigCardProps {
  item: ConfigCardProps['item'];
}

// Experience level validation helper
function isExperienceLevel(
  value: unknown
): value is Database['public']['Enums']['experience_level'] {
  const EXPERIENCE_LEVEL_VALUES = Constants.public.Enums.experience_level;
  return (
    typeof value === 'string' &&
    EXPERIENCE_LEVEL_VALUES.includes(value as Database['public']['Enums']['experience_level'])
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
  }: GenericConfigCardProps) => {
    try {
      const displayTitle = getDisplayTitle({
        title: 'title' in item ? (typeof item.title === 'string' ? item.title : null) : null,
        slug: 'slug' in item ? (typeof item.slug === 'string' ? item.slug : null) : null,
        category: 'category' in item && isValidCategory(item.category) ? item.category : null,
      });
      const cardCategory: Database['public']['Enums']['content_category'] = isValidCategory(
        item.category ?? Constants.public.Enums.content_category[0]
      )
        ? ((item.category ?? Constants.public.Enums.content_category[0]) as Database['public']['Enums']['content_category'])
        : Constants.public.Enums.content_category[0];
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
      const { copy: copyLink } = useCopyToClipboard({
        context: {
          component: 'ConfigCard',
          action: 'swipe_copy',
        },
      });

      // Track highlight visibility for analytics
      const hasTrackedHighlight = useRef(false);

      // Extract position metadata
      const itemPosition: number | undefined =
        'position' in item && typeof item.position === 'number' ? item.position : undefined;

      // Track card clicks
      const handleCardClickPulse = useCallback(() => {
        if (!item.slug) return;
        const category = isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
          ? (item.category ?? Constants.public.Enums.content_category[0])
          : Constants.public.Enums.content_category[0];
        pulse
          .click({
            category: category as Database['public']['Enums']['content_category'],
            slug: item.slug,
            metadata: {
              action: 'card_click',
              source: 'card_grid',
              ...(itemPosition !== undefined && { position: itemPosition }),
              ...(searchQuery?.trim() && { search_query: searchQuery.trim() }),
            },
          })
          .catch((error) => {
            logUnhandledPromise('ConfigCard: card click pulse failed', error, {
              category: (item.category ?? Constants.public.Enums.content_category[0]) as Database['public']['Enums']['content_category'],
              slug: item.slug ?? '',
            });
          });
      }, [pulse, item.category, item.slug, itemPosition, searchQuery]);

      useEffect(() => {
        if (searchQuery?.trim() && !hasTrackedHighlight.current) {
          const hasHighlights =
            ('title_highlighted' in item && item.title_highlighted) ||
            ('description_highlighted' in item && item.description_highlighted) ||
            ('tags_highlighted' in item && item.tags_highlighted) ||
            ('author_highlighted' in item && item.author_highlighted);

          if (hasHighlights && item.slug) {
            hasTrackedHighlight.current = true;
            const category = isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
              ? (item.category ?? Constants.public.Enums.content_category[0])
              : Constants.public.Enums.content_category[0];
            pulse
              .search({
                category: category as Database['public']['Enums']['content_category'],
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
                  category: category as Database['public']['Enums']['content_category'],
                  slug: item.slug ?? '',
                });
              });
          }
        }
      }, [searchQuery, item, pulse]);

      // Compute targetPath early
      const targetPath = item.slug
        ? getContentItemUrl({
            category: (isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
              ? (item.category ?? Constants.public.Enums.content_category[0])
              : Constants.public.Enums.content_category[0]) as Database['public']['Enums']['content_category'],
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

        const category = isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
          ? (item.category ?? Constants.public.Enums.content_category[0])
          : Constants.public.Enums.content_category[0];
        pulse
          .copy({
            category: category as Database['public']['Enums']['content_category'],
            slug: item.slug,
          })
          .catch((error) => {
            logUnhandledPromise('ConfigCard: swipe copy pulse failed', error, {
              category: category as Database['public']['Enums']['content_category'],
              slug: item.slug ?? undefined,
            });
          });

        toasts.success.copied();
      }, [targetPath, copyLink, item, pulse]);

      const handleSwipeLeftBookmark = useCallback(async () => {
        if (!item.slug) return;
        const categoryValue = item.category ?? Constants.public.Enums.content_category[0];
        if (!isValidCategory(categoryValue)) {
          const normalized = normalizeError(
            'Invalid content type',
            'Invalid content type for bookmark'
          );
          logger.error('Invalid content type for bookmark', normalized, {
            component: 'ConfigCard',
            contentType: categoryValue,
            contentSlug: item.slug,
          });
          toasts.error.fromError(new Error(`Invalid content type: ${categoryValue}`));
          return;
        }

        const validatedCategory = categoryValue as Database['public']['Enums']['content_category'];

        try {
          const result = await addBookmark({
            content_type: validatedCategory,
            content_slug: item.slug,
            notes: '',
          });

          if (result?.data?.success) {
            toasts.success.bookmarkAdded();

            pulse
              .bookmark({
                category: validatedCategory,
                slug: item.slug,
                action: 'add',
              })
              .catch((error) => {
                logClientWarning('ConfigCard: bookmark addition pulse failed', error, {
                  category: validatedCategory,
                  slug: item.slug ?? undefined,
                });
              });

            router.refresh();
          }
        } catch (error) {
          const normalized = normalizeError(error, 'ConfigCard: Failed to add bookmark via swipe');
          logger.error('ConfigCard: Failed to add bookmark via swipe', normalized, {
            component: 'ConfigCard',
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
                  logger.warn('[Clipboard] Failed to track copy action', {
                    err: normalized,
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
            logger.warn('[Clipboard] Quick action copy failed', {
              err: normalized,
              category: 'clipboard',
              component: 'ConfigCard',
              recoverable: true,
              userRetryable: true,
            });
            toasts.raw.error('Copy failed', { description: 'Unable to copy to clipboard.' });
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
            logger.error('ConfigCard: failed to toggle pinboard state', normalized, {
              component: 'ConfigCard',
            });
            toasts.raw.error('Unable to update pinboard', {
              description: 'Please try again.',
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

      // Extract sponsored metadata
      const isSponsored: boolean | undefined =
        'is_sponsored' in item && typeof item.is_sponsored === 'boolean'
          ? item.is_sponsored
          : undefined;
      const sponsoredId: string | undefined =
        'sponsored_content_id' in item && typeof item.sponsored_content_id === 'string'
          ? item.sponsored_content_id
          : undefined;
      const sponsorTier: Database['public']['Enums']['sponsorship_tier'] | null | undefined =
        'sponsorship_tier' in item &&
        item.sponsorship_tier !== null &&
        item.sponsorship_tier !== undefined
          ? (item.sponsorship_tier as Database['public']['Enums']['sponsorship_tier'])
          : undefined;
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

      // Extract use_count for "I use this" badge
      const useCount = 'use_count' in item && typeof item.use_count === 'number' ? item.use_count : 0;
      const hasUseCount = useCount > 0;

      // Extract dates for freshness indicators
      const dateAdded = 'date_added' in item && typeof item.date_added === 'string' ? item.date_added : null;
      const updatedAt = 'updated_at' in item && typeof item.updated_at === 'string' ? item.updated_at : null;
      const itemSource = 'source' in item ? item.source as Database['public']['Enums']['content_source'] | null : null;

      // Extract collection-specific metadata
      const isCollection = item.category === Constants.public.Enums.content_category[8]; // 'collections'
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
        ...(isSponsored !== undefined ? { isSponsored } : {}),
        ...(sponsoredId !== undefined ? { sponsoredId } : {}),
        ...(position !== undefined ? { position } : {}),
        enableSwipeGestures,
        onSwipeRight: handleSwipeRightCopy,
        onSwipeLeft: handleSwipeLeftBookmark,
        useViewTransitions,
        ...(item.slug ? { viewTransitionSlug: item.slug } : {}),
        onBeforeNavigate: handleCardClickPulse,
        // Freshness and source indicators
        renderIndicators: () => (
          <ContentIndicators
            dateAdded={dateAdded}
            updatedAt={updatedAt}
            source={itemSource}
            showFreshness={true}
            showSource={true}
            size="sm"
          />
        ),
        renderTopBadges: () => {
          const rawCategory = item.category ?? Constants.public.Enums.content_category[0];
          const category: Database['public']['Enums']['content_category'] = isValidCategory(
            rawCategory
          )
            ? (rawCategory as Database['public']['Enums']['content_category'])
            : Constants.public.Enums.content_category[0];
          return (
            <>
              {showCategory && (
                <UnifiedBadge variant="category" category={category}>
                  {(() => {
                    switch (category) {
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

              {/* Collection-specific badges */}
              {isCollection && collectionType && COLLECTION_TYPE_LABELS && (
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className={`${badge.default} ${collectionTypeBadge[collectionType as keyof typeof collectionTypeBadge] || ''}`}
                >
                  <Layers className={iconLeading.xs} aria-hidden="true" />
                  {COLLECTION_TYPE_LABELS[collectionType as keyof typeof COLLECTION_TYPE_LABELS]}
                </UnifiedBadge>
              )}

              {isCollection &&
                collectionDifficulty &&
                typeof collectionDifficulty === 'string' &&
                isExperienceLevel(collectionDifficulty) && (
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className={`${badge.default} ${difficultyBadge[collectionDifficulty]}`}
                  >
                    {collectionDifficulty}
                  </UnifiedBadge>
                )}

              {isCollection && itemCount !== undefined && typeof itemCount === 'number' && (
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className={`${borderColor['border/50']} ${bgColor['muted/30']} ${muted.default} ${badge.default}`}
                >
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </UnifiedBadge>
              )}

              {/* Featured badge */}
              {isFeatured && (
                <UnifiedBadge
                  variant="base"
                  style="secondary"
                  className={`fade-in slide-in-from-top-2 animate-in ${cluster.tight} ${weight.semibold} ${shadow.sm} ${transition.all} duration-300 hover:${gradientFrom.amber15} hover:${gradientTo.yellow15} hover:${shadow.md} ${stateColor.featured.default}`}
                >
                  {featuredRank && featuredRank <= 3 ? (
                    <Award
                      className={`${iconSize.xs} ${textColor.amber}`}
                      aria-hidden="true"
                    />
                  ) : (
                    <Sparkles className={iconSize.xs} aria-hidden="true" />
                  )}
                  Featured
                  {featuredRank && <span className={`${size.xs} ${opacityLevel[75]}`}>#{featuredRank}</span>}
                </UnifiedBadge>
              )}
              {isSponsored && sponsorTier && (
                <UnifiedBadge variant="sponsored" tier={sponsorTier} showIcon={true} />
              )}

              {/* New indicator */}
              {'isNew' in item && item.isNew && (
                <UnifiedBadge variant="new-indicator" label="New content" className={marginLeft.micro} />
              )}
            </>
          );
        },
        renderMetadataBadges: () => (
          <>
            {/* "I use this" count badge */}
            {cardConfig.showUseCount && hasUseCount && (
              <UseCountBadgeCompact count={useCount} />
            )}
          </>
        ),
        renderActions: () => (
          <>
            {'repository' in item && item.repository && (
              <Button
                variant="ghost"
                size="sm"
                className={`${buttonSize.iconSm} ${buttonGhost.icon}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.slug) return;
                  const category = isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
                    ? (item.category ?? Constants.public.Enums.content_category[0])
                    : Constants.public.Enums.content_category[0];
                  pulse
                    .click({
                      category: category as Database['public']['Enums']['content_category'],
                      slug: item.slug,
                      metadata: {
                        action: 'external_link',
                        link_type: 'github',
                        target_url: item.repository as string,
                      },
                    })
                    .catch((error) => {
                      logUnhandledPromise('ConfigCard: GitHub link click pulse failed', error, {
                        category: category as Database['public']['Enums']['content_category'],
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
                    logClientWarning('ConfigCard: Unsafe repository URL blocked', {
                      url: item.repository,
                      slug: item.slug,
                    });
                    toasts.raw.error('Repository link is invalid or untrusted.');
                  }
                }}
                aria-label={`View ${displayTitle} repository on GitHub`}
                title="View on GitHub"
              >
                <Github className={iconSize.xs} aria-hidden="true" />
              </Button>
            )}

            {'documentation_url' in item && item.documentation_url && (
              <Button
                variant="ghost"
                size="sm"
                className={`${buttonSize.iconSm} ${buttonGhost.icon}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.slug) return;
                  const category = isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
                    ? (item.category ?? Constants.public.Enums.content_category[0])
                    : Constants.public.Enums.content_category[0];
                  pulse
                    .click({
                      category: category as Database['public']['Enums']['content_category'],
                      slug: item.slug,
                      metadata: {
                        action: 'external_link',
                        link_type: 'documentation',
                        target_url: item.documentation_url as string,
                      },
                    })
                    .catch((error) => {
                      logUnhandledPromise('ConfigCard: documentation link click pulse failed', error, {
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
                    logClientWarning('ConfigCard: Blocked untrusted documentation URL', {
                      url: item.documentation_url,
                    });
                    toasts.raw.error?.('Invalid or unsafe documentation link.', {
                      description: 'Documentation link is not available.',
                    });
                  }
                }}
                aria-label={`View ${displayTitle} documentation`}
                title="View documentation"
              >
                <ExternalLink className={iconSize.xs} aria-hidden="true" />
              </Button>
            )}

            {/* Suggest Edit button - only for user-editable content categories */}
            {item.slug &&
              cardCategory &&
              !NON_EDITABLE_CATEGORIES.includes(
                cardCategory as (typeof NON_EDITABLE_CATEGORIES)[number]
              ) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${buttonSize.iconSm} ${buttonGhost.icon}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    
                    // Build GitHub issue URL with pre-filled parameters
                    const issueTitle = encodeURIComponent(`[Edit Suggestion]: ${displayTitle || item.slug}`);
                    const issueBody = encodeURIComponent(
                      `## Edit Suggestion for ${displayTitle || item.slug}\n\n` +
                      `**Category:** ${cardCategory}\n` +
                      `**Slug:** ${item.slug}\n` +
                      `**URL:** ${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}\n\n` +
                      `### Suggested Changes\n\n` +
                      `<!-- Please describe what you'd like to change about this content -->\n\n` +
                      `### Reason for Change\n\n` +
                      `<!-- Why should this change be made? -->\n`
                    );
                    const issueLabels = encodeURIComponent('content-edit,community');
                    const editUrl = `${GITHUB_REPO_URL}/issues/new?title=${issueTitle}&body=${issueBody}&labels=${issueLabels}`;
                    
                    window.open(editUrl, '_blank', 'noopener,noreferrer');
                    
                    // Track the suggest edit click
                    pulse
                      .click({
                        category: cardCategory,
                        slug: item.slug!,
                        metadata: {
                          action: 'suggest_edit',
                          link_type: 'github_issue',
                          target_url: editUrl,
                        },
                      })
                      .catch((error) => {
                        logUnhandledPromise('ConfigCard: suggest edit click pulse failed', error, {
                          category: cardCategory,
                          slug: item.slug ?? undefined,
                        });
                      });
                    
                    toasts.raw.success('Opening GitHub', {
                      description: 'Suggest changes via a GitHub issue.',
                    });
                  }}
                  aria-label={`Suggest edit for ${displayTitle}`}
                  title="Suggest an edit"
                >
                  <Pencil className={iconSize.xs} aria-hidden="true" />
                </Button>
              )}

            {/* Bookmark button */}
            {cardConfig.showBookmark && (
              <div className={position.relative}>
                {item.slug && (
                  <BookmarkButton
                    contentType={
                      isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
                        ? (item.category as Database['public']['Enums']['content_category'])
                        : Constants.public.Enums.content_category[0]
                    }
                    contentSlug={item.slug}
                  />
                )}
                {bookmarkCount !== undefined && bookmarkCount > 0 && (
                  <UnifiedBadge
                    variant="notification-count"
                    count={bookmarkCount}
                    type="bookmark"
                  />
                )}
              </div>
            )}

            {/* Pin button */}
            <div className={position.relative}>
              <Button
                variant={pinned ? 'secondary' : 'ghost'}
                size="sm"
                className={`${buttonSize.iconSm} ${pinned ? '' : buttonGhost.icon}`}
                onClick={handlePinToggle}
                aria-label={pinned ? 'Unpin from pinboard' : 'Pin to pinboard'}
                title={pinned ? 'Unpin from pinboard' : 'Pin to pinboard'}
              >
                {pinned ? (
                  <Pin className={iconSize.xs} aria-hidden="true" />
                ) : (
                  <PinOff className={iconSize.xs} aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Config copy button */}
            {configurationObject && (
              <Button
                variant="ghost"
                size="sm"
                className={`${buttonSize.iconSm} ${buttonGhost.icon}`}
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
                    logger.warn('[Clipboard] Copy configuration failed', {
                      err: normalized,
                      category: 'clipboard',
                      component: 'ConfigCard',
                      recoverable: true,
                      userRetryable: true,
                    });
                  });
                }}
                aria-label="Copy configuration JSON"
                title="Copy configuration JSON"
              >
                <FileJson className={iconSize.xs} aria-hidden="true" />
              </Button>
            )}

            {/* Copy button */}
            {cardConfig.showCopyButton && (
              <div className={position.relative}>
                <SimpleCopyButton
                  content={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
                  successMessage="Link copied to clipboard!"
                  errorMessage="Failed to copy link"
                  variant="ghost"
                  size="sm"
                  className={buttonSize.iconSm}
                  iconClassName={iconSize.xs}
                  ariaLabel={`Copy link to ${displayTitle}`}
                  onCopySuccess={() => {
                    const category: Database['public']['Enums']['content_category'] =
                      isValidCategory(item.category ?? Constants.public.Enums.content_category[0])
                        ? (item.category as Database['public']['Enums']['content_category'])
                        : Constants.public.Enums.content_category[0];
                    if (item.slug) {
                      pulse.copy({ category, slug: item.slug }).catch((error) => {
                        logUnhandledPromise('ConfigCard: copy button pulse failed', error, {
                          category,
                          slug: item.slug ?? undefined,
                        });
                      });
                    }
                  }}
                />
                {cardConfig.showCopyCount && copyCount !== undefined && copyCount > 0 && (
                  <UnifiedBadge variant="notification-count" count={copyCount} type="copy" />
                )}
              </div>
            )}

            {/* View button */}
            <div className={position.relative}>
              <Button
                variant="ghost"
                size="sm"
                className={`${buttonSize.iconSm} ${buttonGhost.icon}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSafeCategoryAndSlug(item.category, item.slug)) {
                    if (!isValidInternalPath(targetPath)) {
                      logClientWarning('ConfigCard: Blocked invalid internal path', {
                        attemptedCategory: item.category,
                        attemptedSlug: item.slug,
                        targetPath,
                      });
                      return;
                    }
                    window.location.href = targetPath;
                  } else {
                    logClientWarning('ConfigCard: Blocked potentially unsafe redirect', {
                      attemptedCategory: item.category,
                      attemptedSlug: item.slug,
                      targetPath,
                    });
                  }
                }}
                aria-label={`View details for ${displayTitle}${cardConfig.showViewCount && viewCount !== undefined && typeof viewCount === 'number' ? ` - ${formatViewCount(viewCount)}` : ''}`}
                title="View details"
              >
                <Eye className={iconSize.xs} aria-hidden="true" />
              </Button>
              {cardConfig.showViewCount &&
                viewCount !== undefined &&
                typeof viewCount === 'number' &&
                viewCount > 0 && (
                  <UnifiedBadge variant="notification-count" count={viewCount} type="view" />
                )}
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
        <div className={position.relative}>
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
      logger.warn('[Render] ConfigCard rendering failed', {
        err: normalized,
        category: 'render',
        component: 'ConfigCard',
        recoverable: true,
        hasSlug: Boolean(item.slug),
        hasCategory: Boolean(item.category),
      });
      // Return minimal fallback
      return (
        <div className={`${radius.lg} border ${padding.default}`} role="article">
          <h3 className={weight.semibold}>
            {'title' in item && typeof item.title === 'string' ? item.title : 'Content'}
          </h3>
          {'description' in item && item.description && (
            <p className={`${size.sm} ${muted.default}`}>{item.description}</p>
          )}
        </div>
      );
    }
  }
);

ConfigCard.displayName = 'ConfigCard';
