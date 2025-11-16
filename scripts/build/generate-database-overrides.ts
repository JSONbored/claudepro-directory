#!/usr/bin/env tsx
/**
 * Auto-generate all database type overrides
 *
 * Generates:
 * 1. Enum arrays (from database.types.ts) - FULLY AUTO-GENERATED
 * 2. Table overrides (arrays and enums) - FULLY AUTO-GENERATED
 * 3. CHECK constraint types - FULLY AUTO-GENERATED
 * 4. RPC return type skeletons - PRESERVES MANUAL EDITS
 *
 * Usage:
 *   pnpm generate:db-overrides
 *
 * Strategy:
 * - All generated content goes into database-overrides.ts in the AUTO-GENERATED SECTION
 * - Manual edits (view overrides, function overrides, app types) go in the MANUAL SECTION
 * - The script preserves the MANUAL SECTION when regenerating
 * - RPC return types can be manually edited (TODO sections) and will be preserved
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '@/src/lib/logger';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');

const DATABASE_TYPES_FILE = join(ROOT, 'src/types/database.types.ts');
const DATABASE_OVERRIDES_FILE = join(ROOT, 'src/types/database-overrides.ts');

// ============================================================================
// Types
// ============================================================================

interface EnumDefinition {
  name: string;
  values: string[];
}

interface ColumnOverride {
  tableName: string;
  columnName: string;
  overrideType: 'array' | 'enum';
  baseType?: string;
  enumName?: string;
}

interface CheckConstraint {
  tableName: string;
  constraintName: string;
  columnName: string;
  allowedValues: string[];
  typeName: string;
}

interface RpcFunction {
  name: string;
  returnType: string;
  arguments: string;
  hasExistingType: boolean;
  hasManualDefinition: boolean;
}

// ============================================================================
// Enum Arrays
// ============================================================================

function extractEnums(content: string): EnumDefinition[] {
  const enums: EnumDefinition[] = [];
  const enumsMatch = content.match(/Enums:\s*\{([\s\S]*?)\n\s*\}\s*CompositeTypes:/);
  if (!enumsMatch) {
    throw new Error('Could not find Enums section in database.types.ts');
  }

  const enumsSection = enumsMatch[1];
  const lines = enumsSection.split('\n');
  let currentEnum: { name: string; values: string[] } | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const enumNameMatch = trimmedLine.match(/^(\w+):\s*(.*)$/);

    if (enumNameMatch) {
      if (currentEnum && currentEnum.values.length > 0) {
        enums.push({ name: currentEnum.name, values: currentEnum.values });
      }

      const name = enumNameMatch[1];
      const rest = enumNameMatch[2];

      if (rest?.includes('"')) {
        const valuePattern = /"([^"]+)"/g;
        const values: string[] = [];
        let valueMatch: RegExpExecArray | null = valuePattern.exec(rest);
        while (valueMatch !== null) {
          values.push(valueMatch[1]);
          valueMatch = valuePattern.exec(rest);
        }
        if (values.length > 0) {
          enums.push({ name, values });
        }
        currentEnum = null;
      } else {
        currentEnum = { name, values: [] };
      }
    } else if (currentEnum && trimmedLine.startsWith('|')) {
      const valueMatch = trimmedLine.match(/\|\s*"([^"]+)"/);
      if (valueMatch) {
        currentEnum.values.push(valueMatch[1]);
      }
    } else if (trimmedLine && !trimmedLine.startsWith('|') && currentEnum) {
      if (currentEnum.values.length > 0) {
        enums.push({ name: currentEnum.name, values: currentEnum.values });
      }
      currentEnum = null;
    }
  }

  if (currentEnum && currentEnum.values.length > 0) {
    enums.push({ name: currentEnum.name, values: currentEnum.values });
  }

  return enums;
}

function toTypeName(enumName: string): string {
  return enumName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function generateEnumArrays(enums: EnumDefinition[]): string {
  if (enums.length === 0) return '';

  const typeExports: string[] = [];
  const valueArrays: string[] = [];
  const typeGuards: string[] = [];

  for (const enumDef of enums) {
    const typeName = toTypeName(enumDef.name);
    const constantName = `${enumDef.name.toUpperCase()}_VALUES`;
    const guardName = `is${typeName}`;

    typeExports.push(`export type ${typeName} = Enums<'${enumDef.name}'>;`);

    const valuesStr = enumDef.values.map((v) => `  '${v}'`).join(',\n');
    valueArrays.push(`
/**
 * Valid values for ${enumDef.name} enum
 */
export const ${constantName} = [
${valuesStr},
] as const satisfies readonly ${typeName}[];`);

    typeGuards.push(`
/**
 * Type guard for ${enumDef.name} enum values
 */
export function ${guardName}(value: string): value is ${typeName} {
  return ${constantName}.includes(value as ${typeName});
}`);
  }

  return `
// ============================================================================
// Enum Arrays
// ============================================================================

${typeExports.join('\n')}
${valueArrays.join('\n')}
${typeGuards.join('\n')}

