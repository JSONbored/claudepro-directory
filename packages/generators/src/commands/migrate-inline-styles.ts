#!/usr/bin/env tsx
/**
 * Inline Styles Migration Command
 *
 * Migrates inline Tailwind classes to semantic design system utilities.
 * Uses ts-morph for AST-based transformations to handle template literals,
 * string literals, and imports correctly.
 *
 * Usage:
 *   pnpm exec heyclaude-migrate-inline-styles --dry-run              # Analyze only (all phases)
 *   pnpm exec heyclaude-migrate-inline-styles                         # Apply all phases
 *   pnpm exec heyclaude-migrate-inline-styles --phase=1                # Phase 1: Spacing only
 *   pnpm exec heyclaude-migrate-inline-styles --phase=1 --dry-run     # Dry run Phase 1
 *
 * Phases:
 *   1: Spacing (margins, padding, gaps, space-x/y) - Safest
 *   2: Layout & Flex/Grid (stack, cluster, flex, grid, display)
 *   3: Typography (text size, font weight, leading, tracking, truncate)
 *   4: Colors & Interactive (muted, hover, semantic colors, transitions)
 *   5: Advanced (borders, shadows, position, icons, gradients, etc.)
 */

import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Project,
  Node,
  SourceFile,
  JsxAttribute,
  StringLiteral,
  TemplateExpression,
  TemplateSpan,
} from 'ts-morph';

import { logger } from '../toolkit/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

interface ClassNameMapping {
  // Tailwind class pattern
  pattern: RegExp;
  // Replacement function: (match, capturedGroups) => replacement string
  replacement: (match: string, ...groups: string[]) => string;
  // Required import name (null for patterns that don't need imports, like arbitrary values)
  importName: string | null;
  // Description for logging
  description: string;
  // Phase number (1-5) for incremental migration
  phase: number;
}

