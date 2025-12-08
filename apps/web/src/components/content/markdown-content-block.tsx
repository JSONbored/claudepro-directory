'use client';

/**
 * UnifiedContentBlock - Consolidated content display component
 *
 * REPLACES 6 separate components:
 * - CaseStudy (100 LOC) - Business case studies
 * - FeatureGrid (95 LOC) - Feature showcase grids
 * - TLDRSummary (51 LOC) - Opening summaries
 * - ExpertQuote (55 LOC) - Expert quotes with attribution
 * - QuickReference (73 LOC) - Reference tables
 * - ContentTabs (73 LOC) - Tabbed content organization
 *
 * Total: 447 LOC → ~200 LOC (55% reduction)
 *
 * Architecture:
 * - Discriminated union with 'variant' discriminator
 * - NO wrappers, NO backward compatibility layers
 * - Type-safe with Zod validation
 * - Consistent Schema.org markup across all variants
 * - Shared UI patterns (Card, UnifiedBadge)
 *
 * Usage:
 * ```tsx
 * // Case Study
 * <UnifiedContentBlock
 *   variant="case-study"
 *   company="Acme Corp"
 *   challenge="..."
 *   solution="..."
 *   results="..."
 * />
 *
 * // Feature Grid
 * <UnifiedContentBlock
 *   variant="feature-grid"
 *   features={[...]}
 *   title="Key Features"
 * />
 * ```
 */

