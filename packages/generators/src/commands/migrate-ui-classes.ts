#!/usr/bin/env tsx
/**
 * UI_CLASSES Migration Command
 *
 * Migrates UI_CLASSES constants to semantic design system utilities.
 * Uses ts-morph for AST-based transformations to handle imports, template literals,
 * and string literals correctly.
 *
 * Usage:
 *   pnpm exec heyclaude-migrate-ui-classes --dry-run              # Analyze only
 *   pnpm exec heyclaude-migrate-ui-classes                         # Apply changes
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
  PropertyAccessExpression,
  SyntaxKind,
} from 'ts-morph';

import { logger } from '../toolkit/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

/**
 * Mapping from UI_CLASSES constant name to semantic utility replacement
 */
interface UIClassMapping {
  // UI_CLASSES constant name (e.g., 'MARGIN_DEFAULT')
  uiClassName: string;
  // Replacement: semantic utility expression (e.g., 'marginBottom.default')
  replacement: string;
  // Required imports (array of import names)
  imports: string[];
  // Description for logging
  description: string;
}

/**
 * Complete mapping of UI_CLASSES to semantic utilities
 */
const UI_CLASS_MAPPINGS: UIClassMapping[] = [
  // Spacing - Margin Bottom
  {
    uiClassName: 'MARGIN_DEFAULT',
    replacement: 'marginBottom.default',
    imports: ['marginBottom'],
    description: 'Margin bottom default',
  },
  {
    uiClassName: 'MARGIN_COMPACT',
    replacement: 'marginBottom.compact',
    imports: ['marginBottom'],
    description: 'Margin bottom compact',
  },
  {
    uiClassName: 'MARGIN_COMFORTABLE',
    replacement: 'marginBottom.comfortable',
    imports: ['marginBottom'],
    description: 'Margin bottom comfortable',
  },
  {
    uiClassName: 'MARGIN_RELAXED',
    replacement: 'marginBottom.relaxed',
    imports: ['marginBottom'],
    description: 'Margin bottom relaxed',
  },
  {
    uiClassName: 'MARGIN_SECTION',
    replacement: 'marginBottom.section',
    imports: ['marginBottom'],
    description: 'Margin bottom section',
  },
  {
    uiClassName: 'MARGIN_HERO',
    replacement: 'marginBottom.hero',
    imports: ['marginBottom'],
    description: 'Margin bottom hero',
  },
  {
    uiClassName: 'MARGIN_MICRO',
    replacement: 'marginBottom.tight',
    imports: ['marginBottom'],
    description: 'Margin bottom micro (mb-1 → tight)',
  },
  {
    uiClassName: 'MARGIN_TIGHT',
    replacement: 'marginBottom.compact',
    imports: ['marginBottom'],
    description: 'Margin bottom tight (mb-2 → compact)',
  },
  {
    uiClassName: 'MB_1',
    replacement: 'marginBottom.tight',
    imports: ['marginBottom'],
    description: 'Margin bottom 1',
  },
  {
    uiClassName: 'MB_2',
    replacement: 'marginBottom.compact',
    imports: ['marginBottom'],
    description: 'Margin bottom 2',
  },
  {
    uiClassName: 'MB_4',
    replacement: 'marginBottom.default',
    imports: ['marginBottom'],
    description: 'Margin bottom 4',
  },
  {
    uiClassName: 'MB_6',
    replacement: 'marginBottom.comfortable',
    imports: ['marginBottom'],
    description: 'Margin bottom 6',
  },
  {
    uiClassName: 'MB_8',
    replacement: 'marginBottom.relaxed',
    imports: ['marginBottom'],
    description: 'Margin bottom 8',
  },

  // Spacing - Margin Top
  {
    uiClassName: 'MARGIN_TOP_ZERO',
    replacement: 'marginTop.zero',
    imports: ['marginTop'],
    description: 'Margin top zero',
  },
  {
    uiClassName: 'MARGIN_TOP_MICRO',
    replacement: 'marginTop.micro',
    imports: ['marginTop'],
    description: 'Margin top micro',
  },
  {
    uiClassName: 'MARGIN_TOP_TIGHT',
    replacement: 'marginTop.tight',
    imports: ['marginTop'],
    description: 'Margin top tight',
  },
  {
    uiClassName: 'MARGIN_TOP_COMPACT',
    replacement: 'marginTop.compact',
    imports: ['marginTop'],
    description: 'Margin top compact',
  },
  {
    uiClassName: 'MARGIN_TOP_DEFAULT',
    replacement: 'marginTop.default',
    imports: ['marginTop'],
    description: 'Margin top default',
  },
  {
    uiClassName: 'MARGIN_TOP_COMFORTABLE',
    replacement: 'marginTop.comfortable',
    imports: ['marginTop'],
    description: 'Margin top comfortable',
  },
  {
    uiClassName: 'MARGIN_TOP_RELAXED',
    replacement: 'marginTop.relaxed',
    imports: ['marginTop'],
    description: 'Margin top relaxed',
  },
  {
    uiClassName: 'MARGIN_RIGHT_MICRO',
    replacement: 'marginRight.micro',
    imports: ['marginRight'],
    description: 'Margin right micro',
  },
  {
    uiClassName: 'MARGIN_RIGHT_TIGHT',
    replacement: 'marginRight.tight',
    imports: ['marginRight'],
    description: 'Margin right tight',
  },
  {
    uiClassName: 'MARGIN_RIGHT_COMPACT',
    replacement: 'marginRight.compact',
    imports: ['marginRight'],
    description: 'Margin right compact',
  },
  {
    uiClassName: 'MARGIN_RIGHT_DEFAULT',
    replacement: 'marginRight.default',
    imports: ['marginRight'],
    description: 'Margin right default',
  },
  {
    uiClassName: 'MARGIN_LEFT_MICRO',
    replacement: 'marginLeft.micro',
    imports: ['marginLeft'],
    description: 'Margin left micro',
  },
  {
    uiClassName: 'MARGIN_LEFT_TIGHT',
    replacement: 'marginLeft.tight',
    imports: ['marginLeft'],
    description: 'Margin left tight',
  },
  {
    uiClassName: 'MARGIN_LEFT_COMPACT',
    replacement: 'marginLeft.compact',
    imports: ['marginLeft'],
    description: 'Margin left compact',
  },
  {
    uiClassName: 'MARGIN_Y_RELAXED',
    replacement: 'marginY.relaxed',
    imports: ['marginY'],
    description: 'Margin Y relaxed',
  },

  // Spacing - Padding
  {
    uiClassName: 'PADDING_MICRO',
    replacement: 'padding.micro',
    imports: ['padding'],
    description: 'Padding micro',
  },
  {
    uiClassName: 'PADDING_TIGHT',
    replacement: 'padding.tight',
    imports: ['padding'],
    description: 'Padding tight',
  },
  {
    uiClassName: 'PADDING_COMPACT',
    replacement: 'padding.compact',
    imports: ['padding'],
    description: 'Padding compact',
  },
  {
    uiClassName: 'PADDING_DEFAULT',
    replacement: 'padding.default',
    imports: ['padding'],
    description: 'Padding default',
  },
  {
    uiClassName: 'PADDING_COMFORTABLE',
    replacement: 'padding.comfortable',
    imports: ['padding'],
    description: 'Padding comfortable',
  },
  {
    uiClassName: 'PADDING_RELAXED',
    replacement: 'padding.relaxed',
    imports: ['padding'],
    description: 'Padding relaxed',
  },
  {
    uiClassName: 'PADDING_X_TIGHT',
    replacement: 'paddingX.tight',
    imports: ['paddingX'],
    description: 'Padding X tight',
  },
  {
    uiClassName: 'PADDING_X_COMPACT',
    replacement: 'paddingX.compact',
    imports: ['paddingX'],
    description: 'Padding X compact',
  },
  {
    uiClassName: 'PADDING_X_DEFAULT',
    replacement: 'paddingX.default',
    imports: ['paddingX'],
    description: 'Padding X default',
  },
  {
    uiClassName: 'PADDING_X_COMFORTABLE',
    replacement: 'paddingX.comfortable',
    imports: ['paddingX'],
    description: 'Padding X comfortable',
  },
  {
    uiClassName: 'PADDING_X_RELAXED',
    replacement: 'paddingX.relaxed',
    imports: ['paddingX'],
    description: 'Padding X relaxed',
  },
  {
    uiClassName: 'PADDING_Y_MICRO',
    replacement: 'paddingY.micro',
    imports: ['paddingY'],
    description: 'Padding Y micro',
  },
  {
    uiClassName: 'PADDING_Y_TIGHT',
    replacement: 'paddingY.tight',
    imports: ['paddingY'],
    description: 'Padding Y tight',
  },
  {
    uiClassName: 'PADDING_Y_COMPACT',
    replacement: 'paddingY.compact',
    imports: ['paddingY'],
    description: 'Padding Y compact',
  },
  {
    uiClassName: 'PADDING_Y_DEFAULT',
    replacement: 'paddingY.default',
    imports: ['paddingY'],
    description: 'Padding Y default',
  },
  {
    uiClassName: 'PADDING_Y_COMFORTABLE',
    replacement: 'paddingY.comfortable',
    imports: ['paddingY'],
    description: 'Padding Y comfortable',
  },
  {
    uiClassName: 'PADDING_Y_RELAXED',
    replacement: 'paddingY.relaxed',
    imports: ['paddingY'],
    description: 'Padding Y relaxed',
  },
  {
    uiClassName: 'PADDING_Y_SECTION',
    replacement: 'paddingY.section',
    imports: ['paddingY'],
    description: 'Padding Y section',
  },

  // Spacing - Space Y/X
  {
    uiClassName: 'SPACE_Y_1',
    replacement: 'spaceY.tight',
    imports: ['spaceY'],
    description: 'Space Y 1',
  },
  {
    uiClassName: 'SPACE_Y_2',
    replacement: 'spaceY.compact',
    imports: ['spaceY'],
    description: 'Space Y 2',
  },
  {
    uiClassName: 'SPACE_Y_3',
    replacement: 'spaceY.default',
    imports: ['spaceY'],
    description: 'Space Y 3',
  },
  {
    uiClassName: 'SPACE_Y_4',
    replacement: 'spaceY.comfortable',
    imports: ['spaceY'],
    description: 'Space Y 4',
  },
  {
    uiClassName: 'SPACE_Y_6',
    replacement: 'spaceY.relaxed',
    imports: ['spaceY'],
    description: 'Space Y 6',
  },
  {
    uiClassName: 'SPACE_Y_8',
    replacement: 'spaceY.loose',
    imports: ['spaceY'],
    description: 'Space Y 8',
  },
  {
    uiClassName: 'SPACE_Y_TIGHT',
    replacement: 'spaceY.tight',
    imports: ['spaceY'],
    description: 'Space Y tight',
  },
  {
    uiClassName: 'SPACE_Y_DEFAULT',
    replacement: 'spaceY.default',
    imports: ['spaceY'],
    description: 'Space Y default',
  },
  {
    uiClassName: 'SPACE_Y_COMFORTABLE',
    replacement: 'spaceY.comfortable',
    imports: ['spaceY'],
    description: 'Space Y comfortable',
  },
  {
    uiClassName: 'SPACE_X_2',
    replacement: 'spaceX.compact',
    imports: ['spaceX'],
    description: 'Space X 2',
  },
  {
    uiClassName: 'SPACE_X_4',
    replacement: 'spaceX.comfortable',
    imports: ['spaceX'],
    description: 'Space X 4',
  },

  // Spacing - Gap
  {
    uiClassName: 'SPACE_MICRO',
    replacement: 'gap.micro',
    imports: ['gap'],
    description: 'Gap micro',
  },
  {
    uiClassName: 'SPACE_TIGHT',
    replacement: 'gap.tight',
    imports: ['gap'],
    description: 'Gap tight',
  },
  {
    uiClassName: 'SPACE_COMPACT',
    replacement: 'gap.compact',
    imports: ['gap'],
    description: 'Gap compact',
  },
  {
    uiClassName: 'SPACE_DEFAULT',
    replacement: 'gap.default',
    imports: ['gap'],
    description: 'Gap default',
  },
  {
    uiClassName: 'SPACE_COMFORTABLE',
    replacement: 'gap.comfortable',
    imports: ['gap'],
    description: 'Gap comfortable',
  },
  {
    uiClassName: 'SPACE_RELAXED',
    replacement: 'gap.relaxed',
    imports: ['gap'],
    description: 'Gap relaxed',
  },
  {
    uiClassName: 'SPACE_LOOSE',
    replacement: 'gap.loose',
    imports: ['gap'],
    description: 'Gap loose',
  },

  // Layout - Stack (flex flex-col)
  {
    uiClassName: 'FLEX_COL_GAP_1',
    replacement: 'stack.tight',
    imports: ['stack'],
    description: 'Flex col gap 1',
  },
  {
    uiClassName: 'FLEX_COL_GAP_2',
    replacement: 'stack.compact',
    imports: ['stack'],
    description: 'Flex col gap 2',
  },
  {
    uiClassName: 'FLEX_COL_GAP_3',
    replacement: 'stack.default',
    imports: ['stack'],
    description: 'Flex col gap 3',
  },
  {
    uiClassName: 'FLEX_COL_GAP_4',
    replacement: 'stack.comfortable',
    imports: ['stack'],
    description: 'Flex col gap 4',
  },
  {
    uiClassName: 'FLEX_COL_GAP_6',
    replacement: 'stack.relaxed',
    imports: ['stack'],
    description: 'Flex col gap 6',
  },
  {
    uiClassName: 'FLEX_COL_SPACE_Y_2',
    replacement: '`${stack.none} ${spaceY.compact}`',
    imports: ['stack', 'spaceY'],
    description: 'Flex col space Y 2 (compound)',
  },
  {
    uiClassName: 'FLEX_COL_SPACE_Y_4',
    replacement: '`${stack.none} ${spaceY.comfortable}`',
    imports: ['stack', 'spaceY'],
    description: 'Flex col space Y 4 (compound)',
  },
  {
    uiClassName: 'FLEX_COL_SPACE_Y_6',
    replacement: '`${stack.none} ${spaceY.relaxed}`',
    imports: ['stack', 'spaceY'],
    description: 'Flex col space Y 6 (compound)',
  },
  {
    uiClassName: 'FLEX_COL_ITEMS_CENTER_GAP_4',
    replacement: '`${stack.comfortable} items-center`',
    imports: ['stack'],
    description: 'Flex col items center gap 4 (compound)',
  },

  // Layout - Cluster (flex items-center)
  {
    uiClassName: 'FLEX_ITEMS_CENTER',
    replacement: 'cluster.none',
    imports: ['cluster'],
    description: 'Flex items center',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_0_5',
    replacement: 'cluster.micro',
    imports: ['cluster'],
    description: 'Flex items center gap 0.5',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_1',
    replacement: 'cluster.tight',
    imports: ['cluster'],
    description: 'Flex items center gap 1',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_1_5',
    replacement: 'flex items-center gap-1.5',
    imports: [],
    description: 'Flex items center gap 1.5 (keep as-is - no gap-1.5 utility)',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_2',
    replacement: 'cluster.compact',
    imports: ['cluster'],
    description: 'Flex items center gap 2',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_3',
    replacement: 'cluster.default',
    imports: ['cluster'],
    description: 'Flex items center gap 3',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_4',
    replacement: 'cluster.comfortable',
    imports: ['cluster'],
    description: 'Flex items center gap 4',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_FLEX_SHRINK_0',
    replacement: '`${cluster.none} flex-shrink-0`',
    imports: ['cluster'],
    description: 'Flex items center flex shrink 0 (compound)',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_1',
    replacement: 'cluster.tight',
    imports: ['cluster'],
    description: 'Flex items center gap 1 (duplicate)',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_2',
    replacement: 'cluster.compact',
    imports: ['cluster'],
    description: 'Flex items center gap 2 (duplicate)',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_3',
    replacement: 'cluster.default',
    imports: ['cluster'],
    description: 'Flex items center gap 3 (duplicate)',
  },
  {
    uiClassName: 'FLEX_ITEMS_CENTER_GAP_6',
    replacement: '`${cluster.none} ${gap.relaxed}`',
    imports: ['cluster', 'gap'],
    description: 'Flex items center gap 6 (compound)',
  },

  // Layout - Between
  {
    uiClassName: 'FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN',
    replacement: 'between.center',
    imports: ['between'],
    description: 'Flex items center justify between',
  },
  {
    uiClassName: 'FLEX_ITEMS_START_JUSTIFY_BETWEEN',
    replacement: 'between.start',
    imports: ['between'],
    description: 'Flex items start justify between',
  },

  // Layout - Center
  {
    uiClassName: 'FLEX_ITEMS_CENTER_JUSTIFY_CENTER',
    replacement: 'center',
    imports: ['center'],
    description: 'Flex items center justify center',
  },

  // Layout - Grid
  {
    uiClassName: 'GRID_COLS_1_MD_2',
    replacement: 'grid.responsive2',
    imports: ['grid'],
    description: 'Grid cols 1 md 2',
  },
  {
    uiClassName: 'GRID_COLS_1_MD_2_LG_3',
    replacement: 'grid.responsive3',
    imports: ['grid'],
    description: 'Grid cols 1 md 2 lg 3',
  },
  {
    uiClassName: 'GRID_COLS_3_GAP_4',
    replacement: 'grid.cols3',
    imports: ['grid'],
    description: 'Grid cols 3 gap 4',
  },
  {
    uiClassName: 'GRID_COLS_1_SM_2',
    replacement: 'grid.responsive2',
    imports: ['grid'],
    description: 'Grid cols 1 sm 2',
  },
  {
    uiClassName: 'GRID_COLS_1_SM_2_LG_3',
    replacement: 'grid.responsive3',
    imports: ['grid'],
    description: 'Grid cols 1 sm 2 lg 3',
  },
  {
    uiClassName: 'GRID_COLS_1_GAP_6',
    replacement: '`${grid.cols1} gap-6`',
    imports: ['grid'],
    description: 'Grid cols 1 gap 6 (compound)',
  },
  {
    uiClassName: 'GRID_COLS_2_GAP_2',
    replacement: '`${grid.cols2} gap-2`',
    imports: ['grid'],
    description: 'Grid cols 2 gap 2 (compound)',
  },
  {
    uiClassName: 'GRID_COLS_2_GAP_3',
    replacement: '`${grid.cols2} gap-3`',
    imports: ['grid'],
    description: 'Grid cols 2 gap 3 (compound)',
  },

  // Layout - Wrap
  {
    uiClassName: 'FLEX_WRAP_ITEMS_CENTER_GAP_2',
    replacement: '`${wrap} ${cluster.compact}`',
    imports: ['wrap', 'cluster'],
    description: 'Flex wrap items center gap 2 (compound)',
  },
  {
    uiClassName: 'FLEX_WRAP_ITEMS_CENTER_GAP_3',
    replacement: '`${wrap} ${cluster.default}`',
    imports: ['wrap', 'cluster'],
    description: 'Flex wrap items center gap 3 (compound)',
  },
  {
    uiClassName: 'FLEX_WRAP_GAP_2',
    replacement: '`${wrap} ${gap.compact}`',
    imports: ['wrap', 'gap'],
    description: 'Flex wrap gap 2 (compound)',
  },
  {
    uiClassName: 'FLEX_WRAP_GAP_3',
    replacement: '`${wrap} ${gap.default}`',
    imports: ['wrap', 'gap'],
    description: 'Flex wrap gap 3 (compound)',
  },

  // Layout - Responsive
  {
    uiClassName: 'FLEX_COL_SM_ROW_ITEMS_CENTER',
    replacement: 'responsive.colCenter',
    imports: ['responsive'],
    description: 'Flex col sm row items center',
  },
  {
    uiClassName: 'FLEX_COL_SM_ROW_ITEMS_CENTER_JUSTIFY_BETWEEN',
    replacement: 'responsive.colBetween',
    imports: ['responsive'],
    description: 'Flex col sm row items center justify between',
  },
  {
    uiClassName: 'FLEX_COL_SM_ROW_ITEMS_START',
    replacement: 'flex flex-col sm:flex-row items-start gap-3',
    imports: [],
    description: 'Flex col sm row items start (responsive - keep as-is)',
  },
  {
    uiClassName: 'FLEX_COL_SM_ROW_GAP_3',
    replacement: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
    imports: [],
    description: 'Flex col sm row gap 3 (responsive - keep as-is)',
  },

  // Icons
  {
    uiClassName: 'ICON_XS',
    replacement: 'iconSize.xs',
    imports: ['iconSize'],
    description: 'Icon XS',
  },
  {
    uiClassName: 'ICON_SM',
    replacement: 'iconSize.sm',
    imports: ['iconSize'],
    description: 'Icon SM',
  },
  {
    uiClassName: 'ICON_MD',
    replacement: 'iconSize.md',
    imports: ['iconSize'],
    description: 'Icon MD',
  },
  {
    uiClassName: 'ICON_LG',
    replacement: 'iconSize.lg',
    imports: ['iconSize'],
    description: 'Icon LG',
  },
  {
    uiClassName: 'ICON_XL',
    replacement: 'iconSize.xl',
    imports: ['iconSize'],
    description: 'Icon XL',
  },
  {
    uiClassName: 'ICON_XS_LEADING',
    replacement: '`${iconSize.xs} ${marginRight.tight}`',
    imports: ['iconSize', 'marginRight'],
    description: 'Icon XS leading (compound)',
  },
  {
    uiClassName: 'ICON_SM_LEADING',
    replacement: '`${iconSize.sm} ${marginRight.compact}`',
    imports: ['iconSize', 'marginRight'],
    description: 'Icon SM leading (compound)',
  },
  {
    uiClassName: 'ICON_MD_LEADING',
    replacement: '`${iconSize.md} ${marginRight.compact}`',
    imports: ['iconSize', 'marginRight'],
    description: 'Icon MD leading (compound)',
  },

  // Typography - Headings
  {
    uiClassName: 'HEADING_H1',
    replacement: "`${size['4xl']} ${weight.bold} ${tracking.tight}`",
    imports: ['size', 'weight', 'tracking'],
    description: 'Heading H1 (compound)',
  },
  {
    uiClassName: 'HEADING_H2',
    replacement: "`${size['3xl']} ${weight.semibold} ${tracking.tight}`",
    imports: ['size', 'weight', 'tracking'],
    description: 'Heading H2 (compound)',
  },
  {
    uiClassName: 'HEADING_H3',
    replacement: "`${size['2xl']} ${weight.semibold}`",
    imports: ['size', 'weight'],
    description: 'Heading H3 (compound)',
  },
  {
    uiClassName: 'HEADING_H4',
    replacement: '`${size.xl} ${weight.semibold}`',
    imports: ['size', 'weight'],
    description: 'Heading H4 (compound)',
  },
  {
    uiClassName: 'HEADING_H5',
    replacement: '`${size.lg} ${weight.semibold}`',
    imports: ['size', 'weight'],
    description: 'Heading H5 (compound)',
  },
  {
    uiClassName: 'HEADING_H6',
    replacement: '`${size.base} ${weight.semibold}`',
    imports: ['size', 'weight'],
    description: 'Heading H6 (compound)',
  },
  {
    uiClassName: 'HEADING_2XL',
    replacement: "`${size['2xl']} ${weight.bold}`",
    imports: ['size', 'weight'],
    description: 'Heading 2XL (compound)',
  },
  {
    uiClassName: 'HEADING_2XL_MB',
    replacement: "`${size['2xl']} ${weight.bold} ${marginBottom.default}`",
    imports: ['size', 'weight', 'marginBottom'],
    description: 'Heading 2XL MB (compound)',
  },
  {
    uiClassName: 'HEADING_2XL_SEMIBOLD_MB',
    replacement: "`${size['2xl']} ${weight.semibold} ${marginBottom.default}`",
    imports: ['size', 'weight', 'marginBottom'],
    description: 'Heading 2XL semibold MB (compound)',
  },
  {
    uiClassName: 'HEADING_LG_SEMIBOLD_MB',
    replacement: '`${size.lg} ${weight.semibold} ${marginBottom.compact}`',
    imports: ['size', 'weight', 'marginBottom'],
    description: 'Heading LG semibold MB (compound)',
  },

  // Typography - Text
  {
    uiClassName: 'TEXT_BODY_LG',
    replacement: '`${size.lg} ${leading.relaxed}`',
    imports: ['size', 'leading'],
    description: 'Text body LG (compound)',
  },
  {
    uiClassName: 'TEXT_BODY_DEFAULT',
    replacement: '`${size.base} ${leading.normal}`',
    imports: ['size', 'leading'],
    description: 'Text body default (compound)',
  },
  {
    uiClassName: 'TEXT_BODY_SM',
    replacement: '`${size.sm} ${leading.normal}`',
    imports: ['size', 'leading'],
    description: 'Text body SM (compound)',
  },
  {
    uiClassName: 'TEXT_BODY_XS',
    replacement: '`${size.xs} ${leading.normal}`',
    imports: ['size', 'leading'],
    description: 'Text body XS (compound)',
  },
  { uiClassName: 'TEXT_BODY', replacement: 'size.sm', imports: ['size'], description: 'Text body' },
  {
    uiClassName: 'TEXT_LABEL',
    replacement: '`${size.sm} ${weight.medium} text-foreground`',
    imports: ['size', 'weight'],
    description: 'Text label (compound)',
  },
  {
    uiClassName: 'TEXT_LABEL_SM',
    replacement: '`${size.sm} ${weight.medium}`',
    imports: ['size', 'weight'],
    description: 'Text label SM (compound)',
  },
  {
    uiClassName: 'TEXT_HELPER',
    replacement: '`${size.xs} ${muted.default}`',
    imports: ['size', 'muted'],
    description: 'Text helper (compound)',
  },
  {
    uiClassName: 'TEXT_METADATA',
    replacement: '`${size.xs} ${muted.default}`',
    imports: ['size', 'muted'],
    description: 'Text metadata (compound)',
  },
  {
    uiClassName: 'TEXT_BADGE',
    replacement: '`${size.xs} ${weight.semibold}`',
    imports: ['size', 'weight'],
    description: 'Text badge (compound)',
  },
  {
    uiClassName: 'TEXT_CARD_TITLE',
    replacement: '`${size.lg} ${weight.semibold}`',
    imports: ['size', 'weight'],
    description: 'Text card title (compound)',
  },
  {
    uiClassName: 'TEXT_CARD_DESCRIPTION',
    replacement: '`${size.sm} ${muted.default}`',
    imports: ['size', 'muted'],
    description: 'Text card description (compound)',
  },
  {
    uiClassName: 'TEXT_STAT_VALUE',
    replacement: "`${weight.bold} ${size['2xl']}`",
    imports: ['weight', 'size'],
    description: 'Text stat value (compound)',
  },
  {
    uiClassName: 'TEXT_STAT_LARGE',
    replacement: "`${weight.bold} ${size['3xl']}`",
    imports: ['weight', 'size'],
    description: 'Text stat large (compound)',
  },
  {
    uiClassName: 'TEXT_PRICE_PRIMARY',
    replacement: "`${weight.bold} ${size['3xl']}`",
    imports: ['weight', 'size'],
    description: 'Text price primary (compound)',
  },
  {
    uiClassName: 'TEXT_XS_MUTED',
    replacement: '`${size.xs} ${muted.default}`',
    imports: ['size', 'muted'],
    description: 'Text XS muted (compound)',
  },
  {
    uiClassName: 'TEXT_SM_MUTED',
    replacement: '`${size.sm} ${muted.default}`',
    imports: ['size', 'muted'],
    description: 'Text SM muted (compound)',
  },
  {
    uiClassName: 'TEXT_MUTED',
    replacement: 'muted.default',
    imports: ['muted'],
    description: 'Text muted',
  },
  { uiClassName: 'TEXT_SM', replacement: 'size.sm', imports: ['size'], description: 'Text SM' },
  {
    uiClassName: 'TEXT_SM_MEDIUM',
    replacement: '`${size.sm} ${weight.medium}`',
    imports: ['size', 'weight'],
    description: 'Text SM medium (compound)',
  },
  { uiClassName: 'TEXT_XS', replacement: 'size.xs', imports: ['size'], description: 'Text XS' },
  {
    uiClassName: 'FONT_MEDIUM',
    replacement: 'weight.medium',
    imports: ['weight'],
    description: 'Font medium',
  },

  // Form Spacing
  {
    uiClassName: 'FORM_FIELD_SPACING',
    replacement: 'spaceY.compact',
    imports: ['spaceY'],
    description: 'Form field spacing',
  },
  {
    uiClassName: 'FORM_SECTION_SPACING',
    replacement: 'spaceY.relaxed',
    imports: ['spaceY'],
    description: 'Form section spacing',
  },
  {
    uiClassName: 'FORM_GROUP_SPACING',
    replacement: 'spaceY.comfortable',
    imports: ['spaceY'],
    description: 'Form group spacing',
  },

  // Card Spacing
  {
    uiClassName: 'CARD_PADDING_DEFAULT',
    replacement: 'padding.comfortable',
    imports: ['padding'],
    description: 'Card padding default',
  },
  {
    uiClassName: 'CARD_PADDING_COMPACT',
    replacement: 'padding.default',
    imports: ['padding'],
    description: 'Card padding compact',
  },
  {
    uiClassName: 'CARD_PADDING_TIGHT',
    replacement: 'padding.compact',
    imports: ['padding'],
    description: 'Card padding tight',
  },
  {
    uiClassName: 'CARD_HEADER_DEFAULT',
    replacement: 'paddingBottom.default',
    imports: ['paddingBottom'],
    description: 'Card header default',
  },
  {
    uiClassName: 'CARD_HEADER_COMPACT',
    replacement: 'paddingBottom.compact',
    imports: ['paddingBottom'],
    description: 'Card header compact',
  },
  {
    uiClassName: 'CARD_HEADER_TIGHT',
    replacement: 'paddingBottom.tight',
    imports: ['paddingBottom'],
    description: 'Card header tight',
  },
  {
    uiClassName: 'CARD_HEADER_SPACING',
    replacement: '`${paddingX.comfortable} ${paddingY.default}`',
    imports: ['paddingX', 'paddingY'],
    description: 'Card header spacing (compound)',
  },
  {
    uiClassName: 'CARD_BODY_SPACING',
    replacement: '`${paddingX.comfortable} ${paddingY.comfortable}`',
    imports: ['paddingX', 'paddingY'],
    description: 'Card body spacing (compound)',
  },

  // Container Spacing
  {
    uiClassName: 'CONTAINER_PADDING_SM',
    replacement: '`${paddingX.default} ${paddingY.tight}`',
    imports: ['paddingX', 'paddingY'],
    description: 'Container padding SM (compound)',
  },
  {
    uiClassName: 'CONTAINER_PADDING_MD',
    replacement: '`${paddingX.comfortable} ${paddingY.compact}`',
    imports: ['paddingX', 'paddingY'],
    description: 'Container padding MD (compound)',
  },
  {
    uiClassName: 'CONTAINER_PADDING_LG',
    replacement: '`${paddingX.relaxed} ${paddingY.default}`',
    imports: ['paddingX', 'paddingY'],
    description: 'Container padding LG (compound)',
  },
  {
    uiClassName: 'CONTAINER_PAGE',
    replacement: '`${container} ${paddingX.default} ${paddingY.relaxed}`',
    imports: ['container', 'paddingX', 'paddingY'],
    description: 'Container page (compound)',
  },

  // Section Spacing
  {
    uiClassName: 'SECTION_SPACING_TIGHT',
    replacement: 'marginBottom.relaxed',
    imports: ['marginBottom'],
    description: 'Section spacing tight',
  },
  {
    uiClassName: 'SECTION_SPACING_DEFAULT',
    replacement: 'marginBottom.section',
    imports: ['marginBottom'],
    description: 'Section spacing default',
  },
  {
    uiClassName: 'SECTION_SPACING_RELAXED',
    replacement: 'marginBottom.hero',
    imports: ['marginBottom'],
    description: 'Section spacing relaxed',
  },

  // Interactive
  {
    uiClassName: 'BUTTON_GHOST_ICON',
    replacement: '`${hoverBg.default} hover:text-accent`',
    imports: ['hoverBg'],
    description: 'Button ghost icon (compound)',
  },
  {
    uiClassName: 'BUTTON_ICON_TEXT_SM',
    replacement: 'h-7 px-2 text-xs gap-1',
    imports: [],
    description: 'Button icon text SM (complex - keep as-is)',
  },
  {
    uiClassName: 'CARD_HOVER_BG',
    replacement: '`${transition.colors} ${hoverBg.subtle}`',
    imports: ['transition', 'hoverBg'],
    description: 'Card hover BG (compound)',
  },
  {
    uiClassName: 'GROUP_HOVER_ACCENT',
    replacement: 'group-hover:text-accent',
    imports: [],
    description: 'Group hover accent (semantic - keep as-is)',
  },

  // Badge
  {
    uiClassName: 'BADGE_CONTAINER',
    replacement: '`${wrap} ${gap.compact} ${marginBottom.default}`',
    imports: ['wrap', 'gap', 'marginBottom'],
    description: 'Badge container (compound)',
  },
  {
    uiClassName: 'BADGE_METADATA_CONTAINER',
    replacement: '`${cluster.compact} ${size.xs} flex-nowrap`',
    imports: ['cluster', 'size'],
    description: 'Badge metadata container (compound)',
  },

  // Code Block
  {
    uiClassName: 'CODE_BLOCK_BUTTON_BASE',
    replacement:
      '`${center} ${radius.md} bg-code/95 p-1.5 shadow-md backdrop-blur-md ${transition.colors} hover:bg-code`',
    imports: ['center', 'radius', 'transition'],
    description: 'Code block button base (complex - keep as-is or create utility)',
  },
  {
    uiClassName: 'CODE_BLOCK_BUTTON_ICON',
    replacement:
      '`${center} ${radius.md} bg-code/95 p-1.5 text-muted-foreground shadow-md backdrop-blur-md ${transition.colors} hover:bg-code hover:text-foreground`',
    imports: ['center', 'radius', 'transition'],
    description: 'Code block button icon (complex)',
  },
  {
    uiClassName: 'CODE_BLOCK_SOCIAL_ICON_WRAPPER',
    replacement: '`${center} ${iconSize.md} ${radius.full}`',
    imports: ['center', 'iconSize', 'radius'],
    description: 'Code block social icon wrapper (compound)',
  },

  // Icon Colors (semantic - keep as-is for now, but map to keep consistent)
  {
    uiClassName: 'ICON_INFO',
    replacement: 'text-blue-500 dark:text-blue-400',
    imports: [],
    description: 'Icon info color (semantic - keep as-is)',
  },

  // Links (semantic - keep as-is)
  {
    uiClassName: 'LINK_ACCENT',
    replacement: 'text-accent hover:text-accent-hover transition-colors duration-200',
    imports: [],
    description: 'Link accent (semantic - keep as-is)',
  },

  // Status (semantic - keep as-is)
  {
    uiClassName: 'STATUS_PUBLISHED',
    replacement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    imports: [],
    description: 'Status published (semantic - keep as-is)',
  },
  {
    uiClassName: 'STATUS_PREMIUM',
    replacement: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    imports: [],
    description: 'Status premium (semantic - keep as-is)',
  },
  {
    uiClassName: 'STATUS_APPROVED',
    replacement: 'bg-green-500/10 text-green-400 border-green-500/20',
    imports: [],
    description: 'Status approved (semantic - keep as-is)',
  },
  {
    uiClassName: 'STATUS_WARNING',
    replacement: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    imports: [],
    description: 'Status warning (semantic - keep as-is)',
  },

  // Icon Colors (semantic - keep as-is)
  {
    uiClassName: 'ICON_NEUTRAL',
    replacement: 'text-gray-500 dark:text-gray-400',
    imports: [],
    description: 'Icon neutral color (semantic - keep as-is)',
  },

  // Score Colors (semantic - keep as-is)
  {
    uiClassName: 'SCORE_EXCELLENT',
    replacement: 'text-green-600 dark:text-green-400',
    imports: [],
    description: 'Score excellent color (semantic - keep as-is)',
  },
  {
    uiClassName: 'SCORE_GOOD',
    replacement: 'text-blue-600 dark:text-blue-400',
    imports: [],
    description: 'Score good color (semantic - keep as-is)',
  },
  {
    uiClassName: 'SCORE_FAIR',
    replacement: 'text-yellow-600 dark:text-yellow-400',
    imports: [],
    description: 'Score fair color (semantic - keep as-is)',
  },

  // Layout - Complex flex patterns
  {
    uiClassName: 'FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2',
    replacement: '`${center} ${gap.compact}`',
    imports: ['center', 'gap'],
    description: 'Flex items center justify center gap 2 (compound)',
  },
  {
    uiClassName: 'FLEX_ITEMS_START_GAP_2',
    replacement: '`flex items-start ${gap.compact}`',
    imports: ['gap'],
    description: 'Flex items start gap 2 (compound)',
  },
  {
    uiClassName: 'FLEX_ITEMS_START_GAP_3',
    replacement: '`flex items-start ${gap.default}`',
    imports: ['gap'],
    description: 'Flex items start gap 3 (compound)',
  },
  {
    uiClassName: 'FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER',
    replacement: '`${stack.none} ${center} ${paddingY.section}`',
    imports: ['stack', 'center', 'paddingY'],
    description: 'Flex col items center justify center py-12 (compound)',
  },
  {
    uiClassName: 'FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_EMPTY',
    replacement: '`${stack.none} ${center} ${padding.relaxed} text-center`',
    imports: ['stack', 'center', 'padding'],
    description: 'Flex col items center justify center p-8 text-center (compound)',
  },
  {
    uiClassName: 'FLEX_SHRINK_0_MT_0_5',
    replacement: '`flex-shrink-0 ${marginTop.micro}`',
    imports: ['marginTop'],
    description: 'Flex shrink 0 margin top 0.5 (compound)',
  },

  // Grid patterns
  {
    uiClassName: 'GRID_COLS_3_GAP_2',
    replacement: '`grid grid-cols-3 ${gap.compact}`',
    imports: ['gap'],
    description: 'Grid cols 3 gap 2 (compound)',
  },
  {
    uiClassName: 'GRID_RESPONSIVE_3',
    replacement: 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    imports: [],
    description: 'Grid responsive 3 (complex - keep as-is)',
  },
  {
    uiClassName: 'GRID_RESPONSIVE_4',
    replacement: 'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
    imports: [],
    description: 'Grid responsive 4 (complex - keep as-is)',
  },

  // Typography - Complex headings
  {
    uiClassName: 'TEXT_HEADING_HERO',
    replacement: 'text-4xl lg:text-6xl font-bold mb-6 text-foreground',
    imports: [],
    description: 'Text heading hero (responsive - keep as-is)',
  },
  {
    uiClassName: 'TEXT_HEADING_LARGE',
    replacement: '`${size.xl} ${muted.default} ${marginBottom.relaxed} ${leading.relaxed}`',
    imports: ['size', 'muted', 'marginBottom', 'leading'],
    description: 'Text heading large (compound)',
  },
  {
    uiClassName: 'TEXT_HEADING_MEDIUM',
    replacement: '`${size.lg} ${muted.default} ${marginBottom.relaxed} ${leading.relaxed}`',
    imports: ['size', 'muted', 'marginBottom', 'leading'],
    description: 'Text heading medium (compound)',
  },
  {
    uiClassName: 'TEXT_NAV',
    replacement: 'text-foreground/80 hover:text-foreground',
    imports: [],
    description: 'Text nav (semantic - keep as-is)',
  },

  // Container patterns
  {
    uiClassName: 'CONTAINER_OVERFLOW_BORDER',
    replacement: 'relative overflow-hidden border-b border-border/50 bg-card/30',
    imports: [],
    description: 'Container overflow border (complex - keep as-is)',
  },

  // Card patterns
  {
    uiClassName: 'CARD_GRADIENT_HOVER',
    replacement: 'card-gradient transition-smooth group',
    imports: [],
    description: 'Card gradient hover (semantic - keep as-is)',
  },
  {
    uiClassName: 'CARD_CONTENT_DEFAULT',
    replacement: 'pt-0',
    imports: [],
    description: 'Card content default (pt-0 - keep as-is)',
  },

  // Job featured patterns (semantic - keep as-is)
  {
    uiClassName: 'JOB_FEATURED_BORDER',
    replacement: 'border-2 border-orange-500/50',
    imports: [],
    description: 'Job featured border (semantic - keep as-is)',
  },
  {
    uiClassName: 'JOB_FEATURED_GRADIENT',
    replacement: 'bg-gradient-to-br from-orange-500/5 to-orange-600/10',
    imports: [],
    description: 'Job featured gradient (semantic - keep as-is)',
  },
  {
    uiClassName: 'JOB_FEATURED_GLOW',
    replacement: 'shadow-lg shadow-orange-500/10',
    imports: [],
    description: 'Job featured glow (semantic - keep as-is)',
  },
  {
    uiClassName: 'JOB_FEATURED_BADGE',
    replacement: 'bg-orange-500 text-white border-orange-500',
    imports: [],
    description: 'Job featured badge (semantic - keep as-is)',
  },

  // Icon colors (semantic - keep as-is)
  {
    uiClassName: 'ICON_SUCCESS',
    replacement: 'text-green-500 dark:text-green-400',
    imports: [],
    description: 'Icon success color (semantic - keep as-is)',
  },

  // Code block patterns
  {
    uiClassName: 'CODE_BLOCK_GROUP_WRAPPER',
    replacement: '`relative group ${marginY.comfortable}`',
    imports: ['marginY'],
    description: 'Code block group wrapper (compound)',
  },
  {
    uiClassName: 'CODE_BLOCK_HEADER',
    replacement:
      '`${between.center} ${paddingX.default} py-2.5 bg-code/40 ${border.default} border-b-0 ${radius.lg}`',
    imports: ['between', 'paddingX', 'border', 'radius'],
    description: 'Code block header (compound)',
  },
  {
    uiClassName: 'CODE_BLOCK_FILENAME',
    replacement: '`${size.sm} font-mono text-foreground ${weight.medium}`',
    imports: ['size', 'weight'],
    description: 'Code block filename (compound)',
  },

  // Form patterns
  {
    uiClassName: 'INPUT_HIDDEN',
    replacement: 'hidden',
    imports: [],
    description: 'Input hidden (simple - keep as-is)',
  },
  {
    uiClassName: 'UPLOAD_ZONE',
    replacement:
      'flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted',
    imports: [],
    description: 'Upload zone (complex - keep as-is)',
  },

  // Simple patterns
  {
    uiClassName: 'FLEX_GAP_2',
    replacement: 'flex gap-2',
    imports: [],
    description: 'Flex gap 2 (simple - keep as-is)',
  },

  // Card Interactive (complex - keep as-is for now)
  {
    uiClassName: 'CARD_INTERACTIVE',
    replacement: 'card-gradient transition-smooth group cursor-pointer border-border/50',
    imports: [],
    description: 'Card interactive (complex - keep as-is)',
  },
];

