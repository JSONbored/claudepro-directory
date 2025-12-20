/**
 * Prisma Zod Helpers for API Routes
 *
 * Utilities for using auto-generated Zod schemas from Prisma in API routes.
 * These schemas are already generated in `prisma/generated/zod/`.
 */

import { z } from 'zod';

/**
 * Get Zod schema for a Prisma model's create input
 *
 * @example
 * ```typescript
 * import { getPrismaCreateSchema } from '@heyclaude/web-runtime/api/prisma-zod-helpers';
 * import { CompaniesCreateInputSchema } from 'prisma/generated/zod';
 *
 * const schema = getPrismaCreateSchema('Companies');
 * // Returns: CompaniesCreateInputSchema
 * ```
 */
export function getPrismaCreateSchema<T extends string>(modelName: T): z.ZodTypeAny {
  // Dynamic import to avoid loading all schemas at once
  // In practice, you'll import directly:
  // import { CompaniesCreateInputSchema } from 'prisma/generated/zod';
  throw new Error(
    `Use direct import: import { ${modelName}CreateInputSchema } from 'prisma/generated/zod';`
  );
}

/**
 * Get Zod schema for a Prisma model's update input
 *
 * @example
 * ```typescript
 * import { CompaniesUpdateInputSchema } from 'prisma/generated/zod';
 * const schema = CompaniesUpdateInputSchema;
 * ```
 */
export function getPrismaUpdateSchema<T extends string>(modelName: T): z.ZodTypeAny {
  throw new Error(
    `Use direct import: import { ${modelName}UpdateInputSchema } from 'prisma/generated/zod';`
  );
}

/**
 * Get Zod schema for a Prisma model's where unique input
 *
 * @example
 * ```typescript
 * import { CompaniesWhereUniqueInputSchema } from 'prisma/generated/zod';
 * const schema = CompaniesWhereUniqueInputSchema;
 * ```
 */
export function getPrismaWhereUniqueSchema<T extends string>(modelName: T): z.ZodTypeAny {
  throw new Error(
    `Use direct import: import { ${modelName}WhereUniqueInputSchema } from 'prisma/generated/zod';`
  );
}

/**
 * Helper to validate API request body using Prisma Zod schemas
 *
 * @example
 * ```typescript
 * import { CompaniesCreateInputSchema } from 'prisma/generated/zod';
 * import { validatePrismaInput } from '@heyclaude/web-runtime/api/prisma-zod-helpers';
 *
 * const body = await request.json();
 * const validated = validatePrismaInput(CompaniesCreateInputSchema, body);
 * ```
 */
export function validatePrismaInput<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}

/**
 * Helper to safely validate API request body (returns result instead of throwing)
 *
 * @example
 * ```typescript
 * import { CompaniesCreateInputSchema } from 'prisma/generated/zod';
 * import { safeValidatePrismaInput } from '@heyclaude/web-runtime/api/prisma-zod-helpers';
 *
 * const body = await request.json();
 * const result = safeValidatePrismaInput(CompaniesCreateInputSchema, body);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * const validated = result.data;
 * ```
 */
export function safeValidatePrismaInput<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): ReturnType<typeof schema.safeParse> {
  return schema.safeParse(input);
}
