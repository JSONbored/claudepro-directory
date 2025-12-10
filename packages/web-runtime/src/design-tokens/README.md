# Design Tokens V2

Comprehensive semantic design token system for Claude Pro Directory.

## Overview

This package provides a complete set of semantic design tokens organized by domain:
- **Colors** - Semantic colors, palette, light/dark/high-contrast modes
- **Typography** - Font families, sizes, weights, line heights, letter spacing
- **Spacing** - Spacing scale and semantic spacing tokens
- **Shadows** - Elevation-based shadow system
- **States** - Loading, error, success, warning, info, disabled states
- **Accessibility** - Focus indicators, contrast ratios, reduced motion
- **Responsive** - Breakpoints and responsive token variations

## Architecture

- **Self-contained** - No external dependencies
- **Type-safe** - Full TypeScript support with const assertions
- **Semantic** - Tokens describe purpose, not implementation
- **Compatible** - Works with existing V2 design system (animations, microinteractions)

## Usage

```tsx
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, STATES } from '@heyclaude/web-runtime/design-tokens';

// Colors
<div className={COLORS.text.primary}>
<div className={COLORS.background.primary}>
<div className={COLORS.semantic.primary.light}>

// Typography
<div className={TYPOGRAPHY.fontSizes.sm}>
<div className={TYPOGRAPHY.fontWeights.semibold}>
<div className={TYPOGRAPHY.lineHeights.relaxed}>

// Spacing
<div className={SPACING.marginBottom.default}>
<div className={SPACING.padding.comfortable}>
<div className={SPACING.gap.tight}>

// Shadows
<div className={SHADOWS.elevation.small}>
<div className={SHADOWS.elevation.medium}>

// States
<div className={STATES.loading.skeleton}>
<div className={STATES.error.border}>
<div className={STATES.success.message}>
```

## Migration

See `.cursor/design-system-v2-implementation-plan.md` for migration strategy.

## Status

**Phase 1:** Creating token systems (in progress)  
**Phase 2:** Integration with V2 system (pending)  
**Phase 3-5:** Component migration (pending)  
**Phase 6:** Cleanup (pending)
