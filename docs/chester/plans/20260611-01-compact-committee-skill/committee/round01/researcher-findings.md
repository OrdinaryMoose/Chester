# Researcher findings — round01
# Sprint: 20260611-01-compact-committee-skill

---

## Task 1 — Byte/line counts (actual vs brief claims)

**Researcher — codebase**

Question: exact wc -l / wc -c for each in-scope file; confirm brief KB figures

Findings:
- `skills/design-committee/SKILL.md` — 160 lines / 15,379 bytes (~15KB) — SKILL.md:1-160
- `skills/design-committee/references/team-lead.md` — 348 lines / 31,112 bytes (~30KB) — team-lead.md:1-348
- `skills/design-committee/references/member-protocol.md` — 160 lines / 7,224 bytes (~7KB) — member-protocol.md:1-160
- `skills/design-committee/references/committee-analysis-round-format.md` — 226 lines / 11,537 bytes (~11KB) — round-format:1-226
- `skills/design-committee/references/artifact-template.md` — 48 lines / 2,135 bytes (~2KB) — artifact-template.md:1-48
- `skills/design-committee/references/skill-contract.md` — 52 lines / 3,821 bytes (~4KB) — skill-contract.md:1-52
- `skills/util-design-partner-role/SKILL.md` — 189 lines / 14,997 bytes (~15KB) — util-design-partner-role/SKILL.md:1-189
- Agent files total: 646 lines / 49,048 bytes (~48KB across 7 files)
  - conservator.md: 105 lines / 8,159 bytes
  - consolidator.md: 64 lines / 5,914 bytes
  - innovator.md: 105 lines / 7,885 bytes
  - pragmatist.md: 105 lines / 7,806 bytes
  - purist.md: 105 / 7,953 bytes
  - researcher.md: 123 lines / 8,424 bytes
  - scribe.md: 39 lines / 2,907 bytes

**Orchestrator runtime load (the 4 core files + util):**
SKILL.md (15KB) + team-lead.md (31KB) + member-protocol.md (7KB) + round-format (11KB) + util-design-partner-role (15KB) = **79,249 bytes / ~77KB total**

Brief claims "~64KB / ~16K tokens." DECISIVE CORRECTION: brief undercounts. If util-design-partner-role loads (team-lead.md line 28 mandates it), the 5-file orchestrator load is ~77KB. The 4-file subtotal without util = 65,252 bytes (~64KB) — brief's figure matches the 4-file count and omits util. Brief's claim "plus util-design-partner-role" is acknowledged in the parenthetical list but the headline number does not include it. Actual orchestrator context cost is ~77KB / ~19K tokens at 4 chars/token.

Notes: agent files load in separate subagent context windows; correct to exclude from orchestrator total. artifact-template (2KB) and skill-contract (4KB) also excluded; correct per brief.

---

## Task 2 — Which files load into orchestrator vs separate windows

**Researcher — codebase**

Question: verify reading-order/integration sections to establish what team-lead reads at runtime

Findings:
- team-lead.md § Reading Order (lines 48-57) lists exactly 6 items the team-lead reads before convening:
  1. `skills/design-committee/SKILL.md` — "committee mechanics floor"
  2. `skills/util-design-partner-role/SKILL.md` — "voice rules + Info-Packet Style Overlay"
  3. "This doc" (team-lead.md itself) — "team-lead role"
  4. `agents/design-committee-*.md` — "loads as each member's system prompt **on dispatch**" (separate windows)
  5. `skills/design-committee/references/member-protocol.md` — "shared member/researcher protocol"
  6. `skills/design-committee/references/committee-analysis-round-format.md` — "round-folder record model"
  — team-lead.md:48-57
- SKILL.md § Integration line "Reads:" (line 157) confirms: SKILL.md, util-design-partner-role, team-lead.md, member-protocol.md, round-format, artifact-template, skill-contract. Also states "Member phase contracts are not read here — they load as each `chester:design-committee-*` agent's own system prompt on dispatch." — SKILL.md:157
- skill-contract.md frontmatter + line 11: "Skill-author doc ... Team-lead does NOT read at runtime." — skill-contract.md:1-11
- artifact-template.md has no frontmatter note about runtime loading; but SKILL.md line 157 lists it under "Reads:" (team-lead provides path to scribe at dispatch); the scribe (separate window) reads it — the path is passed, not the content injected into orchestrator context — SKILL.md:157
- round-format.md IS in the team-lead reading order (item 6 above) — loads into orchestrator — team-lead.md:56

DECISIVE: reading-order list (team-lead.md:48-57) = authoritative list of what loads into orchestrator. Items 1-3 + 5-6 = orchestrator. Item 4 = subagent system prompts (separate windows). Brief's claim on this is CONFIRMED.

Notes: artifact-template.md ambiguous — listed in SKILL.md "Reads:" but team-lead.md reading order omits it. Most likely passed as a path to the scribe rather than bulk-loaded into orchestrator. Not in the 6-item reading-order list = not a direct orchestrator load.

---

