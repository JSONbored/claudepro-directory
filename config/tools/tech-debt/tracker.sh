#!/usr/bin/env bash
# Technical Debt Tracker with Categorization & Severity Scoring
# Compatible with bash 3.2+ (macOS default bash)
# Usage: ./tracker.sh [baseline|check|report]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASELINE_FILE="$SCRIPT_DIR/.baseline.json"

# ============================================================================
# TECHNICAL DEBT CATEGORIES & SEVERITY WEIGHTS
# ============================================================================

# Get weight for a category (bash 3.2 compatible - no associative arrays)
get_weight() {
  local category="$1"
  case "$category" in
    # CRITICAL (15 points)
    suspicious|security) echo 15 ;;
    # HIGH (8-12 points)
    correctness) echo 12 ;;
    performance) echo 9 ;;
    complexity|a11y) echo 8 ;;
    # MEDIUM (4-5 points)
    style) echo 5 ;;
    nursery) echo 4 ;;
    # LOW (1-2 points)
    formatting) echo 2 ;;
    # Default
    *) echo 1 ;;
  esac
}

TS_ERROR_WEIGHT=15

# ============================================================================
# ISSUE PARSING & CATEGORIZATION
# ============================================================================

# Parse lint output and create JSON with counts
parse_lint_issues() {
  local dir="$1"
  local lint_output="$2"

  local suspicious=0 security=0 correctness=0 performance=0
  local complexity=0 a11y=0 style=0 nursery=0 formatting=0 other=0

  while IFS= read -r line; do
    if [[ $line =~ ^($dir)/.*lint/([a-z]+)/ ]]; then
      local category="${BASH_REMATCH[2]}"
      case "$category" in
        suspicious) ((suspicious++)) ;;
        security) ((security++)) ;;
        correctness) ((correctness++)) ;;
        performance) ((performance++)) ;;
        complexity) ((complexity++)) ;;
        a11y) ((a11y++)) ;;
        style) ((style++)) ;;
        nursery) ((nursery++)) ;;
        *) ((other++)) ;;
      esac
    fi
  done <<< "$lint_output"

  cat <<EOF
{
  "suspicious": $suspicious,
  "security": $security,
  "correctness": $correctness,
  "performance": $performance,
  "complexity": $complexity,
  "a11y": $a11y,
  "style": $style,
  "nursery": $nursery,
  "formatting": $formatting,
  "other": $other
}
EOF
}

# Count TypeScript errors
parse_ts_errors() {
  local dir="$1"
  local ts_output="$2"
  local error_count=0

  while IFS= read -r line; do
    if [[ $line =~ ^($dir)/.* ]] && [[ $line =~ error\ TS[0-9]+ ]]; then
      ((error_count++))
    fi
  done <<< "$ts_output"

  echo "{\"errors\":$error_count,\"warnings\":0}"
}

# Calculate weighted score from JSON
calculate_score() {
  local json_categories="$1"
  local ts_errors="$2"
  local total_score=0

  # Calculate lint scores
  for category in suspicious security correctness performance complexity a11y style nursery formatting other; do
    local count=$(echo "$json_categories" | jq -r ".$category // 0")
    local weight=$(get_weight "$category")
    local score=$((count * weight))
    total_score=$((total_score + score))
  done

  # Add TypeScript error scores
  local ts_error_count=$(echo "$ts_errors" | jq -r '.errors // 0')
  total_score=$((total_score + (ts_error_count * TS_ERROR_WEIGHT)))

  echo "$total_score"
}

# ============================================================================
# DIRECTORY DISCOVERY
# ============================================================================

# Get all code directories (excluding build/cache/generated/config dirs)
get_code_directories() {
  find . -maxdepth 1 -type d \
    ! -name "." \
    ! -name ".git" \
    ! -name ".github" \
    ! -name ".next" \
    ! -name ".vercel" \
    ! -name "node_modules" \
    ! -name "out" \
    ! -name "dist" \
    ! -name "dist-ssr" \
    ! -name "generated" \
    ! -name ".turbo" \
    ! -name ".parcel-cache" \
    ! -name ".vitest" \
    ! -name "coverage" \
    ! -name "test-results" \
    ! -name "playwright-report" \
    ! -name ".lighthouseci" \
    ! -name ".claude" \
    ! -name ".cursor" \
    ! -name ".vscode" \
    ! -name ".idea" \
    ! -name "config" \
    ! -name "submission-batches" \
    ! -name "public" \
    ! -name "supabase" \
    ! -name "templates" \
    | sed 's|^\./||' \
    | sort
}

# Categorize directories as production or non-production
is_production_dir() {
  local dir="$1"
  case "$dir" in
    src|scripts|pages|app|lib|components) return 0 ;;  # Production code
    *) return 1 ;;  # Tests, content, config, etc
  esac
}

# ============================================================================
# SCANNING FUNCTIONS
# ============================================================================

