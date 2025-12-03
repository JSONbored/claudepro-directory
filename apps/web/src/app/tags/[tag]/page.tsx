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

import  { type Database } from '@heyclaude/database-types';
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
  bgColor,
  cluster,
  emptyCard,
  flexWrap,
  grid,
  gap,
  hoverBg,
  iconSize,
  justify,
  marginBottom,
  marginTop,
  maxWidth,
  minHeight,
  muted,
  padding,
  radius,
  spaceY,
  textColor,
  tracking,
  transition,
  weight,
  display,
  position,
  sticky,
  self,
  cursor,
  container,
  marginX,
  textAlign,
  marginLeft,
  marginRight,
  width,
  responsiveText,
  size,
} from '@heyclaude/web-runtime/design-system';
import { Tag, ArrowLeft, Filter } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import  { type DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { UnifiedBadge, Card, CardContent , Button , UnifiedCardGrid  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
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
 * Build page metadata for a tag detail page using the decoded tag and its stored metadata.
 *
 * @param params - An object with a URL-encoded `tag` path parameter.
 * @returns The Metadata object for the tag page including title, description, keywords, and Open Graph data.
 *
 * @see getTagMetadata
 * @see formatTagForDisplay
 * @see CATEGORY_LABELS
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
    keywords: [
      tag,
      displayTag,
      'claude',
      'ai tools',
      'mcp servers',
      ...categoryKeywords,
    ],
    openGraph: {
      title: `${displayTag} - Browse Content - ${APP_CONFIG.name}`,
      description: `Discover ${itemCount} Claude AI tools, MCP servers, agents, and more tagged with "${displayTag}". Find the best resources for ${displayTag.toLowerCase()}.`,
      type: 'website',
      images: ['/opengraph-image.png'],
    },
  };
}

