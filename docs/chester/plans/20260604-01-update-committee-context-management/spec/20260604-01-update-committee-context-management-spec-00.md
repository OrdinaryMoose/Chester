# Spec: Team-Lead Context Economy in the Ad-hoc Committee

**Sprint:** 20260604-01-update-committee-context-management
**Parent brief:** docs/feature-definition/Pending/design-committee-team-lead-context-economy-01.md
**Architecture:** Hybrid — dedicated `member-protocol.md` contract surface (single drift point) + one-folder-per-round layout + single consultation ledger + Consolidator-writes-its-own-file (third-shape resolution of the write fork) + atomic single-commit landing.

## Goal

Keep the Ad-hoc committee team-lead's context from growing with round count. Today the team-lead carries every member's full return for the rest of the session (Conduit), holds all four returns at once to consolidate (Synthesizer), and runs dispatch/adjudication/closure (Controller). This change strips the Conduit and Synthesizer payloads off the team-lead's thread: members write their full positions to disk and send the team-lead a short digest only; an off-thread Consolidator reads the full positions from disk and emits an enumerate-only synthesis; the team-lead applies risk-weighted judgment to that compact input. A minimal disk ledger makes the team-lead rehydratable across a session boundary. The Controller role is untouched. Scope is the Ad-hoc committee (`design-committee`) only.

## Components

New files (2):

- **`agents/design-committee-consolidator.md`** — new reducer role. Frontmatter `tools: Read, Glob, Write`. **Spawned fresh per round (ephemeral one-shot dispatch), never added to the persistent `TeamCreate` roster** — its context is discarded after it returns, which is what keeps the synthesis off the team-lead's thread and prevents cross-round accumulation. Reads the round folder's member transcripts; writes an enumerate-only synthesis to `committee/roundNN/consolidator-output.md`. Positive enumeration ceiling: produces alignment count, per-member position summaries, and verbatim notable quotes. Prohibited from characterizing why alignment exists, weighting by risk, or synthesizing a direction. Not an advocate. Authored fresh — does not inherit the researcher's "synthesizing the sources" license.
- **`skills/design-committee/references/member-protocol.md`** — single authority for member-side output discipline, cited (not restated) by all five member agent files. Defines: (1) the digest-to-lead shape; (2) the write-to-round-folder discipline and transcript naming; (3) the write-transcript-then-send-digest sequencing rule.

Modified files (8 — the four advocacy agents share one bullet):

- **`agents/design-committee-{conservator,innovator,pragmatist,purist}.md`** — add `Write` to `tools`; add a scoped write-permission line (write only within `committee/`) and update the role's declared scope to state it writes a round-folder transcript (not a silent tool expansion, per `agents/CLAUDE.md`). Convert the **team-lead-facing finals** — the single-round response and the multi-round R2 final — to the digest shape (cite `member-protocol.md`), with the full content going to the transcript. The R1 proposal and R1 peer-challenge templates ride the peer-DM path and are unchanged. Bump version.
- **`agents/design-committee-researcher.md`** — add `Write` to `tools`; narrow the existing "no file writes outside conversation record" prohibition to "no writes outside the `committee/` tree and conversation record"; cite `member-protocol.md`; bump version.
- **`skills/design-committee/SKILL.md`** — Phase 1: create `committee/` — resolved under the sprint working dir when sprint context exists, else the team-lead asks the designer for the location (same fork the current `team-lead.md` Record File uses for the no-sprint standalone case). Phase 3: create `committee/round01/` before first dispatch; each later round opens the next `roundNN/`. One-round-format finals step: "write full position to round-folder transcript, then send digest" (round shape otherwise unchanged). Integration reads: add `member-protocol.md`; agents: add `design-committee-consolidator`. Re-point forbidden-attach-surfaces / floor-not-ceiling to `references/skill-contract.md`; remove any inline restatement. Add the affirmative clause that generic base-skill role-contract edits to agent files are permitted. State the one unconditional path (no cutover). Bump version.
- **`skills/design-committee/references/team-lead.md`** — Record File section rewritten to the `committee/roundNN/` layout; per-round flow gains a Consolidator dispatch step and a "read `consolidator-output.md`, apply risk-weighting, write the round record's Final Recommendation" step; new Ledger subsection (write/update `committee/ledger.md` each round boundary); closure stamps the `committee/` tree; reading order adds `member-protocol.md`. Bump version.
- **`skills/design-committee/references/committee-analysis-round-format.md`** — full rewrite to the round-folder model: per-member transcript files, a separate Consolidator output file/section (enumerate-only), and a separate team-lead Final Recommendation section. One folder per round; a follow-up round opens the next `roundNN/`. The current model — one record file **per designer question** (`committee-analysis-NN.md`, one or more files) living in `design/`, with inline team-lead consolidation (team-lead.md:89-95, round-format.md:36-45) — is retired in favor of per-round folders under `committee/`. Bump version.

