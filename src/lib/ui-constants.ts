/**
 * UI Class Constants
 * SHA-2101: Centralized className patterns to eliminate duplication
 *
 * Usage: Replace long className strings with these constants
 * Before: className="card-gradient hover-lift transition-smooth group"
 * After: className={UI_CLASSES.CARD_GRADIENT_HOVER}
 */

export const UI_CLASSES = {
  /**
   * Card Styles
   */
  CARD_INTERACTIVE:
    "card-gradient hover-lift transition-smooth group cursor-pointer border-border/50 hover:border-accent/20",
  CARD_GRADIENT_HOVER: "card-gradient hover-lift transition-smooth group",
  CARD_BORDER_HOVER: "hover:border-accent/20 border-border/50",

  /**
   * Button Styles - Common patterns
   */
  BUTTON_PRIMARY_LARGE:
    "flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200",
  BUTTON_SECONDARY_MEDIUM:
    "flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]",
  BUTTON_GHOST_ICON: "hover:bg-accent/10 hover:text-accent",

  /**
   * Grid Layouts
   */
  GRID_RESPONSIVE_2: "grid gap-4 md:grid-cols-2",
  GRID_RESPONSIVE_2_GAP_8: "grid gap-8 md:grid-cols-2",
  GRID_RESPONSIVE_3: "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  GRID_RESPONSIVE_3_GAP_8: "grid gap-8 lg:grid-cols-3",
  GRID_RESPONSIVE_3_NO_LG: "grid gap-6 md:grid-cols-3",
  GRID_RESPONSIVE_3_TIGHT:
    "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  GRID_RESPONSIVE_4: "grid gap-6 md:grid-cols-2 lg:grid-cols-4",
  GRID_RESPONSIVE_4_GAP_4: "grid gap-4 md:grid-cols-4",
  GRID_RESPONSIVE_LIST: "grid gap-6 md:grid-cols-2 lg:grid-cols-3 list-none",
  GRID_GAP_4: "grid gap-4",

  /**
   * Grid Layouts - Extended
   */
  GRID_COLS_1: "grid grid-cols-1",
  GRID_COLS_2: "grid grid-cols-2",
  GRID_COLS_3: "grid grid-cols-3",
  GRID_COLS_4: "grid grid-cols-4",

  /**
   * Icon Positioning
   */
  ICON_ABSOLUTE_LEFT:
    "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
  ICON_ABSOLUTE_LEFT_TIGHT:
    "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",

  /**
   * Text Styles
   */
  TEXT_HEADING_HERO: "text-4xl lg:text-6xl font-bold mb-6 text-foreground",
  TEXT_HEADING_LARGE: "text-xl text-muted-foreground mb-8 leading-relaxed",
  TEXT_HEADING_MEDIUM: "text-lg text-muted-foreground mb-8 leading-relaxed",
  TEXT_MUTED: "text-muted-foreground",
  TEXT_MUTED_FOREGROUND: "text-muted-foreground",
  TEXT_FOREGROUND: "text-foreground",
  TEXT_CARD_FOREGROUND: "text-card-foreground",
  TEXT_PRIMARY: "text-primary",
  TEXT_SECONDARY: "text-secondary",
  TEXT_DESTRUCTIVE: "text-destructive",
  TEXT_MUTED_HOVER_PRIMARY:
    "text-muted-foreground hover:text-primary transition-colors",

  /**
   * Transitions & Animations
   */
  TRANSITION_COLORS_SMOOTH: "transition-colors-smooth",
  TRANSITION_ALL_200: "transition-all duration-200",
  DURATION_200: "duration-200",
  DURATION_300: "duration-300",
  HOVER_TEXT_ACCENT: "group-hover:text-accent transition-colors-smooth",
  HOVER_SCALE_ACTIVE: "active:scale-[0.97]",
  HOVER_SCALE_ACTIVE_SUBTLE: "active:scale-[0.98]",
  SCALE_105: "scale-105",

  /**
   * Transitions
   */
  TRANSITION_COLORS: "transition-colors",
  TRANSITION_ALL: "transition-all",
  EASE_IN_OUT: "ease-in-out",

  /**
   * Framer Motion Animation Constants
   * Production-grade spring physics for natural, fluid motion
   */
  SPRING_SMOOTH: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  SPRING_BOUNCY: { type: "spring" as const, stiffness: 400, damping: 25 },
  SPRING_GENTLE: { type: "spring" as const, stiffness: 200, damping: 20 },
  FADE_IN_OUT: { duration: 0.3 },
  SCALE_TAP: { scale: 0.98 },
  SCALE_HOVER: { scale: 1.02 },

  /**
   * Container Styles
   */
  CONTAINER_MX_AUTO: "container mx-auto",
  CONTAINER_CENTER:
    "flex flex-col items-center justify-center py-12 text-center",
  CONTAINER_CARD_MUTED:
    "text-center py-12 bg-card/50 rounded-xl border border-border/50",
  CONTAINER_OVERFLOW_BORDER:
    "relative overflow-hidden border-b border-border/50 bg-card/30",
  CONTAINER_HOVER_BORDER:
    "relative overflow-hidden border-2 hover:border-primary/50 transition-colors",

  /**
   * Flexbox Layouts - Common patterns
   */
  FLEX_ITEMS_CENTER_GAP_2: "flex items-center gap-2",
  FLEX_GAP_2: "flex gap-2",
  FLEX_ITEMS_START_GAP_3: "flex items-start gap-3",
  FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN: "flex items-center justify-between",
  FLEX_ITEMS_CENTER_GAP_1: "flex items-center gap-1",
  FLEX_GAP_3: "flex gap-3",
  FLEX_GAP_4: "flex gap-4",
  FLEX_WRAP_GAP_1: "flex flex-wrap gap-1",
  FLEX_WRAP_GAP_2: "flex flex-wrap gap-2",
  FLEX_WRAP_GAP_4: "flex flex-wrap gap-4",

  /**
   * Flex Layouts - Extended
   */
  FLEX_COL: "flex flex-col",
  FLEX_ROW: "flex flex-row",
  FLEX_COL_CENTER: "flex flex-col items-center",
  FLEX_ROW_CENTER: "flex flex-row items-center",

  /**
   * Flexbox - Extended
   */
  FLEX_1: "flex-1",
  FLEX_GROW: "flex-grow",
  FLEX_SHRINK: "flex-shrink",
  FLEX_SHRINK_0: "flex-shrink-0",
  FLEX_WRAP: "flex-wrap",
  FLEX_NOWRAP: "flex-nowrap",

  /**
   * Layout Alignment - Justify
   */
  JUSTIFY_START: "justify-start",
  JUSTIFY_END: "justify-end",
  JUSTIFY_CENTER: "justify-center",
  JUSTIFY_BETWEEN: "justify-between",
  JUSTIFY_AROUND: "justify-around",
  JUSTIFY_EVENLY: "justify-evenly",

  /**
   * Layout Alignment - Items
   */
  ITEMS_START: "items-start",
  ITEMS_END: "items-end",
  ITEMS_CENTER: "items-center",
  ITEMS_BASELINE: "items-baseline",
  ITEMS_STRETCH: "items-stretch",

  /**
   * Align Self
   */
  SELF_AUTO: "self-auto",
  SELF_START: "self-start",
  SELF_END: "self-end",
  SELF_CENTER: "self-center",
  SELF_STRETCH: "self-stretch",

  /**
   * Place Content
   */
  PLACE_CONTENT_CENTER: "place-content-center",
  PLACE_CONTENT_START: "place-content-start",
  PLACE_CONTENT_END: "place-content-end",
  PLACE_CONTENT_BETWEEN: "place-content-between",
  PLACE_CONTENT_AROUND: "place-content-around",
  PLACE_CONTENT_EVENLY: "place-content-evenly",
  PLACE_CONTENT_STRETCH: "place-content-stretch",

  /**
   * Place Items
   */
  PLACE_ITEMS_START: "place-items-start",
  PLACE_ITEMS_END: "place-items-end",
  PLACE_ITEMS_CENTER: "place-items-center",
  PLACE_ITEMS_STRETCH: "place-items-stretch",

  /**
   * Gap Utilities
   */
  GAP_1: "gap-1",
  GAP_2: "gap-2",
  GAP_3: "gap-3",
  GAP_4: "gap-4",
  GAP_6: "gap-6",
  GAP_8: "gap-8",

  /**
   * Spacing Utilities
   */
  SPACE_Y_0_5: "space-y-0.5",
  SPACE_Y_1: "space-y-1",
  SPACE_Y_1_5: "space-y-1.5",
  SPACE_Y_2: "space-y-2",
  SPACE_Y_3: "space-y-3",
  SPACE_Y_4: "space-y-4",
  SPACE_Y_6: "space-y-6",
  SPACE_Y_8: "space-y-8",
  SPACE_Y_16: "space-y-16",
  SPACE_Y_TIGHT: "space-y-0.5",
  SPACE_Y_TIGHT_PLUS: "space-y-1.5",
  SPACE_X_2: "space-x-2",
  SPACE_X_3: "space-x-3",
  SPACE_X_4: "space-x-4",

  /**
   * Text Size & Color Combinations
   */
  TEXT_XS_MUTED: "text-xs text-muted-foreground",
  TEXT_SM_MUTED: "text-sm text-muted-foreground",
  TEXT_BASE_MUTED: "text-base text-muted-foreground",

  /**
   * Text Alignment
   */
  TEXT_CENTER: "text-center",
  TEXT_LEFT: "text-left",
  TEXT_RIGHT: "text-right",
  TEXT_JUSTIFY: "text-justify",
  TEXT_START: "text-start",
  TEXT_END: "text-end",

  /**
   * Text Sizes
   */
  TEXT_XS: "text-xs",
  TEXT_SM: "text-sm",
  TEXT_BASE: "text-base",
  TEXT_MD: "text-md",
  TEXT_LG: "text-lg",
  TEXT_XL: "text-xl",
  TEXT_2XL: "text-2xl",
  TEXT_3XL: "text-3xl",
  TEXT_4XL: "text-4xl",
  TEXT_5XL: "text-5xl",

  /**
   * Font Weights
   */
  FONT_THIN: "font-thin",
  FONT_EXTRALIGHT: "font-extralight",
  FONT_LIGHT: "font-light",
  FONT_NORMAL: "font-normal",
  FONT_MEDIUM: "font-medium",
  FONT_SEMIBOLD: "font-semibold",
  FONT_BOLD: "font-bold",
  FONT_EXTRABOLD: "font-extrabold",
  FONT_BLACK: "font-black",

  /**
   * Text Transformations
   */
  UPPERCASE: "uppercase",
  LOWERCASE: "lowercase",
  CAPITALIZE: "capitalize",

  /**
   * Text Rendering
   */
  ANTIALIASED: "antialiased",
  SUBPIXEL_ANTIALIASED: "subpixel-antialiased",

  /**
   * Margin Utilities
   */
  MB_1: "mb-1",
  MB_2: "mb-2",
  MB_3: "mb-3",
  MB_4: "mb-4",
  MB_6: "mb-6",
  MB_8: "mb-8",
  MB_12: "mb-12",

  MT_1: "mt-1",
  MT_2: "mt-2",
  MT_4: "mt-4",
  MT_6: "mt-6",
  MT_8: "mt-8",
  ML_2: "ml-2",
  ML_3: "ml-3",
  MR_2: "mr-2",
  MR_4: "mr-4",
  MX_AUTO: "mx-auto",

  /**
   * Padding Utilities
   */
  P_2: "p-2",
  P_3: "p-3",
  P_4: "p-4",
  P_6: "p-6",
  P_8: "p-8",
  PX_2: "px-2",
  PX_3: "px-3",
  PX_4: "px-4",
  PX_6: "px-6",
  PY_1: "py-1",
  PY_2: "py-2",
  PY_3: "py-3",
  PY_4: "py-4",
  PT_2: "pt-2",
  PT_3: "pt-3",
  PT_4: "pt-4",
  PT_6: "pt-6",
  PB_2: "pb-2",
  PB_4: "pb-4",
  PB_8: "pb-8",

  /**
   * List & Item Styles
   */
  LIST_ITEM_HOVER:
    "block w-full text-left p-2 text-sm rounded-lg hover:bg-muted/50 transition-colors",
  FLEX_WRAP_MUTED: "flex flex-wrap gap-4 text-sm text-muted-foreground mb-4",

  /**
   * Link Styles
   */
  LINK_ACCENT_UNDERLINE: "text-accent hover:underline flex items-center gap-2",

  /**
   * Badge & Indicator Styles
   */
  BADGE_DOT_RED: "h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0",

  /**
   * Hidden Utilities
   */
  HIDDEN_SM_FLEX: "hidden sm:flex",

  /**
   * Screen Reader Utilities
   */
  SR_ONLY: "sr-only",
  NOT_SR_ONLY: "not-sr-only",

  /**
   * Border Radius
   */
  ROUNDED_SM: "rounded-sm",
  ROUNDED_MD: "rounded-md",
  ROUNDED_LG: "rounded-lg",
  ROUNDED_XL: "rounded-xl",
  ROUNDED_2XL: "rounded-2xl",
  ROUNDED_FULL: "rounded-full",

  /**
   * Borders
   */
  BORDER_T: "border-t",
  BORDER_B: "border-b",
  BORDER_L: "border-l",
  BORDER_R: "border-r",

  /**
   * Border Colors
   */
  BORDER_BORDER: "border-border",
  BORDER_INPUT: "border-input",
  BORDER_RING: "border-ring",
  BORDER_PRIMARY: "border-primary",
  BORDER_MUTED: "border-muted",

  /**
   * Line Clamp
   */
  LINE_CLAMP_2: "line-clamp-2",
  LINE_CLAMP_3: "line-clamp-3",

  /**
   * Leading (Line Height)
   */
  LEADING_NONE: "leading-none",
  LEADING_TIGHT: "leading-tight",
  LEADING_SNUG: "leading-snug",
  LEADING_NORMAL: "leading-normal",
  LEADING_RELAXED: "leading-relaxed",
  LEADING_LOOSE: "leading-loose",

  /**
   * Background Colors
   */
  BG_BACKGROUND: "bg-background",
  BG_FOREGROUND: "bg-foreground",
  BG_CARD: "bg-card",
  BG_MUTED: "bg-muted",
  BG_ACCENT: "bg-accent",
  BG_PRIMARY: "bg-primary",
  BG_SECONDARY: "bg-secondary",
  BG_DESTRUCTIVE: "bg-destructive",
  BG_TRANSPARENT: "bg-transparent",
  BG_CARD_50: "bg-card/50",
  BG_ACCENT_5: "bg-accent/5",
  BG_ACCENT_10: "bg-accent/10",
  BG_MUTED_50: "bg-muted/50",

  /**
   * Hover Background States
   */
  HOVER_BG_ACCENT: "hover:bg-accent",
  HOVER_BG_ACCENT_10: "hover:bg-accent/10",
  HOVER_BG_MUTED: "hover:bg-muted",
  HOVER_BG_MUTED_50: "hover:bg-muted/50",
  HOVER_BG_PRIMARY: "hover:bg-primary",
  HOVER_TEXT_FOREGROUND: "hover:text-foreground",
  HOVER_BORDER_PRIMARY: "hover:border-primary",

  /**
   * Width & Height
   */
  W_FULL: "w-full",
  W_AUTO: "w-auto",
  W_FIT: "w-fit",
  W_SCREEN: "w-screen",
  H_FULL: "h-full",
  H_AUTO: "h-auto",
  H_FIT: "h-fit",
  H_SCREEN: "h-screen",

  /**
   * Min Width
   */
  MIN_W_0: "min-w-0",
  MIN_W_FULL: "min-w-full",
  MIN_W_FIT: "min-w-fit",

  /**
   * Max Width
   */
  MAX_W_XS: "max-w-xs",
  MAX_W_SM: "max-w-sm",
  MAX_W_MD: "max-w-md",
  MAX_W_LG: "max-w-lg",
  MAX_W_XL: "max-w-xl",
  MAX_W_2XL: "max-w-2xl",
  MAX_W_3XL: "max-w-3xl",
  MAX_W_4XL: "max-w-4xl",
  MAX_W_5XL: "max-w-5xl",
  MAX_W_6XL: "max-w-6xl",
  MAX_W_7XL: "max-w-7xl",
  MAX_W_FULL: "max-w-full",
  MAX_W_SCREEN: "max-w-screen",

  /**
   * Min Height
   */
  MIN_H_0: "min-h-0",
  MIN_H_FULL: "min-h-full",
  MIN_H_SCREEN: "min-h-screen",

  /**
   * Max Height
   */
  MAX_H_FULL: "max-h-full",
  MAX_H_SCREEN: "max-h-screen",

  /**
   * Position
   */
  STATIC: "static",
  FIXED: "fixed",
  ABSOLUTE: "absolute",
  RELATIVE: "relative",
  STICKY: "sticky",

  /**
   * Position Values
   */
  TOP_0: "top-0",
  RIGHT_0: "right-0",
  BOTTOM_0: "bottom-0",
  LEFT_0: "left-0",
  INSET_0: "inset-0",

  /**
   * Display
   */
  BLOCK: "block",
  INLINE_BLOCK: "inline-block",
  INLINE: "inline",
  FLEX: "flex",
  INLINE_FLEX: "inline-flex",
  GRID: "grid",
  INLINE_GRID: "inline-grid",
  HIDDEN: "hidden",

  /**
   * Opacity
   */
  OPACITY_0: "opacity-0",
  OPACITY_50: "opacity-50",
  OPACITY_75: "opacity-75",
  OPACITY_100: "opacity-100",
  DISABLED_OPACITY: "disabled:opacity-50",

  /**
   * Z-Index
   */
  Z_0: "z-0",
  Z_10: "z-10",
  Z_20: "z-20",
  Z_30: "z-30",
  Z_40: "z-40",
  Z_50: "z-50",

  /**
   * Overflow
   */
  OVERFLOW_HIDDEN: "overflow-hidden",
  OVERFLOW_AUTO: "overflow-auto",
  OVERFLOW_SCROLL: "overflow-scroll",
  OVERFLOW_X_AUTO: "overflow-x-auto",
  OVERFLOW_Y_AUTO: "overflow-y-auto",

  /**
   * Overscroll Behavior
   */
  OVERSCROLL_AUTO: "overscroll-auto",
  OVERSCROLL_CONTAIN: "overscroll-contain",
  OVERSCROLL_NONE: "overscroll-none",
  OVERSCROLL_X_AUTO: "overscroll-x-auto",
  OVERSCROLL_X_CONTAIN: "overscroll-x-contain",
  OVERSCROLL_X_NONE: "overscroll-x-none",
  OVERSCROLL_Y_AUTO: "overscroll-y-auto",
  OVERSCROLL_Y_CONTAIN: "overscroll-y-contain",
  OVERSCROLL_Y_NONE: "overscroll-y-none",

  /**
   * Object Fit
   */
  OBJECT_CONTAIN: "object-contain",
  OBJECT_COVER: "object-cover",

  /**
   * Object Position
   */
  OBJECT_BOTTOM: "object-bottom",
  OBJECT_CENTER: "object-center",
  OBJECT_LEFT: "object-left",
  OBJECT_LEFT_BOTTOM: "object-left-bottom",
  OBJECT_LEFT_TOP: "object-left-top",
  OBJECT_RIGHT: "object-right",
  OBJECT_RIGHT_BOTTOM: "object-right-bottom",
  OBJECT_RIGHT_TOP: "object-right-top",
  OBJECT_TOP: "object-top",

  /**
   * Aspect Ratio
   */
  ASPECT_SQUARE: "aspect-square",
  ASPECT_VIDEO: "aspect-video",

  /**
   * Hover Text Colors
   */
  HOVER_TEXT_PRIMARY: "hover:text-primary",
  GROUP_HOVER_TEXT_PRIMARY: "group-hover:text-primary",

  /**
   * Whitespace
   */
  WHITESPACE_NORMAL: "whitespace-normal",
  WHITESPACE_NOWRAP: "whitespace-nowrap",
  WHITESPACE_PRE: "whitespace-pre",
  WHITESPACE_PRE_LINE: "whitespace-pre-line",
  WHITESPACE_PRE_WRAP: "whitespace-pre-wrap",
  WHITESPACE_BREAK_SPACES: "whitespace-break-spaces",

  /**
   * Word Break
   */
  BREAK_NORMAL: "break-normal",
  BREAK_WORDS: "break-words",
  BREAK_ALL: "break-all",
  BREAK_KEEP: "break-keep",

  /**
   * Pointer Events
   */
  POINTER_EVENTS_NONE: "pointer-events-none",
  POINTER_EVENTS_AUTO: "pointer-events-auto",

  /**
   * Cursor Utilities
   */
  CURSOR_POINTER: "cursor-pointer",
  DISABLED_CURSOR: "disabled:cursor-not-allowed",

  /**
   * Text Overflow
   */
  TRUNCATE: "truncate",

  /**
   * User Selection
   */
  SELECT_NONE: "select-none",

  /**
   * Ring Utilities
   */
  RING_OFFSET_BG: "ring-offset-background",

  /**
   * Group Utilities
   */
  GROUP: "group",

  /**
   * Focus & Outline
   */
  OUTLINE_NONE: "outline-none",
  FOCUS_RING: "focus-visible:ring-2",

  /**
   * Backdrop Effects
   */
  BACKDROP_BLUR_SM: "backdrop-blur-sm",

  /**
   * Shadows
   */
  SHADOW_SM: "shadow-sm",
  SHADOW_MD: "shadow-md",
  SHADOW_LG: "shadow-lg",
  SHADOW_XL: "shadow-xl",
  SHADOW_2XL: "shadow-2xl",
  SHADOW_NONE: "shadow-none",

  /**
   * Visibility
   */
  VISIBLE: "visible",
  INVISIBLE: "invisible",
  COLLAPSE: "collapse",

  /**
   * Scroll Behavior
   */
  SCROLL_AUTO: "scroll-auto",
  SCROLL_SMOOTH: "scroll-smooth",

  /**
   * Scroll Margin/Padding
   */
  SCROLL_M_0: "scroll-m-0",
  SCROLL_P_0: "scroll-p-0",

  /**
   * Isolation
   */
  ISOLATE: "isolate",
  ISOLATION_AUTO: "isolation-auto",

  /**
   * Mix Blend Mode
   */
  MIX_BLEND_NORMAL: "mix-blend-normal",
  MIX_BLEND_MULTIPLY: "mix-blend-multiply",
  MIX_BLEND_SCREEN: "mix-blend-screen",
  MIX_BLEND_OVERLAY: "mix-blend-overlay",
  MIX_BLEND_DARKEN: "mix-blend-darken",
  MIX_BLEND_LIGHTEN: "mix-blend-lighten",
  MIX_BLEND_COLOR_DODGE: "mix-blend-color-dodge",
  MIX_BLEND_COLOR_BURN: "mix-blend-color-burn",
  MIX_BLEND_HARD_LIGHT: "mix-blend-hard-light",
  MIX_BLEND_SOFT_LIGHT: "mix-blend-soft-light",
  MIX_BLEND_DIFFERENCE: "mix-blend-difference",
  MIX_BLEND_EXCLUSION: "mix-blend-exclusion",
  MIX_BLEND_HUE: "mix-blend-hue",
  MIX_BLEND_SATURATION: "mix-blend-saturation",
  MIX_BLEND_COLOR: "mix-blend-color",
  MIX_BLEND_LUMINOSITY: "mix-blend-luminosity",
  MIX_BLEND_PLUS_LIGHTER: "mix-blend-plus-lighter",

  /**
   * Will Change
   */
  WILL_CHANGE_AUTO: "will-change-auto",
  WILL_CHANGE_SCROLL: "will-change-scroll",
  WILL_CHANGE_CONTENTS: "will-change-contents",
  WILL_CHANGE_TRANSFORM: "will-change-transform",

  /**
   * Code Block Styles - Production-grade patterns
   */
  CODE_BLOCK_HEADER:
    "flex items-center justify-between px-4 py-2 bg-code/30 border border-b-0 border-border rounded-t-lg backdrop-blur-sm",
  CODE_BLOCK_PRE:
    "overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm",
  CODE_BLOCK_FILENAME: "text-sm font-mono text-muted-foreground",
  CODE_BLOCK_LANGUAGE: "text-xs font-mono text-muted-foreground uppercase",
  CODE_BLOCK_COPY_BUTTON:
    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-code/30",
  CODE_BLOCK_COPY_BUTTON_FLOATING:
    "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md",
  CODE_BLOCK_COPY_BUTTON_HEADER_FLOATING:
    "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md",
  CODE_BLOCK_EXPAND_BUTTON:
    "flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-code/50 backdrop-blur-sm border border-t-0 border-border/50 rounded-b-lg hover:bg-code/30",
  CODE_BLOCK_TAB_CONTAINER:
    "flex gap-2 overflow-x-auto scrollbar-hide border-b border-border/50",
  CODE_BLOCK_TAB_ACTIVE: "text-primary border-primary",
  CODE_BLOCK_TAB_INACTIVE:
    "text-muted-foreground border-transparent hover:text-foreground",
  CODE_BLOCK_GROUP_WRAPPER: "relative group my-6",

  /**
   * Code Block - Background Colors
   */
  BG_CODE_30: "bg-code/30",
  BG_CODE_50: "bg-code/50",

  /**
   * Touch Targets (Mobile-optimized)
   */
  TOUCH_TARGET_48: "min-w-[48px] min-h-[48px]",
  TOUCH_TARGET_44: "min-w-[44px] min-h-[44px]",
} as const;

/**
 * Type-safe UI class constant keys
 */
export type UIClassKey = keyof typeof UI_CLASSES;
