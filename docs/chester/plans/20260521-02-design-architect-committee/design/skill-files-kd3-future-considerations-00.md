# KD-3 Future Considerations — Archived Evidence from Sprint `20260521-02-design-architect-committee`

**Status:** Archive (named queue for future KD-3 re-deliberation if production use reveals real drift problems)
**Date:** 2026-05-23
**Sprint:** `20260521-02-design-architect-committee`
**Decision context:** Designer adjudicated Decision 4 as KEEP NARROW per the committee's own pre-stated flip rule from R4 finals (all four poles named INFEASIBLE → KEEP NARROW; engineer R1 feasibility check triggered #3 hard, #4 fired, #2 partial). Brief KD-3 (sub-path 1 list-pattern ban only) stands.

This document preserves the empirical work + committee reasoning that surfaced during the R3-R4 cycle. It is **not a recommendation to amend KD-3**. It is named, dated evidence that a future committee can pick up if production use of the `design-architect-committee` skill reveals real schema-rename drift problems and the question is re-opened.

---

## Why this archive exists

During this sprint, the committee re-deliberated KD-3 (Round 4) on the question of whether to expand the lint envelope to include broken-link checking (BL2). Four poles voted CONDITIONAL EXPAND with R1 (close reference-style bypass) as gating. Engineer was dispatched for R1 feasibility check; verdict was INFEASIBLE because:

- **Four additional bypass classes** found beyond reference-style (autolinks, HTML `<a href>`, shortcut/collapsed references, orphan link definitions). Each silently disables BL2.
- **Six FP-bearing markdown constructs** found, not the four the committee enumerated (added GFM tables + GFM footnote bodies on first probe).
- **R1 implementation lands at ~123 substantive lines** at the committee's R6 re-adjudication trigger (~120). Closing the new bypass classes would push to ~170-200 lines.

Per the committee's pre-stated rule, INFEASIBLE → KEEP NARROW. Designer ratified.

The work below is preserved because (a) it might be load-bearing evidence for a future KD-3 re-deliberation if real-world drift problems emerge in production use, and (b) the discipline lessons it surfaced are portable Chester pipeline contributions worth carrying forward.

---

## Engineer R3 catch matrix (verbatim from `engineer@design-committee-spec-vs-design-review` 2026-05-23T10:48)

Three regimes × nine drift classes. Regimes: BL1 (brief sub-path 1 baseline = word-cap + list-item ban); BL2 (BL1 + form-agnostic broken-link check); BL3 (BL1 + token-presence + token-collision).

| Drift class | BL1 | BL2 | BL3 |
|---|---|---|---|
| D1 inline list enumeration | CAUGHT | CAUGHT | CAUGHT |
| D2 word-cap exceedance | CAUGHT | CAUGHT | CAUGHT |
| D3 schema heading rename, cite stale | MISSED | CAUGHT | MISSED |
| D4 schema file rename, cite stale | MISSED | CAUGHT | MISSED |
| D5 inline prose enumeration | MISSED | MISSED | MISSED |
| D6 token rename, cite stale | N/A | N/A | CAUGHT |
| D7 duplicate token across schemas | N/A | N/A | CAUGHT |
| D8 `[NOTE]` / `[TODO]` annotation | N/A | N/A | NOT FALSE-POSITIVE |
| D9 Markdown link with all-caps anchor text | N/A | N/A | NOT FALSE-POSITIVE |

D5 is the brief's named blind spot for all three regimes; KD-3 prose meta-rule handles it by design.

Implementation line-counts: BL1 ~20 lines; BL2 ~75 (or ~25-30 with tighter awk-state); BL3 ~70.

---

## Engineer R4 probe-fp findings (verbatim from same engineer, 2026-05-23T11:48 batch)

BL2 false-positive surface is **four** Markdown constructs:

- Inline code spans (single-backtick).
- Fenced code blocks (triple-backtick AND indented-4-space, two forms).
- Block quotes.
- HTML comments.

