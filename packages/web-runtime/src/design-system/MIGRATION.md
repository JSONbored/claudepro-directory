# Design System Migration Guide

This guide explains how to migrate from the legacy `UI_CLASSES` and scattered constants to the new unified design system.

## Quick Start

```tsx
// ❌ OLD - Multiple imports, monolithic object
import { UI_CLASSES, DIMENSIONS, STATE_PATTERNS } from '@heyclaude/web-runtime/ui';

// ✅ NEW - Targeted imports, composable utilities
import { stack, cluster, card, button } from '@heyclaude/web-runtime/design-system/styles';
import { colors, spacing, animation } from '@heyclaude/web-runtime/design-system/tokens';
```

## File Structure

```
packages/web-runtime/src/design-system/
├── index.ts                 # Main entry point
├── tokens.ts                # All design values (colors, spacing, etc.)
├── MIGRATION.md             # This file
└── styles/
    ├── index.ts             # Re-exports all style utilities
    ├── layout.ts            # stack, cluster, grid, container, spaceY, spaceX
    ├── typography.ts        # heading, body, label, muted
    ├── cards.ts             # card, cardPadding, cardHover
    ├── forms.ts             # input, formLabel, formButton
    ├── buttons.ts           # button, buttonSize, actionButton
    ├── badges.ts            # statusBadge, categoryBadge, etc.
    ├── icons.ts             # iconSize, iconColor, iconWrapper
    ├── interactive.ts       # hoverBg, focusRing, transition
    ├── position.ts          # absolute, fixed, sticky, overflow
    ├── radius.ts            # radius, radiusTop, radiusBottom, radiusComposite
    ├── animation.ts         # animate, animateIn, animateEffect, animateDuration
    └── borders.ts           # border, borderTop, borderBottom, borderCard, divider
```

## Migration Examples

### Layout Patterns

```tsx
// ❌ OLD
className={UI_CLASSES.FLEX_COL_GAP_4}
className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
className={UI_CLASSES.GRID_COLS_1_MD_2_LG_3}

// ✅ NEW
import { stack, cluster, grid } from '@heyclaude/web-runtime/design-system/styles';

className={stack.comfortable}        // flex flex-col gap-4
className={cluster.compact}          // flex items-center gap-2
className={grid.responsive3}         // grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### Card Patterns

```tsx
// ❌ OLD
className={UI_CLASSES.CARD_INTERACTIVE}
className={UI_CLASSES.CARD_PADDING_DEFAULT}

// ✅ NEW
import { card, cardPadding } from '@heyclaude/web-runtime/design-system/styles';

className={cn(card.interactive, cardPadding.default)}
```

### Typography

```tsx
// ❌ OLD
className={UI_CLASSES.TEXT_HEADING_HERO}
className={UI_CLASSES.TEXT_SM_MUTED}
className={UI_CLASSES.TEXT_CARD_TITLE}

// ✅ NEW
import { heading, muted } from '@heyclaude/web-runtime/design-system/styles';

className={heading.hero}    // text-4xl lg:text-6xl font-bold mb-6 text-foreground
className={muted.sm}        // text-sm text-muted-foreground
className={heading.card}    // text-lg font-semibold
```

### Badges

```tsx
// ❌ OLD
import { BADGE_COLORS } from '@heyclaude/web-runtime/ui';
className={BADGE_COLORS.status.success}
className={BADGE_COLORS.category.agents}

// ✅ NEW
import { statusBadge, categoryBadge } from '@heyclaude/web-runtime/design-system/styles';

className={statusBadge.success}
className={categoryBadge.agents}
```

### Icons

```tsx
// ❌ OLD
className={UI_CLASSES.ICON_SM}
className={UI_CLASSES.ICON_SUCCESS}

// ✅ NEW
import { iconSize, iconColor } from '@heyclaude/web-runtime/design-system/styles';

