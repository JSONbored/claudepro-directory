# Type Safety Implementation Plan (Option A: Type-Preserving Proxy)

## Overview

This plan outlines the implementation of full type safety for Prismocker using a type-preserving Proxy approach. This will eliminate the need for `as any` assertions while maintaining Prismocker's standalone nature and compatibility with any Prisma schema.

## Current State Analysis

### Type System Issues

1. **Proxy breaks type inference**: `prisma.companies` returns `any` because Proxy's `get` handler returns `any`
2. **54 `as any` assertions** in test files across 3 files:
   * `packages/prismocker/src/__tests__/features/relations.test.ts` (8 instances)
   * `packages/prismocker/src/__tests__/integration/end-to-end.test.ts` (18 instances)
   * `packages/prismocker/src/__tests__/features/transactions.test.ts` (26 instances)
3. **Type helpers use `any[]`**: `setDataTyped` and `getDataTyped` accept `any[]` instead of proper Prisma types
4. **ModelProxy returns `any`**: Model operations return `any` instead of proper Prisma delegate types

### Current Type Flow

```
createPrismocker<PrismaClient>()
  → returns PrismockerClient (typed as PrismaClient)
  → Proxy intercepts property access
  → prisma.companies → returns any (Proxy breaks type inference)
  → ModelProxy.findMany() → returns any[]
```

### Desired Type Flow

```
createPrismocker<PrismaClient>()
  → returns ExtractModels<PrismaClient> (type-preserved)
  → Proxy intercepts property access (types preserved)
  → prisma.companies → returns PrismaClient['companies'] (fully typed)
  → ModelProxy.findMany() → returns Prisma.CompanyGetPayload<...>[]
```

## Implementation Plan

### Phase 1: Type Utilities (Foundation)

#### 1.1 Create Type Utilities in `src/prisma-types.ts`

**New Types to Add:**

````typescript
/**
 * Extract all Prismocker-specific methods from PrismaClient
 * These methods are added via type augmentation
 */
type PrismockerMethods = {
  reset(): void;
  getData<T = any>(modelName: string): T[];
  setData<T = any>(modelName: string, data: T[]): void;
  enableDebugMode(enabled?: boolean): void;
  getQueryStats(): QueryStats;
  visualizeState(options?: VisualizationOptions): string;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $use(middleware: Middleware): void;
  $on(event: string, callback: (event: any) => void): void;
  $metrics(): Metrics;
};

/**
 * Extract all model types from PrismaClient and preserve them through Proxy
 *
 * This type maps over all Prisma.ModelName values and extracts the corresponding
 * model delegate type from PrismaClient, preserving full type information.
 *
 * @template T - PrismaClient type (must extend PrismaClient)
 *
 * @example
 * ```typescript
 * type PrismockerClient = ExtractModels<PrismaClient>;
 * // PrismockerClient['companies'] is fully typed as PrismaClient['companies']
 * ```
 */
export type ExtractModels<T extends PrismaClient> = {
  [K in Prisma.ModelName]: T[K];
} & {
  // Preserve Prisma-specific methods
  $queryRaw: T['$queryRaw'];
  $queryRawUnsafe: T['$queryRawUnsafe'];
  $executeRaw: T['$executeRaw'];
  $executeRawUnsafe: T['$executeRawUnsafe'];
  $transaction: T['$transaction'];
  $connect: T['$connect'];
  $disconnect: T['$disconnect'];
  $use: T['$use'];
  $on: T['$on'];
  $metrics: T['$metrics'];
  $extends: T['$extends'];
} & PrismockerMethods;
````

**Files to Modify:**

* `packages/prismocker/src/prisma-types.ts` - Add new type utilities

**Dependencies:**

* Requires `Prisma.ModelName` from `@prisma/client`
* Requires `PrismaClient` type from `@prisma/client`

**Testing:**

* Create type tests to verify `ExtractModels<PrismaClient>` preserves all model types
* Verify `ExtractModels<PrismaClient>['companies']` matches `PrismaClient['companies']`

