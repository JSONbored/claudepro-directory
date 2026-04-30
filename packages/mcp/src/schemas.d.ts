import type { z } from "zod";

export const SearchRegistryInputSchema: z.ZodType;
export const EntryDetailInputSchema: z.ZodType;
export const CompatibilityInputSchema: z.ZodType;
export const InstallGuidanceInputSchema: z.ZodType;
export const PlatformAdapterInputSchema: z.ZodType;
export const ListDistributionFeedsInputSchema: z.ZodType;
export const TOOL_INPUT_SCHEMAS: Record<string, z.ZodType>;

export function jsonSchemaForTool(name: string): Record<string, unknown>;
export function parseToolArguments(
  name: string,
  args?: Record<string, unknown>,
): Record<string, unknown>;
export function formatZodError(
  error: unknown,
): Array<{ path: string; message: string; code: string }> | null;
