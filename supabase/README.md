# Supabase Directory

<!--toc:start-->
- [Supabase Directory](#supabase-directory)
  - [Structure](#structure)
  - [Purpose](#purpose)
  - [Migration Files](#migration-files)
  - [Related Directories](#related-directories)
  - [Setup](#setup)
<!--toc:end-->

This directory contains Supabase configuration and migrations for GitHub Integration and branch management.

## Structure

- `config.toml` - Supabase configuration for migrations and branching
- `migrations/` - Database migration files (auto-generated from production)
- `seed.sql` - Optional seed data for preview branches (not committed)

## Purpose

This directory is used by:

- **Supabase GitHub Integration** - Automatically applies migrations to preview branches
- **Branch Management** - Each GitHub branch gets a corresponding Supabase branch with migrations applied

## Migration Files

Migration files in `migrations/` are:
- Generated from production database using `supabase db pull --linked`
- Applied automatically to preview branches when created
- Committed to git for version control

## Related Directories

- `apps/edge/supabase/` - Edge Functions configuration (separate from migrations)
- `apps/edge/supabase/functions/` - Edge Functions code

## Setup

To generate migration files from production:

```bash
# Link to production project
supabase link --project-ref hgtjdifxfapoltfflowc

# Pull schema as migrations
supabase db pull --linked
```

This will create migration files in `migrations/` that reflect your current production schema.

---

**Note**: This branch (`feat/prisma-migration`) is set up for Prisma migration work. The initial schema migration (`20251214190000_initial_schema.sql`) contains the complete production schema and will be applied automatically when Supabase creates the corresponding branch.
