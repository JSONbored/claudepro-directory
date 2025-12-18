// Prisma Configuration for ClaudePro Directory
// 
// Prisma 7.1.0+ requires connection URLs in prisma.config.ts (not schema.prisma)
// Branch: feat_prisma-migration (project_ref: pyquxdlmqfkczsukahpi)
//
// Connection strings per Supabase official documentation:
// - DATABASE_URL: Transaction mode (port 6543) via Shared Connection Pooler
// - DIRECT_URL: Session mode (port 5432) via Shared Pooler for migrations/introspection

// Infisical injects secrets as environment variables automatically.
// For local development, run Prisma commands with: infisical run --env=dev -- <command>
// This file does NOT load .env files - all secrets must come from Infisical.

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // For Prisma CLI (migrations/introspection), use DIRECT_URL (session mode, port 5432)
    // This avoids "prepared statement already exists" errors with PgBouncer
    url: env('DIRECT_URL'),
    // Note: Prisma Client at runtime should use DATABASE_URL (transaction mode, port 6543)
    // This will be configured when initializing PrismaClient with adapter
  },
});
