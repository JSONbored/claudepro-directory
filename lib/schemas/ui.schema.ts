/**
 * UI Component Schemas
 * Production-grade validation for all UI components
 * Centralized schemas for consistent UI component prop validation
 */

import { z } from 'zod';
import { reactNodeSchema } from './component.schema';
import { percentage, shortString } from './primitives';

/**
 * Common variant schemas used across UI components
 */
export const buttonVariantSchema = z.enum([
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
]);

export const buttonSizeSchema = z.enum(['default', 'sm', 'lg', 'icon']);

export const badgeVariantSchema = z.enum(['default', 'secondary', 'destructive', 'outline']);

/**
 * Button Props Schema
 */
export const buttonPropsSchema = z
  .object({
    variant: buttonVariantSchema.optional(),
    size: buttonSizeSchema.optional(),
    asChild: z.boolean().optional(),
    className: z.string().optional(),
    disabled: z.boolean().optional(),
    type: z.enum(['button', 'submit', 'reset']).optional(),
    onClick: z.function().optional(),
    children: z.union([z.string(), reactNodeSchema]).optional(), // ReactNode
  })
  .passthrough(); // Allow HTML button attributes

export type ButtonProps = z.infer<typeof buttonPropsSchema>;

/**
 * Badge Props Schema
 */
export const badgePropsSchema = z
  .object({
    variant: badgeVariantSchema.optional(),
    className: z.string().optional(),
    children: z.union([z.string(), reactNodeSchema]).optional(), // ReactNode
  })
  .passthrough(); // Allow HTML div attributes

export type BadgeProps = z.infer<typeof badgePropsSchema>;

/**
 * Config Badge Props Schema
 */
export const configBadgePropsSchema = z.object({
  label: shortString.min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  variant: badgeVariantSchema.optional(),
  className: z.string().optional(),
  icon: reactNodeSchema.optional(), // ReactNode
});

export type ConfigBadgeProps = z.infer<typeof configBadgePropsSchema>;

/**
 * Skeleton Props Schema
 */
export const skeletonPropsSchema = z
  .object({
    className: z.string().optional(),
    width: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
    variant: z.enum(['default', 'text', 'circular', 'rectangular']).optional(),
    animation: z.enum(['pulse', 'wave', 'none']).optional(),
  })
  .passthrough();

export type SkeletonProps = z.infer<typeof skeletonPropsSchema>;

/**
 * Sheet Content Props Schema
 */
export const sheetContentPropsSchema = z
  .object({
    side: z.enum(['top', 'right', 'bottom', 'left']).optional(),
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
    onOpenChange: z.function().optional(),
    onClose: z.function().optional(),
    onEscapeKeyDown: z.function().optional(),
    onPointerDownOutside: z.function().optional(),
  })
  .passthrough();

export type SheetContentProps = z.infer<typeof sheetContentPropsSchema>;

/**
 * Dropdown Menu Props Schema
 */
export const dropdownMenuPropsSchema = z.object({
  open: z.boolean().optional(),
  defaultOpen: z.boolean().optional(),
  onOpenChange: z.function().optional(),
  modal: z.boolean().optional(),
  dir: z.enum(['ltr', 'rtl']).optional(),
});

export type DropdownMenuProps = z.infer<typeof dropdownMenuPropsSchema>;

/**
 * Select Props Schema
 */
export const selectPropsSchema = z.object({
  value: z.string().optional(),
  defaultValue: z.string().optional(),
  onValueChange: z.function().optional(),
  open: z.boolean().optional(),
  defaultOpen: z.boolean().optional(),
  onOpenChange: z.function().optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  name: z.string().optional(),
  autoComplete: z.string().optional(),
  dir: z.enum(['ltr', 'rtl']).optional(),
});

export type SelectProps = z.infer<typeof selectPropsSchema>;

/**
 * Card Component Props Schemas
 */
export const cardPropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export const cardHeaderPropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export const cardTitlePropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
    as: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div']).optional(),
  })
  .passthrough();

export const cardDescriptionPropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export const cardContentPropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export const cardFooterPropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export type CardProps = z.infer<typeof cardPropsSchema>;
export type CardHeaderProps = z.infer<typeof cardHeaderPropsSchema>;
export type CardTitleProps = z.infer<typeof cardTitlePropsSchema>;
export type CardDescriptionProps = z.infer<typeof cardDescriptionPropsSchema>;
export type CardContentProps = z.infer<typeof cardContentPropsSchema>;
export type CardFooterProps = z.infer<typeof cardFooterPropsSchema>;

/**
 * Input Props Schema
 */
