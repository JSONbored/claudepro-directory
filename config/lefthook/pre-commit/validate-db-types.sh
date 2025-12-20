#!/bin/bash
# Validate database types are up-to-date with schema
# Checks if Prisma types need regeneration

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Validating database type sync..."

# Check if schema file exists
if [ ! -f "prisma/schema.prisma" ]; then
  log_warning "Prisma schema not found - skipping validation"
  exit 0
fi

# Check if types directory exists
if [ ! -d "packages/database-types/src/prisma" ]; then
  log_warning "Database types not found - may need to run: pnpm prisma:generate:exec"
  exit 0
fi

# Check if schema is newer than generated types
SCHEMA_TIME=$(stat -f "%m" prisma/schema.prisma 2>/dev/null || stat -c "%Y" prisma/schema.prisma 2>/dev/null)
TYPES_TIME=$(stat -f "%m" packages/database-types/src/prisma/index.ts 2>/dev/null || stat -c "%Y" packages/database-types/src/prisma/index.ts 2>/dev/null)

if [ -z "$SCHEMA_TIME" ] || [ -z "$TYPES_TIME" ]; then
  log_warning "Could not check file timestamps - skipping validation"
  exit 0
fi

if [ "$SCHEMA_TIME" -gt "$TYPES_TIME" ]; then
  log_error "Database types are out of sync with schema"
  echo ""
  echo "💡 Regenerate types with:"
  echo "   pnpm prisma:generate:exec"
  echo ""
  exit 1
fi

log_success "Database types are up-to-date"
exit 0