***

### Phase 2: Update Factory Function

#### 2.1 Update `createPrismocker` Function Signature

**Current:**

```typescript
export function createPrismocker<T = any>(options?: PrismockerOptions): T {
  return PrismockerClient.create(options) as unknown as T;
}
```

**New:**

```typescript
export function createPrismocker<T extends PrismaClient = PrismaClient>(
  options?: PrismockerOptions
): ExtractModels<T> {
  return PrismockerClient.create(options) as ExtractModels<T>;
}
```

**Files to Modify:**

* `packages/prismocker/src/index.ts` - Update function signature and return type

**Breaking Changes:**

* Generic constraint changed from `T = any` to `T extends PrismaClient = PrismaClient`
* Return type changed from `T` to `ExtractModels<T>`
* **Impact**: Users must pass `PrismaClient` type (which they already do)

**Testing:**

* Verify `createPrismocker<PrismaClient>()` returns `ExtractModels<PrismaClient>`
* Verify `prisma.companies` is fully typed (no `any`)

***

### Phase 3: Update Type Augmentation

#### 3.1 Update `types-augmentation.d.ts`

**Current:**

* Augments `PrismaClient` interface directly
* Methods are added to all `PrismaClient` instances

**New:**

* Keep augmentation for backward compatibility
* Add note that `ExtractModels<T>` includes these methods automatically
* Ensure methods are properly typed

**Files to Modify:**

* `packages/prismocker/src/types-augmentation.d.ts` - Add documentation about `ExtractModels`

**Testing:**

* Verify type augmentation still works
* Verify `ExtractModels<PrismaClient>` includes all Prismocker methods

***

### Phase 4: Update Type Helpers

#### 4.1 Update `setDataTyped` to Use Prisma Types

**Current:**

```typescript
export function setDataTyped<TClient extends PrismaClient>(
  prisma: TClient,
  model: string,
  data: any[] // ❌ Using any[]
): void;
```

**New:**

```typescript
export function setDataTyped<
  TClient extends PrismaClient,
  TModel extends Prisma.ModelName
>(
  prisma: TClient,
  model: TModel,
  data: Prisma.${TModel}CreateInput[] // ✅ Using Prisma generated types
): void
```

**Challenge:**

* Prisma's type system doesn't allow template literal types for `Prisma.${TModel}CreateInput`
* Need to use conditional types or mapped types

**Alternative Approach:**

```typescript
export function setDataTyped<TClient extends PrismaClient, TModel extends Prisma.ModelName>(
  prisma: TClient,
  model: TModel,
  data: Array<Prisma.InputJsonObject> // More flexible, still type-safe
): void;
```

**Files to Modify:**

* `packages/prismocker/src/prisma-types.ts` - Update `setDataTyped` signature

**Testing:**

* Verify `setDataTyped(prisma, 'companies', [...])` accepts correct types
* Verify TypeScript errors on incorrect types

#### 4.2 Update `getDataTyped` to Use Prisma Types

**Current:**

```typescript
export function getDataTyped<TClient extends PrismaClient>(prisma: TClient, model: string): any[]; // ❌ Using any[]
```

**New:**

```typescript
export function getDataTyped<
  TClient extends PrismaClient,
  TModel extends Prisma.ModelName
>(
  prisma: TClient,
  model: TModel
): Array<Prisma.${TModel}GetPayload<{}>> // ✅ Using Prisma generated types
```

**Files to Modify:**

* `packages/prismocker/src/prisma-types.ts` - Update `getDataTyped` signature

**Testing:**

* Verify `getDataTyped(prisma, 'companies')` returns correct types
* Verify return type matches Prisma's model type

***

### Phase 5: Update Jest Helpers

#### 5.1 Update `isPrismockerClient` Type Guard

**Current:**

```typescript
export function isPrismockerClient(
  prisma: PrismaClient
): prisma is PrismaClient & PrismockerMethods;
```