// Create lookup map for fast access
const UI_CLASS_MAP = new Map<string, UIClassMapping>();
for (const mapping of UI_CLASS_MAPPINGS) {
  UI_CLASS_MAP.set(mapping.uiClassName, mapping);
}

interface Transformation {
  file: string;
  line: number;
  original: string;
  transformed: string;
  type: string;
}

interface MigrationResult {
  file: string;
  transformations: Transformation[];
  importsAdded: string[];
  importsRemoved: string[];
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
 * Add or update import statement for semantic utilities
 */
function addSemanticImports(sourceFile: SourceFile, imports: string[]): void {
  if (imports.length === 0) return;

  // Check if design-system import already exists
  const existingImport = sourceFile.getImportDeclaration(
    (decl) => decl.getModuleSpecifierValue() === '@heyclaude/web-runtime/design-system'
  );

  if (existingImport) {
    // Add to existing import
    const existingNamedImports = existingImport.getNamedImports().map((imp) => imp.getName());
    const newImports = imports.filter((imp) => !existingNamedImports.includes(imp));

    if (newImports.length > 0) {
      for (const imp of newImports) {
        existingImport.addNamedImport(imp);
      }
    }
  } else {
    // Create new import
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@heyclaude/web-runtime/design-system',
      namedImports: imports,
    });
  }
}

