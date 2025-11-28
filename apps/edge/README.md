# Supabase Edge Functions

This workspace contains Supabase Edge Functions running on Deno.

## Architecture

- **Runtime**: Deno
- **Framework**: Supabase Edge Runtime
- **Location**: `functions/`

## React Version Policy

⚠️ **IMPORTANT**: This workspace uses **React 18** (via Deno imports) because Supabase Edge Runtime and `react-email` / `satori` are optimized for it.

- **Edge**: React 18 (pinned in `functions/deno.json`)
- **Web**: React 19 (Node.js/Next.js)

Do not attempt to force React 19 here unless you have verified compatibility with Deno and `react-email`.

## Commands

- `pnpm lint`: Lint Deno functions
- `pnpm type-check`: Check types
- `pnpm deploy`: Deploy functions