/**
 * Generic enum validation helper
 */
export function isValidEnum<T extends string>(
  value: unknown,
  validValues: readonly T[]
): value is T {
  return typeof value === 'string' && validValues.includes(value as T);
}
`;
}

// ============================================================================
// Table Overrides
// ============================================================================

function getArrayAndEnumColumns(): ColumnOverride[] {
  const arrayColumns = [
    { table: 'category_configs', column: 'metadata_fields' },
    { table: 'changelog', column: 'contributors' },
    { table: 'changelog', column: 'keywords' },
    { table: 'contact_commands', column: 'aliases' },
    { table: 'content', column: 'features' },
    { table: 'content', column: 'tags' },
    { table: 'content', column: 'use_cases' },
    { table: 'content_generation_tracking', column: 'validation_errors' },
    { table: 'content_submissions', column: 'spam_reasons' },
    { table: 'content_submissions', column: 'tags' },
    { table: 'metadata_templates', column: 'default_keywords' },
    { table: 'metadata_templates', column: 'title_formulas' },
    { table: 'newsletter_subscriptions', column: 'categories_visited' },
    { table: 'newsletter_subscriptions', column: 'resend_topics' },
    { table: 'structured_data_config', column: 'default_keywords' },
    { table: 'structured_data_config', column: 'default_requirements' },
  ];

  const enumColumns = [
    { table: 'announcements', column: 'priority', enum: 'announcement_priority' },
    { table: 'announcements', column: 'variant', enum: 'announcement_variant' },
    { table: 'app_settings', column: 'environment', enum: 'environment' },
    { table: 'app_settings', column: 'setting_type', enum: 'setting_type' },
    { table: 'category_configs', column: 'category', enum: 'content_category' },
    { table: 'contact_commands', column: 'action_type', enum: 'contact_action_type' },
    { table: 'contact_commands', column: 'confetti_variant', enum: 'confetti_variant' },
    { table: 'contact_submissions', column: 'category', enum: 'contact_category' },
    { table: 'contact_submissions', column: 'status', enum: 'submission_status' },
    { table: 'content_submissions', column: 'status', enum: 'submission_status' },
    { table: 'content_submissions', column: 'submission_type', enum: 'submission_type' },
    { table: 'content_templates', column: 'category', enum: 'content_category' },
    { table: 'form_field_configs', column: 'field_type', enum: 'form_field_type' },
    { table: 'form_field_configs', column: 'grid_column', enum: 'form_grid_column' },
    { table: 'form_field_configs', column: 'icon_position', enum: 'form_icon_position' },
    { table: 'form_field_definitions', column: 'content_type', enum: 'content_category' },
    { table: 'form_field_definitions', column: 'field_scope', enum: 'field_scope' },
    { table: 'form_field_definitions', column: 'field_type', enum: 'field_type' },
    { table: 'form_field_definitions', column: 'grid_column', enum: 'grid_column' },
    { table: 'form_field_definitions', column: 'icon_position', enum: 'icon_position' },
    { table: 'jobs', column: 'payment_status', enum: 'payment_status' },
    { table: 'jobs', column: 'status', enum: 'job_status' },
    { table: 'jobs', column: 'workplace', enum: 'workplace_type' },
    { table: 'newsletter_subscriptions', column: 'source', enum: 'newsletter_source' },
    { table: 'notifications', column: 'priority', enum: 'notification_priority' },
    { table: 'notifications', column: 'type', enum: 'notification_type' },
    { table: 'tier_display_config', column: 'tier', enum: 'user_tier' },
    { table: 'user_interactions', column: 'interaction_type', enum: 'interaction_type' },
    { table: 'users', column: 'tier', enum: 'user_tier' },
    { table: 'webhook_events', column: 'direction', enum: 'webhook_direction' },
    { table: 'webhook_events', column: 'source', enum: 'webhook_source' },
  ];

  const overrides: ColumnOverride[] = [];

  for (const { table, column } of arrayColumns) {
    overrides.push({
      tableName: table,
      columnName: column,
      overrideType: 'array',
      baseType: 'string',
    });
  }

  for (const { table, column, enum: enumName } of enumColumns) {
    overrides.push({ tableName: table, columnName: column, overrideType: 'enum', enumName });
  }

  overrides.push({
    tableName: 'content',
    columnName: 'category',
    overrideType: 'enum',
    enumName: 'content_category',
  });

  return overrides;
}

function generateTableOverrides(overrides: ColumnOverride[]): string {
  if (overrides.length === 0) {
    return `
// ============================================================================
// Table Overrides
// ============================================================================

