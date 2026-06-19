#!/usr/bin/env bash
# Structural assertions for the Ad-hoc committee context-economy change.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
SK="$ROOT/skills/design-committee"
AG="$ROOT/agents"
fail=0
_check() { if eval "$2"; then echo "PASS: $1"; else echo "FAIL: $1"; fail=1; fi; }

# === ASSERTION FUNCTIONS — later tasks insert new assert_* functions in this region ===
assert_member_protocol() {
  local f="$SK/references/member-protocol.md"
  _check "member-protocol exists" "[ -f '$f' ]"
  _check "member-protocol mandates Final Position section" "grep -q '## Final Position' '$f'"
  _check "member-protocol is sole Final Position schema authority" "grep -qi 'position' '$f' && grep -qi 'rationale' '$f' && grep -qi 'blocking_risk' '$f'"
  _check "member-protocol caps Final Position at 200 words" "grep -qiE '200[ -]?word' '$f'"
  _check "member-protocol defines typed routing signal" "grep -qi 'routing signal' '$f' && grep -qiE 'malformed.*reject|reject.*malformed' '$f'"
  _check "member-protocol routing-signal fields" "grep -qi 'status' '$f' && grep -q 'transcript' '$f'"
  _check "member-protocol caps peer-DM exchanges" "grep -qiE 'peer.?dm' '$f' && grep -qiE '2 (exchanges|per pair)|max 2' '$f'"
  _check "member-protocol names round-folder transcript path" "grep -q 'committee/round' '$f'"
  _check "member-protocol owns committee-root resolution (M1)" "grep -qiE 'sprint-subdir|ask the designer' '$f'"
  _check "member-protocol has citable section headings" "grep -q '## Committee root resolution' '$f'"
}
assert_consolidator() {
  local f="$AG/design-committee-consolidator.md"
  _check "consolidator agent exists" "[ -f '$f' ]"
  _check "consolidator grants Read+Glob+Write" "grep -qE '^tools:.*Read.*Glob.*Write' '$f'"
  _check "consolidator tool grant excludes Grep" "! grep -qE '^tools:.*Grep' '$f'"
  _check "consolidator enumerate-only ceiling" "grep -qi 'alignment count' '$f' && grep -qi 'notable quotes' '$f'"
  _check "consolidator prohibits interpretation" "grep -qiE '(not|never|no) .*characterize' '$f' && grep -qiE '(not|never|no) .*weight' '$f' && grep -qiE '(not|never|no) .*synthesi' '$f'"
  _check "consolidator does NOT inherit synthesizing-the-sources license" "! grep -qi 'synthesizing the sources' '$f'"
  _check "consolidator writes its own output file" "grep -q 'consolidator-output.md' '$f'"
  _check "consolidator reads only Final Position section" "grep -qi 'Final Position' '$f'"
  _check "consolidator cites member-protocol for schema" "grep -qi 'member-protocol' '$f'"
  _check "consolidator copies fields verbatim" "grep -qi 'verbatim' '$f'"
}
assert_scribe() {
  local f="$AG/design-committee-scribe.md"
  _check "scribe agent exists" "[ -f '$f' ]"
  _check "scribe grants Read+Write" "grep -qE '^tools:.*Read' '$f' && grep -qE '^tools:.*Write' '$f'"
  _check "scribe fed verdict + template" "grep -qi 'verdict' '$f' && grep -qi 'template' '$f'"
  _check "scribe fed alignment-map for rationale" "grep -qi 'alignment-map' '$f'"
  _check "scribe receives template path at dispatch (not hardcoded)" "grep -qiE 'template path|path .*(provided|at dispatch|input)' '$f'"
  _check "scribe never reads raw transcripts or session thread" "grep -qiE 'never .*(transcript|session thread)|not .*your inputs' '$f'"
  _check "scribe writes under committee/" "grep -q 'committee/' '$f'"
  _check "scribe no Mode A/B" "! grep -qE 'Mode [AB]' '$f'"
}
assert_advocacy_agents() {
  for m in conservator innovator pragmatist purist; do
    local f="$AG/design-committee-$m.md"
    _check "$m grants Write" "grep -qE '^tools:.*Write' '$f'"
    _check "$m write scoped to committee/" "grep -q 'committee/' '$f'"
    _check "$m cites member-protocol" "grep -q 'member-protocol' '$f'"
    _check "$m no Mode A/B" "! grep -qE 'Mode [AB]' '$f'"
  done
}
assert_researcher_agent() {
  local f="$AG/design-committee-researcher.md"
  _check "researcher grants Write" "grep -qE '^tools:.*Write' '$f'"
  _check "researcher prohibition narrowed to committee tree" "grep -qi 'committee/' '$f'"
  _check "researcher cites member-protocol" "grep -q 'member-protocol' '$f'"
}
assert_round_format() {
  local f="$SK/references/committee-analysis-round-format.md"
  _check "round-format uses committee/roundNN layout" "grep -q 'committee/round' '$f'"
  _check "round-format has a distinct Consolidator output section" "grep -qi 'consolidator-output' '$f'"
  _check "round-format separates team-lead verdict from enumeration" "grep -qi 'verdict' '$f' && grep -qi 'consolidator' '$f'"
  _check "round-format retires per-question-file-in-design framing" "! grep -qiE 'design/committee-analysis|one file per .*question' '$f'"
  _check "round-format lists alignment-map.md" "grep -qi 'alignment-map' '$f'"
  _check "round-format lists verdict.md" "grep -qi 'verdict.md' '$f'"
  _check "round-format removes superseded committee-analysis" "! grep -qi 'committee-analysis' '$f'"
}
assert_team_lead() {
  local f="$SK/references/team-lead.md"
  _check "team-lead Record File uses committee/roundNN" "grep -q 'committee/round' '$f'"
  _check "team-lead dispatches Consolidator" "grep -qi 'consolidator' '$f'"
  _check "team-lead reads consolidator-output (enumeration, not the verdict)" "grep -qi 'consolidator-output' '$f'"
  _check "team-lead describes Consolidator reading only Final Position" "grep -qiE 'reads only .*Final Position' '$f'"
  _check "team-lead maintains ledger" "grep -q 'ledger' '$f'"
  _check "team-lead reading order cites member-protocol" "grep -q 'member-protocol' '$f'"
  _check "team-lead writes alignment-map and evicts" "grep -qi 'alignment-map' '$f' && grep -qiE 'evict|drop from context|no longer needed in context' '$f'"
  _check "team-lead writes verdict before scribe" "grep -qi 'verdict.md' '$f'"
  _check "team-lead rejects malformed signals" "grep -qiE 'malformed.*(signal|reject)|reject.*(malformed|signal)' '$f'"
  _check "team-lead reads artifact at presentation" "grep -qiE 'read .*(artifact|draft)|the read IS the review' '$f'"
  _check "team-lead enforces artifact checkpoint between steps" "grep -qiE 'checkpoint|prior artifact path|absence blocks' '$f'"
  _check "team-lead documents two-round mode" "grep -qiE 'two-round|revision pass|alignment.map.*feedback|alignment-map.*fed.*back' '$f'"
  _check "team-lead closure stamps new artifacts" "grep -qiE 'stamp.*alignment-map|stamp.*verdict|alignment-map.*verdict' '$f'"
  _check "team-lead cites member-protocol for schema" "grep -qi 'member-protocol' '$f'"
  _check "team-lead version bumped past v0007" "grep -qE '^version: v00(0[8-9]|[1-9][0-9])' '$f'"
}
assert_skill_md() {
  local f="$SK/SKILL.md"
  _check "SKILL creates committee/ tree" "grep -q 'committee/' '$f'"
  _check "SKILL points to team-lead.md for the per-round flow" "grep -qi 'single numbered checklist' '$f'"
  _check "SKILL no stale digest-shape reference" "! grep -qi 'digest shape' '$f'"
  _check "SKILL defines one-round / two-round modes" "grep -qi 'one-round' '$f' && grep -qi 'two-round' '$f'"
  _check "SKILL carries no rival per-round numbered list" "grep -qi 'no numbered list of its own' '$f'"
  _check "SKILL delegates step sequence to team-lead.md as sole authority" "grep -qi 'sole authority for the step sequence' '$f'"
  _check "SKILL integration adds consolidator" "grep -qi 'consolidator' '$f'"
  _check "SKILL integration reads member-protocol" "grep -q 'member-protocol' '$f'"
  _check "SKILL affirmative generic-edit clause present" "grep -qiE 'generic .*role-contract|base-skill .*clarification' '$f'"
  _check "SKILL Standalone Invocability no stale design/ record location" "! grep -qi 'lands in the sprint' '$f'"
  _check "SKILL no Mode A/B" "! grep -qE 'Mode [AB]' '$f'"
  _check "SKILL version bumped past v0017" "grep -qE '^version: v00(1[8-9]|[2-9][0-9])' '$f'"
}
assert_scope_and_vocab() {
  # design-architect-committee untouched by this sprint's commits
  _check "no design-architect-committee file modified in this sprint" \
    "! git -C \"$ROOT\" diff --name-only main...HEAD | grep -q 'design-architect-committee'"
  # vocabulary ban across all touched committee files
  for f in "$SK/SKILL.md" "$SK/references/team-lead.md" "$SK/references/committee-analysis-round-format.md" "$SK/references/member-protocol.md" "$AG"/design-committee-{conservator,innovator,pragmatist,purist,researcher,consolidator,scribe}.md; do
    _check "no Mode A/B in $(basename "$f")" "! grep -qE 'Mode [AB]' '$f'"
    _check "no stale digest-shape vocab in $(basename "$f")" "! grep -qi 'digest shape' '$f'"
  done
}
assert_team_tooling_skill() {
  local f="$SK/SKILL.md"
  _check "SKILL free of TeamCreate" "! grep -q 'TeamCreate' '$f'"
  _check "SKILL free of TeamDelete" "! grep -q 'TeamDelete' '$f'"
  _check "SKILL uses teammate-dispatch vocabulary" "grep -qi 'teammate' '$f'"
  _check "SKILL uses subagent-dispatch vocabulary" "grep -qiE 'subagent dispatch|one-shot subagent|one-shot .Agent' '$f'"
  _check "SKILL drops the roster/off-roster discriminator" "! grep -qiE 'roster dispatch|off-roster' '$f'"
  _check "SKILL keeps the member-list 'Roster (six roles' heading" "grep -q 'Roster (six roles' '$f'"
  _check "SKILL keeps the context-economy 'NOT switchboard' line" "grep -q 'NOT switchboard' '$f'"
  _check "SKILL documents nested-teams precondition twice (Bootstrap + Integration)" "[ \"\$(grep -ci 'nested inside another agent team' '$f')\" -ge 2 ]"
}
assert_artifact_template() {
  local f="$SK/references/artifact-template.md"
  _check "artifact template exists" "[ -f '$f' ]"
  _check "artifact template has Dissent Record header" "grep -qE '^#+ .*Dissent Record' '$f'"
  _check "artifact template marks Dissent Record mandatory" "grep -qiE 'Dissent Record' '$f' && grep -qiE 'mandatory|required|MUST appear' '$f'"
  _check "artifact template MANDATORY marker sits in the Dissent Record annotation" "grep -qE '^<!-- MANDATORY' '$f'"
}
# === END ASSERTION FUNCTIONS ===

# === RUN — later tasks insert new assert_* calls in this region, ABOVE the gate ===
assert_member_protocol
assert_consolidator
assert_scribe
assert_advocacy_agents
assert_researcher_agent
assert_round_format
assert_team_lead
assert_skill_md
assert_scope_and_vocab
assert_team_tooling_skill
assert_artifact_template
# === END RUN ===

# --- final gate: nothing executable may be added below this line ---
[ "$fail" -eq 0 ] && echo "ALL PASS" || { echo "FAILURES"; exit 1; }