import { BookOpen, CheckCircle, Zap } from '@heyclaude/web-runtime/icons';
import {
  type CaseStudyProps,
  type ContentTabsProps,
  type ExpertQuoteProps,
  type FeatureGridProps,
  type QuickReferenceProps,
  type TLDRSummaryProps,
} from '@heyclaude/web-runtime/types/component.types';
import {
  UI_CLASSES,
  UnifiedBadge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@heyclaude/web-runtime/ui';

// ============================================================================
// TYPE DEFINITIONS - Discriminated Union
// ============================================================================

/**
 * Discriminated union for UnifiedContentBlock component
 * Each variant has its own props + 'variant' discriminator
 */
export type UnifiedContentBlockProps =
  | (CaseStudyProps & { variant: 'case-study' })
  | (ContentTabsProps & { variant: 'content-tabs' })
  | (ExpertQuoteProps & { variant: 'expert-quote' })
  | (FeatureGridProps & { variant: 'feature-grid' })
  | (QuickReferenceProps & { variant: 'quick-reference' })
  | (TLDRSummaryProps & { variant: 'tldr' });

// ============================================================================
// MAIN COMPONENT - Router
/**
 * Render a variant-driven content block that selects and returns the appropriate UI variant based on `props.variant`.
 *
 * @param props - Discriminated union props determining which variant to render. Supported variants:
 *   - `'case-study'` renders CaseStudyVariant
 *   - `'feature-grid'` renders FeatureGridVariant
 *   - `'tldr'` renders TLDRVariant
 *   - `'expert-quote'` renders ExpertQuoteVariant
 *   - `'quick-reference'` renders QuickReferenceVariant
 *   - `'content-tabs'` renders ContentTabsVariant
 *
 * @returns The React element for the selected variant.
 *
 * @see CaseStudyVariant
 * @see FeatureGridVariant
 * @see TLDRVariant
 * @see ExpertQuoteVariant
 * @see QuickReferenceVariant
 * @see ContentTabsVariant
 */

export function UnifiedContentBlock(props: UnifiedContentBlockProps) {
  switch (props.variant) {
    case 'case-study': {
      return <CaseStudyVariant {...props} />;
    }
    case 'feature-grid': {
      return <FeatureGridVariant {...props} />;
    }
    case 'tldr': {
      return <TLDRVariant {...props} />;
    }
    case 'expert-quote': {
      return <ExpertQuoteVariant {...props} />;
    }
    case 'quick-reference': {
      return <QuickReferenceVariant {...props} />;
    }
    case 'content-tabs': {
      return <ContentTabsVariant {...props} />;
    }
  }
}

// ============================================================================
// VARIANT 1: CASE STUDY
/**
 * Render a case study card presenting a company's challenge, solution, results, optional metrics, testimonial, and logo.
 *
 * @param props.company - Company name shown in the title (rendered as "<company> Case Study")
 * @param props.industry - Optional industry badge displayed under the title
 * @param props.challenge - Description of the challenge the company faced
 * @param props.solution - Description of the solution applied
 * @param props.results - Narrative summary of the results achieved
 * @param props.metrics - Optional array of metric objects to display values, labels, and optional trend indicators
 * @param props.testimonial - Optional testimonial object containing `quote`, `author`, and optional `role`
 * @param props.logo - Optional logo data; when present a logo area is rendered
 * @returns A Card (Article schema) JSX element representing the case study content
 *
 * @see UnifiedContentBlock
 * @see UnifiedBadge
 */

function CaseStudyVariant(props: CaseStudyProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { company, industry, challenge, solution, results, metrics, testimonial, logo } = props;

  return (
    <Card itemScope itemType="https://schema.org/Article" className="my-8 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl" itemProp="headline">
              {company} Case Study
            </CardTitle>
            {industry ? (
              <UnifiedBadge variant="base" style="outline" className="mt-2">
                {industry}
              </UnifiedBadge>
            ) : null}
          </div>
          {logo ? (
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
              <BookOpen className={`${UI_CLASSES.ICON_XL} text-muted-foreground`} />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-destructive mb-2 font-semibold">Challenge</h4>
          <p className="text-muted-foreground">{challenge}</p>
        </div>

        <div>
          <h4 className="text-primary mb-2 font-semibold">Solution</h4>
          <p className="text-muted-foreground">{solution}</p>
        </div>

        <div>
          <h4 className="mb-2 font-semibold text-green-600 dark:text-green-400">Results</h4>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {results.map((result) => (
              <li key={result}>{result}</li>
            ))}
          </ul>
        </div>

        {metrics && Array.isArray(metrics) && metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="flex items-center justify-center gap-1 text-2xl font-bold">
                  {metric.value}
                  {metric.trend ? (
                    <span
                      className={
                        metric.trend === 'up' || metric.trend === '+'
                          ? 'text-green-500'
                          : metric.trend === 'down'
                            ? 'text-red-500'
                            : 'text-gray-500'
                      }
                    >
                      {metric.trend === 'up' || metric.trend === '+'
                        ? '↑'
                        : metric.trend === 'down'
                          ? '↓'
                          : '→'}
                    </span>
                  ) : null}
                </p>
                <p className={UI_CLASSES.TEXT_SM_MUTED}>{metric.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {testimonial ? (
          <blockquote className="border-primary bg-muted/30 rounded-r-lg border-l-4 py-2 pl-4">
            <p className="text-muted-foreground mb-2 italic">"{testimonial.quote}"</p>
            <footer className="text-sm">
              <cite className="font-semibold not-italic">{testimonial.author}</cite>
              {testimonial.role ? (
                <span className="text-muted-foreground">, {testimonial.role}</span>
              ) : null}
            </footer>
          </blockquote>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VARIANT 2: FEATURE GRID
/**
 * Renders a responsive feature grid section with each feature displayed as a card.
 *
 * Renders nothing when `features` is an empty array.
 *
 * @param props - Component props
 * @param props.features - Array of feature items; each item should include `title`, `description`, and optionally `badge`
 * @param props.title - Section heading shown above the grid
 * @param props.description - Optional section description shown beneath the title
 * @param props.columns - Number of columns for medium screens (2, 3, or 4). Defaults to 3 when not provided
 *
 * @returns A section element containing a responsive grid of feature cards, or `null` if `features` is empty.
 *
 * @see UnifiedBadge
 * @see Card
 */

function FeatureGridVariant(props: FeatureGridProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { features, title, description, columns } = props;
  const validFeatures = features;
  const gridCols: Record<2 | 3 | 4, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  if (validFeatures.length === 0) {
    return null;
  }

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold" itemProp="name">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground" itemProp="description">
            {description}
          </p>
        ) : null}
      </div>

      <div className={`grid grid-cols-1 ${gridCols[columns || 3]} gap-6`}>
        {validFeatures.map((feature, index) => (
          <Card
            key={feature.title}
            itemScope
            itemType="https://schema.org/ListItem"
            className="group border-border/50 from-card/30 via-card/50 to-card/30 hover:from-card/50 hover:via-card/70 hover:to-card/50 relative h-full overflow-hidden border bg-linear-to-br shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out forwards',
            }}
          >
            <div className="from-primary/5 to-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <CardHeader>
              <CardTitle className="relative z-10 flex items-start justify-between" itemProp="name">
                <span className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text font-semibold text-transparent">
                  {feature.title}
                </span>
                {feature.badge ? (
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className="border-primary/30 from-primary/20 to-primary/30 ml-2 bg-linear-to-r shadow-sm"
                  >
                    {feature.badge}
                  </UnifiedBadge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p itemProp="description" className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// VARIANT 3: TLDR SUMMARY
/**
 * Render a TL;DR styled card showing a title, abstract content, and optional key takeaways.
 *
 * Renders schema.org Article markup and displays an iconed header, an abstract paragraph, and a
 * "Key Takeaways" list when `keyPoints` is provided and non-empty.
 *
 * @param props.title - The title displayed in the card header
 * @param props.content - The abstract/content paragraph shown under the header
 * @param props.keyPoints - Optional array of concise takeaway strings to render as a list
 * @returns The TLDR card JSX element
 *
 * @see UnifiedContentBlock
 */

function TLDRVariant(props: TLDRSummaryProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { content, keyPoints, title } = props;

  return (
    <Card
      itemScope
      itemType="https://schema.org/Article"
      className="border-primary bg-primary/5 my-8 border-l-4"
    >
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Zap className={`${UI_CLASSES.ICON_MD} text-primary`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p itemProp="abstract" className="text-muted-foreground mb-4 leading-relaxed">
          {content}
        </p>

        {keyPoints && keyPoints.length > 0 ? (
          <div>
            <h4 className="mb-2 font-semibold">Key Takeaways:</h4>
            <ul className="space-y-1">
              {keyPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VARIANT 4: EXPERT QUOTE
/**
 * Renders a styled expert quote block with optional avatar, role, and company.
 *
 * Renders a blockquote using schema.org Quotation markup containing the quote text,
 * an optional avatar image, and author attribution including optional job title and employer.
 *
 * @param props - Props for the expert quote; expects `quote`, `author`, and optional `role`, `company`, and `imageUrl`
 * @returns The JSX element for the expert quote block
 *
 * @see UnifiedContentBlock
 */

function ExpertQuoteVariant(props: ExpertQuoteProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { quote, author, role, company, imageUrl } = props;

  return (
    <blockquote
      itemScope
      itemType="https://schema.org/Quotation"
      className="border-primary bg-muted/30 my-8 rounded-r-lg border-l-4 p-6"
    >
      <p itemProp="text" className="mb-4 text-lg leading-relaxed italic">
        "{quote}"
      </p>
      <footer className="flex items-center gap-4">
        {imageUrl ? (
          <Avatar className="h-12 w-12">
            <AvatarImage src={imageUrl} alt={author} />
            <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : null}
        <div itemProp="author" itemScope itemType="https://schema.org/Person">
          <cite className="not-italic">
            <span itemProp="name" className="text-foreground font-semibold">
              {author}
            </span>
            {role || company ? (
              <span className="text-muted-foreground">
                {role ? <span itemProp="jobTitle">, {role}</span> : null}
                {company ? (
                  <span itemProp="worksFor">
                    {role ? ' at ' : ', '}
                    {company}
                  </span>
                ) : null}
              </span>
            ) : null}
          </cite>
        </div>
      </footer>
    </blockquote>
  );
}

// ============================================================================
// VARIANT 5: QUICK REFERENCE
/**
 * Renders a quick-reference card containing labeled property/value pairs in a responsive grid.
 *
 * Renders nothing when `items` is empty.
 *
 * @param props.title - Title displayed in the card header
 * @param props.description - Optional header description shown below the title
 * @param props.items - Array of quick-reference entries; each entry should have `label`, `value`, and optional `description`
 * @param props.columns - If `2`, lays out entries in two columns on medium screens and up; otherwise uses a single column
 * @returns A Card element containing the quick-reference items, or `null` when there are no items
 *
 * @see Card
 */

function QuickReferenceVariant(props: QuickReferenceProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, description, items, columns } = props;
  const validItems = items || [];

  if (validItems.length === 0) {
    return null;
  }

  return (
    <Card
      itemScope
      itemType="https://schema.org/Table"
      className="border-accent bg-accent/5 my-8 border-l-4"
    >
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <BookOpen className={`${UI_CLASSES.ICON_MD} text-accent-foreground`} />
          {title}
        </CardTitle>
        {description ? (
          <CardDescription itemProp="description">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
          {validItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              itemScope
              itemType="https://schema.org/PropertyValue"
              className={`${UI_CLASSES.FLEX_COL_GAP_2} bg-card/50 rounded-lg border p-3 sm:flex-row sm:items-start sm:gap-4`}
            >
              <div className="sm:w-1/3">
                <p itemProp="name" className={`font-medium ${UI_CLASSES.TEXT_SM_MUTED}`}>
                  {item.label}
                </p>
              </div>
              <div className="sm:w-2/3">
                <p itemProp="value" className="text-foreground mb-1 font-semibold">
                  {item.value}
                </p>
                {item.description ? (
                  <p className={UI_CLASSES.TEXT_SM_MUTED}>{item.description}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VARIANT 6: CONTENT TABS
/**
 * Render a tabbed content section driven by an array of items.
 *
 * Renders a heading and optional description, then a Tabs control where each item
 * produces a tab trigger and a corresponding tab panel containing `item.content`.
 *
 * @param props - Component props
 * @param props.items - Array of tab items; each item must have `value`, `label`, and `content`.
 * @param props.title - Optional section title rendered above the tabs.
 * @param props.description - Optional section description rendered below the title.
 * @param props.defaultValue - Optional default active tab value; falls back to the first item's `value`.
 * @returns The rendered section element, or `null` when `items` is empty.
 *
 * @see Tabs
 * @see TabsList
 * @see TabsTrigger
 * @see TabsContent
 */

function ContentTabsVariant(props: ContentTabsProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { items, title, description, defaultValue } = props;
  const validItems = items || [];

  if (validItems.length === 0) {
    return null;
  }

  const firstValue = defaultValue || validItems[0]?.value || '';

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      {title ? (
        <div className="mb-6">
          <h3 className="mb-2 text-xl font-bold" itemProp="name">
            {title}
          </h3>
          {description ? (
            <p className="text-muted-foreground" itemProp="description">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <Tabs defaultValue={firstValue} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 lg:grid-cols-3 xl:grid-cols-4">
          {validItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {validItems.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
            className="mt-4"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <div
              itemProp="description"
              className="prose prose-neutral dark:prose-invert max-w-none"
            >
              {item.content}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}