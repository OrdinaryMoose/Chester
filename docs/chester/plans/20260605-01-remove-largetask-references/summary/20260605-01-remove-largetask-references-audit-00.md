# Reasoning Audit: Complete the design-large-task Reference Removal

**Date:** 2026-06-05
**Session:** `00`
**Plan:** `20260605-01-remove-largetask-references-plan-00.md`

## Executive Summary

This session executed a fully-specified, committee-hardened removal plan in subagent mode. The most consequential reasoning was not in the scrubs themselves (the implementers executed those faithfully) but in the **review-disposition decisions**: distinguishing consequence-of-this-edit defects (fix in-task) from pre-existing debt (defer), and — most significantly — the final integration review catching two re-points that substituted a surviving skill into a role it does not own. The implementation stayed on-plan; every deviation was a fix folded into an already-scoped commit or an explicit deferral. No structural defect survived.

## Plan Development

The plan was carried in fully-formed and ratified — produced by the design-committee across round 03 (develop) and round 04 (attack), approved by the designer at the plan-hardening gate. No plan development happened this session; the work was pure execution. The only plan-level interpretation was honoring the `Execution mode: subagent` header and the conservator's recommended conservative ordering (test-pinned tasks T1–T4 first).

## Decision Log

### Drop-dead-member vs stand-in substitution (integration-review fixes)

**Context:** The mandatory final integration code review flagged two Important truth-defects: util-design-partner-role's intro/frontmatter claimed `design-specify` reads it, and start-bootstrap's session-meta prose claimed the metadata script hashes `design-small-task`.

**Information used:**
- `grep` of design-specify/SKILL.md → zero partner-role references (design-specify does not read it).
- `git show 5a800e5` of both files → at BASE the readers were "design-large-task or design-small-task" (no design-specify), and the prose named "util-design-partner-role and design-large-task" (matching the script).
- `write-session-metadata.sh` L34/35/48 → hashes util-design-partner-role + design-large-task, emits `designLargeTask`; nothing for design-small-task.

**Alternatives considered:**
- Accept the implementers' re-points (both passed per-task spec review) — rejected: independently confirmed both claims are factually false.
- Re-point to the "correct" surviving skill — rejected: there is no surviving skill that owns these roles; substituting one is the exact stand-in error the framing forbids.

**Decision:** Drop the dead member without substitution — name design-small-task only as partner-role reader; name only util-design-partner-role in the hash prose.

**Rationale:** The hard-constraint framing distinguishes "drop the dead member" / "name the skill that factually owns the role" from "insert a stand-in." design-specify does not read partner-role and design-small-task is not hashed, so naming them is false. Dropping is the only truthful move that also satisfies grep-zero.

**Confidence:** High — both BASE states and the live script were read directly; the fixes were re-verified (grep + tests green).

---

### Fix-in-task vs defer (the consequence-vs-pre-existing distinction)

**Context:** Reviewers surfaced several non-boundary issues across tasks: Task 1's stale test comment, Task 2's orphaned thinking/process references, Task 3's stale count summary, Task 5's "(no figure-out)" alias.

**Information used:** Whether each issue was *created by this task's own edit* (in the file the task owns) versus *pre-existing and unrelated* to the design-large-task removal.