## Data Flow

Per round, for the Ad-hoc committee:

1. Team-lead creates `committee/roundNN/` (and `committee/` at first setup).
2. Team-lead dispatches members (caveman ultra), one question per round; researcher on demand.
3. Members deliberate and peer-DM per the unchanged one-round-format.
4. Each member writes its full position to `committee/roundNN/<member>-transcript.md`, then sends the team-lead a digest only (identity, headline position, chosen option, top trade-off, confidence, transcript path) via messaging. Researcher writes `committee/roundNN/researcher-findings.md` and sends its digest.
5. Team-lead writes/updates `committee/ledger.md` (round number, which members returned, running alignment pattern, open questions, designer decisions so far).
6. Team-lead dispatches the Consolidator with the `committee/roundNN/` path.
7. Consolidator reads the transcripts, writes `committee/roundNN/consolidator-output.md` (enumerate-only), and returns a compact confirmation.
8. Team-lead reads `consolidator-output.md`, applies risk-weighted judgment, and writes the round record's Final Recommendation (`committee/roundNN/committee-analysis.md`); presents the translated decision packet to the designer.
9. Designer adjudicates → next round (new folder) or closure.
10. Closure happens ONLY on an explicit designer signal; team-lead finalizes and stamps the `committee/` artifacts; SKILL.md then runs `TeamDelete`.

The team-lead's per-round context is digests + one Consolidator confirmation + the ledger — never the full member returns.

## Error Handling

