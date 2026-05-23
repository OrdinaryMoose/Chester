# Design Brief: Build Spec for the Four `design-architect-committee` Skill Files

**Status:** Draft
**Date:** 2026-05-22
**Sprint:** `20260521-02-design-architect-committee`
**Parent handoff:** `design/handoff-alternative-f-design-details-00.md`
**Committee source:** single-round dispatch via `chester:design-committee`, 2026-05-22
**Template:** small (`design-small-task/references/design-brief-small-template.md`) — six canonical sections plus a deliverable-coverage section grafted in to demonstrate that the three frozen artifacts (Constraint Envelope, Resolution Criterion, Coverage Map) survive the build.

---

## Goal

Build the four operator-facing files for the `design-architect-committee` skill so that a designer invoking the skill receives the locked Alternative F session machinery in operator-ready form, and so that every session the skill drives produces the three frozen deliverables — **Constraint Envelope, Resolution Criterion, Coverage Map** — for `design-specify` consumption.

The four files are:

- `skill.md` — operator-facing. When to invoke, what it produces, where the session lives in the lifecycle. **Body cap: 200 words (AX-003, no relief).**
- `rules.md` — actor discipline. Who may do what, what is prohibited, how cascades and revisions and withdrawals propagate. **Body cap: 200 words (AX-003, no relief).**
- `schema/` — directory. Field shapes, closed-set enumerations, gate predicates, integrity rules. **Word-limit exempt by AX-003.**
- `design-brief-template.md` — worked example proving all three deliverables emerge by read from a populated session. **Word-limit exempt.**

The architecture being implemented is Alternative F (channeled single-layer schema with designer axiom-anchoring) as ratified at `fac-recommendation-and-aoa-00.md` and detailed across the four locked macro-step specs. This brief carries forward the locked discipline into the build without re-deriving it.

---

## Prior Art

- **`handoff-alternative-f-design-details-00.md`** — the comprehensive handoff compiled from the four macro-step locked specs (deliverables, process, procedures, actors). §1 frames Alternative F; §2 carries the eight cross-cutting axioms; §3–§6 carry the four macro-step lockings; §7 carries R-1..R-6; §8 enumerates implementation work outstanding; §9 frames the Mode A / Mode B distinction; §10 lists file pointers.
- **`deliverables-locked-00.md` / `process-locked-00.md` / `procedures-locked-00.md` / `actors-locked-00.md`** — the per-macro-step locked specifications. Each is referenced from §3–§6 of the handoff. These are the canonical source for field shapes, phase transitions, procedure gates, and role authority. The build refers back to these whenever the schema files need rebuilding from source of truth.
- **`fac-recommendation-and-aoa-00.md`** — the Fitness-for-Acceptance ratification selecting Alternative F over five competing alternatives against ten designer-set lenses.
- **General committee redesign (sister sprint `20260521-design-committee-update`)** — established the Mode A / Mode B distinction, the floor-not-ceiling rule, the three forbidden attach surfaces (agent files, general `design-committee/SKILL.md`, output-format field labels), and the convening-message attach point. The `design-architect-committee` skill is the canonical Mode B example riding on the general primitive.
- **No prior implementation attempt for this skill exists.** The legacy proof-MCP-anchored design session pattern (the five-generation failure sequence in `proof-system-origin-research.md`) is what Alternative F replaces; it is not prior implementation art for this skill.

---

## Scope

### In scope

- Building the four files named in the Goal section: `skill.md`, `rules.md`, `schema/` directory tree, `design-brief-template.md`.
- Specifying the schema split inside `schema/`: which closed-set lives in which file, which file holds which integrity rules.
- Specifying the citation-discipline contract that lets the two capped files honor AX-003 without compressing locked enumerations: prose meta-rule in `rules.md` plus pre-commit / CI lint check (sub-path 1 — Markdown list patterns banned in capped-file bodies).
- Specifying the worked example in `design-brief-template.md` — one Concern, axioms, Propositions, populated Coverage Map — that proves the three deliverables emerge by read.
- Specifying the cap-lint plumbing that R-4 demands (pre-commit hook or CI check) for AX-003 word-count enforcement.

### Out of scope

- The Clerk script itself (handoff §8 outstanding work, separate sub-sprint).
- The team-lead dispatch convention for the four pole subagents inside a `design-architect-committee` session (handoff §8 outstanding work, separate sub-sprint).
- The on-disk session-close hand-off file shape that team-lead produces from the Clerk-certified working record (handoff §8 outstanding work, separate sub-sprint).
- The working-directory layout for an active `design-architect-committee` session (handoff §8 outstanding work, separate sub-sprint).
- Modifying the general `chester:design-committee` skill or its agent files (forbidden attach surface).

### Out-of-scope rationale

