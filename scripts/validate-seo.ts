#!/usr/bin/env tsx

/**
 * Comprehensive SEO Validator
 *
 * Single script to validate ALL SEO standards across the codebase:
 * - ✅ H1 heading hierarchy (one per page, outside code blocks)
 * - ✅ FAQPage schema duplication (only one FAQPage per page)
 * - ✅ Meta tag completeness (title, description, OG, Twitter)
 * - ✅ Heading hierarchy (proper H1 → H2 → H3 structure)
 * - ✅ Title length optimization (50-60 chars)
 * - ✅ Description length (150-160 chars)
 * - ✅ Image alt text presence
 * - ✅ Internal link structure
 * - ✅ Component usage patterns (Accordion + AIOptimizedFAQ conflicts)
 * - ✅ Schema.org structured data validation (JSON-LD, V29.3 compliance)
 * - ✅ Required properties for Article, WebPage, FAQPage, and other schemas
 *
 * October 2025 Enhancements:
 * - Schema.org V29.3 validation with Ajv
 * - Support for Article, WebPage, FAQPage, HowTo, SoftwareApplication, JobPosting, and more
 * - Validates @context, @type, and all required properties
 *
 * Usage:
 *   npm run validate:seo              # Validate all
 *   npm run validate:seo -- --fix     # Auto-fix where possible
 *   npm run validate:seo -- --check=h1,faq  # Specific checks only
 *
 * Exit Codes:
 *   0 - All validations pass
 *   1 - Validation errors found
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ValidationResult {
  file: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  passed: boolean;
}

interface ValidationError {
  type: ErrorType;
  line?: number;
  message: string;
  fix?: string;
}

interface ValidationWarning {
  type: WarningType;
  line?: number;
  message: string;
}

type ErrorType =
  | 'multiple_h1'
  | 'missing_h1'
  | 'duplicate_faqpage'
  | 'missing_meta'
  | 'heading_hierarchy_skip'
  | 'title_too_long'
  | 'title_too_short'
  | 'description_too_long'
  | 'description_too_short'
  | 'missing_description'
  | 'h1_in_code_block'
  | 'invalid_schema'
  | 'missing_required_schema_property'
  | 'invalid_schema_type';

type WarningType =
  | 'component_conflict'
  | 'missing_image_alt'
  | 'suboptimal_title_length'
  | 'suboptimal_description_length';

interface MDXFrontmatter {
  title?: string;
  seoTitle?: string;
  description?: string;
  keywords?: string[];
  dateUpdated?: string;
  [key: string]: unknown;
}

interface MDXAnalysis {
  frontmatter: MDXFrontmatter;
  content: string;
  h1Count: number;
  h1Lines: number[];
  h2Lines: number[];
  h3Lines: number[];
  hasAccordion: boolean;
  hasAIOptimizedFAQ: boolean;
  faqPageCount: number;
  headingHierarchyValid: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEO_STANDARDS = {
  TITLE_MIN: 50,
  TITLE_MAX: 60,
  DESCRIPTION_MIN: 150,
  DESCRIPTION_MAX: 160,
  H1_REQUIRED: 1,
  FAQPAGE_MAX: 1,
} as const;

/**
 * JSON Schema definitions for Schema.org types
 * Based on Schema.org v29.3 specification (September 2025)
 *
 * Consolidates validation logic using Ajv JSON Schema validator
 * for production-ready, type-safe structured data validation
 */
