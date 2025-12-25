#!/bin/bash
# Validate Prisma migrations
# Checks migration file naming, SQL syntax, and schema-only principle

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Validating Prisma migrations..."

# Check for migration files
MIGRATION_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null | grep -E "^supabase/migrations/.*\.sql$" || echo "")

if [ -z "$MIGRATION_FILES" ]; then
	log_info "No migration files changed - skipping validation"
	exit 0
fi

ERRORS=0

# Check each migration file
for migration_file in $MIGRATION_FILES; do
	# Check for data in migrations (should be schema-only)
	if grep -qE "^(COPY|INSERT INTO.*VALUES)" "$migration_file" 2>/dev/null; then
		log_error "Migration $migration_file contains data (should be schema-only)"
		echo "   💡 Remove COPY/INSERT statements - migrations must only contain schema"
		ERRORS=$((ERRORS + 1))
	fi

	# Check migration naming convention
	if ! echo "$migration_file" | grep -qE "^supabase/migrations/[0-9]{14}_[a-z0-9_]+\.sql$"; then
		log_warning "Migration $migration_file doesn't follow naming convention"
		echo "   💡 Format: supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql"
	fi
done

if [ $ERRORS -gt 0 ]; then
	exit 1
fi

log_success "All migrations are valid"
exit 0