className={iconSize.sm}        // h-4 w-4
className={iconColor.success}  // text-green-500 dark:text-green-400
```

### Interactive States

```tsx
// ❌ OLD
className={STATE_PATTERNS.HOVER_BG_DEFAULT}
className={STATE_PATTERNS.FOCUS_RING}
className={ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}

// ✅ NEW
import { hoverBg, focusRing, transition } from '@heyclaude/web-runtime/design-system/styles';

className={hoverBg.default}     // hover:bg-accent/10
className={focusRing.default}   // focus-visible:outline-none focus-visible:ring-2 ...
className={transition.default}  // transition-all duration-200 ease-out
```

### Position Patterns

```tsx
// ❌ OLD
className={POSITION_PATTERNS.ABSOLUTE_TOP_RIGHT_OFFSET}
className={POSITION_PATTERNS.FIXED_BOTTOM_RIGHT}
className={POSITION_PATTERNS.STICKY_TOP}

// ✅ NEW
import { absolute, fixed, sticky } from '@heyclaude/web-runtime/design-system/styles';

className={absolute.topRightOffset}  // absolute top-2 right-2
className={fixed.bottomRight}        // fixed bottom-4 right-4
className={sticky.top}               // sticky top-0 z-10
```

### Using Design Tokens

```tsx
// ❌ OLD - Hardcoded values or scattered constants
const duration = 200;
const springConfig = { stiffness: 400, damping: 17 };

// ✅ NEW - Centralized tokens
import { animation } from '@heyclaude/web-runtime/design-system/tokens';

const duration = animation.duration.default;  // 200
const springConfig = animation.spring.default;  // { type: 'spring', stiffness: 400, damping: 17 }
```

## Benefits

1. **Tree-Shakeable**: Only import what you use
2. **Discoverable**: Autocomplete shows available options
3. **Type-Safe**: Full TypeScript support
4. **Composable**: Combine utilities as needed
5. **Consistent**: Single source of truth for values
6. **Maintainable**: Change a value in one place

## Gradual Migration

You don't need to migrate everything at once. The new system works alongside the legacy constants:

```tsx
// Both work together during migration
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';  // Legacy
import { stack, card } from '@heyclaude/web-runtime/design-system/styles';  // New

// Mix as needed during transition
className={cn(
  UI_CLASSES.TEXT_CARD_TITLE,  // Legacy
  stack.compact,               // New
)}
```

## Complete Import Map

| Old Import | New Import |
|------------|------------|
| `UI_CLASSES.FLEX_COL_*` | `stack.*` |
| `UI_CLASSES.FLEX_ITEMS_CENTER_*` | `cluster.*` |
| `UI_CLASSES.GRID_*` | `grid.*` |
| `UI_CLASSES.TEXT_HEADING_*` | `heading.*` |
| `UI_CLASSES.TEXT_*_MUTED` | `muted.*` |
| `UI_CLASSES.CARD_*` | `card.*`, `cardPadding.*` |
| `UI_CLASSES.ICON_*` | `iconSize.*`, `iconColor.*` |
| `UI_CLASSES.BADGE_*` | `badgeBase`, `statusBadge.*` |
| `STATE_PATTERNS.HOVER_*` | `hoverBg.*`, `hoverText.*` |
| `STATE_PATTERNS.FOCUS_*` | `focusRing.*` |
| `POSITION_PATTERNS.*` | `absolute.*`, `fixed.*`, `sticky.*` |
| `ANIMATION_CONSTANTS.*` | `animation.*` from tokens |
| `BADGE_COLORS.status.*` | `statusBadge.*` |
| `BADGE_COLORS.category.*` | `categoryBadge.*` |

---

## New Utilities (v2)

### Border Radius

```tsx
// ❌ OLD - Inline Tailwind
className="rounded-lg"
className="rounded-xl"
className="rounded-full"

// ✅ NEW - Design system utilities
import { radius, radiusComposite } from '@heyclaude/web-runtime/design-system/styles';