## Task 3 — Per-Round Flow duplication: 3× claim

**Researcher — codebase**

Question: locate all 3 per-round-flow sites; quote heading + first line; verify step counts; find substantive differences

Findings:

**Site A — SKILL.md § Per-Round Flow (lines 112-127)**
- Heading: `### Per-Round Flow` — SKILL.md:112
- First line: "The canonical per-round sequence (spec §5). Steps 1–3 are member-side; steps 4–8 are team-lead-side (detail in `references/team-lead.md`). Each step writes its artifact to the round folder before the next begins — available to wrapping skills via reference." — SKILL.md:114
- Steps: 8 steps (Dispatch, Members write, Members signal, Consolidate, Synthesize, Converge, Author, Present) — SKILL.md:116-123
- Contains "detail in `references/team-lead.md`" pointer at line 114 — already cites team-lead for detail

**Site B — team-lead.md § Per-Round Flow (lines 98-111)**
- Heading: `#### Per-Round Flow` — team-lead.md:98
- First line: "1. **Dispatch question** — initial question (Round 1 already confirmed) or refined question (designer narrowed scope between rounds)." — team-lead.md:100
- Steps: 11 steps — team-lead.md:100-111
- Extra content vs SKILL.md 8-step version:
  - Step 2 adds: persist-before-adjudicate floor detail, disk-is-source-of-truth rule, references member-protocol § Write-then-send
  - Step 3 (new): "Update the ledger" — ledger write at round boundary — NOT in SKILL.md
  - Step 6 adds: two-round Delphi mode fork instruction
  - Step 8 adds: artifact-template path provision detail, alignment map as scribe's Rationale source
  - Step 9 adds: "read IS the review" instruction, Dissent Record guarantee, decision-communication packet reference
  - Step 10 (checkpoint) adds explicit artifact-path-as-required-input blocking rule
  - Step 11 (new): "Designer response" — full termination/loop-back taxonomy — NOT in SKILL.md

DECISIVE: 3 extra steps in team-lead.md (steps 3, 10, 11 in its numbering) are GENUINELY ADDITIONAL content, not finer granularity of SKILL.md steps. "Update the ledger" and "Designer response" have no counterpart in SKILL.md. Not safe to collapse without preserving this content.

**Site C — round-format.md § How To Use (lines 72-87)**
- Heading: `## How To Use` — round-format.md:72
- First line: "1. Create the round folder `committee/roundNN/`..." — round-format.md:74
- Steps: 6 steps — round-format.md:74-87
- This is folder-management/artifact-filling instructions, not the per-round dispatch pipeline. Steps describe: create folder, members write transcripts, Consolidator writes output, team-lead writes alignment-map and verdict, scribe writes decision-packet, follow-up opens next folder.
- Audience: person writing files, not agent executing dispatch flow.

PARTIAL CORRECTION to brief: round-format "How To Use" is NOT a third instance of the same pipeline description. It is a different abstraction — artifact-filling checklist, not dispatch flow. The structural pipeline prose (lines 22-44 cited by brief) is the folder-shape introduction, not a "per-round flow" section. Lines 22-44 describe artifact audiences/disciplines (what each file is for), not sequencing of steps. Brief's claim of 3× restatement is partially correct (SKILL.md + team-lead.md genuinely duplicate the pipeline), but round-format's contribution is a different artifact — a folder-use template, not a dispatch sequence.

Notes: SKILL.md line 114 already contains a pointer to team-lead.md for detail, suggesting partial dedup awareness already exists at Site A.

---

## Task 4 — Translation Gate duplication: 3× claim

**Researcher — codebase**

Question: locate all Translation Gate sites across files; quote what util-design-partner-role owns

Findings:

**util-design-partner-role owns:**
- "Read aloud. Can't say sentence aloud over coffee → rewrite." — util-design-partner-role/SKILL.md:25
- "No CamelCase, dots, slashes, backticks." — util-design-partner-role/SKILL.md:26
- "No type-theory jargon." — util-design-partner-role/SKILL.md:27
- "No sprint IDs, ticket IDs in reasoning." — util-design-partner-role/SKILL.md:28
- "No file suffixes." — util-design-partner-role/SKILL.md:29
- Full Interpreter Frame section: util-design-partner-role/SKILL.md:19-30
- C1, C2, Option-Naming, Self-Evaluation, PM Litmus Test, Research Boundary all live here

**Site A — SKILL.md § Translation Gate (lines 36-45)**
- Heading: `## Translation Gate` — SKILL.md:36
- Restates: Read-aloud test, Option-naming, C1, C2 — 4 bullet points — SKILL.md:40-43
- Line 45: "Full voice spec: `skills/util-design-partner-role/SKILL.md`. LOAD-BEARING citation." — SKILL.md:45
- Already contains authoritative cite; the 4 bullets above it are restatements of what util owns

