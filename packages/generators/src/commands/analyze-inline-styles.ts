#!/usr/bin/env tsx
/**
 * Inline Styles Analysis Command
 * 
 * Analyzes TSX/TS files to find:
 * - Inline Tailwind classes that should use design system utilities
 * - Patterns that match design system utility patterns
 * - Opportunities for migration to semantic utilities
 * 
 * This is a read-only analysis tool.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logger } from '../toolkit/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

interface InlineStylePattern {
  pattern: string;
  file: string;
  line: number;
  className: string;
  recommended: string;
  reason: string;
}

interface InlineStyleReport {
  marginBottom: InlineStylePattern[];
  marginTop: InlineStylePattern[];
  spaceY: InlineStylePattern[];
  flexColGap: InlineStylePattern[];
  flexCenterGap: InlineStylePattern[];
  mutedText: InlineStylePattern[];
  iconSizing: InlineStylePattern[];
  rounded: InlineStylePattern[];
  hoverBg: InlineStylePattern[];
  padding: InlineStylePattern[];
  paddingX: InlineStylePattern[];
  paddingY: InlineStylePattern[];
  paddingTop: InlineStylePattern[];
  paddingBottom: InlineStylePattern[];
  paddingLeft: InlineStylePattern[];
  paddingRight: InlineStylePattern[];
  gap: InlineStylePattern[];
  textSize: InlineStylePattern[];
  fontWeight: InlineStylePattern[];
  width: InlineStylePattern[];
  height: InlineStylePattern[];
  flex: InlineStylePattern[];
  gridCols: InlineStylePattern[];
  border: InlineStylePattern[];
  shadow: InlineStylePattern[];
  position: InlineStylePattern[];
  overflow: InlineStylePattern[];
  zIndex: InlineStylePattern[];
  leading: InlineStylePattern[];
  tracking: InlineStylePattern[];
  truncate: InlineStylePattern[];
  textTransform: InlineStylePattern[];
  maxMinSize: InlineStylePattern[];
  cursor: InlineStylePattern[];
  select: InlineStylePattern[];
  bgColor: InlineStylePattern[];
  textColor: InlineStylePattern[];
  borderColor: InlineStylePattern[];
  transition: InlineStylePattern[];
  duration: InlineStylePattern[];
  whitespace: InlineStylePattern[];
  marginX: InlineStylePattern[];
  marginY: InlineStylePattern[];
  marginLeft: InlineStylePattern[];
  marginRight: InlineStylePattern[];
  positionOffset: InlineStylePattern[];
  borderVariant: InlineStylePattern[];
  display: InlineStylePattern[];
  gradient: InlineStylePattern[];
  ringOutline: InlineStylePattern[];
  textDecoration: InlineStylePattern[];
  totalFiles: number;
  totalPatterns: number;
}

// Design system patterns to detect
const PATTERNS = {
  marginBottom: {
    regex: /\bmb-(\d+|auto|px|py)\b/g,
    recommended: 'marginBottom.*',
    reason: 'Use marginBottom utility from design system',
  },
  marginTop: {
    regex: /\bmt-(\d+|auto|px|py)\b/g,
    recommended: 'marginTop.*',
    reason: 'Use marginTop utility from design system',
  },
  spaceY: {
    regex: /\bspace-y-(\d+)\b/g,
    recommended: 'spaceY.*',
    reason: 'Use spaceY utility from design system',
  },
  flexColGap: {
    regex: /\bflex\s+flex-col\s+gap-(\d+)\b/g,
    recommended: 'stack.*',
    reason: 'Use stack utility from design system',
  },
  flexCenterGap: {
    regex: /\bflex\s+items-center\s+gap-(\d+)\b/g,
    recommended: 'cluster.*',
    reason: 'Use cluster utility from design system',
  },
  mutedText: {
    regex: /\btext-muted-foreground\b/g,
    recommended: 'muted.default',
    reason: 'Use muted utility from design system',
  },
  iconSizing: {
    regex: /\b(h-\d+|w-\d+)\s+(h-\d+|w-\d+)\b/g,
    recommended: 'iconSize.*',
    reason: 'Use iconSize utility from design system (when used on icons)',
  },
  rounded: {
    regex: /\brounded-(sm|md|lg|xl|full|2xl|3xl)\b/g,
    recommended: 'radius.*',
    reason: 'Use radius utility from design system',
  },
  hoverBg: {
    regex: /\bhover:bg-[\w-]+\b/g,
    recommended: 'hoverBg.*',
    reason: 'Use hoverBg utility from design system',
  },
  padding: {
    regex: /\bp-(\d+)\b(?!x|y)/g, // Negative lookahead to avoid matching px/py
    recommended: 'padding.*',
    reason: 'Use padding utility from design system',
  },
  paddingX: {
    regex: /\bpx-(\d+)\b/g,
    recommended: 'paddingX.*',
    reason: 'Use paddingX utility from design system',
  },
  paddingY: {
    regex: /\bpy-(\d+)\b/g,
    recommended: 'paddingY.*',
    reason: 'Use paddingY utility from design system',
  },
  paddingTop: {
    regex: /\bpt-(\d+)\b/g,
    recommended: 'paddingTop.*',
    reason: 'Use paddingTop utility from design system',
  },
  paddingBottom: {
    regex: /\bpb-(\d+)\b/g,
    recommended: 'paddingBottom.*',
    reason: 'Use paddingBottom utility from design system',
  },
  paddingLeft: {
    regex: /\bpl-(\d+)\b/g,
    recommended: 'paddingLeft.*',
    reason: 'Use paddingLeft utility from design system',
  },
  paddingRight: {
    regex: /\bpr-(\d+)\b/g,
    recommended: 'paddingRight.*',
    reason: 'Use paddingRight utility from design system',
  },
  gap: {
    regex: /\bgap-(\d+)\b/g,
    recommended: 'gap.*',
    reason: 'Use gap utility from design system (standalone, not part of flex compounds)',
  },
  textSize: {
    regex: /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b/g,
    recommended: 'size.*',
    reason: 'Use size utility from design system',
  },
  fontWeight: {
    regex: /\bfont-(normal|medium|semibold|bold)\b/g,
    recommended: 'weight.*',
    reason: 'Use weight utility from design system',
  },
  width: {
    regex: /\bw-(full|auto|screen|fit|min|max)\b/g,
    recommended: 'width.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic width utility if available',
  },
  height: {
    regex: /\bh-(full|screen|fit|min|max)\b(?!\s+w-)/g, // Negative lookahead to avoid matching h-X w-Y icon patterns
    recommended: 'height.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic height utility if available',
  },
  flex: {
    regex: /\bflex-(1|none|auto|initial)\b/g,
    recommended: 'flex.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic flex utility if available',
  },
  gridCols: {
    regex: /\bgrid-cols-(\d+)\b/g,
    recommended: 'grid.*',
    reason: 'Use grid utility from design system',
  },
  border: {
    regex: /\bborder\b(?!-)/g, // Standalone border (not border-*)
    recommended: 'border.*',
    reason: 'Use border utility from design system',
  },
  shadow: {
    regex: /\bshadow-(sm|md|lg|xl|2xl)\b/g,
    recommended: 'shadow.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic shadow utility if available',
  },
  position: {
    regex: /\b(absolute|relative|fixed|sticky)\b/g,
    recommended: 'position.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic position utility if available',
  },
  overflow: {
    regex: /\boverflow-(hidden|visible|scroll|auto)\b/g,
    recommended: 'overflow.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic overflow utility if available',
  },
  zIndex: {
    regex: /\bz-(\d+)\b/g,
    recommended: 'zIndex.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic z-index utility if available',
  },
  leading: {
    regex: /\bleading-(tight|normal|relaxed)\b/g,
    recommended: 'leading.*',
    reason: 'Use leading utility from design system',
  },
  tracking: {
    regex: /\btracking-(tight|normal|wide)\b/g,
    recommended: 'tracking.*',
    reason: 'Use tracking utility from design system',
  },
  truncate: {
    regex: /\b(truncate|line-clamp-(2|3))\b/g,
    recommended: 'truncate.*',
    reason: 'Use truncate utility from design system',
  },
  textTransform: {
    regex: /\b(uppercase|lowercase|capitalize)\b/g,
    recommended: 'textTransform.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic text transform utility if available',
  },
  maxMinSize: {
    regex: /\b(max-w-|min-w-|max-h-|min-h-)(full|screen|fit|min|max|\d+)\b/g,
    recommended: 'maxMinSize.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic max/min size utility if available',
  },
  cursor: {
    regex: /\bcursor-(pointer|not-allowed|default|wait|text|move|grab|grabbing)\b/g,
    recommended: 'cursor.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic cursor utility if available',
  },
  select: {
    regex: /\bselect-(none|text|all|auto)\b/g,
    recommended: 'select.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic select utility if available',
  },
  bgColor: {
    regex: /\bbg-(primary|secondary|muted|accent|destructive|foreground|background|card|popover)\b(?!\/)/g,
    recommended: 'bgColor.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic background color utility if available',
  },
  textColor: {
    regex: /\btext-(primary|secondary|accent|destructive|foreground|background|card-foreground|popover-foreground)\b(?!\/)/g,
    recommended: 'textColor.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic text color utility if available',
  },
  borderColor: {
    regex: /\bborder-(primary|secondary|muted|accent|destructive|foreground|background|border)\b(?!\/)/g,
    recommended: 'borderColor.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic border color utility if available',
  },
  transition: {
    regex: /\btransition-(all|colors|opacity|transform|none)\b/g,
    recommended: 'transition.*',
    reason: 'Use transition utility from design system',
  },
  duration: {
    regex: /\bduration-(\d+)\b/g,
    recommended: 'duration.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic duration utility if available',
  },
  whitespace: {
    regex: /\bwhitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)\b/g,
    recommended: 'whitespace.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic whitespace utility if available',
  },
  marginX: {
    regex: /\bmx-(\d+|auto)\b/g,
    recommended: 'marginX.*',
    reason: 'Use marginX utility from design system',
  },
  marginY: {
    regex: /\bmy-(\d+)\b/g,
    recommended: 'marginY.*',
    reason: 'Use marginY utility from design system',
  },
  marginLeft: {
    regex: /\bml-(\d+|auto)\b/g,
    recommended: 'marginLeft.*',
    reason: 'Use marginLeft utility from design system',
  },
  marginRight: {
    regex: /\bmr-(\d+|auto)\b/g,
    recommended: 'marginRight.*',
    reason: 'Use marginRight utility from design system',
  },
  positionOffset: {
    regex: /\b(top-|bottom-|left-|right-)(\d+|auto)\b/g,
    recommended: 'positionOffset.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic position offset utility if available',
  },
  borderVariant: {
    regex: /\bborder-(t|b|l|r|x|y)-(\d+|primary|secondary|muted|accent|destructive|foreground|background|border)\b/g,
    recommended: 'borderVariant.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic border variant utility if available',
  },
  display: {
    regex: /\b(block|inline|inline-block|flex|grid|table|contents|list-item|hidden|visible|invisible)\b(?!-)/g,
    recommended: 'display.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic display utility if available',
  },
  gradient: {
    regex: /\b(bg-gradient-|from-|via-|to-|bg-clip-|text-clip-)[\w-]+\b/g,
    recommended: 'gradient.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic gradient utility if available',
  },
  ringOutline: {
    regex: /\b(ring-|outline-)[\w-]+\b/g,
    recommended: 'ringOutline.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic ring/outline utility if available',
  },
  textDecoration: {
    regex: /\b(underline|line-through|no-underline|decoration-[\w-]+)\b/g,
    recommended: 'textDecoration.* (or keep as-is if no semantic utility)',
    reason: 'Consider using semantic text decoration utility if available',
  },
};

// Find all TSX/TS files
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
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Extract className values from TSX/TS files
function extractClassNames(content: string, file: string): InlineStylePattern[] {
  const patterns: InlineStylePattern[] = [];
  const lines = content.split('\n');

  // Match className="..." or className={`...`} or className={...}
  const classNameRegex = /className\s*=\s*{?["'`]([^"'`]+)["'`]}?/g;
  const classNameTemplateRegex = /className\s*=\s*{`([^`]+)`}/g;
  const classNameExpressionRegex = /className\s*=\s*{([^}]+)}/g;

  // Check all patterns
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    
    // Extract className values
    const classNames: string[] = [];
    
    // String literals
    let match;
    while ((match = classNameRegex.exec(line)) !== null) {
      classNames.push(match[1]);
    }
    
    // Template literals
    while ((match = classNameTemplateRegex.exec(line)) !== null) {
      classNames.push(match[1]);
    }
    
    // Expressions (cn(), etc.) - extract string parts
    while ((match = classNameExpressionRegex.exec(line)) !== null) {
      // Extract string literals from expressions
      const expr = match[1];
      const stringMatches = expr.match(/["']([^"']+)["']/g);
      if (stringMatches) {
        for (const str of stringMatches) {
          classNames.push(str.slice(1, -1)); // Remove quotes
        }
      }
    }

    // Check each className against patterns
    for (const className of classNames) {
      // Check marginBottom
      const mbMatches = className.matchAll(PATTERNS.marginBottom.regex);
      for (const mbMatch of mbMatches) {
        patterns.push({
          pattern: 'marginBottom',
          file,
          line: lineNum + 1,
          className: mbMatch[0],
          recommended: PATTERNS.marginBottom.recommended,
          reason: PATTERNS.marginBottom.reason,
        });
      }

      // Check marginTop
      const mtMatches = className.matchAll(PATTERNS.marginTop.regex);
      for (const mtMatch of mtMatches) {
        patterns.push({
          pattern: 'marginTop',
          file,
          line: lineNum + 1,
          className: mtMatch[0],
          recommended: PATTERNS.marginTop.recommended,
          reason: PATTERNS.marginTop.reason,
        });
      }

      // Check spaceY
      const spaceYMatches = className.matchAll(PATTERNS.spaceY.regex);
      for (const spaceYMatch of spaceYMatches) {
        patterns.push({
          pattern: 'spaceY',
          file,
          line: lineNum + 1,
          className: spaceYMatch[0],
          recommended: PATTERNS.spaceY.recommended,
          reason: PATTERNS.spaceY.reason,
        });
      }

      // Check flex flex-col gap
      const flexColMatches = className.matchAll(PATTERNS.flexColGap.regex);
      for (const flexColMatch of flexColMatches) {
        patterns.push({
          pattern: 'flexColGap',
          file,
          line: lineNum + 1,
          className: flexColMatch[0],
          recommended: PATTERNS.flexColGap.recommended,
          reason: PATTERNS.flexColGap.reason,
        });
      }

      // Check flex items-center gap
      const flexCenterMatches = className.matchAll(PATTERNS.flexCenterGap.regex);
      for (const flexCenterMatch of flexCenterMatches) {
        patterns.push({
          pattern: 'flexCenterGap',
          file,
          line: lineNum + 1,
          className: flexCenterMatch[0],
          recommended: PATTERNS.flexCenterGap.recommended,
          reason: PATTERNS.flexCenterGap.reason,
        });
      }

      // Check muted text
      const mutedMatches = className.matchAll(PATTERNS.mutedText.regex);
      for (const mutedMatch of mutedMatches) {
        patterns.push({
          pattern: 'mutedText',
          file,
          line: lineNum + 1,
          className: mutedMatch[0],
          recommended: PATTERNS.mutedText.recommended,
          reason: PATTERNS.mutedText.reason,
        });
      }

      // Check icon sizing (h-X w-X)
      const iconMatches = className.matchAll(PATTERNS.iconSizing.regex);
      for (const iconMatch of iconMatches) {
        // Only flag if it's likely an icon (heuristic: small sizes or in icon context)
        const iconSize = iconMatch[0];
        if (/\b(h-[3-6]|w-[3-6])\b/.test(iconSize)) {
          patterns.push({
            pattern: 'iconSizing',
            file,
            line: lineNum + 1,
            className: iconMatch[0],
            recommended: PATTERNS.iconSizing.recommended,
            reason: PATTERNS.iconSizing.reason,
          });
        }
      }

      // Check rounded
      const roundedMatches = className.matchAll(PATTERNS.rounded.regex);
      for (const roundedMatch of roundedMatches) {
        patterns.push({
          pattern: 'rounded',
          file,
          line: lineNum + 1,
          className: roundedMatch[0],
          recommended: PATTERNS.rounded.recommended,
          reason: PATTERNS.rounded.reason,
        });
      }

      // Check hover:bg
      const hoverBgMatches = className.matchAll(PATTERNS.hoverBg.regex);
      for (const hoverBgMatch of hoverBgMatches) {
        patterns.push({
          pattern: 'hoverBg',
          file,
          line: lineNum + 1,
          className: hoverBgMatch[0],
          recommended: PATTERNS.hoverBg.recommended,
          reason: PATTERNS.hoverBg.reason,
        });
      }

      // Check padding (p-* but not px-* or py-*)
      const paddingMatches = className.matchAll(PATTERNS.padding.regex);
      for (const paddingMatch of paddingMatches) {
        patterns.push({
          pattern: 'padding',
          file,
          line: lineNum + 1,
          className: paddingMatch[0],
          recommended: PATTERNS.padding.recommended,
          reason: PATTERNS.padding.reason,
        });
      }

      // Check paddingX
      const paddingXMatches = className.matchAll(PATTERNS.paddingX.regex);
      for (const paddingXMatch of paddingXMatches) {
        patterns.push({
          pattern: 'paddingX',
          file,
          line: lineNum + 1,
          className: paddingXMatch[0],
          recommended: PATTERNS.paddingX.recommended,
          reason: PATTERNS.paddingX.reason,
        });
      }

      // Check paddingY
      const paddingYMatches = className.matchAll(PATTERNS.paddingY.regex);
      for (const paddingYMatch of paddingYMatches) {
        patterns.push({
          pattern: 'paddingY',
          file,
          line: lineNum + 1,
          className: paddingYMatch[0],
          recommended: PATTERNS.paddingY.recommended,
          reason: PATTERNS.paddingY.reason,
        });
      }

      // Check paddingTop
      const paddingTopMatches = className.matchAll(PATTERNS.paddingTop.regex);
      for (const paddingTopMatch of paddingTopMatches) {
        patterns.push({
          pattern: 'paddingTop',
          file,
          line: lineNum + 1,
          className: paddingTopMatch[0],
          recommended: PATTERNS.paddingTop.recommended,
          reason: PATTERNS.paddingTop.reason,
        });
      }

      // Check paddingBottom
      const paddingBottomMatches = className.matchAll(PATTERNS.paddingBottom.regex);
      for (const paddingBottomMatch of paddingBottomMatches) {
        patterns.push({
          pattern: 'paddingBottom',
          file,
          line: lineNum + 1,
          className: paddingBottomMatch[0],
          recommended: PATTERNS.paddingBottom.recommended,
          reason: PATTERNS.paddingBottom.reason,
        });
      }

      // Check paddingLeft
      const paddingLeftMatches = className.matchAll(PATTERNS.paddingLeft.regex);
      for (const paddingLeftMatch of paddingLeftMatches) {
        patterns.push({
          pattern: 'paddingLeft',
          file,
          line: lineNum + 1,
          className: paddingLeftMatch[0],
          recommended: PATTERNS.paddingLeft.recommended,
          reason: PATTERNS.paddingLeft.reason,
        });
      }

      // Check paddingRight
      const paddingRightMatches = className.matchAll(PATTERNS.paddingRight.regex);
      for (const paddingRightMatch of paddingRightMatches) {
        patterns.push({
          pattern: 'paddingRight',
          file,
          line: lineNum + 1,
          className: paddingRightMatch[0],
          recommended: PATTERNS.paddingRight.recommended,
          reason: PATTERNS.paddingRight.reason,
        });
      }

      // Check standalone gap (not part of flex flex-col gap or flex items-center gap)
      // We need to check if gap is NOT part of these compound patterns
      const gapMatches = className.matchAll(PATTERNS.gap.regex);
      for (const gapMatch of gapMatches) {
        // Only count if it's not part of flex flex-col gap or flex items-center gap
        const gapPattern = gapMatch[0];
        const beforeGap = className.substring(0, className.indexOf(gapPattern));
        const isFlexColGap = /\bflex\s+flex-col\s+gap-/.test(className);
        const isFlexCenterGap = /\bflex\s+items-center\s+gap-/.test(className);
        
        if (!isFlexColGap && !isFlexCenterGap) {
          patterns.push({
            pattern: 'gap',
            file,
            line: lineNum + 1,
            className: gapMatch[0],
            recommended: PATTERNS.gap.recommended,
            reason: PATTERNS.gap.reason,
          });
        }
      }

      // Check text size
      const textSizeMatches = className.matchAll(PATTERNS.textSize.regex);
      for (const textSizeMatch of textSizeMatches) {
        patterns.push({
          pattern: 'textSize',
          file,
          line: lineNum + 1,
          className: textSizeMatch[0],
          recommended: PATTERNS.textSize.recommended,
          reason: PATTERNS.textSize.reason,
        });
      }

      // Check font weight
      const fontWeightMatches = className.matchAll(PATTERNS.fontWeight.regex);
      for (const fontWeightMatch of fontWeightMatches) {
        patterns.push({
          pattern: 'fontWeight',
          file,
          line: lineNum + 1,
          className: fontWeightMatch[0],
          recommended: PATTERNS.fontWeight.recommended,
          reason: PATTERNS.fontWeight.reason,
        });
      }

      // Check width
      const widthMatches = className.matchAll(PATTERNS.width.regex);
      for (const widthMatch of widthMatches) {
        patterns.push({
          pattern: 'width',
          file,
          line: lineNum + 1,
          className: widthMatch[0],
          recommended: PATTERNS.width.recommended,
          reason: PATTERNS.width.reason,
        });
      }

      // Check height (but not h-X w-Y icon patterns)
      const heightMatches = className.matchAll(PATTERNS.height.regex);
      for (const heightMatch of heightMatches) {
        // Skip if it's part of an icon sizing pattern (h-X w-Y)
        const heightPattern = heightMatch[0];
        const afterHeight = className.substring(className.indexOf(heightPattern) + heightPattern.length);
        const isIconPattern = /\s+w-\d+/.test(afterHeight);
        
        if (!isIconPattern) {
          patterns.push({
            pattern: 'height',
            file,
            line: lineNum + 1,
            className: heightMatch[0],
            recommended: PATTERNS.height.recommended,
            reason: PATTERNS.height.reason,
          });
        }
      }

      // Check flex
      const flexMatches = className.matchAll(PATTERNS.flex.regex);
      for (const flexMatch of flexMatches) {
        patterns.push({
          pattern: 'flex',
          file,
          line: lineNum + 1,
          className: flexMatch[0],
          recommended: PATTERNS.flex.recommended,
          reason: PATTERNS.flex.reason,
        });
      }

      // Check grid columns
      const gridColsMatches = className.matchAll(PATTERNS.gridCols.regex);
      for (const gridColsMatch of gridColsMatches) {
        patterns.push({
          pattern: 'gridCols',
          file,
          line: lineNum + 1,
          className: gridColsMatch[0],
          recommended: PATTERNS.gridCols.recommended,
          reason: PATTERNS.gridCols.reason,
        });
      }

      // Check border (standalone)
      const borderMatches = className.matchAll(PATTERNS.border.regex);
      for (const borderMatch of borderMatches) {
        patterns.push({
          pattern: 'border',
          file,
          line: lineNum + 1,
          className: borderMatch[0],
          recommended: PATTERNS.border.recommended,
          reason: PATTERNS.border.reason,
        });
      }

      // Check shadow
      const shadowMatches = className.matchAll(PATTERNS.shadow.regex);
      for (const shadowMatch of shadowMatches) {
        patterns.push({
          pattern: 'shadow',
          file,
          line: lineNum + 1,
          className: shadowMatch[0],
          recommended: PATTERNS.shadow.recommended,
          reason: PATTERNS.shadow.reason,
        });
      }

      // Check position
      const positionMatches = className.matchAll(PATTERNS.position.regex);
      for (const positionMatch of positionMatches) {
        patterns.push({
          pattern: 'position',
          file,
          line: lineNum + 1,
          className: positionMatch[0],
          recommended: PATTERNS.position.recommended,
          reason: PATTERNS.position.reason,
        });
      }

      // Check overflow
      const overflowMatches = className.matchAll(PATTERNS.overflow.regex);
      for (const overflowMatch of overflowMatches) {
        patterns.push({
          pattern: 'overflow',
          file,
          line: lineNum + 1,
          className: overflowMatch[0],
          recommended: PATTERNS.overflow.recommended,
          reason: PATTERNS.overflow.reason,
        });
      }

      // Check z-index
      const zIndexMatches = className.matchAll(PATTERNS.zIndex.regex);
      for (const zIndexMatch of zIndexMatches) {
        patterns.push({
          pattern: 'zIndex',
          file,
          line: lineNum + 1,
          className: zIndexMatch[0],
          recommended: PATTERNS.zIndex.recommended,
          reason: PATTERNS.zIndex.reason,
        });
      }

      // Check leading
      const leadingMatches = className.matchAll(PATTERNS.leading.regex);
      for (const leadingMatch of leadingMatches) {
        patterns.push({
          pattern: 'leading',
          file,
          line: lineNum + 1,
          className: leadingMatch[0],
          recommended: PATTERNS.leading.recommended,
          reason: PATTERNS.leading.reason,
        });
      }

      // Check tracking
      const trackingMatches = className.matchAll(PATTERNS.tracking.regex);
      for (const trackingMatch of trackingMatches) {
        patterns.push({
          pattern: 'tracking',
          file,
          line: lineNum + 1,
          className: trackingMatch[0],
          recommended: PATTERNS.tracking.recommended,
          reason: PATTERNS.tracking.reason,
        });
      }

      // Check truncate
      const truncateMatches = className.matchAll(PATTERNS.truncate.regex);
      for (const truncateMatch of truncateMatches) {
        patterns.push({
          pattern: 'truncate',
          file,
          line: lineNum + 1,
          className: truncateMatch[0],
          recommended: PATTERNS.truncate.recommended,
          reason: PATTERNS.truncate.reason,
        });
      }

      // Check text transform
      const textTransformMatches = className.matchAll(PATTERNS.textTransform.regex);
      for (const textTransformMatch of textTransformMatches) {
        patterns.push({
          pattern: 'textTransform',
          file,
          line: lineNum + 1,
          className: textTransformMatch[0],
          recommended: PATTERNS.textTransform.recommended,
          reason: PATTERNS.textTransform.reason,
        });
      }

      // Check max/min size
      const maxMinSizeMatches = className.matchAll(PATTERNS.maxMinSize.regex);
      for (const maxMinSizeMatch of maxMinSizeMatches) {
        patterns.push({
          pattern: 'maxMinSize',
          file,
          line: lineNum + 1,
          className: maxMinSizeMatch[0],
          recommended: PATTERNS.maxMinSize.recommended,
          reason: PATTERNS.maxMinSize.reason,
        });
      }

      // Check cursor
      const cursorMatches = className.matchAll(PATTERNS.cursor.regex);
      for (const cursorMatch of cursorMatches) {
        patterns.push({
          pattern: 'cursor',
          file,
          line: lineNum + 1,
          className: cursorMatch[0],
          recommended: PATTERNS.cursor.recommended,
          reason: PATTERNS.cursor.reason,
        });
      }

      // Check select
      const selectMatches = className.matchAll(PATTERNS.select.regex);
      for (const selectMatch of selectMatches) {
        patterns.push({
          pattern: 'select',
          file,
          line: lineNum + 1,
          className: selectMatch[0],
          recommended: PATTERNS.select.recommended,
          reason: PATTERNS.select.reason,
        });
      }

      // Check background color (semantic)
      const bgColorMatches = className.matchAll(PATTERNS.bgColor.regex);
      for (const bgColorMatch of bgColorMatches) {
        patterns.push({
          pattern: 'bgColor',
          file,
          line: lineNum + 1,
          className: bgColorMatch[0],
          recommended: PATTERNS.bgColor.recommended,
          reason: PATTERNS.bgColor.reason,
        });
      }

      // Check text color (semantic)
      const textColorMatches = className.matchAll(PATTERNS.textColor.regex);
      for (const textColorMatch of textColorMatches) {
        patterns.push({
          pattern: 'textColor',
          file,
          line: lineNum + 1,
          className: textColorMatch[0],
          recommended: PATTERNS.textColor.recommended,
          reason: PATTERNS.textColor.reason,
        });
      }

      // Check border color (semantic)
      const borderColorMatches = className.matchAll(PATTERNS.borderColor.regex);
      for (const borderColorMatch of borderColorMatches) {
        patterns.push({
          pattern: 'borderColor',
          file,
          line: lineNum + 1,
          className: borderColorMatch[0],
          recommended: PATTERNS.borderColor.recommended,
          reason: PATTERNS.borderColor.reason,
        });
      }

      // Check transition
      const transitionMatches = className.matchAll(PATTERNS.transition.regex);
      for (const transitionMatch of transitionMatches) {
        patterns.push({
          pattern: 'transition',
          file,
          line: lineNum + 1,
          className: transitionMatch[0],
          recommended: PATTERNS.transition.recommended,
          reason: PATTERNS.transition.reason,
        });
      }

      // Check duration
      const durationMatches = className.matchAll(PATTERNS.duration.regex);
      for (const durationMatch of durationMatches) {
        patterns.push({
          pattern: 'duration',
          file,
          line: lineNum + 1,
          className: durationMatch[0],
          recommended: PATTERNS.duration.recommended,
          reason: PATTERNS.duration.reason,
        });
      }

      // Check whitespace
      const whitespaceMatches = className.matchAll(PATTERNS.whitespace.regex);
      for (const whitespaceMatch of whitespaceMatches) {
        patterns.push({
          pattern: 'whitespace',
          file,
          line: lineNum + 1,
          className: whitespaceMatch[0],
          recommended: PATTERNS.whitespace.recommended,
          reason: PATTERNS.whitespace.reason,
        });
      }

      // Check margin X
      const marginXMatches = className.matchAll(PATTERNS.marginX.regex);
      for (const marginXMatch of marginXMatches) {
        patterns.push({
          pattern: 'marginX',
          file,
          line: lineNum + 1,
          className: marginXMatch[0],
          recommended: PATTERNS.marginX.recommended,
          reason: PATTERNS.marginX.reason,
        });
      }

      // Check margin Y
      const marginYMatches = className.matchAll(PATTERNS.marginY.regex);
      for (const marginYMatch of marginYMatches) {
        patterns.push({
          pattern: 'marginY',
          file,
          line: lineNum + 1,
          className: marginYMatch[0],
          recommended: PATTERNS.marginY.recommended,
          reason: PATTERNS.marginY.reason,
        });
      }

      // Check margin Left
      const marginLeftMatches = className.matchAll(PATTERNS.marginLeft.regex);
      for (const marginLeftMatch of marginLeftMatches) {
        patterns.push({
          pattern: 'marginLeft',
          file,
          line: lineNum + 1,
          className: marginLeftMatch[0],
          recommended: PATTERNS.marginLeft.recommended,
          reason: PATTERNS.marginLeft.reason,
        });
      }

      // Check margin Right
      const marginRightMatches = className.matchAll(PATTERNS.marginRight.regex);
      for (const marginRightMatch of marginRightMatches) {
        patterns.push({
          pattern: 'marginRight',
          file,
          line: lineNum + 1,
          className: marginRightMatch[0],
          recommended: PATTERNS.marginRight.recommended,
          reason: PATTERNS.marginRight.reason,
        });
      }

      // Check position offset (top/bottom/left/right)
      const positionOffsetMatches = className.matchAll(PATTERNS.positionOffset.regex);
      for (const positionOffsetMatch of positionOffsetMatches) {
        patterns.push({
          pattern: 'positionOffset',
          file,
          line: lineNum + 1,
          className: positionOffsetMatch[0],
          recommended: PATTERNS.positionOffset.recommended,
          reason: PATTERNS.positionOffset.reason,
        });
      }

      // Check border variant
      const borderVariantMatches = className.matchAll(PATTERNS.borderVariant.regex);
      for (const borderVariantMatch of borderVariantMatches) {
        patterns.push({
          pattern: 'borderVariant',
          file,
          line: lineNum + 1,
          className: borderVariantMatch[0],
          recommended: PATTERNS.borderVariant.recommended,
          reason: PATTERNS.borderVariant.reason,
        });
      }

      // Check display (but not flex-* patterns)
      const displayMatches = className.matchAll(PATTERNS.display.regex);
      for (const displayMatch of displayMatches) {
        // Skip if it's part of a flex-* pattern (already handled)
        const displayValue = displayMatch[0];
        if (displayValue === 'flex' && /\bflex-/.test(className)) {
          continue; // Skip standalone 'flex' if flex-* pattern exists
        }
        patterns.push({
          pattern: 'display',
          file,
          line: lineNum + 1,
          className: displayValue,
          recommended: PATTERNS.display.recommended,
          reason: PATTERNS.display.reason,
        });
      }

      // Check gradient
      const gradientMatches = className.matchAll(PATTERNS.gradient.regex);
      for (const gradientMatch of gradientMatches) {
        patterns.push({
          pattern: 'gradient',
          file,
          line: lineNum + 1,
          className: gradientMatch[0],
          recommended: PATTERNS.gradient.recommended,
          reason: PATTERNS.gradient.reason,
        });
      }

      // Check ring/outline
      const ringOutlineMatches = className.matchAll(PATTERNS.ringOutline.regex);
      for (const ringOutlineMatch of ringOutlineMatches) {
        patterns.push({
          pattern: 'ringOutline',
          file,
          line: lineNum + 1,
          className: ringOutlineMatch[0],
          recommended: PATTERNS.ringOutline.recommended,
          reason: PATTERNS.ringOutline.reason,
        });
      }

      // Check text decoration
      const textDecorationMatches = className.matchAll(PATTERNS.textDecoration.regex);
      for (const textDecorationMatch of textDecorationMatches) {
        patterns.push({
          pattern: 'textDecoration',
          file,
          line: lineNum + 1,
          className: textDecorationMatch[0],
          recommended: PATTERNS.textDecoration.recommended,
          reason: PATTERNS.textDecoration.reason,
        });
      }
    }
  }

  return patterns;
}

// Main analysis function
async function analyzeInlineStyles(): Promise<InlineStyleReport> {
  const tsxFiles = findTSXFiles(join(PROJECT_ROOT, 'apps/web/src'));
  
  logger.info(`Analyzing ${tsxFiles.length} TSX/TS files for inline styles...`);

  const report: InlineStyleReport = {
    marginBottom: [],
    marginTop: [],
    spaceY: [],
    flexColGap: [],
    flexCenterGap: [],
    mutedText: [],
    iconSizing: [],
    rounded: [],
    hoverBg: [],
    padding: [],
    paddingX: [],
    paddingY: [],
    paddingTop: [],
    paddingBottom: [],
    paddingLeft: [],
    paddingRight: [],
    gap: [],
    textSize: [],
    fontWeight: [],
    width: [],
    height: [],
    flex: [],
    gridCols: [],
    border: [],
    shadow: [],
    position: [],
    overflow: [],
    zIndex: [],
    leading: [],
    tracking: [],
    truncate: [],
    textTransform: [],
    maxMinSize: [],
    cursor: [],
    select: [],
    bgColor: [],
    textColor: [],
    borderColor: [],
    transition: [],
    duration: [],
    whitespace: [],
    marginX: [],
    marginY: [],
    marginLeft: [],
    marginRight: [],
    positionOffset: [],
    borderVariant: [],
    display: [],
    gradient: [],
    ringOutline: [],
    textDecoration: [],
    totalFiles: tsxFiles.length,
    totalPatterns: 0,
  };

  for (const file of tsxFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(PROJECT_ROOT, '');
      const patterns = extractClassNames(content, relativePath);

      for (const pattern of patterns) {
        switch (pattern.pattern) {
          case 'marginBottom':
            report.marginBottom.push(pattern);
            break;
          case 'marginTop':
            report.marginTop.push(pattern);
            break;
          case 'spaceY':
            report.spaceY.push(pattern);
            break;
          case 'flexColGap':
            report.flexColGap.push(pattern);
            break;
          case 'flexCenterGap':
            report.flexCenterGap.push(pattern);
            break;
          case 'mutedText':
            report.mutedText.push(pattern);
            break;
          case 'iconSizing':
            report.iconSizing.push(pattern);
            break;
          case 'rounded':
            report.rounded.push(pattern);
            break;
          case 'hoverBg':
            report.hoverBg.push(pattern);
            break;
          case 'padding':
            report.padding.push(pattern);
            break;
          case 'paddingX':
            report.paddingX.push(pattern);
            break;
          case 'paddingY':
            report.paddingY.push(pattern);
            break;
          case 'paddingTop':
            report.paddingTop.push(pattern);
            break;
          case 'paddingBottom':
            report.paddingBottom.push(pattern);
            break;
          case 'paddingLeft':
            report.paddingLeft.push(pattern);
            break;
          case 'paddingRight':
            report.paddingRight.push(pattern);
            break;
          case 'gap':
            report.gap.push(pattern);
            break;
          case 'textSize':
            report.textSize.push(pattern);
            break;
          case 'fontWeight':
            report.fontWeight.push(pattern);
            break;
          case 'width':
            report.width.push(pattern);
            break;
          case 'height':
            report.height.push(pattern);
            break;
          case 'flex':
            report.flex.push(pattern);
            break;
          case 'gridCols':
            report.gridCols.push(pattern);
            break;
          case 'border':
            report.border.push(pattern);
            break;
          case 'shadow':
            report.shadow.push(pattern);
            break;
          case 'position':
            report.position.push(pattern);
            break;
          case 'overflow':
            report.overflow.push(pattern);
            break;
          case 'zIndex':
            report.zIndex.push(pattern);
            break;
          case 'leading':
            report.leading.push(pattern);
            break;
          case 'tracking':
            report.tracking.push(pattern);
            break;
          case 'truncate':
            report.truncate.push(pattern);
            break;
          case 'textTransform':
            report.textTransform.push(pattern);
            break;
          case 'maxMinSize':
            report.maxMinSize.push(pattern);
            break;
          case 'cursor':
            report.cursor.push(pattern);
            break;
          case 'select':
            report.select.push(pattern);
            break;
          case 'bgColor':
            report.bgColor.push(pattern);
            break;
          case 'textColor':
            report.textColor.push(pattern);
            break;
          case 'borderColor':
            report.borderColor.push(pattern);
            break;
          case 'transition':
            report.transition.push(pattern);
            break;
          case 'duration':
            report.duration.push(pattern);
            break;
          case 'whitespace':
            report.whitespace.push(pattern);
            break;
          case 'marginX':
            report.marginX.push(pattern);
            break;
          case 'marginY':
            report.marginY.push(pattern);
            break;
          case 'marginLeft':
            report.marginLeft.push(pattern);
            break;
          case 'marginRight':
            report.marginRight.push(pattern);
            break;
          case 'positionOffset':
            report.positionOffset.push(pattern);
            break;
          case 'borderVariant':
            report.borderVariant.push(pattern);
            break;
          case 'display':
            report.display.push(pattern);
            break;
          case 'gradient':
            report.gradient.push(pattern);
            break;
          case 'ringOutline':
            report.ringOutline.push(pattern);
            break;
          case 'textDecoration':
            report.textDecoration.push(pattern);
            break;
        }
      }
    } catch (error) {
      logger.error(`Error analyzing ${file}`, { error });
    }
  }

  report.totalPatterns = 
    report.marginBottom.length +
    report.marginTop.length +
    report.spaceY.length +
    report.flexColGap.length +
    report.flexCenterGap.length +
    report.mutedText.length +
    report.iconSizing.length +
    report.rounded.length +
    report.hoverBg.length +
    report.padding.length +
    report.paddingX.length +
    report.paddingY.length +
    report.paddingTop.length +
    report.paddingBottom.length +
    report.paddingLeft.length +
    report.paddingRight.length +
    report.gap.length +
    report.textSize.length +
    report.fontWeight.length +
    report.width.length +
    report.height.length +
    report.flex.length +
    report.gridCols.length +
    report.border.length +
    report.shadow.length +
    report.position.length +
    report.overflow.length +
    report.zIndex.length +
    report.leading.length +
    report.tracking.length +
    report.truncate.length +
    report.textTransform.length +
    report.maxMinSize.length +
    report.cursor.length +
    report.select.length +
    report.bgColor.length +
    report.textColor.length +
    report.borderColor.length +
    report.transition.length +
    report.duration.length +
    report.whitespace.length +
    report.marginX.length +
    report.marginY.length +
    report.marginLeft.length +
    report.marginRight.length +
    report.positionOffset.length +
    report.borderVariant.length +
    report.display.length +
    report.gradient.length +
    report.ringOutline.length +
    report.textDecoration.length;

  return report;
}

// Generate markdown report
function generateReport(report: InlineStyleReport): string {
  let md = '# Inline Styles Analysis Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Files Analyzed:** ${report.totalFiles}\n`;
  md += `- **Total Patterns Found:** ${report.totalPatterns}\n\n`;

  md += `## Pattern Breakdown\n\n`;
  md += `- **marginBottom patterns:** ${report.marginBottom.length}\n`;
  md += `- **marginTop patterns:** ${report.marginTop.length}\n`;
  md += `- **spaceY patterns:** ${report.spaceY.length}\n`;
  md += `- **flex flex-col gap patterns:** ${report.flexColGap.length}\n`;
  md += `- **flex items-center gap patterns:** ${report.flexCenterGap.length}\n`;
  md += `- **text-muted-foreground patterns:** ${report.mutedText.length}\n`;
  md += `- **icon sizing patterns:** ${report.iconSizing.length}\n`;
  md += `- **rounded patterns:** ${report.rounded.length}\n`;
  md += `- **hover:bg patterns:** ${report.hoverBg.length}\n`;
  md += `- **padding patterns (p-*):** ${report.padding.length}\n`;
  md += `- **paddingX patterns (px-*):** ${report.paddingX.length}\n`;
  md += `- **paddingY patterns (py-*):** ${report.paddingY.length}\n`;
  md += `- **paddingTop patterns (pt-*):** ${report.paddingTop.length}\n`;
  md += `- **paddingBottom patterns (pb-*):** ${report.paddingBottom.length}\n`;
  md += `- **paddingLeft patterns (pl-*):** ${report.paddingLeft.length}\n`;
  md += `- **paddingRight patterns (pr-*):** ${report.paddingRight.length}\n`;
  md += `- **standalone gap patterns (gap-*):** ${report.gap.length}\n`;
  md += `- **text size patterns (text-*):** ${report.textSize.length}\n`;
  md += `- **font weight patterns (font-*):** ${report.fontWeight.length}\n`;
  md += `- **width patterns (w-*):** ${report.width.length}\n`;
  md += `- **height patterns (h-*):** ${report.height.length}\n`;
  md += `- **flex patterns (flex-*):** ${report.flex.length}\n`;
  md += `- **grid columns patterns (grid-cols-*):** ${report.gridCols.length}\n`;
  md += `- **border patterns (border):** ${report.border.length}\n`;
  md += `- **shadow patterns (shadow-*):** ${report.shadow.length}\n`;
  md += `- **position patterns (absolute, relative, etc.):** ${report.position.length}\n`;
  md += `- **overflow patterns (overflow-*):** ${report.overflow.length}\n`;
  md += `- **z-index patterns (z-*):** ${report.zIndex.length}\n`;
  md += `- **line height patterns (leading-*):** ${report.leading.length}\n`;
  md += `- **letter spacing patterns (tracking-*):** ${report.tracking.length}\n`;
  md += `- **text truncation patterns (truncate, line-clamp-*):** ${report.truncate.length}\n`;
  md += `- **text transform patterns (uppercase, lowercase, etc.):** ${report.textTransform.length}\n`;
  md += `- **max/min size patterns (max-w-*, min-w-*, etc.):** ${report.maxMinSize.length}\n`;
  md += `- **cursor patterns (cursor-*):** ${report.cursor.length}\n`;
  md += `- **select patterns (select-*):** ${report.select.length}\n`;
  md += `- **background color patterns (bg-* semantic):** ${report.bgColor.length}\n`;
  md += `- **text color patterns (text-* semantic):** ${report.textColor.length}\n`;
  md += `- **border color patterns (border-* semantic):** ${report.borderColor.length}\n`;
  md += `- **transition patterns (transition-*):** ${report.transition.length}\n`;
  md += `- **duration patterns (duration-*):** ${report.duration.length}\n`;
  md += `- **whitespace patterns (whitespace-*):** ${report.whitespace.length}\n`;
  md += `- **margin X patterns (mx-*):** ${report.marginX.length}\n`;
  md += `- **margin Y patterns (my-*):** ${report.marginY.length}\n`;
  md += `- **margin Left patterns (ml-*):** ${report.marginLeft.length}\n`;
  md += `- **margin Right patterns (mr-*):** ${report.marginRight.length}\n`;
  md += `- **position offset patterns (top-*, bottom-*, left-*, right-*):** ${report.positionOffset.length}\n`;
  md += `- **border variant patterns (border-t-*, border-b-*, etc.):** ${report.borderVariant.length}\n`;
  md += `- **display patterns (block, inline, flex, grid, etc.):** ${report.display.length}\n`;
  md += `- **gradient patterns (bg-gradient-*, from-*, via-*, to-*):** ${report.gradient.length}\n`;
  md += `- **ring/outline patterns (ring-*, outline-*):** ${report.ringOutline.length}\n`;
  md += `- **text decoration patterns (underline, line-through, etc.):** ${report.textDecoration.length}\n\n`;

  // Group by file for easier review
  const byFile = new Map<string, InlineStylePattern[]>();
  for (const category of [
    report.marginBottom,
    report.marginTop,
    report.spaceY,
    report.flexColGap,
    report.flexCenterGap,
    report.mutedText,
    report.iconSizing,
    report.rounded,
    report.hoverBg,
    report.padding,
    report.paddingX,
    report.paddingY,
    report.paddingTop,
    report.paddingBottom,
    report.paddingLeft,
    report.paddingRight,
    report.gap,
    report.textSize,
    report.fontWeight,
    report.width,
    report.height,
    report.flex,
    report.gridCols,
    report.border,
    report.shadow,
    report.position,
    report.overflow,
    report.zIndex,
    report.leading,
    report.tracking,
    report.truncate,
    report.textTransform,
    report.maxMinSize,
    report.cursor,
    report.select,
    report.bgColor,
    report.textColor,
    report.borderColor,
    report.transition,
    report.duration,
    report.whitespace,
    report.marginX,
    report.marginY,
    report.marginLeft,
    report.marginRight,
    report.positionOffset,
    report.borderVariant,
    report.display,
    report.gradient,
    report.ringOutline,
    report.textDecoration,
  ]) {
    for (const pattern of category) {
      if (!byFile.has(pattern.file)) {
        byFile.set(pattern.file, []);
      }
      byFile.get(pattern.file)!.push(pattern);
    }
  }

  md += `## Files with Inline Style Patterns\n\n`;
  for (const [file, patterns] of Array.from(byFile.entries()).sort()) {
    md += `### \`${file}\` (${patterns.length} pattern(s))\n\n`;
    for (const pattern of patterns.slice(0, 10)) { // Limit to 10 per file
      md += `- **Line ${pattern.line}:** \`${pattern.className}\`\n`;
      md += `  - Recommended: \`${pattern.recommended}\`\n`;
      md += `  - Reason: ${pattern.reason}\n`;
    }
    if (patterns.length > 10) {
      md += `  - ... and ${patterns.length - 10} more\n`;
    }
    md += `\n`;
  }

  return md;
}

// Main execution
export async function runAnalyzeInlineStyles(): Promise<void> {
  try {
    const report = await analyzeInlineStyles();
    const markdown = generateReport(report);
    
    console.log(markdown);
    
    // Write report to file
    const { writeFileSync, mkdirSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const reportPath = join(PROJECT_ROOT, '.cursor/tailwind-cleanup/inline-styles-report.md');
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, markdown, 'utf-8');
    
    logger.info(`Analysis complete! Report saved to: ${reportPath}`);
  } catch (error) {
    logger.error('Analysis failed', { error });
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalyzeInlineStyles().catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}
