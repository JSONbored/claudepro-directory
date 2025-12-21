#!/bin/bash
# Validate Prisma schema
# Checks schema syntax and formatting

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Validating Prisma schema..."

# Check if schema file exists
if [ ! -f "prisma/schema.prisma" ]; then
  log_warning "Prisma schema not found - skipping validation"
  exit 0
fi

# Validate schema syntax
# Note: postgres-types-generator requires DIRECT_URL for introspection
# During pre-commit, Infisical may not be loaded, so we need to handle this gracefully
# For dev: secrets come from Infisical (infisical run --env=dev -- <command>)
# For production: secrets come from process.env (Vercel environment variables)

# Check if DIRECT_URL or POSTGRES_PRISMA_URL is available
if [ -z "$DIRECT_URL" ] && [ -z "$POSTGRES_PRISMA_URL" ]; then
  log_warning "DIRECT_URL/POSTGRES_PRISMA_URL not available - skipping Prisma validation"
  echo "   💡 To validate with database introspection, run:"
  echo "      infisical run --env=dev -- pnpm prisma validate"
  echo "   ℹ️  Schema syntax validation skipped (generator requires database connection)"
  exit 0
fi

# Run validation with available connection string
if ! pnpm prisma validate 2>&1; then
  log_error "Prisma schema validation failed"
  echo ""
  echo "💡 Fix with:"
  echo "   pnpm prisma validate"
  echo "   pnpm prisma format"
  echo ""
  echo "   Note: For dev environment, run with Infisical:"
  echo "   infisical run --env=dev -- pnpm prisma validate"
  exit 1
fi

log_success "Prisma schema is valid"
exit 0