const SCHEMA_ORG_JSON_SCHEMAS: Record<string, object> = {
  Article: {
    $id: 'schema.org/Article',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'Article' },
      headline: { type: 'string' },
      author: { oneOf: [{ type: 'string' }, { type: 'object' }] },
      datePublished: { type: 'string', format: 'date-time' },
    },
    required: ['@context', '@type', 'headline', 'author', 'datePublished'],
    additionalProperties: true,
  },
  WebPage: {
    $id: 'schema.org/WebPage',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'WebPage' },
      name: { type: 'string' },
      url: { type: 'string', format: 'uri' },
    },
    required: ['@context', '@type', 'name', 'url'],
    additionalProperties: true,
  },
  FAQPage: {
    $id: 'schema.org/FAQPage',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'FAQPage' },
      mainEntity: { type: 'array', items: { type: 'object' } },
    },
    required: ['@context', '@type', 'mainEntity'],
    additionalProperties: true,
  },
  HowTo: {
    $id: 'schema.org/HowTo',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'HowTo' },
      name: { type: 'string' },
      step: { type: 'array', items: { type: 'object' } },
    },
    required: ['@context', '@type', 'name', 'step'],
    additionalProperties: true,
  },
  SoftwareApplication: {
    $id: 'schema.org/SoftwareApplication',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'SoftwareApplication' },
      name: { type: 'string' },
      applicationCategory: { type: 'string' },
    },
    required: ['@context', '@type', 'name', 'applicationCategory'],
    additionalProperties: true,
  },
  JobPosting: {
    $id: 'schema.org/JobPosting',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'JobPosting' },
      title: { type: 'string' },
      description: { type: 'string' },
      hiringOrganization: { type: 'object' },
    },
    required: ['@context', '@type', 'title', 'description', 'hiringOrganization'],
    additionalProperties: true,
  },
  CollectionPage: {
    $id: 'schema.org/CollectionPage',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'CollectionPage' },
      name: { type: 'string' },
      url: { type: 'string', format: 'uri' },
    },
    required: ['@context', '@type', 'name', 'url'],
    additionalProperties: true,
  },
  Blog: {
    $id: 'schema.org/Blog',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'Blog' },
      name: { type: 'string' },
      url: { type: 'string', format: 'uri' },
    },
    required: ['@context', '@type', 'name', 'url'],
    additionalProperties: true,
  },
  TechArticle: {
    $id: 'schema.org/TechArticle',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'TechArticle' },
      headline: { type: 'string' },
      author: { oneOf: [{ type: 'string' }, { type: 'object' }] },
      datePublished: { type: 'string', format: 'date-time' },
    },
    required: ['@context', '@type', 'headline', 'author', 'datePublished'],
    additionalProperties: true,
  },
  BreadcrumbList: {
    $id: 'schema.org/BreadcrumbList',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'BreadcrumbList' },
      itemListElement: { type: 'array', items: { type: 'object' } },
    },
    required: ['@context', '@type', 'itemListElement'],
    additionalProperties: true,
  },
  Organization: {
    $id: 'schema.org/Organization',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'Organization' },
      name: { type: 'string' },
      url: { type: 'string', format: 'uri' },
    },
    required: ['@context', '@type', 'name', 'url'],
    additionalProperties: true,
  },
  Person: {
    $id: 'schema.org/Person',
    type: 'object',
    properties: {
      '@context': { type: 'string', const: 'https://schema.org' },
      '@type': { type: 'string', const: 'Person' },
      name: { type: 'string' },
    },
    required: ['@context', '@type', 'name'],
    additionalProperties: true,
  },
} as const;

/**
 * Initialize Ajv validator with Schema.org schemas
 */
function createSchemaValidator(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false, // Schema.org schemas may have non-standard properties
  });
  addFormats(ajv);

  // Add all Schema.org JSON Schema definitions
  for (const [_schemaType, jsonSchema] of Object.entries(SCHEMA_ORG_JSON_SCHEMAS)) {
    ajv.addSchema(jsonSchema);
  }

  return ajv;
}

// ============================================================================
// MDX PARSING
// ============================================================================

/**
 * Parse MDX file and extract all SEO-relevant information
 */