**Site B1 — team-lead.md § Voice (lines 26-37)**
- Heading: `### Voice — Delegated to util-design-partner-role` — team-lead.md:26
- Lists: Translation Gate, C1, C2, Stance Principles, Option-Naming Rule, Self-Evaluation — team-lead.md:29-35
- Line 28: "Before consolidating, read `skills/util-design-partner-role/SKILL.md`." — team-lead.md:28
- Contains application-scoped note: "Do NOT restate rules in packet. Apply silently." — team-lead.md:37
- Adds audience-specific constraint not in SKILL.md § Translation Gate: "Apply silently" instruction

**Site B2 — team-lead.md § Translation Gate (lines 291-299)**
- Heading: `### Translation Gate` — team-lead.md:291
- "Full spec in util-design-partner-role. Pre-send enforcement on every designer-visible block:" — team-lead.md:293
- Lists 5 bullets restating: read-aloud, option-naming, no code vocab, C1, C2 — team-lead.md:294-299
- Same content as SKILL.md § Translation Gate; different placement (Visible Surface section vs early in doc)

**Site B3 — team-lead.md § PM Litmus Test (lines 301-303)**
- Heading: `### PM Litmus Test` — team-lead.md:301
- "Apply the PM Litmus Test from `util-design-partner-role` (§ PM Litmus Test) to every designer-facing packet" — team-lead.md:303
- Cites not restates — this is a cite-not-restate already

**Site B4 — team-lead.md § Research Boundary (lines 305-308)**
- Heading: `### Research Boundary` — team-lead.md:305
- "Follow the Research Boundary in `util-design-partner-role` (§ Research Boundary)." — team-lead.md:307
- Cites not restates — already a cite

**Site C — round-format.md § Conventions (lines 101-103)**
- "**Translation Gate boundary.** The Gate APPLIES to the scribe's designer-facing decision-packet. It does NOT apply to transcripts, findings, the Consolidator output, the alignment map, or the verdict — those are internal and may carry code vocabulary." — round-format.md:101-103
- This is NOT a restatement of what the Gate is. It is a boundary-scoping rule: applies-here / doesn't-apply-here for each artifact type. Adds application context not present in util-design-partner-role.

LOAD-BEARING NUANCE (task 11 material): round-format line 101-103 is a boundary clause (which artifacts the Gate applies to), not a restatement of Gate rules. Safe to keep as a cite-with-scope note. The member-protocol.md also carries its own boundary clause at lines 67-69: "The Translation Gate does not apply to transcript files. Transcripts are internal working records." — member-protocol.md:67-69. This boundary is split across two files and must not be lost if either is collapsed.

DECISIVE: team-lead.md carries Translation Gate content in 2 places (lines 26-37 and 291-299) — genuine duplication within team-lead.md. SKILL.md § Translation Gate (lines 36-45) is a third restatement. Brief's 3× claim is CONFIRMED for rules-restatement sites; the round-format and member-protocol entries are boundary-clause sites (distinct, must survive).

---

## Task 5 — Output-surface split duplication: 3× claim

**Researcher — codebase**

Question: locate all output-surface-split sites; exact anchors + quote each

Findings:

**Site A — SKILL.md step 7 (line 122)**
- Full text: "**Author** — the team-lead dispatches the ephemeral scribe with the verdict, the artifact-template path, the consolidator output, and the alignment map; the scribe writes the round's designer-facing decision-packet. The decision-packet is the committee's **decision-communication packet** — a locked format used only when seeking a designer decision; the round's answer itself (the end-of-turn session artifact) has no mandated format. This is the **output-surface split** (§ `references/team-lead.md` Output Surfaces)." — SKILL.md:122
- Already contains a cite to team-lead.md § Output Surfaces — partial dedup already present

**Site B — team-lead.md § Output Surfaces (lines 152-159)**
- Heading: `### Output Surfaces` — team-lead.md:152
- "The committee has two distinct output surfaces — the **output-surface split**:" then defines decision-communication packet (locked format) and end-of-turn session artifact (no mandated format) — team-lead.md:154-159
- This is the authoritative definition site

**Site C — round-format.md § Conventions lines 104-110**
- "**Answer shape + warrants on disk.** `alignment-map.md` and `verdict.md` carry an answer-shape marker (converged / preserved-split / partial) and a warrant record for the answer body... This is the committee's **output-surface split**: the scribe's designer-facing decision-packet has a locked format; the team-lead's on-disk answer record does not." — round-format.md:104-110
- Adds specific disambiguation: "(This output-surface split is a distinct concept from the 'two-surface' usage in sprint `20260521-02-design-architect-committee` — do not conflate the two terms.)" — round-format.md:108-110
- The disambiguation clause is round-format-specific context; not in team-lead.md

LOAD-BEARING NUANCE: round-format.md line 108-110 carries a disambiguation clause ("do not conflate with the two-surface usage in sprint 20260521-02-design-architect-committee") not present in the other sites. This clause survives if round-format.md becomes a cite; it must be preserved in the cite or the cite target.

DECISIVE: 3× confirmed. SKILL.md:122 already cites team-lead.md § Output Surfaces — partially deduped. round-format adds disambig clause not present elsewhere. Brief's 3× claim CONFIRMED.

