#!/usr/bin/env bash
# End-to-end test for the DID Resolver service.
# Requires: orchestrator running on :8789, did-resolver running on :8792
# Both services must have DATABASE_INFRA_URL configured (via .env).
#
# Usage:
#   pnpm --filter @fpndtg/did-resolver test:e2e
#   OR directly:
#   bash services/did-resolver/test-e2e.sh

set -euo pipefail

ORCHESTRATOR="http://localhost:8789"
RESOLVER="http://localhost:8792"
TEST_DID="did:webvh:dids.fpndtg.com:test-$(date +%s)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${YELLOW}→${NC} $1"; }

echo ""
echo "FPS DID Resolver — End-to-End Test"
echo "==================================="
echo "Test DID: $TEST_DID"
echo ""

# ---------------------------------------------------------------------------
# 1. Health checks
# ---------------------------------------------------------------------------
info "Checking orchestrator health..."
ORCH_HEALTH=$(curl -sf "$ORCHESTRATOR/health" 2>&1) || fail "Orchestrator not running on $ORCHESTRATOR"
echo "  $ORCH_HEALTH"
pass "Orchestrator healthy"

info "Checking DID resolver health..."
RESOLVER_HEALTH=$(curl -sf "$RESOLVER/health" 2>&1) || fail "DID resolver not running on $RESOLVER"
echo "  $RESOLVER_HEALTH"
pass "DID resolver healthy"

# ---------------------------------------------------------------------------
# 2. Provision a VTA via orchestrator
# ---------------------------------------------------------------------------
info "Provisioning VTA: $TEST_DID ..."
PROVISION=$(curl -sf -X POST "$ORCHESTRATOR/vta/provision" \
  -H "Content-Type: application/json" \
  -d "{\"did\":\"$TEST_DID\",\"context\":\"personal\"}" 2>&1) || fail "VTA provisioning failed"
echo "  $PROVISION"

# Extract sequence number
SEQUENCE=$(echo "$PROVISION" | grep -o '"sequence":[0-9]*' | grep -o '[0-9]*')
TIMESTAMP=$(echo "$PROVISION" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
pass "VTA provisioned (sequence=$SEQUENCE, timestamp=$TIMESTAMP)"

# ---------------------------------------------------------------------------
# 3. Resolve latest DID document
# ---------------------------------------------------------------------------
info "Resolving latest DID document..."
DID_DOC=$(curl -sf "$RESOLVER/$TEST_DID/did.json" 2>&1) || fail "DID resolution failed"
echo "  $DID_DOC" | head -c 300
echo ""

# Validate key fields
echo "$DID_DOC" | grep -q "\"id\":\"$TEST_DID\"" || fail "DID document missing correct 'id' field"
echo "$DID_DOC" | grep -q '"@context"' || fail "DID document missing @context"
echo "$DID_DOC" | grep -q '"verificationMethod"' || fail "DID document missing verificationMethod"
echo "$DID_DOC" | grep -q '"versionId"' || fail "DID document missing versionId"
pass "DID document resolved and valid"

# Extract versionId hash
VERSION_ID=$(echo "$DID_DOC" | grep -o '"versionId":"sha256:[^"]*"' | cut -d'"' -f4)
HASH="${VERSION_ID#sha256:}"
info "versionId: $VERSION_ID"

# ---------------------------------------------------------------------------
# 4. Resolve by versionId
# ---------------------------------------------------------------------------
info "Resolving by versionId ($VERSION_ID)..."
VERSIONED=$(curl -sf "$RESOLVER/$TEST_DID/did.json?versionId=$VERSION_ID" 2>&1) || fail "versionId resolution failed"
echo "$VERSIONED" | grep -q "\"id\":\"$TEST_DID\"" || fail "versionId response missing correct 'id'"
pass "versionId resolution works"

# ---------------------------------------------------------------------------
# 5. Resolve by versionTime
# ---------------------------------------------------------------------------
info "Resolving by versionTime ($TIMESTAMP)..."
TIMED=$(curl -sf "$RESOLVER/$TEST_DID/did.json?versionTime=$TIMESTAMP" 2>&1) || fail "versionTime resolution failed"
echo "$TIMED" | grep -q "\"id\":\"$TEST_DID\"" || fail "versionTime response missing correct 'id'"
pass "versionTime resolution works"

# ---------------------------------------------------------------------------
# 6. Resolve version history (did.jsonl)
# ---------------------------------------------------------------------------
info "Fetching version history (did.jsonl)..."
HISTORY=$(curl -sf "$RESOLVER/$TEST_DID/did.jsonl" 2>&1) || fail "did.jsonl resolution failed"
LINE_COUNT=$(echo "$HISTORY" | grep -c '"@context"' || true)
[ "$LINE_COUNT" -ge 1 ] || fail "did.jsonl returned no lines"
pass "did.jsonl returned $LINE_COUNT version(s)"

# ---------------------------------------------------------------------------
# 7. 404 for unknown DID
# ---------------------------------------------------------------------------
info "Checking 404 for unknown DID..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RESOLVER/did:webvh:dids.fpndtg.com:nonexistent-$(date +%s)/did.json")
[ "$HTTP_CODE" = "404" ] || fail "Expected 404 for unknown DID, got $HTTP_CODE"
pass "404 returned for unknown DID"

# ---------------------------------------------------------------------------
# 8. 400 for invalid DID method
# ---------------------------------------------------------------------------
info "Checking 400 for invalid DID method..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RESOLVER/did:web:example.com/did.json")
[ "$HTTP_CODE" = "400" ] || fail "Expected 400 for invalid DID method, got $HTTP_CODE"
pass "400 returned for invalid DID method"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}All tests passed!${NC}"
echo ""
echo "Test DID created: $TEST_DID"
echo "You can inspect it at:"
echo "  curl http://localhost:8792/$TEST_DID/did.json | jq"
echo "  curl http://localhost:8792/$TEST_DID/did.jsonl"
