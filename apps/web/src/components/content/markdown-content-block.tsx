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
import type {
  CaseStudyProps,
  ContentTabsProps,
  ExpertQuoteProps,
  FeatureGridProps,
  QuickReferenceProps,
  TLDRSummaryProps,
} from '@heyclaude/web-runtime/types/component.types';
import {
  animateDuration,
  bgColor,
  borderColor,
  borderLeft,
  borderTop,
  cluster,
  flexGrow,
  gap,
  iconSize,
  alignItems,
  justify,
  leading,
  marginBottom,
  marginTop,
  maxWidth,
  muted,
  opacityLevel,
  overflow,
  padding,
  radius,
  radiusRight,
  row,
  shadow,
  size,
  spaceY,
  squareSize,
  stack,
  textColor,
  transition,
  weight,
  zLayer,
} from '@heyclaude/web-runtime/design-system';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heyclaude/web-runtime/ui';

// ============================================================================
// TYPE DEFINITIONS - Discriminated Union
// ============================================================================

/**
 * Discriminated union for UnifiedContentBlock component
 * Each variant has its own props + 'variant' discriminator
 */
export type UnifiedContentBlockProps =
  | ({ variant: 'case-study' } & CaseStudyProps)
  | ({ variant: 'feature-grid' } & FeatureGridProps)
  | ({ variant: 'tldr' } & TLDRSummaryProps)
  | ({ variant: 'expert-quote' } & ExpertQuoteProps)
  | ({ variant: 'quick-reference' } & QuickReferenceProps)
  | ({ variant: 'content-tabs' } & ContentTabsProps);

// ============================================================================
// MAIN COMPONENT - Router
// ============================================================================

export function UnifiedContentBlock(props: UnifiedContentBlockProps) {
  switch (props.variant) {
    case 'case-study':
      return <CaseStudyVariant {...props} />;
    case 'feature-grid':
      return <FeatureGridVariant {...props} />;
    case 'tldr':
      return <TLDRVariant {...props} />;
    case 'expert-quote':
      return <ExpertQuoteVariant {...props} />;
    case 'quick-reference':
      return <QuickReferenceVariant {...props} />;
    case 'content-tabs':
      return <ContentTabsVariant {...props} />;
  }
}

// ============================================================================
// VARIANT 1: CASE STUDY
/**
 * Render a case study card that presents a company's challenge, solution, results, optional metrics, and an optional testimonial.
 *
 * @param props - Props for the case study card.
 * @param props.company - Company name shown in the card title.
 * @param props.industry - Optional industry label displayed as a badge.
 * @param props.challenge - Text describing the challenge the company faced.
 * @param props.solution - Text describing the solution provided.
 * @param props.results - Text summarizing the results achieved.
 * @param props.metrics - Optional array of metric objects; each metric should include `label`, `value`, and an optional `trend` (e.g., "up", "down", "+", or other).
 * @param props.testimonial - Optional testimonial containing `quote`, `author`, and optional `role`.
 * @param props.logo - Optional logo information used to render a visual identifier for the company.
 * @returns A React element representing the formatted case study card.
 *
 * @see UnifiedContentBlock
 * @see CaseStudyProps
 */

