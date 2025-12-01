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
