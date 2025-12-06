# CodeRabbit ast-grep Rules

This directory contains ast-grep rules for CodeRabbit code reviews. These rules enforce architectural patterns and coding standards.

## Directory Structure

```
config/coderabbit/
├── ast-grep-rules/          # Rule files (enforced patterns)
│   ├── logging-patterns.yml      # Logging standards enforcement
│   ├── design-system-violations.yml  # Design system usage enforcement
│   ├── security-patterns.yml     # Security best practices
│   └── client-server-boundaries.yml  # Next.js boundary enforcement
└── ast-grep-utils/          # Utility patterns (reusable)
    └── common-patterns.yml      # Shared pattern definitions
```

## Rule Files

### `logging-patterns.yml`
Enforces logging standards from `.cursor/rules/logging-instrumentation.mdc`:
- Detects `console.*` usage (should use `logger.*`)
- Detects missing `normalizeError()` in catch blocks
- Detects missing `requestId` in server components
- Detects missing `withDuration()` in server page logs
- Detects missing `useLoggedAsync` in client async operations

### `design-system-violations.yml`
Enforces design system usage from `.cursor/rules/design-system.mdc`:
- Detects inline Tailwind classes that have design system equivalents
- `mb-*` → `marginBottom.*`
- `mt-*` → `marginTop.*`
- `space-y-*` → `spaceY.*`
- `flex flex-col gap-*` → `stack.*`
- `flex items-center gap-*` → `cluster.*`
- `text-muted-foreground` → `muted.default`
- Icon sizing (`h-X w-X`) → `iconSize.*`
- `rounded-*` → `radius.*`
- `hover:bg-*` → `hoverBg.*`

### `security-patterns.yml`
Enforces security best practices from `.github/SECURITY.md`:
- Detects missing input validation before database queries
- Detects unsafe URL construction with user input
- Detects missing auth checks in API routes
- Detects missing auth checks in server actions
- Detects PII logging without hashing
- Detects dangerous `eval()` or `Function()` usage
- Detects unsanitized user input in `dangerouslySetInnerHTML`
- Detects missing CORS headers in API routes

### `client-server-boundaries.yml`
Enforces Next.js client/server boundaries:
- Detects server-only imports in client components
- Detects Node.js APIs in client components
- Detects browser APIs in server components
- Detects React hooks in server components
- Detects wrong logging imports (server logger in client, client logger in server)
- Detects missing `'use client'` directive in components with hooks

### `common-patterns.yml` (Utilities)
Reusable pattern definitions for other rules:
- User input identifiers
- Server-only imports
- Client-only imports
- React hooks
- Browser APIs
- Node.js APIs
- PII fields
- Authentication checks
- Database mutations

## Rule Format

Rules use YAML format with the following structure:

```yaml
---
id: rule-identifier
language: TypeScript
rule:
  pattern: pattern-to-match
  kind: ast_node_kind
  # Optional: relational rules
  has:
    pattern: nested-pattern
  inside:
    pattern: containing-pattern
  # Optional: composite rules
  all: [rule1, rule2]
  any: [rule1, rule2]
  not: rule
message: "Human-readable error message"
severity: error|warning
fix: |
  Optional fix suggestion
```

## Configuration

These rules are automatically loaded by CodeRabbit when configured in `.coderabbit.yaml`:

```yaml
reviews:
  tools:
    ast-grep:
      essential_rules: true
      rule_dirs:
        - "config/coderabbit/ast-grep-rules"
      util_dirs:
        - "config/coderabbit/ast-grep-utils"
```

## Testing Rules

To test rules locally, you can use the `ast-grep` CLI:

```bash
# Install ast-grep
npm install -g @ast-grep/cli

# Test a specific rule file
ast-grep scan --rule config/coderabbit/ast-grep-rules/logging-patterns.yml apps/web/src

# Test all rules
ast-grep scan --rule config/coderabbit/ast-grep-rules/*.yml apps/web/src
```

## Adding New Rules

1. Create a new YAML file in `ast-grep-rules/` or add to an existing file
2. Follow the rule format above
3. Test the rule with `ast-grep scan`
4. Update this README with the new rule description
5. Commit and CodeRabbit will automatically pick it up

## Rule Severity

- **error**: Critical violations that must be fixed (blocks merge)
- **warning**: Best practice violations (suggestions, doesn't block merge)

## References

- [ast-grep Documentation](https://ast-grep.github.io/)
- [CodeRabbit ast-grep Guide](https://docs.coderabbit.ai/guides/review-instructions)
- Logging Standards: `.cursor/rules/logging-instrumentation.mdc`
- Design System Standards: `.cursor/rules/design-system.mdc`
- Security Standards: `.github/SECURITY.md`