**New:**

```typescript
export function isPrismockerClient<T extends PrismaClient>(prisma: T): prisma is ExtractModels<T>;
```

**Files to Modify:**

* `packages/prismocker/src/jest-helpers.ts` - Update type guard signature

**Testing:**

* Verify type guard narrows type correctly
* Verify `isPrismockerClient(prisma)` allows access to Prismocker methods

***

### Phase 6: Update Client Implementation

#### 6.1 Update `PrismockerClient.create()` Return Type

**Current:**

```typescript
static create(options?: PrismockerOptions): any {
  return new Proxy(instance, { ... });
}
```

**New:**

```typescript
static create<T extends PrismaClient = PrismaClient>(
  options?: PrismockerOptions
): ExtractModels<T> {
  return new Proxy(instance, { ... }) as ExtractModels<T>;
}
```

**Challenge:**

* Proxy type preservation requires TypeScript 5.0+ features
* May need to use type assertions at runtime (types are compile-time only)

**Files to Modify:**

* `packages/prismocker/src/client.ts` - Update `create()` method signature

**Testing:**

* Verify Proxy still works at runtime
* Verify types are preserved at compile time

#### 6.2 Update `getModel()` Return Type

**Current:**

```typescript
private getModel(modelName: string): any {
  return this.modelProxies.get(modelName);
}
```

**New:**

```typescript
private getModel<TModel extends Prisma.ModelName>(
  modelName: TModel
): ModelProxy<TModel> {
  // Type assertion needed because we can't infer TModel from string at runtime
  return this.modelProxies.get(modelName) as ModelProxy<TModel>;
}
```

**Files to Modify:**

* `packages/prismocker/src/client.ts` - Update `getModel()` signature
* `packages/prismocker/src/model-proxy.ts` - Make `ModelProxy` generic

**Testing:**

* Verify model access is typed correctly
* Verify `prisma.companies.findMany()` returns correct types

***

### Phase 7: Update ModelProxy

#### 7.1 Make `ModelProxy` Generic

**Current:**

```typescript
export class ModelProxy {
  // Methods return any
}
```

**New:**

```typescript
export class ModelProxy<TModel extends Prisma.ModelName = Prisma.ModelName> {
  // Methods return proper Prisma types
  findMany(args?: Prisma.${TModel}FindManyArgs): Promise<Prisma.${TModel}GetPayload<...>[]>
  findUnique(args: Prisma.${TModel}FindUniqueArgs): Promise<Prisma.${TModel}GetPayload<...> | null>
  // etc.
}
```

**Challenge:**

* Prisma's type system uses template literal types that can't be directly used
* Need to use conditional types or mapped types

**Alternative Approach:**

* Keep `ModelProxy` non-generic
* Use type assertions in Proxy handler to preserve types
* Types are preserved through `ExtractModels<T>` mapping

**Files to Modify:**

* `packages/prismocker/src/model-proxy.ts` - Consider making generic (may not be necessary)

**Testing:**

* Verify all ModelProxy methods return correct types
* Verify type inference works for all operations

***

### Phase 8: Remove `as any` from Tests

#### 8.1 Update Test Files

**Files to Update:**

1. `packages/prismocker/src/__tests__/features/relations.test.ts` (8 instances)
2. `packages/prismocker/src/__tests__/integration/end-to-end.test.ts` (18 instances)
3. `packages/prismocker/src/__tests__/features/transactions.test.ts` (26 instances)

**Changes:**

* Replace `(prisma as any).companies` with `prisma.companies` (should be fully typed)
* Replace `(tx as any).companies` with `tx.companies` (should be fully typed)
* Remove all `as any` assertions

**Testing:**

* Run all tests to verify they pass
* Verify TypeScript compilation succeeds
* Verify no type errors in tests

***

### Phase 9: Documentation Updates

#### 9.1 Update README.md

**Sections to Update:**