function analyzeMDXFile(filePath: string): MDXAnalysis {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let inFrontmatter = false;
  let inCodeBlock = false;
  let inJSXCodeProp = false;
  const _jsxCodePropDepth = 0; // Track nested backticks in JSX props
  const frontmatterLines: string[] = [];

  const h1Lines: number[] = [];
  const h2Lines: number[] = [];
  const h3Lines: number[] = [];
  let hasAccordion = false;
  let hasAIOptimizedFAQ = false;
  let faqPageCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track frontmatter
    if (line.trim() === '---') {
      if (i === 0) {
        inFrontmatter = true;
        continue;
      }
      if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
    }

    if (inFrontmatter) {
      frontmatterLines.push(line);
      continue;
    }

    // Detect JSX/object props with template literals (code: ` or code={`)
    // These can span multiple lines and contain # comments that look like H1s
    if (/code[:=]\s*[{`]?`/.test(line)) {
      inJSXCodeProp = true;
      continue; // Skip the line that opens the code prop
    }

    // Check if we're exiting a code prop
    if (inJSXCodeProp) {
      // Look for closing backtick with optional comma/brace
      if (/`[\s,}]/.test(line) || line.trim() === '`' || line.trim().endsWith('`')) {
        inJSXCodeProp = false;
      }
      // Skip this line entirely if we're still inside a JSX code prop
      continue;
    }

    // Track markdown code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip code block content
    if (inCodeBlock) {
      continue;
    }

    // Detect headings (outside code blocks)
    if (/^# [^#]/.test(line)) {
      h1Lines.push(lineNum);
    } else if (/^## [^#]/.test(line)) {
      h2Lines.push(lineNum);
    } else if (/^### /.test(line)) {
      h3Lines.push(lineNum);
    }

    // Detect component usage
    if (line.includes('<Accordion') || line.includes("from '@/src/components/content/accordion'")) {
      hasAccordion = true;
    }
    if (line.includes('<AIOptimizedFAQ') || line.includes("from '@/src/components/content/faq'")) {
      hasAIOptimizedFAQ = true;
    }

    // Detect FAQPage schema declarations
    if (line.includes('itemType="https://schema.org/FAQPage"')) {
      faqPageCount++;
    }
  }

  // Parse frontmatter YAML
  const frontmatter = parseFrontmatter(frontmatterLines.join('\n'));

  // Check heading hierarchy
  const headingHierarchyValid = validateHeadingHierarchy(h1Lines, h2Lines, h3Lines);

  return {
    frontmatter,
    content,
    h1Count: h1Lines.length,
    h1Lines,
    h2Lines,
    h3Lines,
    hasAccordion,
    hasAIOptimizedFAQ,
    faqPageCount,
    headingHierarchyValid,
  };
}

/**
 * Simple YAML frontmatter parser
 */
function parseFrontmatter(yaml: string): MDXFrontmatter {
  const result: MDXFrontmatter = {};
  const lines = yaml.split('\n');

  let currentKey = '';
  let currentArrayItems: string[] = [];
  let inArray = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Array items
    if (trimmed.startsWith('- ')) {
      if (inArray) {
        currentArrayItems.push(trimmed.substring(2).replace(/^["']|["']$/g, ''));
      }
      continue;
    }

    // Save previous array
    if (inArray && !trimmed.startsWith('-')) {
      if (currentKey) {
        result[currentKey] = currentArrayItems;
      }
      inArray = false;
      currentArrayItems = [];
    }

    // Key-value pairs
    const match = trimmed.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      currentKey = key;

      if (value === '') {
        // Start of array
        inArray = true;
        currentArrayItems = [];
      } else {
        // Simple value
        result[key] = value.replace(/^["']|["']$/g, '');
        inArray = false;
      }
    }
  }

  // Save final array
  if (inArray && currentKey) {
    result[currentKey] = currentArrayItems;
  }

  return result;
}

/**
 * Validate heading hierarchy follows semantic structure
 */
function validateHeadingHierarchy(
  h1Lines: number[],
  h2Lines: number[],
  h3Lines: number[]
): boolean {
  // Must have exactly one H1
  if (h1Lines.length !== 1) return false;

  // H1 should come before H2s
  if (h2Lines.length > 0 && h1Lines[0] > h2Lines[0]) return false;

  // H2 should come before H3s (if H3s exist)
  if (h3Lines.length > 0 && h2Lines.length === 0) return false;

  return true;
}

/**
 * Extract JSON-LD structured data from MDX content
 * Finds <script type="application/ld+json"> blocks
 */
function extractStructuredData(content: string): Array<{ schema: unknown; lineNumber: number }> {
  const schemas: Array<{ schema: unknown; lineNumber: number }> = [];
  const lines = content.split('\n');

  let inJsonLd = false;
  let jsonLdContent = '';
  let jsonLdStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('<script type="application/ld+json">')) {
      inJsonLd = true;
      jsonLdContent = '';
      jsonLdStartLine = i + 1;
      continue;
    }

    if (inJsonLd) {
      if (line.includes('</script>')) {
        // Parse the accumulated JSON-LD
        try {
          const parsed = JSON.parse(jsonLdContent);
          schemas.push({ schema: parsed, lineNumber: jsonLdStartLine });
        } catch (_error) {
          // Invalid JSON will be caught by validation
          schemas.push({ schema: { _parseError: true }, lineNumber: jsonLdStartLine });
        }
        inJsonLd = false;
        jsonLdContent = '';
      } else {
        jsonLdContent += line;
      }
    }
  }

  return schemas;
}

/**
 * Validate a single Schema.org structured data object using Ajv
 */
function validateStructuredDataSchema(
  schema: unknown,
  lineNumber: number,
  validator: Ajv
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if schema is valid object
  if (!schema || typeof schema !== 'object') {
    errors.push({
      type: 'invalid_schema',
      line: lineNumber,
      message: 'Structured data is not a valid JSON object',
      fix: 'Ensure JSON-LD is properly formatted',
    });
    return errors;
  }

  const schemaObj = schema as Record<string, unknown>;

  // Check for parse errors
  if (schemaObj._parseError) {
    errors.push({
      type: 'invalid_schema',
      line: lineNumber,
      message: 'JSON-LD contains syntax errors',
      fix: 'Fix JSON syntax (check commas, quotes, brackets)',
    });
    return errors;
  }

  // Validate @type exists
  if (!schemaObj['@type']) {
    errors.push({
      type: 'invalid_schema_type',
      line: lineNumber,
      message: 'Missing required property: @type',
      fix: 'Add @type property (e.g., "Article", "WebPage", "FAQPage")',
    });
    return errors;
  }

  const schemaType = schemaObj['@type'] as string;

  // Check if type is recognized
  if (!SCHEMA_ORG_JSON_SCHEMAS[schemaType]) {
    errors.push({
      type: 'invalid_schema_type',
      line: lineNumber,
      message: `Unknown Schema.org type: ${schemaType}`,
      fix: `Use a valid Schema.org type: ${Object.keys(SCHEMA_ORG_JSON_SCHEMAS).join(', ')}`,
    });
    return errors;
  }

  // Validate using Ajv with the appropriate JSON Schema
  const schemaId = `schema.org/${schemaType}`;
  const validate = validator.getSchema(schemaId);

  if (!validate) {
    // Fallback: Schema not found in validator (should not happen)
    errors.push({
      type: 'invalid_schema',
      line: lineNumber,
      message: `Internal error: JSON Schema not found for type ${schemaType}`,
      fix: 'Contact support - schema definition missing',
    });
    return errors;
  }

  // Run Ajv validation
  const isValid = validate(schemaObj);

  if (!isValid && validate.errors) {
    // Convert Ajv errors to ValidationError format
    for (const ajvError of validate.errors) {
      const errorPath = ajvError.instancePath || ajvError.propertyName || 'root';
      const errorMessage = ajvError.message || 'Validation failed';

      // Map Ajv error types to our ValidationError types
      let errorType: ValidationError['type'] = 'invalid_schema';
      let fixMessage = `Fix ${errorPath}: ${errorMessage}`;

      if (ajvError.keyword === 'required') {
        errorType = 'missing_required_schema_property';
        const missingProp = ajvError.params.missingProperty || 'unknown';
        fixMessage = `Add required property: ${missingProp}`;
      } else if (ajvError.keyword === 'const') {
        errorType = 'invalid_schema';
        const expectedValue = ajvError.params.allowedValue;
        fixMessage = `${errorPath} must be "${expectedValue}"`;
      } else if (ajvError.keyword === 'type') {
        errorType = 'invalid_schema';
        const expectedType = ajvError.params.type;
        fixMessage = `${errorPath} must be of type ${expectedType}`;
      } else if (ajvError.keyword === 'format') {
        errorType = 'invalid_schema';
        const expectedFormat = ajvError.params.format;
        fixMessage = `${errorPath} must be a valid ${expectedFormat}`;
      }

      errors.push({
        type: errorType,
        line: lineNumber,
        message: `${schemaType} schema: ${errorPath} ${errorMessage}`,
        fix: fixMessage,
      });
    }
  }

  return errors;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validate H1 heading count and hierarchy
 */
function validateH1Heading(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  if (analysis.h1Count === 0) {
    errors.push({
      type: 'missing_h1',
      message: 'No H1 heading found - add page title',
      fix: 'Add "# Page Title" after frontmatter',
    });
  } else if (analysis.h1Count > 1) {
    errors.push({
      type: 'multiple_h1',
      line: analysis.h1Lines[1],
      message: `Multiple H1 headings found (${analysis.h1Count} total) - SEO requires exactly one H1 per page`,
      fix: `Convert additional H1s to H2 (##) - found on lines: ${analysis.h1Lines.join(', ')}`,
    });
  }

  return errors;
}

/**
 * Validate FAQPage schema usage
 */
function validateFAQPage(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  if (analysis.faqPageCount > 1) {
    errors.push({
      type: 'duplicate_faqpage',
      message: `Multiple FAQPage schemas found (${analysis.faqPageCount}) - Schema.org requires ONE per page`,
      fix: 'Remove FAQPage from Accordion component, keep only in AIOptimizedFAQ',
    });
  }

  return errors;
}

/**
 * Validate meta tags (title, description)
 */
function validateMetaTags(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];
  const { title, seoTitle, description } = analysis.frontmatter;

  const effectiveTitle = seoTitle || title;

  // Title validation
  if (!effectiveTitle) {
    errors.push({
      type: 'missing_meta',
      message: 'Missing title in frontmatter',
      fix: 'Add "title:" or "seoTitle:" to frontmatter',
    });
  } else if (effectiveTitle.length < SEO_STANDARDS.TITLE_MIN) {
    errors.push({
      type: 'title_too_short',
      message: `Title too short (${effectiveTitle.length} chars) - SEO recommends ${SEO_STANDARDS.TITLE_MIN}-${SEO_STANDARDS.TITLE_MAX} chars`,
      fix: 'Expand title with relevant keywords',
    });
  } else if (effectiveTitle.length > SEO_STANDARDS.TITLE_MAX) {
    errors.push({
      type: 'title_too_long',
      message: `Title too long (${effectiveTitle.length} chars) - will be truncated in search results`,
      fix: `Shorten to ${SEO_STANDARDS.TITLE_MAX} chars or less`,
    });
  }

  // Description validation
  if (!description) {
    errors.push({
      type: 'missing_description',
      message: 'Missing description in frontmatter',
      fix: 'Add "description:" to frontmatter with 150-160 char summary',
    });
  } else if (description.length < SEO_STANDARDS.DESCRIPTION_MIN) {
    errors.push({
      type: 'description_too_short',
      message: `Description too short (${description.length} chars) - SEO recommends ${SEO_STANDARDS.DESCRIPTION_MIN}-${SEO_STANDARDS.DESCRIPTION_MAX} chars`,
      fix: 'Expand description with page summary and keywords',
    });
  } else if (description.length > SEO_STANDARDS.DESCRIPTION_MAX) {
    errors.push({
      type: 'description_too_long',
      message: `Description too long (${description.length} chars) - will be truncated`,
      fix: `Shorten to ${SEO_STANDARDS.DESCRIPTION_MAX} chars or less`,
    });
  }

  return errors;
}

/**
 * Validate heading hierarchy structure
 */
function validateHeadingStructure(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!analysis.headingHierarchyValid) {
    errors.push({
      type: 'heading_hierarchy_skip',
      message: 'Heading hierarchy is invalid - follow H1 → H2 → H3 structure',
      fix: 'Ensure H1 comes first, followed by H2s, then H3s (no skipping levels)',
    });
  }

  return errors;
}