---

## Task 6 — Standalone/no-sprint duplication INSIDE SKILL.md: 3× claim

**Researcher — codebase**

Question: locate 3 standalone sites within SKILL.md; exact anchors + quote

Findings:

**Site A — SKILL.md § Phase 1 (lines 55-57)**
- "Read environment + config, then establish the `committee/` work-product tree. No sprint creation, no thinking history. Preserves standalone invocability." — SKILL.md:57
- Step 4: "Do NOT invoke `start-bootstrap`. Sprint mechanics violate standalone invocability when no sprint exists." — SKILL.md:62

**Site B — SKILL.md § Standalone Invocability (lines 142-146)**
- Heading: `## Standalone Invocability` — SKILL.md:142
- Full section: "No entry condition. No sprint context required. Convene from any context. Other Chester skills wrap committee calls without inheriting sprint state. Phase 1 bootstrap reads environment + config and establishes the `committee/` tree, but creates no sprint and runs no sprint mechanics — standalone invocability preserved. Committee work product is written to disk under `committee/roundNN/` every round; the `committee/` root resolves per `references/member-protocol.md` § Committee root resolution — no sprint context is fabricated." — SKILL.md:144
- Also adds: "There is one unconditional path. There is no cutover, no multi-round gate, no degrade-to-no-op..." — SKILL.md:146
- Line 146 adds a nuance NOT in Phase 1: unconditional-path / no-degrade-to-no-op rule. This is a distinct behavioral constraint.

**Site C — SKILL.md § Integration "Does NOT call" (lines 158-159)**
- "**Does NOT call:** `start-bootstrap`, `util-worktree`, any sprint-creating skill. Standalone invocability requires Phase 1 create no sprint — no `start-bootstrap`, no sprint directory." — SKILL.md:159

LOAD-BEARING NUANCE: § Standalone Invocability line 146 carries "no degrade-to-no-op" rule not present in Phase 1 or Integration. Safe to collapse to one site only if this constraint is preserved. Brief's 3× claim CONFIRMED but the § Standalone Invocability site has unique content.

Notes: brief's "(142-147)" range = lines 142-146 in actual file (section ends at 146, not 147).

---

## Task 7 — Ephemeral-off-roster Consolidator/Scribe: ~4× claim

**Researcher — codebase**

Question: locate all ephemeral-off-roster statements; exact anchors + quote

Findings:

**Site A — SKILL.md § Consolidator (line 92)**
- "It is an EPHEMERAL per-round dispatch — spawned for the round and gone after. It is NOT a member of the `TeamCreate` roster; never add it to the five-member team." — SKILL.md:92

**Site B — SKILL.md § Scribe (line 96)**
- "Like the Consolidator, it is an EPHEMERAL per-round dispatch — NOT a member of the `TeamCreate` roster; never add it to the five-member team." — SKILL.md:96

**Site C — SKILL.md § Integration (line 156)**
- "`chester:design-committee-consolidator` (ephemeral per-round consolidation dispatch, not on the `TeamCreate` roster); `chester:design-committee-scribe` (ephemeral per-round authoring dispatch, not on the `TeamCreate` roster)" — SKILL.md:156

**Site D — team-lead.md step 4 (line 103)**
- "**Dispatch the Consolidator** — dispatch a fresh, ephemeral Consolidator with this round's `committee/roundNN/` folder path. Spawn it via the Agent tool with **no `team_name`** — it is an off-roster one-shot and returns its result by file pointer." — team-lead.md:103
- Adds: "no `team_name`" instruction + "Agent tool" specification — DISTINCT content not in SKILL.md

**Site E — team-lead.md step 8 (line 107)**
- "**Dispatch the scribe** — dispatch the scribe via the Agent tool with **no `team_name`** (off-roster one-shot, same as the Consolidator in step 4 — returns its result by file pointer)" — team-lead.md:107
- Adds: same "Agent tool / no team_name" instruction

LOAD-BEARING NUANCE: team-lead.md steps 4 + 8 add "Agent tool with no `team_name`" — the actual dispatch mechanism. SKILL.md sites A/B/C state the roster-exclusion rule only. These are NOT the same content: team-lead sites carry the operational how (which tool, no team_name); SKILL.md sites carry the policy why (ephemeral, not roster member). Collapsing all to one site risks losing either the policy or the mechanism. Count: 5 sites total (A, B, C, D, E), not 4. Brief's "~4×" is close but SKILL.md has 3 sites, not 2.

---

## Task 8 — Warrant/Authority-Guard rule INSIDE team-lead.md: 4× claim

**Researcher — codebase**

Question: locate all 4 warrant/Authority-Guard sites within team-lead.md; exact anchors + quote

Findings:

**Site A — team-lead.md step 6 (line 105)**
- "write `committee/roundNN/alignment-map.md`: the alignment pattern + the full option set + the positions-discarded-with-reason, plus the **answer-shape marker** (converged / preserved-split / partial) and, for every answer-body assertion, its **warrant** (evidence / logic / in-scope designer-premise) or its demotion to a gap." — team-lead.md:105
- Defines warrant types and demotion rule in the context of writing alignment-map