className={radius.lg}           // rounded-lg
className={radius.xl}           // rounded-xl
className={radius.full}         // rounded-full
className={radiusComposite.card}    // rounded-lg (semantic)
className={radiusComposite.button}  // rounded-md (semantic)
className={radiusComposite.badge}   // rounded-full (semantic)
```

### Animations

```tsx
// ❌ OLD - Inline Tailwind
className="animate-spin"
className="animate-pulse"
className="animate-fade-in"

// ✅ NEW - Design system utilities
import { animate, animateIn, animateEffect, animateDuration } from '@heyclaude/web-runtime/design-system/styles';

className={animate.spin}           // animate-spin
className={animate.pulse}          // animate-pulse
className={animateIn.fade}         // animate-fade-in
className={animateIn.slideUp}      // animate-slide-up
className={animateEffect.shimmer}  // animate-shimmer
className={cn(animateIn.fade, animateDuration.slow)}  // Combined
```

### Borders

```tsx
// ❌ OLD - Inline Tailwind
className="border border-border"
className="border-b border-border/50"
className="border-2 border-accent"

// ✅ NEW - Design system utilities
import { border, borderBottom, borderCard, divider } from '@heyclaude/web-runtime/design-system/styles';

className={border.default}         // border border-border
className={borderBottom.light}     // border-b border-border/50
className={borderCard.selected}    // border-2 border-accent
className={divider.spaced}         // border-t border-border my-4
```

### Spacing (space-y, space-x)

```tsx
// ❌ OLD - Inline Tailwind
className="space-y-4"
className="space-x-2"

// ✅ NEW - Design system utilities
import { spaceY, spaceX } from '@heyclaude/web-runtime/design-system/styles';

className={spaceY.comfortable}  // space-y-4
className={spaceX.compact}      // space-x-2
```

---

## Inline Tailwind Migration Reference

| Inline Pattern | Design System Utility |
|----------------|----------------------|
| `flex flex-col` | `stack.none` |
| `flex flex-col gap-2` | `stack.compact` |
| `flex flex-col gap-3` | `stack.default` |
| `flex flex-col gap-4` | `stack.comfortable` |
| `flex flex-col gap-6` | `stack.relaxed` |
| `flex items-center` | `cluster.none` |
| `flex items-center gap-2` | `cluster.compact` |
| `flex items-center gap-3` | `cluster.default` |
| `flex items-center gap-4` | `cluster.comfortable` |
| `h-4 w-4` | `iconSize.sm` |
| `h-5 w-5` | `iconSize.md` |
| `h-6 w-6` | `iconSize.lg` |
| `h-8 w-8` | `iconSize.xl` |
| `space-y-2` | `spaceY.compact` |
| `space-y-4` | `spaceY.comfortable` |
| `space-y-6` | `spaceY.relaxed` |
| `rounded-md` | `radius.md` |
| `rounded-lg` | `radius.lg` |
| `rounded-xl` | `radius.xl` |
| `rounded-full` | `radius.full` |
| `transition-all duration-200` | `transition.default` |
| `transition-colors` | `transition.colors` |
| `hover:bg-accent/10` | `hoverBg.default` |
| `border border-border` | `border.default` |
| `border-b border-border` | `borderBottom.default` |
| `flex` | `display.flex` |
| `grid` | `display.grid` |
| `hidden` | `display.hidden` |
| `block` | `display.block` |
| `inline-flex` | `display.inlineFlex` |
| `inline-block` | `display.inlineBlock` |
| `inline` | `display.inline` |
| `flex-1` | `flexGrow['1']` |
| `flex-row` | `flexDir.row` |
| `flex-col` | `flexDir.col` |
| `flex-col-reverse` | `flexDir.colReverse` |
| `flex-row-reverse` | `flexDir.rowReverse` |
| `flex-wrap` | `flexWrap.wrap` |
| `flex-nowrap` | `flexWrap.nowrap` |
| `justify-center` | `justify.center` |
| `justify-between` | `justify.between` |
| `justify-start` | `justify.start` |
| `justify-end` | `justify.end` |
| `space-x-2` | `spaceX.compact` |
| `space-x-3` | `spaceX.default` |
| `space-x-4` | `spaceX.comfortable` |
| `overflow-hidden` | `overflow.hidden` |
| `overflow-auto` | `overflow.auto` |

---

## New V2 Utilities (December 2025)

### Directional Margins

```tsx
// ❌ OLD - Inline Tailwind
className="my-4"
className="mx-auto"
className="mr-2"
className="ml-auto"

