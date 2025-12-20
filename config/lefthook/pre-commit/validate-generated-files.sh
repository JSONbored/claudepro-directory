#!/bin/bash
# Validate generated files are up-to-date
# Checks service-worker, API client, and other generated files

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Validating generated files..."

ERRORS=0

# Check service-worker.js
if [ -f "apps/web/public/service-worker.js" ]; then
  SW_TIME=$(stat -f "%m" apps/web/public/service-worker.js 2>/dev/null || stat -c "%Y" apps/web/public/service-worker.js 2>/dev/null)
  SW_SOURCE_TIME=$(stat -f "%m" packages/generators/src/bin/minify-service-worker.ts 2>/dev/null || stat -c "%Y" packages/generators/src/bin/minify-service-worker.ts 2>/dev/null)
  
  if [ -n "$SW_TIME" ] && [ -n "$SW_SOURCE_TIME" ] && [ "$SW_SOURCE_TIME" -gt "$SW_TIME" ]; then
    log_warning "service-worker.js may be out of date"
    echo "   💡 Regenerate with: pnpm build:sw"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check API client
if [ -f "packages/database-types/src/api-client/client.generated.ts" ]; then
  API_TIME=$(stat -f "%m" packages/database-types/src/api-client/client.generated.ts 2>/dev/null || stat -c "%Y" packages/database-types/src/api-client/client.generated.ts 2>/dev/null)
  OPENAPI_TIME=$(stat -f "%m" openapi.json 2>/dev/null || stat -c "%Y" openapi.json 2>/dev/null)
  
  if [ -n "$API_TIME" ] && [ -n "$OPENAPI_TIME" ] && [ "$OPENAPI_TIME" -gt "$API_TIME" ]; then
    log_warning "API client may be out of date"
    echo "   💡 Regenerate with: pnpm generate:api-client"
    ERRORS=$((ERRORS + 1))
  fi
fi

if [ $ERRORS -gt 0 ]; then
  exit 1
fi

log_success "All generated files are up-to-date"
exit 0
