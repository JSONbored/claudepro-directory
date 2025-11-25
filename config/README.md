# Configs Directory

Holds shared build/tooling configs (tsconfig.base.json, lint presets, etc.).

## Tools

- `tools/knip.json` - Knip configuration for unused code detection
- `tools/disable-server-only.cjs` - Tool to disable server-only checks
- `tools/eslintrc.json` - ESLint configuration for architectural rules (runs alongside Biome)
- `tools/eslint-plugin-architectural-rules.js` - Custom ESLint plugin enforcing:
  - `require-request-id-in-logger`: Ensures all logger.error/warn calls include `requestId` and `operation`
  - `require-error-handler`: Ensures API routes use `createErrorResponse` or `handleApiError`
