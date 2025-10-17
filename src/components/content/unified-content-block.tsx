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

import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/primitives/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import { UnifiedBadge } from '@/src/components/ui/unified-badge';
import { BookOpen, CheckCircle, Zap } from '@/src/lib/icons';
import type {
  CaseStudyProps,
  ContentTabsProps,
  ExpertQuoteProps,
  FeatureGridProps,
  QuickReferenceProps,
  TLDRSummaryProps,
} from '@/src/lib/schemas/shared.schema';
import {
  caseStudyPropsSchema,
  contentTabsPropsSchema,
  expertQuotePropsSchema,
  featureGridPropsSchema,
  quickReferencePropsSchema,
  tldrSummaryPropsSchema,
} from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
// ============================================================================

function CaseStudyVariant(props: CaseStudyProps) {
  const validated = caseStudyPropsSchema.parse(props);
  const { company, industry, challenge, solution, results, metrics, testimonial, logo } = validated;

  return (
    <Card itemScope itemType="https://schema.org/Article" className={'my-8 overflow-hidden'}>
      <CardHeader className="pb-4">
        <div className={'flex items-start justify-between'}>
          <div>
            <CardTitle className="text-2xl" itemProp="headline">
              {company} Case Study
            </CardTitle>
            {industry && (
              <UnifiedBadge variant="base" style="outline" className="mt-2">
                {industry}
              </UnifiedBadge>
            )}
          </div>
          {logo && (
            <div className={'w-16 h-16 bg-muted rounded-lg flex items-center justify-center'}>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className={'font-semibold text-destructive mb-2'}>Challenge</h4>
          <p className="text-muted-foreground">{challenge}</p>
        </div>

        <div>
          <h4 className={'font-semibold text-primary mb-2'}>Solution</h4>
          <p className="text-muted-foreground">{solution}</p>
        </div>

        <div>
          <h4 className={'font-semibold text-green-600 dark:text-green-400 mb-2'}>Results</h4>
          <p className="text-muted-foreground">{results}</p>
        </div>

        {metrics && Array.isArray(metrics) && metrics.length > 0 && (
          <div className={'grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t'}>
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className={'text-2xl font-bold flex items-center justify-center gap-1'}>
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
                <p className={UI_CLASSES.TEXT_SM_MUTED}>{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {testimonial && (
          <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg">
            <p className={'italic text-muted-foreground mb-2'}>"{testimonial.quote}"</p>
            <footer className="text-sm">
              <cite className={'not-italic font-semibold'}>{testimonial.author}</cite>
              {testimonial.role && (
                <span className="text-muted-foreground">, {testimonial.role}</span>
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
  const validated = featureGridPropsSchema.parse(props);
  const { features, title, description, columns } = validated;
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
        <h2 className={'text-2xl font-bold mb-2'} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground" itemProp="description">
            {description}
          </p>
        )}
      </div>

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
        {validFeatures.map((feature, index) => (
          <Card
            key={feature.title}
            itemScope
            itemType="https://schema.org/ListItem"
            className={
              'relative border border-border/50 bg-gradient-to-br from-card/30 via-card/50 to-card/30 hover:from-card/50 hover:via-card/70 hover:to-card/50 transition-all duration-300 h-full group overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1'
            }
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out forwards',
            }}
          >
            <div
              className={
                'absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'
              }
            />

            <CardHeader>
              <CardTitle
                className={'flex items-start justify-between relative z-10'}
                itemProp="name"
              >
                <span
                  className={
                    'bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-semibold'
                  }
                >
                  {feature.title}
                </span>
                {feature.badge && (
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className="ml-2 bg-gradient-to-r from-primary/20 to-primary/30 border-primary/30 shadow-sm"
                  >
                    {feature.badge}
                  </UnifiedBadge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={'relative z-10'}>
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
// ============================================================================

function TLDRVariant(props: TLDRSummaryProps) {
  const validated = tldrSummaryPropsSchema.parse(props);
  const { content, keyPoints, title } = validated;

  return (
    <Card
      itemScope
      itemType="https://schema.org/Article"
      className="my-8 border-l-4 border-primary bg-primary/5"
    >
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Zap className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p itemProp="abstract" className="text-muted-foreground leading-relaxed mb-4">
          {content}
        </p>

        {keyPoints && keyPoints.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Key Takeaways:</h4>
            <ul className="space-y-1">
              {keyPoints.map((point) => (
                <li key={point} className={'flex items-start gap-2 text-sm'}>
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
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
  const validated = expertQuotePropsSchema.parse(props);
  const { quote, author, role, company, imageUrl } = validated;

  return (
    <blockquote
      itemScope
      itemType="https://schema.org/Quotation"
      className="my-8 border-l-4 border-primary bg-muted/30 p-6 rounded-r-lg"
    >
      <p itemProp="text" className="text-lg italic leading-relaxed mb-4">
        "{quote}"
      </p>
      <footer className="flex items-center gap-4">
        {imageUrl && (
          <Avatar className="h-12 w-12">
            <AvatarImage src={imageUrl} alt={author} />
            <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div itemProp="author" itemScope itemType="https://schema.org/Person">
          <cite className="not-italic">
            <span itemProp="name" className="font-semibold text-foreground">
              {author}
            </span>
            {(role || company) && (
              <span className="text-muted-foreground">
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
// ============================================================================

function QuickReferenceVariant(props: QuickReferenceProps) {
  const validated = quickReferencePropsSchema.parse(props);
  const { title, description, items, columns } = validated;
  const validItems = items;

  if (validItems.length === 0) {
    return null;
  }

  return (
    <Card
      itemScope
      itemType="https://schema.org/Table"
      className="my-8 border-l-4 border-accent bg-accent/5"
    >
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <BookOpen className="h-5 w-5 text-accent-foreground" />
          {title}
        </CardTitle>
        {description && <CardDescription itemProp="description">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
          {validItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              itemScope
              itemType="https://schema.org/PropertyValue"
              className={
                'flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 bg-card/50 rounded-lg border'
              }
            >
              <div className="sm:w-1/3">
                <dt itemProp="name" className={`font-medium ${UI_CLASSES.TEXT_SM_MUTED}`}>
                  {item.label}
                </dt>
              </div>
              <div className="sm:w-2/3">
                <dd itemProp="value" className="font-semibold text-foreground mb-1">
                  {item.value}
                </dd>
                {item.description && <p className={UI_CLASSES.TEXT_SM_MUTED}>{item.description}</p>}
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
  const validated = contentTabsPropsSchema.parse(props);
  const { items, title, description, defaultValue } = validated;
  const validItems = items;

  if (validItems.length === 0) {
    return null;
  }

  const firstValue = defaultValue || validItems[0]?.value || '';

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      {title && (
        <div className="mb-6">
          <h3 className={'text-xl font-bold mb-2'} itemProp="name">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue={firstValue} className="w-full">
        <TabsList
          className={'grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 h-auto p-1'}
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
