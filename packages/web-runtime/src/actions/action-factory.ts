/**
 * Action Factory - Business Logic Helpers for Server Actions
 * 
 * Provides helper functions that handle business logic for server actions:
 * - Automatic RPC/service method calls
 * - Automatic error handling
 * - Automatic cache invalidation
 * - Post-action hooks support
 * 
 * **Important:** These are NOT server actions themselves. They are helper functions
 * that are called INSIDE next-safe-action handlers. Each action file uses
 * `authedAction` or `optionalAuthAction` directly from `safe-action.ts` and
 * calls these helpers inside the `.action()` handler.
 * 
 * **Benefits:**
 * - 50-60% LOC reduction per action
 * - Consistent patterns across all actions
 * - Automatic error handling and logging
 * - Centralized cache invalidation logic
 * - Proper next-safe-action integration (no type inference issues)
 * 
 * @module web-runtime/actions/action-factory
 */

import type { z } from 'zod';

/**
 * Context type for action handlers
 * Provided by next-safe-action middleware (authedAction/optionalAuthAction)
 */
export type ActionContext = {
  userId: string;
  userEmail?: string;
  authToken?: string;
};

/**
 * Optional action context (for optionalAuthAction)
 */
export type OptionalActionContext = {
  user: import('@supabase/supabase-js').User | null;
  userId?: string;
  userEmail?: string;
  authToken?: string;
};

/**
 * Cache invalidation configuration
 * 
 * Function signatures accept specific types inferred from Zod schemas,
 * but are compatible with the base signature for type safety.
 */
export interface CacheInvalidationConfig<TArgs = unknown> {
  /**
   * Paths to revalidate (Next.js revalidatePath)
   * Function receives result and optional args (inferred from schema)
   */
  paths?: string[] | ((result: unknown, args?: TArgs) => string[]);
  
  /**
   * Cache tags to revalidate (Next.js revalidateTag)
   * Function receives result, args (inferred from schema), and optional context
   */
  tags?: string[] | ((result: unknown, args?: TArgs, ctx?: ActionContext) => string[]);
}

/**
 * Post-action hook configuration
 */
export interface PostActionHook<TResult, TArgs, TCtx> {
  /**
   * Hook name (for logging)
   */
  name: string;
  
  /**
   * Hook function - called after successful action
   * Return value replaces action result if provided
   */
  handler: (result: TResult, args: TArgs, ctx: TCtx) => Promise<TResult | void>;
}

/**
 * Action factory configuration
 */
export interface MutationActionConfig<
  TInputSchema extends z.ZodTypeAny,
  TReturn = unknown
> {
  /**
   * Action name (for logging and metadata)
   */
  actionName: string;
  
  /**
   * Action category (for logging)
   */
  category?: 'analytics' | 'form' | 'content' | 'user' | 'admin' | 'reputation' | 'mfa';
  
  /**
   * Input validation schema (Zod schema instance)
   */
  inputSchema: TInputSchema;
  
  /**
   * RPC name to call (if using RPC)
   */
  rpcName?: string;
  
  /**
   * Service name and method (if using service method instead of RPC)
   */
  serviceMethod?: {
    service: string;
    method: string;
  };
  
  /**
   * Transform input to RPC args
   * Input type is inferred from the Zod schema instance
   */
  transformArgs: (input: z.infer<TInputSchema>, ctx: ActionContext) => Record<string, unknown>;
  
  /**
   * Cache invalidation configuration
   * Types are inferred from the Zod schema instance
   */
  cacheInvalidation?: CacheInvalidationConfig<z.infer<TInputSchema>>;
  
  /**
   * Post-action hooks (optional)
   * Input type is inferred from the Zod schema instance
   */
  hooks?: PostActionHook<TReturn, z.infer<TInputSchema>, ActionContext>[] | undefined;
  
  /**
   * Transform result before returning (optional)
   * Input type is inferred from the Zod schema instance
   */
  transformResult?: (result: unknown, args: z.infer<TInputSchema>) => TReturn;
}

/**
 * CRUD action schemas configuration
 */
export interface CrudSchemas<TCreate, TUpdate, TDelete> {
  create: z.ZodType<TCreate>;
  update: z.ZodType<TUpdate>;
  delete: z.ZodType<TDelete>;
}

/**
 * CRUD action configuration
 */
export interface CrudActionConfig<
  TCreate,
  TUpdate,
  TDelete,
  TCreateReturn = unknown,
  TUpdateReturn = unknown,
  TDeleteReturn = unknown
