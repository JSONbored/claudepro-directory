#!/bin/bash
# Step wrapper for cleaner lefthook output
# Shows step name with spinner, captures output, shows status at end
#
# Usage:
#   source step-wrapper.sh
#   run_step "Step Name" "command to run"

source "$(dirname "$0")/structured-output.sh"

run_step() {
  local step_name="$1"
  shift
  local command="$*"
  
  # Start the step
  task_start "$step_name"
  
  # Capture output and exit code
  local output
  local exit_code
  output=$($command 2>&1)
  exit_code=$?
  
  # Display captured output
  if [ -n "$output" ]; then
    echo "$output" | sed 's/^/│  /'
  fi
  
  # Update step status
  if [ $exit_code -eq 0 ]; then
    task_success "completed"
  else
    task_error "failed (exit code: $exit_code)"
  fi
  
  return $exit_code
}

# Alternative: Run command in background and track status
run_step_async() {
  local step_name="$1"
  local step_id="$2"
  shift 2
  local command="$*"
  
  # Start the step
  task_start "$step_name"
  
  # Run command in background, capture PID
  ($command 2>&1 | sed 's/^/│  /') &
  local pid=$!
  
  # Store PID and step name for later status check
  echo "$step_id:$pid:$step_name" >> /tmp/lefthook-steps.$$
  
  # Return immediately (status will be checked later)
  return 0
}

