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

# --- Task 2: four advocacy agents carry the identical warrant pointer ---
AGENTS_DIR="$ROOT/agents"
INSTR='Your `## Final Position` must include the `warrant` field for your load-bearing claim'
count=0
for m in conservator innovator pragmatist purist; do
  if grep -qF "$INSTR" "$AGENTS_DIR/design-committee-$m.md"; then count=$((count+1)); fi
done
[ "$count" -eq 4 ]; check "warrant pointer present in all four advocacy agents" $?
# uniformity: the full pointer line is byte-identical across the four
sig="$(grep -F "$INSTR" "$AGENTS_DIR/design-committee-conservator.md")"
same=0
for m in conservator innovator pragmatist purist; do
  if [ "$(grep -F "$INSTR" "$AGENTS_DIR/design-committee-$m.md")" = "$sig" ]; then same=$((same+1)); fi
done
[ "$same" -eq 4 ]; check "warrant pointer identical across the four agents" $?
# researcher untouched: pointer absent
! grep -qF "$INSTR" "$AGENTS_DIR/design-committee-researcher.md"; check "researcher agent has no warrant pointer" $?

# --- Task 3: team-lead verification reword + version + invariants ---
TL="$ROOT/skills/design-committee/references/team-lead.md"
UDP="$ROOT/skills/util-design-partner-role/SKILL.md"
grep -qE '^version: v00(1[2-9]|[2-9][0-9])' "$TL"; check "team-lead.md bumped to v0012 or later" $?
grep -qi 'team-lead .*verifies' "$TL"; check "warrant test uses verify framing" $?
grep -qi 'member-supplied warrant' "$TL"; check "warrant test names member-supplied warrant" $?
grep -qi 'does not originate a warrant on the member' "$TL"; check "warrant test forbids team-lead origination" $?
grep -qi 'trace to a member-supplied warrant' "$TL"; check "self-eval warrant-coverage reworded (unique self-eval phrase)" $?
grep -q 'in-scope designer-premise' "$TL"; check "team-lead third warrant type hyphenation reconciled" $?
# doctrine intact (AC-3.3)
grep -qi 'Count-not-a-warrant' "$TL"; check "doctrine: count-not-a-warrant intact" $?
grep -qi 'C2 firewall' "$TL"; check "doctrine: C2 firewall intact" $?
grep -qi 'C1 audit' "$TL"; check "doctrine: C1 audit intact" $?
grep -qi 'strict premise scope' "$TL"; check "doctrine: strict premise scope intact" $?
# locked decision packet intact (AC-4.1)
grep -q 'Information Package' "$TL" && grep -q 'Decision Package' "$TL" && grep -q 'Team-Lead Comments' "$TL"; check "locked four-block packet headings present" $?
grep -q 'What a Good Decision-Communication Packet Sounds Like' "$TL"; check "locked decision-communication-packet Style Exemplar intact (distinctive anchor)" $?
# voice spec present/untouched anchor (AC-4.1)
grep -qi 'Translation Gate' "$UDP"; check "util-design-partner-role intact (anchor present)" $?

exit $fail