// Mapping: Tailwind class → semantic utility
const CLASSNAME_MAPPINGS: ClassNameMapping[] = [
  // Margin Bottom: mb-* → marginBottom.*
  {
    pattern: /\bmb-(\d+|auto|px|py)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '0.5': 'micro',
        '1': 'tight',
        '2': 'compact',
        '3': 'compact',
        '4': 'default',
        '5': '5', // Direct mapping for mb-5
        '6': 'comfortable',
        '7': '7', // Direct mapping for mb-7
        '8': 'relaxed',
        '12': 'loose',
        '16': 'hero',
        px: 'px', // Direct mapping for mb-px
        py: 'py', // Direct mapping for mb-py
      };
      const key = mapping[value] || 'default';
      // Handle numeric keys and special values (mb-5, mb-7, mb-px, mb-py) that need bracket notation
      const accessor = /^\d+$/.test(key) || key === 'px' || key === 'py' ? `['${key}']` : `.${key}`;
      return `\${marginBottom${accessor}}`;
    },
    importName: 'marginBottom',
    description: 'Margin bottom',
    phase: 1, // Phase 1: Spacing
  },
  // Margin Top: mt-* → marginTop.*
  {
    pattern: /\bmt-(\d+|auto|px|py)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '0.5': 'micro',
        '1': 'tight',
        '2': 'compact',
        '4': 'default',
        '5': '5', // Direct mapping for mt-5
        '6': 'comfortable',
        '8': 'relaxed',
        px: 'px', // Direct mapping for mt-px
        py: 'py', // Direct mapping for mt-py
      };
      const key = mapping[value] || 'default';
      // Handle numeric keys and special values (mt-5, mt-px, mt-py) that need bracket notation
      const accessor = /^\d+$/.test(key) || key === 'px' || key === 'py' ? `['${key}']` : `.${key}`;
      return `\${marginTop${accessor}}`;
    },
    importName: 'marginTop',
    description: 'Margin top',
    phase: 1, // Phase 1: Spacing
  },
  // Space Y: space-y-* → spaceY.*
  {
    pattern: /\bspace-y-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'tight',
        '2': 'compact',
        '3': 'default',
        '4': 'comfortable',
        '6': 'relaxed',
        '8': 'loose',
      };
      const key = mapping[value] || 'default';
      return `\${spaceY.${key}}`;
    },
    importName: 'spaceY',
    description: 'Vertical spacing',
    phase: 1, // Phase 1: Spacing
  },
  // Space X: space-x-* → spaceX.*
  {
    pattern: /\bspace-x-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'tight',
        '2': 'compact',
        '3': 'default',
        '4': 'comfortable',
        '6': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${spaceX.${key}}`;
    },
    importName: 'spaceX',
    description: 'Horizontal spacing',
    phase: 1, // Phase 1: Spacing
  },
  // Stack: flex flex-col gap-* → stack.*
  {
    pattern: /\bflex\s+flex-col\s+gap-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'tight',
        '2': 'compact',
        '3': 'default',
        '4': 'comfortable',
        '6': 'relaxed',
        '8': 'loose',
      };
      const key = mapping[value] || 'default';
      return `\${stack.${key}}`;
    },
    importName: 'stack',
    description: 'Vertical flex layout',
    phase: 2, // Phase 2: Layout
  },
  // Cluster: flex items-center gap-* → cluster.*
  {
    pattern: /\bflex\s+items-center\s+gap-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'tight',
        '2': 'compact',
        '3': 'default',
        '4': 'comfortable',
      };
      const key = mapping[value] || 'default';
      return `\${cluster.${key}}`;
    },
    importName: 'cluster',
    description: 'Horizontal centered layout',
    phase: 2, // Phase 2: Layout
  },
  // Muted text: text-muted-foreground → muted.default
  {
    pattern: /\btext-muted-foreground\b/g,
    replacement: () => '${muted.default}',
    importName: 'muted',
    description: 'Muted text',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Border radius: rounded-* → radius.*
  {
    pattern: /\brounded-(sm|md|lg|xl|2xl|3xl|full)\b/g,
    replacement: (match, size) => {
      // Keys that need bracket notation (start with number or are reserved words)
      const needsBrackets = size === '2xl' || size === '3xl' || size === 'full';
      const accessor = needsBrackets ? `['${size}']` : `.${size}`;
      return `\${radius${accessor}}`;
    },
    importName: 'radius',
    description: 'Border radius',
    phase: 5, // Phase 5: Advanced
  },
  // Hover background: hover:bg-accent/* → hoverBg.*
  {
    pattern: /\bhover:bg-accent\/(5|10|15|20|50|90)\b/g,
    replacement: (match, opacity) => {
      const mapping: Record<string, string> = {
        '5': 'subtle',
        '10': 'default',
        '15': 'accent15',
        '20': 'strong',
        '50': 'accent50',
        '90': 'accent90',
      };
      const key = mapping[opacity] || 'default';
      return `\${hoverBg.${key}}`;
    },
    importName: 'hoverBg',
    description: 'Hover background (accent)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Hover background: hover:bg-muted/* → hoverBg.*
  {
    pattern: /\bhover:bg-muted\/(30|50)\b/g,
    replacement: (match, opacity) => {
      const mapping: Record<string, string> = {
        '30': 'muted30',
        '50': 'muted',
      };
      const key = mapping[opacity] || 'muted';
      return `\${hoverBg.${key}}`;
    },
    importName: 'hoverBg',
    description: 'Hover background (muted)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Hover background: hover:bg-primary → hoverBg.primary
  {
    pattern: /\bhover:bg-primary\/?(90)?\b/g,
    replacement: (match, opacity) => {
      if (opacity === '90') {
        return '${hoverBg.primary90}';
      }
      return '${hoverBg.primary}';
    },
    importName: 'hoverBg',
    description: 'Hover background (primary)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Hover background: hover:bg-destructive → hoverBg.destructive
  {
    pattern: /\bhover:bg-destructive\/?(10)?\b/g,
    replacement: (match, opacity) => {
      if (opacity === '10') {
        return '${hoverBg.destructive10}';
      }
      return '${hoverBg.destructive}';
    },
    importName: 'hoverBg',
    description: 'Hover background (destructive)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Hover background: hover:bg-secondary → hoverBg.secondary
  {
    pattern: /\bhover:bg-secondary\b/g,
    replacement: () => '${hoverBg.secondary}',
    importName: 'hoverBg',
    description: 'Hover background (secondary)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Hover background: hover:bg-accent (solid, no opacity) → hoverBg.accentSolid
  {
    pattern: /\bhover:bg-accent\b(?!\/)/g,
    replacement: () => '${hoverBg.accentSolid}',
    importName: 'hoverBg',
    description: 'Hover background (accent solid)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Hover background: hover:bg-accent-primary/* → hoverBg.* (treat as accent)
  {
    pattern: /\bhover:bg-accent-primary\/(\d+)\b/g,
    replacement: (match, opacity) => {
      // Map accent-primary to accent (they're semantically the same)
      const mapping: Record<string, string> = {
        '20': 'strong',
      };
      const key = mapping[opacity] || 'default';
      return `\${hoverBg.${key}}`;
    },
    importName: 'hoverBg',
    description: 'Hover background (accent-primary, mapped to accent)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Custom hex colors: hover:bg-[#HEX]/opacity → Preserve but modernize
  // Note: We'll keep these as arbitrary values but ensure they're in template literals
  // This ensures they're properly formatted even if not migrated to semantic utilities
  {
    pattern: /\bhover:bg-\[#[0-9A-Fa-f]{6}\]\/?(\d+)?\b/g,
    replacement: (match, opacity) => {
      // Extract the hex color and opacity
      const hexMatch = match.match(/#[0-9A-Fa-f]{6}/);
      const hex = hexMatch ? hexMatch[0] : '';
      const opacityPart = opacity ? `/${opacity}` : '';
      // Keep as arbitrary value but ensure it's in template literal format
      // This is a modernization - ensures proper formatting
      return `hover:bg-[${hex}]${opacityPart}`;
    },
    importName: null, // No import needed for arbitrary values
    description: 'Hover background (custom hex - modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Static hex colors: bg-[#HEX] → Preserve but modernize
  {
    pattern: /\bbg-\[#[0-9A-Fa-f]{3,6}\]\/?(\d+)?\b/g,
    replacement: (match, opacity) => {
      // Extract the hex color and opacity
      const hexMatch = match.match(/#[0-9A-Fa-f]{3,6}/);
      const hex = hexMatch ? hexMatch[0] : '';
      const opacityPart = opacity ? `/${opacity}` : '';
      // Keep as arbitrary value but ensure it's in template literal format
      return `bg-[${hex}]${opacityPart}`;
    },
    importName: null, // No import needed for arbitrary values
    description: 'Background (custom hex - modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Text hex colors: text-[#HEX] → Preserve but modernize
  {
    pattern: /\btext-\[#[0-9A-Fa-f]{3,6}\]\/?(\d+)?\b/g,
    replacement: (match, opacity) => {
      // Extract the hex color and opacity
      const hexMatch = match.match(/#[0-9A-Fa-f]{3,6}/);
      const hex = hexMatch ? hexMatch[0] : '';
      const opacityPart = opacity ? `/${opacity}` : '';
      // Keep as arbitrary value but ensure it's in template literal format
      return `text-[${hex}]${opacityPart}`;
    },
    importName: null, // No import needed for arbitrary values
    description: 'Text color (custom hex - modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Border hex colors: border-[#HEX] → Preserve but modernize
  {
    pattern: /\bborder-\[#[0-9A-Fa-f]{3,6}\]\/?(\d+)?\b/g,
    replacement: (match, opacity) => {
      // Extract the hex color and opacity
      const hexMatch = match.match(/#[0-9A-Fa-f]{3,6}/);
      const hex = hexMatch ? hexMatch[0] : '';
      const opacityPart = opacity ? `/${opacity}` : '';
      // Keep as arbitrary value but ensure it's in template literal format
      return `border-[${hex}]${opacityPart}`;
    },
    importName: null, // No import needed for arbitrary values
    description: 'Border color (custom hex - modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Padding: p-* → padding.* (must come before px/py patterns)
  {
    pattern: /\bp-(\d+)\b(?!x|y)/g, // Negative lookahead to avoid matching px/py
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
        '12': 'section',
      };
      const key = mapping[value] || 'default';
      return `\${padding.${key}}`;
    },
    importName: 'padding',
    description: 'Padding (all sides)',
    phase: 1, // Phase 1: Spacing
  },
  // Padding X: px-* → paddingX.*
  {
    pattern: /\bpx-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${paddingX.${key}}`;
    },
    importName: 'paddingX',
    description: 'Padding X',
    phase: 1, // Phase 1: Spacing
  },
  // Padding Y: py-* → paddingY.*
  {
    pattern: /\bpy-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
        '12': 'section',
      };
      const key = mapping[value] || 'default';
      return `\${paddingY.${key}}`;
    },
    importName: 'paddingY',
    description: 'Padding Y',
    phase: 1, // Phase 1: Spacing
  },
  // Padding Top: pt-* → paddingTop.*
  {
    pattern: /\bpt-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${paddingTop.${key}}`;
    },
    importName: 'paddingTop',
    description: 'Padding Top',
    phase: 1, // Phase 1: Spacing
  },
  // Padding Bottom: pb-* → paddingBottom.*
  {
    pattern: /\bpb-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${paddingBottom.${key}}`;
    },
    importName: 'paddingBottom',
    description: 'Padding Bottom',
    phase: 1, // Phase 1: Spacing
  },
  // Padding Left: pl-* → paddingLeft.*
  {
    pattern: /\bpl-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${paddingLeft.${key}}`;
    },
    importName: 'paddingLeft',
    description: 'Padding Left',
    phase: 1, // Phase 1: Spacing
  },
  // Padding Right: pr-* → paddingRight.*
  {
    pattern: /\bpr-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${paddingRight.${key}}`;
    },
    importName: 'paddingRight',
    description: 'Padding Right',
    phase: 1, // Phase 1: Spacing
  },
  // Standalone gap: gap-* → gap.* (when not part of flex/grid compound patterns)
  // This must run AFTER stack/cluster patterns to avoid conflicts
  {
    pattern: /\bgap-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${gap.${key}}`;
    },
    importName: 'gap',
    description: 'Gap (standalone, for grid/other layouts)',
    phase: 1, // Phase 1: Spacing
  },
  // Text size: text-* → size.*
  {
    pattern: /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b/g,
    replacement: (match, size) => {
      // Keys that need bracket notation (start with number like '2xl', '3xl', '4xl')
      const needsBrackets = size === '2xl' || size === '3xl' || size === '4xl';
      const accessor = needsBrackets ? `['${size}']` : `.${size}`;
      return `\${size${accessor}}`;
    },
    importName: 'size',
    description: 'Text size',
    phase: 3, // Phase 3: Typography
  },
  // Font weight: font-* → weight.*
  {
    pattern: /\bfont-(normal|medium|semibold|bold)\b/g,
    replacement: (match, weight) => {
      return `\${weight.${weight}}`;
    },
    importName: 'weight',
    description: 'Font weight',
    phase: 3, // Phase 3: Typography
  },
  // Width: w-full, w-auto, etc. → Keep as-is but ensure template literal
  // Note: These don't have semantic utilities yet, but we still want to transform
  // className attributes that contain them to ensure consistency
  {
    pattern: /\bw-(full|auto|screen|fit|min|max)\b/g,
    replacement: (match, value) => {
      // Keep as-is but ensure it's in template literal format
      return `w-${value}`;
    },
    importName: null, // No semantic utility yet
    description: 'Width (full, auto, screen, fit, min, max) - modernized formatting',
    phase: 5, // Phase 5: Advanced
  },
  // Height: h-full, h-screen, etc. → Keep as-is but ensure template literal
  {
    pattern: /\bh-(full|screen|fit|min|max)\b(?!\s+w-)/g, // Negative lookahead to avoid matching h-X w-Y icon patterns
    replacement: (match, value) => {
      // Keep as-is but ensure it's in template literal format
      return `h-${value}`;
    },
    importName: null, // No semantic utility yet
    description: 'Height (full, screen, fit, min, max) - modernized formatting',
    phase: 5, // Phase 5: Advanced
  },
  // Flex: flex-1, flex-none, etc. → Keep as-is but ensure template literal
  {
    pattern: /\bflex-(1|none|auto|initial)\b/g,
    replacement: (match, value) => {
      // Keep as-is but ensure it's in template literal format
      return `flex-${value}`;
    },
    importName: null, // No semantic utility yet
    description: 'Flex (1, none, auto, initial) - modernized formatting',
    phase: 2, // Phase 2: Layout
  },
  // Grid columns: grid-cols-* → grid.* (when part of grid pattern)
  // Note: This handles standalone grid-cols-* patterns
  {
    pattern: /\bgrid-cols-(\d+)\b/g,
    replacement: (match, cols) => {
      // Map to grid utilities if available
      const mapping: Record<string, string> = {
        '1': 'cols1',
        '2': 'cols2',
        '3': 'cols3',
      };
      const key = mapping[cols];
      if (key) {
        return `\${grid.${key}}`;
      }
      // For unmapped values, keep as-is but in template literal
      return `grid-cols-${cols}`;
    },
    importName: 'grid',
    description: 'Grid columns',
    phase: 2, // Phase 2: Layout
  },
  // Flex items/justify: items-center, justify-between, etc. → layout utilities
  // These are commonly used standalone or in combination
  // Note: Must run AFTER flex flex-col gap and flex items-center gap patterns
  {
    pattern: /\b(items-center|items-start|items-end)\b(?!\s+gap)/g, // Negative lookahead to avoid matching flex items-center gap
    replacement: (match, alignment) => {
      // Map to layout utilities if available, otherwise keep as-is
      // For now, keep as-is but ensure template literal
      return alignment;
    },
    importName: null, // No semantic utility yet for standalone items-*
    description: 'Flex items alignment (standalone) - modernized formatting',
    phase: 2, // Phase 2: Layout
  },
  {
    pattern: /\b(justify-center|justify-between|justify-start|justify-end)\b/g,
    replacement: (match, justification) => {
      // Map to layout utilities if available, otherwise keep as-is
      // For now, keep as-is but ensure template literal
      return justification;
    },
    importName: null, // No semantic utility yet for standalone justify-*
    description: 'Flex justify alignment (standalone) - modernized formatting',
    phase: 2, // Phase 2: Layout
  },
  // Border: border → border.default
  {
    pattern: /\bborder\b(?!-)/g, // Standalone border (not border-*)
    replacement: () => '${border.default}',
    importName: 'border',
    description: 'Border (standalone)',
    phase: 5, // Phase 5: Advanced
  },
  // Shadow: shadow-* → Keep as-is but ensure template literal
  {
    pattern: /\bshadow-(sm|md|lg|xl|2xl)\b/g,
    replacement: (match, size) => {
      // Keep as-is but ensure template literal
      return `shadow-${size}`;
    },
    importName: null, // No semantic utility yet
    description: 'Shadow (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Position: absolute, relative, etc. → Keep as-is but ensure template literal
  {
    pattern: /\b(absolute|relative|fixed|sticky)\b/g,
    replacement: (match, position) => {
      // Keep as-is but ensure template literal
      return position;
    },
    importName: null, // No semantic utility yet
    description: 'Position (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Overflow: overflow-* → Keep as-is but ensure template literal
  {
    pattern: /\boverflow-(hidden|visible|scroll|auto)\b/g,
    replacement: (match, overflow) => {
      // Keep as-is but ensure template literal
      return `overflow-${overflow}`;
    },
    importName: null, // No semantic utility yet
    description: 'Overflow (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Z-index: z-* → Keep as-is but ensure template literal
  {
    pattern: /\bz-(\d+)\b/g,
    replacement: (match, value) => {
      // Keep as-is but ensure template literal
      return `z-${value}`;
    },
    importName: null, // No semantic utility yet
    description: 'Z-index (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Line height: leading-* → leading.*
  {
    pattern: /\bleading-(tight|normal|relaxed)\b/g,
    replacement: (match, leading) => {
      return `\${leading.${leading}}`;
    },
    importName: 'leading',
    description: 'Line height',
    phase: 3, // Phase 3: Typography
  },
  // Letter spacing: tracking-* → tracking.*
  {
    pattern: /\btracking-(tight|normal|wide)\b/g,
    replacement: (match, tracking) => {
      return `\${tracking.${tracking}}`;
    },
    importName: 'tracking',
    description: 'Letter spacing',
    phase: 3, // Phase 3: Typography
  },
  // Text truncation: truncate, line-clamp-* → truncate.*
  {
    pattern: /\b(truncate|line-clamp-(2|3))\b/g,
    replacement: (match, truncateType, lines) => {
      if (truncateType === 'truncate') {
        return '${truncate.single}';
      }
      return `\${truncate.lines${lines}}`;
    },
    importName: 'truncate',
    description: 'Text truncation',
    phase: 3, // Phase 3: Typography
  },
  // Text transform: uppercase, lowercase, capitalize → Keep as-is but ensure template literal
  {
    pattern: /\b(uppercase|lowercase|capitalize)\b/g,
    replacement: (match, transform) => {
      // Keep as-is but ensure template literal
      return transform;
    },
    importName: null, // No semantic utility yet
    description: 'Text transform (modernized formatting)',
    phase: 3, // Phase 3: Typography
  },
  // Max/min width/height: max-w-*, min-w-*, etc. → Keep as-is but ensure template literal
  {
    pattern: /\b(max-w-|min-w-|max-h-|min-h-)(full|screen|fit|min|max|\d+)\b/g,
    replacement: (match, prefix, value) => {
      // Keep as-is but ensure template literal
      return `${prefix}${value}`;
    },
    importName: null, // No semantic utility yet
    description: 'Max/min width/height (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Cursor: cursor-* → Keep as-is but ensure template literal
  {
    pattern: /\bcursor-(pointer|not-allowed|default|wait|text|move|grab|grabbing)\b/g,
    replacement: (match, cursor) => {
      // Keep as-is but ensure template literal
      return `cursor-${cursor}`;
    },
    importName: null, // No semantic utility yet
    description: 'Cursor (modernized formatting)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Select: select-* → Keep as-is but ensure template literal
  {
    pattern: /\bselect-(none|text|all|auto)\b/g,
    replacement: (match, select) => {
      // Keep as-is but ensure template literal
      return `select-${select}`;
    },
    importName: null, // No semantic utility yet
    description: 'Select (modernized formatting)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Background colors: bg-primary, bg-secondary, etc. → Keep as-is but ensure template literal
  // Note: These are semantic colors, might want semantic utilities later
  {
    pattern:
      /\bbg-(primary|secondary|muted|accent|destructive|foreground|background|card|popover)\b(?!\/)/g, // Negative lookahead to avoid matching bg-accent/10
    replacement: (match, color) => {
      // Keep as-is but ensure template literal
      return `bg-${color}`;
    },
    importName: null, // No semantic utility yet
    description: 'Background color (semantic - modernized formatting)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Text colors: text-primary, text-secondary, etc. → Keep as-is but ensure template literal
  {
    pattern:
      /\btext-(primary|secondary|muted-foreground|accent|destructive|foreground|background|card-foreground|popover-foreground)\b(?!\/)/g, // Negative lookahead to avoid matching text-accent/10
    replacement: (match, color) => {
      // text-muted-foreground is already handled by muted pattern, skip it
      if (color === 'muted-foreground') {
        return match; // Return unchanged, let muted pattern handle it
      }
      // Keep as-is but ensure template literal
      return `text-${color}`;
    },
    importName: null, // No semantic utility yet
    description: 'Text color (semantic - modernized formatting)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Border colors: border-primary, border-secondary, etc. → Keep as-is but ensure template literal
  {
    pattern:
      /\bborder-(primary|secondary|muted|accent|destructive|foreground|background|border)\b(?!\/)/g, // Negative lookahead to avoid matching border-accent/10
    replacement: (match, color) => {
      // Keep as-is but ensure template literal
      return `border-${color}`;
    },
    importName: null, // No semantic utility yet
    description: 'Border color (semantic - modernized formatting)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Transition: transition-* → transition.*
  {
    pattern: /\btransition-(all|colors|opacity|transform|none)\b/g,
    replacement: (match, transition) => {
      if (transition === 'colors') {
        return '${transition.colors}';
      }
      // Keep as-is but ensure template literal
      return `transition-${transition}`;
    },
    importName: 'transition',
    description: 'Transition',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Duration: duration-* → Keep as-is but ensure template literal
  {
    pattern: /\bduration-(\d+)\b/g,
    replacement: (match, duration) => {
      // Keep as-is but ensure template literal
      return `duration-${duration}`;
    },
    importName: null, // No semantic utility yet
    description: 'Duration (modernized formatting)',
    phase: 4, // Phase 4: Colors & Interactive
  },
  // Whitespace: whitespace-* → Keep as-is but ensure template literal
  {
    pattern: /\bwhitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)\b/g,
    replacement: (match, whitespace) => {
      // Keep as-is but ensure template literal
      return `whitespace-${whitespace}`;
    },
    importName: null, // No semantic utility yet
    description: 'Whitespace (modernized formatting)',
    phase: 3, // Phase 3: Typography
  },
  // Margin X: mx-* → marginX.*
  {
    pattern: /\bmx-(\d+|auto)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
        auto: 'auto',
      };
      const key = mapping[value] || 'default';
      return `\${marginX.${key}}`;
    },
    importName: 'marginX',
    description: 'Margin X',
    phase: 1, // Phase 1: Spacing
  },
  // Margin Y: my-* → marginY.*
  {
    pattern: /\bmy-(\d+)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
      };
      const key = mapping[value] || 'default';
      return `\${marginY.${key}}`;
    },
    importName: 'marginY',
    description: 'Margin Y',
    phase: 1, // Phase 1: Spacing
  },
  // Margin Left: ml-* → marginLeft.*
  {
    pattern: /\bml-(\d+|auto)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
        auto: 'auto',
      };
      const key = mapping[value] || 'default';
      return `\${marginLeft.${key}}`;
    },
    importName: 'marginLeft',
    description: 'Margin Left',
    phase: 1, // Phase 1: Spacing
  },
  // Margin Right: mr-* → marginRight.*
  {
    pattern: /\bmr-(\d+|auto)\b/g,
    replacement: (match, value) => {
      const mapping: Record<string, string> = {
        '1': 'micro',
        '2': 'tight',
        '3': 'compact',
        '4': 'default',
        '6': 'comfortable',
        '8': 'relaxed',
        auto: 'auto',
      };
      const key = mapping[value] || 'default';
      return `\${marginRight.${key}}`;
    },
    importName: 'marginRight',
    description: 'Margin Right',
    phase: 1, // Phase 1: Spacing
  },
  // Position: top-*, bottom-*, left-*, right-* → Keep as-is but ensure template literal
  {
    pattern: /\b(top-|bottom-|left-|right-)(\d+|auto)\b/g,
    replacement: (match, position, value) => {
      // Keep as-is but ensure template literal
      return `${position}${value}`;
    },
    importName: null, // No semantic utility yet
    description: 'Position (top/bottom/left/right - modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Border variants: border-t-*, border-b-*, border-l-*, border-r-*, border-x-*, border-y-* → Keep as-is but ensure template literal
  {
    pattern:
      /\bborder-(t|b|l|r|x|y)-(\d+|primary|secondary|muted|accent|destructive|foreground|background|border)\b/g,
    replacement: (match, side, value) => {
      // Keep as-is but ensure template literal
      return `border-${side}-${value}`;
    },
    importName: null, // No semantic utility yet
    description: 'Border variant (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Display: block, inline, flex, grid, etc. → Keep as-is but ensure template literal
  // Note: Must run AFTER stack/cluster patterns to avoid conflicts
  // This pattern handles standalone display values, not compound flex patterns
  {
    pattern:
      /\b(block|inline|inline-block|grid|table|contents|list-item|hidden|visible|invisible)\b(?!-)/g, // Exclude 'flex' - handled by stack/cluster patterns
    replacement: (match, display) => {
      // Keep as-is but ensure template literal
      return display;
    },
    importName: null, // No semantic utility yet
    description:
      'Display (modernized formatting, excluding flex which is handled by stack/cluster)',
    phase: 2, // Phase 2: Layout
  },
  // Standalone flex (not part of flex flex-col or flex items-center patterns)
  {
    pattern: /\bflex\b(?!\s+(flex-col|items-center|flex-row|flex-wrap|flex-nowrap))/g, // Negative lookahead to avoid matching compound patterns
    replacement: (match) => {
      // Keep as-is but ensure template literal
      return 'flex';
    },
    importName: null, // No semantic utility yet
    description: 'Standalone flex (not part of compound patterns)',
    phase: 2, // Phase 2: Layout
  },
  // Gradient: bg-gradient-*, from-*, via-*, to-* → Keep as-is but ensure template literal
  {
    pattern: /\b(bg-gradient-|from-|via-|to-|bg-clip-|text-clip-)[\w-]+\b/g,
    replacement: (match) => {
      // Keep as-is but ensure template literal
      return match;
    },
    importName: null, // No semantic utility yet
    description: 'Gradient (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Ring/outline: ring-*, outline-* → Keep as-is but ensure template literal
  {
    pattern: /\b(ring-|outline-)[\w-]+\b/g,
    replacement: (match) => {
      // Keep as-is but ensure template literal
      return match;
    },
    importName: null, // No semantic utility yet
    description: 'Ring/outline (modernized formatting)',
    phase: 5, // Phase 5: Advanced
  },
  // Text decoration: underline, line-through, no-underline, decoration-* → Keep as-is but ensure template literal
  {
    pattern: /\b(underline|line-through|no-underline|decoration-[\w-]+)\b/g,
    replacement: (match) => {
      // Keep as-is but ensure template literal
      return match;
    },
    importName: null, // No semantic utility yet
    description: 'Text decoration (modernized formatting)',
    phase: 3, // Phase 3: Typography
  },
  // Icon sizing: h-X w-X → iconSize.* (when both values match, order-independent)
  {
    pattern: /\b(h-(\d+)\s+w-\2|w-(\d+)\s+h-\3)\b/g,
    replacement: (match, fullMatch, hValue, wValue) => {
      // Extract size from either h-X w-X or w-X h-X pattern
      const size = hValue || wValue;
      const mapping: Record<string, string> = {
        '3': 'xs',
        '4': 'sm',
        '5': 'md',
        '6': 'lg',
        '8': 'xl',
        '12': '2xl',
        '16': '3xl',
      };
      const key = mapping[size];
      if (key) {
        // Handle keys that need bracket notation (numeric or start with number like '2xl', '3xl')
        const needsBrackets = /^\d+/.test(key) || key === '2xl' || key === '3xl';
        const accessor = needsBrackets ? `['${key}']` : `.${key}`;
        return `\${iconSize${accessor}}`;
      }
      // For unmapped sizes, create direct mapping with bracket notation
      return `\${iconSize['${size}']}`;
    },
    importName: 'iconSize',
    description: 'Icon sizing (square icons)',
    phase: 5, // Phase 5: Advanced
  },
  // Rectangular icon sizing: h-X w-Y → iconSizeRect.* (when values differ)
  // This pattern must run AFTER the square icon pattern to avoid conflicts
  // Also handles h-X w-fraction patterns (e.g., h-4 w-3/4)
  {
    pattern:
      /\b(h-(\d+)\s+w-(\d+|\d+\/\d+|full|auto|3\/4|1\/2|1\/3|2\/3)|w-(\d+|\d+\/\d+|full|auto|3\/4|1\/2|1\/3|2\/3)\s+h-(\d+))\b/g,
    replacement: (match, fullMatch, h1, w1, w2, h2) => {
      // Extract height and width (order-independent)
      const height = h1 || h2;
      const width = w1 || w2;

      // Skip if square numeric values (handled by previous pattern)
      if (height === width && /^\d+$/.test(width)) {
        return match; // Return unchanged, let square pattern handle it
      }

      // Handle fractional widths (w-3/4, w-1/2, w-2/3, etc.) - create semantic key
      if (width.includes('/')) {
        const key = `${height}x${width.replace('/', '-')}`; // e.g., "4x3-4" for h-4 w-3/4, "3x2-3" for h-3 w-2/3
        return `\${iconSizeRect['${key}']}`;
      }

      // Handle special width values (full, auto)
      if (width === 'full' || width === 'auto') {
        const key = `${height}x${width}`;
        return `\${iconSizeRect['${key}']}`;
      }

      // Create key from numeric dimensions (always use height x width format)
      const key = `${height}x${width}`;

      // Check if we have a predefined mapping
      const rectMapping: Record<string, string> = {
        '4x5': '4x5',
        '5x4': '5x4',
        '4x6': '4x6',
        '6x4': '6x4',
        '5x6': '5x6',
        '6x5': '6x5',
        '2x32': '2x32',
        '4x12': '4x12',
        '4x16': '4x16',
        '4x20': '4x20',
        '4x24': '4x24',
        '4x48': '4x48',
        '4x64': '4x64',
        '5x24': '5x24',
        '6x32': '6x32',
        '8x24': '8x24',
        '8x28': '8x28',
        '8x32': '8x32',
        '8x48': '8x48',
        '8x64': '8x64',
        '32x48': '32x48',
        '64x72': '64x72',
      };

      // Use predefined mapping if available, otherwise create dynamic mapping
      const mappedKey = rectMapping[key];
      if (mappedKey) {
        return `\${iconSizeRect['${mappedKey}']}`;
      }

      // For unmapped sizes, create direct mapping
      return `\${iconSizeRect['${key}']}`;
    },
    importName: 'iconSizeRect',
    description: 'Icon sizing (rectangular icons/loading patterns, including fractional widths)',
    phase: 5, // Phase 5: Advanced
  },
];

interface Transformation {
  file: string;
  line: number;
  original: string;
  transformed: string;
  type: string;
  patternCount?: number; // Number of patterns transformed in this className
}

interface MigrationResult {
  file: string;
  transformations: Transformation[];
  importsAdded: string[];
  errors: string[];
}

/**
 * Find all TSX/TS files
 */
function findTSXFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        findTSXFiles(filePath, fileList);
      }
    } else if (extname(file) === '.tsx' || extname(file) === '.ts') {
      // Skip test files and generated files
      if (!file.includes('.test.') && !file.includes('.spec.') && !file.includes('.generated.')) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

/**
 * Apply migration patterns to a className string
 */
function migrateClassName(
  className: string,
  mappings: ClassNameMapping[]
): { updated: string; neededImports: Set<string>; patternCount: number } {
  let updated = className;
  const neededImports = new Set<string>();
  let patternCount = 0;

  for (const mapping of mappings) {
    // Use a new regex instance for each check to avoid state issues
    const regex = new RegExp(mapping.pattern.source, mapping.pattern.flags);
    const matches = [...className.matchAll(regex)];
    if (matches.length > 0) {
      patternCount += matches.length; // Count each pattern match
      // Only add import if importName is not null
      if (mapping.importName) {
        neededImports.add(mapping.importName);
      }
      // Replace all matches
      updated = updated.replace(regex, (match, ...groups) => {
        return mapping.replacement(match, ...groups);
      });
    }
  }

  return { updated, neededImports, patternCount };
}

/**
 * Migrate a single file
 */
function migrateFile(filePath: string, dryRun: boolean, phase?: number): MigrationResult {
  const result: MigrationResult = {
    file: relative(PROJECT_ROOT, filePath),
    transformations: [],
    importsAdded: [],
    errors: [],
  };

  try {
    const content = readFileSync(filePath, 'utf-8');
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    const allNeededImports = new Set<string>();
    let hasChanges = false;

    // Filter mappings by phase if specified
    const mappingsToUse = phase
      ? CLASSNAME_MAPPINGS.filter((m) => m.phase === phase)
      : CLASSNAME_MAPPINGS;

    // Process JSX className attributes
    sourceFile.forEachDescendant((node) => {
      if (!Node.isJsxAttribute(node)) return;

      // Get attribute name - ts-morph API
      const nameNode = node.getNameNode();
      if (!nameNode || !Node.isIdentifier(nameNode) || nameNode.getText() !== 'className') {
        return;
      }

      const initializer = node.getInitializer();
      if (!initializer) {
        // className without value (className={undefined} or className)
        return;
      }

      // Handle string literal: className="mb-4"
      if (Node.isStringLiteral(initializer)) {
        const originalValue = initializer.getLiteralValue();
        const { updated, neededImports, patternCount } = migrateClassName(
          originalValue,
          mappingsToUse
        );

        // Always transform string literals to template literals for consistency
        if (updated !== originalValue || neededImports.size > 0 || patternCount > 0) {
          hasChanges = true;
          neededImports.forEach((imp) => allNeededImports.add(imp));

          // Create ONE transformation record per className attribute
          // The patternCount field indicates how many patterns were transformed in this attribute
          result.transformations.push({
            file: result.file,
            line: initializer.getStartLineNumber(),
            original: `className="${originalValue}"`,
            transformed: `className={\`${updated}\`}`,
            type: patternCount > 0 ? 'string-literal' : 'string-literal-modernize',
            patternCount: patternCount, // Actual count of patterns transformed
          });

          if (!dryRun) {
            // Convert string literal to template literal
            // Need to wrap in JSX expression
            try {
              const parent = initializer.getParent();
              if (Node.isJsxAttribute(parent)) {
                const newInitializer = `{\`${updated}\`}`;
                // Verify the replacement will actually change something
                const currentInitializer = parent.getInitializer()?.getText() || '';
                if (newInitializer !== currentInitializer) {
                  parent.setInitializer(newInitializer);
                } else {
                  result.errors.push(
                    `String literal replacement produced identical text at line ${initializer.getStartLineNumber()}`
                  );
                }
              }
            } catch (error) {
              result.errors.push(
                `Failed to replace string literal at line ${initializer.getStartLineNumber()}: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          }
        }
      }
      // Handle JSX expression with string: className={"mb-4"}
      else if (Node.isJsxExpression(initializer)) {
        const expression = initializer.getExpression();
        if (Node.isStringLiteral(expression)) {
          const originalValue = expression.getLiteralValue();
          const { updated, neededImports, patternCount } = migrateClassName(
            originalValue,
            mappingsToUse
          );

          if (updated !== originalValue || patternCount > 0) {
            hasChanges = true;
            neededImports.forEach((imp) => allNeededImports.add(imp));

            // Create ONE transformation record per className attribute
            // The patternCount field indicates how many patterns were transformed in this attribute
            result.transformations.push({
              file: result.file,
              line: expression.getStartLineNumber(),
              original: `className={"${originalValue}"}`,
              transformed: `className={\`${updated}\`}`,
              type: 'jsx-expression-string',
              patternCount: patternCount, // Actual count of patterns transformed
            });

            if (!dryRun) {
              // Replace string literal with template literal
              try {
                const newText = `\`${updated}\``;
                const originalText = expression.getText();
                // Verify the replacement will actually change something
                if (newText !== originalText) {
                  expression.replaceWithText(newText);
                } else {
                  result.errors.push(
                    `JSX expression string replacement produced identical text at line ${expression.getStartLineNumber()}`
                  );
                }
              } catch (error) {
                result.errors.push(
                  `Failed to replace JSX expression string at line ${expression.getStartLineNumber()}: ${error instanceof Error ? error.message : String(error)}`
                );
              }
            }
          }
        }
        // Handle template literal: className={`mb-4 ${other}`}
        else if (Node.isTemplateExpression(expression)) {
          // Get all template spans
          const spans = expression.getTemplateSpans();
          let templateChanged = false;
          const updatedParts: string[] = [];
          let totalPatternCount = 0;

          // Process head (first literal part before first ${})
          // getText() on TemplateHead returns the raw text content (no quotes, no backticks)
          const head = expression.getHead().getText();
          const {
            updated: updatedHead,
            neededImports: headImports,
            patternCount: headPatternCount,
          } = migrateClassName(head, mappingsToUse);
          totalPatternCount += headPatternCount;
          if (updatedHead !== head) {
            templateChanged = true;
            headImports.forEach((imp) => allNeededImports.add(imp));
          }
          updatedParts.push(updatedHead);

          // Process each span (${expression} literal)
          const allLiteralImports = new Set<string>();
          for (const span of spans) {
            // Add the expression with ${} wrapper
            // getText() on the expression node returns just the expression content (e.g., "other")
            // We need to wrap it with ${} to reconstruct the template literal correctly
            // Use string concatenation to avoid issues with special characters in exprText
            const exprText = span.getExpression().getText();
            updatedParts.push('${' + exprText + '}');

            // Process the literal part after the expression
            // getText() on TemplateTail returns the raw text content (no quotes, no backticks)
            const literal = span.getLiteral().getText();
            const {
              updated: updatedLiteral,
              neededImports: literalImports,
              patternCount: literalPatternCount,
            } = migrateClassName(literal, mappingsToUse);
            totalPatternCount += literalPatternCount;
            if (updatedLiteral !== literal) {
              templateChanged = true;
              literalImports.forEach((imp) => {
                allNeededImports.add(imp);
                allLiteralImports.add(imp);
              });
            }
            updatedParts.push(updatedLiteral);
          }

          // Always transform template literals if they contain any patterns we're migrating
          // This ensures all patterns in template literals are transformed and counted
          if (templateChanged || totalPatternCount > 0) {
            hasChanges = true;
            headImports.forEach((imp) => allNeededImports.add(imp));
            allLiteralImports.forEach((imp) => allNeededImports.add(imp));

            const originalText = expression.getText();
            // Reconstruct the template literal properly
            // updatedParts contains: [head, ${expr1}, literal1, ${expr2}, literal2, ...]
            // We need to join them to create a valid template literal
            // getText() on TemplateExpression returns the template literal WITH backticks
            // So newText should also include backticks
            const newText = '`' + updatedParts.join('') + '`';

            // Debug: Log reconstruction details if there are patterns to transform
            if (totalPatternCount > 0 && !dryRun) {
              // Verify reconstruction is correct by comparing structure
              // This helps catch reconstruction bugs early
            }

            // Create ONE transformation record per className attribute
            // The patternCount field indicates how many patterns were transformed in this attribute
            // This ensures dry-run and live-run counts match accurately
            result.transformations.push({
              file: result.file,
              line: expression.getStartLineNumber(),
              original: `className={${originalText}}`,
              transformed: `className={${newText}}`,
              type: 'template-literal',
              patternCount: totalPatternCount, // Actual count of patterns transformed
            });

            if (!dryRun) {
              // Replace the template expression using replaceWithText (same as migrate-ui-classes.ts)
              // getText() on TemplateExpression returns the template literal WITH backticks
              // So newText should also include backticks
              try {
                // Verify the replacement will actually change something
                if (newText !== originalText) {
                  // Use replaceWithText directly on TemplateExpression (same approach as migrate-ui-classes.ts)
                  expression.replaceWithText(newText);
                } else {
                  // If newText equals originalText, something went wrong with reconstruction
                  result.errors.push(
                    `Template literal reconstruction produced identical text at line ${expression.getStartLineNumber()}: original="${originalText}", new="${newText}"`
                  );
                }
              } catch (error) {
                // Log detailed error information for debugging
                const errorMsg = error instanceof Error ? error.message : String(error);
                result.errors.push(
                  `Failed to replace template expression at line ${expression.getStartLineNumber()}: ${errorMsg}. Original: "${originalText}", New: "${newText}"`
                );
                // Don't throw - continue processing other transformations
              }
            }
          }
        }
      }
    });

    // Add imports if needed
    if (allNeededImports.size > 0 && !dryRun) {
      // Check if import already exists
      const existingImports = sourceFile.getImportDeclarations();
      let hasDesignSystemImport = false;

      for (const importDecl of existingImports) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        if (moduleSpecifier === '@heyclaude/web-runtime/design-system') {
          hasDesignSystemImport = true;
          const existingNames = new Set(importDecl.getNamedImports().map((imp) => imp.getName()));

          for (const importName of allNeededImports) {
            if (!existingNames.has(importName)) {
              importDecl.addNamedImport(importName);
              result.importsAdded.push(importName);
            }
          }
          break;
        }
      }

      // Create new import if it doesn't exist
      if (!hasDesignSystemImport) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: '@heyclaude/web-runtime/design-system',
          namedImports: Array.from(allNeededImports),
        });
        result.importsAdded.push(...Array.from(allNeededImports));
      }
    }

    // Save file if not dry run and has changes
    if (hasChanges && !dryRun) {
      copyFileSync(filePath, `${filePath}.backup`);
      const updatedContent = sourceFile.getFullText();
      writeFileSync(filePath, updatedContent, 'utf-8');
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Main migration function
 */
export async function migrateInlineStyles(dryRun: boolean = false, phase?: number): Promise<void> {
  logger.info('=== Inline Styles Migration ===');

  if (phase) {
    logger.info(`PHASE ${phase} MODE - Only migrating patterns from phase ${phase}`);
    const phaseMappings = CLASSNAME_MAPPINGS.filter((m) => m.phase === phase);
    logger.info(`Phase ${phase} includes ${phaseMappings.length} pattern(s)`);
  } else {
    logger.info('ALL PHASES MODE - Migrating all patterns');
  }

  if (dryRun) {
    logger.info('DRY RUN MODE - Analysis only, no files will be modified');
  } else {
    logger.warn('LIVE MODE - Files will be modified');
  }

  // Find all TSX/TS files
  const tsxFiles = findTSXFiles(join(PROJECT_ROOT, 'apps/web/src'));
  logger.info(`Found ${tsxFiles.length} TSX/TS files`);

  const results: MigrationResult[] = [];
  let totalTransformations = 0;
  let filesModified = 0;

  // Process each file
  for (const filePath of tsxFiles) {
    const result = migrateFile(filePath, dryRun, phase);
    results.push(result);

    if (result.transformations.length > 0) {
      // Count transformations: one per className attribute (consistent with dry-run)
      // Each transformation record represents one className attribute that was transformed
      totalTransformations += result.transformations.length;
      filesModified++;

      // Calculate total patterns for informational logging
      const filePatternCount = result.transformations.reduce(
        (sum, t) => sum + (t.patternCount || 0),
        0
      );
      logger.info(
        `${result.file}: ${result.transformations.length} transformation(s) (${filePatternCount} pattern(s))`
      );
      if (result.importsAdded.length > 0) {
        logger.info(`  Added imports: ${result.importsAdded.join(', ')}`);
      }
      if (result.errors.length > 0) {
        logger.warn(`  Errors: ${result.errors.join('; ')}`);
      }
    }
  }

  // Summary
  logger.info('');
  logger.info('Summary', {
    filesProcessed: tsxFiles.length,
    filesWithChanges: filesModified,
    totalTransformations,
  });

  if (!dryRun && filesModified > 0) {
    logger.info('Backup files created with .backup extension');
  }

  logger.info('');
  if (dryRun) {
    logger.info('DRY RUN complete - Review results above');
  } else {
    logger.info('Migration complete!');
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  // Parse --phase=N argument
  let phase: number | undefined;
  const phaseArg = args.find((arg) => arg.startsWith('--phase='));
  if (phaseArg) {
    const phaseValue = phaseArg.split('=')[1];
    const phaseNum = parseInt(phaseValue, 10);
    if (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 5) {
      logger.error(`Invalid phase: ${phaseValue}. Must be 1-5.`);
      process.exit(1);
    }
    phase = phaseNum;
  }

  migrateInlineStyles(dryRun, phase).catch((error) => {
    logger.error('Migration failed', error);
    process.exit(1);
  });
}
