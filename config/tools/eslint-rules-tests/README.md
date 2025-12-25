# ESLint Rules Test Infrastructure

This directory contains test infrastructure for new ESLint rules to ensure they are thoroughly tested before being enabled in the main codebase.

## Structure

```
eslint-rules-tests/
├── README.md (this file)
└── test-runner.js (script to test rules on test files)

Note: Test files (violations.tsx, acceptable.tsx, autofix-expected.tsx) are gitignored
and should be created temporarily during rule development, then deleted.
```

## Creating Test Files

When developing a new rule, create temporary test files in subdirectories:

```
eslint-rules-tests/
└── your-rule-name/
    ├── violations.tsx (files that SHOULD trigger the rule)
    ├── acceptable.tsx (files that should NOT trigger the rule)
    └── autofix-expected.tsx (expected output after autofix)
```

**IMPORTANT:** These test files are gitignored. Delete them after rule development is complete.

## Testing Workflow

1. **Create temporary test files** with violations and acceptable patterns
2. **Implement rule** in `eslint-plugin-architectural-rules.js`
3. **Test detection** - Run ESLint on test files, verify violations are caught
4. **Test autofix** - Run ESLint with `--fix`, verify fixes are correct
5. **Verify no false positives** - Ensure acceptable patterns don't trigger
6. **Delete test files** - Remove temporary test files after verification
7. **Enable rule** in `eslint.config.mjs` only after all tests pass

## Important

- **NEVER run ESLint on the entire codebase** during rule development
- **ONLY test on files in this directory**
- **Verify autofixes are 110% safe** before enabling in main config
- **Test edge cases** thoroughly (template literals, conditional classes, etc.)
- **Delete test files** after rule development is complete (they're gitignored)

## Autofix Safety Policy

**CRITICAL:** Never add autofixes unless:

- ✅ Exhaustively tested on dedicated test files
- ✅ Verified 110% safe (no risk of breaking code)
- ✅ Tested on edge cases (template literals, conditional classes, etc.)
- ✅ Verified no false positives
- ✅ Peer reviewed and approved
