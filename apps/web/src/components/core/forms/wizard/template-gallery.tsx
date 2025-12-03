'use client';

/**
 * Template Gallery - One-Click Template Application
 *
 * Features:
 * - Live usage stats for each template
 * - One-click application to wizard form
 * - Filterable by content type
 * - Gorgeous cards with hover effects
 * - Social proof badges
 * - Responsive grid layout
 * - First-time user onboarding tooltips
 */

import type { Database } from '@heyclaude/database-types';
import {
  ArrowRight,
  CheckCircle,
  Info,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from '@heyclaude/web-runtime/icons';
import {
  absolute,
  alignItems,
  animate,
  animateDuration,
  bgColor,
  bgGradient,
  border,
  borderColor,
  borderTop,
  cluster,
  cursor,
  display,
  flexGrow,
  flexWrap,
  gap,
  gradientFrom,
  gradientTo,
  gradientVia,
  grid,
  height,
  hoverBg,
  hoverBorder,
  iconFill,
  iconSize,
  justify,
  marginBottom,
  marginTop,
  marginX,
  minWidth,
  muted,
  opacityLevel,
  overflow,
  padding,
  paddingBottom,
  paddingTop,
  pointerEvents,
  position,
  radius,
  row,
  shadow,
  shadowColor,
  size,
  skeletonSize,
  spaceY,
  stack,
  textAlign,
  textColor,
  transition,
  truncate,
  weight,
  width,
  zLayer,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@heyclaude/web-runtime/ui';
import { Badge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

// Use generated type directly from @heyclaude/database-types
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem & {
  templateData: ContentTemplateItem['template_data'];
} & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>);

interface TemplateGalleryProps {
  templates: MergedTemplateItem[];
  contentType: Database['public']['Enums']['content_category'] | null;
  onApplyTemplate: (template: MergedTemplateItem) => void;
  className?: string;
}

type TemplateWithStats = MergedTemplateItem & {
  usageCount?: number;
  trending?: boolean;
  featured?: boolean;
};

export function TemplateGallery({
  templates,
  contentType,
  onApplyTemplate,
  className,
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter templates by selected content type and category
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by content type (from wizard step 1)
    if (contentType) {
      filtered = filtered.filter((t) => t.type === contentType || t.category === contentType);
    }

    // Filter by selected category (from gallery tabs)
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    return filtered;
  }, [templates, contentType, selectedCategory]);

  // Extract unique categories for tabs
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category).filter(Boolean));
    return Array.from(cats);
  }, [templates]);

  // No templates available
  if (templates.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animation.spring.smooth}
      className={cn(spaceY.relaxed, className)}
    >
      {/* Header */}
      <div className={`${display.flex} ${alignItems.center} ${justify.between}`}>
        <div className={cluster.default}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={animation.spring.bouncy}
            className={cn(
              `${display.flex} ${iconSize['2xl']} ${alignItems.center} ${justify.center} ${radius.xl}`,
              `${bgGradient.toBR} ${gradientFrom.amber20} ${gradientTo.orange20}`,
              `${border.default} ${borderColor['amber/30']}`
            )}
          >
            <Sparkles className={cn(iconSize.md, textColor.accent)} />
          </motion.div>
          <div>
            <h3 className={`${weight.semibold} ${size.lg}`}>Popular Templates</h3>
            <p className={muted.sm}>
              Start with proven examples from the community
            </p>
          </div>
        </div>

        {/* Template count badge */}
        <Badge variant="secondary" className={`${gap.snug}`}>
          <TrendingUp className={iconSize.xsPlus} />
          {filteredTemplates.length} available
        </Badge>
      </div>

      {/* Category tabs (if multiple categories exist) */}
      {categories.length > 1 && (
        <div className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={height.input}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={height.input}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Templates grid */}
      <AnimatePresence mode="popLayout">
        <motion.div layout={true} className={grid.responsive123}>
          {filteredTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template as TemplateWithStats}
              index={index}
              onApply={() => onApplyTemplate(template)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${radius.xl} ${border.dashed} ${padding.section} ${textAlign.center}`}
        >
          <Sparkles className={`${marginX.auto} ${marginBottom.compact} ${iconSize['3xl']} ${muted.opacity50}`} />
          <p className={muted.default}>No templates found for this category.</p>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Individual Template Card
 */
interface TemplateCardProps {
  template: TemplateWithStats;
  index: number;
  onApply: () => void;
}

function TemplateCard({ template, index, onApply }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract stats from templateData (if available)
  const stats = useMemo(() => {
    try {
      const templateData = template.templateData;
      const data =
        typeof templateData === 'object' && templateData !== null && !Array.isArray(templateData)
          ? (templateData as Record<string, unknown>)
          : {};
      const usageCount = typeof data['usage_count'] === 'number' ? data['usage_count'] : 0;
      return {
        usageCount,
        trending: typeof data['trending'] === 'boolean' ? data['trending'] : undefined,
        featured: typeof data['featured'] === 'boolean' ? data['featured'] : undefined,
        successRate: typeof data['success_rate'] === 'number' ? data['success_rate'] : undefined,
        averageRating:
          typeof data['average_rating'] === 'number' ? data['average_rating'] : undefined,
        isPopular: usageCount > 100,
      };
    } catch {
      return {
        usageCount: 0,
        trending: undefined,
        featured: undefined,
        isPopular: false,
      };
    }
  }, [template]);

  // Parse tags
  const tags = useMemo(() => {
    const templateTags = template.tags;
    if (!templateTags) return [];
    try {
      return typeof templateTags === 'string' ? JSON.parse(templateTags) : templateTags;
    } catch {
      return [];
    }
  }, [template]);

  return (
    <motion.div
      layout={true}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ ...animation.spring.smooth, delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          `group ${position.relative} ${overflow.hidden} ${transition.all} ${animateDuration.slow}`,
          `hover:${shadowColor.amber} hover:${shadow.lg}`,
          hoverBorder['amber/50'],
          cursor.pointer
        )}
        onClick={onApply}
      >
        {/* Badges overlay */}
        <div className={`${absolute.topRightOffset} ${zLayer.raised} ${stack.snug}`}>
          {stats.featured && (
            <Badge
              variant="secondary"
              className={cn(
                `${gap.tight} ${borderColor['amber/50']} ${bgColor.warning}`,
                `text-amber-300 ${shadow.sm}`
              )}
            >
              <Star className={`${iconSize.xs} ${iconFill.current}`} />
              Featured
            </Badge>
          )}
          {stats.isPopular && !stats.featured && (
            <Badge
              variant="secondary"
              className={cn(
                `${gap.tight} border-purple-500/50 bg-purple-500/10`,
                `text-purple-300 ${shadow.sm}`
              )}
            >
              <Sparkles className={iconSize.xs} />
              Popular
            </Badge>
          )}
          {stats.trending && (
            <Badge
              variant="secondary"
              className={cn(
                `${gap.tight} ${borderColor['green/50']} ${bgColor.success}`,
                `${textColor.success400} ${shadow.sm}`
              )}
            >
              <TrendingUp className={iconSize.xs} />
              Trending
            </Badge>
          )}
        </div>

        <CardHeader className={paddingBottom.default}>
          <CardTitle className={`${display.flex} ${alignItems.start} ${justify.between} ${gap.compact} ${size.base}`}>
            <span className={truncate.lines2}>{template.name}</span>
            <motion.div
              animate={{
                x: isHovered ? 4 : 0,
                opacity: isHovered ? 1 : 0.6,
              }}
              transition={animation.spring.snappy}
            >
              <ArrowRight className={`${iconSize.sm} ${flexGrow.shrink0} ${textColor.amber}`} />
            </motion.div>
          </CardTitle>
        </CardHeader>

        <CardContent className={spaceY.comfortable}>
          {/* Description */}
          {template.description && (
            <p className={`${truncate.lines2} ${muted.sm}`}>{template.description}</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className={`${display.flex} ${flexWrap.wrap} ${gap.snug}`}>
              {tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className={`${height.badge} ${size.xs}`}>
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className={`${height.badge} ${size.xs}`}>
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Stats bar */}
          <div className={`${display.flex} ${alignItems.center} ${justify.between} ${borderTop.default} ${paddingTop.default}`}>
            {/* Usage count and rating */}
            <div className={cluster.default}>
              <div className={`${cluster.snug} ${muted.default} ${size.xs}`}>
                <Users className={iconSize.xsPlus} />
                <span>
                  {stats.usageCount > 0
                    ? stats.usageCount > 1000
                      ? `${(stats.usageCount / 1000).toFixed(1)}k`
                      : stats.usageCount
                    : 'New'}
                </span>
              </div>
              {stats.averageRating && stats.averageRating > 0 && (
                <div className={`${cluster.tight} ${textColor.amber400} ${size.xs}`}>
                  <Star className={`${iconSize.xs} ${iconFill.current}`} />
                  <span>{stats.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Apply button */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                `${height.buttonSm} ${gap.snug} ${padding.xTight} ${size.xs}`,
                `${textColor.amber} ${hoverBg.amberSubtle} hover:${textColor.warning400}`
              )}
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
            >
              <Zap className={iconSize.xsPlus} />
              Apply
            </Button>
          </div>
        </CardContent>

        {/* Hover gradient overlay */}
        <motion.div
          className={cn(
            `${pointerEvents.none} ${absolute.inset}`,
            `${bgGradient.toBR} ${gradientFrom.amber5} ${gradientVia.transparent} ${gradientTo.orange5}`,
            opacityLevel[0]
          )}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={animation.spring.smooth}
        />
      </Card>
    </motion.div>
  );
}

/**
 * Compact Template Selector (for inline use in wizard steps)
 */
interface TemplateQuickSelectProps {
  templates: MergedTemplateItem[];
  contentType: Database['public']['Enums']['content_category'] | null;
  onApplyTemplate: (template: MergedTemplateItem) => void;
  maxVisible?: number;
  className?: string;
}

export function TemplateQuickSelect({
  templates,
  contentType,
  onApplyTemplate,
  maxVisible = 3,
  className,
}: TemplateQuickSelectProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Filter and sort templates
  const allTemplates = useMemo(() => {
    let filtered = templates;

    if (contentType) {
      filtered = filtered.filter((t) => t.type === contentType || t.category === contentType);
    }

    return filtered;
  }, [templates, contentType]);

  // Check if user has seen template onboarding
  useEffect(() => {
    const hasSeenTemplates = localStorage.getItem('hasSeenTemplateOnboarding');
    if (!hasSeenTemplates && allTemplates.length > 0) {
      setShowOnboarding(true);
    }
  }, [allTemplates.length]);

  const displayTemplates = useMemo(() => {
    return expanded ? allTemplates : allTemplates.slice(0, maxVisible);
  }, [allTemplates, expanded, maxVisible]);

  const hasMore = allTemplates.length > maxVisible;

  if (allTemplates.length === 0) {
    return null;
  }

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenTemplateOnboarding', 'true');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animation.spring.smooth}
      className={cn(spaceY.default, className)}
    >
      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={animation.spring.bouncy}
        >
          <Alert className={`${borderColor['amber/50']} ${bgColor.warning}`}>
            <Info className={`${iconSize.sm} ${textColor.amber}`} />
            <AlertDescription className={`${display.flex} ${alignItems.start} ${justify.between} ${gap.default}`}>
              <span className={size.sm}>
                <strong className={weight.semibold}>💡 Pro tip:</strong> Save time by starting with a
                proven template. Click any template below to auto-fill your form with best
                practices.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissOnboarding}
                className={`${height.badge} ${padding.xTight} ${size.xs} ${hoverBg.amberStrong}`}
              >
                Got it
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      <div className={`${display.flex} ${alignItems.center} ${justify.between}`}>
        <div className={cluster.compact}>
          <Sparkles className={cn(iconSize.sm, textColor.accent)} />
          <span className={`${weight.medium} ${size.sm}`}>Quick Start Templates</span>
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className={`${height.buttonSm} ${size.xs}`}
          >
            {expanded ? 'Show Less' : `View All (${allTemplates.length})`}
          </Button>
        )}
      </div>

      <div className={spaceY.compact}>
        <AnimatePresence mode="popLayout">
          {displayTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              layout={true}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                ...animation.spring.smooth,
                delay: index * 0.05,
              }}
              onClick={() => onApplyTemplate(template)}
              className={cn(
                `${display.flex} ${width.full} ${alignItems.start} ${gap.default} ${radius.lg} ${border.default} ${padding.compact}`,
                `${textAlign.left} ${transition.all} ${animateDuration.default}`,
                `${hoverBorder['amber/50']} ${hoverBg.stronger}`,
                'group'
              )}
            >
              <CheckCircle
                className={cn(
                  `${marginTop.micro} ${iconSize.sm} ${flexGrow.shrink0}`,
                  `${muted.default} ${transition.colors}`,
                  `group-hover:${textColor.amber}`
                )}
              />
              <div className={`${minWidth[0]} ${flexGrow['1']} ${spaceY.tight}`}>
                <div className={`${truncate.single} ${weight.medium} ${size.sm}`}>{template.name}</div>
                {template.description && (
                  <div className={`${truncate.single} ${muted.default} ${size.xs}`}>
                    {template.description}
                  </div>
                )}
              </div>
              <ArrowRight
                className={cn(
                  `${marginTop.micro} ${iconSize.sm} ${flexGrow.shrink0} ${opacityLevel[0]}`,
                  `${textColor.amber500} ${transition.all}`,
                  `group-hover:translate-x-1 group-hover:${opacityLevel[100]}`
                )}
              />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Loading Skeleton for Template Quick Select
 */
export function TemplateQuickSelectSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(spaceY.default, className)}>
      <div className={cluster.compact}>
        <div className={`${iconSize.sm} ${animate.pulse} ${radius.default} ${bgColor.muted}`} />
        <div className={`${skeletonSize.barComfortable} ${animate.pulse} ${radius.default} ${bgColor.muted}`} />
      </div>
      <div className={spaceY.compact}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${row.default} ${radius.lg} ${border.default} ${padding.compact}`}>
            <div className={`${marginTop.micro} ${iconSize.sm} ${animate.pulse} ${radius.full} ${bgColor.muted}`} />
            <div className={`${flexGrow['1']} ${spaceY.compact}`}>
              <div className={`${skeletonSize.barThreeQuarters} ${animate.pulse} ${radius.default} ${bgColor.muted}`} />
              <div className={`${height.slider} ${width.full} ${animate.pulse} ${radius.default} ${bgColor.muted}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