export type DatabaseWithTableOverrides = {
  public: {
    Tables: DatabaseGenerated['public']['Tables'];
  };
};
`;
  }

  const byTable = new Map<string, ColumnOverride[]>();
  for (const override of overrides) {
    if (!byTable.has(override.tableName)) {
      byTable.set(override.tableName, []);
    }
    const tableOverrides = byTable.get(override.tableName);
    if (tableOverrides) {
      tableOverrides.push(override);
    }
  }

  const tableOverrides: string[] = [];

  for (const [tableName, cols] of byTable.entries()) {
    const omitFields = cols.map((c) => `'${c.columnName}'`).join(' | ');
    const overrideFields: string[] = [];

    for (const col of cols) {
      if (col.overrideType === 'array') {
        overrideFields.push(`          ${col.columnName}: ${col.baseType}[];`);
      } else if (col.overrideType === 'enum') {
        overrideFields.push(
          `          ${col.columnName}: DatabaseGenerated['public']['Enums']['${col.enumName}'];`
        );
      }
    }

    tableOverrides.push(`
      ${tableName}: {
        Row: Omit<DatabaseGenerated['public']['Tables']['${tableName}']['Row'], ${omitFields}> & {
${overrideFields.join('\n')}
        };
        Insert: DatabaseGenerated['public']['Tables']['${tableName}']['Insert'];
        Update: DatabaseGenerated['public']['Tables']['${tableName}']['Update'];
        Relationships: DatabaseGenerated['public']['Tables']['${tableName}']['Relationships'];
      };`);
  }

  return `
// ============================================================================
// Table Overrides
// ============================================================================

export type DatabaseWithTableOverrides = {
  public: {
    Tables: Omit<DatabaseGenerated['public']['Tables'], ${Array.from(byTable.keys())
      .map((t) => `'${t}'`)
      .join(' | ')}> & {${tableOverrides.join('')}
    };
  };
};
`;
}

// ============================================================================
// CHECK Constraints
// ============================================================================

function parseCheckConstraint(
  tableName: string,
  constraintName: string,
  definition: string
): CheckConstraint | null {
  let match = definition.match(/CHECK\s*\(\s*(\w+)\s+IN\s*\(([^)]+)\)\s*\)/i);
  if (!match) {
    match = definition.match(
      /CHECK\s*\(\s*\(\s*(\w+)\s*=\s*ANY\s*\(\s*ARRAY\[([^\]]+)\]\s*\)\s*\)\s*\)/i
    );
  }
  if (!match) return null;

  const columnName = match[1];
  const values = match[2]
    .split(',')
    .map((v) =>
      v
        .trim()
        .replace(/::\w+$/, '')
        .replace(/^['"]|['"]$/g, '')
    )
    .filter((v) => v.length > 0);

  if (values.length === 0) return null;

  const typeName =
    tableName === 'jobs' && columnName === 'category'
      ? 'JobCategory'
      : tableName.charAt(0).toUpperCase() +
        tableName.slice(1) +
        columnName.charAt(0).toUpperCase() +
        columnName.slice(1);

  return { tableName, constraintName, columnName, allowedValues: values, typeName };
}

function getCheckConstraints(): CheckConstraint[] {
  const constraints: CheckConstraint[] = [];
  const jobsCategory = parseCheckConstraint(
    'jobs',
    'jobs_category_enum_check',
    "CHECK ((category = ANY (ARRAY['engineering'::text, 'design'::text, 'product'::text, 'marketing'::text, 'sales'::text, 'support'::text, 'research'::text, 'data'::text, 'operations'::text, 'leadership'::text, 'consulting'::text, 'education'::text, 'other'::text])))"
  );
  if (jobsCategory) constraints.push(jobsCategory);
  return constraints;
}

function generateCheckConstraints(constraints: CheckConstraint[]): string {
  if (constraints.length === 0) {
    return `
// ============================================================================
// CHECK Constraints
// ============================================================================

// No CHECK constraint types needed at this time.
`;
  }

  const typeExports: string[] = [];
  const valueArrays: string[] = [];
  const typeGuards: string[] = [];

  for (const constraint of constraints) {
    const typeName = constraint.typeName;
    const valuesName = `${typeName.toUpperCase()}_VALUES`;
    const guardName = `is${typeName}`;

    typeExports.push(
      `export type ${typeName} = ${constraint.allowedValues.map((v) => `'${v}'`).join(' | ')};`
    );

    valueArrays.push(`
/**
 * Valid values for ${constraint.tableName}.${constraint.columnName} CHECK constraint
 */
export const ${valuesName} = [
  ${constraint.allowedValues.map((v) => `'${v}'`).join(',\n  ')}
] as const satisfies readonly ${typeName}[];`);

    typeGuards.push(`
/**
 * Type guard for ${typeName} values
 */
export function ${guardName}(value: string): value is ${typeName} {
  return ${valuesName}.includes(value as ${typeName});
}`);
  }

  return `
// ============================================================================
// CHECK Constraints
// ============================================================================

