// ============================================
// ESLint plugin for V2 Design System enforcement
// Flags ALL inline Tailwind patterns that have design system equivalents.
// Provides comprehensive detection for migration tracking.
//
// Rules (43 total):
// 
// HIGH CONFIDENCE (error severity):
//   prefer-icon-size: h-X w-X patterns -> iconSize
// 
// LAYOUT & POSITIONING:
//   prefer-display: flex/grid/block/hidden -> display
//   prefer-position: absolute/relative/fixed/sticky -> position
//   prefer-inset: inset-0/top-0/left-0/etc -> inset
//   prefer-width: w-full/w-auto/etc -> width
//   prefer-height: h-full/h-auto/etc -> height
//   prefer-flex-direction: flex-row/flex-col -> flexDir
//   prefer-flex-wrap: flex-wrap/flex-nowrap -> flexWrap
//   prefer-flex-grow: flex-1/shrink-0/grow -> flexGrow
//   prefer-justify: justify-center/between/etc -> justify
//   prefer-align-items: items-center/start/etc -> alignItems
//   prefer-align-self: self-center/start/etc -> self
//   prefer-overflow: overflow patterns -> overflow
// 
// SPACING:
//   prefer-padding: p/px/py patterns -> padding
//   prefer-margin-bottom: mb patterns -> marginBottom
//   prefer-margin-top: mt patterns -> marginTop
//   prefer-margin-right: mr patterns -> marginRight
//   prefer-margin-left: ml patterns -> marginLeft
//   prefer-margin-x: mx patterns -> marginX
//   prefer-margin-y: my patterns -> marginY
//   prefer-space-y: space-y patterns -> spaceY
//   prefer-space-x: space-x patterns -> spaceX
//   prefer-gap: gap patterns -> gap
// 
// TYPOGRAPHY:
//   prefer-muted-text: text-muted-foreground -> muted
//   prefer-weight: font patterns -> weight
//   prefer-leading: leading patterns -> leading
//   prefer-tracking: tracking patterns -> tracking
//   prefer-whitespace: whitespace patterns -> whitespace
//   prefer-truncate: truncate/line-clamp patterns -> truncate
//   prefer-text-align: text-left/center/right -> textAlign
// 
// COLORS:
//   prefer-text-color: text-foreground/primary/etc -> textColor
//   prefer-bg-color: bg-background/accent/etc -> bgColor
//   prefer-border-color: border-border/primary/etc -> borderColor
// 
// VISUAL EFFECTS:
//   prefer-radius: rounded patterns -> radius
//   prefer-shadow: shadow patterns -> shadow
//   prefer-z-layer: z patterns -> zLayer
//   prefer-opacity: opacity patterns -> opacityLevel
//   prefer-backdrop: backdrop-blur patterns -> backdrop
// 
// INTERACTIVE:
//   prefer-hover-bg: hover:bg patterns -> hoverBg
//   prefer-transition: transition patterns -> transition
//   prefer-cursor: cursor patterns -> cursor
//   prefer-pointer-events: pointer-events patterns -> pointerEvents
//   prefer-user-select: select-none/text/all -> userSelect
//   prefer-animate: animate patterns -> animate
// 
// MEDIA/OBJECTS:
//   prefer-object-fit: object-cover/contain/etc -> objectFit
//   prefer-object-position: object-center/top/etc -> objectPosition
// 
// LOWER CONFIDENCE (off by default):
//   prefer-text-size: text-sm/xs/lg -> size (many valid inline uses)
//   prefer-stack: flex flex-col gap -> stack (complex detection)
//   prefer-cluster: flex items-center gap -> cluster (complex detection)
//
// Located in config/tools/ to match codebase organization pattern
// ============================================

// ============================================
// Utility Functions
// ============================================

/**
 * Parse a className string into individual classes
 * @param {string} value - The className value
 * @returns {string[]} Array of individual class names
 */
