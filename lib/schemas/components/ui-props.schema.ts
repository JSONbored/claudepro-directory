/**
 * UI Component Props Schema
 * Defines props for UI components like buttons, cards, etc.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import { stringArray } from '../primitives';
import { unifiedContentItemSchema } from './content-item.schema';

/**
 * ReactNode schema for React components
 */
export const reactNodeSchema = z.custom<ReactNode>((val) => {
  return (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    val === null ||
    val === undefined ||
    (typeof val === 'object' && val !== null && ('type' in val || '$$typeof' in val)) ||
    Array.isArray(val)
  );
}, 'Must be a valid React node');

/**
 * Button component props schema
 */
export const buttonPropsSchema = z.object({
  variant: z
    .enum(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'])
    .default('default'),
  size: z.enum(['default', 'sm', 'lg', 'icon']).default('default'),
  disabled: z.boolean().optional(),
  children: reactNodeSchema,
  onClick: z.function().optional(),
  type: z.enum(['button', 'submit', 'reset']).optional(),
  className: z.string().optional(),
});

export type ButtonProps = z.infer<typeof buttonPropsSchema>;

/**
 * Card component props schema
 */
export const cardPropsSchema = z.object({
  className: z.string().optional(),
  children: reactNodeSchema,
});

export type CardProps = z.infer<typeof cardPropsSchema>;

/**
 * Config card component props schema
 */
export const configCardPropsSchema = z.object({
  item: unifiedContentItemSchema,
  variant: z.enum(['default', 'detailed']).default('default'),
  showCategory: z.boolean().default(true),
  showActions: z.boolean().default(true),
  className: z.string().optional(),
});

export type ConfigCardProps = z.infer<typeof configCardPropsSchema>;

/**
 * Badge component props schema
 */
export const badgePropsSchema = z.object({
  variant: z.enum(['default', 'secondary', 'destructive', 'outline']).default('default'),
  children: reactNodeSchema,
  className: z.string().optional(),
});

export type BadgeProps = z.infer<typeof badgePropsSchema>;

/**
 * Input component props schema
 */
export const inputPropsSchema = z.object({
  type: z.string().default('text'),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  defaultValue: z.string().optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  className: z.string().optional(),
  onChange: z.function().optional(),
});

export type InputProps = z.infer<typeof inputPropsSchema>;

/**
 * Textarea component props schema
 */
export const textareaPropsSchema = z.object({
  placeholder: z.string().optional(),
  value: z.string().optional(),
  defaultValue: z.string().optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  rows: z.number().optional(),
  className: z.string().optional(),
  onChange: z.function().optional(),
});

export type TextareaProps = z.infer<typeof textareaPropsSchema>;

/**
 * Dropdown menu component props schema
 */
export const dropdownMenuPropsSchema = z.object({
  trigger: reactNodeSchema,
  children: reactNodeSchema,
  open: z.boolean().optional(),
  onOpenChange: z.function().optional(),
});

export type DropdownMenuProps = z.infer<typeof dropdownMenuPropsSchema>;

/**
 * Tabs component props schema
 */
export const tabsPropsSchema = z.object({
  value: z.string().optional(),
  defaultValue: z.string().optional(),
  onValueChange: z.function().optional(),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  children: reactNodeSchema,
  className: z.string().optional(),
});

export type TabsProps = z.infer<typeof tabsPropsSchema>;

/**
 * Carousel component props schema
 */
export const carouselPropsSchema = z.object({
  items: z.array(unifiedContentItemSchema),
  title: z.string().optional(),
  showNavigation: z.boolean().default(true),
  showDots: z.boolean().default(false),
  autoPlay: z.boolean().default(false),
  className: z.string().optional(),
});

export type CarouselProps = z.infer<typeof carouselPropsSchema>;

/**
 * Search component props schema
 */
export const searchPropsSchema = z.object({
  placeholder: z.string().optional(),
  value: z.string().optional(),
  onSearch: z.function(),
  onClear: z.function().optional(),
  className: z.string().optional(),
});

export type SearchProps = z.infer<typeof searchPropsSchema>;

/**
 * Filter component props schema
 */
export const filterPropsSchema = z.object({
  categories: stringArray,
  tags: stringArray,
  authors: stringArray.optional(),
  selectedCategories: stringArray,
  selectedTags: stringArray,
  selectedAuthors: stringArray.optional(),
  onFilterChange: z.function().optional(),
  onReset: z.function().optional(),
});

export type FilterProps = z.infer<typeof filterPropsSchema>;