**Site B — team-lead.md step 7 (line 106)**
- "write `committee/roundNN/verdict.md`: the team-lead's risk-weighted answer...carrying the same answer-shape marker and warrant record so the warrants are auditable on disk, not held only in context." — team-lead.md:106
- States warrants ride into verdict.md for auditability — carries "auditable on disk" requirement

**Site C — team-lead.md § Authority Guard (lines 319-325)**
- Heading: `**Authority Guard.**` — team-lead.md:319
- Full block: Warrant test (line 321), Count-not-a-warrant (322), C2 firewall (323), C1 audit (324), Warrants on disk (325) — team-lead.md:319-325
- The warrant test at line 321 adds: "The warrant is **supplied by the member** in its `## Final Position`; the team-lead **verifies** it... An assertion whose member-supplied warrant cannot be verified, or whose member supplied none, is demoted to a gap. The team-lead does not originate a warrant on the member's behalf." — team-lead.md:321
- ADDITIONAL CONTENT: member-supplied vs team-lead-verified distinction — not fully present in steps 6/7

**Site D — team-lead.md § Self-Evaluation lines 342-344**
- Three bullet items in self-eval checklist:
  - "**Authority Guard — warrant coverage.** Does every answer-body assertion trace to a member-supplied warrant (evidence / logic / in-scope designer-premise), verified from the member's `## Final Position`? Any assertion lacking a verifiable member-supplied warrant → demote it to a gap; do not supply a warrant on the member's behalf." — team-lead.md:342
  - "**Authority Guard — count is not a warrant.** Did I let an alignment count stand in for a warrant? Yes → restore the warranted minority as a preserved split." — team-lead.md:343
  - "**Authority Guard — strict premise scope.** Did I extend a designer premise past its granted scope? Yes → withdraw the over-extension and surface the uncovered question as a new gap." — team-lead.md:344

LOAD-BEARING NUANCE: Site C (§ Authority Guard) is definitional — the policy. Sites A + B are operational — "write warrant record here." Site D is the self-check game — actionable imperative form of Site C. These are not pure restatements: Sites A/B say "where to write warrants"; Site C says "what warrants are and who supplies them"; Site D says "how to self-check at send time." Some compression is possible (Site D could cite Site C), but Sites A/B serve a different function (disk-persistence instruction) that must survive. Brief's 4× claim CONFIRMED; substantive differences between sites are real.

---

## Task 9 — Member-lens restatement: SKILL.md § Six Members vs agent files

**Researcher — codebase**

Question: SKILL.md § Six Members restates lenses; verify agent files carry same lens; quote matching lens line

Findings:

**SKILL.md § Six Members lens statements (lines 29-33):**
- "Conservator; `chester:design-committee-conservator`. Defends existing structure, stasis, framing current patterns handle. Design history = signal until proven cost." — SKILL.md:29
- "Innovator; `chester:design-committee-innovator`. Pushes new framings, structural alternatives. Existing structure = choice re-makeable." — SKILL.md:30
- "Pragmatist; `chester:design-committee-pragmatist`. Weighs op cost vs benefit. Defends simplest sufficient. Shipping + runtime cost = first-class trade-offs." — SKILL.md:31
- "Purist; `chester:design-committee-purist`. Tests category boundaries, compositional integrity. Ambiguous categories = failure mode." — SKILL.md:32

**Agent files — lens section (sample: conservator.md):**
- `agents/design-committee-conservator.md` § Lens Position (lines 14-22):
  - "Conservator defends **status quo**, **stasis**, framing that **existing patterns** already handle." — conservator.md:14
  - "Design choice should respect existing system's design history — what is in place encodes prior decisions that paid for themselves." — conservator.md:17
  - "Defend stasis as stance — not stasis as inertia. Existing structure = signal until proven cost." — conservator.md:21
- SKILL.md line 29 one-liner: "Defends existing structure, stasis, framing current patterns handle. Design history = signal until proven cost." = compressed version of conservator.md lines 14-22

**skill-contract.md § Why Four Members (lines 30-35):**
- Carries a THIRD statement of all four lenses:
  - "**Conservator** — defends existing structure as evidence of prior decisions that paid for themselves." — skill-contract.md:31
  - "**Innovator** — pushes new framings; treats current structure as choice re-makeable." — skill-contract.md:32
  - "**Pragmatist** — weighs shipping and runtime cost against benefit; defends simplest sufficient." — skill-contract.md:33
  - "**Purist** — tests category boundaries; treats compositional integrity as load-bearing." — skill-contract.md:34
- skill-contract.md is author-only (not runtime reading); lens repetition here does not add orchestrator cost. Brief does not mention skill-contract as a lens duplication site.

