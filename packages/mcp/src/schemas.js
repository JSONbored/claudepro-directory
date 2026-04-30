import { z } from "zod";

const pathPart = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Use lowercase slug-safe path parts only.");

const platform = z.string().trim().min(1).max(80);

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

export const TOOL_INPUT_SCHEMAS = {
  search_registry: SearchRegistryInputSchema,
  get_entry_detail: EntryDetailInputSchema,
  get_compatibility: CompatibilityInputSchema,
  get_install_guidance: InstallGuidanceInputSchema,
  get_platform_adapter: PlatformAdapterInputSchema,
  list_distribution_feeds: ListDistributionFeedsInputSchema,
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