${typeExports.join('\n')}
${valueArrays.join('\n')}
${typeGuards.join('\n')}
`;
}

// ============================================================================
// RPC Skeletons (Preserves Manual Edits)
// ============================================================================

function getJsonbRpcFunctions(): RpcFunction[] {
  const rpcNames = [
    'add_bookmark',
    'approve_submission',
    'batch_add_bookmarks',
    'batch_insert_user_interactions',
    'build_aggregate_rating_schema',
    'build_breadcrumb_json_ld',
    'build_changelog_json_ld',
    'build_complete_content_schemas',
    'build_faq_schema',
    'build_how_to_schema',
    'build_item_list_schema',
    'build_job_discord_embed',
    'build_job_posting_schema',
    'build_learning_resource_schema',
    'build_organization_schema',
    'build_person_schema',
    'build_software_application_schema',
    'build_source_code_schema',
    'build_static_route_json_ld',
    'create_job_with_payment',
    'delete_company',
    'delete_job',
    'filter_jobs',
    'generate_command_installation',
    'generate_content_field',
    'generate_hook_installation',
    'generate_llms_txt_content',
    'generate_markdown_export',
    'generate_metadata_complete',
    'generate_readme_data',
    'get_account_dashboard',
    'get_all_structured_data_configs',
    'get_api_health',
    'get_app_settings',
    'get_category_config',
    'get_category_configs_with_features',
    'get_changelog_detail',
    'get_changelog_overview',
    'get_changelog_with_category_stats',
    'get_collection_detail_with_items',
    'get_collection_items_grouped',
    'get_community_directory',
    'get_companies_list',
    'get_company_profile',
    'get_content_detail_complete',
    'get_content_paginated',
    'get_content_paginated_slim',
    'get_content_templates',
    'get_database_fingerprint',
    'get_due_sequence_emails',
    'get_enriched_content',
    'get_enriched_content_list',
    'get_form_field_config',
    'get_form_fields_grouped',
    'get_generation_config',
    'get_homepage_complete',
    'get_homepage_content_enriched',
    'get_job_detail',
    'get_jobs_list',
    'get_my_submissions',
    'get_navigation_menu',
    'get_pending_submissions',
    'get_performance_baseline',
    'get_quiz_configuration',
    'get_recent_merged',
    'get_recommendations',
    'get_reviews_with_stats',
    'get_similar_content',
    'get_sponsorship_analytics',
    'get_structured_data_config',
    'get_submission_dashboard',
    'get_submission_stats',
    'get_top_contributors',
    'get_user_activity_summary',
    'get_user_activity_timeline',
    'get_user_affinities',
    'get_user_collection_detail',
    'get_user_companies',
    'get_user_dashboard',
    'get_user_identities',
    'get_user_interaction_summary',
    'get_user_library',
    'get_user_profile',
    'get_user_recent_interactions',
    'get_user_settings',
    'get_weekly_digest',
    'manage_collection',
    'manage_company',
    'manage_review',
    'refresh_profile_from_oauth',
    'reject_submission',
    'remove_bookmark',
    'reorder_collection_items',
    'submit_content_for_review',
    'subscribe_newsletter',
    'toggle_follow',
    'toggle_job_status',
    'toggle_review_helpful',
    'track_sponsored_event',
    'track_user_interaction',
    'unlink_oauth_provider',
    'update_job',
    'update_user_profile',
  ];

  return rpcNames.map((name) => ({
    name,
    returnType: 'jsonb',
    arguments: '',
    hasExistingType: false,
    hasManualDefinition: false,
  }));
}

function checkExistingRpcType(rpcName: string): boolean {
  try {
    const content = readFileSync(DATABASE_OVERRIDES_FILE, 'utf-8');
    const pascalName = rpcName
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    const prefixes = [
      'Get',
      'Add',
      'Remove',
      'Update',
      'Toggle',
      'Approve',
      'Reject',
      'Batch',
      'Track',
      'Manage',
      'Delete',
      'Create',
      'Generate',
      'Build',
      'Calculate',
      'Subscribe',
      'Unlink',
      'Refresh',
      'Reorder',
    ];
    return (
      prefixes.some((prefix) => content.includes(`${prefix}${pascalName}Return`)) ||
      content.includes(`'${rpcName}':`)
    );
  } catch {
    return false;
  }
}

/**
 * Check if an RPC has a manual definition in the skeletons file
 * (not just a TODO - an actual type definition)
 * @deprecated This function is currently unused but kept for potential future use
 */
function _hasManualRpcDefinition(rpcName: string, skeletonsContent: string): boolean {
  let prefix = 'Get';
  let nameWithoutPrefix = rpcName;

  if (rpcName.startsWith('add_')) {
    prefix = 'Add';
    nameWithoutPrefix = rpcName.slice(4);
  } else if (rpcName.startsWith('create_')) {
    prefix = 'Create';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('remove_')) {
    prefix = 'Remove';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('delete_')) {
    prefix = 'Delete';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('update_')) {
    prefix = 'Update';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('toggle_')) {
    prefix = 'Toggle';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('approve_')) {
    prefix = 'Approve';
    nameWithoutPrefix = rpcName.slice(8);
  } else if (rpcName.startsWith('reject_')) {
    prefix = 'Reject';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('batch_')) {
    prefix = 'Batch';
    nameWithoutPrefix = rpcName.slice(6);
  } else if (rpcName.startsWith('track_')) {
    prefix = 'Track';
    nameWithoutPrefix = rpcName.slice(6);
  } else if (rpcName.startsWith('manage_')) {
    prefix = 'Manage';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('generate_')) {
    prefix = 'Generate';
    nameWithoutPrefix = rpcName.slice(9);
  } else if (rpcName.startsWith('build_')) {
    prefix = 'Build';
    nameWithoutPrefix = rpcName.slice(6);
  } else if (rpcName.startsWith('subscribe_')) {
    prefix = 'Subscribe';
    nameWithoutPrefix = rpcName.slice(10);
  } else if (rpcName.startsWith('unlink_')) {
    prefix = 'Unlink';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('refresh_')) {
    prefix = 'Refresh';
    nameWithoutPrefix = rpcName.slice(8);
  } else if (rpcName.startsWith('reorder_')) {
    prefix = 'Reorder';
    nameWithoutPrefix = rpcName.slice(8);
  }

  const typeName = `${prefix}${nameWithoutPrefix
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')}Return`;

  // Validate typeName format to prevent ReDoS
  if (!/^[A-Z][A-Za-z0-9_]*Return$/.test(typeName)) {
    return false;
  }

  // Check if it's a real definition (not just TODO)
  // Use simple substring/indexOf checks instead of complex regex
  const exportTypeMarker = `export type ${typeName}`;
  const exportIndex = skeletonsContent.indexOf(exportTypeMarker);
  if (exportIndex === -1) {
    return false;
  }

  // Check for balanced braces after the type name
  const afterMarker = skeletonsContent.slice(exportIndex + exportTypeMarker.length);
  let braceCount = 0;
  let foundOpenBrace = false;
  for (const char of afterMarker) {
    if (char === '{') {
      braceCount++;
      foundOpenBrace = true;
    } else if (char === '}') {
      braceCount--;
      if (foundOpenBrace && braceCount === 0) {
        // Found a complete type definition
        return !skeletonsContent.includes('// TODO: Replace with actual structure');
      }
    }
  }

  return false;
}