The four items above are named in handoff §8 alongside the four files this brief targets. They are deferred to separate sub-sprints to keep this build bounded — the file build alone is one round of plan-build, while the Clerk script and the dispatch convention each warrant their own design conversation. Splitting them out means this brief feeds plan-build directly without intermediate spec arbitration.

---

## Key Decisions

The decisions below are the committee output from the single-round dispatch on 2026-05-22 (team `design-committee-build-spec-skill-files`, four-pole convergent). Each decision carries the load-bearing reasoning and the alternative that was rejected.

1. **Forward-citing layered contract, with `schema/` as the single normative source.** `skill.md` answers *when to invoke / what comes out / how the session ends*; `rules.md` answers *what actors may and may not do, plus cascade/revision/withdrawal rules*; `schema/` holds every closed-set, field shape, gate predicate, and integrity rule; `design-brief-template.md` is the worked instance. The two capped files cite into `schema/` by anchor name rather than restating enumerations.
   - **Rationale.** Four poles converged on this from four distinct lenses — Conservator (discipline preservation), Innovator (cap-as-forcing-function), Pragmatist (R-4 absorption), Purist (drift-visibility at lint time). AX-003 grants no relief; self-contained capped prose files are structurally unreachable.
   - **Rejected alternative.** Self-contained prose files (`skill.md` and `rules.md` inlining enumerations) — no pole defended this option; AX-003's no-relief clause eliminates it before deliberation.

2. **Schema directory split per locked artifact.** `schema/` decomposes into one file per locked spec:
   - `schema/constraint-envelope.md` — Constraint Envelope row shape, enums, integrity rules from `deliverables-locked-00.md` §3.1.
   - `schema/resolution-criterion.md` — Resolution Criterion row shape and `structural_valid` predicate from `deliverables-locked-00.md` §3.2.
   - `schema/coverage-map.md` — Coverage Map row shape and `status` semantics (COVERED / AXIOM-ONLY / GAP) from `deliverables-locked-00.md` §3.3.
   - `schema/phases-and-transitions.md` — five-phase lifecycle and transitions from `process-locked-00.md` §4.1–§4.2.
   - `schema/procedures.md` — the twelve named procedures (Add Concern through Close Session) with mutates / triggers / gates / state effect from `procedures-locked-00.md` §5.1–§5.12.
   - `schema/actors.md` — five-role inventory and procedure-to-actor mapping from `actors-locked-00.md` §6.1–§6.2.
   - `schema/integrity-rules.md` — cross-artifact FK rules and session-close gate predicate from `deliverables-locked-00.md` §3.4 and `process-locked-00.md` §4.8.
   - **Rationale.** Conservator refinement; each locked artifact maps to exactly one schema file with no narrative dilution. Future edits to a single macro-step locking touch a single schema file.
   - **Rejected alternative.** Single combined `schema.md` — collapses the locked-artifact-to-file mapping; complicates future revision of any single macro-step locking.

3. **Citation discipline enforced at two surfaces — prose meta-rule plus lint.** Both surfaces are required.
   - **Prose half.** `rules.md` carries the citation rule in one sentence: closed-set content lives in `schema/`, capped files cite by anchor, never restate.
   - **Lint half (sub-path 1).** Pre-commit / CI hook fails if any Markdown list item (`^- ` or `^[0-9]+\. `) appears in the body of `skill.md` or `rules.md`. Headings remain legal. Inline prose enumeration not caught mechanically — prose meta-rule covers that blind spot.
   - **Rationale.** R-4's lint enforces the word cap but cannot directly enforce that future editors honor citation tokens rather than re-inline enumerations under deadline pressure. Belt-and-suspenders is cheap because both surfaces already exist in the build. Sub-path 1 chosen over sub-path 2 (citation allowlist) because grep-on-list-patterns is mechanically trivial (5 lines of shell) versus list-item-AST-parsing (30 lines); the lint-becomes-rule failure mode (Pragmatist warning) bites harder on sub-path 2.
   - **Rejected alternatives.**
     - Prose-only meta-rule, no lint — fails silently when editors scroll past the rule under deadline pressure.
     - Lint-only, no prose — editors learn the lint's exact predicate and dance around it; intent encoded only in lint logic rather than read-time prose.
     - Citation allowlist (sub-path 2) — predicate ambiguity ("does qualifier prose disqualify?") re-opens the lint-becomes-rule failure mode.

4. **Forward-reference applies to both capped files, not just `rules.md`.** Handoff §8 source mapping wrote *"cap by forward-referencing schema/ for enumerations"* for `rules.md`; this decision extends that norm to `skill.md` as well. Pragmatist refinement.
   - **Rationale.** Future enum additions could land in either capped file. Asymmetric forward-reference would let `skill.md` quietly accumulate inline enums while `rules.md` stays disciplined.
   - **Rejected alternative.** Asymmetric (rules.md cites, skill.md inlines) — accepted in §8 source mapping but reversed here by committee.

