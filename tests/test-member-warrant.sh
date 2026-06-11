#!/usr/bin/env bash
# Verifies the member warranted-answer-contribution change (Thread A).
set -u
ROOT="$(git rev-parse --show-toplevel)"
PROTO="$ROOT/skills/design-committee/references/member-protocol.md"
fail=0
check() { # check "description" <0-for-pass>
  if [ "$2" -ne 0 ]; then echo "FAIL: $1"; fail=1; else echo "ok: $1"; fi
}

# --- Task 1: member-protocol § Final Position ---
grep -q 'position, rationale, blocking_risk, warrant' "$PROTO"; check "schema block lists warrant as 4th field" $?
grep -q 'four fields:' "$PROTO"; check "Final Position schema lead-in says four fields" $?
grep -q '`warrant`' "$PROTO"; check "warrant field defined" $?
grep -q '`type`' "$PROTO"; check "warrant field names a type part" $?
grep -q '`source`' "$PROTO"; check "warrant field names a source part" $?
grep -q 'in-scope designer-premise' "$PROTO"; check "warrant type enum present (hyphenated)" $?
grep -qi 'extension to the Final Position' "$PROTO"; check "content-vs-mechanics boundary note present" $?
grep -qi 'never travels in the routing signal' "$PROTO"; check "boundary note: warrant not in routing signal" $?
# frozen mechanics still present (AC-1.3)
grep -q '{member, status, round, transcript}' "$PROTO"; check "routing signal schema unchanged" $?
grep -qi '200-word cap' "$PROTO"; check "200-word cap unchanged" $?

exit $fail