function generateRpcSkeleton(rpc: RpcFunction): string {
  let prefix = 'Get';
  let nameWithoutPrefix = rpc.name;

  if (rpc.name.startsWith('add_')) {
    prefix = 'Add';
    nameWithoutPrefix = rpc.name.slice(4);
  } else if (rpc.name.startsWith('create_')) {
    prefix = 'Create';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('remove_')) {
    prefix = 'Remove';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('delete_')) {
    prefix = 'Delete';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('update_')) {
    prefix = 'Update';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('toggle_')) {
    prefix = 'Toggle';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('approve_')) {
    prefix = 'Approve';
    nameWithoutPrefix = rpc.name.slice(8);
  } else if (rpc.name.startsWith('reject_')) {
    prefix = 'Reject';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('batch_')) {
    prefix = 'Batch';
    nameWithoutPrefix = rpc.name.slice(6);
  } else if (rpc.name.startsWith('track_')) {
    prefix = 'Track';
    nameWithoutPrefix = rpc.name.slice(6);
  } else if (rpc.name.startsWith('manage_')) {
    prefix = 'Manage';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('generate_')) {
    prefix = 'Generate';
    nameWithoutPrefix = rpc.name.slice(9);
  } else if (rpc.name.startsWith('build_')) {
    prefix = 'Build';
    nameWithoutPrefix = rpc.name.slice(6);
  } else if (rpc.name.startsWith('subscribe_')) {
    prefix = 'Subscribe';
    nameWithoutPrefix = rpc.name.slice(10);
  } else if (rpc.name.startsWith('unlink_')) {
    prefix = 'Unlink';
    nameWithoutPrefix = rpc.name.slice(7);
  } else if (rpc.name.startsWith('refresh_')) {
    prefix = 'Refresh';
    nameWithoutPrefix = rpc.name.slice(8);
  } else if (rpc.name.startsWith('reorder_')) {
    prefix = 'Reorder';
    nameWithoutPrefix = rpc.name.slice(8);
  }

  const pascalName = nameWithoutPrefix
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  const typeName = `${prefix}${pascalName}Return`;

  // Always generate the type definition
  // hasExistingType is only for reporting, not for skipping
  return `/**
 * ${rpc.name} RPC return type
 * TODO: Define the actual return structure
 */
export type ${typeName} = Json; // TODO: Replace with actual structure`;
}

/**
 * Extract manual section from database-overrides.ts
 * Returns everything between "MANUAL SECTION" markers
 */
function extractManualSection(content: string): string {
  const lines = content.split('\n');
  let inManualSection = false;
  const manualLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start of manual section
    if (
      line.includes('// MANUAL SECTION - EDITABLE') ||
      line.includes(
        '// ============================================================================\n// MANUAL SECTION'
      )
    ) {
      inManualSection = true;
      // Skip the marker lines
      continue;
    }

    // End of manual section: end of file or next major section
    if (inManualSection) {
      if (
        line.includes(
          '// ============================================================================'
        ) &&
        i > 0 &&
        lines[i - 1].trim() === ''
      ) {
        // Check if this is the end marker
        break;
      }
      manualLines.push(line);
    }
  }

  return manualLines.join('\n').trim();
}

