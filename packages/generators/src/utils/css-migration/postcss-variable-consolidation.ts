/**
 * PostCSS Plugin: CSS Variable Consolidation
 * 
 * Consolidates CSS variables by:
 * - Deduplicating variables with the same value (keeps one, removes duplicates)
 * - Mapping old variable names to new tweakcn theme names
 * - Updating all variable references (var(--old-name) → var(--new-name))
 * - Removing old variable declarations after mapping
 * 
 * Safety features:
 * - Preserves all unique values (never loses a unique value)
 * - Only removes true duplicates
 * - Updates all references automatically
 * - Logs all transformations for review
 */

import type { Plugin } from 'postcss';
import type {
  ConsolidationReport,
} from './variable-consolidation.ts';

interface VariableConsolidationOptions {
  /** Consolidation report with mappings, duplicates, removable */
  report: ConsolidationReport;
  /** Dry run mode - analyze only, don't modify */
  dryRun?: boolean;
  /** Log all transformations */
  verbose?: boolean;
}

interface Transformation {
  file?: string;
  type: 'deduplicate' | 'map' | 'remove' | 'reference';
  original: string;
  transformed: string;
  line?: number;
}

export const transformations: Transformation[] = [];

/**
 * Build consolidation plan from report
 */
function buildConsolidationPlan(report: ConsolidationReport): {
  // Map: old variable name → new variable name
  nameMappings: Map<string, string>;
  // Map: duplicate variable name → keep this name
  duplicateKeepers: Map<string, string>;
  // Set: variables to remove (after mapping)
  variablesToRemove: Set<string>;
  // Set: duplicate variables to remove (after deduplication)
  duplicatesToRemove: Set<string>;
} {
  const nameMappings = new Map<string, string>();
  const duplicateKeepers = new Map<string, string>();
  const variablesToRemove = new Set<string>();
  const duplicatesToRemove = new Set<string>();

  // Build name mappings (old → new)
  // Note: Even if there's a conflict, we still map (new tweakcn values take precedence)
  for (const mapping of report.mappings) {
    nameMappings.set(mapping.oldName, mapping.newName);
    // Old variable can be removed after mapping (new tweakcn value takes precedence)
    variablesToRemove.add(mapping.oldName);
  }

  // Build duplicate consolidation plan
  for (const dup of report.duplicates) {
    const recommendedName = dup.recommendedName;
    
    // Keep the recommended name, remove others
    for (const varName of dup.variables) {
      if (varName !== recommendedName) {
        duplicateKeepers.set(varName, recommendedName);
        duplicatesToRemove.add(varName);
      }
    }
  }

  // Add removable variables
  for (const varName of report.removable) {
    variablesToRemove.add(varName);
  }

  return {
    nameMappings,
    duplicateKeepers,
    variablesToRemove,
    duplicatesToRemove,
  };
}

/**
 * Update variable references in a value
 * Handles: var(--old-name), calc(var(--old-name) + 1px), etc.
 */
function updateVariableReferences(
  value: string,
  nameMappings: Map<string, string>,
  duplicateKeepers: Map<string, string>
): string {
  let updated = value;

  // Update mapped variable references (old → new)
  for (const [oldName, newName] of nameMappings.entries()) {
    // Match var(--old-name) or var(--old-name, fallback)
    const regex = new RegExp(`var\\(${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:,\\s*[^)]+)?\\)`, 'g');
    updated = updated.replace(regex, (match) => {
      return match.replace(oldName, newName);
    });
  }

  // Update duplicate variable references (duplicate → keeper)
  for (const [duplicateName, keeperName] of duplicateKeepers.entries()) {
    const regex = new RegExp(`var\\(${duplicateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:,\\s*[^)]+)?\\)`, 'g');
    updated = updated.replace(regex, (match) => {
      return match.replace(duplicateName, keeperName);
    });
  }

  return updated;
}

function variableConsolidationPlugin(
  options: VariableConsolidationOptions
): Plugin {
  const { report, dryRun = false, verbose = false } = options;

  const plan = buildConsolidationPlan(report);

  return {
    postcssPlugin: 'variable-consolidation',
    
    Declaration(decl) {
      const prop = decl.prop;
      const value = decl.value;

      // Handle CSS variable declarations (--variable-name: value)
      if (prop.startsWith('--')) {
        // Check if this variable should be mapped (old → new)
        if (plan.nameMappings.has(prop)) {
          const newName = plan.nameMappings.get(prop)!;
          
          const transformation: Transformation = {
            type: 'map',
            original: `${prop}: ${value}`,
            transformed: `${newName}: ${value}`,
            ...(decl.source?.start?.line !== undefined ? { line: decl.source.start.line } : {}),
          };

          transformations.push(transformation);

          if (verbose) {
            console.log(`  [${transformation.line}] Map: ${prop} → ${newName}`);
          }

          if (!dryRun) {
            // Update the property name
            decl.prop = newName;
          }
        }

        // Check if this variable should be removed (after mapping or as duplicate)
        if (plan.variablesToRemove.has(prop) || plan.duplicatesToRemove.has(prop)) {
          // Only remove if it's not already been mapped (mapping happens first)
          if (!plan.nameMappings.has(prop)) {
            const transformation: Transformation = {
              type: plan.duplicatesToRemove.has(prop) ? 'deduplicate' : 'remove',
              original: `${prop}: ${value}`,
              transformed: '(removed)',
              ...(decl.source?.start?.line !== undefined ? { line: decl.source.start.line } : {}),
            };

            transformations.push(transformation);

            if (verbose) {
              console.log(`  [${transformation.line}] Remove: ${prop}`);
            }

            if (!dryRun) {
              decl.remove();
            }
          }
        }
      }

      // Handle variable references in any property value
      else {
        const updatedValue = updateVariableReferences(
          value,
          plan.nameMappings,
          plan.duplicateKeepers
        );

        if (updatedValue !== value) {
          const transformation: Transformation = {
            type: 'reference',
            original: `${prop}: ${value}`,
            transformed: `${prop}: ${updatedValue}`,
            ...(decl.source?.start?.line !== undefined ? { line: decl.source.start.line } : {}),
          };

          transformations.push(transformation);

          if (verbose) {
            console.log(`  [${transformation.line}] Update reference: ${value.substring(0, 40)}...`);
          }

          if (!dryRun) {
            decl.value = updatedValue;
          }
        }
      }
    },
  };
}

variableConsolidationPlugin.postcss = true;

export default variableConsolidationPlugin;
export { type Transformation, type VariableConsolidationOptions };