> {
  /**
   * Resource name (e.g., 'job', 'company', 'collection')
   */
  resource: string;
  
  /**
   * Action category
   */
  category?: 'analytics' | 'form' | 'content' | 'user' | 'admin' | 'reputation' | 'mfa';
  
  /**
   * Schemas for create/update/delete
   */
  schemas: CrudSchemas<TCreate, TUpdate, TDelete>;
  
  /**
   * RPC names (can be single RPC with action param, or separate RPCs)
   */
  rpcs: {
    create: string;
    update: string;
    delete: string;
  };
  
  /**
   * Transform input to RPC args for each action
   */
  transformArgs: {
    create: (input: TCreate, ctx: { userId: string; userEmail?: string; authToken?: string }) => Record<string, unknown>;
    update: (input: TUpdate, ctx: { userId: string; userEmail?: string; authToken?: string }) => Record<string, unknown>;
    delete: (input: TDelete, ctx: { userId: string; userEmail?: string; authToken?: string }) => Record<string, unknown>;
  };
  
  /**
   * Cache invalidation for each action
   * Types are inferred from the Zod schema instances
   */
  cacheInvalidation: {
    create: CacheInvalidationConfig<TCreate>;
    update: CacheInvalidationConfig<TUpdate>;
    delete: CacheInvalidationConfig<TDelete>;
  };
  
  /**
   * Post-action hooks (optional)
   */
  hooks?: {
    create?: PostActionHook<TCreateReturn, TCreate, { userId: string; userEmail?: string; authToken?: string }>[] | undefined;
    update?: PostActionHook<TUpdateReturn, TUpdate, { userId: string; userEmail?: string; authToken?: string }>[] | undefined;
    delete?: PostActionHook<TDeleteReturn, TDelete, { userId: string; userEmail?: string; authToken?: string }>[] | undefined;
  };
  
  /**
   * Transform results (optional)
   */
  transformResult?: {
    create?: (result: unknown, args: TCreate) => TCreateReturn;
    update?: (result: unknown, args: TUpdate) => TUpdateReturn;
    delete?: (result: unknown, args: TDelete) => TDeleteReturn;
  };
}

/**
 * Create CRUD action handlers (create, update, delete) from single config
 * 
 * Returns helper functions that handle business logic (RPC, cache, hooks).
 * These are used inside next-safe-action handlers, not as actions themselves.
 * 
 * @example
 * ```ts
 * const handlers = createCrudActionHandlers({
 *   resource: 'job',
 *   category: 'content',
 *   schemas: { create: createJobSchema, update: updateJobSchema, delete: deleteJobSchema },
 *   rpcs: { create: 'create_job_with_payment', update: 'update_job', delete: 'delete_job' },
 *   transformArgs: { ... },
 *   cacheInvalidation: { ... },
 * });
 * 
 * export const createJob = authedAction
 *   .inputSchema(createJobSchema)
 *   .metadata({ actionName: 'createJob', category: 'content' })
 *   .action(async ({ parsedInput, ctx }) => {
 *     return handlers.create(parsedInput, ctx);
 *   });
 * ```
 */
export function createCrudActionHandlers<
  TCreate,
  TUpdate,
  TDelete,
  TCreateReturn = unknown,
  TUpdateReturn = unknown,
  TDeleteReturn = unknown
>(config: CrudActionConfig<TCreate, TUpdate, TDelete, TCreateReturn, TUpdateReturn, TDeleteReturn>): {
  create: (input: TCreate, ctx: ActionContext) => Promise<TCreateReturn>;
  update: (input: TUpdate, ctx: ActionContext) => Promise<TUpdateReturn>;
  delete: (input: TDelete, ctx: ActionContext) => Promise<TDeleteReturn>;
} {
  const createConfig: MutationActionConfig<typeof config.schemas.create, TCreateReturn> = {
    actionName: `create${config.resource.charAt(0).toUpperCase() + config.resource.slice(1)}`,
    category: config.category ?? 'content',
    inputSchema: config.schemas.create,
    rpcName: config.rpcs.create,
    transformArgs: config.transformArgs.create,
    cacheInvalidation: config.cacheInvalidation.create,
    ...(config.hooks?.create ? { hooks: config.hooks.create } : {}),
    ...(config.transformResult?.create ? { transformResult: config.transformResult.create } : {}),
  };
  
  const updateConfig: MutationActionConfig<typeof config.schemas.update, TUpdateReturn> = {
    actionName: `update${config.resource.charAt(0).toUpperCase() + config.resource.slice(1)}`,
    category: config.category ?? 'content',
    inputSchema: config.schemas.update,
    rpcName: config.rpcs.update,
    transformArgs: config.transformArgs.update,
    cacheInvalidation: config.cacheInvalidation.update,
    ...(config.hooks?.update ? { hooks: config.hooks.update } : {}),
    ...(config.transformResult?.update ? { transformResult: config.transformResult.update } : {}),
  };
  
  const deleteConfig: MutationActionConfig<typeof config.schemas.delete, TDeleteReturn> = {
    actionName: `delete${config.resource.charAt(0).toUpperCase() + config.resource.slice(1)}`,
    category: config.category ?? 'content',
    inputSchema: config.schemas.delete,
    rpcName: config.rpcs.delete,
    transformArgs: config.transformArgs.delete,
    cacheInvalidation: config.cacheInvalidation.delete,
    ...(config.hooks?.delete ? { hooks: config.hooks.delete } : {}),
    ...(config.transformResult?.delete ? { transformResult: config.transformResult.delete } : {}),
  };

  return {
    create: (input, ctx) => executeMutationAction(createConfig, input, ctx),
    update: (input, ctx) => executeMutationAction(updateConfig, input, ctx),
    delete: (input, ctx) => executeMutationAction(deleteConfig, input, ctx),
  };
}