5. **Cross-reference friction is feature, not cost.** Operators cannot answer a concrete enum question from either capped file alone — they cross-reference into `schema/`. This is the mechanism that makes drift visible at lint time rather than at next-reader confusion time. Purist framing.
   - **Rationale.** Inline lists in capped files would be structurally illegal under the lint, not merely over-budget. Failure mode shifts from invisible drift to mechanical refusal.

---

## Constraints

- **AX-003 — 200-word cap (no relief)** on `skill.md` and `rules.md` body content, frontmatter excluded. `schema/` files and `design-brief-template.md` are exempt.
- **AX-008 — Voice asymmetry.** Inter-agent deliberation prompts (the convening-message payload for the four pole subagents inside a `design-architect-committee` session) use caveman ultra. `skill.md`, `rules.md`, `schema/`, and `design-brief-template.md` are designer-facing surfaces and use normal terse markdown. Caveman ultra does not propagate to designer-visible surfaces.
- **Floor-not-ceiling rule** (general committee skill SKILL.md, "Contract Floor"). The four skill files MAY add steps, fields, gates, roles via convening message at run time but MAY NOT weaken or substitute anything the general `design-committee/SKILL.md` names — including the Translation Gate.
- **Three forbidden attach surfaces.** Sprint-specific overlay never attaches to (1) the general agent files at `skills/design-committee/agents/*.md`, (2) the general `skills/design-committee/SKILL.md`, or (3) output-format field labels. All sprint-specific content rides exclusively in the convening message at run time.
- **R-4 lint discipline** — the word-cap lint must run as a pre-commit hook or a CI check. Failure blocks the commit / blocks the merge. This is the mechanical backstop on AX-003 over time.
- **R-5 Clerk script test surface** — out of scope for this brief, but the schema files this build produces are the contract the Clerk script tests against. Schema files must be precise enough for golden-file tests in the eventual Clerk script sub-sprint to consume them directly.
- **R-6 team-lead session-close packaging discipline** — out of scope for this brief, but the on-disk handoff document the team-lead produces conforms to the §3 + §4 + §5 + §6 + §7 shape from the handoff. Schema files are the source the team-lead's mechanical extraction reads from.

---

## Three-Deliverable Coverage

This section verifies that the four-file build approach guarantees the three frozen deliverables of the `design-architect-committee` skill emerge correctly. Each deliverable is covered by one schema file plus one section of the worked template.

### Constraint Envelope (CE)

- **Schema location.** `schema/constraint-envelope.md` — defines the five row fields (`concern_id` / `entry_id` / `source` / `body` / `provenance` / `status`), the closed-set enums (`source ∈ {AXIOM, PROPOSITION}`, `provenance ∈ {DESIGNER, AGENT}`, `status ∈ {RATIFIED, REVISED-PENDING}`), and the prefix conventions (`CE-NNN`, `AX-NNN`, `PR-NNN`). Sourced from `deliverables-locked-00.md` §3.1.
- **Integrity rules location.** `schema/integrity-rules.md` covers the FK rules (`concern_id` uniqueness, `entry_id` source-prefix match, axiom-collision structural-negation match).
- **Template demonstration.** `design-brief-template.md` populates a worked example with one Concern (`CE-001`), one axiom row (`AX-001` with `provenance=DESIGNER, status=RATIFIED`), and one Proposition row (`PR-001` with `provenance=AGENT, status=RATIFIED`). Reader can confirm by inspection that the populated rows match the schema shape.
- **Build verifier.** After the four files are written, an operator should be able to read `schema/constraint-envelope.md` plus the template's Constraint Envelope section and reproduce the row shape without reading the locked spec.

### Resolution Criterion (RC)

- **Schema location.** `schema/resolution-criterion.md` — defines the four row fields (`concern_id` / `entry_id` / `collapse_test` / `structural_valid`), the AXIOM-row exclusion rule, the IF NOT/THEN contrapositive form for `collapse_test`, and the `structural_valid BOOLEAN` predicate. Sourced from `deliverables-locked-00.md` §3.2.
- **Integrity rules location.** `schema/integrity-rules.md` covers: every PROPOSITION row in Constraint Envelope has exactly one matching Resolution Criterion row; AXIOM rows have none; `structural_valid = TRUE` is required before designer ratification is accepted.
- **Template demonstration.** `design-brief-template.md` populates the Resolution Criterion section with one row matching `PR-001` from the Constraint Envelope above, with a worked IF NOT / THEN contrapositive and `structural_valid = TRUE`.
- **Build verifier.** Reader confirms the falsifiability battery emerges — every populated Proposition row has its collapse test visible and Clerk-lintable.