DECISIVE: lens is restated in SKILL.md (4 one-liners), in 4 agent files (full lens sections), and in skill-contract.md (4 one-liners). SKILL.md § Six Members restatement confirmed. Agent files carry the authoritative expanded lens; SKILL.md is a compressed restatement. skill-contract.md is a third site but author-only (no orchestrator cost). Brief's claim CONFIRMED for SKILL.md duplication.

---

## Task 10 — member-protocol as "single authority" model: verify declaration + cite pattern

**Researcher — codebase**

Question: verify member-protocol declares itself single authority; verify SKILL/team-lead cite not restate

Findings:

**member-protocol.md self-declaration:**
- Frontmatter description (lines 4-8): "Shared protocol ... Cited by SKILL.md and team-lead.md; not restated by them." — member-protocol.md:4-8
- § Final Position (line 77): "This section is the **single authority for the Final Position schema** — the consolidator, the team-lead, the round-format reference, and the annotated artifact all cite this section rather than restating its fields." — member-protocol.md:77
- § Committee root resolution (lines 157-160): "This section is the **single authority for the resolution rule.** `SKILL.md` and `team-lead.md` cite this section; they do not restate the fork." — member-protocol.md:157-160

**SKILL.md cite-not-restate instances:**
- Phase 1, step 3 (line 61): "Resolve its root per `references/member-protocol.md` § Committee root resolution — that section is the single authority for the resolution rule; do not restate the sprint/no-sprint fork here." — SKILL.md:61
- Phase 4 § Per-Round Flow step 2 (line 117): "ending in a `## Final Position` (schema per `references/member-protocol.md` § Final Position)" — SKILL.md:117
- Phase 4 § Per-Round Flow step 3 (line 118): "typed routing signal (per `references/member-protocol.md` § Routing signal)" — SKILL.md:118

**team-lead.md cite-not-restate instances:**
- Conversation Loop § Record File (line 90): "Resolution of that root is owned by `references/member-protocol.md` § Committee root resolution — the team-lead **cites** that section and does not restate the sprint-vs-designer-ask fork. There is one authority for the rule, and it is member-protocol." — team-lead.md:90
- Step 4 (line 103): "reading ONLY the `## Final Position` section...per `references/member-protocol.md` § Final Position" — team-lead.md:103
- Step 8 (line 107): "consuming member-authored fields per `references/member-protocol.md` § Final Position (the schema lives there; do not restate the field names here)" — team-lead.md:107
- Behavioral Constraints (line 129): "naming the required schema (member-authored fields per `references/member-protocol.md` § Final Position)" — team-lead.md:129

DECISIVE: cite-not-restate pattern IS established and working for member-protocol. Self-declaration confirmed at member-protocol.md:77 and :157-160. SKILL.md and team-lead.md actively cite not restate. Brief's "prior art" claim CONFIRMED. Pattern is real and extensible.

---

## Task 11 — Load-bearing nuance check (refutation hunt)

**Researcher — codebase**

Question: for each claimed duplicate site, flag every place two "duplicate" sites actually say DIFFERENT things — not safe to collapse blindly

Findings (nuances that survive collapse):

**Per-Round Flow (Task 3):**
- team-lead.md steps 3 and 11 (ledger update + designer response taxonomy) have NO counterpart in SKILL.md — genuinely new content. Must be preserved, not collapsed.
- SKILL.md line 114 already contains pointer "detail in references/team-lead.md" — compression partially done. SKILL.md version could reduce to summary + cite; team-lead.md is already the detail owner.
- round-format § How To Use is an artifact-filling checklist (different abstraction), not a dispatch-sequence restatement. Brief treats it as a third Per-Round Flow site; DISPUTED — it is a different-abstraction document, not a pure restatement.

**Translation Gate (Task 4):**
- round-format.md lines 101-103: applies-vs-doesn't-apply boundary for each artifact type. NOT in SKILL.md § Translation Gate or team-lead.md § Translation Gate. MUST NOT be deleted.
- member-protocol.md lines 67-69: transcript-files exemption from Translation Gate. NOT in SKILL.md or team-lead.md. MUST NOT be deleted.
- team-lead.md line 37: "Do NOT restate rules in packet. Apply silently." — application instruction not in util-design-partner-role. Must survive.
- team-lead.md §PM Litmus Test and §Research Boundary (lines 301-308): already cite-not-restate pattern. NOT restatements.

**Output-surface split (Task 5):**
- round-format.md lines 108-110: disambiguation clause re: sprint 20260521 usage — NOT in team-lead.md. Must survive in a cite or the cite target.

**Standalone (Task 6):**
- SKILL.md line 146: "no degrade-to-no-op / unconditional path" rule — NOT in Phase 1 description or Integration line. Must survive.

**Ephemeral-off-roster (Task 7):**
- team-lead.md steps 4 + 8: "Agent tool with no `team_name`" operational detail — NOT in SKILL.md §Consolidator/§Scribe. Must survive.
- SKILL.md §Consolidator/§Scribe: policy statement (ephemeral, not roster) — appropriate floor; team-lead adds operational detail.
- SKILL.md § Integration line 156: third SKILL.md site — repeats §Consolidator/§Scribe content. Genuinely redundant within SKILL.md.

