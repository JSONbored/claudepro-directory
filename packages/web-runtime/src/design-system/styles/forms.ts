/**
 * Form Style Utilities
 *
 * Composable patterns for form elements and layouts.
 * Replaces UI_CLASSES form patterns.
 *
 * @module web-runtime/design-system/styles/forms
 */

// =============================================================================
// FORM LAYOUT
// =============================================================================

/**
 * Form section spacing.
 */
export const formSection = {
  /** Spacing between form fields */
  fields: 'space-y-2',
  /** Spacing between field groups */
  groups: 'space-y-4',
  /** Spacing between sections */
  sections: 'space-y-6',
} as const;

/**
 * Form section card states.
 */
export const formSectionCard = {
  /** Collapsed section */
  collapsed: 'rounded-xl border border-white/10 bg-[oklch(26%_0.006_60)] p-4 cursor-pointer hover:bg-[oklch(28%_0.008_60)] transition-all',
  /** Expanded section */
  expanded: 'rounded-xl border border-[oklch(74%_0.2_35)]/20 bg-[oklch(28%_0.006_60)] p-6 shadow-[0_8px_32px_-4px_oklch(74%_0.2_35/0.15)]',
  /** Active/focused section */
  active: 'rounded-xl border border-[oklch(74%_0.2_35)]/30 bg-[oklch(30%_0.008_60)] p-6 shadow-[0_0_0_4px_oklch(74%_0.2_35/0.15)]',
  /** Complete section */
  complete: 'rounded-xl border border-[oklch(72%_0.19_145)]/20 bg-[oklch(26%_0.006_60)] p-4 cursor-pointer hover:bg-[oklch(28%_0.008_60)] transition-all',
} as const;

// =============================================================================
// INPUT FIELDS
// =============================================================================

/**
 * Base input field styles.
 */
export const input = {
  /** Base input styling */
  base: 'w-full rounded-lg border border-white/10 bg-[oklch(26%_0.006_60)] px-4 py-3 text-[16px] text-[oklch(94%_0.005_60)] placeholder:text-[oklch(57%_0.012_60)] transition-all',
  /** Focus state */
  focus: 'focus:border-[oklch(74%_0.2_35)]/40 focus:ring-4 focus:ring-[oklch(74%_0.2_35)]/15 focus:bg-[oklch(28%_0.008_60)] outline-none',
  /** Error state */
  error: 'border-[oklch(70%_0.195_25)]/40 ring-4 ring-[oklch(70%_0.195_25)]/15',
  /** Success state */
  success: 'border-[oklch(72%_0.19_145)]/40 ring-4 ring-[oklch(72%_0.19_145)]/15',
  /** Filled state */
  filled: 'bg-[oklch(24%_0.008_60)] border-[oklch(72%_0.19_145)]/20',
  /** Disabled state */
  disabled: 'bg-[oklch(24%_0.005_60)] cursor-not-allowed opacity-50',
  /** Combined base + focus */
  default: 'w-full rounded-lg border border-white/10 bg-[oklch(26%_0.006_60)] px-4 py-3 text-[16px] text-[oklch(94%_0.005_60)] placeholder:text-[oklch(57%_0.012_60)] transition-all focus:border-[oklch(74%_0.2_35)]/40 focus:ring-4 focus:ring-[oklch(74%_0.2_35)]/15 focus:bg-[oklch(28%_0.008_60)] outline-none',
} as const;

/**
 * Textarea sizing.
 */
export const textarea = {
  sm: 'min-h-[80px]',
  md: 'min-h-[120px]',
  lg: 'min-h-[150px]',
} as const;

// =============================================================================
// FORM LABELS & TEXT
// =============================================================================

/**
 * Form label styles.
 */
export const formLabel = {
  default: 'block text-sm font-medium text-[oklch(94%_0.005_60)] mb-2',
  required: 'block text-sm font-medium text-[oklch(94%_0.005_60)] mb-2 after:content-["*"] after:ml-0.5 after:text-[oklch(70%_0.195_25)]',
} as const;

/**
 * Form helper/feedback text.
 */
export const formText = {
  help: 'mt-1.5 text-xs text-[oklch(72%_0.01_60)]',
  error: 'mt-1.5 text-xs font-medium text-[oklch(70%_0.195_25)] flex items-center gap-1',
  success: 'mt-1.5 text-xs font-medium text-[oklch(72%_0.19_145)] flex items-center gap-1',
} as const;

// =============================================================================
// FORM BUTTONS
// =============================================================================

/**
 * Form-specific button styles.
 */
