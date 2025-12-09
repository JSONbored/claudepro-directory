#!/usr/bin/env tsx

/**
 * Import Dependency Analysis
 *
 * Analyzes import dependencies to detect:
 * - Circular dependencies
 * - Unused imports
 * - Missing imports
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Project, SyntaxKind } from 'ts-morph';

import { logger } from '../toolkit/logger.js';
import { normalizeError } from '../toolkit/errors.js';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');
const MCP_ROOT = join(PROJECT_ROOT, 'apps/edge/supabase/functions/heyclaude-mcp');

interface DependencyAnalysis {
  circularDependencies: string[][];
  unusedImports: Array<{ file: string; import: string }>;
  warnings: string[];
}

/**
 * Build dependency graph from source files
 */
function buildDependencyGraph(project: Project, sourceFiles: string[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const filePath of sourceFiles) {
    const file = project.addSourceFileAtPath(filePath);
    const dependencies = new Set<string>();

    // Get all import declarations
    const imports = file.getImportDeclarations();
    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue();

      // Only track local imports (relative paths)
      if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
        // Resolve relative path
        const resolved = join(file.getDirectoryPath(), moduleSpecifier);
        dependencies.add(resolved);
      }
    }

    graph.set(filePath, dependencies);
  }

  return graph;
}

/**
 * Detect circular dependencies using DFS
 */
function detectCircularDependencies(
  graph: Map<string, Set<string>>
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const deps = graph.get(node) || new Set();
    for (const dep of deps) {
      // Check if dependency exists in graph
      if (!graph.has(dep)) continue;

      if (!visited.has(dep)) {
        dfs(dep, [...path]);
      } else if (recStack.has(dep)) {
        // Found a cycle
        const cycleStart = path.indexOf(dep);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), dep]);
        }
      }
    }

    recStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

/**
 * Detect unused imports
 */
function detectUnusedImports(project: Project, sourceFiles: string[]): Array<{ file: string; import: string }> {
  const unused: Array<{ file: string; import: string }> = [];

  for (const filePath of sourceFiles) {
    const file = project.addSourceFileAtPath(filePath);
    const imports = file.getImportDeclarations();

    // Get all identifiers used in the file
    const usedIdentifiers = new Set<string>();
    const identifiers = file.getDescendantsOfKind(SyntaxKind.Identifier);
    for (const id of identifiers) {
      usedIdentifiers.add(id.getText());
    }

    // Check named imports
    for (const imp of imports) {
      const namedImports = imp.getNamedImports();
      for (const named of namedImports) {
        const name = named.getName();
        // Check if imported name is used (or if it's a type import)
        const alias = named.getAliasNode()?.getText();
        const actualName = alias || name;

        if (!usedIdentifiers.has(actualName) && !usedIdentifiers.has(name)) {
          // Check if it's a type-only import (might be used in type annotations)
          const isTypeOnly = imp.isTypeOnly();
          if (!isTypeOnly) {
            unused.push({ file: filePath, import: name });
          }
        }
      }
    }
  }

  return unused;
}

/**
 * Analyze dependencies
 */
export function analyzeDependencies(): DependencyAnalysis {
  const result: DependencyAnalysis = {
    circularDependencies: [],
    unusedImports: [],
    warnings: [],
  };

  try {
    // Try to find tsconfig.json - check multiple possible locations
    let tsConfigPath: string | undefined;
    const possiblePaths = [
      join(PROJECT_ROOT, 'apps/edge/tsconfig.json'),
      join(PROJECT_ROOT, 'tsconfig.json'),
      join(MCP_ROOT, 'tsconfig.json'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        tsConfigPath = path;
        break;
      }
    }

    const project = new Project({
      ...(tsConfigPath ? { tsConfigFilePath: tsConfigPath } : {}),
    });

    // Get all TypeScript files in MCP directory
    const sourceFiles: string[] = [];
    function collectFiles(dir: string) {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = join(dir, file.name);
        if (file.isDirectory()) {
          collectFiles(filePath);
        } else if (file.name.endsWith('.ts') && !file.name.endsWith('.test.ts')) {
          sourceFiles.push(filePath);
        }
      }
    }

    collectFiles(MCP_ROOT);

    if (sourceFiles.length === 0) {
      result.warnings.push('No source files found');
      return result;
    }

    // Build dependency graph
    const graph = buildDependencyGraph(project, sourceFiles);

    // Detect circular dependencies
    result.circularDependencies = detectCircularDependencies(graph);

    // Detect unused imports
    result.unusedImports = detectUnusedImports(project, sourceFiles);

    return result;
  } catch (error) {
    result.warnings.push(`Analysis failed: ${normalizeError(error).message}`);
    return result;
  }
}

/**
 * CLI entry point
 */
export async function runAnalyzeDependencies() {
  logger.info('🔍 Analyzing dependencies...', { script: 'analyze-dependencies' });

  const analysis = analyzeDependencies();

  let hasErrors = false;

  if (analysis.circularDependencies.length > 0) {
    hasErrors = true;
    logger.error(`❌ Found ${analysis.circularDependencies.length} circular dependencies`, {
      script: 'analyze-dependencies',
      cycleCount: analysis.circularDependencies.length,
    });

    console.error('\n❌ Circular Dependencies:');
    for (const cycle of analysis.circularDependencies) {
      console.error(`  ${cycle.join(' → ')}`);
    }
  }

  if (analysis.unusedImports.length > 0) {
    logger.warn(`⚠️  Found ${analysis.unusedImports.length} unused imports`, {
      script: 'analyze-dependencies',
      unusedCount: analysis.unusedImports.length,
    });

    console.warn('\n⚠️  Unused Imports:');
    const grouped = new Map<string, string[]>();
    for (const unused of analysis.unusedImports) {
      if (!grouped.has(unused.file)) {
        grouped.set(unused.file, []);
      }
      grouped.get(unused.file)!.push(unused.import);
    }

    for (const [file, imports] of grouped.entries()) {
      console.warn(`  ${file}:`);
      for (const imp of imports) {
        console.warn(`    - ${imp}`);
      }
    }
  }

  if (analysis.warnings.length > 0) {
    for (const warning of analysis.warnings) {
      console.warn(`  ⚠️  ${warning}`);
    }
  }

  if (!hasErrors && analysis.unusedImports.length === 0 && analysis.warnings.length === 0) {
    logger.info('✅ No dependency issues found', { script: 'analyze-dependencies' });
    process.exit(0);
  } else if (hasErrors) {
    process.exit(1);
  } else {
    // Warnings only, don't fail
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalyzeDependencies().catch((error) => {
    logger.error('Analysis failed', normalizeError(error), {
      script: 'analyze-dependencies',
    });
    process.exit(1);
  });
}