**Warrant/Authority Guard (Task 8):**
- team-lead.md steps 6+7: "where to write warrants on disk" (alignment-map, verdict) — operational disk-persistence instruction.
- team-lead.md §Authority Guard lines 319-325: "who supplies warrants" policy (member-supplied, team-lead verifies, not originates). DIFFERENT content from steps 6/7.
- team-lead.md §Self-Evaluation lines 342-344: imperative self-check form. Safe to reduce to cite of §Authority Guard but check questions themselves are useful in situ.
- Count-not-a-warrant and strict-premise-scope appear in both §Authority Guard (lines 322-323) and §Behavioral Constraints (lines 121-123) and §Self-Evaluation (lines 343-344). THREE SITES within team-lead.md for count-not-a-warrant. Brief counts 4× for Authority Guard but the actual duplication pattern is more spread.

**Member lenses (Task 9):**
- skill-contract.md lens statements are author-only (no runtime cost). No action needed.
- Agent files carry full lens sections; SKILL.md carries compressed summaries. If SKILL.md § Six Members drops lens sentences, team-lead loses the roster-level summary — but that summary is also in skill-contract.md (author-only) and in each agent file (subagent context). Compressed summary in SKILL.md serves orchestrator orientation; it is short (4 lines total). Risk of dropping: minor orientation loss. Brief's plan to keep roster + drop lens sentences = defensible; the lens is owned by agent files.

---

## Task 12 — Cite-graph map

**Researcher — codebase**

Question: list every existing cross-file citation; plan must not break these

Findings (cite-graph, adjacency list):

**SKILL.md outbound cites:**
- SKILL.md:38 → `references/team-lead.md` (Translation Gate re-check at consolidation)
- SKILL.md:45 → `skills/util-design-partner-role/SKILL.md` (full voice spec, LOAD-BEARING)
- SKILL.md:61 → `references/member-protocol.md` § Committee root resolution
- SKILL.md:70 → `references/team-lead.md` (Round 1 confirmation)
- SKILL.md:88 → `references/member-protocol.md` (member transcripts, round-folder)
- SKILL.md:114 → `references/team-lead.md` (per-round detail)
- SKILL.md:117 → `references/member-protocol.md` § Final Position
- SKILL.md:118 → `references/member-protocol.md` § Routing signal
- SKILL.md:122 → `references/team-lead.md` § Output Surfaces (output-surface split)
- SKILL.md:131 → `references/team-lead.md` § Behavioral Constraints
- SKILL.md:138 → `references/team-lead.md` Closure section
- SKILL.md:150 → `references/skill-contract.md`
- SKILL.md:157 → `util-design-partner-role`, `references/team-lead.md`, `references/member-protocol.md`, `references/committee-analysis-round-format.md`, `references/artifact-template.md`, `references/skill-contract.md` (Integration §Reads)

**team-lead.md outbound cites:**
- team-lead.md:28 → `skills/util-design-partner-role/SKILL.md`
- team-lead.md:54 → `agents/design-committee-*.md` (plugin top-level)
- team-lead.md:55 → `references/member-protocol.md` § Committee root resolution
- team-lead.md:56 → `references/committee-analysis-round-format.md`
- team-lead.md:73 → `references/member-protocol.md` § Committee root resolution
- team-lead.md:90 → `references/member-protocol.md` § Committee root resolution
- team-lead.md:92 → `references/committee-analysis-round-format.md`
- team-lead.md:101 → `SKILL.md` Phase 4 § Per-Round Flow
- team-lead.md:102 → `references/member-protocol.md` § Write-then-send sequencing
- team-lead.md:103 → `references/member-protocol.md` § Final Position
- team-lead.md:107 → `references/member-protocol.md` § Final Position
- team-lead.md:129 → `references/member-protocol.md` § Final Position
- team-lead.md:293 → `util-design-partner-role` (full spec)
- team-lead.md:303 → `util-design-partner-role` § PM Litmus Test
- team-lead.md:307 → `util-design-partner-role` § Research Boundary

**round-format.md outbound cites:**
- round-format.md:27 → `references/member-protocol.md` § Final Position
- round-format.md:75 → `references/member-protocol.md` § Committee root resolution
- round-format.md:153 → `references/member-protocol.md` § Final Position (template)
- round-format.md:224 → `references/artifact-template.md`
- round-format.md:226 → `team-lead.md` § Visible Surface / Information Packet Format

**member-protocol.md outbound cites:**
- No outbound cites to other committee files (is the authority; others cite it)

**agent files outbound cites:**
- conservator.md:10 → `references/member-protocol.md` § Routing signal
- conservator.md:27 → `skills/util-design-partner-role/SKILL.md`
- conservator.md:55 → `skills/util-design-partner-role/SKILL.md`
- conservator.md:68 → `references/member-protocol.md` § Final Position
- conservator.md:75 → `references/member-protocol.md` § Transcript and round-folder + § Routing signal (×2)
- consolidator.md:15 → `references/member-protocol.md` § Final Position

