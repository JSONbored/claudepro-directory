/**
 * Supazod Configuration
 *
 * Production-grade configuration for auto-generating Zod schemas from Supabase types.
 * This file defines naming conventions, output patterns, and generation rules.
 *
 * Architecture:
 * - Single source of truth for schema generation
 * - Follows codebase naming conventions (PascalCase types, camelCase schemas)
 * - Configuration-driven (no hardcoded values)
 * - Future-proof (easy to update naming patterns)
 *
 * Generated Output Examples:
 * - Type: PublicUsersInsert, PublicUsersUpdate, PublicUsersRow
 * - Schema: publicUsersInsertSchema, publicUsersUpdateSchema, publicUsersRowSchema
 *
 * @see https://github.com/dohooo/supazod
 * @module supazod.config
 */

import type { Config } from 'supazod';

/**
 * Production-grade Supazod configuration
 *
 * Naming Strategy:
 * - Types: PascalCase with schema prefix (PublicUsersInsert)
 * - Schemas: camelCase with schema prefix + Schema suffix (publicUsersInsertSchema)
 * - Separator: None (clean concatenation)
 * - Capitalization: True (for professional naming)
 *
 * Why This Pattern:
 * - Consistent with TypeScript/JavaScript conventions
 * - Clear distinction between types and runtime validators
 * - Tree-shakeable (each schema is independently importable)
 * - Discoverable (IDE autocomplete friendly)
 *
 * IMPORTANT: This is configuration, not code.
 * Changes here affect ALL generated schemas.
 * Follow principle: Configuration over code duplication.
 */
const config: Config = {
  /**
   * Capitalize schema name in generated identifiers
   * Example: "public" → "Public"
   *
   * Rationale: Professional naming, matches database schema conventions
   */
  capitalizeSchema: true,

  /**
   * Capitalize table/view/enum names in generated identifiers
   * Example: "users" → "Users", "user_badges" → "UserBadges"
   *
   * Rationale: PascalCase for types (TypeScript convention)
   */
  capitalizeNames: true,

  /**
   * Separator between name components
   * Empty string = clean concatenation (PublicUsersInsert, not Public_Users_Insert)
   *
   * Rationale: Clean, readable identifiers without underscores
   */
  separator: '',

  /**
   * Pattern for table operation types (Insert, Update, Row)
   * Placeholders: {schema}, {table}, {operation}
   *
   * Output: PublicUsersInsert, PublicUsersUpdate, PublicUsersRow
   *
   * Rationale: Clear type names that indicate table and operation
   */
  tableOperationPattern: '{schema}{table}{operation}',

  /**
   * Pattern for table Zod schema constants
   * Placeholders: {schema}, {table}, {operation}
   *
   * Output: publicUsersInsertSchema, publicUsersUpdateSchema, publicUsersRowSchema
   *
   * Rationale:
   * - camelCase for runtime values (JavaScript convention)
   * - "Schema" suffix distinguishes validator from type
   * - Lowercase first character for proper camelCase
   */
  tableSchemaPattern: '{schema}{table}{operation}Schema',

  /**
   * Pattern for enum types
   * Placeholders: {schema}, {name}
   *
   * Output: PublicContentType, PublicBadgeCategory
   *
   * Rationale: Enums are types, use PascalCase
   */
  enumPattern: '{schema}{name}',

  /**
   * Pattern for enum Zod schema constants
   * Placeholders: {schema}, {name}
   *
   * Output: publicContentTypeSchema, publicBadgeCategorySchema
   *
   * Rationale: camelCase for runtime validators
   */
  enumSchemaPattern: '{schema}{name}Schema',

  /**
   * Pattern for function argument types
   * Placeholders: {schema}, {function}
   *
   * Output: PublicSearchUsersArgs
   *
   * Rationale: Clear indication this is function input
   */
  functionArgsPattern: '{schema}{function}Args',

  /**
   * Pattern for function argument Zod schemas
   * Placeholders: {schema}, {function}
   *
   * Output: publicSearchUsersArgsSchema
   */
  functionArgsSchemaPattern: '{schema}{function}ArgsSchema',

  /**
   * Pattern for function return types
   * Placeholders: {schema}, {function}
   *
   * Output: PublicSearchUsersReturns
   *
   * Rationale: Clear indication this is function output
   */
  functionReturnsPattern: '{schema}{function}Returns',

  /**
   * Pattern for function return Zod schemas
   * Placeholders: {schema}, {function}
   *
   * Output: publicSearchUsersReturnsSchema
   */
  functionReturnsSchemaPattern: '{schema}{function}ReturnsSchema',
};

/**
 * Export as default for Supazod CLI
 *
 * Usage:
 *   pnpm supazod --config supazod.config.ts
 *
 * Or via package.json script:
 *   "generate:zod": "supazod --config supazod.config.ts"
 */
export default config;