/**
 * Remove UI_CLASSES import if no longer used
 */
function removeUIClassesImport(sourceFile: SourceFile): boolean {
  // Check if UI_CLASSES is still used in the file
  const fileText = sourceFile.getFullText();
  if (fileText.includes('UI_CLASSES.')) {
    return false; // Still in use
  }

  // Find and remove UI_CLASSES import
  const uiClassesImport = sourceFile.getImportDeclaration((decl) => {
    const specifier = decl.getModuleSpecifierValue();
    return (
      specifier === '@heyclaude/web-runtime/ui' ||
      specifier === '@heyclaude/web-runtime/ui/constants'
    );
  });

  if (uiClassesImport) {
    const namedImports = uiClassesImport.getNamedImports();
    const uiClassesNamedImport = namedImports.find((imp) => imp.getName() === 'UI_CLASSES');

    if (uiClassesNamedImport) {
      if (namedImports.length === 1) {
        // Only UI_CLASSES in import, remove entire import
        uiClassesImport.remove();
      } else {
        // Remove just UI_CLASSES from named imports
        uiClassesNamedImport.remove();
      }
      return true;
    }
  }

  return false;
}

/**
 * Migrate a single file
 */
function migrateFile(filePath: string, dryRun: boolean): MigrationResult {
  const result: MigrationResult = {
    file: relative(PROJECT_ROOT, filePath),
    transformations: [],
    importsAdded: [],
    importsRemoved: [],
    errors: [],
  };

  try {
    const content = readFileSync(filePath, 'utf-8');

    // Skip if file doesn't contain UI_CLASSES
    if (!content.includes('UI_CLASSES.')) {
      return result;
    }

    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    const allNeededImports = new Set<string>();
    let hasChanges = false;

    // Process all PropertyAccessExpression nodes (UI_CLASSES.*)
    sourceFile.forEachDescendant((node) => {
      // Check if this is a UI_CLASSES property access
      if (Node.isPropertyAccessExpression(node)) {
        const expression = node.getExpression();
        if (Node.isIdentifier(expression) && expression.getText() === 'UI_CLASSES') {
          const propertyName = node.getName();
          const mapping = UI_CLASS_MAP.get(propertyName);

          if (mapping) {
            hasChanges = true;
            mapping.imports.forEach((imp) => allNeededImports.add(imp));

            // Check if replacement is a compound pattern (template literal)
            const isCompound = mapping.replacement.startsWith('`');
            // Check if replacement is a plain string (needs quotes in JSX, not a property access)
            // Plain strings contain spaces and don't contain dots (property access like 'stack.compact')
            const isPlainString =
              !isCompound &&
              mapping.replacement.includes(' ') &&
              !mapping.replacement.includes('.') &&
              !mapping.replacement.startsWith('$');
            // For compound replacements, extract content without backticks
            // For simple replacements, use as-is
            let replacementContent: string;
            if (isCompound) {
              // Remove outer backticks: `content` -> content
              replacementContent = mapping.replacement.slice(1, -1);
            } else {
              replacementContent = mapping.replacement;
            }

            // Record transformation
            result.transformations.push({
              file: result.file,
              line: node.getStartLineNumber(),
              original: `UI_CLASSES.${propertyName}`,
              transformed: replacementContent,
              type: isCompound ? 'ui-class-compound' : 'ui-class-simple',
            });

            if (!dryRun) {
              // Find JSX attribute and check for template literal context
              let jsxAttr: any = null;
              let inTemplateLiteral = false;
              let current: any = node;
              while (current) {
                if (Node.isJsxAttribute(current)) {
                  jsxAttr = current;
                  break;
                }
                if (Node.isTemplateSpan(current)) {
                  inTemplateLiteral = true;
                }
                if (Node.isTemplateExpression(current)) {
                  inTemplateLiteral = true;
                }
                current = current.getParent();
              }

              // Replace the PropertyAccessExpression node directly
              // ts-morph should handle the context (template literal, JSX expression, etc.)
              if (inTemplateLiteral) {
                // In template literal: ${UI_CLASSES.X} or `...${UI_CLASSES.X}...`
                // Find the TemplateExpression and rebuild it with the replacement
                let templateExpr: any = null;
                let targetSpan: any = null;
                current = node.getParent();
                while (current) {
                  if (Node.isTemplateSpan(current)) {
                    targetSpan = current;
                    templateExpr = current.getParent();
                    if (Node.isTemplateExpression(templateExpr)) {
                      break;
                    }
                  }
                  if (Node.isTemplateExpression(current)) {
                    templateExpr = current;
                    // Find which span contains us
                    const spans = current.getTemplateSpans();
                    for (const span of spans) {
                      if (span.getExpression() === node) {
                        targetSpan = span;
                        break;
                      }
                    }
                    break;
                  }
                  current = current.getParent();
                }

                if (
                  templateExpr &&
                  Node.isTemplateExpression(templateExpr) &&
                  targetSpan &&
                  targetSpan.getExpression() === node
                ) {
                  // We ARE the expression in a TemplateSpan
                  // Check if this is a plain string in a simple template literal (just `${UI_CLASSES.X}`)
                  const head = templateExpr.getHead().getText();
                  const spans = templateExpr.getTemplateSpans();
                  const tail = targetSpan.getLiteral().getText();
                  const hasOnlyOneSpan = spans.length === 1;
                  const hasNoHeadOrTail = head === '' && tail === '';

                  let convertedToStringLiteral = false;
                  if (isPlainString && hasOnlyOneSpan && hasNoHeadOrTail) {
                    // Template literal is just `${UI_CLASSES.X}` with plain string - convert to string literal
                    let attr = jsxAttr;
                    if (!attr) {
                      let current = templateExpr.getParent();
                      while (current) {
                        if (Node.isJsxAttribute(current)) {
                          attr = current;
                          break;
                        }
                        current = current.getParent();
                      }
                    }
                    if (attr) {
                      attr.setInitializer(`"${replacementContent}"`);
                      convertedToStringLiteral = true;
                    }
                  }

                  // Only rebuild template if we didn't convert to string literal
                  if (!convertedToStringLiteral) {
                    // For compound replacements, parse the compound and rebuild with multiple spans
                    // For simple replacements, rebuild the template expression
                    try {
                      const updatedParts: string[] = [head];

                      for (const span of spans) {
                        if (span === targetSpan) {
                          // Replace this span's expression
                          if (isCompound) {
                            // Compound replacement like `${wrap} ${gap.compact}`
                            // Parse it: extract expressions and literals
                            // Pattern: ${expr1} literal1 ${expr2} literal2
                            const compoundPattern = /(\$\{[^}]+\})|([^$]+)/g;
                            const matches = replacementContent.matchAll(compoundPattern);
                            let firstPart = true;
                            for (const match of matches) {
                              if (match[1]) {
                                // Expression: ${...}
                                const exprContent = match[1].slice(2, -1); // Remove ${}
                                updatedParts.push(exprContent);
                              } else if (match[2]) {
                                // Literal text
                                if (firstPart) {
                                  // First literal goes before first expression
                                  updatedParts[updatedParts.length - 1] += match[2];
                                } else {
                                  updatedParts.push(match[2]);
                                }
                              }
                              firstPart = false;
                            }
                            // Add the original span's literal after the compound
                            updatedParts.push(span.getLiteral().getText());
                          } else if (isPlainString) {
                            // Plain string in template literal with other content
                            // Replace with string content directly (no ${} wrapper)
                            updatedParts.push(replacementContent);
                            updatedParts.push(span.getLiteral().getText());
                          } else {
                            // Simple property access replacement like 'iconSize.md'
                            updatedParts.push(replacementContent);
                            updatedParts.push(span.getLiteral().getText());
                          }
                        } else {
                          // Keep other spans as-is
                          updatedParts.push(span.getExpression().getText());
                          updatedParts.push(span.getLiteral().getText());
                        }
                      }

                      // Rebuild template literal
                      const newText = '`' + updatedParts.join('') + '`';
                      templateExpr.replaceWithText(newText);
                    } catch (error) {
                      // If template rebuild fails, fall back to direct node replacement
                      try {
                        node.replaceWithText(replacementContent);
                      } catch (fallbackError) {
                        result.errors.push(
                          `Failed to replace UI_CLASSES.${propertyName} in template literal at line ${node.getStartLineNumber()}: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
                        );
                      }
                    }
                  }
                } else {
                  // Fallback: replace node directly
                  node.replaceWithText(replacementContent);
                }
              } else if (jsxAttr) {
                const initializer = jsxAttr.getInitializer();

                if (Node.isJsxExpression(initializer)) {
                  const expr = initializer.getExpression();

                  // Direct property access: className={UI_CLASSES.X}
                  if (
                    Node.isPropertyAccessExpression(expr) &&
                    expr.getExpression()?.getText() === 'UI_CLASSES' &&
                    expr.getName() === propertyName
                  ) {
                    if (isCompound) {
                      // Compound: replace entire initializer with template literal
                      initializer.replaceWithText(`\`${replacementContent}\``);
                    } else if (isPlainString) {
                      // Plain string: convert JSX expression to string literal
                      // className={UI_CLASSES.X} -> className="replacement string"
                      jsxAttr.setInitializer(`"${replacementContent}"`);
                    } else {
                      // Simple property access: replace the expression inside the JSX expression
                      // This preserves the curly braces: {stack.compact}
                      expr.replaceWithText(replacementContent);
                    }
                  } else if (Node.isTemplateExpression(expr)) {
                    // Template expression in JSX: className={`${UI_CLASSES.X} other`}
                    // Find the span containing this UI_CLASSES and replace it
                    const spans = expr.getTemplateSpans();
                    let foundSpan: any = null;
                    for (const span of spans) {
                      const spanExpr = span.getExpression();
                      if (
                        Node.isPropertyAccessExpression(spanExpr) &&
                        spanExpr.getExpression()?.getText() === 'UI_CLASSES' &&
                        spanExpr.getName() === propertyName
                      ) {
                        foundSpan = span;
                        break;
                      }
                    }

                    if (foundSpan) {
                      // Replace the expression in this span
                      if (isCompound) {
                        // For compound, we need to parse and rebuild
                        const head = expr.getHead().getText();
                        const updatedParts: string[] = [head];
                        const compoundPattern = /(\$\{[^}]+\})|([^$]+)/g;
                        const matches = replacementContent.matchAll(compoundPattern);

                        for (const span of spans) {
                          if (span === foundSpan) {
                            // Replace this span
                            for (const match of matches) {
                              if (match[1]) {
                                updatedParts.push(match[1].slice(2, -1)); // Remove ${}
                              } else if (match[2]) {
                                updatedParts.push(match[2]);
                              }
                            }
                            updatedParts.push(span.getLiteral().getText());
                          } else {
                            updatedParts.push(span.getExpression().getText());
                            updatedParts.push(span.getLiteral().getText());
                          }
                        }
                        const newText = '`' + updatedParts.join('') + '`';
                        initializer.replaceWithText(newText);
                      } else if (isPlainString) {
                        // Plain string in template literal
                        // If it's the only expression with no head/tail, convert entire attribute to string literal
                        const head = expr.getHead().getText();
                        const tail = foundSpan.getLiteral().getText();
                        const hasOnlyOneSpan = spans.length === 1;
                        const hasNoHeadOrTail = head === '' && tail === '';

                        if (hasOnlyOneSpan && hasNoHeadOrTail) {
                          // Template literal is just `${UI_CLASSES.X}` - convert to string literal
                          jsxAttr.setInitializer(`"${replacementContent}"`);
                        } else {
                          // Multiple expressions or has head/tail - replace expression with string content directly
                          // This creates: `head replacementContent tail` (no ${} around replacementContent)
                          const updatedParts: string[] = [head];
                          for (const span of spans) {
                            if (span === foundSpan) {
                              // Replace with string content directly (no ${} wrapper)
                              updatedParts.push(replacementContent);
                              updatedParts.push(span.getLiteral().getText());
                            } else {
                              updatedParts.push(span.getExpression().getText());
                              updatedParts.push(span.getLiteral().getText());
                            }
                          }
                          const newText = '`' + updatedParts.join('') + '`';
                          initializer.replaceWithText(newText);
                        }
                      } else {
                        // Simple property access replacement - just replace the expression in the span
                        foundSpan.getExpression().replaceWithText(replacementContent);
                      }
                    } else {
                      // UI_CLASSES not found in spans - skip (might be nested)
                      result.errors.push(
                        `UI_CLASSES.${propertyName} in template expression but not found in spans at line ${node.getStartLineNumber()}`
                      );
                    }
                  } else {
                    // Part of other expression - replace node
                    node.replaceWithText(replacementContent);
                  }
                } else if (Node.isStringLiteral(initializer)) {
                  // className="..."
                  if (isCompound) {
                    jsxAttr.setInitializer(`{\`${replacementContent}\`}`);
                  } else {
                    jsxAttr.setInitializer(`{${replacementContent}}`);
                  }
                } else if (!initializer) {
                  // className without value
                  if (isCompound) {
                    jsxAttr.setInitializer(`{\`${replacementContent}\`}`);
                  } else {
                    jsxAttr.setInitializer(`{${replacementContent}}`);
                  }
                } else {
                  // Other - replace node
                  node.replaceWithText(replacementContent);
                }
              } else {
                // Not in JSX attribute - replace node
                node.replaceWithText(replacementContent);
              }
            }
          } else {
            // UI_CLASSES property not in mapping - log for manual review
            result.errors.push(
              `Unmapped UI_CLASSES.${propertyName} at line ${node.getStartLineNumber()}`
            );
          }
        }
      }
    });

    // Update imports
    if (hasChanges && !dryRun) {
      if (allNeededImports.size > 0) {
        addSemanticImports(sourceFile, Array.from(allNeededImports));
        result.importsAdded.push(...Array.from(allNeededImports));
      }

      // Try to remove UI_CLASSES import
      if (removeUIClassesImport(sourceFile)) {
        result.importsRemoved.push('UI_CLASSES');
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
export async function migrateUIClasses(dryRun: boolean = false): Promise<void> {
  logger.info('=== UI_CLASSES Migration ===');

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
    const result = migrateFile(filePath, dryRun);
    results.push(result);

    if (result.transformations.length > 0) {
      totalTransformations += result.transformations.length;
      filesModified++;

      logger.info(`${result.file}: ${result.transformations.length} transformation(s)`);
      if (result.importsAdded.length > 0) {
        logger.info(`  Added imports: ${result.importsAdded.join(', ')}`);
      }
      if (result.importsRemoved.length > 0) {
        logger.info(`  Removed imports: ${result.importsRemoved.join(', ')}`);
      }
      if (result.errors.length > 0) {
        logger.warn(`  Errors/Unmapped: ${result.errors.join('; ')}`);
      }
    }
  }

  // Summary
  logger.info('');
  logger.info('Summary', {
    filesProcessed: tsxFiles.length,
    filesWithChanges: filesModified,
    totalTransformations,
    mappingsAvailable: UI_CLASS_MAPPINGS.length,
  });

  if (!dryRun && filesModified > 0) {
    logger.info('Backup files created with .backup extension');
  }

  logger.info('');
  if (dryRun) {
    logger.info('DRY RUN complete - Review results above');
    logger.info(`Found ${totalTransformations} UI_CLASSES usages that would be migrated`);
    logger.info(
      `${results.filter((r) => r.errors.length > 0).length} files have unmapped UI_CLASSES (need manual review)`
    );
  } else {
    logger.info('Migration complete!');
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  migrateUIClasses(dryRun).catch((error) => {
    logger.error('Migration failed', error);
    process.exit(1);
  });
}