scan_directory() {
  local dir="$1"
  echo "   Scanning $dir/..." >&2

  # Run lint and capture output
  local lint_output=$(npm run lint 2>&1 | grep "^$dir/" || true)
  local lint_categories=$(parse_lint_issues "$dir" "$lint_output")

  # Run TypeScript and capture output
  local ts_output=$(npm run type-check 2>&1 | grep "^$dir/" || true)
  local ts_errors=$(parse_ts_errors "$dir" "$ts_output")

  # Calculate scores
  local lint_score=$(calculate_score "$lint_categories" '{"errors":0}')
  local ts_score=$(calculate_score '{}' "$ts_errors")
  local total_score=$((lint_score + ts_score))

  # Calculate total issue count
  local lint_count=$(echo "$lint_categories" | jq '[.[] | values] | add // 0')
  local ts_count=$(echo "$ts_errors" | jq '.errors // 0')
  local total_count=$((lint_count + ts_count))

  cat <<EOF
{
  "lint": {
    "categories": $lint_categories,
    "total": $lint_count,
    "score": $lint_score
  },
  "typescript": $ts_errors,
  "typescript_score": $ts_score,
  "total_issues": $total_count,
  "total_score": $total_score
}
EOF
}

# ============================================================================
# BASELINE MANAGEMENT
# ============================================================================

create_baseline() {
  echo "📊 Scanning codebase for technical debt..."
  echo ""

  # Get all code directories dynamically
  local directories=($(get_code_directories))

  # Build JSON object dynamically
  local json_dirs=""
  local total_issues=0
  local total_score=0

  echo "📈 Technical Debt Baseline:"
  for dir in "${directories[@]}"; do
    local dir_data=$(scan_directory "$dir")
    local dir_issues=$(echo "$dir_data" | jq '.total_issues')
    local dir_score=$(echo "$dir_data" | jq '.total_score')

    # Add to totals
    total_issues=$((total_issues + dir_issues))
    total_score=$((total_score + dir_score))

    # Build JSON (escape directory name for JSON key)
    json_dirs="$json_dirs\"$dir\": $dir_data,"

    # Print summary
    printf "   %-12s: %d issues (score: %d)\n" "$dir/" "$dir_issues" "$dir_score"
  done

  # Remove trailing comma
  json_dirs="${json_dirs%,}"

  cat > "$BASELINE_FILE" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "3.0",
  "directories": {
    $json_dirs
  },
  "totals": {
    "issues": $total_issues,
    "score": $total_score
  }
}
EOF

  echo "   ───────────────────────────────────────────"
  echo "   Total       : $total_issues issues (score: $total_score)"
  echo ""
  echo "✅ Baseline created: $BASELINE_FILE"
  echo "💡 Run 'npm run tech-debt:report' for detailed breakdown"
  echo ""
}

# ============================================================================
# DEBT CHECKING
# ============================================================================

check_debt() {
  if [ ! -f "$BASELINE_FILE" ]; then
    echo "⚠️  No baseline found. Run 'npm run tech-debt:baseline' first"
    return 1
  fi

  echo "🔍 Checking against baseline..." >&2

  # Get all directories from baseline
  local directories=($(jq -r '.directories | keys[]' "$BASELINE_FILE" | sort))
  local block=0
  local improvements=0

  for dir in "${directories[@]}"; do
    # Scan current state
    local current_data=$(scan_directory "$dir")
    local current_issues=$(echo "$current_data" | jq '.total_issues')

    # Read baseline
    local baseline_issues=$(jq -r ".directories[\"$dir\"].total_issues" "$BASELINE_FILE")

    # Calculate delta
    local delta=$((current_issues - baseline_issues))

    # Check if production directory (must be clean)
    if is_production_dir "$dir"; then
      if [ "$current_issues" -gt 0 ]; then
        echo "❌ BLOCKING: $dir/ has $current_issues issues (production code must be clean)" >&2
        block=1
      fi
    else
      # Non-production: can't add NEW debt
      if [ "$delta" -gt 0 ]; then
        echo "❌ BLOCKING: Adding $delta new issues to $dir/" >&2
        block=1
      elif [ "$delta" -lt 0 ]; then
        ((improvements++))
      fi
    fi
  done

  # Report status
  if [ "$block" -eq 0 ]; then
    echo "✅ No new debt introduced" >&2
    if [ "$improvements" -gt 0 ]; then
      echo "✅ Great! You reduced technical debt" >&2
    fi
  fi

  return $block
}

# ============================================================================
# REPORTING
# ============================================================================

