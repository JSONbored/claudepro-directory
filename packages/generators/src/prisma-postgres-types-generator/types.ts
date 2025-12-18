/**
 * Generator configuration and type definitions
 */

export interface GeneratorConfig {
  /** Output directory for generated files */
  output: string;
  /** PostgreSQL schema to introspect (default: 'public') */
  schema: string;
  /** Generate TypeScript types (default: true) */
  generateTypes: boolean;
  /** Generate Zod schemas (default: true) */
  generateZod: boolean;
  /** Include only functions matching these patterns (optional) */
  includeFunctions?: string[];
  /** Exclude functions matching these patterns (optional) */
  excludeFunctions?: string[];
  /** Exclude composite types matching these patterns (optional) */
  excludeCompositeTypes?: string[];
}

export interface GeneratedFile {
  /** File content */
  content: string;
  /** Exported names from this file */
  exports: string[];
}

export interface GeneratorOutput {
  /** Generated file contents keyed by name */
  files: Record<string, string>;
  /** All exported names */
  exports: string[];
}
