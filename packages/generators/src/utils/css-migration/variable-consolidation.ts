/**
 * CSS Variable Consolidation Analysis
 * 
 * Analyzes CSS variables to identify:
 * - Duplicate values that can be consolidated
 * - Old variable names that map to new tweakcn theme names
 * - Variables that can be removed (replaced by new theme)
 * 
 * This is a read-only analysis tool - it doesn't modify files.
 */

import * as postcss from 'postcss';

export interface VariableMapping {
  oldName: string;
  newName: string;
  value: string;
  reason: string;
}

export interface ConsolidationOpportunity {
  variables: string[];
  value: string;
  recommendedName: string;
  files: string[];
}

export interface ConsolidationReport {
  mappings: VariableMapping[];
  duplicates: ConsolidationOpportunity[];
  removable: string[];
  conflicts: Array<{
    oldName: string;
    newName: string;
    oldValue: string;
    newValue: string;
    recommendation: string;
  }>;
}

/**
 * Map old variable names to new tweakcn theme names
 */
const VARIABLE_MAPPINGS: Array<{
  oldPattern: RegExp;
  newName: string;
  reason: string;
}> = [
  // Background colors
  { oldPattern: /^--color-bg-primary$/, newName: '--background', reason: 'Maps to tweakcn background' },
  { oldPattern: /^--color-bg-secondary$/, newName: '--card', reason: 'Maps to tweakcn card' },
  { oldPattern: /^--color-text-primary$/, newName: '--foreground', reason: 'Maps to tweakcn foreground' },
  { oldPattern: /^--color-text-secondary$/, newName: '--muted-foreground', reason: 'Maps to tweakcn muted-foreground' },
  
  // Accent colors
  { oldPattern: /^--color-accent$/, newName: '--accent', reason: 'Maps to tweakcn accent' },
  { oldPattern: /^--color-accent-foreground$/, newName: '--accent-foreground', reason: 'Maps to tweakcn accent-foreground' },
  
  // Primary colors
  { oldPattern: /^--color-primary$/, newName: '--primary', reason: 'Maps to tweakcn primary' },
  { oldPattern: /^--color-primary-foreground$/, newName: '--primary-foreground', reason: 'Maps to tweakcn primary-foreground' },
  
  // Secondary colors
  { oldPattern: /^--color-secondary$/, newName: '--secondary', reason: 'Maps to tweakcn secondary' },
  { oldPattern: /^--color-secondary-foreground$/, newName: '--secondary-foreground', reason: 'Maps to tweakcn secondary-foreground' },
  
  // Muted colors
  { oldPattern: /^--color-muted$/, newName: '--muted', reason: 'Maps to tweakcn muted' },
  { oldPattern: /^--color-muted-foreground$/, newName: '--muted-foreground', reason: 'Maps to tweakcn muted-foreground' },
  
  // Destructive colors
  { oldPattern: /^--color-destructive$/, newName: '--destructive', reason: 'Maps to tweakcn destructive' },
  { oldPattern: /^--color-destructive-foreground$/, newName: '--destructive-foreground', reason: 'Maps to tweakcn destructive-foreground' },
  
  // Border colors
  { oldPattern: /^--color-border-default$/, newName: '--border', reason: 'Maps to tweakcn border' },
  { oldPattern: /^--color-input$/, newName: '--input', reason: 'Maps to tweakcn input' },
  { oldPattern: /^--color-ring$/, newName: '--ring', reason: 'Maps to tweakcn ring' },
  
  // Card colors
  { oldPattern: /^--color-card$/, newName: '--card', reason: 'Maps to tweakcn card' },
  { oldPattern: /^--color-card-foreground$/, newName: '--card-foreground', reason: 'Maps to tweakcn card-foreground' },
  
  // Popover colors
  { oldPattern: /^--color-popover$/, newName: '--popover', reason: 'Maps to tweakcn popover' },
  { oldPattern: /^--color-popover-foreground$/, newName: '--popover-foreground', reason: 'Maps to tweakcn popover-foreground' },
];

/**
 * Analyze CSS file for variable consolidation opportunities
 */
