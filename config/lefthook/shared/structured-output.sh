#!/bin/bash
# Structured output formatter for lefthook commands
# Provides consistent "sync hooks:" style output with task status
#
# Usage:
#   source structured-output.sh
#   task_start "Task Name"
#   task_success "Task completed"
#   task_warning "Task warning"
#   task_error "Task failed"
#   task_skip "Task skipped"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Task tracking
_CURRENT_TASK=""
_TASK_START_TIME=0

task_start() {
  _CURRENT_TASK="$1"
  _TASK_START_TIME=$(date +%s%N)
  echo -e "${CYAN}┃  ${_CURRENT_TASK} ❯${NC}"
}

task_success() {
  local message="${1:-completed}"
  local duration=$(( ($(date +%s%N) - _TASK_START_TIME) / 1000000 ))
  echo -e "${GREEN}│  ✅ ${message}${NC} (${duration}ms)"
  _CURRENT_TASK=""
}

task_warning() {
  local message="$1"
  echo -e "${YELLOW}│  ⚠️  ${message}${NC}"
}

task_error() {
  local message="$1"
  echo -e "${RED}│  ❌ ${message}${NC}"
}

task_skip() {
  local message="${1:-skipped}"
  echo -e "${BLUE}│  ⏭️  ${message}${NC}"
  _CURRENT_TASK=""
}

task_info() {
  local message="$1"
  echo -e "${BLUE}│  ℹ️  ${message}${NC}"
}

