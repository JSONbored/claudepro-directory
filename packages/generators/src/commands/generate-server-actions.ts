import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import ora from 'ora';
import { ensureEnvVars } from '../toolkit/env.js';
import {
  type CompositeTypeAttribute,
  type FunctionMeta,
  getDatabaseMeta,
} from '../toolkit/introspection.js';
import { logger } from '../toolkit/logger.js';
import { mapPostgresTypeToZod } from '../toolkit/zod-mapper.js';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');
const WEB_RUNTIME_ROOT = join(PROJECT_ROOT, 'packages/web-runtime/src');

const jiti = createJiti(import.meta.url);

interface ActionConfig {
  rpc: string;
  auth?: boolean;
  revalidatePaths?: string[];
  revalidateTags?: string[];
  invalidateCacheConfigKeys?: string[];
  category?: string;
  inputSchema?: string;
  args?: Record<string, unknown>; // Allow overriding/hardcoding RPC args
  hooks?: {
    onSuccess?: string;
  };
  returnStyle?: 'first_row';
}

export async function runGenerateServerActions(targetAction?: string) {
  const spinner = ora('Generating Server Actions...').start();

  try {
    await ensureEnvVars(['POSTGRES_URL_NON_POOLING']);
    const dbUrl = process.env['POSTGRES_URL_NON_POOLING'];
    if (!dbUrl) {
      throw new Error('POSTGRES_URL_NON_POOLING is required');
    }

    // Load Config
    spinner.text = 'Loading action configuration...';
    const configPath = join(WEB_RUNTIME_ROOT, 'config/actions.config.ts');
    const mod = (await jiti.import(configPath)) as { ACTIONS: Record<string, ActionConfig> };
    const actionsConfig = mod.ACTIONS;

    if (!actionsConfig) {
      throw new Error('ACTIONS export not found in config');
    }

    // Introspect
    spinner.text = 'Introspecting database...';
    const meta = getDatabaseMeta(dbUrl);

    // Filter targets
    const actionsToGenerate = targetAction
      ? Object.entries(actionsConfig).filter(([name]) => name === targetAction)
      : Object.entries(actionsConfig);

    if (actionsToGenerate.length === 0) {
      spinner.info('No actions to generate.');
      return;
    }

    spinner.text = 'Generating code...';

    for (const [actionName, config] of actionsToGenerate) {
      const rpcName = config.rpc;
      const rpcMeta = meta.functions[rpcName];

      if (!rpcMeta) {
        logger.warn(
          `RPC function '${rpcName}' not found in database for action '${actionName}'. Skipping.`
        );
        continue;
      }

      await generateActionFile(actionName, config, rpcMeta, meta.enums, meta.compositeTypes);
    }

    spinner.succeed(`Generated ${actionsToGenerate.length} actions.`);
  } catch (error) {
    spinner.fail('Failed to generate server actions');
    logger.error((error as Error).message);
    process.exit(1);
  }
}