BL2 has **zero reference-style-link awareness.** Reference-style citations `[text][ref]` + `[ref]: schema/foo.md#heading` silently bypass BL2 entirely.

Engineer risk note (verbatim): *"[reference-style bypass] is exactly the shape of failure KD-3 originally worried about. An editor who hits a BL2 false positive in their inline-style citation can either (i) fight the false positive or (ii) switch to reference-style and silently bypass BL2 entirely. The second is friction-free and undetectable."*

---

## Engineer R4 R1 feasibility verdict (verbatim from engineer R4 closure, 2026-05-23T12:09)

**Verdict: INFEASIBLE.** Two of four committee-named flip-triggers fired empirically; one partially fired; one did not.

- **Trigger #4 (line-count exceeds ~120) — FIRED.** R1-enhanced BL2 lands at 123 substantive lines.
- **Trigger #3 (second bypass class beyond reference-style) — FIRED HARD.** Four additional bypass classes:
  - Autolinks `<schema/foo.md>` — not flagged by R1-enhanced BL2.
  - HTML anchor tags `<a href="schema/...">link</a>` — not flagged.
  - Shortcut/collapsed references `[shortcut]` with `[shortcut]: schema/...` definition — not flagged.
  - Orphan link definitions `[orphan]: schema/...` with no use site — not flagged.
- **Trigger #2 (carve-out list empirically unbounded) — PARTIALLY FIRED.** Two additional FP-bearing constructs found beyond committee's four: GFM tables, GFM footnote bodies.
- **Trigger #1 (Markdown AST parser required) — DID NOT FIRE.** Pure bash + awk + grep works.

Reproducibility: artifacts in `/home/mike/Documents/CodeProjects/Chester/.worktrees/20260521-02-design-architect-committee/tests/fixtures/engineer-drift-sim/`. Implementation script at `regimes/bl2-r1.sh`.

Engineer documented setext-heading slug discovery as an additional coverage gap (BL2 only resolves ATX headings); bash version dependence (associative arrays require bash 4+); GFM slug correctness not verified against canonical implementation.

---

## Committee reasoning preserved as named arguments

### Innovator — Reading (a) defect-specific argument for KD-3 amendment

KD-3 rejected sub-path 2 on the specific grounds of *predicate ambiguity* (vocabulary-conformance lints where editors learn the predicate and dance around it). Broken-link checking's predicate is "does this URL resolve?" — a URL-resolution typo-check question without qualifier-prose ambiguity. The broken-link mechanism therefore falls outside KD-3's rejection envelope as written. KD-3 admits broken-link checking implicitly.

**Status after R4:** empirically conditionalized. Engineer R4 probe-fp showed BL2's actual predicate is line-oriented regex over text (internally-defined), not Markdown-renderer URL resolution (externally-defined). Reading (a)'s "externally-defined predicate" claim does not survive contact with the implementation. The argument survives in principle but requires R1 closure of the reference-style bypass plus closure of the four additional bypass classes engineer surfaced.

### Purist — Reading (b) committee-deliberated-scope argument

The original KD-3 committee deliberated two named sub-paths (list-pattern ban; citation allowlist) and chose sub-path 1 with reasoning. Committee authority is over what the committee deliberated. Broken-link checking is a different mechanism the committee did not deliberate; absent re-deliberation, it sits outside KD-3's envelope by procedural default.

**Status after R4:** ratified by the round itself. The R4 re-deliberation was exactly the procedural venue Reading (b) named. The committee then voted; engineer feasibility check triggered the pre-stated flip rule; outcome is KEEP NARROW. Reading (b)'s discipline produced the right answer.

### Pragmatist — cost-vs-benefit calibration

