#!/bin/bash
# Common functions for lefthook scripts
# Shared utilities used across multiple hooks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
	echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
	echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
	echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
	echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
	command -v "$1" >/dev/null 2>&1
}

# Check if pnpm script exists
pnpm_script_exists() {
	local script_name="$1"
	# Check if script exists in package.json
	if grep -q "\"$script_name\":" package.json 2>/dev/null; then
		return 0
	fi
	return 1
}

# Run pnpm script with existence check (resilient)
run_pnpm_script_if_exists() {
	local script_name="$1"
	shift || true

	if ! pnpm_script_exists "$script_name"; then
		log_warning "Script '$script_name' not found in package.json - skipping"
		return 0
	fi

	pnpm run "$script_name" "$@"
}

# Get changed packages (for monorepo)
detect_changed_packages() {
	local changed_files
	changed_files=$(git diff --cached --name-only 2>/dev/null || echo "")

	if [ -z "$changed_files" ]; then
		echo ""
		return
	fi

	local packages=()

	# Check each package directory
	for pkg_dir in packages/* apps/*; do
		if [ -d "$pkg_dir" ] && [ -f "$pkg_dir/package.json" ]; then
			pkg_name=$(basename "$pkg_dir")
			if echo "$changed_files" | grep -q "^$pkg_dir/"; then
				packages+=("$pkg_name")
			fi
		fi
	done

	echo "${packages[@]}"
}

# Check if only non-code files changed
only_non_code_files() {
	local changed_files
	changed_files=$(git diff --cached --name-only 2>/dev/null || echo "")

	if [ -z "$changed_files" ]; then
		return 1
	fi

	# Check if any code files changed
	if echo "$changed_files" | grep -qE '\.(ts|tsx|js|jsx)$'; then
		return 1 # Code files changed
	fi

	return 0 # Only non-code files
}

# Check if WIP commit
is_wip_commit() {
	local commit_msg
	commit_msg=$(git log -1 --pretty=%B 2>/dev/null || echo "")
	echo "$commit_msg" | grep -qiE "^wip" && return 0 || return 1
}

# Get duration in milliseconds
get_duration_ms() {
	local start=$1
	local end
	end=$(date +%s%N)
	echo $(((end - start) / 1000000))
}

# Check if file exists and is newer than another file
file_newer_than() {
	local file1=$1
	local file2=$2

	if [ ! -f "$file1" ] || [ ! -f "$file2" ]; then
		return 1
	fi

	[ "$file1" -nt "$file2" ]
}
