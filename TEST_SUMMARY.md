# Unit Tests Generated for Git Diff

This document summarizes the comprehensive unit tests generated for the changed files in the current branch compared to `main`.

## Testing Framework

- **Framework**: Vitest
- **Location**: Tests are co-located with source files (e.g., `content.ts` → `content.test.ts`)
- **Configuration**: `vitest.config.ts` and `vitest.setup.ts` at repository root
- **Pattern**: Existing pattern from `packages/edge-runtime/src/utils/integrations/resend.test.ts`

## Test Files Created

### 1. Data Layer Services (`packages/data-layer/src/services/`)

#### `content.test.ts`
**File Under Test**: `content.ts`
**Test Coverage**:
- ✅ `getSitewideReadme()` - Returns README data, handles errors, handles null data
- ✅ `getSitewideLlmsTxt()` - Returns llms.txt data, handles RPC failures
- ✅ `getChangelogLlmsTxt()` - Returns changelog data, handles empty data
- ✅ Error logging with proper context
- ✅ Database connection error propagation
- ✅ Edge cases: null data, empty results, timeouts

**Key Test Scenarios**:
- Successful RPC calls with mock data
- RPC error handling and logging
- Null/empty data handling
- Database connection failures
- Error context preservation

#### `newsletter.test.ts`
**File Under Test**: `newsletter.ts`
**Test Coverage**:
- ✅ `subscribeToNewsletter()` - Valid subscriptions, duplicate handling, invalid emails
- ✅ `unsubscribeFromNewsletter()` - Successful unsubscribe, non-existent subscriptions
- ✅ Edge cases: empty emails, database timeouts
- ✅ Error handling and logging

**Key Test Scenarios**:
- Valid email subscription
- Duplicate subscription errors
- Invalid email format
- Non-existent subscription handling
- Database timeout scenarios

#### `account.test.ts`
**File Under Test**: `account.ts`
**Test Coverage**:
- ✅ `getAccountDashboard()` - Returns user dashboard, handles missing users
- ✅ `getUserLibrary()` - Returns collections, handles empty libraries
- ✅ `getUserDashboard()` - Returns dashboard data, handles missing profiles
- ✅ Error logging with RPC context
- ✅ Edge cases: empty args, special characters in IDs

**Key Test Scenarios**:
- Authenticated user dashboard retrieval
- User not found errors
- Empty library for new users
- Missing profile handling
- Special characters in user IDs

#### `rpc-error-logging.test.ts`
**File Under Test**: `utils/rpc-error-logging.ts`
**Test Coverage**:
- ✅ `logRpcError()` - Logs errors with context, handles missing messages
- ✅ Error code inclusion in context
- ✅ Null/undefined error handling
- ✅ Integration with shared-runtime logger

**Key Test Scenarios**:
- Error logging with full context
- Errors without message property
- Error code preservation
- Graceful handling of null/undefined

---

### 2. Web Runtime Actions (`packages/web-runtime/src/actions/`)

#### `content.test.ts`
**File Under Test**: `content.ts`
**Test Coverage**:
- ✅ `getReviewsWithStats` - Zod validation, auth context, data fetching
- ✅ `fetchPaginatedContent` - Defaults, category filtering, empty results
- ✅ Input validation: slug format, sort values, limit constraints
- ✅ Authenticated vs unauthenticated requests

**Key Test Scenarios**:
- Content type enum validation (Constants integration)
- Authenticated user context
- Unauthenticated requests (no userId)
- Failed data fetch error handling
- Slug regex pattern validation
- Sort enum validation
- Limit constraint enforcement
- Category filtering

---

### 3. Web Runtime Utilities

#### `errors.test.ts`
**File Under Test**: `errors.ts`
**Test Coverage**:
- ✅ `normalizeError()` - Error/string/object/primitive normalization
- ✅ `logActionFailure()` - Action failure logging with context
- ✅ `logClientWarning()` - Client warnings with err key
- ✅ `logUnhandledPromise()` - Promise rejection logging
- ✅ Context sanitization (removes undefined values)

**Key Test Scenarios**:
- Error object passthrough
- String to Error conversion
- Object to JSON Error conversion
- Circular reference handling (fallback)
- Null/undefined handling
- Primitive type conversion
- Context filtering (undefined removal)
- Empty context handling

#### `run-rpc.test.ts`
**File Under Test**: `rpc/run-rpc.ts`
**Test Coverage**:
- ✅ `createRunRpc()` - Factory function with dependencies
- ✅ Successful RPC calls with data return
- ✅ Error handling with normalization
- ✅ Error logging with context (userId, metadata)
- ✅ Client creation failure handling
- ✅ Type safety for custom RPC types

**Key Test Scenarios**:
- Successful RPC execution
- userId context preservation
- Metadata inclusion in context
- RPC error normalization
- Error logging with dbQuery context
- Client creation errors
- Null data handling
- Empty args objects
- Complex nested arguments
- Type-safe return values

#### `fetch-cached.test.ts`
**File Under Test**: `cache/fetch-cached.ts`
**Test Coverage**:
- ✅ Cache key generation and filtering
- ✅ Anonymous vs authenticated client selection
- ✅ Timeout handling with fallback
- ✅ Performance logging (slow queries vs fast queries)
- ✅ Error handling with fallback return
- ✅ Cache TTL configuration
- ✅ Cache tags