function toKebabCase(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toPascalCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function serializeArgValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `'${value}'`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(serializeArgValue).join(', ')}]`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function generateActionFile(
  actionName: string,
  config: ActionConfig,
  rpc: FunctionMeta,
  enums: Record<string, string[]>,
  compositeTypes: Record<string, CompositeTypeAttribute[]>
) {
  // Add .generated.ts suffix to clearly mark generated files
  const fileName = `${toKebabCase(actionName)}.generated.ts`;
  const outputPath = join(WEB_RUNTIME_ROOT, 'actions', fileName);

  const authRequired = config.auth !== false; // Default true
  const hasCacheInvalidation =
    config.invalidateCacheConfigKeys && config.invalidateCacheConfigKeys.length > 0;

  // input mapping
  const rpcArgs: string[] = [];
  const zodFields: string[] = [];

  for (const arg of rpc.args) {
    // Check for hardcoded args override
    if (config.args && Object.hasOwn(config.args, arg.name)) {
      rpcArgs.push(`'${arg.name}': ${serializeArgValue(config.args[arg.name])}`);
      continue;
    }

    if (authRequired && (arg.name === 'p_user_id' || arg.name === 'user_id')) {
      rpcArgs.push(`'${arg.name}': ctx.userId`);
      continue;
    }

    // Strip p_ prefix
    const inputName = arg.name.startsWith('p_') ? arg.name.substring(2) : arg.name;

    // Check if it's a composite type
    const compositeType = compositeTypes[arg.udtName];

    if (compositeType) {
      // Flatten the composite type into individual Zod fields
      for (const attr of compositeType) {
        const zodType = mapPostgresTypeToZod(
          {
            udtName: attr.udtName,
            nullable: attr.nullable,
            // Composite attributes usually don't have constraints like maxLength directly available in this query,
            // but mapPostgresTypeToZod handles basics.
            type: 'unknown', // not used for udtName logic usually
            hasDefault: attr.nullable, // Treat nullable composite attributes as having default (optional)
          },
          enums
        );

        zodFields.push(`${attr.name}: ${zodType}`);
      }

      // Construct the composite object in the RPC call
      const objectProps = compositeType
        .map((attr) => {
          // We can just map field to field
          return `'${attr.name}': parsedInput.${attr.name}`;
        })
        .join(',\n            ');

      rpcArgs.push(`'${arg.name}': {\n            ${objectProps}\n          }`);
    } else {
      // Scalar type
      const zodType = mapPostgresTypeToZod({ ...arg, hasDefault: arg.hasDefault }, enums);
      zodFields.push(`${inputName}: ${zodType}`);
      rpcArgs.push(`'${arg.name}': parsedInput.${inputName}`);
    }
  }

  const schemaCode = config.inputSchema
    ? '' // Imported or externally defined
    : `export const ${actionName}Schema = z.object({\n  ${zodFields.join(',\n  ')}\n});\nexport type ${toPascalCase(actionName)}Input = z.infer<typeof ${actionName}Schema>;`;

  const inputSchemaRef = config.inputSchema || `${actionName}Schema`;

  // Revalidation Logic
  const revalidations: string[] = [];

  // Dynamic replacement helper
  const replaceDynamic = (str: string) => {
    // Replace {result.prop} with ${result?.prop} (assuming result exists)
    // We use deep optional chaining via global replace of . with ?. inside the capture
    let out = str;
    out = out.replace(/\{result\.(\w+(\.\w+)*)\}/g, (_, p1) => {
      const chained = p1.replace(/\./g, '?.');
      return `\${result?.${chained}}`;
    });
    // Replace {userId} with ctx.userId specially, otherwise fallback to parsedInput
    out = out.replace(/\{userId\}/g, '$' + '{ctx.userId}');
    out = out.replace(/\{(\w+)\}/g, '$' + '{parsedInput.$1}');
    return out;
  };

  if (config.revalidatePaths) {
    for (const path of config.revalidatePaths) {
      const dynamicPath = replaceDynamic(path);
      revalidations.push(`revalidatePath(\`${dynamicPath}\`);`);
    }
  }
  if (config.revalidateTags) {
    for (const tag of config.revalidateTags) {
      const dynamicTag = replaceDynamic(tag);
      revalidations.push(`revalidateTag(\`${dynamicTag}\`, 'default');`);
    }
  }

  if (hasCacheInvalidation) {
    const keys = config.invalidateCacheConfigKeys?.map((k) => `'${k}'`).join(', ');
    revalidations.push(`
      await nextInvalidateByKeys({
        cacheConfigPromise: getCacheConfigSnapshot(),
        invalidateKeys: [${keys}]
      });`);
  }

  const imports = [
    "import { z } from 'zod';",
    "import { authedAction } from './safe-action';",
    "import { runRpc } from './run-rpc-instance';",
    // "import { logActionFailure } from '../errors';", // Removed - Lazy imported
    "import type { Database } from '@heyclaude/database-types';",
  ];

  const hasRevalidatePath = config.revalidatePaths && config.revalidatePaths.length > 0;
  const hasRevalidateTag = config.revalidateTags && config.revalidateTags.length > 0;

  // Lazy import handling for next/cache
  // We don't add static imports here

  // Lazy import handling for cache utils
  // We don't add static imports here

  let successHookCall = '';
  if (config.hooks?.onSuccess) {
    const [importPath, exportName] = config.hooks.onSuccess.split('#');
    // imports.push(`import { ${exportName} } from '${importPath}';`); // Removed - Lazy loaded

    successHookCall = `
      // Lazy load hook to avoid server-only side effects at top level
      const { ${exportName} } = await import('${importPath}');
      const hookResult = await ${exportName}(result, ctx, parsedInput);
      if (hookResult) {
        return hookResult;
      }
    `;
  }

  const fileContent = `'use server';

// -----------------------------------------------------------------------------
// 🔒 AUTO-GENERATED - DO NOT EDIT
// Generated by packages/generators/src/commands/generate-server-actions.ts
// -----------------------------------------------------------------------------

${imports.join('\n')}

${schemaCode}

export const ${actionName} = authedAction
  .metadata({ actionName: '${actionName}', category: '${config.category || 'generated'}' })
  .inputSchema(${inputSchemaRef})
  .action(async ({ parsedInput, ctx }) => {
    try {
      const rawResult = await runRpc<Database['public']['Functions']['${config.rpc}']['Returns']>(
        '${config.rpc}',
        {
          ${rpcArgs.join(',\n          ')}
        },
        {
          action: '${actionName}.rpc',
          userId: ctx.userId,
        }
      );

      ${
        config.returnStyle === 'first_row'
          ? `
      const result = (Array.isArray(rawResult) ? rawResult[0] : rawResult) as Database['public']['Functions']['${config.rpc}']['Returns'] extends (infer U)[] ? U : Database['public']['Functions']['${config.rpc}']['Returns'];
      `
          : `
      const result = rawResult;
      `
      }
      
      // Lazy import server-only dependencies
      ${hasRevalidatePath || hasRevalidateTag ? `const { revalidatePath, revalidateTag } = await import('next/cache');` : ''}
      ${
        hasCacheInvalidation
          ? `
      const { nextInvalidateByKeys } = await import('../cache-tags');
      const { getCacheConfigSnapshot } = await import('../cache-config');`
          : ''
      }

      // Simple success check?
      // Some RPCs return void, some return { success: boolean }?
      // We assume implicit success if no error thrown by runRpc.
      
      ${revalidations.join('\n      ')}

      ${successHookCall}

      return result;
    } catch (error) {
      // Lazy import logActionFailure
      const { logActionFailure } = await import('../errors');
      throw logActionFailure('${actionName}', error, {
        userId: ctx.userId,
        input: parsedInput
      });
    }
  });
`;

  writeFileSync(outputPath, fileContent);
  logger.info(`Wrote ${outputPath}`);
}