/**
 * Execute mutation action business logic
 * 
 * Helper function that handles RPC/service calls, cache invalidation, and hooks.
 * Used inside next-safe-action handlers.
 * 
 * Types are inferred from the Zod schema instances passed in the config.
 * 
 * @example
 * ```ts
 * export const addBookmark = authedAction
 *   .inputSchema(addBookmarkSchema)
 *   .metadata({ actionName: 'addBookmark', category: 'user' })
 *   .action(async ({ parsedInput, ctx }) => {
 *     return executeMutationAction({
 *       actionName: 'addBookmark',
 *       category: 'user',
 *       inputSchema: addBookmarkSchema, // Zod schema instance
 *       rpcName: 'add_bookmark',
 *       transformArgs: (input, ctx) => ({ ... }),
 *       cacheInvalidation: { ... },
 *     }, parsedInput, ctx);
 *   });
 * ```
 */
export async function executeMutationAction<
  TInputSchema extends z.ZodTypeAny,
  TReturn = unknown
>(
  config: MutationActionConfig<TInputSchema, TReturn>,
  input: z.infer<TInputSchema>,
  ctx: ActionContext
): Promise<TReturn> {
  // Import server-only utilities (lazy loading)
  const { runRpc } = await import('./run-rpc-instance.ts');
  const { logActionFailure } = await import('../errors.ts');
  
  try {
    // Call RPC or service method
    let rawResult: unknown;
    
    if (config.serviceMethod) {
      // Use service method
      const { getService } = await import('../data/service-factory.ts');
      const service = await getService(config.serviceMethod.service as 'content' | 'account' | 'changelog' | 'companies' | 'jobs' | 'misc' | 'newsletter' | 'search' | 'trending');
      const serviceRecord = service as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
      const method = serviceRecord[config.serviceMethod.method];
      
      if (!method) {
        throw new Error(`Service method ${config.serviceMethod.service}.${config.serviceMethod.method} not found`);
      }
      
      const args = config.transformArgs(input, ctx);
      rawResult = await method.call(service, args);
    } else if (config.rpcName) {
      // Use RPC
      const args = config.transformArgs(input, ctx);
      rawResult = await runRpc<TReturn>(
        config.rpcName,
        args,
        {
          action: `${config.actionName}.rpc`,
          userId: ctx.userId,
        }
      );
    } else {
      throw new Error('Either rpcName or serviceMethod must be provided');
    }
    
    // Transform result if needed
    const result = config.transformResult
      ? config.transformResult(rawResult, input)
      : (rawResult as TReturn);
    
    // Handle cache invalidation
    if (config.cacheInvalidation) {
      const { revalidatePath, revalidateTag } = await import('next/cache');
      
      // Revalidate paths
      if (config.cacheInvalidation.paths) {
        const paths = typeof config.cacheInvalidation.paths === 'function'
          ? config.cacheInvalidation.paths(result, input)
          : config.cacheInvalidation.paths;
        
        for (const path of paths) {
          revalidatePath(path);
        }
      }
      
      // Revalidate tags
      if (config.cacheInvalidation.tags) {
        const tags = typeof config.cacheInvalidation.tags === 'function'
          ? config.cacheInvalidation.tags(result, input, ctx)
          : config.cacheInvalidation.tags;
        
        for (const tag of tags) {
          revalidateTag(tag, 'default');
        }
      }
    }
    
    // Execute post-action hooks
    if (config.hooks && config.hooks.length > 0) {
      let finalResult = result;
      for (const hook of config.hooks) {
        try {
          const hookResult = await hook.handler(finalResult, input, ctx);
          // If hook returns a value, use it as the new result (for next hook or final return)
          if (hookResult !== undefined) {
            finalResult = hookResult;
          }
        } catch (hookError) {
          // Log hook errors but don't fail the action
          const { logger } = await import('../logger.ts');
          const { normalizeError } = await import('../errors.ts');
          const normalized = normalizeError(hookError, `Hook ${hook.name} failed`);
          logger.error({
            err: normalized,
            hookName: hook.name,
            actionName: config.actionName,
            userId: ctx.userId,
          }, `Post-action hook ${hook.name} failed`);
        }
      }
      return finalResult;
    }
    
    return result;
  } catch (error) {
    // Error handling is automatic via logActionFailure in runRpc
    // But we still need to handle service method errors
    const { toLogContextValue } = await import('../logger.ts');
    throw logActionFailure(config.actionName, error, {
      userId: ctx.userId,
      input: toLogContextValue(input),
    });
  }
}