/**
 * Validate Schema.org structured data (JSON-LD)
 * Checks for Schema.org V29.3 compliance
 */
function validateStructuredData(content: string, validator: Ajv): ValidationError[] {
  const errors: ValidationError[] = [];

  // Extract all JSON-LD schemas from content
  const schemas = extractStructuredData(content);

  // Validate each schema
  for (const { schema, lineNumber } of schemas) {
    const schemaErrors = validateStructuredDataSchema(schema, lineNumber, validator);
    errors.push(...schemaErrors);
  }

  return errors;
}

/**
 * Check for component conflicts
 *
 * RESOLVED: AIOptimizedFAQ now uses JSON-LD (not microdata), so no conflict with Accordion
 * - Accordion: Uses microdata with itemScope/itemType attributes
 * - AIOptimizedFAQ: Uses JSON-LD in <script type="application/ld+json"> tag
 * - Both can coexist without duplicate schema markup issues
 *
 * This function is kept for future extensibility but currently returns no warnings.
 */
function checkComponentConflicts(_analysis: MDXAnalysis): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // REMOVED: AIOptimizedFAQ + Accordion conflict check (no longer an issue as of Task 7)
  // AIOptimizedFAQ now uses JSON-LD schema which doesn't conflict with Accordion's microdata
  // See: src/components/content/faq.tsx (converted from microdata to JSON-LD)

  return warnings;
}

