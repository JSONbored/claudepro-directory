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

import { type Database } from '@heyclaude/database-types';
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
  cn,
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/design-tokens';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

// Use generated type directly from @heyclaude/database-types
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem &
  (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>) & {
    templateData: ContentTemplateItem['template_data'];
  };

interface TemplateGalleryProps {
  className?: string;
  contentType: Database['public']['Enums']['content_category'] | null;
  onApplyTemplate: (template: MergedTemplateItem) => void;
  templates: MergedTemplateItem[];
}

type TemplateWithStats = MergedTemplateItem & {
  featured?: boolean;
  trending?: boolean;
  usageCount?: number;
};

export function TemplateGallery({
  templates,
  contentType,
  onApplyTemplate,
  className,
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<null | string>(null);

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
    return [...cats];
  }, [templates]);

  // No templates available
  if (templates.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
      className={cn('space-y-6', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING.bouncy}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              'bg-linear-to-br from-amber-500/20 to-orange-500/20',
              'border border-amber-500/30'
            )}
          >
            <Sparkles className={cn('h-5 w-5', TOKENS.colors.accent)} />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold">Popular Templates</h3>
            <p className="text-muted-foreground text-sm">
              Start with proven examples from the community
            </p>
          </div>
        </div>

        {/* Template count badge */}
        <Badge variant="secondary" className="gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          {filteredTemplates.length} available
        </Badge>
      </div>

      {/* Category tabs (if multiple categories exist) */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-8"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="h-8"
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Templates grid */}
      <AnimatePresence mode="popLayout">
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          className="rounded-xl border border-dashed p-12 text-center"
        >
          <Sparkles className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">No templates found for this category.</p>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Individual Template Card
 */
interface TemplateCardProps {
  index: number;
  onApply: () => void;
  template: TemplateWithStats;
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ ...SPRING.smooth, delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:shadow-amber-500/10',
          'hover:border-amber-500/50',
          'cursor-pointer'
        )}
        onClick={onApply}
      >
        {/* Badges overlay */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          {stats.featured ? (
            <Badge
              variant="secondary"
              className={cn(
                'gap-1 border-amber-500/50 bg-amber-500/10',
                'text-amber-300 shadow-sm'
              )}
            >
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          ) : null}
          {stats.isPopular && !stats.featured ? (
            <Badge
              variant="secondary"
              className={cn(
                'gap-1 border-purple-500/50 bg-purple-500/10',
                'text-purple-300 shadow-sm'
              )}
            >
              <Sparkles className="h-3 w-3" />
              Popular
            </Badge>
          ) : null}
          {stats.trending ? (
            <Badge
              variant="secondary"
              className={cn(
                'gap-1 border-green-500/50 bg-green-500/10',
                'text-green-300 shadow-sm'
              )}
            >
              <TrendingUp className="h-3 w-3" />
              Trending
            </Badge>
          ) : null}
        </div>

        <CardHeader className="pb-3">
          <CardTitle className="flex items-start justify-between gap-2 text-base">
            <span className="line-clamp-2">{template.name}</span>
            <motion.div
              animate={{
                x: isHovered ? 4 : 0,
                opacity: isHovered ? 1 : 0.6,
              }}
              transition={SPRING.snappy}
            >
              <ArrowRight className="h-4 w-4 shrink-0 text-amber-500" />
            </motion.div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {template.description ? (
            <p className="text-muted-foreground line-clamp-2 text-sm">{template.description}</p>
          ) : null}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="h-6 text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="h-6 text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Stats bar */}
          <div className="flex items-center justify-between border-t pt-3">
            {/* Usage count and rating */}
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {stats.usageCount > 0
                    ? stats.usageCount > 1000
                      ? `${(stats.usageCount / 1000).toFixed(1)}k`
                      : stats.usageCount
                    : 'New'}
                </span>
              </div>
              {stats.averageRating && stats.averageRating > 0 ? (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{stats.averageRating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>

            {/* Apply button */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 gap-1.5 px-2 text-xs',
                'text-amber-500 hover:bg-amber-500/10 hover:text-amber-400'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              Apply
            </Button>
          </div>
        </CardContent>

        {/* Hover gradient overlay */}
        <motion.div
          className={cn(
            'pointer-events-none absolute inset-0',
            'bg-linear-to-br from-amber-500/5 via-transparent to-orange-500/5',
            'opacity-0'
          )}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={SPRING.smooth}
        />
      </Card>
    </motion.div>
  );
}

/**
 * Compact Template Selector (for inline use in wizard steps)
 */
interface TemplateQuickSelectProps {
  className?: string;
  contentType: Database['public']['Enums']['content_category'] | null;
  maxVisible?: number;
  onApplyTemplate: (template: MergedTemplateItem) => void;
  templates: MergedTemplateItem[];
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
      transition={SPRING.smooth}
      className={cn('space-y-3', className)}
    >
      {/* Onboarding Tooltip */}
      {showOnboarding ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={SPRING.bouncy}
        >
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertDescription className="flex items-start justify-between gap-3">
              <span className="text-sm">
                <strong className="font-semibold">💡 Pro tip:</strong> Save time by starting with a
                proven template. Click any template below to auto-fill your form with best
                practices.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissOnboarding}
                className="h-6 px-2 text-xs hover:bg-amber-500/20"
              >
                Got it
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : null}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className={cn('h-4 w-4', TOKENS.colors.accent)} />
          <span className="text-sm font-medium">Quick Start Templates</span>
        </div>
        {hasMore ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 text-xs"
          >
            {expanded ? 'Show Less' : `View All (${allTemplates.length})`}
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                ...SPRING.smooth,
                delay: index * 0.05,
              }}
              onClick={() => onApplyTemplate(template)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3',
                'text-left transition-all duration-200',
                'hover:bg-accent/50 hover:border-amber-500/50',
                'group'
              )}
            >
              <CheckCircle
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  'text-muted-foreground transition-colors',
                  'group-hover:text-amber-500'
                )}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="line-clamp-1 text-sm font-medium">{template.name}</div>
                {template.description ? (
                  <div className="text-muted-foreground line-clamp-1 text-xs">
                    {template.description}
                  </div>
                ) : null}
              </div>
              <ArrowRight
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 opacity-0',
                  'text-amber-500 transition-all',
                  'group-hover:translate-x-1 group-hover:opacity-100'
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
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <div className="bg-muted h-4 w-4 animate-pulse rounded" />
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="bg-muted mt-0.5 h-4 w-4 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              <div className="bg-muted h-3 w-full animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
