'use client';

/**
 * Animated Tag Cloud Component
 *
 * A visually stunning, interactive tag cloud with:
 * - Staggered entrance animations
 * - Floating/breathing continuous animations
 * - Interactive hover effects with glow and scale
 * - Category-based gradient coloring
 * - Size variations based on popularity
 * - Spring physics for natural feel
 *
 * @module features/tags/animated-tag-cloud
 */

import type { Database } from '@heyclaude/database-types';
import { formatTagForDisplay } from '@heyclaude/web-runtime/data/tag-utils';
import { animation, colors } from '@heyclaude/web-runtime/design-system/tokens';
import {
  animateDuration,
  backdrop,
  bgColor,
  bgGradient,
  borderColor,
  cluster,
  flexGrow,
  gap,
  gradientFrom,
  gradientTo,
  grid,
  alignItems,
  marginBottom,
  marginTop,
  muted,
  opacityLevel,
  padding,
  radius,
  shadow,
  size,
  transition,
  weight,
  zLayer,
  flexWrap,
  overflow,
  justify,
  squareSize,
  display,
  position,
  absolute,
  pointerEvents,
  hoverBorder,
  border,
  width,
  blur,
  groupHover,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ContentCategory = Database['public']['Enums']['content_category'];

export interface TagCloudItem {
  tag: string;
  count: number;
  categories: ContentCategory[];
}

interface AnimatedTagCloudProps {
  tags: TagCloudItem[];
  maxTags?: number;
  className?: string;
}

// Category to color mapping using design tokens
const CATEGORY_COLORS: Partial<Record<ContentCategory, { base: string; glow: string }>> = {
  agents: { base: colors.category.agents.base, glow: colors.category.agents.hover },
  mcp: { base: colors.category.mcp.base, glow: colors.category.mcp.hover },
  rules: { base: colors.category.rules.base, glow: colors.category.rules.hover },
  commands: { base: colors.category.commands.base, glow: colors.category.commands.hover },
  hooks: { base: colors.category.hooks.base, glow: colors.category.hooks.hover },
  statuslines: { base: colors.category.statuslines.base, glow: colors.category.statuslines.hover },
  skills: { base: colors.category.skills.base, glow: colors.category.skills.hover },
  guides: { base: colors.category.guides.base, glow: colors.category.guides.hover },
  collections: { base: colors.category.collections.base, glow: colors.category.collections.hover },
};

/**
 * Get color based on primary category
 */
function getTagColor(categories: ContentCategory[]): { base: string; glow: string } {
  for (const cat of categories) {
    if (CATEGORY_COLORS[cat]) {
      return CATEGORY_COLORS[cat]!;
    }
  }
  return { base: colors.category.default.base, glow: colors.category.default.hover };
}

/**
 * Calculate tag size class based on relative popularity
 */
function getTagSizeClass(count: number, maxCount: number): {
  fontSize: string;
  padding: string;
  fontWeight: string;
} {
  // Defensive: handle division by zero
  const ratio = maxCount > 0 ? count / maxCount : 0;

  if (ratio > 0.7) {
    return { fontSize: size.lg, padding: `${padding.xDefault} ${padding.yTight}`, fontWeight: weight.bold };
  }
  if (ratio > 0.4) {
    return { fontSize: size.base, padding: `${padding.xCompact} ${padding.ySnug}`, fontWeight: weight.semibold };
  }
  if (ratio > 0.2) {
    return { fontSize: size.sm, padding: `${padding.xTight} ${padding.yMicro}`, fontWeight: weight.medium };
  }
  return { fontSize: size.xs, padding: `${padding.xTight} ${padding.yHair}`, fontWeight: weight.medium };
}

/**
 * Generate random floating animation parameters for organic movement
 */
function getFloatingAnimation(index: number): {
  y: number[];
  x: number[];
  rotate: number[];
  duration: number;
} {
  // Use index to create varied but deterministic animations
  const seed = index * 137.5; // Golden angle for distribution
  const yAmplitude = 3 + (seed % 5);
  const xAmplitude = 2 + ((seed * 1.3) % 4);
  const rotateAmplitude = 1 + ((seed * 0.7) % 2);
  const baseDuration = 4 + (seed % 3);

  return {
    y: [0, -yAmplitude, 0, yAmplitude, 0],
    x: [0, xAmplitude, 0, -xAmplitude, 0],
    rotate: [0, rotateAmplitude, 0, -rotateAmplitude, 0],
    duration: baseDuration,
  };
}

/**
 * Individual animated tag component
 */
function AnimatedTag({
  tag,
  index,
  maxCount,
}: {
  tag: TagCloudItem;
  index: number;
  maxCount: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const tagColor = getTagColor(tag.categories);
  const sizeClass = getTagSizeClass(tag.count, maxCount);
  const floatingAnim = useMemo(() => getFloatingAnimation(index), [index]);

  // Mouse position for spotlight effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightX = useSpring(mouseX, { stiffness: 500, damping: 30 });
  const spotlightY = useSpring(mouseY, { stiffness: 500, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  // Transform spotlight position to gradient
  const spotlightBackground = useTransform(
    [spotlightX, spotlightY],
    ([x, y]) =>
      `radial-gradient(120px circle at ${x}px ${y}px, ${tagColor.glow}, transparent 70%)`
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: floatingAnim.y,
        x: floatingAnim.x,
        rotate: floatingAnim.rotate,
      }}
      transition={{
        opacity: { duration: 0.4, delay: index * animation.stagger.fast },
        scale: { duration: 0.4, delay: index * animation.stagger.fast, ...animation.spring.bouncy },
        y: {
          duration: floatingAnim.duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.2,
        },
        x: {
          duration: floatingAnim.duration * 1.3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.15,
        },
        rotate: {
          duration: floatingAnim.duration * 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.1,
        },
      }}
      whileHover={{
        scale: 1.15,
        y: 0,
        x: 0,
        rotate: 0,
        zIndex: 10,
      }}
      className={position.relative}
    >
      <Link
        href={`/tags/${encodeURIComponent(tag.tag)}`}
        className={cn(
          `${position.relative} block ${overflow.hidden} ${radius.full} border ${transition.all} ${animateDuration.slow}`,
          sizeClass.fontSize,
          sizeClass.padding,
          sizeClass.fontWeight,
          `${borderColor['border/30']} ${bgColor['background/80']} ${backdrop.sm}`,
          `${hoverBorder.accent} hover:${shadow.lg}`,
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        style={{
          boxShadow: isHovered ? `0 0 30px ${tagColor.glow}` : 'none',
        }}
      >
        {/* Spotlight effect overlay */}
        <motion.div
          className={`${pointerEvents.none} ${absolute.inset} ${radius.full} ${opacityLevel[0]} ${transition.opacity} ${animateDuration.slow}`}
          style={{
            background: spotlightBackground,
            opacity: isHovered ? 0.6 : 0,
          }}
        />

        {/* Gradient border on hover */}
        <motion.div
          className={`${pointerEvents.none} ${absolute.inset} ${radius.full}`}
          style={{
            background: `linear-gradient(135deg, ${tagColor.base}, transparent)`,
            opacity: isHovered ? 0.2 : 0,
          }}
          animate={{ opacity: isHovered ? 0.2 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Tag content */}
        <span className={`${position.relative} ${zLayer.raised} ${cluster.snug}`}>
          <span
            className={`${transition.colors} ${animateDuration.default}`}
            style={{ color: isHovered ? tagColor.base : undefined }}
          >
            {formatTagForDisplay(tag.tag)}
          </span>
          <span
            className={`${radius.full} ${bgColor['muted/50']} ${padding.xSnug} ${size['2xs']} tabular-nums ${muted.default} ${transition.colors} ${animateDuration.default}`}
            style={{
              backgroundColor: isHovered ? `color-mix(in oklch, ${tagColor.base} 15%, transparent)` : undefined,
              color: isHovered ? tagColor.base : undefined,
            }}
          >
            {tag.count}
          </span>
        </span>
      </Link>
    </motion.div>
  );
}

/**
 * Main animated tag cloud component
 */
export function AnimatedTagCloud({ tags, maxTags = 50, className }: AnimatedTagCloudProps) {
  const displayTags = tags.slice(0, maxTags);
  const maxCount = displayTags[0]?.count ?? 1;

  if (displayTags.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        `${position.relative} flex ${flexWrap.wrap} ${alignItems.center} ${justify.center} ${gap.default}`,
        className
      )}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: animation.stagger.fast,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {/* Ambient glow background */}
      <div className={`${pointerEvents.none} ${absolute.inset} ${zLayer.behind10}`}>
        <div className={`${position.absolute} left-1/4 top-1/4 ${squareSize.avatar4xl} ${radius.full} ${bgColor['accent/5']} ${blur['3xl']}`} />
        <div className={`${position.absolute} bottom-1/4 right-1/4 ${squareSize.avatar5xl} ${radius.full} ${bgColor['primary/5']} ${blur['3xl']}`} />
      </div>

      {displayTags.map((tag, index) => (
        <AnimatedTag key={tag.tag} tag={tag} index={index} maxCount={maxCount} />
      ))}
    </motion.div>
  );
}

/**
 * Popular tags horizontal scroller with continuous animation
 * Uses a ref to measure actual content width for seamless looping
 */
export function PopularTagsMarquee({
  tags,
  className,
}: {
  tags: TagCloudItem[];
  className?: string;
}) {
  const displayTags = tags.slice(0, 15);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Measure the actual width of the first set of tags
  useEffect(() => {
    if (containerRef.current) {
      // Get the first half of children (original tags, not duplicates)
      const children = Array.from(containerRef.current.children);
      const originalTagsCount = displayTags.length;
      const originalTags = children.slice(0, originalTagsCount);
      
      // Calculate total width including gap (16px = ${gap.comfortable})
      const totalWidth = originalTags.reduce((acc, child, index) => {
        const width = (child as HTMLElement).offsetWidth;
        const gap = index < originalTagsCount - 1 ? 16 : 0;
        return acc + width + gap;
      }, 0);
      
      setContentWidth(totalWidth);
    }
  }, [displayTags.length]);

  if (displayTags.length === 0) {
    return null;
  }

  // Duplicate for seamless loop
  const duplicatedTags = [...displayTags, ...displayTags];

  return (
    <div className={cn(
  `${position.relative} ${overflow.hidden}`, className)}>
      {/* Gradient fade edges */}
      <div className={`${pointerEvents.none} ${absolute.insetYLeft} ${zLayer.raised} ${width.gradientFade} ${bgGradient.toR} ${gradientFrom.background} ${gradientTo.transparent}`} />
      <div className={`${pointerEvents.none} ${absolute.insetYRight} ${zLayer.raised} ${width.gradientFade} ${bgGradient.toL} ${gradientFrom.background} ${gradientTo.transparent}`} />

      <motion.div
        ref={containerRef}
        className={`${display.flex} ${gap.comfortable}`}
        animate={{ x: contentWidth > 0 ? [0, -(contentWidth + 16)] : 0 }}
        transition={{
          x: {
            duration: Math.max(20, contentWidth / 30), // Dynamic duration based on content width
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {duplicatedTags.map((tag, index) => {
          const tagColor = getTagColor(tag.categories);
          return (
            <Link
              key={`${tag.tag}-${index}`}
              href={`/tags/${encodeURIComponent(tag.tag)}`}
              className={cn(
                `flex ${border.default} ${bgColor['background/60']} ${transition.all} ${hoverBorder.accent} hover:${shadow.md}`,
                flexGrow.shrink0,
                alignItems.center,
                gap.compact,
                radius.full,
                borderColor['border/30'],
                padding.xDefault,
                padding.yCompact,
                backdrop.sm,
                animateDuration.default
              )}
              style={{
                ['--tag-color' as string]: tagColor.base,
              }}
            >
              <span className={cn(weight.medium, size.sm)}>{formatTagForDisplay(tag.tag)}</span>
              <span className={cn(`${radius.full} tabular-nums`, bgColor['muted/50'], padding.xTight, padding.yHair, size.xs, muted.default)}>
                {tag.count}
              </span>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}

/**
 * Featured tags with 3D tilt effect
 */
export function FeaturedTagsGrid({
  tags,
  className,
}: {
  tags: TagCloudItem[];
  className?: string;
}) {
  const featuredTags = tags.slice(0, 6);

  if (featuredTags.length === 0) {
    return null;
  }

  return (
    <div className={cn(
  `${grid.responsive23Gap4}`, className)}>
      {featuredTags.map((tag, index) => (
        <FeaturedTagCard key={tag.tag} tag={tag} index={index} />
      ))}
    </div>
  );
}

/**
 * Individual featured tag card with 3D tilt
 */
function FeaturedTagCard({ tag, index }: { tag: TagCloudItem; index: number }) {
  const tagColor = getTagColor(tag.categories);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 300,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 300,
    damping: 20,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ...animation.spring.smooth,
      }}
      style={{ perspective: 1000 }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        <Link
          href={`/tags/${encodeURIComponent(tag.tag)}`}
          className={cn(
            `group ${position.relative} block ${overflow.hidden} ${radius.xl} border ${borderColor[`border/30`]} ${padding.comfortable}`,
            `${bgGradient.toBR} ${gradientFrom.background} ${gradientTo.muted20} ${backdrop.sm}`,
            `${transition.all} ${animateDuration.slow} ${hoverBorder.accent} hover:${shadow.xl}`
          )}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background glow */}
          <div
            className={`${absolute.inset} ${opacityLevel[0]} ${transition.opacity} ${animateDuration.slow} group-hover:${opacityLevel[100]}`}
            style={{
              background: `radial-gradient(circle at 50% 50%, ${tagColor.glow}, transparent 70%)`,
            }}
          />

          {/* Content */}
          <div className={`${position.relative} ${zLayer.raised}`}>
            <h3
              className={`${marginBottom.tight} ${weight.bold} ${size.xl} ${transition.colors} ${animateDuration.default} ${groupHover.accent}`}
              style={{ color: tagColor.base }}
            >
              {formatTagForDisplay(tag.tag)}
            </h3>
            <p className={muted.sm}>
              {tag.count} {tag.count === 1 ? 'item' : 'items'}
            </p>

            {/* Category pills */}
            <div className={`${marginTop.compact} ${display.flex} ${flexWrap.wrap} ${gap.tight}`}>
              {tag.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className={`${radius.full} ${border.default} ${borderColor['border/50']} ${bgColor['background/50']} ${padding.xTight} ${padding.yHair} ${size.xs} capitalize ${muted.default}`}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Shine effect */}
          <motion.div
            className={`${pointerEvents.none} ${absolute.inset} ${opacityLevel[0]} ${transition.opacity} ${animateDuration.slow} group-hover:${opacityLevel[100]}`}
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
              transform: 'translateZ(20px)',
            }}
          />
        </Link>
      </motion.div>
    </motion.div>
  );
}