- **Digest arrives before transcript exists.** The sequencing rule in `member-protocol.md` is write-transcript-then-send-digest. Observable failure: a digest whose `transcript path` does not resolve to a file. Treated as a protocol violation, not a silent pass.
- **Consolidator dispatched against an empty/partial round folder.** Team-lead dispatches the Consolidator only after all expected member transcripts are present (step 6 follows step 4 for all members). Observable: Consolidator finding fewer transcripts than members dispatched.
- **Two-writer contention on the record file.** Avoided by construction: the Consolidator writes only `consolidator-output.md`; the team-lead writes only `committee-analysis.md`. No file has two writers.
- **Write outside `committee/`.** Enforced by contract prose in each agent file and `member-protocol.md` (same trust model as the researcher's existing Bash grant). There is no mechanical filesystem scoping; a write to `design/ spec/ plan/ summary/` is a contract violation observable as a stray file.
- **Closure without designer signal.** Prohibited — only the designer may terminate the committee. The team-lead does not initiate teardown on its own judgment that decisions are done.

## Testing Strategy

Structural and behavioral assertions (markdown/contract artifacts; Chester's bash test pattern under `tests/`):

- **Tool grants:** each of the five member agent files declares `Write`; the Consolidator declares `Read, Glob, Write`.
- **Single drift point:** `member-protocol.md` exists; all five member agent files cite it for the digest shape and none restate the field list inline.
- **Consolidator ceiling:** `design-committee-consolidator.md` contains the positive enumeration list and the three explicit prohibitions; it does not contain "synthesizing the sources" license language.
- **Layout:** SKILL.md and team-lead.md reference `committee/roundNN/` for committee work product and never `design/` for it; `design/ spec/ plan/ summary/` are named as reserved.
- **Vocabulary:** no occurrence of "Mode A" / "Mode B" in any touched file.
- **Scope guard:** no file under `agents/design-architect-committee-*` or any `design-architect-committee` reference is modified.
- **Composition:** the one-round-format text is unchanged in shape; late-evidence revision and SendMessage-for-finals remain expressible.
- **Behavioral dry-run:** a retrospective multi-round committee run under the new disciplines shows team-lead peak context materially reduced versus a baseline run without them, and shows the team-lead rehydratable from `committee/ledger.md` + round records across a session boundary.

## Constraints

- **Floor-not-ceiling / forbidden attach surfaces** (`skill-contract.md`): all agent-file edits here are GENERIC base-skill role-contract clarifications applying to every invocation — never sprint-specific overlay. The spec frames them as such.
- **Do not modify the one-round-format** — it is canonical and ratified. Only the finals step's output shape changes (full text → transcript+digest).
- **Preserve ratified disciplines** — late-evidence Step-4 revision and SendMessage-for-finals must still hold; a member may revise its transcript and digest before round close if peer evidence lands.
- **No in-process compaction primitive exists** — the ledger delivers "growth materially reduced + state survives a session handoff," NOT "flat across rounds."
- **Existing economy measures are composed with, not replaced** — inter-agent caveman ultra, persist-every-round (now realized via transcripts + Consolidator), mandatory `TeamDelete` at designer-signaled closure, linked-not-quoted context packets.
- **One unconditional path** — no cutover, no multi-round gate, no degrade-to-no-op. A single-round consult incurs exactly one extra Consolidator spawn.
- **Scope = Ad-hoc committee only**; `design-architect-committee` untouched.
- **No "Mode A" / "Mode B" vocabulary** anywhere.
- **Agent-file write grants are declared, not silent** — per `agents/CLAUDE.md` (write tools only when the role explicitly mutates state; no silent scope expansion — :33, :35), each member file that gains `Write` updates its declared scope to state it writes a round-folder transcript.

## Non-Goals

- **`design-architect-committee`** — deprecation-pending; no changes.
- **A new late-evidence Step-4 sub-round mechanism** — out of scope; the existing ratified discipline is preserved, not extended. A fuller late-evidence re-dispatch is its own future brief.
- **Mechanical filesystem write-scoping** — write scope stays contract-enforced, matching the researcher's current trust model.
- **An in-process mid-deliberation compaction primitive** — does not exist in the harness; not built here.
- **Reinterpreting prior session records** written under the retired one-file-per-question model.

## Acceptance Criteria

### AC-1.1 — Member write access granted

**Observable boundary:**
- Each of the five member agent files declares `Write` in its `tools` frontmatter → write is available to members.
- The researcher's prohibition reads "no writes outside the `committee/` tree and conversation record" → grant is scoped in contract text.

**Given:** the member agent files currently declare read-only tool grants
**When:** the spec is implemented
**Then:** all five declare `Write`, each with a contract line scoping writes to `committee/`

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Committee artifact tree separated from formal artifacts

**Observable boundary:**
- Committee work product is written under `committee/roundNN/` (and `committee/ledger.md`) → process-internal artifacts segregated.
- No committee work file is written to `design/ spec/ plan/ summary/` → formal folders reserved.

**Given:** a committee consultation runs (standalone or sprint-wrapped)
**When:** the team-lead sets up and runs a round
**Then:** `committee/` is created under the sprint working dir when sprint context exists, else at a designer-specified location; `committee/roundNN/` holds that round's artifacts; and the formal folders carry none

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Digest-to-lead is the only member→team-lead payload

**Observable boundary:**
- A member's full position exists at `committee/roundNN/<member>-transcript.md` → verbatim on disk.
- The message a member sends the team-lead carries only the digest fields (identity, headline, chosen option, top trade-off, confidence, transcript path) → no full reasoning transits the team-lead.
- This applies to the team-lead-facing finals (single-round response and multi-round R2 final); R1 proposals and peer challenges ride the peer-DM path and are unchanged → the digest discipline targets the finals, not the peer exchange.

**Given:** a member has formed its final position
**When:** it submits to the team-lead
**Then:** the full text is on disk and the team-lead receives a digest only

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — Digest shape lives in one cited authority

**Observable boundary:**
- `member-protocol.md` defines the digest field list and the write-then-send sequencing → single source.
- All five member agent files cite it and none restate the field list inline → no five-file drift.

**Given:** the digest contract must apply identically to all members
**When:** the member files are written
**Then:** each references `member-protocol.md` for the shape rather than carrying its own copy

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Consolidator exists as an enumerate-only role

**Observable boundary:**
- `agents/design-committee-consolidator.md` exists with `tools: Read, Glob, Write` → off-thread reducer with disk access.
- Its contract lists the positive enumeration ceiling (alignment count, per-member summaries, verbatim notable quotes) and the three prohibitions (no why-characterization, no risk-weighting, no directional synthesis), and contains no "synthesizing the sources" license → inert by construction.

**Given:** consolidation must happen off the team-lead's thread without pre-empting its judgment
**When:** the Consolidator role is authored
**Then:** it enumerates only and is prohibited from interpretation

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — Consolidator runs off-thread and writes its own file

**Observable boundary:**
- The team-lead dispatches the Consolidator with the round-folder path and does not hold the four full returns to consolidate → synthesis is off-thread.
- The Consolidator is spawned fresh each round (ephemeral one-shot, not on the persistent roster) → no cross-round context accumulation.
- The Consolidator writes `committee/roundNN/consolidator-output.md`; the team-lead writes `committee/roundNN/committee-analysis.md` → no shared-file two-writer race.
- The team-lead applies risk-weighted judgment to the Consolidator's output → judgment stays with the team-lead.

**Given:** member transcripts are on disk for the round
**When:** the team-lead consolidates
**Then:** it dispatches the Consolidator, reads `consolidator-output.md`, and writes its own risk-weighted Final Recommendation

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — Minimal deliberation-state ledger

**Observable boundary:**
- `committee/ledger.md` exists and is updated each round boundary with round number, member-return status, running alignment pattern, open questions, and designer decisions → durable deliberation state.
- The ledger is consultation-level (one file), not a transcript → minimal size.

**Given:** a multi-round consultation
**When:** each round boundary is reached
**Then:** the ledger reflects current deliberation state in a few hundred tokens

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — Rehydratable across a session boundary

**Observable boundary:**
- A fresh session can resume the consultation by reading `committee/ledger.md` plus the round records → rehydration without the original thread.
- The criterion is "growth materially reduced + session-handoff survivable," not "flat across rounds" → no overclaim.

**Given:** a consultation interrupted at a round boundary
**When:** a new session reads the ledger and round records
**Then:** it can continue the deliberation from the recorded state

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-5.1 — One unconditional path

**Observable boundary:**
- SKILL.md and team-lead.md describe a single path with no cutover, multi-round gate, or degrade-to-no-op clause → no branching.
- A single-round consult runs the same disciplines (one Consolidator spawn, ledger, round folder) → uniform.

**Given:** any consult, one round or many
**When:** the committee runs
**Then:** the same disciplines apply with no conditional on round count

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-6.1 — Round-record template re-aligned

**Observable boundary:**
- `committee-analysis-round-format.md` describes the `committee/roundNN/` model: per-member transcripts, a separate enumerate-only Consolidator output, and a separate team-lead Final Recommendation → distinct sections/files.
- It contains no per-question-file-in-`design/` or inline-consolidation framing → stale model removed.

**Given:** the template currently models one-file-per-designer-question records with inline team-lead consolidation in `design/`
**When:** it is rewritten
**Then:** it matches the round-folder model with the Consolidator and team-lead outputs distinct

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-7.1 — Citations re-pointed; ratified disciplines preserved

**Observable boundary:**
- Forbidden-attach-surfaces and floor-not-ceiling are cited from `skill-contract.md` with no dangling external citations and no inline restatement → stale citations closed.
- The one-round-format text is unchanged in shape; late-evidence revision and SendMessage-for-finals remain expressible → ratified disciplines intact.
- The affirmative "agent-file edits permitted as generic base-skill role-contract clarifications" clause is present → the agent-file edits are sanctioned.

**Given:** the brief's stale citations and the ratified prior disciplines
**When:** SKILL.md is edited
**Then:** citations point to `skill-contract.md`, the round format is untouched in shape, and the affirmative clause is stated

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-8.1 — Scope and vocabulary guards

**Observable boundary:**
- No touched file contains "Mode A" or "Mode B" → banned vocabulary absent.
- No `design-architect-committee` file is modified → scope held to the Ad-hoc committee.

**Given:** the global directives
**When:** the change lands
**Then:** the vocabulary is absent and design-architect-committee is untouched

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

## Revision Log

- **spec-00, 2026-06-04.** Initial spec on the hybrid architecture. Passed fidelity review (Approved; one cosmetic miscount fixed — "Modified files" count). Passed adversarial review with 3 MEDIUM findings fixed inline: (1) digest-to-lead scoped to the team-lead-facing finals (single-round response + multi-round R2 final), peer-DM path unchanged; (2) Consolidator declared an ephemeral per-round dispatch, not a persistent roster member; (3) `committee/` location resolves by sprint context with a designer-ask fork for standalone. One LOW note folded into Constraints (declared write scope per `agents/CLAUDE.md`). Passed ground-truth review (1 MEDIUM + 2 LOW): MEDIUM fixed — current record model corrected from "single-file" to one-file-per-designer-question in `design/`; LOW fixed — `agents/CLAUDE.md` reference de-quoted to a paraphrase; LOW noted — SKILL.md carries no inline forbidden-attach-surfaces restatement, so that re-point is a citation touch-up/no-op (left as written, harmless). All spec claims about tool grants, output templates, the researcher's "synthesizing" license, the TeamCreate roster, and skill-contract.md ownership verified accurate against the codebase.

<!-- created-at: 2026-06-04T17:55:00Z -->
<!-- produced-by design-specify@v0003 -->
