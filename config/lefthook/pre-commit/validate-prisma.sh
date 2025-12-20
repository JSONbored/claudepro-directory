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
if ! pnpm prisma validate 2>&1; then
  log_error "Prisma schema validation failed"
  echo ""
  echo "💡 Fix with:"
  echo "   pnpm prisma validate"
  echo "   pnpm prisma format"
  exit 1
fi

log_success "Prisma schema is valid"
exit 0
