import { z } from "zod";

const pathPart = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Use lowercase slug-safe path parts only.");

const platform = z.string().trim().min(1).max(80);
const submissionCategory = z.enum([
  "agents",
  "rules",
  "mcp",
  "skills",
  "hooks",
  "commands",
  "statuslines",
  "collections",
  "guides",
]);
const optionalText = z.string().trim().max(4000).optional();
const optionalLongText = z.string().trim().max(24000).optional();
const optionalTags = z
  .union([
    z.string().trim().max(1000),
    z.array(z.string().trim().min(1).max(80)).max(20),
  ])
  .optional();

export const SubmissionFieldsSchema = z
  .object({
    name: optionalText,
    title: optionalText,
    slug: pathPart.optional(),
    category: submissionCategory.optional(),
    github_url: optionalText,
    docs_url: optionalText,
    source_url: optionalText,
    brand_name: optionalText,
    brand_domain: optionalText,
    author: optionalText,
    contact_email: optionalText,
    tags: optionalTags,
    description: optionalLongText,
    card_description: optionalText,
    full_copyable_content: optionalLongText,
    install_command: optionalText,
    usage_snippet: optionalLongText,
    command_syntax: optionalText,
    trigger: optionalText,
    guide_content: optionalLongText,
    items: optionalLongText,
    script_language: optionalText,
    skill_type: optionalText,
    skill_level: optionalText,
    verification_status: optionalText,
    verified_at: optionalText,
    download_url: optionalText,
    config_snippet: optionalLongText,
    retrieval_sources: optionalLongText,
    tested_platforms: optionalText,
    prerequisites: optionalLongText,
    troubleshooting_section: optionalLongText,
    installation_order: optionalText,
    estimated_setup_time: optionalText,
    difficulty: optionalText,
  })
  .strict();

export const SearchRegistryInputSchema = z
  .object({
    query: z.string().trim().max(240).optional(),
    category: pathPart.optional(),
    platform: platform.optional(),
    limit: z.number().int().min(1).max(25).optional(),
  })
  .strict();

export const EntryDetailInputSchema = z
  .object({
    category: pathPart,
    slug: pathPart,
  })
  .strict();

export const CompatibilityInputSchema = z
  .object({
    category: pathPart.optional(),
    slug: pathPart,
  })
  .strict();

export const InstallGuidanceInputSchema = z
  .object({
    category: pathPart,
    slug: pathPart,
    platform: platform.optional(),
  })
  .strict();

export const PlatformAdapterInputSchema = z
  .object({
    slug: pathPart,
    platform: platform.optional(),
  })
  .strict();

export const ListDistributionFeedsInputSchema = z.object({}).strict();

export const GetSubmissionSchemaInputSchema = z
  .object({
    category: submissionCategory.optional(),
  })
  .strict();

export const ValidateSubmissionDraftInputSchema = z
  .object({
    fields: SubmissionFieldsSchema,
  })
  .strict();

export const SearchDuplicateEntriesInputSchema = z
  .object({
    category: pathPart.optional(),
    slug: pathPart.optional(),
    name: z.string().trim().min(1).max(240).optional(),
    title: z.string().trim().min(1).max(240).optional(),
    sourceUrl: z.string().trim().min(1).max(500).optional(),
    brandDomain: z.string().trim().min(1).max(255).optional(),
    limit: z.number().int().min(1).max(10).optional(),
  })
  .strict();

export const BuildSubmissionUrlsInputSchema = z
  .object({
    fields: SubmissionFieldsSchema,
    includeIssueBody: z.boolean().optional(),
  })
  .strict();

export const CategorySubmissionGuidanceInputSchema = z
  .object({
    category: submissionCategory.optional(),
  })
  .strict();

export const TOOL_INPUT_SCHEMAS = {
  search_registry: SearchRegistryInputSchema,
  get_entry_detail: EntryDetailInputSchema,
  get_compatibility: CompatibilityInputSchema,
  get_install_guidance: InstallGuidanceInputSchema,
  get_platform_adapter: PlatformAdapterInputSchema,
  list_distribution_feeds: ListDistributionFeedsInputSchema,
  get_submission_schema: GetSubmissionSchemaInputSchema,
  validate_submission_draft: ValidateSubmissionDraftInputSchema,
  search_duplicate_entries: SearchDuplicateEntriesInputSchema,
  build_submission_urls: BuildSubmissionUrlsInputSchema,
  get_category_submission_guidance: CategorySubmissionGuidanceInputSchema,
};

function stripUnsupportedJsonSchemaFields(value) {
  if (Array.isArray(value)) {
    return value.map(stripUnsupportedJsonSchemaFields);
  }
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "$schema")
      .map(([key, nested]) => [key, stripUnsupportedJsonSchemaFields(nested)]),
  );
}

export function jsonSchemaForTool(name) {
  const schema = TOOL_INPUT_SCHEMAS[name];
  if (!schema) {
    throw new Error(`Unknown HeyClaude MCP tool schema: ${name}`);
  }
  return stripUnsupportedJsonSchemaFields(z.toJSONSchema(schema));
}

export function parseToolArguments(name, args = {}) {
  const schema = TOOL_INPUT_SCHEMAS[name];
  if (!schema) {
    throw new Error(`Unknown HeyClaude MCP tool schema: ${name}`);
  }
  return schema.parse(args || {});
}

export function formatZodError(error) {
  if (!(error instanceof z.ZodError)) return null;
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}
