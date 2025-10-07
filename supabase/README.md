# Supabase Database Schema

This directory contains the database schema for ClaudePro Directory.

## 📁 Structure

```
supabase/
├── schema.sql          # ⭐ Current production schema (consolidated)
├── archive/            # Historical schema files (reference only)
│   ├── supabase-schema.sql
│   ├── supabase-function-fixes.sql
│   └── supabase-sponsored-increment.sql
└── README.md           # This file
```

## 🚀 Fresh Setup

**For new developers or disaster recovery:**

1. Go to your Supabase project's SQL Editor
2. Run the entire `schema.sql` file
3. Configure OAuth providers in Supabase Authentication settings:
   - Enable GitHub OAuth
   - Enable Google OAuth
4. Ensure Vercel environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Production Database

**If you already have a production database running:**

**DO NOT run `schema.sql` again!** It represents the current state that's already deployed. This file is for documentation and new environment setup only.

## 📝 What's in the Schema

- **16 tables**: Users, bookmarks, jobs, sponsored content, payments, etc.
- **Security functions**: With `SET search_path` to prevent schema hijacking
- **RLS policies**: Row Level Security for all tables
- **Triggers**: Auto-updates for `updated_at`, slug generation, vote counts
- **Atomic operations**: `increment()` function for safe counter updates
- **Performance indexes**: Optimized for common queries

## 🔒 Security Features

All functions use `SECURITY DEFINER` with explicit `SET search_path = public` to prevent:
- Schema hijacking attacks
- SQL injection via search_path manipulation
- Unauthorized privilege escalation

## 🏗️ Future Migrations

When you need to make schema changes, consider using Supabase CLI for proper migrations:

```bash
# Install Supabase CLI
npm install supabase --save-dev

# Initialize (one time)
npx supabase init

# Create new migration
npx supabase db diff --file add_new_feature

# Apply to remote
npx supabase db push
```

## 📦 Archive

The `archive/` directory contains the historical SQL files that were consolidated into `schema.sql`:
- These were already run in production
- Kept for reference and history
- DO NOT run these files again

## 📚 Learn More

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
