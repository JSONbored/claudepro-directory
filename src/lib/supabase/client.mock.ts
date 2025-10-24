/**
 * Supabase Client - Storybook Mock Implementation
 *
 * This file provides a no-op mock implementation of the Supabase client
 * for Storybook component isolation. Real implementation uses @supabase/ssr.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real client.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/supabase/client.ts for production implementation
 */

/**
 * OAuth options type for Supabase signInWithOAuth
 * Minimal type definition for mock - real type comes from @supabase/supabase-js
 */
type SignInWithOAuthOptions = {
  provider: string;
  options?: Record<string, unknown>;
};

/**
 * Mock query builder return type
 */
type MockQueryResult = Promise<{ data: null; error: null }>;

/**
 * Chainable query builder mock
 * Returns a mock builder that chains all query methods and returns empty results
 */
function createQueryBuilder(): MockQueryResult {
  const promise = Promise.resolve({ data: null, error: null }) as MockQueryResult;

  // Add chainable methods that return the promise itself
  const builder = promise as MockQueryResult & {
    select: () => MockQueryResult;
    insert: () => MockQueryResult;
    update: () => MockQueryResult;
    delete: () => MockQueryResult;
    upsert: () => MockQueryResult;
    eq: () => MockQueryResult;
    neq: () => MockQueryResult;
    gt: () => MockQueryResult;
    gte: () => MockQueryResult;
    lt: () => MockQueryResult;
    lte: () => MockQueryResult;
    like: () => MockQueryResult;
    ilike: () => MockQueryResult;
    is: () => MockQueryResult;
    in: () => MockQueryResult;
    contains: () => MockQueryResult;
    containedBy: () => MockQueryResult;
    rangeGt: () => MockQueryResult;
    rangeGte: () => MockQueryResult;
    rangeLt: () => MockQueryResult;
    rangeLte: () => MockQueryResult;
    rangeAdjacent: () => MockQueryResult;
    overlaps: () => MockQueryResult;
    textSearch: () => MockQueryResult;
    match: () => MockQueryResult;
    not: () => MockQueryResult;
    or: () => MockQueryResult;
    filter: () => MockQueryResult;
    order: () => MockQueryResult;
    limit: () => MockQueryResult;
    range: () => MockQueryResult;
    abortSignal: () => MockQueryResult;
    single: () => MockQueryResult;
    maybeSingle: () => MockQueryResult;
    csv: () => MockQueryResult;
  };

  // Assign all chainable methods to return the builder itself
  builder.select = () => builder;
  builder.insert = () => builder;
  builder.update = () => builder;
  builder.delete = () => builder;
  builder.upsert = () => builder;
  builder.eq = () => builder;
  builder.neq = () => builder;
  builder.gt = () => builder;
  builder.gte = () => builder;
  builder.lt = () => builder;
  builder.lte = () => builder;
  builder.like = () => builder;
  builder.ilike = () => builder;
  builder.is = () => builder;
  builder.in = () => builder;
  builder.contains = () => builder;
  builder.containedBy = () => builder;
  builder.rangeGt = () => builder;
  builder.rangeGte = () => builder;
  builder.rangeLt = () => builder;
  builder.rangeLte = () => builder;
  builder.rangeAdjacent = () => builder;
  builder.overlaps = () => builder;
  builder.textSearch = () => builder;
  builder.match = () => builder;
  builder.not = () => builder;
  builder.or = () => builder;
  builder.filter = () => builder;
  builder.order = () => builder;
  builder.limit = () => builder;
  builder.range = () => builder;
  builder.abortSignal = () => builder;
  builder.single = () => builder;
  builder.maybeSingle = () => builder;
  builder.csv = () => builder;

  return builder;
}

/**
 * Mock Supabase client factory
 * Returns a mock client with no-op auth methods and database query builder
 */
export function createClient() {
  return {
    auth: {
      signInWithOAuth: async (_options: SignInWithOAuthOptions) => {
        return { data: null, error: null };
      },
      signOut: async () => {
        return { error: null };
      },
      getUser: async () => {
        return { data: { user: null }, error: null };
      },
      getSession: async () => {
        return { data: { session: null }, error: null };
      },
    },
    from: (_table: string) => createQueryBuilder(),
    rpc: (_fn: string, _params?: Record<string, unknown>) => createQueryBuilder(),
  };
}