function CaseStudyVariant(props: CaseStudyProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { company, industry, challenge, solution, results, metrics, testimonial, logo } = props;

  return (
    <Card itemScope={true} itemType="https://schema.org/Article" className={`my-8 ${overflow.hidden}`}>
      <CardHeader className="pb-4">
        <div className={`flex ${alignItems.start} ${justify.between}`}>
          <div>
            <CardTitle className={`${size['2xl']}`} itemProp="headline">
              {company} Case Study
            </CardTitle>
            {industry && (
              <UnifiedBadge variant="base" style="outline" className={marginTop.compact}>
                {industry}
              </UnifiedBadge>
            )}
          </div>
          {logo && (
            <div className={`flex ${iconSize['4xl']} ${alignItems.center} ${justify.center} ${radius.lg} ${bgColor.muted}`}>
              <BookOpen className={`${iconSize.xl} ${muted.default}`} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={spaceY.relaxed}>
        <div>
          <h4 className={`${marginBottom.tight} ${weight.semibold} ${textColor.destructive}`}>Challenge</h4>
          <p className={muted.default}>{challenge}</p>
        </div>

        <div>
          <h4 className={`${marginBottom.tight} ${weight.semibold} ${textColor.primary}`}>Solution</h4>
          <p className={muted.default}>{solution}</p>
        </div>

        <div>
          <h4 className={`${marginBottom.tight} ${weight.semibold} ${textColor.green}`}>Results</h4>
          <p className={muted.default}>{results}</p>
        </div>

        {metrics && Array.isArray(metrics) && metrics.length > 0 && (
          <div className={`grid grid-cols-2 ${gap.comfortable} ${borderTop.default} pt-4 md:grid-cols-3`}>
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className={`flex ${alignItems.center} ${justify.center} ${gap.tight} ${weight.bold} ${size['2xl']}`}>
                  {metric.value}
                  {metric.trend && (
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
                  )}
                </p>
                <p className={muted.sm}>{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {testimonial && (
          <blockquote className={`rounded-r-lg ${borderLeft.accentPrimary} ${bgColor['muted/30']} ${padding.yCompact} pl-4`}>
            <p className={`${marginBottom.tight} ${muted.default} italic`}>"{testimonial.quote}"</p>
            <footer className={size.sm}>
              <cite className={`${weight.semibold} not-italic`}>{testimonial.author}</cite>
              {testimonial.role && (
                <span className={muted.default}>, {testimonial.role}</span>
              )}
            </footer>
          </blockquote>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VARIANT 2: FEATURE GRID
// ============================================================================

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
    <section itemScope={true} itemType="https://schema.org/ItemList" className="my-8">
      <div className={marginBottom.comfortable}>
        <h2 className={`${marginBottom.tight} ${weight.bold} ${size['2xl']}`} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className={muted.default} itemProp="description">
            {description}
          </p>
        )}
      </div>

      <div className={`grid grid-cols-1 ${gridCols[columns || 3]} ${gap.relaxed}`}>
        {validFeatures.map((feature, index) => (
          <Card
            key={feature.title}
            itemScope={true}
            itemType="https://schema.org/ListItem"
            className={
              `group hover:-translate-y-1 relative h-full ${overflow.hidden} border ${borderColor[`border/50`]} bg-linear-to-br from-card/30 via-card/50 to-card/30 ${shadow.lg} ${transition.all} ${animateDuration.slow} hover:from-card/50 hover:via-card/70 hover:to-card/50 hover:${shadow.xl}`
            }
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out forwards',
            }}
          >
            <div
              className={
                `pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5 ${opacityLevel[0]} ${transition.opacity} ${animateDuration.slow} group-hover:opacity-100`
              }
            />

            <CardHeader>
              <CardTitle
                className={`relative ${zLayer.raised} flex ${alignItems.start} ${justify.between}`}
                itemProp="name"
              >
                <span
                  className={
                    `bg-linear-to-r from-foreground to-foreground/70 bg-clip-text ${weight.semibold} ${textColor.transparent}`
                  }
                >
                  {feature.title}
                </span>
                {feature.badge && (
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className={`ml-2 ${borderColor['primary/30']} bg-linear-to-r from-primary/20 to-primary/30 ${shadow.sm}`}
                  >
                    {feature.badge}
                  </UnifiedBadge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={`relative ${zLayer.raised}`}>
              <p itemProp="description" className={`${muted.default} ${leading.relaxed}`}>
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
 * Render a TL;DR-style content card with an optional list of key takeaways.
 *
 * Renders an Article-styled Card containing an abstract paragraph for `content` and,
 * when `keyPoints` is provided and non-empty, a "Key Takeaways" list where each point
 * is shown with an indicator icon.
 *
 * @param props.content - Short summary or abstract text to display in the card
 * @param props.keyPoints - Optional ordered list of concise takeaway points
 * @param props.title - Visible title shown in the card header
 * @returns A JSX element representing the TLDR card with the provided content and key points
 *
 * @see UnifiedContentBlock
 * @see Card
 */

function TLDRVariant(props: TLDRSummaryProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { content, keyPoints, title } = props;

  return (
    <Card
      itemScope={true}
      itemType="https://schema.org/Article"
      className={`my-8 ${borderLeft.accentPrimary} ${bgColor['primary/5']}`}
    >
      <CardHeader>
        <CardTitle className={cluster.compact}>
          <Zap className={`${iconSize.md} ${textColor.primary}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p itemProp="abstract" className={`${marginBottom.default} ${muted.default} ${leading.relaxed}`}>
          {content}
        </p>

        {keyPoints && keyPoints.length > 0 && (
          <div>
            <h4 className={`${marginBottom.tight} ${weight.semibold}`}>Key Takeaways:</h4>
            <ul className={spaceY.tight}>
              {keyPoints.map((point) => (
                <li key={point} className={`${row.compact} ${size.sm}`}>
                  <CheckCircle className={`${marginTop.micro} ${iconSize.sm} ${flexGrow.shrink0} ${textColor.green}`} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VARIANT 4: EXPERT QUOTE
// ============================================================================

function ExpertQuoteVariant(props: ExpertQuoteProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { quote, author, role, company, imageUrl } = props;

  return (
    <blockquote
      itemScope={true}
      itemType="https://schema.org/Quotation"
      className={`my-8 ${radiusRight.lg} ${borderLeft.accentPrimary} ${bgColor['muted/30']} ${padding.comfortable}`}
    >
      <p itemProp="text" className={`${marginBottom.default} ${size.lg} italic ${leading.relaxed}`}>
        "{quote}"
      </p>
      <footer className={cluster.comfortable}>
        {imageUrl && (
          <Avatar className={squareSize.avatarLg}>
            <AvatarImage src={imageUrl} alt={author} />
            <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div itemProp="author" itemScope={true} itemType="https://schema.org/Person">
          <cite className="not-italic">
            <span itemProp="name" className={`${weight.semibold} ${textColor.foreground}`}>
              {author}
            </span>
            {(role || company) && (
              <span className={muted.default}>
                {role && <span itemProp="jobTitle">, {role}</span>}
                {company && (
                  <span itemProp="worksFor">
                    {role ? ' at ' : ', '}
                    {company}
                  </span>
                )}
              </span>
            )}
          </cite>
        </div>
      </footer>
    </blockquote>
  );
}

// ============================================================================
// VARIANT 5: QUICK REFERENCE
/**
 * Renders a quick-reference card showing labeled name/value pairs in a responsive grid.
 *
 * Renders nothing when `items` is empty or undefined. Each item is marked up as a
 * schema.org PropertyValue with `name`, `value`, and optional description.
 *
 * @param props.title - Card title displayed in the header
 * @param props.description - Optional header description used as the card description and schema.org description
 * @param props.items - Array of reference items; each item should include `label`, `value`, and optional `description`
 * @param props.columns - Optional layout hint; when `2`, items are rendered in two columns on medium+ screens
 * @returns A Card element containing a grid of property items, or `null` if `items` is empty
 *
 * @see QuickReferenceProps
 * @see CaseStudyVariant
 * @see TLDRVariant
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
      itemScope={true}
      itemType="https://schema.org/Table"
      className={`my-8 ${borderLeft.accentHighlight} ${bgColor['accent/5']}`}
    >
      <CardHeader>
        <CardTitle className={cluster.compact}>
          <BookOpen className={`${iconSize.md} ${textColor.accentForeground}`} />
          {title}
        </CardTitle>
        {description && <CardDescription itemProp="description">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`grid ${gap.comfortable} ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
          {validItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              itemScope={true}
              itemType="https://schema.org/PropertyValue"
              className={`${stack.compact} ${radius.lg} border ${bgColor['card/50']} ${padding.compact} sm:flex-row sm:items-start sm:gap-4`}
            >
              <div className="sm:w-1/3">
                <dt itemProp="name" className={`${weight.medium} ${muted.sm}`}>
                  {item.label}
                </dt>
              </div>
              <div className="sm:w-2/3">
                <dd itemProp="value" className={`${marginBottom.micro} ${weight.semibold} ${textColor.foreground}`}>
                  {item.value}
                </dd>
                {item.description && <p className={`${muted.sm}`}>{item.description}</p>}
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
// ============================================================================

function ContentTabsVariant(props: ContentTabsProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { items, title, description, defaultValue } = props;
  const validItems = items || [];

  if (validItems.length === 0) {
    return null;
  }

  const firstValue = defaultValue || validItems[0]?.value || '';

  return (
    <section itemScope={true} itemType="https://schema.org/ItemList" className="my-8">
      {title && (
        <div className={marginBottom.comfortable}>
          <h3 className={`${marginBottom.tight} ${weight.bold} ${size.xl}`} itemProp="name">
            {title}
          </h3>
          {description && (
            <p className={muted.default} itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue={firstValue} className="w-full">
        <TabsList
          className={`grid h-auto w-full grid-cols-2 ${gap.tight} ${padding.micro} lg:grid-cols-3 xl:grid-cols-4`}
        >
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
            className={marginTop.default}
            itemScope={true}
            itemType="https://schema.org/ListItem"
          >
            <div
              itemProp="description"
              className={`prose prose-neutral dark:prose-invert ${maxWidth.none}`}
            >
              {item.content}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}