1. **Type Safety** section - Add examples showing no `as any` needed
2. **Quick Start** section - Update examples to show full type safety
3. **Type-Safe Helpers** section - Update examples with new type signatures
4. **Migration Guide** - Add note about type safety improvements

**New Examples:**

```typescript
// ✅ Fully type-safe, no assertions needed
const prisma = createPrismocker<PrismaClient>();
const companies = await prisma.companies.findMany(); // Fully typed!
const company = await prisma.companies.findUnique({ where: { id: '1' } }); // Fully typed!
```

**Files to Modify:**

* `packages/prismocker/README.md` - Update all type safety examples

***

### Phase 10: Verification & Testing

#### 10.1 Type Safety Verification

**Tests to Create:**

1. Type test file: `src/__tests__/types/type-safety.test.ts`
2. Verify `prisma.companies` is fully typed
3. Verify `prisma.companies.findMany()` returns correct types
4. Verify `setDataTyped` and `getDataTyped` are type-safe
5. Verify transaction types are preserved

**Commands:**

```bash
# Type check
pnpm type-check

# Run tests
pnpm test

# Verify no type errors
tsc --noEmit
```

#### 10.2 Backward Compatibility Testing

**Tests:**

1. Verify existing code using `createPrismocker<PrismaClient>()` still works
2. Verify type augmentation still works
3. Verify Jest helpers still work
4. Verify all example files still work

***

## Implementation Order

1. **Phase 1**: Create type utilities (foundation)
2. **Phase 2**: Update factory function (core change)
3. **Phase 3**: Update type augmentation (compatibility)
4. **Phase 4**: Update type helpers (improve API)
5. **Phase 5**: Update Jest helpers (test utilities)
6. **Phase 6**: Update client implementation (runtime)
7. **Phase 7**: Update ModelProxy (if needed)
8. **Phase 8**: Remove `as any` from tests (cleanup)
9. **Phase 9**: Update documentation (user-facing)
10. **Phase 10**: Verification & testing (quality assurance)

## Potential Challenges

### Challenge 1: TypeScript Version Requirements

* **Issue**: Type-preserving Proxy may require TypeScript 5.0+
* **Solution**: Check current TypeScript version, update if needed
* **Impact**: May require updating `package.json` `devDependencies`

### Challenge 2: Prisma Type System Limitations

* **Issue**: Can't use template literal types like `Prisma.${TModel}CreateInput`
* **Solution**: Use conditional types or mapped types
* **Impact**: May need to use `Prisma.InputJsonObject` or similar

### Challenge 3: Runtime vs Compile-Time Types

* **Issue**: Proxy types are compile-time only, runtime still uses `any`
* **Solution**: Type assertions at runtime are acceptable (types are compile-time)
* **Impact**: No runtime impact, only compile-time type safety

### Challenge 4: Dynamic Model Names

* **Issue**: Some users may use dynamic model names (e.g., `prisma[modelName]`)
* **Solution**: Type system can't help with dynamic access, but static access is fully typed
* **Impact**: Dynamic access still needs `as any`, but static access is type-safe

## Success Criteria

1. ✅ `prisma.companies.findMany()` is fully typed (no `any`)
2. ✅ All 54 `as any` assertions removed from tests
3. ✅ `setDataTyped` and `getDataTyped` use Prisma types
4. ✅ TypeScript compilation succeeds with no errors
5. ✅ All tests pass
6. ✅ Backward compatibility maintained
7. ✅ Documentation updated with type safety examples

## Estimated Impact

* **Files Modified**: ~10 files
* **Lines Changed**: ~200-300 lines
* **Breaking Changes**: Minimal (only generic constraint change)
* **Type Safety Improvement**: Significant (eliminates 54+ `as any` assertions)
* **User Experience**: Much better (full IntelliSense, type checking)

## Next Steps

1. Review this plan with the team
2. Start with Phase 1 (type utilities)
3. Test incrementally after each phase
4. Document any deviations from plan
5. Verify success criteria after completion