/**
 * Renders a sidebar card listing tags that share at least one category with the current tag.
 *
 * @param props.currentTag - The tag currently being viewed; used to exclude from results.
 * @param props.allTags - Array of tag summaries (including `tag`, `categories`, and `count`) to search for related tags.
 * @returns A JSX element containing a card of related tag badges, or `null` when no related tags are available.
 *
 * @see formatTagForDisplay
 * @see UnifiedBadge
 * @see Card
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
      <CardContent className={padding.default}>
        <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.base}`}>Related Tags</h3>
        <div className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
          {relatedTags.map((tag) => (
            <Link key={tag.tag} href={`/tags/${encodeURIComponent(tag.tag)}`}>
              <UnifiedBadge
                variant="base"
                style="outline"
                className={`${cursor.pointer} ${transition.colors} ${hoverBg.accentSolid}`}
              >
                {formatTagForDisplay(tag.tag)}
                <span className={`${marginLeft.tight} ${muted.default}`}>({tag.count})</span>
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
 * Renders a horizontal row of category filter tabs for a specific tag, including an "All" tab and one tab per category that has a non-zero count.
 *
 * @param tag - The raw tag value used to build each tab's URL; will be URL-encoded when rendered.
 * @param activeCategory - The currently selected filter category, or `null` to indicate "All".
 * @param categoryCounts - A map from content category to the number of items for that category for this tag; tabs are rendered only for categories with a count greater than zero.
 * @returns The JSX element containing the filter tabs.
 *
 * @see FILTERABLE_CATEGORIES
 * @see CATEGORY_LABELS
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
    <div className={`${marginBottom.comfortable} ${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
      <Link href={`/tags/${encodeURIComponent(tag)}`}>
        <Button
          variant={activeCategory === null ? 'secondary' : 'outline'}
          size="sm"
        >
          All
        </Button>
      </Link>
      {FILTERABLE_CATEGORIES.map((category) => {
        const count = categoryCounts.get(category) ?? 0;
        if (count === 0) return null;

        return (
          <Link
            key={category}
            href={`/tags/${encodeURIComponent(tag)}?category=${category}`}
          >
            <Button
              variant={activeCategory === category ? 'secondary' : 'outline'}
              size="sm"
            >
              {CATEGORY_LABELS[category]} ({count})
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Map a TaggedContentItem into the DisplayableContent shape consumed by card components.
 *
 * @param item - The tagged content item to convert into the UI-facing displayable format.
 * @returns A DisplayableContent object with fields populated from the source item (ids, titles, dates, counts, category, tags, and source); optional/enhanced fields are set to null when not provided.
 *
 * @see DisplayableContent
 * @see ConfigCard
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
 * Display the Tag detail page with tag metadata, optional category-filtered content, and related tags.
 *
 * This server component loads tag metadata, content items for the tag (optionally filtered by a
 * `category` query parameter), and a list of all tags; it then renders a hero with tag info,
 * optional category filter tabs, a content grid or empty state, and a sidebar with related tags
 * and a "Browse All Tags" CTA. If neither metadata nor content are found for the tag, the page
 * triggers Next.js' notFound().
 *
 * Next.js specifics:
 * - Uses dynamic rendering (dynamic = 'force-dynamic') and supports dynamic route params.
 *
 * @param params - Route params object containing an encoded `tag` string.
 * @param searchParams - Query params object; supports optional `category` to filter displayed items.
 *
 * @see generateMetadata
 * @see toDisplayableContent
 * @see RelatedTagsSidebar
 * @see CategoryFilterTabs
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
  // Count actual items per category from the content results
  for (const item of contentResult.items) {
    const currentCount = categoryCounts.get(item.category) ?? 0;
    categoryCounts.set(item.category, currentCount + 1);
  }

  // Display content - use arrow function to avoid passing reference directly
  const displayItems = contentResult.items.map((item) => toDisplayableContent(item));

  return (
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      {/* Hero Section */}
      <section className={emptyCard.default} aria-labelledby="tag-title">
        <div className={`${container.default} ${padding.xDefault} ${padding.yHero}`}>
          {/* Back link */}
          <Link
            href="/tags"
            className={`${cluster.compact} ${marginBottom.comfortable} ${display.inlineFlex} ${muted.default} ${transition.colors} hover:${textColor.foreground}`}
          >
            <ArrowLeft className={iconSize.sm} />
            <span>All Tags</span>
          </Link>

          <div className={`${marginX.auto} ${maxWidth['3xl']}`}>
            <div className={`${marginBottom.comfortable} ${display.flex} ${justify.center}`}>
              <div className={`${radius.full} ${bgColor['primary/10']} ${padding.compact}`} aria-hidden="true">
                <Tag className={`${iconSize['2xl']} ${textColor.primary}`} />
              </div>
            </div>

            <h1
              id="tag-title"
              className={`${marginBottom.default} ${weight.bold} ${responsiveText['4xlTo5xl']} ${tracking.tight}`}
            >
              {displayTag}
            </h1>

            <p className={`${marginX.auto} ${marginTop.default} ${maxWidth.xl} ${muted.lg} ${size.lg}`}>
              {contentResult.totalCount}{' '}
              {contentResult.totalCount === 1 ? 'item' : 'items'} tagged with "
              {displayTag}"
              {activeCategory ? ` in ${CATEGORY_LABELS[activeCategory]}` : null}
            </p>

            {tagMetadata?.categories && tagMetadata.categories.length > 0 ? <div className={`${marginTop.default} ${display.flex} ${flexWrap.wrap} ${justify.center} ${gap.compact}`}>
                {tagMetadata.categories.map((category) => (
                  <UnifiedBadge key={category} variant="base" style="outline">
                    {CATEGORY_LABELS[category]}
                  </UnifiedBadge>
                ))}
              </div> : null}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className={`${container.default} ${padding.xDefault} ${padding.yRelaxed}`}>
        <div className={grid.sidebar}>
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Category Filter Tabs */}
            {tagMetadata?.categories && tagMetadata.categories.length > 1 ? <div className={`${marginBottom.comfortable} ${cluster.compact}`}>
                <Filter className={`${iconSize.sm} ${muted.default}`} />
                <span className={muted.sm}>Filter:</span>
                <CategoryFilterTabs
                  tag={tag}
                  activeCategory={activeCategory}
                  categoryCounts={categoryCounts}
                />
              </div> : null}

            {/* Content Grid */}
            {displayItems.length === 0 ? (
              <Card className={`${bgColor['muted/50']} ${padding.relaxed} ${textAlign.center}`}>
                <Tag className={`${marginX.auto} ${marginBottom.compact} ${iconSize['3xl']} ${muted.opacity30}`} />
                <p className={`${muted.default} ${size.base}`}>
                  No content found for this tag
                  {activeCategory ? ` in ${CATEGORY_LABELS[activeCategory]}` : null}.
                </p>
                {activeCategory ? <Link href={`/tags/${encodeURIComponent(tag)}`}>
                    <Button variant="link" className={marginTop.compact}>
                      View all categories
                    </Button>
                  </Link> : null}
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
          <aside className={`${spaceY.comfortable} lg:${position.sticky} lg:${sticky.top24} lg:${self.start}`}>
            <RelatedTagsSidebar currentTag={tag} allTags={allTags} />

            {/* Browse all tags CTA */}
            <Card>
              <CardContent className={`${padding.default} ${textAlign.center}`}>
                <p className={`${marginBottom.compact} ${muted.sm} ${size.sm}`}>
                  Explore more topics
                </p>
                <Link href="/tags">
                  <Button variant="outline" size="sm" className={width.full}>
                    <Tag className={`${marginRight.compact} ${iconSize.sm}`} />
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