Notes: cite-graph is dense; any heading rename in member-protocol.md, team-lead.md, or util-design-partner-role ripples across multiple files. Most load-bearing: `references/member-protocol.md` § Final Position (cited from 6+ locations) and `references/member-protocol.md` § Committee root resolution (cited from 4+ locations).

---

## Task 13 — Version frontmatter

**Researcher — codebase**

Question: current version fields for all touched files

Findings:
- `skills/design-committee/SKILL.md` — `version: v0020` — SKILL.md:4
- `skills/design-committee/references/team-lead.md` — `version: v0011` — team-lead.md:8
- `skills/design-committee/references/member-protocol.md` — NO version field in frontmatter — member-protocol.md:1-9 (frontmatter has `name` and `description` only)
- `skills/design-committee/references/committee-analysis-round-format.md` — `version: v0001` — round-format.md:11
- `skills/design-committee/references/artifact-template.md` — NO frontmatter (no YAML block) — artifact-template.md:1
- `skills/design-committee/references/skill-contract.md` — NO version field in frontmatter — skill-contract.md:1-7 (frontmatter has `name` and `description` only)
- `skills/util-design-partner-role/SKILL.md` — `version: v0006` — util-design-partner-role/SKILL.md:5

Notes: member-protocol.md, artifact-template.md, and skill-contract.md have no version field. CLAUDE.md version-bump rule applies to SKILL.md files specifically; reference files without a version field may need one added when first bumped.

---

## Summary of decisive findings

1. **Brief byte totals UNDERCOUNTED** — actual orchestrator load is ~77KB (5 files including util), not ~64KB (4 files). Brief's headline number matches the 4-file subtotal; util-design-partner-role adds ~15KB more.
2. **Reading-order confirmed** — team-lead.md:48-57 is authoritative list; agent files are separate windows; skill-contract is author-only; artifact-template not in 6-item reading order (likely path-passed to scribe).
3. **Per-Round Flow** — genuine 2× duplication (SKILL.md + team-lead.md); round-format is a different abstraction (artifact-filling checklist). team-lead.md has 3 genuinely additional steps (ledger, checkpoint-as-blocker, designer-response taxonomy) not in SKILL.md. SKILL.md line 114 already cites team-lead.md for detail.
4. **Translation Gate** — genuine 2× rules-restatement (SKILL.md:36-45 + team-lead.md:291-299) plus a second team-lead site (lines 26-37) that adds "apply silently." round-format and member-protocol carry boundary-clause sites (not rule restatements) — MUST survive.
5. **Output-surface split** — 3× confirmed; round-format carries unique disambiguation clause that must be preserved.
6. **Standalone** — 3× within SKILL.md confirmed; § Standalone Invocability carries "no degrade-to-no-op" rule unique to that site.
7. **Ephemeral-off-roster** — 5 sites (not 4); team-lead steps add "Agent tool / no team_name" detail absent from SKILL.md policy statements.
8. **Warrant/Authority-Guard** — 4× in team-lead.md confirmed; substantive content differs across sites (disk-persistence vs policy vs self-check).
9. **Member lenses** — 3 sites confirmed (SKILL.md, agent files, skill-contract); agent files are authoritative. skill-contract is author-only (no orchestrator cost).
10. **cite-not-restate pattern** — confirmed operational in member-protocol.md; extensible to other concepts. Self-declaration at member-protocol.md:77 and :157-160.
11. **Cite-graph** — dense; member-protocol.md § Final Position and § Committee root resolution most heavily cited. Heading renames in these sections break multiple downstream cites.
12. **Version fields** — SKILL.md v0020, team-lead.md v0011, round-format v0001, util v0006. member-protocol, skill-contract, artifact-template have no version fields.

---

## Final Position

```
position: no design opinion
rationale: findings establish exact file:line evidence for each of the 13 verification
  tasks; confirm most brief claims with corrections where actual counts or content differ;
  identify load-bearing nuances at 7 sites that are NOT safe to collapse blindly; map
  full cite-graph for post-edit verification; surface version-field gaps in 3 reference
  files
blocking_risk: none — research role holds no advocacy
warrant:
  type: evidence
  source: direct reads of all 13 in-scope files —
    skills/design-committee/SKILL.md (160 lines),
    skills/design-committee/references/team-lead.md (348 lines),
    skills/design-committee/references/member-protocol.md (160 lines),
    skills/design-committee/references/committee-analysis-round-format.md (226 lines),
    skills/design-committee/references/artifact-template.md (48 lines),
    skills/design-committee/references/skill-contract.md (52 lines),
    skills/util-design-partner-role/SKILL.md (189 lines),
    agents/design-committee-conservator.md (105 lines),
    agents/design-committee-consolidator.md (64 lines),
    agents/design-committee-innovator.md (35 lines, lens section only),
    agents/design-committee-scribe.md (39 lines),
    docs/chester/working/20260611-01-compact-committee-skill/design/20260611-01-compact-committee-skill-design-00.md (151 lines);
    wc counts verified via bash
```