export const inputPropsSchema = z
  .object({
    type: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional(),
    defaultValue: z.union([z.string(), z.number()]).optional(),
    onChange: z.function().optional(),
    onBlur: z.function().optional(),
    onFocus: z.function().optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
    required: z.boolean().optional(),
    readOnly: z.boolean().optional(),
    autoFocus: z.boolean().optional(),
    autoComplete: z.string().optional(),
    name: z.string().optional(),
    id: z.string().optional(),
    className: z.string().optional(),
    maxLength: z.number().optional(),
    minLength: z.number().optional(),
    pattern: z.string().optional(),
  })
  .passthrough();

export type InputProps = z.infer<typeof inputPropsSchema>;

/**
 * Label Props Schema
 */
export const labelPropsSchema = z
  .object({
    htmlFor: z.string().optional(),
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
    required: z.boolean().optional(),
  })
  .passthrough();

export type LabelProps = z.infer<typeof labelPropsSchema>;

/**
 * Textarea Props Schema
 */
export const textareaPropsSchema = z
  .object({
    value: z.string().optional(),
    defaultValue: z.string().optional(),
    onChange: z.function().optional(),
    onBlur: z.function().optional(),
    onFocus: z.function().optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
    required: z.boolean().optional(),
    readOnly: z.boolean().optional(),
    autoFocus: z.boolean().optional(),
    name: z.string().optional(),
    id: z.string().optional(),
    className: z.string().optional(),
    rows: z.number().optional(),
    cols: z.number().optional(),
    maxLength: z.number().optional(),
    minLength: z.number().optional(),
  })
  .passthrough();

export type TextareaProps = z.infer<typeof textareaPropsSchema>;

/**
 * Checkbox Props Schema
 */
export const checkboxPropsSchema = z
  .object({
    checked: z.union([z.boolean(), z.literal('indeterminate')]).optional(),
    defaultChecked: z.boolean().optional(),
    onCheckedChange: z.function().optional(),
    disabled: z.boolean().optional(),
    required: z.boolean().optional(),
    name: z.string().optional(),
    value: z.string().optional(),
    id: z.string().optional(),
    className: z.string().optional(),
  })
  .passthrough();

export type CheckboxProps = z.infer<typeof checkboxPropsSchema>;

/**
 * Switch Props Schema
 */
export const switchPropsSchema = z
  .object({
    checked: z.boolean().optional(),
    defaultChecked: z.boolean().optional(),
    onCheckedChange: z.function().optional(),
    disabled: z.boolean().optional(),
    required: z.boolean().optional(),
    name: z.string().optional(),
    value: z.string().optional(),
    id: z.string().optional(),
    className: z.string().optional(),
  })
  .passthrough();

export type SwitchProps = z.infer<typeof switchPropsSchema>;

/**
 * Alert Props Schema
 */
export const alertPropsSchema = z
  .object({
    variant: z.enum(['default', 'destructive', 'success', 'warning']).optional(),
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export const alertTitlePropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export const alertDescriptionPropsSchema = z
  .object({
    className: z.string().optional(),
    children: reactNodeSchema.optional(), // ReactNode
  })
  .passthrough();

export type AlertProps = z.infer<typeof alertPropsSchema>;
export type AlertTitleProps = z.infer<typeof alertTitlePropsSchema>;
export type AlertDescriptionProps = z.infer<typeof alertDescriptionPropsSchema>;

/**
 * Progress Props Schema
 */
export const progressPropsSchema = z
  .object({
    value: percentage.optional(),
    max: z.number().optional(),
    className: z.string().optional(),
    indicatorClassName: z.string().optional(),
  })
  .passthrough();

export type ProgressProps = z.infer<typeof progressPropsSchema>;

/**
 * Avatar Props Schema
 */
export const avatarPropsSchema = z
  .object({
    src: z.string().optional(),
    alt: z.string().optional(),
    fallback: z.string().optional(),
    className: z.string().optional(),
    size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  })
  .passthrough();

export type AvatarProps = z.infer<typeof avatarPropsSchema>;

/**
 * Export all UI schemas for centralized access
 */
export const uiSchemas = {
  button: buttonPropsSchema,
  badge: badgePropsSchema,
  configBadge: configBadgePropsSchema,
  skeleton: skeletonPropsSchema,
  sheetContent: sheetContentPropsSchema,
  dropdownMenu: dropdownMenuPropsSchema,
  select: selectPropsSchema,
  card: {
    root: cardPropsSchema,
    header: cardHeaderPropsSchema,
    title: cardTitlePropsSchema,
    description: cardDescriptionPropsSchema,
    content: cardContentPropsSchema,
    footer: cardFooterPropsSchema,
  },
  input: inputPropsSchema,
  label: labelPropsSchema,
  textarea: textareaPropsSchema,
  checkbox: checkboxPropsSchema,
  switch: switchPropsSchema,
  alert: {
    root: alertPropsSchema,
    title: alertTitlePropsSchema,
    description: alertDescriptionPropsSchema,
  },
  progress: progressPropsSchema,
  avatar: avatarPropsSchema,
} as const;