export const formButton = {
  primary: 'rounded-lg bg-[oklch(74%_0.2_35)] px-6 py-3 text-sm font-semibold text-[#1A1A1D] hover:bg-[oklch(78%_0.19_35)] active:bg-[oklch(70%_0.21_35)] transition-colors shadow-lg shadow-[oklch(74%_0.2_35)]/20 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'rounded-lg border border-white/10 bg-[oklch(28%_0.006_60)] px-6 py-3 text-sm font-semibold text-[oklch(94%_0.005_60)] hover:bg-[oklch(30%_0.008_60)] hover:border-white/20 transition-all',
  ghost: 'rounded-lg px-4 py-2 text-sm font-medium text-[oklch(78%_0.008_60)] hover:bg-white/5 hover:text-[oklch(94%_0.005_60)] transition-all',
} as const;

// =============================================================================
// FORM PROGRESS
// =============================================================================

/**
 * Form progress indicator styles.
 */
export const formProgress = {
  bar: 'h-1 rounded-full bg-white/5 overflow-hidden',
  fill: 'h-full bg-gradient-to-r from-[oklch(74%_0.2_35)] to-[oklch(82%_0.17_37)] transition-all duration-500 ease-out',
  stepComplete: 'flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(72%_0.19_145)] text-[#1A1A1D] text-sm font-bold',
  stepActive: 'flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(74%_0.2_35)] text-[#1A1A1D] text-sm font-bold shadow-lg shadow-[oklch(74%_0.2_35)]/30',
  stepPending: 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 text-white/40 text-sm font-semibold',
} as const;

// =============================================================================
// FORM TYPE CARDS
// =============================================================================

/**
 * Type selection card styles (for choosing content type, etc.).
 */
export const typeCard = {
  default: 'group relative rounded-xl border border-white/10 bg-[oklch(26%_0.006_60)] p-6 cursor-pointer transition-all hover:border-white/20 hover:bg-[oklch(28%_0.008_60)] hover:shadow-md',
  selected: 'relative rounded-xl border-2 border-[oklch(74%_0.2_35)] bg-[oklch(28%_0.008_60)] p-6 shadow-lg shadow-[oklch(74%_0.2_35)]/20',
  icon: 'flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 mb-3',
} as const;

// =============================================================================
// FORM TAGS
// =============================================================================

/**
 * Tag input styles.
 */
export const formTag = {
  default: 'inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-[oklch(94%_0.005_60)] hover:bg-white/10 transition-colors',
  removable: 'inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-[oklch(94%_0.005_60)] hover:bg-white/10 transition-colors group',
  removeIcon: 'h-3 w-3 text-[oklch(72%_0.01_60)] hover:text-[oklch(70%_0.195_25)] cursor-pointer transition-colors',
} as const;

// =============================================================================
// FORM CODE BLOCK
// =============================================================================

/**
 * Code block styles within forms.
 */
export const formCode = {
  block: 'rounded-lg bg-[oklch(12%_0.003_60)] border border-white/10 p-4 font-mono text-sm overflow-x-auto',
  toolbar: 'flex items-center justify-between mb-2 text-xs text-[oklch(72%_0.01_60)]',
} as const;

// =============================================================================
// FORM UTILITIES
// =============================================================================

/**
 * Form dividers.
 */
export const formDivider = {
  default: 'border-t border-white/5 my-6',
  withText: 'relative flex items-center justify-center my-6 before:content-[""] before:flex-1 before:border-t before:border-white/5 after:content-[""] after:flex-1 after:border-t after:border-white/5',
} as const;

/**
 * Upload zone styling.
 */
export const uploadZone = {
  default: 'flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted',
} as const;

/**
 * Form stat display.
 */
export const formStat = {
  card: 'rounded-lg bg-white/5 p-4 text-center',
  number: 'text-3xl font-bold text-[oklch(74%_0.2_35)]',
  label: 'text-xs text-[oklch(72%_0.01_60)] mt-1',
} as const;

/**
 * Form quality indicators.
 */
export const formQuality = {
  low: 'text-[oklch(70%_0.195_25)]',
  medium: 'text-[oklch(75%_0.155_65)]',
  high: 'text-[oklch(72%_0.19_145)]',
  perfect: 'text-[oklch(74%_0.2_35)]',
} as const;

/**
 * Social proof card for forms.
 */
export const socialProof = {
  card: 'rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3',
  icon: 'h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5',
} as const;

/**
 * Hidden input (for file inputs, etc.).
 */
export const hiddenInput = 'hidden';
