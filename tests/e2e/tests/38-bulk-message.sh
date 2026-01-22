#!/bin/bash
# Test: Bulk messaging to multiple agents
# Sends message to all agents matching a glob pattern
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common.sh"

section "Test: Bulk Messaging"
preflight_check
mkdir -p "$LOG_DIR"

# Cleanup any existing test agents
delete_agent_if_exists "e2e-bulk-msg-1"
delete_agent_if_exists "e2e-bulk-msg-2"
delete_agent_if_exists "e2e-bulk-msg-3"

# Create test agents
info "Creating 3 test agents..."
$CLI apply -f "$FIXTURES/fleet-bulk-message-test.yml" > $OUT 2>&1

agent_exists "e2e-bulk-msg-1" && pass "Agent 1 created" || fail "Agent 1 not created"
agent_exists "e2e-bulk-msg-2" && pass "Agent 2 created" || fail "Agent 2 not created"
agent_exists "e2e-bulk-msg-3" && pass "Agent 3 created" || fail "Agent 3 not created"

# Test bulk messaging with glob pattern (show output)
info "Sending bulk message to e2e-bulk-msg-* agents..."
$CLI send --all "e2e-bulk-msg-*" "Hello, what is your name?" --confirm 2>&1 | tee $OUT

# Check that all 3 agents were messaged
if output_contains "Completed: 3/3"; then
    pass "Bulk message sent to all 3 agents"
else
    fail "Bulk message did not complete for all agents"
    cat $OUT
fi

# Check OK status for each
if output_contains "OK e2e-bulk-msg-1" && output_contains "OK e2e-bulk-msg-2" && output_contains "OK e2e-bulk-msg-3"; then
    pass "All agents responded OK"
else
    fail "Not all agents responded OK"
    cat $OUT
fi

# Verify messages were received by checking message history
info "Verifying messages were received..."
$CLI messages e2e-bulk-msg-1 --limit 5 > $OUT 2>&1
if output_contains "Hello"; then
    pass "Agent 1 received the message"
else
    fail "Agent 1 did not receive the message"
fi

# Cleanup
delete_agent_if_exists "e2e-bulk-msg-1"
delete_agent_if_exists "e2e-bulk-msg-2"
delete_agent_if_exists "e2e-bulk-msg-3"

print_summary