export function analyzeVariableConsolidation(
  css: string,
  _file: string
): {
  variables: Map<string, { value: string; line?: number }>;
  duplicates: Map<string, Array<{ name: string; line?: number }>>;
} {
  const root = postcss.default.parse(css);
  const variables = new Map<string, { value: string; line?: number }>();
  const valueToVars = new Map<string, Array<{ name: string; line?: number }>>();

  root.walkRules((rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        const name = decl.prop;
        const value = decl.value.trim();
        
        variables.set(name, {
          value,
          ...(decl.source?.start?.line !== undefined ? { line: decl.source.start.line } : {}),
        });

        // Group by value to find duplicates
        if (!valueToVars.has(value)) {
          valueToVars.set(value, []);
        }
        valueToVars.get(value)!.push({
          name,
          ...(decl.source?.start?.line !== undefined ? { line: decl.source.start.line } : {}),
        });
      }
    });
  });

  // Find duplicates (same value used by multiple variables)
  const duplicates = new Map<string, Array<{ name: string; line?: number }>>();
  for (const [value, vars] of valueToVars.entries()) {
    if (vars.length > 1) {
      // Only include if variables have different names
      const uniqueNames = new Set(vars.map(v => v.name));
      if (uniqueNames.size > 1) {
        duplicates.set(value, vars);
      }
    }
  }

  return { variables, duplicates };
}

/**
 * Find variable mapping opportunities
 */
export function findVariableMappings(
  variables: Map<string, { value: string; line?: number }>
): VariableMapping[] {
  const mappings: VariableMapping[] = [];

  for (const [oldName, { value }] of variables.entries()) {
    for (const mapping of VARIABLE_MAPPINGS) {
      if (mapping.oldPattern.test(oldName)) {
        mappings.push({
          oldName,
          newName: mapping.newName,
          value,
          reason: mapping.reason,
        });
        break;
      }
    }
  }

  return mappings;
}

/**
 * Find variables that can be removed (replaced by new theme)
 */
export function findRemovableVariables(
  variables: Map<string, { value: string; line?: number }>,
  mappings: VariableMapping[]
): string[] {
  const removable: string[] = [];
  const mappedOldNames = new Set(mappings.map(m => m.oldName));

  for (const [name] of variables.entries()) {
    // Variables that are mapped can potentially be removed
    if (mappedOldNames.has(name)) {
      removable.push(name);
    }
  }

  return removable;
}

/**
 * Find conflicts between old and new variable values
 */
export function findConflicts(
  oldVariables: Map<string, { value: string; line?: number }>,
  newVariables: Map<string, { value: string; line?: number }>,
  mappings: VariableMapping[]
): ConsolidationReport['conflicts'] {
  const conflicts: ConsolidationReport['conflicts'] = [];

  for (const mapping of mappings) {
    const oldVar = oldVariables.get(mapping.oldName);
    const newVar = newVariables.get(mapping.newName);

    if (oldVar && newVar && oldVar.value !== newVar.value) {
      conflicts.push({
        oldName: mapping.oldName,
        newName: mapping.newName,
        oldValue: oldVar.value,
        newValue: newVar.value,
        recommendation: `Values differ - need to decide which to keep or merge`,
      });
    }
  }

  return conflicts;
}

/**
 * Generate consolidation report
 */
export function generateConsolidationReport(
  css: string,
  file: string
): ConsolidationReport {
  const { variables, duplicates } = analyzeVariableConsolidation(css, file);
  const mappings = findVariableMappings(variables);
  const removable = findRemovableVariables(variables, mappings);

  // Convert duplicates to opportunities
  const duplicateOpportunities: ConsolidationOpportunity[] = [];
  for (const [value, vars] of duplicates.entries()) {
    if (vars.length > 1) {
      // Recommend using the shortest name or most semantic name
      const recommended = vars.reduce((prev, curr) => 
        curr.name.length < prev.name.length ? curr : prev
      );
      
      duplicateOpportunities.push({
        variables: vars.map(v => v.name),
        value: value.substring(0, 80) + (value.length > 80 ? '...' : ''),
        recommendedName: recommended.name,
        files: [file],
      });
    }
  }

  return {
    mappings,
    duplicates: duplicateOpportunities,
    removable,
    conflicts: [], // Will be populated when comparing old vs new
  };
}
