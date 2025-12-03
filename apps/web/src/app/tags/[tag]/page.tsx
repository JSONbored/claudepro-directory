/**
 * Tag Detail Page - Content Filtered by Tag
 *
 * @description
 * Displays all content items that have a specific tag.
 * Supports category filtering and pagination.
 *
 * @features
 * - Content grid filtered by tag
 * - Category tabs for further filtering
 * - Related tags sidebar
 * - SEO optimized with dynamic metadata
 */

import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { APP_CONFIG } from '@heyclaude/shared-runtime';
import {
  getContentByTag,
  getTagMetadata,
  formatTagForDisplay,
  getAllTagsWithCounts,
  type TaggedContentItem,
  type TagSummary,
} from '@heyclaude/web-runtime/data';
import {
  emptyCard,
  marginBottom,
  marginTop,
  spaceY,
  cluster,
  muted,
  iconSize,
  weight,
  size,
  gap,
  padding,
  minHeight,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { Tag, ArrowLeft, Filter } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import {
  UnifiedBadge,
  Card,
  CardContent,
  Button,
  UnifiedCardGrid,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Dynamic rendering for fresh data
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

type ContentCategory = Database['public']['Enums']['content_category'];

// Category display names
const CATEGORY_LABELS: Record<ContentCategory, string> = {
  agents: 'Agents',
  mcp: 'MCP Servers',
  rules: 'Rules',
  commands: 'Commands',
  hooks: 'Hooks',
  statuslines: 'Statuslines',
  skills: 'Skills',
  collections: 'Collections',
  guides: 'Guides',
  jobs: 'Jobs',
  changelog: 'Changelog',
};

// Categories to show in filter tabs (exclude jobs/changelog)
const FILTERABLE_CATEGORIES = Constants.public.Enums.content_category.filter(
  (cat) => cat !== 'jobs' && cat !== 'changelog'
);

/**
 * Builds SEO metadata and Open Graph data for a tag detail page.
 *
 * Uses the route `tag` param (URL-encoded), resolves tag metadata to derive item counts
 * and category labels, and composes title, description, keywords, and Open Graph fields.
 *
 * @param params - Promise resolving to an object with the URL-encoded `tag` route parameter
 * @returns Metadata populated with title, description, keywords, and `openGraph` suitable for the tag page
 *
 * @see formatTagForDisplay
 * @see getTagMetadata
 * @see APP_CONFIG
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag: encodedTag } = await params;
  const tag = decodeURIComponent(encodedTag);
  const displayTag = formatTagForDisplay(tag);

  const tagMetadata = await getTagMetadata(tag);
  const itemCount = tagMetadata?.count ?? 0;

  // Use tagMetadata categories if available, otherwise empty array
  const categoryKeywords = tagMetadata?.categories
    ? tagMetadata.categories.map((cat) => CATEGORY_LABELS[cat])
    : [];

  return {
    title: `${displayTag} - Browse Content - ${APP_CONFIG.name}`,
    description: `Discover ${itemCount} Claude AI tools, MCP servers, agents, and more tagged with "${displayTag}". Find the best resources for ${displayTag.toLowerCase()}.`,
    keywords: [tag, displayTag, 'claude', 'ai tools', 'mcp servers', ...categoryKeywords],
    openGraph: {
      title: `${displayTag} - Browse Content - ${APP_CONFIG.name}`,
      description: `Discover ${itemCount} Claude AI tools, MCP servers, agents, and more tagged with "${displayTag}". Find the best resources for ${displayTag.toLowerCase()}.`,
      type: 'website',
      images: ['/opengraph-image.png'],
    },
  };
}

/**
 * Sidebar showing tags related to the current tag by shared categories.
 *
 * Renders a list of up to 15 tags that share at least one category with `currentTag`.
 * If no related tags exist, the component returns `null`.
 *
 * @param props.currentTag - The active tag to find related tags for (encoded string).
 * @param props.allTags - Array of tag summaries (each includes `tag`, `categories`, and `count`) used to determine related tags.
 *
 * @see {@link TagDetailPage} - Page that uses this sidebar.
 * @see {@link formatTagForDisplay} - Utility used to format tag labels for display.
 */
function RelatedTagsSidebar({
  currentTag,
  allTags,
}: {
  allTags: TagSummary[];
  currentTag: string;
}) {
  // Find tags that appear in similar categories
  const currentTagData = allTags.find((t) => t.tag === currentTag);
  const currentCategories = new Set(currentTagData?.categories);

  // Filter to tags that share at least one category, excluding current tag
  const relatedTags = allTags
    .filter((t) => {
      if (t.tag === currentTag) return false;
      return t.categories.some((cat) => currentCategories.has(cat));
    })
    .slice(0, 15);

  if (relatedTags.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className={`${marginBottom.compact} ${weight.semibold}`}>Related Tags</h3>
        <div className={`flex flex-wrap ${gap.compact}`}>
          {relatedTags.map((tag) => (
            <Link key={tag.tag} href={`/tags/${encodeURIComponent(tag.tag)}`}>
              <UnifiedBadge
                variant="base"
                style="outline"
                className="hover:bg-accent cursor-pointer transition-colors"
              >
                {formatTagForDisplay(tag.tag)}
                <span className={`ml-1 ${muted.default}`}>({tag.count})</span>
              </UnifiedBadge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type FilterableCategory = (typeof FILTERABLE_CATEGORIES)[number];

/**
 * Renders category filter tabs for a given tag, showing counts and the active selection.
 *
 * @param tag - The tag to filter by (used to build tab links).
 * @param activeCategory - The currently selected filterable category, or `null` for "All".
 * @param categoryCounts - Map of content category to item count; categories with a count of zero are not shown.
 * @returns The tab controls as a JSX element.
 *
 * @see FILTERABLE_CATEGORIES
 * @see CATEGORY_LABELS
 * @see RelatedTagsSidebar
 */
function CategoryFilterTabs({
  tag,
  activeCategory,
  categoryCounts,
}: {
  activeCategory: FilterableCategory | null;
  categoryCounts: Map<ContentCategory, number>;
  tag: string;
}) {
  return (
    <div className={`${marginBottom.comfortable} flex flex-wrap ${gap.compact}`}>
      <Link href={`/tags/${encodeURIComponent(tag)}`}>
        <Button variant={activeCategory === null ? 'secondary' : 'outline'} size="sm">
          All
        </Button>
      </Link>
      {FILTERABLE_CATEGORIES.map((category) => {
        const count = categoryCounts.get(category) ?? 0;
        if (count === 0) return null;

        return (
          <Link key={category} href={`/tags/${encodeURIComponent(tag)}?category=${category}`}>
            <Button variant={activeCategory === category ? 'secondary' : 'outline'} size="sm">
              {CATEGORY_LABELS[category]} ({count})
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Create a UI-ready DisplayableContent object from a TaggedContentItem.
 *
 * Maps fields from the backend TaggedContentItem into the DisplayableContent shape expected by UI card/grid components.
 *
 * @param item - The tagged content item to convert
 * @returns The mapped DisplayableContent used by card and grid components
 *
 * @see ConfigCard
 * @see UnifiedCardGrid
 * @see DisplayableContent
 */
function toDisplayableContent(item: TaggedContentItem): DisplayableContent {
  // Cast to enriched_content_item compatible structure
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    display_title: item.title,
    seo_title: item.title,
    description: item.description,
    author: item.author,
    author_profile_url: item.author_profile_url,
    category: item.category,
    tags: item.tags,
    source_table: 'content',
    created_at: item.date_added,
    updated_at: item.updated_at,
    date_added: item.date_added,
    features: null,
    use_cases: null,
    source: item.source,
    documentation_url: null,
    metadata: null,
    view_count: item.view_count,
    copy_count: item.copy_count,
    bookmark_count: item.bookmark_count,
    popularity_score: null,
    trending_score: null,
    sponsored_content_id: null,
    sponsorship_tier: null,
    is_sponsored: null,
  } as DisplayableContent;
}

/**
 * Renders the tag detail page showing content items filtered by a specific tag, optional category filters, pagination-aware content grid, and a related-tags sidebar.
 *
 * Fetches tag metadata, tag-filtered content, and a list of all tags on each request (server component; dynamic rendering forced). If no tag metadata and no content are found, this component triggers a 404 via Next.js `notFound()`.
 *
 * @param params - An object containing route parameters; expects `tag` (URL-encoded).
 * @param searchParams - An object containing query parameters; may include `category` to filter results.
 *
 * @returns A React element that renders the tag hero, category filter tabs (when applicable), a content grid or an empty state, and a sidebar with related tags and a CTA.
 *
 * @see generateMetadata - Builds SEO and Open Graph metadata for the tag page.
 * @see RelatedTagsSidebar - Sidebar component that shows related tags.
 * @see CategoryFilterTabs - Component that renders the category filter controls.
 * @see toDisplayableContent - Mapper that converts fetched content items into UI displayable items.
 */
export default async function TagDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { tag: encodedTag } = await params;
  const { category: categoryParam } = await searchParams;
  const tag = decodeURIComponent(encodedTag);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'TagDetailPage',
    route: `/tags/${tag}`,
    module: 'apps/web/src/app/tags/[tag]/page',
  });

  // Validate category param if provided
  let activeCategory: FilterableCategory | null = null;
  if (categoryParam && (FILTERABLE_CATEGORIES as readonly string[]).includes(categoryParam)) {
    activeCategory = categoryParam as FilterableCategory;
  }

  // Fetch tag metadata and content in parallel
  let tagMetadata: null | TagSummary = null;
  let contentResult: Awaited<ReturnType<typeof getContentByTag>> = {
    items: [],
    totalCount: 0,
    tag,
    category: null,
  };
  let allTags: TagSummary[] = [];

  // Build options conditionally to avoid exactOptionalPropertyTypes issues
  const contentOptions: Parameters<typeof getContentByTag>[1] = { limit: 100 };
  if (activeCategory) {
    contentOptions.category = activeCategory;
  }

  try {
    const [tagMeta, content, tags] = await Promise.all([
      getTagMetadata(tag),
      getContentByTag(tag, contentOptions),
      getAllTagsWithCounts({ minCount: 1, limit: 100 }),
    ]);

    tagMetadata = tagMeta;
    contentResult = content;
    allTags = tags;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load tag content');
    reqLogger.error('TagDetailPage: data fetching failed', normalized, { tag });
  }

  // If tag doesn't exist (no content), show 404
  if (!tagMetadata && contentResult.items.length === 0) {
    notFound();
  }

  const displayTag = formatTagForDisplay(tag);

  // Calculate category counts for filter tabs
  const categoryCounts = new Map<ContentCategory, number>();
  if (tagMetadata?.categories) {
    // We need to get counts per category - for now, just mark categories as having content
    for (const cat of tagMetadata.categories) {
      categoryCounts.set(cat, 1); // Placeholder - actual count would require additional query
    }
  }

  // Display content - use arrow function to avoid passing reference directly
  const displayItems = contentResult.items.map((item) => toDisplayableContent(item));

  return (
    <div className={`${minHeight.screen} bg-background`}>
      {/* Hero Section */}
      <section className={emptyCard.default} aria-labelledby="tag-title">
        <div className={`container mx-auto ${padding.xDefault} ${padding.yHero}`}>
          {/* Back link */}
          <Link
            href="/tags"
            className={`${cluster.compact} ${marginBottom.comfortable} inline-flex ${muted.default} hover:text-foreground transition-colors`}
          >
            <ArrowLeft className={iconSize.sm} />
            <span>All Tags</span>
          </Link>

          <div className={`mx-auto ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} flex justify-center`}>
              <div className={`bg-primary/10 rounded-full ${padding.compact}`} aria-hidden="true">
                <Tag className="text-primary h-10 w-10" />
              </div>
            </div>

            <h1
              id="tag-title"
              className={`${marginBottom.default} ${weight.bold} ${size['4xl']} tracking-tight sm:text-5xl`}
            >
              {displayTag}
            </h1>

            <p className={`mx-auto mt-4 ${maxWidth.xl} ${muted.lg}`}>
              {contentResult.totalCount} {contentResult.totalCount === 1 ? 'item' : 'items'} tagged
              with "{displayTag}"{activeCategory ? ` in ${CATEGORY_LABELS[activeCategory]}` : null}
            </p>

            {tagMetadata?.categories && tagMetadata.categories.length > 0 ? (
              <div className={`${marginTop.default} flex flex-wrap justify-center ${gap.compact}`}>
                {tagMetadata.categories.map((category) => (
                  <UnifiedBadge key={category} variant="base" style="outline">
                    {CATEGORY_LABELS[category]}
                  </UnifiedBadge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className={`container mx-auto ${padding.xDefault} ${padding.yRelaxed}`}>
        <div className={`grid grid-cols-1 ${gap.loose} lg:grid-cols-4`}>
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Category Filter Tabs */}
            {tagMetadata?.categories && tagMetadata.categories.length > 1 ? (
              <div className={`${marginBottom.comfortable} ${cluster.compact}`}>
                <Filter className={`h-4 w-4 ${muted.default}`} />
                <span className={muted.sm}>Filter:</span>
                <CategoryFilterTabs
                  tag={tag}
                  activeCategory={activeCategory}
                  categoryCounts={categoryCounts}
                />
              </div>
            ) : null}

            {/* Content Grid */}
            {displayItems.length === 0 ? (
              <Card className={`bg-muted/50 ${padding.relaxed} text-center`}>
                <Tag className={`mx-auto mb-3 h-12 w-12 ${muted.default}/30`} />
                <p className={muted.default}>
                  No content found for this tag
                  {activeCategory ? ` in ${CATEGORY_LABELS[activeCategory]}` : null}.
                </p>
                {activeCategory ? (
                  <Link href={`/tags/${encodeURIComponent(tag)}`}>
                    <Button variant="link" className={marginTop.compact}>
                      View all categories
                    </Button>
                  </Link>
                ) : null}
              </Card>
            ) : (
              <UnifiedCardGrid
                items={displayItems}
                variant="normal"
                ariaLabel={`Content tagged with ${displayTag}`}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className={`${spaceY.comfortable} lg:sticky lg:top-24 lg:self-start`}>
            <RelatedTagsSidebar currentTag={tag} allTags={allTags} />

            {/* Browse all tags CTA */}
            <Card>
              <CardContent className="p-4 text-center">
                <p className={`${marginBottom.compact} ${muted.sm}`}>Explore more topics</p>
                <Link href="/tags">
                  <Button variant="outline" size="sm" className="w-full">
                    <Tag className="mr-2 h-4 w-4" />
                    Browse All Tags
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}