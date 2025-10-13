# Test Coverage Reporting

Comprehensive guide for test coverage reporting in claudepro-directory.

## Overview

**Production-First Coverage Strategy:**
- ✅ **Main branch**: Full coverage reporting with Codecov integration
- ⚡ **Pull Requests**: Fast test-only runs (no coverage overhead)
- 📊 **CI Summary**: Automatic coverage metrics in GitHub Actions

**Why main-only coverage?**
- Faster PR feedback (tests run ~50% faster without coverage)
- Production metrics that matter (what's actually deployed)
- Reduced CI resource usage
- Codecov tracks trends over time on main branch

## CI/CD Integration

### Current Setup

**Test Job** (`.github/workflows/ci.yml:43-94`)
```yaml
test:
  name: Test Suite
  runs-on: ubuntu-latest
  timeout-minutes: 10

  steps:
    - name: Run tests (with coverage on main)
      run: |
        if [ "${{ github.ref }}" = "refs/heads/main" ]; then
          npm run test:coverage  # Full coverage
        else
          npm run test:unit      # Fast tests only
        fi

    - name: Upload coverage reports to Codecov (main only)
      if: github.ref == 'refs/heads/main'
      uses: codecov/codecov-action@v5
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        files: ./coverage/lcov.info
        flags: unittests
        fail_ci_if_error: false

    - name: Generate coverage summary (main only)
      if: github.ref == 'refs/heads/main'
      run: |
        # Generates markdown table in GitHub Actions summary
        # Example output:
        # | Metric      | Coverage |
        # |-------------|----------|
        # | Lines       | 72.45%   |
        # | Statements  | 71.23%   |
        # | Functions   | 68.90%   |
        # | Branches    | 65.12%   |
```

### Coverage Thresholds

Defined in `vitest.config.ts:81-86`:
```typescript
thresholds: {
  lines: 70,       // Minimum 70% line coverage
  functions: 70,   // Minimum 70% function coverage
  branches: 65,    // Minimum 65% branch coverage
  statements: 70,  // Minimum 70% statement coverage
}
```

**Philosophy**: Start conservative, increase over time as coverage improves.

## Codecov Setup

### 1. Create Codecov Account

1. Go to [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Enable access to `claudepro-directory` repository

### 2. Get Upload Token

1. Navigate to: **Settings → General → Upload Token**
2. Copy the token (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 3. Add GitHub Secret

1. Go to GitHub repository → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `CODECOV_TOKEN`
4. Value: Paste the upload token from step 2
5. Click **Add secret**

### 4. Verify Integration

Push to main branch and check:
- ✅ CI test job shows "Upload coverage reports to Codecov"
- ✅ Coverage appears in Codecov dashboard
- ✅ GitHub Actions summary shows coverage table

## Local Development

### Run Tests

```bash
# Fast test run (recommended during development)
npm run test:unit

# Watch mode (re-runs on file changes)
npm run test:watch

# Interactive UI (browser-based test viewer)
npm run test:ui

# Full coverage report (what CI runs on main)
npm run test:coverage
```

### View Coverage Reports

After running `npm run test:coverage`:

**HTML Report** (interactive, detailed)
```bash
# Open in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

**Terminal Report** (quick overview)
```bash
cat coverage/lcov-report/index.html | grep -A 5 "coverage-summary"
```

**JSON Report** (machine-readable)
```bash
cat coverage/coverage-summary.json | jq '.total'
# Output:
# {
#   "lines": { "total": 1234, "covered": 890, "skipped": 0, "pct": 72.12 },
#   "statements": { "total": 1456, "covered": 1032, "skipped": 0, "pct": 70.88 },
#   ...
# }
```

## Coverage Reports

### Generated Files

All coverage reports are in `.gitignore` (never committed):

```
coverage/
├── lcov.info                 # LCOV format (for Codecov)
├── coverage-final.json       # V8 raw coverage data
├── coverage-summary.json     # Summary metrics (used by CI)
├── index.html                # HTML report entry point
└── lcov-report/              # Detailed HTML reports
    ├── index.html
    ├── src/
    │   ├── components/
    │   ├── lib/
    │   └── ...
    └── ...
```

### Understanding Reports

**Coverage Metrics:**
- **Lines**: Percentage of code lines executed during tests
- **Statements**: Percentage of executable statements run
- **Functions**: Percentage of functions called
- **Branches**: Percentage of code paths taken (if/else, switch, ternary)

**Color Coding** (HTML report):
- 🟢 **Green** (≥80%): Excellent coverage
- 🟡 **Yellow** (50-79%): Partial coverage
- 🔴 **Red** (<50%): Low coverage

## Writing Tests

### Test File Structure

```typescript
// src/lib/utils/__tests__/example.test.ts

import { describe, it, expect } from 'vitest';
import { myFunction } from '../example';

describe('myFunction', () => {
  it('handles basic case', () => {
    expect(myFunction('input')).toBe('expected');
  });

  it('handles edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBe(null);
  });

  it('throws on invalid input', () => {
    expect(() => myFunction(undefined)).toThrow();
  });
});
```

### Test Patterns

**Component Tests** (`src/components/**/__tests__/*.test.tsx`)
```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**Utility Tests** (`src/lib/**/__tests__/*.test.ts`)
```typescript
import { formatDate } from '../date-helpers';

describe('formatDate', () => {
  it('formats ISO dates correctly', () => {
    expect(formatDate('2025-01-15')).toBe('Jan 15, 2025');
  });
});
```

**Action Tests** (`src/lib/actions/__tests__/*.test.ts`)
```typescript
import { createReview } from '../review-actions';

describe('createReview', () => {
  it('validates required fields', async () => {
    const result = await createReview({
      rating: 5,
      contentType: 'agents',
      contentSlug: 'test-agent'
    });
    expect(result).toHaveProperty('success', true);
  });
});
```

## Improving Coverage

### Find Uncovered Code

**Using HTML Report:**
1. Run `npm run test:coverage`
2. Open `coverage/index.html`
3. Navigate to files with low coverage
4. Red-highlighted lines = untested code

**Using CLI:**
```bash
# Generate coverage report
npm run test:coverage

# Find files under 70% coverage
cat coverage/coverage-summary.json | \
  jq -r 'to_entries | .[] | select(.value.lines.pct < 70) | .key'
```

### Coverage Improvement Strategy

1. **Start with critical paths**: Auth, payments, data validation
2. **Test error handling**: Network failures, validation errors
3. **Cover edge cases**: Empty arrays, null values, boundary conditions
4. **Mock external dependencies**: Supabase, Redis, APIs
5. **Avoid testing implementation details**: Test behavior, not internals

### Example: Before vs After

**Before** (50% coverage):
```typescript
export function processData(data: string[]) {
  return data.map(item => item.toUpperCase());
}

// Test
it('processes data', () => {
  expect(processData(['a', 'b'])).toEqual(['A', 'B']);
});
```

**After** (100% coverage):
```typescript
export function processData(data: string[]) {
  if (!data || data.length === 0) return [];
  return data.map(item => item.toUpperCase());
}

// Tests
it('processes data', () => {
  expect(processData(['a', 'b'])).toEqual(['A', 'B']);
});

it('handles empty array', () => {
  expect(processData([])).toEqual([]);
});

it('handles null input', () => {
  expect(processData(null)).toEqual([]);
});
```

## Troubleshooting

### Coverage Not Uploading to Codecov

**Symptom**: CI runs but Codecov shows no data

**Solutions**:
1. Verify `CODECOV_TOKEN` secret is set in GitHub
2. Check CI logs for upload errors
3. Ensure `lcov.info` file exists in coverage directory
4. Verify Codecov action version is v5

### Tests Pass Locally, Fail in CI

**Common Causes**:
1. **Environment variables**: Missing in CI
2. **File paths**: Use `path.join()` instead of hardcoded paths
3. **Timezone differences**: Use UTC in tests
4. **Async timing**: Add proper `await` statements

**Debug**:
```bash
# Run in CI-like environment
NODE_ENV=test npm run test:unit
```

### Coverage Thresholds Failing

**Symptom**: Tests pass but coverage check fails

**Solutions**:
1. Run `npm run test:coverage` locally
2. Identify uncovered files in HTML report
3. Add tests for uncovered code
4. Or temporarily lower thresholds in `vitest.config.ts`

### Out of Memory Errors

**Symptom**: Tests crash with "JavaScript heap out of memory"

**Solutions**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run test:coverage

# Or run tests in smaller batches
npm run test -- src/lib/**/*.test.ts
npm run test -- src/components/**/*.test.tsx
```

## Best Practices

### DO ✅

- Run `npm run test:watch` during development
- Write tests before fixing bugs (TDD for bug fixes)
- Test error cases and edge cases
- Use descriptive test names: `it('throws error when user is not authenticated')`
- Mock external dependencies (Supabase, Redis, APIs)
- Keep tests fast (<100ms per test)

### DON'T ❌

- Commit coverage reports (they're in `.gitignore`)
- Test implementation details (test behavior instead)
- Write tests that depend on other tests
- Use `setTimeout` in tests (use `waitFor` from testing-library)
- Skip failing tests (fix or remove them)
- Aim for 100% coverage artificially (focus on critical paths)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Codecov Documentation](https://docs.codecov.com/)
- [V8 Coverage Provider](https://vitest.dev/guide/coverage.html#coverage-providers)

## Configuration Files

**`vitest.config.ts`** - Test framework configuration
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
  reportsDirectory: './coverage',
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 65,
    statements: 70,
  },
}
```

**`tests/setup.tsx`** - Global test setup
- Mocks Next.js APIs (navigation, headers, cookies)
- Configures testing-library
- Mocks browser APIs (IntersectionObserver, ResizeObserver)

**`.github/workflows/ci.yml`** - CI/CD pipeline
- Runs tests on every commit
- Generates coverage on main branch only
- Uploads to Codecov
- Creates GitHub Actions summary

---

**Last Updated**: 2025-10-10
**Coverage Status**: [![codecov](https://codecov.io/gh/JSONbored/claudepro-directory/branch/main/graph/badge.svg)](https://codecov.io/gh/JSONbored/claudepro-directory)