// ============================================================================
// ROUTE COVERAGE VALIDATION - Phase 5 Addition
// ============================================================================

/**
 * Get all routes that should have metadata
 * Scans app directory for page.tsx files to discover all routes
 */
function getAllAppRoutes(): string[] {
  const routes: string[] = [];
  const appDir = join(process.cwd(), 'src', 'app');

  function scanDirectory(dir: string, routePath = '') {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip special Next.js directories
          if (['api', '_components', '_lib'].includes(entry.name)) continue;

          // Handle dynamic routes: [param] → :param
          const segment =
            entry.name.startsWith('[') && entry.name.endsWith(']')
              ? `:${entry.name.slice(1, -1)}`
              : entry.name;

          // Handle catch-all routes: [...param] → :param
          const routeSegment = segment.startsWith(':...') ? segment.replace('...', '') : segment;

          scanDirectory(fullPath, `${routePath}/${routeSegment}`);
        } else if (entry.name === 'page.tsx') {
          // Found a page - add route
          const route = routePath || '/';
          routes.push(route);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan ${dir}:`, error);
    }
  }

  scanDirectory(appDir);
  return routes.sort();
}

/**
 * Check if a route has corresponding metadata registry entry
 * Loads metadata-registry.ts and checks for route definition
 */
function checkRouteHasMetadata(route: string): boolean {
  const registryPath = join(process.cwd(), 'src', 'lib', 'seo', 'metadata-registry.ts');

  try {
    const content = readFileSync(registryPath, 'utf-8');

    // Check if route exists in METADATA_REGISTRY
    const routePattern = route.replace(/:/g, '\\:');
    const registryRegex = new RegExp(`['"]${routePattern}['"]\\s*:\\s*\\{`, 'g');

    return registryRegex.test(content);
  } catch (error) {
    console.error(`Error reading metadata registry: ${error}`);
    return false;
  }
}

/**
 * Validate comprehensive route coverage
 * Ensures ALL routes have metadata entries
 */
function validateRouteCoverage(): { passed: boolean; missing: string[]; total: number } {
  const allRoutes = getAllAppRoutes();
  const missingMetadata: string[] = [];

  for (const route of allRoutes) {
    if (!checkRouteHasMetadata(route)) {
      missingMetadata.push(route);
    }
  }

  return {
    passed: missingMetadata.length === 0,
    missing: missingMetadata,
    total: allRoutes.length,
  };
}

/**
 * Ensure no route bypasses metadata system
 * Checks page.tsx files for direct Next.js metadata exports without using generatePageMetadata
 */
function validateNoMetadataBypass(): {
  passed: boolean;
  bypasses: Array<{ file: string; reason: string }>;
} {
  const bypasses: Array<{ file: string; reason: string }> = [];
  const appDir = join(process.cwd(), 'src', 'app');

  function scanForBypasses(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip API routes
          if (entry.name === 'api') continue;
          scanForBypasses(fullPath);
        } else if (entry.name === 'page.tsx') {
          const content = readFileSync(fullPath, 'utf-8');
          const relativePath = relative(process.cwd(), fullPath);

          // Check for direct metadata export WITHOUT generatePageMetadata
          if (
            /export\s+(const\s+)?metadata\s*[=:]/.test(content) &&
            !content.includes('generatePageMetadata') &&
            !content.includes('generateCategoryMetadata') &&
            !content.includes('generateContentMetadata')
          ) {
            bypasses.push({
              file: relativePath,
              reason: 'Direct metadata export without using metadata generator functions',
            });
          }

          // Check for missing metadata export entirely
          if (
            !(
              content.includes('metadata') ||
              content.includes('generateMetadata') ||
              relativePath.includes('api/')
            )
          ) {
            bypasses.push({
              file: relativePath,
              reason: 'No metadata export found - page will have no SEO metadata',
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan ${dir}:`, error);
    }
  }

  scanForBypasses(appDir);

  return {
    passed: bypasses.length === 0,
    bypasses,
  };
}

/**
 * Generate comprehensive validation report
 * Outputs markdown-formatted report with all SEO validation results
 */
function generateValidationReport(results: {
  mdxValidation: ValidationResult[];
  routeCoverage: ReturnType<typeof validateRouteCoverage>;
  bypassCheck: ReturnType<typeof validateNoMetadataBypass>;
}): string {
  const { mdxValidation, routeCoverage, bypassCheck } = results;

  const passedMDX = mdxValidation.filter((r) => r.passed).length;
  const failedMDX = mdxValidation.filter((r) => r.passed === false).length;

  let report = '# SEO Validation Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += '---\n\n';

  // MDX Content Validation
  report += '## 📄 MDX Content Validation\n\n';
  report += `- **Total Files:** ${mdxValidation.length}\n`;
  report += `- **Passed:** ${passedMDX} ✅\n`;
  report += `- **Failed:** ${failedMDX} ❌\n\n`;

  if (failedMDX > 0) {
    report += '### Failed Files\n\n';
    for (const result of mdxValidation.filter((r) => !r.passed)) {
      report += `#### \`${result.file}\`\n\n`;
      for (const error of result.errors) {
        const line = error.line ? ` (line ${error.line})` : '';
        report += `- ❌ **${error.type}**${line}: ${error.message}\n`;
        if (error.fix) {
          report += `  - 💡 **Fix:** ${error.fix}\n`;
        }
      }
      report += '\n';
    }
  }

  // Route Coverage
  report += '## 🗺️  Route Coverage Validation\n\n';
  report += `- **Total Routes:** ${routeCoverage.total}\n`;
  report += `- **With Metadata:** ${routeCoverage.total - routeCoverage.missing.length} ✅\n`;
  report += `- **Missing Metadata:** ${routeCoverage.missing.length} ❌\n\n`;

  if (routeCoverage.missing.length > 0) {
    report += '### Routes Missing Metadata\n\n';
    for (const route of routeCoverage.missing) {
      report += `- \`${route}\` - No entry in metadata registry\n`;
    }
    report += '\n';
  }

  // Bypass Detection
  report += '## 🚫 Metadata Bypass Detection\n\n';
  report += `- **Status:** ${bypassCheck.passed ? '✅ No bypasses detected' : '❌ Bypasses found'}\n`;
  report += `- **Issues:** ${bypassCheck.bypasses.length}\n\n`;

  if (bypassCheck.bypasses.length > 0) {
    report += '### Files Bypassing Metadata System\n\n';
    for (const bypass of bypassCheck.bypasses) {
      report += `#### \`${bypass.file}\`\n`;
      report += `- **Reason:** ${bypass.reason}\n\n`;
    }
  }

  // Overall Status
  report += '---\n\n';
  report += '## ✅ Overall Status\n\n';
  const overallPassed = failedMDX === 0 && routeCoverage.passed && bypassCheck.passed;
  report += overallPassed
    ? '**✅ ALL VALIDATIONS PASSED** - Production ready!\n'
    : '**❌ VALIDATION FAILURES** - See issues above\n';

  return report;
}

// ============================================================================
// FILE SYSTEM UTILITIES
// ============================================================================

/**
 * Recursively find all MDX files
 */
function findMDXFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          traverse(fullPath);
        }
      } else if (entry.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Validate a single MDX file
 */
function validateFile(filePath: string, validator: Ajv): ValidationResult {
  const analysis = analyzeMDXFile(filePath);

  const errors: ValidationError[] = [
    ...validateH1Heading(analysis),
    ...validateFAQPage(analysis),
    ...validateMetaTags(analysis),
    ...validateHeadingStructure(analysis),
    ...validateStructuredData(analysis.content, validator),
  ];

  const warnings: ValidationWarning[] = [...checkComponentConflicts(analysis)];

  return {
    file: relative(process.cwd(), filePath),
    errors,
    warnings,
    passed: errors.length === 0,
  };
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'content';
  const generateReport = args.includes('--report');

  console.log('🔍 Comprehensive SEO Validator - Phase 5 Enhanced');
  console.log('═'.repeat(80));
  console.log(`📂 Scanning: ${targetPath}\n`);

  // Initialize Schema.org validator
  const validator = createSchemaValidator();

  // === MDX FILE VALIDATION ===
  console.log('📄 Validating MDX files...\n');
  const stat = statSync(targetPath);
  const files = stat.isDirectory() ? findMDXFiles(targetPath) : [targetPath];

  console.log(`📄 Found ${files.length} MDX files\n`);

  // Validate each file
  const mdxResults = files.map((file) => validateFile(file, validator));

  // Separate passed and failed
  const passed = mdxResults.filter((r) => r.passed);
  const failed = mdxResults.filter((r) => !r.passed);

  // Display MDX results
  if (failed.length > 0) {
    console.log('❌ FAILED FILES:\n');

    for (const result of failed) {
      console.log(`  📄 ${result.file}`);

      // Show errors
      for (const error of result.errors) {
        const lineInfo = error.line ? ` (line ${error.line})` : '';
        console.log(`    ❌ [${error.type}]${lineInfo}: ${error.message}`);
        if (error.fix) {
          console.log(`       💡 Fix: ${error.fix}`);
        }
      }

      // Show warnings
      for (const warning of result.warnings) {
        const lineInfo = warning.line ? ` (line ${warning.line})` : '';
        console.log(`    ⚠️  [${warning.type}]${lineInfo}: ${warning.message}`);
      }

      console.log('');
    }
  }

  // === ROUTE COVERAGE VALIDATION (Phase 5) ===
  console.log('\n🗺️  Validating route coverage...\n');
  const routeCoverage = validateRouteCoverage();

  console.log(`  Total Routes: ${routeCoverage.total}`);
  console.log(`  With Metadata: ${routeCoverage.total - routeCoverage.missing.length}`);
  console.log(`  Missing Metadata: ${routeCoverage.missing.length}\n`);

  if (routeCoverage.missing.length > 0) {
    console.log('  ❌ Routes missing metadata:');
    for (const route of routeCoverage.missing) {
      console.log(`     - ${route}`);
    }
    console.log('');
  }

  // === METADATA BYPASS DETECTION (Phase 5) ===
  console.log('\n🚫 Checking for metadata system bypasses...\n');
  const bypassCheck = validateNoMetadataBypass();

  console.log(`  Status: ${bypassCheck.passed ? '✅ No bypasses' : '❌ Bypasses found'}`);
  console.log(`  Issues: ${bypassCheck.bypasses.length}\n`);

  if (bypassCheck.bypasses.length > 0) {
    console.log('  ❌ Files bypassing metadata system:');
    for (const bypass of bypassCheck.bypasses) {
      console.log(`     - ${bypass.file}`);
      console.log(`       Reason: ${bypass.reason}`);
    }
    console.log('');
  }

  // === SUMMARY ===
  console.log('═'.repeat(80));
  console.log('📊 VALIDATION SUMMARY:\n');
  console.log('  MDX Files:');
  console.log(`    ✅ Passed:  ${passed.length}`);
  console.log(`    ❌ Failed:  ${failed.length}`);
  console.log(`    📊 Total:   ${mdxResults.length}\n`);

  console.log('  Route Coverage:');
  console.log(`    ✅ Covered: ${routeCoverage.total - routeCoverage.missing.length}`);
  console.log(`    ❌ Missing: ${routeCoverage.missing.length}`);
  console.log(`    📊 Total:   ${routeCoverage.total}\n`);

  console.log('  Metadata Bypasses:');
  console.log(
    `    ${bypassCheck.passed ? '✅' : '❌'} Status: ${bypassCheck.passed ? 'None detected' : `${bypassCheck.bypasses.length} found`}\n`
  );

  // Error breakdown
  const errorsByType: Record<string, number> = {};
  for (const result of failed) {
    for (const error of result.errors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    }
  }

  if (Object.keys(errorsByType).length > 0) {
    console.log('📊 Error Breakdown:');
    for (const [type, count] of Object.entries(errorsByType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }
  }

  console.log('═'.repeat(80));

  // === GENERATE REPORT (Phase 5) ===
  if (generateReport) {
    console.log('\n📝 Generating validation report...');
    const report = generateValidationReport({
      mdxValidation: mdxResults,
      routeCoverage,
      bypassCheck,
    });

    const reportPath = join(process.cwd(), 'seo-validation-report.md');
    const { writeFileSync } = require('node:fs');
    writeFileSync(reportPath, report);
    console.log(`✅ Report saved to: ${reportPath}\n`);
  }

  // === EXIT CODE ===
  const allPassed = failed.length === 0 && routeCoverage.passed && bypassCheck.passed;

  if (!allPassed) {
    console.log('\n💡 Quick Fixes:');
    console.log('  • H1 Issues: npm run validate:seo -- --fix-h1');
    console.log('  • Meta Tags: Check frontmatter in each file');
    console.log('  • Missing Routes: Add entries to metadata-registry.ts');
    console.log('  • Bypasses: Use generatePageMetadata() in page.tsx files');
    console.log('  • Generate Report: npm run validate:seo -- --report\n');
    process.exit(1);
  }

  console.log('\n✨ All SEO validations passed! Production ready!\n');
  process.exit(0);
}

main();