// ✅ NEW - Design system utilities
import { marginY, marginX, marginRight, marginLeft } from '@heyclaude/web-runtime/design-system';

className={marginY.comfortable}    // my-4
className={marginX.auto}           // mx-auto
className={marginRight.compact}    // mr-2
className={marginLeft.auto}        // ml-auto
```

| Inline Pattern | Design System Utility | Value |
|----------------|----------------------|-------|
| `my-0` | `marginY.none` | my-0 |
| `my-1` | `marginY.tight` | my-1 |
| `my-2` | `marginY.compact` | my-2 |
| `my-4` | `marginY.comfortable` | my-4 |
| `my-6` | `marginY.relaxed` | my-6 |
| `mx-auto` | `marginX.auto` | mx-auto |
| `mx-2` | `marginX.compact` | mx-2 |
| `mx-4` | `marginX.comfortable` | mx-4 |
| `mr-1` | `marginRight.tight` | mr-1 |
| `mr-2` | `marginRight.compact` | mr-2 |
| `mr-auto` | `marginRight.auto` | mr-auto |
| `ml-1` | `marginLeft.tight` | ml-1 |
| `ml-2` | `marginLeft.compact` | ml-2 |
| `ml-auto` | `marginLeft.auto` | ml-auto |

### Directional Padding

```tsx
// ❌ OLD - Inline Tailwind
className="pt-4"
className="pb-8"
className="pl-6"
className="pr-4"

// ✅ NEW - Design system utilities
import { paddingTop, paddingBottom, paddingLeft, paddingRight } from '@heyclaude/web-runtime/design-system';

className={paddingTop.comfortable}    // pt-4
className={paddingBottom.loose}       // pb-8
className={paddingLeft.relaxed}       // pl-6
className={paddingRight.comfortable}  // pr-4
```

| Inline Pattern | Design System Utility | Value |
|----------------|----------------------|-------|
| `pt-2` | `paddingTop.compact` | pt-2 |
| `pt-4` | `paddingTop.comfortable` | pt-4 |
| `pt-6` | `paddingTop.relaxed` | pt-6 |
| `pt-8` | `paddingTop.loose` | pt-8 |
| `pb-2` | `paddingBottom.compact` | pb-2 |
| `pb-4` | `paddingBottom.comfortable` | pb-4 |
| `pb-6` | `paddingBottom.relaxed` | pb-6 |
| `pb-8` | `paddingBottom.loose` | pb-8 |
| `pl-2` | `paddingLeft.compact` | pl-2 |
| `pl-4` | `paddingLeft.comfortable` | pl-4 |
| `pr-2` | `paddingRight.compact` | pr-2 |
| `pr-4` | `paddingRight.comfortable` | pr-4 |

### Grid Column/Row Span

```tsx
// ❌ OLD - Inline Tailwind
className="col-span-2"
className="col-span-full"
className="row-span-3"

// ✅ NEW - Design system utilities
import { colSpan, rowSpan } from '@heyclaude/web-runtime/design-system';

className={colSpan['2']}     // col-span-2
className={colSpan.full}     // col-span-full
className={rowSpan['3']}     // row-span-3
```

| Inline Pattern | Design System Utility |
|----------------|----------------------|
| `col-span-1` | `colSpan['1']` |
| `col-span-2` | `colSpan['2']` |
| `col-span-3` | `colSpan['3']` |
| `col-span-full` | `colSpan.full` |
| `row-span-2` | `rowSpan['2']` |
| `row-span-full` | `rowSpan.full` |

### Max-Height Utilities

```tsx
// ❌ OLD - Inline Tailwind
className="max-h-screen"
className="max-h-[80vh]"
className="max-h-[300px]"