show_report() {
  if [ ! -f "$BASELINE_FILE" ]; then
    echo "⚠️  No baseline found. Run 'npm run tech-debt:baseline' first"
    return 1
  fi

  echo ""
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "📊 TECHNICAL DEBT REPORT (Categorized & Scored)"
  echo "═══════════════════════════════════════════════════════════════════════"
  echo ""

  local baseline_date=$(jq -r '.timestamp' "$BASELINE_FILE")
  local baseline_total=$(jq -r '.totals.score' "$BASELINE_FILE")

  # Get all directories
  local directories=($(jq -r '.directories | keys[]' "$BASELINE_FILE" | sort))

  echo "Baseline Created: $baseline_date"
  echo ""
  echo "┌─────────────┬──────────┬──────────┬──────────┐"
  echo "│ Directory   │ Baseline │ Current  │ Delta    │"
  echo "├─────────────┼──────────┼──────────┼──────────┤"

  local current_total=0
  local has_production_issues=0

  for dir in "${directories[@]}"; do
    # Get baseline
    local baseline_score=$(jq -r ".directories[\"$dir\"].total_score" "$BASELINE_FILE")

    # Scan current
    local current_data=$(scan_directory "$dir")
    local current_score=$(echo "$current_data" | jq '.total_score')
    local current_issues=$(echo "$current_data" | jq '.total_issues')

    # Calculate delta
    local delta=$((current_score - baseline_score))
    current_total=$((current_total + current_score))

    # Mark if production dir has issues
    if is_production_dir "$dir" && [ "$current_issues" -gt 0 ]; then
      has_production_issues=1
    fi

    # Print row
    printf "│ %-11s │ %8d │ %8d │ %+8d │\n" "$dir/" "$baseline_score" "$current_score" "$delta"
  done

  local delta_total=$((current_total - baseline_total))

  echo "├─────────────┼──────────┼──────────┼──────────┤"
  printf "│ %-11s │ %8d │ %8d │ %+8d │\n" "TOTAL SCORE" "$baseline_total" "$current_total" "$delta_total"
  echo "└─────────────┴──────────┴──────────┴──────────┘"
  echo ""

  # Show detailed breakdown for each directory with issues
  echo "📋 Detailed Debt Breakdown by Category:"
  echo ""

  for dir in "${directories[@]}"; do
    local current_data=$(jq -r ".directories[\"$dir\"]" "$BASELINE_FILE")
    local dir_issues=$(echo "$current_data" | jq '.total_issues')

    if [ "$dir_issues" -gt 0 ]; then
      echo "🔹 $dir/ ($dir_issues issues):"
      echo "┌────────────────────┬───────┬────────┬──────────────────────┐"
      echo "│ Category           │ Count │ Weight │ Score                │"
      echo "├────────────────────┼───────┼────────┼──────────────────────┤"

      local has_issues=0
      for category in suspicious security correctness performance complexity a11y style nursery other; do
        local count=$(echo "$current_data" | jq -r ".lint.categories.$category // 0")
        if [ "$count" -gt 0 ]; then
          local weight=$(get_weight "$category")
          local score=$((count * weight))

          # Add emoji based on severity
          local emoji=""
          case "$weight" in
            15) emoji="🔴" ;;
            12|9|8) emoji="🟠" ;;
            5|4) emoji="🟡" ;;
            *) emoji="🟢" ;;
          esac

          printf "│ %-18s │ %5d │ %6d │ %20d │\n" "$emoji $category" "$count" "$weight" "$score"
          has_issues=1
        fi
      done

      local ts_errors=$(echo "$current_data" | jq -r '.typescript.errors // 0')
      if [ "$ts_errors" -gt 0 ]; then
        printf "│ %-18s │ %5d │ %6d │ %20d │\n" "🔴 TypeScript" "$ts_errors" "$TS_ERROR_WEIGHT" "$((ts_errors * TS_ERROR_WEIGHT))"
        has_issues=1
      fi

      if [ "$has_issues" -eq 0 ]; then
        echo "│ No issues detected │       │        │                      │"
      fi

      echo "└────────────────────┴───────┴────────┴──────────────────────┘"
      echo ""
    fi
  done

  # Status assessment
  if [ "$has_production_issues" -eq 0 ] && [ "$delta_total" -le 0 ]; then
    echo "✅ STATUS: EXCELLENT - No production debt, overall debt decreasing"
  elif [ "$has_production_issues" -eq 0 ] && [ "$delta_total" -eq 0 ]; then
    echo "✅ STATUS: GOOD - No production debt, debt stable"
  elif [ "$has_production_issues" -eq 1 ]; then
    echo "❌ STATUS: NEEDS ATTENTION - Production code has issues"
  elif [ "$delta_total" -gt 0 ]; then
    echo "⚠️  STATUS: REGRESSION - Debt increased by $delta_total points"
  fi

  echo ""
  echo "═══════════════════════════════════════════════════════════════════════"
  echo ""
  echo "💡 Category Severity Guide:"
  echo "   🔴 CRITICAL (15 pts): Security, Suspicious code, Type errors"
  echo "   🟠 HIGH (8-12 pts):    Correctness, Performance, Complexity, A11y"
  echo "   🟡 MEDIUM (4-5 pts):   Style consistency, Nursery rules"
  echo "   🟢 LOW (1-2 pts):      Formatting, Minor issues"
  echo ""
  echo "💡 Production directories (must be clean): src/, scripts/"
  echo "💡 Other directories (can't add new debt): tests/, content/, etc."
  echo ""
}

# ============================================================================
# MAIN DISPATCHER
# ============================================================================

case "${1:-help}" in
  baseline) create_baseline ;;
  check) check_debt ;;
  report) show_report ;;
  *)
    echo "Usage: $0 {baseline|check|report}"
    echo ""
    echo "  baseline - Create new baseline snapshot with categorization"
    echo "  check    - Check current debt against baseline (with scoring)"
    echo "  report   - Show detailed debt report with categories"
    exit 1
    ;;
esac