**Key Test Scenarios**:
- Successful data fetch and caching
- Null/undefined filtering from keyParts
- Anon client usage (default)
- Auth client usage (useAuth: true)
- Service call errors → fallback
- Timeout errors → fallback + warning
- Slow query detection (>1s) → warning
- Fast query logging → info
- Request ID generation and inclusion
- TTL from config
- Cache tag passing
- Empty keyParts
- Special characters in keys
- Complex object fallback

---

### 4. Shared Runtime (`packages/shared-runtime/src/`)

#### `timeout.test.ts`
**File Under Test**: `timeout.ts`
**Test Coverage**:
- ✅ `TimeoutError` class - Creation, properties, instanceof checks
- ✅ `withTimeout()` - Promise completion, timeout rejection, promise rejection
- ✅ `TIMEOUT_PRESETS` - Default values, immutability
- ✅ Race conditions and multiple concurrent timeouts

**Key Test Scenarios**:
- TimeoutError construction with timeoutMs
- Promise completion before timeout
- Complex data type resolution
- Async function results
- Timeout exceeded → TimeoutError
- Custom vs default error messages
- Very small timeouts (immediate)
- Promise rejection before timeout
- Custom error type propagation
- Zero/negative timeout handling
- Already resolved/rejected promises
- Undefined/null return values
- Race condition behavior (only resolves/rejects once)
- Multiple concurrent timeouts
- TIMEOUT_PRESETS usage

---

## Test Execution

### Run All Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Run Specific Test File
```bash
npx vitest run packages/data-layer/src/services/content.test.ts
```

### Run Tests with Coverage
```bash
npx vitest run --coverage
```

---

## Testing Patterns Used

### 1. Mock Setup Pattern
```typescript
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));
```

### 2. Supabase Client Mock
```typescript
mockSupabase = {
  rpc: vi.fn(),
} as unknown as SupabaseClient<Database>;
```

### 3. Service Test Structure
```typescript
describe('ServiceName', () => {
  let mockSupabase: SupabaseClient<Database>;
  let service: ServiceName;

  beforeEach(() => {
    mockSupabase = { rpc: vi.fn() } as unknown as SupabaseClient<Database>;
    service = new ServiceName(mockSupabase);
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange: Set up mock
      vi.mocked(mockSupabase.rpc).mockResolvedValue({ data: mockData, error: null });
      
      // Act: Call method
      const result = await service.methodName(args);
      
      // Assert: Verify behavior
      expect(mockSupabase.rpc).toHaveBeenCalledWith('rpc_name', args);
      expect(result).toEqual(mockData);
    });
  });
});
```

### 4. Error Handling Tests
```typescript
it('should throw error and log context', async () => {
  const mockError = { message: 'Error', code: 'ERR' };
  vi.mocked(mockSupabase.rpc).mockResolvedValue({ data: null, error: mockError });

  await expect(service.method(args)).rejects.toThrow();
  expect(logRpcError).toHaveBeenCalledWith(mockError, expectedContext);
});
```

### 5. Timeout Tests (with fake timers)
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should timeout when promise takes too long', async () => {
  const promise = new Promise(resolve => setTimeout(resolve, 2000));
  const result = withTimeout(promise, 1000);
  
  vi.advanceTimersByTime(1001);
  
  await expect(result).rejects.toThrow(TimeoutError);
});
```

---

## Test Coverage Goals

### Current Coverage Areas
- ✅ RPC call success/failure paths
- ✅ Error logging and context preservation
- ✅ Input validation (Zod schemas, regex patterns)
- ✅ Authentication context (authed vs anon)
- ✅ Cache behavior (TTL, tags, fallbacks)
- ✅ Timeout handling
- ✅ Error normalization
- ✅ Edge cases (null, undefined, empty, special chars)

### Coverage Thresholds (vitest.config.ts)
- Lines: 60%
- Functions: 60%
- Branches: 50%
- Statements: 60%

---

## Integration with CI/CD

Tests are integrated with the existing CI workflow:
- Pre-commit hooks (via lefthook)
- GitHub Actions CI pipeline
- Type checking + linting + testing

---

## Best Practices Followed

1. ✅ **Co-located tests** - Tests live next to source files
2. ✅ **Descriptive names** - Clear test descriptions
3. ✅ **AAA pattern** - Arrange, Act, Assert
4. ✅ **Mock external dependencies** - Supabase, Next.js APIs
5. ✅ **Test isolation** - Each test is independent
6. ✅ **Edge case coverage** - Null, undefined, empty, invalid inputs
7. ✅ **Error scenarios** - Database errors, timeouts, validation failures
8. ✅ **Type safety** - Full TypeScript support
9. ✅ **Consistent structure** - Following existing patterns (resend.test.ts)
10. ✅ **Documentation** - Comments explain test purpose

---

## Running Tests

### Prerequisites
```bash
pnpm install
```

### Execute Tests
```bash
# Run all tests once
pnpm test

# Watch mode for development
pnpm test:watch

# Coverage report
npx vitest run --coverage
```

---

## Notes

- Tests use vitest with globals enabled (describe, it, expect, vi available globally)
- Next.js APIs (next/headers, next/cache) are mocked in vitest.setup.ts
- Server-only modules are mocked to prevent import errors
- Tests follow the existing pattern from resend.test.ts
- All tests are TypeScript with full type safety
- Mock implementations preserve type information
- Tests are designed to be fast and isolated

---

## Future Enhancements

Potential areas for additional test coverage:
- Integration tests for edge functions
- E2E tests for critical user flows
- Performance tests for cache behavior
- Load tests for RPC endpoints
- Visual regression tests for UI components
- Accessibility tests for forms and interactions