// ✅ NEW - Design system utilities
import { maxHeight } from '@heyclaude/web-runtime/design-system';

className={maxHeight.screen}     // max-h-screen
className={maxHeight.modal}      // max-h-[80vh]
className={maxHeight.dropdown}   // max-h-[300px]
```

| Inline Pattern | Design System Utility | Semantic Use |
|----------------|----------------------|--------------|
| `max-h-screen` | `maxHeight.screen` | Full viewport |
| `max-h-full` | `maxHeight.full` | Full parent |
| `max-h-[80vh]` | `maxHeight.modal` | Modal dialogs |
| `max-h-[400px]` | `maxHeight.popover` | Popovers |
| `max-h-[300px]` | `maxHeight.dropdown` | Dropdown menus |
| `max-h-[calc(100vh-6rem)]` | `maxHeight.sidebar` | Sidebars |

### Outline Utilities

```tsx
// ❌ OLD - Inline Tailwind
className="outline-none"
className="outline outline-2 outline-offset-2"

// ✅ NEW - Design system utilities
import { outline, outlineWidth, outlineOffset, outlinePattern } from '@heyclaude/web-runtime/design-system';

className={outline.none}                  // outline-none
className={outlinePattern.focusRing}      // outline outline-2 outline-offset-2 outline-ring
className={outlinePattern.selected}       // outline outline-2 outline-accent
```

| Inline Pattern | Design System Utility |
|----------------|----------------------|
| `outline-none` | `outline.none` |
| `outline` | `outline.default` |
| `outline-dashed` | `outline.dashed` |
| `outline-2` | `outlineWidth[2]` |
| `outline-offset-2` | `outlineOffset[2]` |

---

## V1 → V2 Utility Mapping Reference

This table maps V1 (legacy) patterns from `@heyclaude/web-runtime/ui` to V2 design system utilities.

### From DIMENSIONS (constants.ts)

| V1 Constant | V2 Utility | Notes |
|-------------|-----------|-------|
| `DIMENSIONS.MODAL_MAX` | `maxHeight.modal` | max-h-[80vh] |
| `DIMENSIONS.DROPDOWN_MAX` | `maxHeight.dropdown` | max-h-[300px] |
| `DIMENSIONS.POPOVER_MAX` | `maxHeight.popover` | max-h-[400px] |
| `DIMENSIONS.SIDEBAR_MAX` | `maxHeight.sidebar` | max-h-[calc(100vh-6rem)] |
| `DIMENSIONS.NOTIFICATION_MAX` | `maxHeight.notification` | max-h-[calc(80vh-8rem)] |

### From RESPONSIVE_PATTERNS (constants.ts)

| V1 Constant | V2 Utility |
|-------------|-----------|
| `RESPONSIVE_PATTERNS.FLEX_COL_SM_ROW` | `responsive.smRowGap` |
| `RESPONSIVE_PATTERNS.FLEX_COL_MD_ROW` | `responsive.mdRowGap` |
| `RESPONSIVE_PATTERNS.FLEX_COL_LG_ROW` | `responsive.lgRowGap` |
| `RESPONSIVE_PATTERNS.GRID_RESPONSIVE_1_2` | `grid.responsive2` |
| `RESPONSIVE_PATTERNS.GRID_RESPONSIVE_1_2_3` | `grid.responsive3` |

### From ANIMATION_CONSTANTS (constants.ts)

| V1 Constant | V2 Utility |
|-------------|-----------|
| `ANIMATION_CONSTANTS.CSS_TRANSITION_FAST` | `transition.fast` |
| `ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT` | `transition.default` |
| `ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW` | `transition.slow` |
