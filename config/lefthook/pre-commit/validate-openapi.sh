#!/bin/bash
# Validate OpenAPI schema
# Checks OpenAPI 3.0 schema syntax and structure

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Validating OpenAPI schema..."

# Check if openapi.json exists
if [ ! -f "openapi.json" ]; then
  log_warning "openapi.json not found - skipping validation"
  exit 0
fi

# Basic JSON validation
if ! jq empty openapi.json 2>/dev/null; then
  log_error "openapi.json is not valid JSON"
  echo "   💡 Fix with: jq . openapi.json"
  exit 1
fi

# Check for required OpenAPI 3.0 fields
if ! jq -e '.openapi' openapi.json >/dev/null 2>&1; then
  log_error "openapi.json missing 'openapi' field"
  exit 1
fi

if ! jq -e '.info' openapi.json >/dev/null 2>&1; then
  log_error "openapi.json missing 'info' field"
  exit 1
fi

if ! jq -e '.paths' openapi.json >/dev/null 2>&1; then
  log_error "openapi.json missing 'paths' field"
  exit 1
fi

log_success "OpenAPI schema is valid"
exit 0