### Coverage Map (CM)

- **Schema location.** `schema/coverage-map.md` — defines the five row fields (`concern_id` / `axiom_ids` / `proposition_ids` / `evidence_ids` / `status`), the closed-set status enum (`status ∈ {COVERED, AXIOM-ONLY, GAP}`), and the status semantics (COVERED requires ≥1 ratified Proposition; AXIOM-ONLY allows close with flag; GAP blocks close). Sourced from `deliverables-locked-00.md` §3.3.
- **Integrity rules location.** `schema/integrity-rules.md` covers: every Concern appears in exactly one Coverage Map row; `axiom_ids` and `proposition_ids` reference real entries in the Constraint Envelope; Coverage Map is recomputed by the Clerk at every round close.
- **Template demonstration.** `design-brief-template.md` populates the Coverage Map section with one row for `CE-001` containing `axiom_ids=[AX-001]`, `proposition_ids=[PR-001]`, `evidence_ids=[…]`, `status=COVERED`. Reader confirms COVERED status follows from the presence of a ratified Proposition.
- **Build verifier.** Reader confirms the rollup semantics — one row per Concern, status populated, no aggregation work needed at the consumer surface.

---

## Acceptance Criteria

A `design-specify` agent (or a `plan-build` agent if this brief feeds plan-build directly per small-template convention) consuming this brief alone must be able to verify each criterion below without reading the design conversation or the committee transcript.

- **AC-1.** `skill.md` body content (frontmatter excluded) is at most 200 words when measured.
- **AC-2.** `rules.md` body content (frontmatter excluded) is at most 200 words when measured.
- **AC-3.** `skill.md` body contains no Markdown list items (`^- ` or `^[0-9]+\. ` patterns are absent). Section headings are permitted. (Lint sub-path 1.)
- **AC-4.** `rules.md` body contains no Markdown list items. Section headings are permitted. (Lint sub-path 1.)
- **AC-5.** `rules.md` carries the citation-discipline meta-rule sentence — closed-set content lives in `schema/`; capped files cite by anchor, never restate.
- **AC-6.** `schema/` directory contains exactly the seven files named in Key Decision 2: `constraint-envelope.md`, `resolution-criterion.md`, `coverage-map.md`, `phases-and-transitions.md`, `procedures.md`, `actors.md`, `integrity-rules.md`.
- **AC-7.** `schema/constraint-envelope.md` carries the five-field row shape with closed-set enums for `source`, `provenance`, `status` and the prefix conventions for `CE-NNN`, `AX-NNN`, `PR-NNN`.
- **AC-8.** `schema/resolution-criterion.md` carries the four-field row shape, the AXIOM-row exclusion, the IF NOT / THEN contrapositive form for `collapse_test`, and the `structural_valid` BOOLEAN.
- **AC-9.** `schema/coverage-map.md` carries the five-field row shape with the closed-set status enum and the status semantics.
- **AC-10.** `schema/phases-and-transitions.md` carries the five named phases (OPEN, ANCHORED, DELIBERATING, RATIFYING, CLOSED) and the transition table from `process-locked-00.md` §4.1–§4.2.
- **AC-11.** `schema/procedures.md` carries the twelve named procedures with mutates / triggers / gates / state effect for each.
- **AC-12.** `schema/actors.md` carries the five-role inventory and the procedure-to-actor mapping.
- **AC-13.** `schema/integrity-rules.md` carries the cross-artifact FK rules and the three-condition session-close gate predicate.
- **AC-14.** `design-brief-template.md` contains a populated worked example exercising one Concern, at least one axiom, at least one Proposition, and a populated Coverage Map row for that Concern.
- **AC-15.** The worked example in `design-brief-template.md` exhibits all three frozen deliverables (Constraint Envelope rows, Resolution Criterion rows, Coverage Map row) by direct inspection — no synthesis required.
- **AC-16.** A pre-commit hook or CI check is in place that fails the build if AC-1, AC-2, AC-3, or AC-4 is violated. (Lint plumbing.)
- **AC-17.** No file in `skills/design-committee/` (the general primitive) and no file in `skills/design-committee/agents/` is modified by this build. (Three forbidden attach surfaces.)
- **AC-18.** The convening-message payload patterns for `design-architect-committee` (caveman ultra inter-agent communication per AX-008) are documented either in `rules.md` body or referenced through a `schema/` file rather than baked into agent files.

---

## Change Log

- **00 (2026-05-22):** Initial draft. Captures committee single-round adjudication on the four-file build structure, the schema split, the citation-discipline two-surface enforcement (Option c + sub-path 1), and the deliverable-coverage verification for Constraint Envelope, Resolution Criterion, and Coverage Map.
