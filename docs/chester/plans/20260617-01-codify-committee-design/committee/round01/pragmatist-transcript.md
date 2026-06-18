# Pragmatist Transcript — Round 01

**Member:** Pragmatist  
**Question:** Should `design-committee` emit a complete design document via a committee-specific template mirroring the eight FAC fields, reversing D9?

---

## Reading the Real Files

The current `artifact-template.md` has five sections: Summary, Verdict, Rationale, Dissent Record, Deferred. It is unambiguously a decision document, not a design document. The `fac-complete-design-contract.md` admits the extraction risk plainly: silent mis-extraction from a narrative verdict is "the one failure hardening structurally cannot catch — the quote-back is the only guard." A single human gate for a structural gap is a fragile design.

The `design-small-task` brief has six sections: Goal, Prior Art, Scope, Key Decisions, Constraints, Acceptance Criteria. These map cleanly onto the eight FAC fields. A committee-specific template mirroring those eight fields would be a different shape: it must carry the Dissent Record (no equivalent in the small-task brief) and would need to render the Key Decisions field differently (committee decisions emerge from multi-member convergence, not a single designer conversation). So a shared template with `design-small-task` is not realistic — the shapes diverge at the Dissent Record alone.

The scribe inputs are already bounded: `verdict.md`, `consolidator-output.md`, `alignment-map.md` (optional), plus the artifact template. Adding a richer template does not change the scribe's input boundary — it changes what the scribe is asked to author from those same inputs. The context-economy invariant survives.

## Pragmatist Cost/Benefit Analysis

**Ship cost of reversal:**
- New committee-specific template: one new file, roughly equivalent in length to `design-brief-small-template.md`. Modest.
- Scribe agent instructions: may need minor update to clarify that it now authors a design document with FAC-field structure, not a verdict packet. Low-effort edit.
- `fac-complete-design-contract.md` update: D9 becomes a ratified path rather than a fallback. One paragraph change.
- `SKILL.md` Scribe section: already references `references/artifact-template.md` as a path the team-lead provides at dispatch. No wiring change needed — just a new template.

**Runtime cost per invocation:**
- Scribe must now populate eight structured fields instead of five. Marginally more tokens from the scribe. No other member workload changes.
- Spec-write no longer needs to mine narrative for eight fields. The extraction step and the quote-back gate are eliminated. Net token cost is approximately neutral; reliability gain is real.

**Benefit:**
- Eliminates the single-gate failure mode identified in the contract itself. The quote-back was catching extraction errors that should not occur in the first place.
- Downstream `spec-write` consumption becomes deterministic: eight labeled fields, not narrative mining.
- The Dissent Record — the committee's unique structural contribution — is preserved. It has no equivalent in spec-architect output or small-task briefs. Keeping it in the new template is zero additional cost.

**Risk of reversal:**
- Scribe receives bounded inputs (verdict + consolidator + alignment-map) and is asked to populate Goal, Chosen Architecture, Rejected Alternatives, Prior-Art Findings, Constraints, Acceptance-Criteria Seeds, Deferred. The verdict.md carries the chosen direction and rejected lenses. The researcher findings carry prior-art and ground-truth facts. The alignment-map carries the rationale. All eight fields have source material in the current input set — no new inputs required.
- The only genuine risk: if a committee verdict is thin (one-round, tight question, minimal researcher involvement), some FAC fields may be sparse. But sparse fields are better than absent fields — `spec-write` can handle a short Prior Art section; it cannot handle a field that must be mined from unstructured narrative.

**Risk of not reversing:**
- The contract's own self-admission stands permanently as a structural gap. Every committee-to-spec pipeline has a single human gate that hardening cannot catch. The cost of that gate failing is a spec authored against a misread design intent — discovered late, expensive to fix.

## On the shared-template question

The designer's premise (a) says committee-specific, not shared with small-task. This is correct on the evidence. Sharing a template would require either (a) adding Dissent Record to the small-task brief (pollutes a simple artifact with committee machinery) or (b) omitting Dissent Record from the committee artifact (defeats the committee's structural value). Neither is acceptable. The two templates stay separate.

## Pragmatist verdict

Reverse D9. The ship cost is low (one new template file, minor scribe edit, one contract update). The runtime cost is negligible. The benefit — eliminating a self-admitted single-gate failure from the committee-to-spec pipeline — is concrete and structural. The scribe's bounded inputs already contain the material needed to populate all eight FAC fields. This is not over-engineering; it is closing a known gap at minimal cost.

---

## Final Position

```
position: Reverse D9. Ship a committee-specific template mirroring the eight FAC fields.

rationale: The extraction risk is self-admitted in the contract and structurally uncatchable
except by a single human gate. The ship cost is one new template file plus minor scribe and
contract edits. The scribe's existing bounded inputs (verdict.md, consolidator-output.md,
alignment-map.md) already contain source material for all eight FAC fields — no new inputs
are needed. The Dissent Record (the committee's unique structural value) is preserved as a
ninth field. Shared template with design-small-task is not viable: the Dissent Record has no
equivalent there, and adding it would pollute a simple artifact with committee machinery.

blocking_risk: None. The only plausible risk — sparse fields on thin one-round verdicts — is
strictly better than the status quo (fields that must be mined from unstructured narrative).
Sparse but labeled beats absent and implicit every time.

warrant: {
  type: evidence,
  source: "fac-complete-design-contract.md line 22 self-admission; artifact-template.md
  five-section structure vs. eight-field gap; scribe input set (verdict.md +
  consolidator-output.md + alignment-map.md) already contains all FAC field sources"
}
```