R2 estimate: BL2 ~15 lines (predicted). R3 empirical: ~75 lines (5x miss). R4 empirical with R1 closure: ~123 lines + bypasses still open. Maintenance shape predicted "ongoing liability" → corrected by engineer to "bounded-tail modulo finite-tail markdown-construct exclusions." Predicate character predicted "externally-defined by Markdown rendering" → empirically refuted by probe-fp.

**Status after R4:** three consecutive cost-side framings required engineer-grounded correction. Discipline lesson: Pragmatist-lens claims about lint-mechanism behavior at any level of detail should be marked `Assumption:` until engineer empirics confirm.

### Conservator — three-class amendment framework

Class 1 — fact-correction: brief silent or wrong vs canonical source; routine erratum. Class 2 — bounded-discretion: brief leaves choice open within named envelope; spec exercises judgment, no amendment. Class 3 — decision-revision: brief explicitly weighed alternatives with named reasoning; requires re-running committee with new evidence, not unilateral signature.

**Status after R4:** ratified as portable Chester pipeline contribution. Encoding into design-specify SKILL.md prevents spec-v02-class drift on future sprints.

---

## Standing-process framework (portable Chester contributions from this round)

Four elements that should be preserved beyond this sprint and considered for encoding into Chester's design-specify SKILL.md or design-committee SKILL.md:

1. **Three-class amendment framework** (Purist R2 + Conservator R3 extension). Fact-correction / bounded-discretion / decision-revision. Distinguishes routine spec-stage absorption from committee-altitude re-deliberation.
2. **Reading 1 of committee re-adjudication** (Purist R3 in response to Conservator). Re-adjudication examines (i) original conclusion, (ii) original named reasoning, (iii) whether named reasoning applies to the new mechanism. Not "rejection text retains permanent authority requiring affirmative overturn of inferred broader worry."
3. **Venue-and-evidence test** (Conservator R4 framework-integrity self-check). A locally-reasonable extension argument is principled only when made (i) in the correct procedural venue (committee re-deliberation, not spec-stage absorption) and (ii) with new evidence the original committee did not have.
4. **Late-evidence-revision discipline** (Conservator R4 Step-4 revision). Committee members must revise on evidence basis that arrives between Step-4 submission and round close, not stand on prior submission for procedural neatness.

Additional discipline lesson from this round:

5. **Empirical-engineer-altitude rule.** Engineer dispatch should fire at spec/implementation altitude, not as input to design re-deliberation. Treating empirical lint-implementation findings as design-level evidence drove a multi-round spiral that the brief had already authoritatively answered. Engineer's R3 catch matrix was correctly load-bearing for plan-build implementation choices; using it as KD-3 amendment evidence was the altitude error that started the spiral.

---

## Conditions under which a future KD-3 re-deliberation might be warranted

Listed here for the record. None of these conditions are met today; this is what would constitute genuine new evidence.

- Production use of the `design-architect-committee` skill produces empirical schema-rename drift problems that the brief's prose meta-rule (KD-3 first surface) demonstrably fails to catch in real authoring workflows.
- A future engineer probe finds a richer-than-list-pattern lint mechanism whose predicate is genuinely externally-defined by stable Markdown semantics (not regex over text) and whose bypass class is genuinely closed (not four additional classes inherited from GFM's link-form variety).
- A future Chester sprint authoring a similar Mode B skill independently rediscovers the schema-rename drift class and proposes a different mechanical mitigation worth weighing against this archive.

If none of these arises, this archive can remain dormant. The brief KD-3 sub-path 1 lint plus prose meta-rule is the design's answer; production use will reveal whether that answer is sufficient.

---

## Change Log

- **00 (2026-05-23):** Initial archive. Captures engineer R3 catch matrix + R4 probe-fp findings + R4 R1 feasibility verdict + Innovator reading (a) + Purist reading (b) + three-class amendment framework + standing-process framework four elements + empirical-engineer-altitude rule + conditions warranting future re-deliberation. Designer ratified KEEP NARROW per committee's pre-stated R4 flip rule.
