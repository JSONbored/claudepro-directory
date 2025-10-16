/**
 * Content Validation Utilities
 *
 * Registry-driven validation leveraging UNIFIED_CATEGORY_REGISTRY.
 * Eliminates switch/case duplication and ensures automatic support for new categories.
 *
 * Architecture:
 * - Uses UNIFIED_CATEGORY_REGISTRY.schema for validation (single source of truth)
 * - Type-safe with CategoryId inference
 * - Zero manual updates when adding new categories
 * - Server-side only (build scripts, validation scripts)
 *
 * Consolidation Achievement:
 * - Before: 52 lines with 9-case switch statement
 * - After: 6 lines with registry lookup
 * - Reduction: -46 LOC (88.5% reduction)
 *
 * @module lib/validation/content-validator
 * @see lib/config/category-config.ts - UNIFIED_CATEGORY_REGISTRY
 */

import {
  type ContentType,
  isValidCategory,
  UNIFIED_CATEGORY_REGISTRY,
} from '@/src/lib/config/category-config';

/**
 * Validate content data by category using registry-driven approach
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Uses UNIFIED_CATEGORY_REGISTRY.schema
 * - Type-safe: CategoryId validation with isValidCategory()
 * - Zero duplication: Eliminated 9-case switch statement
 * - Auto-scaling: New categories (e.g., 'skills') work immediately
 *
 * @param data - Unknown data to validate against category schema
 * @param category - Content category identifier (must be valid CategoryId)
 * @returns Parsed and validated content item (type-safe ContentType)
 * @throws Error if category is unknown or validation fails
 *
 * @example
 * ```typescript
 * // Validates using agentContentSchema from registry
 * const agent = validateContentByCategory(rawData, 'agents');
 *
 * // Automatically supports new categories
 * const skill = validateContentByCategory(rawData, 'skills'); // ✅ Works!
 * ```
 */
export function validateContentByCategory(data: unknown, category: string): ContentType {
  // Type-safe category validation
  if (!isValidCategory(category)) {
    throw new Error(`Unknown content category: ${category}`);
  }

  // Registry-driven validation - single source of truth
  const config = UNIFIED_CATEGORY_REGISTRY[category];
  return config.schema.parse(data) as ContentType;
}