function parseClassName(value) {
  if (!value) return [];
  return value
    .split(/\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Check if a pattern has a responsive prefix (sm:, md:, lg:, xl:, 2xl:)
 * @param {string} className - The class name to check
 * @returns {boolean} True if has responsive prefix
 */
function hasResponsivePrefix(className) {
  return /^(sm|md|lg|xl|2xl):/.test(className);
}

/**
 * Check if a pattern has a state prefix (hover:, focus:, active:, etc.)
 * @param {string} className - The class name to check
 * @returns {boolean} True if has state prefix
 */
function hasStatePrefix(className) {
  return /^(hover|focus|active|disabled|group-hover|peer-hover|data-\[):/.test(className);
}

/**
 * Get the design system import statement location from context
 * @param {Object} context - ESLint rule context
 * @returns {Object|null} Import node info or null
 */
function getDesignSystemImportNode(context) {
  const sourceCode = context.getSourceCode();
  const program = sourceCode.ast;

  for (const node of program.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value;
      if (source === '@heyclaude/web-runtime/design-system') {
        return node;
      }
    }
  }
  return null;
}

/**
 * Check if a specific utility is already imported from the design system
 * @param {Object} context - ESLint rule context
 * @param {string} utilityName - Name of the utility to check
 * @returns {boolean} True if utility is imported
 */
function isUtilityImported(context, utilityName) {
  const importNode = getDesignSystemImportNode(context);
  if (!importNode) return false;

  for (const specifier of importNode.specifiers) {
    if (specifier.type === 'ImportSpecifier' && specifier.imported.name === utilityName) {
      return true;
    }
  }
  return false;
}

/**
 * Get the last import statement in the file
 * @param {Object} context - ESLint rule context
 * @returns {Object|null} Last import node or null
 */
function getLastImportNode(context) {
  const sourceCode = context.getSourceCode();
  const program = sourceCode.ast;
  let lastImport = null;

  for (const node of program.body) {
    if (node.type === 'ImportDeclaration') {
      lastImport = node;
    }
  }
  return lastImport;
}

/**
 * Check if a node is inside an SVG element
 * @param {Object} node - AST node
 * @returns {boolean} True if inside SVG
 */
function isInsideSVG(node) {
  let parent = node.parent;
  while (parent) {
    if (
      parent.type === 'JSXElement' &&
      parent.openingElement &&
      parent.openingElement.name &&
      (parent.openingElement.name.name === 'svg' ||
        parent.openingElement.name.name === 'SVG' ||
        (parent.openingElement.name.type === 'JSXMemberExpression' &&
          parent.openingElement.name.property.name === 'Svg'))
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

/**
 * Extract className string value from a JSX attribute
 * @param {Object} node - JSXAttribute node
 * @returns {Object|null} { type: 'literal'|'template'|'cn', value: string, node: Object }
 */
function extractClassNameValue(node) {
  if (!node.value) return null;

  // String literal: className="..."
  if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
    return { type: 'literal', value: node.value.value, node: node.value };
  }

  // JSX Expression Container: className={...}
  if (node.value.type === 'JSXExpressionContainer') {
    const expr = node.value.expression;

    // Template literal: className={`...`}
    if (expr.type === 'TemplateLiteral') {
      // For template literals, get the raw string parts (ignoring expressions)
      const quasis = expr.quasis.map((q) => q.value.raw || q.value.cooked).join(' ');
      return { type: 'template', value: quasis, node: expr };
    }

    // String literal in expression: className={"..."}
    if (expr.type === 'Literal' && typeof expr.value === 'string') {
      return { type: 'literal', value: expr.value, node: expr };
    }

    // cn() call: className={cn(...)}
    if (
      expr.type === 'CallExpression' &&
      expr.callee &&
      expr.callee.name === 'cn'
    ) {
      // Collect string literals from cn() arguments
      const classes = [];
      for (const arg of expr.arguments) {
        if (arg.type === 'Literal' && typeof arg.value === 'string') {
          classes.push(arg.value);
        } else if (arg.type === 'TemplateLiteral') {
          const quasis = arg.quasis.map((q) => q.value.raw || q.value.cooked).join(' ');
          classes.push(quasis);
        }
      }
      return { type: 'cn', value: classes.join(' '), node: expr, arguments: expr.arguments };
    }
  }

  return null;
}

/**
 * Create a fix to add import if not present
 * @param {Object} fixer - ESLint fixer
 * @param {Object} context - ESLint rule context
 * @param {string[]} utilities - Array of utility names to import
 * @returns {Array} Array of fix operations
 */
function createImportFix(fixer, context, utilities) {
  const fixes = [];
  const existingImport = getDesignSystemImportNode(context);

  if (existingImport) {
    // Add to existing import
    const sourceCode = context.getSourceCode();
    const importText = sourceCode.getText(existingImport);

    // Find existing named imports
    const namedImports = existingImport.specifiers
      .filter((s) => s.type === 'ImportSpecifier')
      .map((s) => s.imported.name);

    // Filter out utilities already imported
    const newUtilities = utilities.filter((u) => !namedImports.includes(u));

    if (newUtilities.length > 0) {
      // Find the closing brace of the import
      const closingBrace = importText.lastIndexOf('}');
      if (closingBrace !== -1) {
        const insertPos = existingImport.range[0] + closingBrace;
        const newImportText = ', ' + newUtilities.join(', ');
        fixes.push(fixer.insertTextBeforeRange([insertPos, insertPos], newImportText));
      }
    }
  } else {
    // Create new import
    const lastImport = getLastImportNode(context);
    const importStatement = `\nimport { ${utilities.join(', ')} } from '@heyclaude/web-runtime/design-system';\n`;

    if (lastImport) {
      fixes.push(fixer.insertTextAfter(lastImport, importStatement));
    } else {
      // No imports exist, add at the beginning
      const sourceCode = context.getSourceCode();
      fixes.push(fixer.insertTextBeforeRange([0, 0], importStatement + '\n'));
    }
  }

  return fixes;
}

// ============================================
// Mappings
// ============================================

const ICON_SIZE_MAP = {
  'h-3 w-3': 'iconSize.xs',
  'h-4 w-4': 'iconSize.sm',
  'h-5 w-5': 'iconSize.md',
  'h-6 w-6': 'iconSize.lg',
  'h-7 w-7': 'iconSize.lgPlus',
  'h-8 w-8': 'iconSize.xl',
  'h-10 w-10': 'iconSize["2xl"]',
  'h-12 w-12': 'iconSize["3xl"]',
  'h-16 w-16': 'iconSize["4xl"]',
  'h-20 w-20': 'iconSize["5xl"]',
  'h-24 w-24': 'iconSize["6xl"]',
  'h-32 w-32': 'iconSize.hero',
};

const RADIUS_MAP = {
  'rounded-none': 'radius.none',
  'rounded-sm': 'radius.sm',
  'rounded': 'radius.default',
  'rounded-md': 'radius.md',
  'rounded-lg': 'radius.lg',
  'rounded-xl': 'radius.xl',
  'rounded-2xl': 'radius["2xl"]',
  'rounded-3xl': 'radius["3xl"]',
  'rounded-full': 'radius.full',
};

const MARGIN_BOTTOM_MAP = {
  'mb-0': 'marginBottom.none',
  'mb-0.5': 'marginBottom.micro',
  'mb-1': 'marginBottom.micro',
  'mb-2': 'marginBottom.tight',
  'mb-3': 'marginBottom.compact',
  'mb-4': 'marginBottom.default',
  'mb-5': 'marginBottom.comfortable',
  'mb-6': 'marginBottom.comfortable',
  'mb-8': 'marginBottom.relaxed',
  'mb-10': 'marginBottom.loose',
  'mb-12': 'marginBottom.section',
  'mb-16': 'marginBottom.hero',
};

const MARGIN_TOP_MAP = {
  'mt-0': 'marginTop.none',
  'mt-0.5': 'marginTop.micro',
  'mt-1': 'marginTop.tight',
  'mt-2': 'marginTop.compact',
  'mt-3': 'marginTop.default',
  'mt-4': 'marginTop.default',
  'mt-5': 'marginTop.comfortable',
  'mt-6': 'marginTop.comfortable',
  'mt-8': 'marginTop.relaxed',
  'mt-10': 'marginTop.loose',
  'mt-12': 'marginTop.section',
  'mt-16': 'marginTop.hero',
};

const SPACE_Y_MAP = {
  'space-y-0': 'spaceY.none',
  'space-y-0.5': 'spaceY.micro',
  'space-y-1': 'spaceY.tight',
  'space-y-2': 'spaceY.compact',
  'space-y-3': 'spaceY.default',
  'space-y-4': 'spaceY.comfortable',
  'space-y-5': 'spaceY.relaxed',
  'space-y-6': 'spaceY.relaxed',
  'space-y-8': 'spaceY.loose',
};

const SHADOW_MAP = {
  'shadow-sm': 'shadow.sm',
  'shadow': 'shadow.default',
  'shadow-md': 'shadow.md',
  'shadow-lg': 'shadow.lg',
  'shadow-xl': 'shadow.xl',
  'shadow-2xl': 'shadow["2xl"]',
  'shadow-none': 'shadow.none',
};

const Z_LAYER_MAP = {
  'z-0': 'zLayer.base',
  'z-10': 'zLayer.raised',
  'z-20': 'zLayer.above',
  'z-30': 'zLayer.sticky',
  'z-40': 'zLayer.overlay',
  'z-50': 'zLayer.modal',
};

const HOVER_BG_MAP = {
  'hover:bg-accent/5': 'hoverBg.subtle',
  'hover:bg-accent/10': 'hoverBg.default',
  'hover:bg-accent/20': 'hoverBg.strong',
  'hover:bg-muted/50': 'hoverBg.muted',
  'hover:bg-muted': 'hoverBg.mutedSolid',
};

const TRANSITION_MAP = {
  'transition': 'transition.default',
  'transition-all': 'transition.all',
  'transition-colors': 'transition.colors',
  'transition-opacity': 'transition.opacity',
  'transition-transform': 'transition.transform',
  'transition-none': 'transition.none',
};

const MUTED_TEXT_MAP = {
  'text-muted-foreground': 'muted.default',
};

const TEXT_SIZE_MAP = {
  'text-xs': 'size.xs',
  'text-sm': 'size.sm',
  'text-base': 'size.base',
  'text-lg': 'size.lg',
  'text-xl': 'size.xl',
  'text-2xl': 'size["2xl"]',
  'text-3xl': 'size["3xl"]',
  'text-4xl': 'size["4xl"]',
  'text-5xl': 'size["5xl"]',
  'text-6xl': 'size["6xl"]',
};

// Additional Pattern Mappings

const CURSOR_MAP = {
  'cursor-default': 'cursor.default',
  'cursor-pointer': 'cursor.pointer',
  'cursor-move': 'cursor.move',
  'cursor-text': 'cursor.text',
  'cursor-wait': 'cursor.wait',
  'cursor-not-allowed': 'cursor.notAllowed',
  'cursor-grab': 'cursor.grab',
  'cursor-grabbing': 'cursor.grabbing',
  'cursor-help': 'cursor.help',
  'cursor-none': 'cursor.none',
};

const OPACITY_MAP = {
  'opacity-0': 'opacityLevel[0]',
  'opacity-5': 'opacityLevel[5]',
  'opacity-10': 'opacityLevel[10]',
  'opacity-20': 'opacityLevel[20]',
  'opacity-30': 'opacityLevel[30]',
  'opacity-40': 'opacityLevel[40]',
  'opacity-50': 'opacityLevel[50]',
  'opacity-60': 'opacityLevel[60]',
  'opacity-70': 'opacityLevel[70]',
  'opacity-80': 'opacityLevel[80]',
  'opacity-90': 'opacityLevel[90]',
  'opacity-95': 'opacityLevel[95]',
  'opacity-100': 'opacityLevel[100]',
};

const OVERFLOW_MAP = {
  'overflow-auto': 'overflow.auto',
  'overflow-hidden': 'overflow.hidden',
  'overflow-clip': 'overflow.clip',
  'overflow-visible': 'overflow.visible',
  'overflow-scroll': 'overflow.scroll',
  'overflow-x-auto': 'overflow.xAuto',
  'overflow-x-hidden': 'overflow.xHidden',
  'overflow-y-auto': 'overflow.yAuto',
  'overflow-y-hidden': 'overflow.yHidden',
};

const LEADING_MAP = {
  'leading-none': 'leading.none',
  'leading-tight': 'leading.tight',
  'leading-snug': 'leading.snug',
  'leading-normal': 'leading.normal',
  'leading-relaxed': 'leading.relaxed',
  'leading-loose': 'leading.loose',
};

const TRACKING_MAP = {
  'tracking-tighter': 'tracking.tighter',
  'tracking-tight': 'tracking.tight',
  'tracking-normal': 'tracking.normal',
  'tracking-wide': 'tracking.wide',
  'tracking-wider': 'tracking.wider',
  'tracking-widest': 'tracking.widest',
};

const WHITESPACE_MAP = {
  'whitespace-normal': 'whitespace.normal',
  'whitespace-nowrap': 'whitespace.nowrap',
  'whitespace-pre': 'whitespace.pre',
  'whitespace-pre-line': 'whitespace.preLine',
  'whitespace-pre-wrap': 'whitespace.preWrap',
  'break-all': 'whitespace.breakAll',
  'break-words': 'whitespace.breakWords',
};

const TRUNCATE_MAP = {
  'truncate': 'truncate.single',
  'line-clamp-2': 'truncate.lines2',
  'line-clamp-3': 'truncate.lines3',
  'line-clamp-4': 'truncate.lines4',
};

const ANIMATE_MAP = {
  'animate-spin': 'animate.spin',
  'animate-pulse': 'animate.pulse',
  'animate-bounce': 'animate.bounce',
  'animate-ping': 'animate.ping',
};

const WEIGHT_MAP = {
  'font-light': 'weight.light',
  'font-normal': 'weight.normal',
  'font-medium': 'weight.medium',
  'font-semibold': 'weight.semibold',
  'font-bold': 'weight.bold',
};

const BACKDROP_MAP = {
  'backdrop-blur-none': 'backdrop.none',
  'backdrop-blur-sm': 'backdrop.sm',
  'backdrop-blur': 'backdrop.default',
  'backdrop-blur-md': 'backdrop.md',
  'backdrop-blur-lg': 'backdrop.lg',
  'backdrop-blur-xl': 'backdrop.xl',
  'backdrop-blur-2xl': 'backdrop["2xl"]',
  'backdrop-blur-3xl': 'backdrop["3xl"]',
};

const POINTER_EVENTS_MAP = {
  'pointer-events-none': 'pointerEvents.none',
  'pointer-events-auto': 'pointerEvents.auto',
};

const POSITION_MAP = {
  'static': 'position.static',
  'fixed': 'position.fixed',
  'absolute': 'position.absolute',
  'relative': 'position.relative',
  'sticky': 'position.sticky',
};

const OBJECT_FIT_MAP = {
  'object-contain': 'objectFit.contain',
  'object-cover': 'objectFit.cover',
  'object-fill': 'objectFit.fill',
  'object-none': 'objectFit.none',
  'object-scale-down': 'objectFit.scaleDown',
};

// ============================================
// Extended Pattern Mappings for Full Coverage
// ============================================

const DISPLAY_MAP = {
  'block': 'display.block',
  'inline-block': 'display.inlineBlock',
  'inline': 'display.inline',
  'flex': 'display.flex',
  'inline-flex': 'display.inlineFlex',
  'grid': 'display.grid',
  'inline-grid': 'display.inlineGrid',
  'hidden': 'display.hidden',
  'contents': 'display.contents',
};

const WIDTH_MAP = {
  'w-auto': 'width.auto',
  'w-full': 'width.full',
  'w-screen': 'width.screen',
  'w-min': 'width.min',
  'w-max': 'width.max',
  'w-fit': 'width.fit',
  'w-1/2': 'width.half',
  'w-1/3': 'width.third',
  'w-2/3': 'width.twoThirds',
  'w-1/4': 'width.quarter',
  'w-3/4': 'width.threeQuarters',
};

const HEIGHT_MAP = {
  'h-auto': 'height.auto',
  'h-full': 'height.full',
  'h-screen': 'height.screen',
  'h-svh': 'height.svh',
  'h-dvh': 'height.dvh',
  'h-min': 'height.min',
  'h-max': 'height.max',
  'h-fit': 'height.fit',
};

const PADDING_MAP = {
  'p-0': 'padding.none',
  'p-0.5': 'padding.hair',
  'p-1': 'padding.micro',
  'p-1.5': 'padding.snug',
  'p-2': 'padding.tight',
  'p-2.5': 'padding.between',
  'p-3': 'padding.compact',
  'p-4': 'padding.default',
  'p-5': 'padding.medium',
  'p-6': 'padding.comfortable',
  'p-8': 'padding.relaxed',
  'p-10': 'padding.spacious',
  'p-12': 'padding.section',
  'p-16': 'padding.hero',
  'px-0': 'padding.xNone',
  'px-0.5': 'padding.xHair',
  'px-1': 'padding.xMicro',
  'px-1.5': 'padding.xSnug',
  'px-2': 'padding.xTight',
  'px-3': 'padding.xCompact',
  'px-4': 'padding.xDefault',
  'px-5': 'padding.xMedium',
  'px-6': 'padding.xComfortable',
  'px-8': 'padding.xRelaxed',
  'px-12': 'padding.xSpacious',
  'px-16': 'padding.xHero',
  'py-0': 'padding.yNone',
  'py-0.5': 'padding.yHair',
  'py-1': 'padding.yMicro',
  'py-1.5': 'padding.ySnug',
  'py-2': 'padding.yTight',
  'py-3': 'padding.yCompact',
  'py-4': 'padding.yDefault',
  'py-5': 'padding.yMedium',
  'py-6': 'padding.yComfortable',
  'py-8': 'padding.yRelaxed',
  'py-10': 'padding.ySpacious',
  'py-12': 'padding.ySection',
  'py-14': 'padding.yLargish',
  'py-16': 'padding.yHero',
  'py-20': 'padding.yLarge',
  'py-24': 'padding.yXl',
};

const GAP_MAP = {
  'gap-0': 'gap.none',
  'gap-0.5': 'gap.micro',
  'gap-1': 'gap.tight',
  'gap-1.5': 'gap.snug',
  'gap-2': 'gap.compact',
  'gap-3': 'gap.default',
  'gap-4': 'gap.comfortable',
  'gap-6': 'gap.relaxed',
  'gap-8': 'gap.loose',
  'gap-10': 'gap.section',
  'gap-12': 'gap.hero',
  'gap-16': 'gap.extra',
};

const FLEX_DIR_MAP = {
  'flex-row': 'flexDir.row',
  'flex-row-reverse': 'flexDir.rowReverse',
  'flex-col': 'flexDir.col',
  'flex-col-reverse': 'flexDir.colReverse',
};

const FLEX_WRAP_MAP = {
  'flex-wrap': 'flexWrap.wrap',
  'flex-wrap-reverse': 'flexWrap.wrapReverse',
  'flex-nowrap': 'flexWrap.nowrap',
};

const FLEX_GROW_MAP = {
  'grow': 'flexGrow.grow',
  'grow-0': 'flexGrow.grow0',
  'shrink': 'flexGrow.shrink',
  'shrink-0': 'flexGrow.shrink0',
  'flex-1': 'flexGrow["1"]',
  'flex-auto': 'flexGrow.auto',
  'flex-initial': 'flexGrow.initial',
  'flex-none': 'flexGrow.none',
};

const JUSTIFY_MAP = {
  'justify-start': 'justify.start',
  'justify-end': 'justify.end',
  'justify-center': 'justify.center',
  'justify-between': 'justify.between',
  'justify-around': 'justify.around',
  'justify-evenly': 'justify.evenly',
  'justify-stretch': 'justify.stretch',
};

const ALIGN_ITEMS_MAP = {
  'items-start': 'alignItems.start',
  'items-end': 'alignItems.end',
  'items-center': 'alignItems.center',
  'items-baseline': 'alignItems.baseline',
  'items-stretch': 'alignItems.stretch',
};

const ALIGN_SELF_MAP = {
  'self-auto': 'self.auto',
  'self-start': 'self.start',
  'self-end': 'self.end',
  'self-center': 'self.center',
  'self-stretch': 'self.stretch',
  'self-baseline': 'self.baseline',
};

const TEXT_COLOR_MAP = {
  'text-foreground': 'textColor.foreground',
  'text-primary': 'textColor.primary',
  'text-accent': 'textColor.accent',
  'text-destructive': 'textColor.destructive',
  'text-white': 'textColor.white',
  'text-black': 'textColor.black',
  'text-transparent': 'textColor.transparent',
  'text-primary-foreground': 'textColor.primaryForeground',
  'text-accent-foreground': 'textColor.accentForeground',
};

const BG_COLOR_MAP = {
  'bg-background': 'bgColor.background',
  'bg-card': 'bgColor.card',
  'bg-muted': 'bgColor.muted',
  'bg-primary': 'bgColor.primary',
  'bg-accent': 'bgColor.accent',
  'bg-destructive': 'bgColor.destructive',
  'bg-transparent': 'bgColor.transparent',
  'bg-white': 'bgColor.white',
  'bg-black': 'bgColor.black',
};

const BORDER_COLOR_MAP = {
  'border-border': 'borderColor.border',
  'border-primary': 'borderColor.primary',
  'border-accent': 'borderColor.accent',
  'border-input': 'borderColor.input',
  'border-destructive': 'borderColor.destructive',
  'border-transparent': 'borderColor.transparent',
};

const USER_SELECT_MAP = {
  'select-none': 'userSelect.none',
  'select-text': 'userSelect.text',
  'select-all': 'userSelect.all',
  'select-auto': 'userSelect.auto',
};

const TEXT_ALIGN_MAP = {
  'text-left': 'textAlign.left',
  'text-center': 'textAlign.center',
  'text-right': 'textAlign.right',
  'text-justify': 'textAlign.justify',
  'text-start': 'textAlign.start',
  'text-end': 'textAlign.end',
};

const SPACE_X_MAP = {
  'space-x-0': 'spaceX.none',
  'space-x-1': 'spaceX.tight',
  'space-x-2': 'spaceX.compact',
  'space-x-3': 'spaceX.default',
  'space-x-4': 'spaceX.comfortable',
  'space-x-6': 'spaceX.relaxed',
};

const MARGIN_RIGHT_MAP = {
  'mr-0': 'marginRight.none',
  'mr-auto': 'marginRight.auto',
  'mr-0.5': 'marginRight.micro',
  'mr-1': 'marginRight.tight',
  'mr-1.5': 'marginRight.snug',
  'mr-2': 'marginRight.compact',
  'mr-3': 'marginRight.default',
  'mr-4': 'marginRight.comfortable',
  'mr-6': 'marginRight.relaxed',
  'mr-8': 'marginRight.loose',
};

const MARGIN_LEFT_MAP = {
  'ml-0': 'marginLeft.none',
  'ml-auto': 'marginLeft.auto',
  'ml-0.5': 'marginLeft.micro',
  'ml-1': 'marginLeft.tight',
  'ml-1.5': 'marginLeft.snug',
  'ml-2': 'marginLeft.compact',
  'ml-3': 'marginLeft.default',
  'ml-4': 'marginLeft.comfortable',
  'ml-6': 'marginLeft.relaxed',
  'ml-8': 'marginLeft.loose',
};

const MARGIN_X_MAP = {
  'mx-0': 'marginX.none',
  'mx-auto': 'marginX.auto',
  'mx-1': 'marginX.tight',
  'mx-2': 'marginX.compact',
  'mx-3': 'marginX.default',
  'mx-4': 'marginX.comfortable',
  'mx-6': 'marginX.relaxed',
  'mx-8': 'marginX.loose',
};

const MARGIN_Y_MAP = {
  'my-0': 'marginY.none',
  'my-auto': 'marginY.auto',
  'my-1': 'marginY.tight',
  'my-2': 'marginY.compact',
  'my-3': 'marginY.default',
  'my-4': 'marginY.comfortable',
  'my-6': 'marginY.relaxed',
  'my-8': 'marginY.loose',
};

const INSET_MAP = {
  'inset-0': 'inset["0"]',
  'inset-auto': 'inset.auto',
  'inset-x-0': 'inset.x0',
  'inset-y-0': 'inset.y0',
  'top-0': 'inset.top0',
  'right-0': 'inset.right0',
  'bottom-0': 'inset.bottom0',
  'left-0': 'inset.left0',
};

const OBJECT_POSITION_MAP = {
  'object-bottom': 'objectPosition.bottom',
  'object-center': 'objectPosition.center',
  'object-left': 'objectPosition.left',
  'object-left-bottom': 'objectPosition.leftBottom',
  'object-left-top': 'objectPosition.leftTop',
  'object-right': 'objectPosition.right',
  'object-right-bottom': 'objectPosition.rightBottom',
  'object-right-top': 'objectPosition.rightTop',
  'object-top': 'objectPosition.top',
};

const STACK_GAP_MAP = {
  0: 'stack.none',
  1: 'stack.tight',
  2: 'stack.compact',
  3: 'stack.default',
  4: 'stack.comfortable',
  5: 'stack.relaxed',
  6: 'stack.relaxed',
  8: 'stack.loose',
};

const CLUSTER_GAP_MAP = {
  0: 'cluster.none',
  1: 'cluster.tight',
  2: 'cluster.compact',
  3: 'cluster.default',
  4: 'cluster.comfortable',
  5: 'cluster.relaxed',
  6: 'cluster.relaxed',
  8: 'cluster.loose',
};

// ============================================
// Rule Implementations
// ============================================

export default {
  rules: {
    /**
     * Rule: prefer-icon-size
     * Detects h-X w-X patterns and suggests iconSize.* utilities
     */
    'prefer-icon-size': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer iconSize.* utilities over inline h-X w-X patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferIconSize:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            // Skip SVG elements (dimensions are literal)
            if (isInsideSVG(node)) return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            // Find h-X and w-X patterns
            const heightClasses = classes.filter((c) => /^h-\d+$/.test(c) && !hasResponsivePrefix(c));
            const widthClasses = classes.filter((c) => /^w-\d+$/.test(c) && !hasResponsivePrefix(c));

            for (const hClass of heightClasses) {
              const hNum = hClass.replace('h-', '');
              const wClass = `w-${hNum}`;

              if (widthClasses.includes(wClass)) {
                const pattern = `${hClass} ${wClass}`;
                const replacement = ICON_SIZE_MAP[pattern];

                if (replacement) {
                  context.report({
                    node,
                    messageId: 'preferIconSize',
                    data: { pattern, replacement },
                    fix(fixer) {
                      // Only fix for simple string literals for now
                      // Template literals and cn() calls are more complex
                      if (classNameInfo.type === 'literal') {
                        const remainingClasses = classes.filter(
                          (c) => c !== hClass && c !== wClass
                        );
                        const utilityName = replacement.split('.')[0];

                        const fixes = [];

                        // Add import if needed
                        if (!isUtilityImported(context, utilityName)) {
                          fixes.push(...createImportFix(fixer, context, [utilityName]));
                        }

                        // Replace className value
                        let newValue;
                        if (remainingClasses.length > 0) {
                          newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                        } else {
                          newValue = `{${replacement}}`;
                        }

                        fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                        return fixes;
                      }
                      return null;
                    },
                  });
                }
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-radius
     * Detects rounded-* patterns and suggests radius.* utilities
     */
    'prefer-radius': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer radius.* utilities over inline rounded-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferRadius:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              // Skip responsive/state prefixed classes
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              // Skip directional patterns (rounded-t-*, rounded-b-*, etc.)
              if (/^rounded-[tbrl]-/.test(className)) continue;
              if (/^rounded-t[lbr]-/.test(className)) continue;
              if (/^rounded-b[lr]-/.test(className)) continue;

              const replacement = RADIUS_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferRadius',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-margin-bottom
     * Detects mb-* patterns and suggests marginBottom.* utilities
     */
    'prefer-margin-bottom': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer marginBottom.* utilities over inline mb-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferMarginBottom:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = MARGIN_BOTTOM_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferMarginBottom',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-margin-top
     * Detects mt-* patterns and suggests marginTop.* utilities
     */
    'prefer-margin-top': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer marginTop.* utilities over inline mt-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferMarginTop:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = MARGIN_TOP_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferMarginTop',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-space-y
     * Detects space-y-* patterns and suggests spaceY.* utilities
     */
    'prefer-space-y': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer spaceY.* utilities over inline space-y-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferSpaceY:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = SPACE_Y_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferSpaceY',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-shadow
     * Detects shadow-* patterns and suggests shadow.* utilities
     */
    'prefer-shadow': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer shadow.* utilities over inline shadow-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferShadow:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = SHADOW_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferShadow',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-z-layer
     * Detects z-* patterns and suggests zLayer.* utilities
     */
    'prefer-z-layer': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer zLayer.* utilities over inline z-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferZLayer:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = Z_LAYER_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferZLayer',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-hover-bg
     * Detects hover:bg-* patterns and suggests hoverBg.* utilities
     */
    'prefer-hover-bg': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer hoverBg.* utilities over inline hover:bg-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferHoverBg:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              // Skip responsive prefixed hover patterns (sm:hover:bg-*)
              if (/^(sm|md|lg|xl|2xl):hover:/.test(className)) continue;

              const replacement = HOVER_BG_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferHoverBg',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-transition
     * Detects transition-* patterns and suggests transition.* utilities
     */
    'prefer-transition': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer transition.* utilities over inline transition-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferTransition:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = TRANSITION_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferTransition',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-muted-text
     * Detects text-muted-foreground patterns and suggests muted.* utilities
     */
    'prefer-muted-text': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer muted.* utilities over inline text-muted-foreground patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferMutedText:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = MUTED_TEXT_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferMutedText',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-text-size
     * Detects text-sm/xs/lg patterns and suggests size.* utilities
     * Note: Lower confidence - disabled by default due to many valid inline uses
     */
    'prefer-text-size': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer size.* utilities over inline text-* size patterns',
          category: 'Design System',
          recommended: false,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferTextSize:
            'Consider using design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = TEXT_SIZE_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferTextSize',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-stack
     * Detects flex flex-col gap-* patterns and suggests stack.* utilities
     * Note: Lower confidence - off by default due to complex detection
     */
    'prefer-stack': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer stack.* utilities over inline flex flex-col gap-* patterns',
          category: 'Design System',
          recommended: false,
        },
        fixable: null, // Not auto-fixable due to complexity
        schema: [],
        messages: {
          preferStack:
            'Consider using design system utility {{replacement}} instead of "flex flex-col {{gapClass}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            const hasFlex = classes.includes('flex');
            const hasFlexCol = classes.includes('flex-col');

            if (!hasFlex || !hasFlexCol) return;

            // Find gap class
            const gapClass = classes.find((c) => /^gap-\d+$/.test(c));
            if (!gapClass) return;

            const gapValue = parseInt(gapClass.replace('gap-', ''), 10);
            const replacement = STACK_GAP_MAP[gapValue];

            if (replacement) {
              context.report({
                node,
                messageId: 'preferStack',
                data: { replacement, gapClass },
              });
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-cluster
     * Detects flex items-center gap-* patterns and suggests cluster.* utilities
     * Note: Lower confidence - off by default due to complex detection
     */
    'prefer-cluster': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer cluster.* utilities over inline flex items-center gap-* patterns',
          category: 'Design System',
          recommended: false,
        },
        fixable: null, // Not auto-fixable due to complexity
        schema: [],
        messages: {
          preferCluster:
            'Consider using design system utility {{replacement}} instead of "flex items-center {{gapClass}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            const hasFlex = classes.includes('flex');
            const hasItemsCenter = classes.includes('items-center');

            if (!hasFlex || !hasItemsCenter) return;

            // Find gap class
            const gapClass = classes.find((c) => /^gap-\d+$/.test(c));
            if (!gapClass) return;

            const gapValue = parseInt(gapClass.replace('gap-', ''), 10);
            const replacement = CLUSTER_GAP_MAP[gapValue];

            if (replacement) {
              context.report({
                node,
                messageId: 'preferCluster',
                data: { replacement, gapClass },
              });
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-cursor
     * Detects cursor-* patterns and suggests cursor.* utilities
     */
    'prefer-cursor': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer cursor.* utilities over inline cursor-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferCursor:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = CURSOR_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferCursor',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-opacity
     * Detects opacity-* patterns and suggests opacityLevel[*] utilities
     */
    'prefer-opacity': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer opacityLevel[*] utilities over inline opacity-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferOpacity:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = OPACITY_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferOpacity',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = 'opacityLevel';

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-overflow
     * Detects overflow-* patterns and suggests overflow.* utilities
     */
    'prefer-overflow': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer overflow.* utilities over inline overflow-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferOverflow:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = OVERFLOW_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferOverflow',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-leading
     * Detects leading-* patterns and suggests leading.* utilities
     */
    'prefer-leading': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer leading.* utilities over inline leading-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferLeading:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = LEADING_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferLeading',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-tracking
     * Detects tracking-* patterns and suggests tracking.* utilities
     */
    'prefer-tracking': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer tracking.* utilities over inline tracking-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferTracking:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = TRACKING_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferTracking',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-whitespace
     * Detects whitespace-* patterns and suggests whitespace.* utilities
     */
    'prefer-whitespace': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer whitespace.* utilities over inline whitespace-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferWhitespace:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = WHITESPACE_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferWhitespace',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-truncate
     * Detects truncate and line-clamp-* patterns and suggests truncate.* utilities
     */
    'prefer-truncate': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer truncate.* utilities over inline truncate/line-clamp-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferTruncate:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = TRUNCATE_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferTruncate',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-animate
     * Detects animate-* patterns and suggests animate.* utilities
     */
    'prefer-animate': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer animate.* utilities over inline animate-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferAnimate:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = ANIMATE_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferAnimate',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-weight
     * Detects font-* weight patterns and suggests weight.* utilities
     */
    'prefer-weight': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer weight.* utilities over inline font-* weight patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferWeight:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = WEIGHT_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferWeight',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-backdrop
     * Detects backdrop-blur-* patterns and suggests backdrop.* utilities
     */
    'prefer-backdrop': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer backdrop.* utilities over inline backdrop-blur-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferBackdrop:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = BACKDROP_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferBackdrop',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-pointer-events
     * Detects pointer-events-* patterns and suggests pointerEvents.* utilities
     */
    'prefer-pointer-events': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer pointerEvents.* utilities over inline pointer-events-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: 'code',
        schema: [],
        messages: {
          preferPointerEvents:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;

            const classes = parseClassName(classNameInfo.value);

            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;

              const replacement = POINTER_EVENTS_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferPointerEvents',
                  data: { pattern: className, replacement },
                  fix(fixer) {
                    if (classNameInfo.type === 'literal') {
                      const remainingClasses = classes.filter((c) => c !== className);
                      const utilityName = replacement.split('.')[0];

                      const fixes = [];

                      if (!isUtilityImported(context, utilityName)) {
                        fixes.push(...createImportFix(fixer, context, [utilityName]));
                      }

                      let newValue;
                      if (remainingClasses.length > 0) {
                        newValue = `{\`\${${replacement}} ${remainingClasses.join(' ')}\`}`;
                      } else {
                        newValue = `{${replacement}}`;
                      }

                      fixes.push(fixer.replaceText(classNameInfo.node, newValue));
                      return fixes;
                    }
                    return null;
                  },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-object-fit
     * Detects object-* patterns and suggests objectFit.* utilities
     */
    'prefer-object-fit': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer objectFit.* utilities over inline object-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferObjectFit:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = OBJECT_FIT_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferObjectFit',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    // ============================================
    // Extended Rules for Full Coverage
    // ============================================

    /**
     * Rule: prefer-display
     * Detects display patterns (flex, grid, block, hidden, etc.)
     */
    'prefer-display': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer display.* utilities over inline display patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferDisplay:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = DISPLAY_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferDisplay',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-width
     * Detects width patterns (w-full, w-auto, etc.)
     */
    'prefer-width': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer width.* utilities over inline w-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferWidth:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = WIDTH_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferWidth',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-height
     * Detects height patterns (h-full, h-auto, etc.)
     */
    'prefer-height': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer height.* utilities over inline h-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferHeight:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = HEIGHT_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferHeight',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-padding
     * Detects padding patterns (p-*, px-*, py-*)
     */
    'prefer-padding': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer padding.* utilities over inline p-*/px-*/py-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferPadding:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = PADDING_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferPadding',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-gap
     * Detects gap patterns (gap-*)
     */
    'prefer-gap': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer gap.* utilities over inline gap-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferGap:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = GAP_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferGap',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-flex-direction
     * Detects flex direction patterns (flex-row, flex-col, etc.)
     */
    'prefer-flex-direction': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer flexDir.* utilities over inline flex-row/flex-col patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferFlexDirection:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = FLEX_DIR_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferFlexDirection',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-flex-wrap
     * Detects flex wrap patterns
     */
    'prefer-flex-wrap': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer flexWrap.* utilities over inline flex-wrap patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferFlexWrap:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = FLEX_WRAP_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferFlexWrap',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-flex-grow
     * Detects flex grow/shrink patterns (flex-1, shrink-0, etc.)
     */
    'prefer-flex-grow': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer flexGrow.* utilities over inline flex-1/shrink-0 patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferFlexGrow:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = FLEX_GROW_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferFlexGrow',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-justify
     * Detects justify-content patterns
     */
    'prefer-justify': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer justify.* utilities over inline justify-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferJustify:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = JUSTIFY_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferJustify',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-align-items
     * Detects align-items patterns (items-center, items-start, etc.)
     */
    'prefer-align-items': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer alignItems.* utilities over inline items-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferAlignItems:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = ALIGN_ITEMS_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferAlignItems',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-align-self
     * Detects align-self patterns
     */
    'prefer-align-self': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer self.* utilities over inline self-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferAlignSelf:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = ALIGN_SELF_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferAlignSelf',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-text-color
     * Detects semantic text color patterns
     */
    'prefer-text-color': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer textColor.* utilities over inline text-* color patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferTextColor:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = TEXT_COLOR_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferTextColor',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-bg-color
     * Detects semantic background color patterns
     */
    'prefer-bg-color': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer bgColor.* utilities over inline bg-* color patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferBgColor:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = BG_COLOR_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferBgColor',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-border-color
     * Detects semantic border color patterns
     */
    'prefer-border-color': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer borderColor.* utilities over inline border-* color patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferBorderColor:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = BORDER_COLOR_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferBorderColor',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-user-select
     * Detects user select patterns
     */
    'prefer-user-select': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer userSelect.* utilities over inline select-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferUserSelect:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = USER_SELECT_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferUserSelect',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-text-align
     * Detects text alignment patterns
     */
    'prefer-text-align': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer textAlign.* utilities over inline text-left/center/right patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferTextAlign:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = TEXT_ALIGN_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferTextAlign',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-space-x
     * Detects horizontal spacing patterns
     */
    'prefer-space-x': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer spaceX.* utilities over inline space-x-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferSpaceX:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = SPACE_X_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferSpaceX',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-margin-right
     * Detects margin-right patterns
     */
    'prefer-margin-right': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer marginRight.* utilities over inline mr-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferMarginRight:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = MARGIN_RIGHT_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferMarginRight',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-margin-left
     * Detects margin-left patterns
     */
    'prefer-margin-left': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer marginLeft.* utilities over inline ml-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferMarginLeft:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = MARGIN_LEFT_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferMarginLeft',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-margin-x
     * Detects horizontal margin patterns
     */
    'prefer-margin-x': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer marginX.* utilities over inline mx-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferMarginX:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = MARGIN_X_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferMarginX',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-margin-y
     * Detects vertical margin patterns
     */
    'prefer-margin-y': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer marginY.* utilities over inline my-* patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferMarginY:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = MARGIN_Y_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferMarginY',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-position
     * Detects position patterns (absolute, relative, fixed, sticky)
     */
    'prefer-position': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer position.* utilities over inline position patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferPosition:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = POSITION_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferPosition',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-inset
     * Detects inset/position patterns (top-0, left-0, inset-0, etc.)
     */
    'prefer-inset': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer inset.* utilities over inline inset/top/left/right/bottom patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferInset:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = INSET_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferInset',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Rule: prefer-object-position
     * Detects object position patterns
     */
    'prefer-object-position': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer objectPosition.* utilities over inline object-* position patterns',
          category: 'Design System',
          recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
          preferObjectPosition:
            'Use design system utility {{replacement}} instead of inline "{{pattern}}"',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;
            const classNameInfo = extractClassNameValue(node);
            if (!classNameInfo) return;
            const classes = parseClassName(classNameInfo.value);
            for (const className of classes) {
              if (hasResponsivePrefix(className) || hasStatePrefix(className)) continue;
              const replacement = OBJECT_POSITION_MAP[className];
              if (replacement) {
                context.report({
                  node,
                  messageId: 'preferObjectPosition',
                  data: { pattern: className, replacement },
                });
              }
            }
          },
        };
      },
    },
  },
};
