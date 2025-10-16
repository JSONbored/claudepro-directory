#!/usr/bin/env bash
#
# SEO Quality Gates Checker
#
# Purpose: Validates SEO quality standards based on metadata validation report
# Exit codes: 0 = passed, 1 = failed
#
# Usage: bash scripts/check-quality-gates.sh <metadata-report-file>
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPORT_FILE="${1:-metadata-report.txt}"
FAILED=false

echo "=== SEO Quality Gates Check ==="
echo "Report file: $REPORT_FILE"
echo ""

# Validate report file exists
if [ ! -f "$REPORT_FILE" ]; then
  echo -e "${RED}❌ Error: Report file not found: $REPORT_FILE${NC}"
  exit 1
fi

# Quality Gate 1: No missing routes
echo "Quality Gate 1: Route Coverage"
MISSING_ROUTES=$(grep -c "Missing Metadata:" "$REPORT_FILE" 2>/dev/null || echo "0")

if [ "$MISSING_ROUTES" -gt "0" ]; then
  echo -e "${RED}❌ FAILED: $MISSING_ROUTES routes missing metadata${NC}"
  echo "   All public routes must have metadata registry entries"
  FAILED=true
else
  echo -e "${GREEN}✅ PASSED: All routes have metadata${NC}"
fi
echo ""

# Quality Gate 2: No metadata bypasses
echo "Quality Gate 2: Metadata System Integrity"
BYPASSES=$(grep -c "Bypasses found" "$REPORT_FILE" 2>/dev/null || echo "0")

if [ "$BYPASSES" -gt "0" ]; then
  echo -e "${RED}❌ FAILED: Metadata system bypasses detected${NC}"
  echo "   All pages must use generatePageMetadata() - no direct metadata exports"
  FAILED=true
else
  echo -e "${GREEN}✅ PASSED: No bypasses detected${NC}"
fi
echo ""

# Quality Gate 3: All MDX files pass validation
echo "Quality Gate 3: MDX File Validation"
MDX_FAILED=$(grep -c "❌ Failed:" "$REPORT_FILE" 2>/dev/null || echo "0")

if [ "$MDX_FAILED" -gt "0" ]; then
  echo -e "${RED}❌ FAILED: $MDX_FAILED MDX validation errors${NC}"
  echo "   All MDX files must have valid frontmatter and SEO metadata"
  FAILED=true
else
  echo -e "${GREEN}✅ PASSED: All MDX files valid${NC}"
fi
echo ""

# Quality Gate 4: No placeholder text
echo "Quality Gate 4: Content Quality"
PLACEHOLDERS=$(grep -iEc "(undefined|TODO|FIXME|placeholder)" "$REPORT_FILE" 2>/dev/null || echo "0")

if [ "$PLACEHOLDERS" -gt "0" ]; then
  echo -e "${YELLOW}⚠️  WARNING: $PLACEHOLDERS potential placeholder texts found${NC}"
  echo "   Review metadata for undefined, TODO, FIXME, or placeholder content"
  # Not failing on this - just a warning
else
  echo -e "${GREEN}✅ PASSED: No placeholder text detected${NC}"
fi
echo ""

# Quality Gate 5: Title length compliance
echo "Quality Gate 5: Title Length Compliance"
TITLE_ISSUES=$(grep -c "title.*too long\|title.*exceeds" "$REPORT_FILE" 2>/dev/null || echo "0")

if [ "$TITLE_ISSUES" -gt "0" ]; then
  echo -e "${YELLOW}⚠️  WARNING: $TITLE_ISSUES title length issues${NC}"
  echo "   Titles should be 55-60 characters for optimal Google display"
  # Not failing on this - just a warning
else
  echo -e "${GREEN}✅ PASSED: Title lengths compliant${NC}"
fi
echo ""

# Quality Gate 6: Description length compliance
echo "Quality Gate 6: Description Length Compliance"
DESC_ISSUES=$(grep -c "description.*too long\|description.*exceeds" "$REPORT_FILE" 2>/dev/null || echo "0")

if [ "$DESC_ISSUES" -gt "0" ]; then
  echo -e "${YELLOW}⚠️  WARNING: $DESC_ISSUES description length issues${NC}"
  echo "   Descriptions should be 150-160 characters for optimal AI/Google display"
  # Not failing on this - just a warning
else
  echo -e "${GREEN}✅ PASSED: Description lengths compliant${NC}"
fi
echo ""

# Summary
echo "=== Quality Gates Summary ==="
if [ "$FAILED" = true ]; then
  echo -e "${RED}❌ Quality gates FAILED${NC}"
  echo ""
  echo "Critical issues must be fixed:"
  echo "  1. Missing route metadata"
  echo "  2. Metadata system bypasses"
  echo "  3. MDX validation errors"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ All critical quality gates PASSED${NC}"
  echo ""
  if [ "$PLACEHOLDERS" -gt "0" ] || [ "$TITLE_ISSUES" -gt "0" ] || [ "$DESC_ISSUES" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Non-critical warnings detected - review recommended${NC}"
  fi
  exit 0
fi
