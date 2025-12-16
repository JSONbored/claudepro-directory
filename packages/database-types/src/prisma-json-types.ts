// This file must be a module, so we include an empty export.
export {};

/**
 * PrismaJson namespace for custom JSON type definitions
 * Used by prisma-json-types-generator to provide strongly typed Json fields
 * 
 * See: https://github.com/olivierwilkinson/prisma-json-types-generator
 * 
 * This file uses TypeScript declaration merging to extend the PrismaJson namespace
 * that is created by prisma-json-types-generator. The generator reads AST comments
 * from schema.prisma (e.g., /// [TypeName]) and applies these types to Json fields.
 */

declare global {
  namespace PrismaJson {
    /**
     * Category config sections structure
     * Controls which sections are displayed on category pages
     */
    type CategorySections = {
      examples?: boolean;
      features?: boolean;
      security?: boolean;
      use_cases?: boolean;
      installation?: boolean;
      configuration?: boolean;
      troubleshooting?: boolean;
      description?: boolean;
      requirements?: boolean;
    };

    /**
     * Content metadata structure
     * Flexible metadata object for content items
     */
    type ContentMetadata = {
      dependencies?: string[];
      troubleshooting?: Array<{
        issue: string;
        solution: string;
      }>;
      prerequisites?: string[];
      has_breaking_changes?: boolean;
      categoryLabel?: string;
      showGitHubLink?: boolean;
      githubPathPrefix?: string;
      [key: string]: unknown;
    };

    /**
     * Content examples structure
     * Array of code examples with title, code, language, and optional description
     */
    type ContentExamples = Array<{
      title: string;
      code: string;
      language: string;
      description?: string;
    }>;

    /**
     * JSON-LD structured data
     * Valid JSON-LD schema.org structured data
     */
    type JsonLd = {
      '@context'?: string | Record<string, unknown>;
      '@type'?: string;
      '@id'?: string;
      [key: string]: unknown;
    };

    /**
     * Changelog metadata structure
     * Metadata for changelog entries including category counts and date ranges
     */
    type ChangelogMetadata = {
      category_counts?: Record<string, number>;
      date_range?: {
        earliest: string;
        latest: string;
      };
      total_entries?: number;
      [key: string]: unknown;
    };

    /**
     * Changelog changes structure
     * Structured changelog entry changes by category
     */
    type ChangelogChanges = {
      Added?: string[];
      Fixed?: string[];
      Changed?: string[];
      Removed?: string[];
      Security?: string[];
      Deprecated?: string[];
    };

    /**
     * Primary action config structure
     * Configuration for primary action buttons on category pages
     */
    type PrimaryActionConfig = {
      url?: string;
      external?: boolean;
      [key: string]: unknown;
    };

    /**
     * Category config badges structure
     * Array of badge configurations for category pages
     */
    type CategoryBadges = Array<{
      icon?: string;
      text: string | ((count: number) => string);
    }>;

    /**
     * API schema structure
     * Schema definition for API endpoints
     */
    type ApiSchema = {
      fields?: string[];
      exclude?: string[];
      [key: string]: unknown;
    };

    /**
     * Validation config structure
     * Configuration for form validation
     */
    type ValidationConfig = Record<string, unknown>;

    /**
     * Generation config structure
     * Configuration for content generation
     */
    type GenerationConfig = Record<string, unknown>;

    /**
     * App settings value structure
     * Flexible structure for app setting values
     */
    type AppSettingValue = Record<string, unknown>;

    /**
     * Auth identity data structure
     * OAuth provider identity data
     */
    type IdentityData = Record<string, unknown>;

    /**
     * WebAuthn session data structure
     * WebAuthn authentication session data
     */
    type WebAuthnSessionData = Record<string, unknown>;

    /**
     * WebAuthn credential structure
     * WebAuthn credential data
     */
    type WebAuthnCredential = Record<string, unknown>;

    /**
     * SAML attribute mapping structure
     * SAML attribute mapping configuration
     */
    type AttributeMapping = Record<string, unknown>;

    /**
     * Auth raw metadata structures
     * Raw app and user metadata from auth providers
     */
    type RawAppMetaData = Record<string, unknown>;
    type RawUserMetaData = Record<string, unknown>;

    /**
     * Audit log payload structure
     * Payload data for audit log entries
     */
    type AuditLogPayload = Record<string, unknown>;

    /**
     * Contact command metadata structure
     * Metadata for contact commands
     */
    type ContactCommandMetadata = Record<string, unknown>;

    /**
     * Generic metadata structure
     * Flexible metadata object for various models
     */
    type Metadata = Record<string, unknown>;

    /**
     * Content generation discovery metadata
     * Metadata for content generation tracking
     */
    type DiscoveryMetadata = Record<string, unknown>;

    /**
     * Content similarity factors
     * Factors used to calculate content similarity
     */
    type SimilarityFactors = Record<string, unknown>;

    /**
     * Content submission data
     * Data structure for content submissions
     */
    type ContentSubmissionData = Record<string, unknown>;

    /**
     * Content template data
     * Template data structure for content templates
     */
    type TemplateData = Record<string, unknown>;

    /**
     * Form field configuration
     * Configuration for form fields
     */
    type FormFieldConfig = Record<string, unknown>;

    /**
     * Job subscription audit log details
     * Details for job subscription audit logs
     */
    type AuditLogDetails = Record<string, unknown>;

    /**
     * Payment plan benefits
     * Benefits structure for payment plans
     */
    type PaymentPlanBenefits = Record<string, unknown>;

    /**
     * Generic data structure
     * Flexible data object for various models
     */
    type Data = Record<string, unknown>;
  }
}