/**
 * Preserve manual RPC definitions from existing file
 */
function preserveManualRpcDefinitions(existingContent: string, rpcName: string): string | null {
  let prefix = 'Get';
  let nameWithoutPrefix = rpcName;

  if (rpcName.startsWith('add_')) {
    prefix = 'Add';
    nameWithoutPrefix = rpcName.slice(4);
  } else if (rpcName.startsWith('create_')) {
    prefix = 'Create';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('remove_')) {
    prefix = 'Remove';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('delete_')) {
    prefix = 'Delete';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('update_')) {
    prefix = 'Update';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('toggle_')) {
    prefix = 'Toggle';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('approve_')) {
    prefix = 'Approve';
    nameWithoutPrefix = rpcName.slice(8);
  } else if (rpcName.startsWith('reject_')) {
    prefix = 'Reject';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('batch_')) {
    prefix = 'Batch';
    nameWithoutPrefix = rpcName.slice(6);
  } else if (rpcName.startsWith('track_')) {
    prefix = 'Track';
    nameWithoutPrefix = rpcName.slice(6);
  } else if (rpcName.startsWith('manage_')) {
    prefix = 'Manage';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('generate_')) {
    prefix = 'Generate';
    nameWithoutPrefix = rpcName.slice(9);
  } else if (rpcName.startsWith('build_')) {
    prefix = 'Build';
    nameWithoutPrefix = rpcName.slice(6);
  } else if (rpcName.startsWith('subscribe_')) {
    prefix = 'Subscribe';
    nameWithoutPrefix = rpcName.slice(10);
  } else if (rpcName.startsWith('unlink_')) {
    prefix = 'Unlink';
    nameWithoutPrefix = rpcName.slice(7);
  } else if (rpcName.startsWith('refresh_')) {
    prefix = 'Refresh';
    nameWithoutPrefix = rpcName.slice(8);
  } else if (rpcName.startsWith('reorder_')) {
    prefix = 'Reorder';
    nameWithoutPrefix = rpcName.slice(8);
  }

  const typeName = `${prefix}${nameWithoutPrefix
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')}Return`;

  // Extract the full type definition using line-by-line parsing for reliability
  const lines = existingContent.split('\n');
  let startIdx = -1;
  let endIdx = -1;
  let braceCount = 0;
  let foundExport = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find the start - look for /** comment block containing rpcName
    if (startIdx === -1) {
      if (line.trim().startsWith('/**') && i + 1 < lines.length && lines[i + 1].includes(rpcName)) {
        startIdx = i;
      }
    }

    // Once we've found the start, track the type definition
    if (startIdx !== -1) {
      // Look for the export type statement
      if (line.includes(`export type ${typeName}`)) {
        foundExport = true;
        // Count braces on this line
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
      } else if (foundExport) {
        // Count braces to find the end
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // End when we hit a semicolon and braces are balanced
        if (line.includes(';') && braceCount === 0) {
          endIdx = i + 1;
          break;
        }
        // Or if we hit the next definition/comment (but not if we're still in the same definition)
        if (braceCount === 0 && i > startIdx + 2) {
          if (line.trim().startsWith('/**') && !line.includes(rpcName)) {
            endIdx = i;
            break;
          }
          if (line.trim().startsWith('export type') && !line.includes(typeName)) {
            endIdx = i;
            break;
          }
        }
      }
    }
  }

  if (startIdx !== -1 && foundExport) {
    endIdx = endIdx === -1 ? lines.length : endIdx;
    const definition = lines.slice(startIdx, endIdx).join('\n').trim();

    // Only preserve if it's NOT a TODO and has a complete type definition
    if (
      !(
        definition.includes('// TODO: Replace with actual structure') ||
        definition.includes('= Json; // TODO')
      ) &&
      definition.includes('export type') &&
      definition.includes(';')
    ) {
      return definition;
    }
  }

  return null;
}

function generateRpcSkeletons(rpcs: RpcFunction[], preserveManual = true): string {
  if (rpcs.length === 0) {
    return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY (except TODO sections)
 * 
 * Generated by scripts/build/generate-database-overrides.ts
 * 
 * IMPORTANT: You can manually edit TODO sections in this file.
 * The generator will preserve your manual edits when regenerating.
 * 
 * To regenerate: pnpm generate:db-overrides
 */
`;
  }

  // Read existing consolidated file to preserve manual RPC definitions
  let existingContent = '';
  if (preserveManual && existsSync(DATABASE_OVERRIDES_FILE)) {
    try {
      existingContent = readFileSync(DATABASE_OVERRIDES_FILE, 'utf-8');
    } catch {
      // File doesn't exist or can't be read, that's okay
    }
  }

  const skeletons: string[] = [];
  const existingCount = rpcs.filter((rpc) => rpc.hasExistingType).length;
  const manualCount = rpcs.filter((rpc) => rpc.hasManualDefinition).length;
  const todoCount = rpcs.filter((rpc) => !(rpc.hasExistingType || rpc.hasManualDefinition)).length;

  for (const rpc of rpcs) {
    // Always try to preserve manual definitions first
    if (rpc.hasManualDefinition && preserveManual && existingContent) {
      const preservedDef = preserveManualRpcDefinitions(existingContent, rpc.name);
      if (preservedDef) {
        skeletons.push(preservedDef);
        continue;
      }
    }

    // Always generate the type definition (even if referenced elsewhere)
    // hasExistingType is just for reporting, not for skipping generation
    skeletons.push(generateRpcSkeleton(rpc));
  }

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY (except TODO sections)
 * 
 * Generated by scripts/build/generate-database-overrides.ts
 * 
 * IMPORTANT: You can manually edit TODO sections in this file.
 * The generator will preserve your manual edits when regenerating.
 * 
 * Status: ${rpcs.length} total RPCs | ${existingCount} in database-overrides.ts | ${manualCount} manually defined here | ${todoCount} need typing
 * 
 * To regenerate: pnpm generate:db-overrides
 */
import type { Json } from './database.types';

${skeletons.join('\n\n')}
`;
}