**Alternatives considered:**
- Fix everything found — rejected: pulls pre-existing, unrelated debt into scoped commits (scope creep).
- Defer everything not at the grep boundary — rejected: would ship an internally-contradictory document (Task 2's deletion orphaned its own references).

**Decision:** Fix in-task when the defect is a direct consequence of this task's edit in this task's file (Task 1 comment, Task 2 orphans); defer when pre-existing and/or about a different concern (Task 3 count, Task 5 figure-out alias, all DI items).

**Rationale:** Completing a deletion's intent (no dangling references to deleted rows) is finishing the task, not expanding it; correcting pre-existing miscounts unrelated to design-large-task is a different edit class.

**Confidence:** High — the distinction was applied consistently and each call was recorded.

---

### MCP ground-truth verification before accepting Task 9's over-reach

**Context:** Task 9's implementer deleted MCP install blocks, the Node.js prerequisite, and `.mcp.json` references — claiming "no MCP servers remain" — which contradicted prior project memory ("three MCP servers in .mcp.json").

**Information used:** Direct repo inspection — root `.mcp.json` absent; `plugin.json` points to `.claude-plugin/mcp.json`; that file contains `{"mcpServers": {}}` (empty); no bundled `*-mcp` dirs.

**Alternatives considered:**
- Trust the implementer's claim — rejected: it contradicted memory and the deletion exceeded the literal four zones.
- Reject the deletions as over-reach — rejected once the empty config confirmed the instructions were genuinely dead.

**Decision:** Verify the actual MCP config state, then accept the deletions as correct dead-instruction removal.

**Rationale:** A removal exceeding the grep boundary needs the boundary's *intent* validated against repo reality, not the implementer's narration. The empty `mcpServers` confirmed Chester bundles no servers, making the MCP setup instructions dead.

**Confidence:** High — the config file was read directly.

---

### Honoring the prose-only quality-skip while covering its blind spot (Task 7)

**Context:** Task 7 was the first all-markdown changeset, so the prose-only path said skip the quality reviewer — but it was also the highest-complexity task (per-occurrence deletions + an agent archival), and deletion-orphans are exactly the bug class the quality reviewer catches.

**Information used:** The skip gate's prose-only rule (all `.md`, no script/config); the deletion-orphan risk from Task 2; the integration risk of archiving an agent a live skill might still dispatch.

**Alternatives considered:**
- Skip blind per the gate — rejected: the agent-wiring risk is real and cheap to check.
- Override the gate and run the quality reviewer anyway — rejected: the gate is a documented contract; the script-bearing trigger genuinely did not apply.

**Decision:** Honor the prose-only skip but run a cheap orchestrator-level orphan grep (residual "upsize", surviving references to the archived agent).

**Rationale:** Respect the gate's letter while covering its one material blind spot at near-zero cost. The grep confirmed zero orphans and no live dispatch of the archived agent.

**Confidence:** High — grep results were conclusive (zero hits in active skills/agents).

---

### Fixing Task 1's cross-flagged test comment inline rather than deferring

**Context:** Both the spec and quality reviewers flagged a stale `design-large-task` leg in a test-file comment, outside AC-1.3's file scope.

**Information used:** Task 10's capstone runs the suite but does **not** grep test-file comments — so the residual would survive the sprint untouched.

**Alternatives considered:**
- Defer it (out of AC-1.3 scope) — rejected: nothing else in the sprint would catch it, contradicting the sprint goal.
- Fold into Task 10 — rejected: Task 10 has no grep step for comments.

**Decision:** Fix the comment inline in the file Task 1 already owns and commit it scoped.

**Rationale:** Two independent reviewers + a one-line surgical fix + directly serving the sprint's stated goal, in a file already in the task's commit scope.

**Confidence:** High.

---

### Committee teardown on the designer's "proceed" decision

**Context:** The standing rule is "only the Designer terminates the committee." The designer answered the plan-hardening gate with "a" (proceed to execute-write), without an explicit teardown order.

**Information used:** The committee's consult was complete (both rounds delivered, plan approved); execute-write uses its own subagents, not the committee; stranded teams leak context.

**Alternatives considered:**
- Keep the committee alive pending an explicit teardown order — rejected: proceeding to a downstream skill ends the consult; idle members leak context.
- Ask the designer to confirm teardown — rejected as unnecessary friction; "proceed" is the terminal decision for the consult.

**Decision:** Interpret "proceed" as authorizing closure; gracefully shut down all five members and `TeamDelete`.

**Rationale:** The gate decision closes the consult; the analysis persists on disk and in the record independent of team lifecycle. (inferred — the designer did not say "tear down" verbatim.)

**Confidence:** Medium — a reasonable reading of "proceed," but the literal teardown authorization was inferred, not stated.

---

### Recording real provenance over verbatim harvest (finish-write-records)

**Context:** `chester-trailer-write harvest` surfaced `design-large-task@vNNNN` and `design-specify@vNNNN` placeholder trailers. The skill says embed harvest output verbatim.

**Information used:** `grep` traced the `vNNNN` lines to committee deliberation transcripts quoting the record-formats example fixture; the real stamped artifacts are the plan/threat (`plan-build@v0005`) and deferred file (`execute-write@v0007`); the brief/spec are committee-authored and unstamped.

**Alternatives considered:**
- Embed verbatim per the skill — rejected: it would record false provenance, including the removed skill, violating the honesty principle.
- Embed nothing / claim no versions — rejected: two real trailers exist.

**Decision:** Embed the two real trailers and add a harvest note explaining the excluded fixture noise and the unstamped committee-authored artifacts.

**Rationale:** "Reconstruct, don't invent" and "honest about gaps" outrank a literal "embed verbatim" when the harvest tool mis-attributes quoted fixtures as live provenance.

**Confidence:** High — the fixture source was traced directly to the committee transcripts.

---

### Deferring out-of-scope ripples rather than expanding the spec's file set

**Context:** Several genuine residuals sit outside the approved spec's scoped files: root CLAUDE.md's `thinking` reference, README's proof-mcp paths, skill-index's stale flow model, decision-record/feature-definition historical mentions.

**Information used:** The spec's 24 ACs name specific files; these targets are not among them; several are append-only/historical documents that legitimately record past state.

**Alternatives considered:**
- Scrub them all for completeness — rejected: expands beyond the ratified scope and would rewrite historical records.
- Drop them silently — rejected: a future reader would re-discover them as apparent misses.

**Decision:** Record each as a deferred item (DI-1, DI-3, DI-4, DI-5) with rationale; act on none.

**Rationale:** Record-and-surface respects the ratified scope while giving the designer visibility; the spec author already excluded these files.

**Confidence:** High — each call traces to the spec's explicit scope boundary.

<!-- created-at: 2026-06-05T13:38:47Z -->
<!-- produced-by finish-write-records@v0004 -->