// ============================================================================
// Main
// ============================================================================

function main() {
  logger.info('🔄 Generating all database type overrides...\n', {
    script: 'generate-database-overrides',
  });

  try {
    let enumArraysCode = '';
    let tableOverridesCode = '';
    let checkConstraintsCode = '';
    let rpcSkeletonsCode = '';

    // 0. Enum Arrays (requires database.types.ts)
    logger.info('📊 Generating enum arrays...', { script: 'generate-database-overrides' });
    try {
      const content = readFileSync(DATABASE_TYPES_FILE, 'utf-8');
      const enums = extractEnums(content);
      enumArraysCode = generateEnumArrays(enums);
      logger.info(`   ✅ ${enums.length} enum types with arrays and type guards`, {
        script: 'generate-database-overrides',
        enumCount: enums.length,
      });
    } catch (error) {
      logger.warn(
        `   ⚠️  Could not generate enum arrays: ${error instanceof Error ? error.message : String(error)}`,
        { script: 'generate-database-overrides' }
      );
      logger.warn('      Make sure database.types.ts exists (run pnpm sync:db:types first)', {
        script: 'generate-database-overrides',
      });
    }

    // 1. Table Overrides
    logger.info('📋 Generating table overrides...', { script: 'generate-database-overrides' });
    const tableOverrides = getArrayAndEnumColumns();
    tableOverridesCode = generateTableOverrides(tableOverrides);
    logger.info(
      `   ✅ ${tableOverrides.length} columns across ${new Set(tableOverrides.map((o) => o.tableName)).size} tables`,
      {
        script: 'generate-database-overrides',
        columnCount: tableOverrides.length,
        tableCount: new Set(tableOverrides.map((o) => o.tableName)).size,
      }
    );

    // 2. CHECK Constraints
    logger.info('🔒 Generating CHECK constraint types...', {
      script: 'generate-database-overrides',
    });
    const checkConstraints = getCheckConstraints();
    checkConstraintsCode = generateCheckConstraints(checkConstraints);
    logger.info(`   ✅ ${checkConstraints.length} constraint types`, {
      script: 'generate-database-overrides',
      constraintCount: checkConstraints.length,
    });

    // 3. RPC Skeletons (preserves manual edits)
    logger.info('🔧 Generating RPC return type skeletons...', {
      script: 'generate-database-overrides',
    });
    const rpcs = getJsonbRpcFunctions();

    // Check existing types in database-overrides.ts
    const rpcsWithStatus = rpcs.map((rpc) => ({
      ...rpc,
      hasExistingType: checkExistingRpcType(rpc.name),
    }));

    // Check for manual definitions in consolidated file
    let existingOverridesContent = '';
    if (existsSync(DATABASE_OVERRIDES_FILE)) {
      try {
        existingOverridesContent = readFileSync(DATABASE_OVERRIDES_FILE, 'utf-8');
        for (const rpc of rpcsWithStatus) {
          // Check if this RPC has a manual definition (not TODO)
          const preserved = preserveManualRpcDefinitions(existingOverridesContent, rpc.name);
          rpc.hasManualDefinition = preserved !== null;
        }
      } catch {
        // File doesn't exist, that's okay
      }
    }

    rpcSkeletonsCode = generateRpcSkeletons(rpcsWithStatus, true);
    const existingCount = rpcsWithStatus.filter((r) => r.hasExistingType).length;
    const manualCount = rpcsWithStatus.filter((r) => r.hasManualDefinition).length;
    const todoCount = rpcsWithStatus.filter(
      (r) => !(r.hasExistingType || r.hasManualDefinition)
    ).length;
    logger.info(
      `   ✅ ${rpcs.length} RPCs (${existingCount} in database-overrides.ts, ${manualCount} manually defined, ${todoCount} need typing)`,
      {
        script: 'generate-database-overrides',
        rpcCount: rpcs.length,
        existingCount,
        manualCount,
        todoCount,
      }
    );

    // Extract manual section from existing file (if it exists)
    let manualSection = '';
    if (existsSync(DATABASE_OVERRIDES_FILE)) {
      try {
        const existingContent = readFileSync(DATABASE_OVERRIDES_FILE, 'utf-8');
        manualSection = extractManualSection(existingContent);
      } catch {
        // File doesn't exist or can't be read, use default
      }
    }

    // Default manual section if none found
    if (!manualSection) {
      manualSection = `type DatabaseWithViewOverrides = {
  public: {
    Tables: DatabaseWithTableOverrides['public']['Tables'];
    Enums: DatabaseGenerated['public']['Enums'];
    Functions: DatabaseGenerated['public']['Functions'];
    Views: DatabaseGenerated['public']['Views'];
  };
};

export type Database = DatabaseWithViewOverrides;

export type { Json } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

/**
 * Application-specific types (not from database)
 */
export type CopyType = 'llmstxt' | 'markdown' | 'code' | 'link';

/**
 * Type aliases for TABLE (SETOF) returns
 * These are already properly typed in database.types.ts - kept as convenience aliases
 */
export type GetTrendingMetricsReturn =
  DatabaseGenerated['public']['Functions']['get_trending_metrics_with_content']['Returns'];
export type GetPopularContentReturn =
  DatabaseGenerated['public']['Functions']['get_popular_content']['Returns'];`;
    }

    // Extract RPC types from skeletons code (remove header/imports, keep types)
    const lines = rpcSkeletonsCode.split('\n');
    let startIdx = -1;
    // Find where RPC types start (after imports)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import type') && lines[i].includes('from')) {
        // Find the last import line
        let j = i;
        while (
          j < lines.length &&
          (lines[j].includes('import type') ||
            lines[j].trim() === '' ||
            lines[j].trim().startsWith('//'))
        ) {
          j++;
        }
        startIdx = j;
        break;
      }
    }

    const rpcTypes =
      startIdx > 0
        ? lines.slice(startIdx).join('\n').trim()
        : rpcSkeletonsCode.split('\n').slice(25).join('\n').trim();

    // Write consolidated file
    const consolidatedOutput = `/**
 * Database Type Overrides
 *
 * This file contains all database type overrides in a single consolidated location.
 *
 * Structure:
 * - AUTO-GENERATED SECTION: Enums, tables, CHECK constraints, RPC return types
 *   (regenerated by: pnpm generate:db-overrides)
 * - MANUAL SECTION: View overrides, function overrides, application types
 *   (preserved by generator)
 */

// ============================================================================
// AUTO-GENERATED SECTION - DO NOT EDIT MANUALLY
// ============================================================================
// Generated by: pnpm generate:db-overrides
// This section is regenerated automatically. Manual edits will be lost.
// ============================================================================

import type { Database as DatabaseGenerated, Json } from './database.types';

// Helper types
type Enums<T extends keyof DatabaseGenerated['public']['Enums']> =
  DatabaseGenerated['public']['Enums'][T];

type Tables<T extends keyof DatabaseGenerated['public']['Tables']> =
  DatabaseGenerated['public']['Tables'][T]['Row'];

// ============================================================================
// Enums, Tables, CHECK Constraints
// ============================================================================

${enumArraysCode}
${tableOverridesCode}
${checkConstraintsCode}

// ============================================================================
// RPC Return Types
// ============================================================================
// IMPORTANT: You can manually edit TODO sections in RPC return types.
// The generator will preserve your manual edits when regenerating.

${rpcTypes}

// ============================================================================
// MANUAL SECTION - EDITABLE
// ============================================================================
// View overrides, function overrides, application types
// This section is preserved by the generator.
// ============================================================================

${manualSection}
`;

    writeFileSync(DATABASE_OVERRIDES_FILE, consolidatedOutput, 'utf-8');

    logger.info('\n✅ All database overrides generated successfully!', {
      script: 'generate-database-overrides',
    });
    logger.info(`   📄 Consolidated file: ${DATABASE_OVERRIDES_FILE}`, {
      script: 'generate-database-overrides',
      outputFile: DATABASE_OVERRIDES_FILE,
    });
    logger.info('📝 Next steps:');
    logger.info('   1. Fill in TODO sections in RPC return types (in auto-generated section)');
    logger.info(
      '   2. Your manual edits in RPC types and manual section will be preserved on regeneration\n',
      {
        script: 'generate-database-overrides',
      }
    );
  } catch (error) {
    logger.error(
      '❌ Error generating database overrides',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'generate-database-overrides',
      }
    );
    process.exit(1);
  }
}

main();
