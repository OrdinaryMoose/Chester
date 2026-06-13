# Innovator Transcript — Round 02

**Question:** Design how to expand the committee's responsibility so that, when provided a design, it also writes and hardens specification documents.

**Round 02 readdress:** The designer has supplied an in-scope premise: when committee output feeds design-specify, the architecture work is already settled. design-specify's front half re-derives it anyway. That re-derivation is the waste. Does this move my Round 01 position? Answer: yes, fundamentally.

---

## Why Round 01's Option H is the wrong frame for the real problem

Option H (committee as adversarial pass) was solving "make Pass 2 independent." That is still a real gain, but it is a hardening-quality argument — it does not cut any tokens from the front half. The designer's premise makes the front-half waste the primary problem. Option H adds a committee convene on the back of design-specify; it does not remove the architecture-selection work on the front. The net result would be: same redundant front half, plus a new committee convene on the back. That makes the total cost higher, not lower.

The designer's premise reframes the question from "how do we harden better" to "how do we stop re-deriving what is already settled."

---

## The structural win: architecture-settled spec-precursor

When the committee has run, the following is already established:
- Architecture choice (committee verdict named it, alignment-map recorded it)
- Competing-tension resolution (four lenses already deliberated the axes)
- Prior-art awareness (researcher ran as part of committee)
- Key decisions enumerated (verdict.md + alignment-map.md)

design-specify's front half produces exactly these things: Architect A, Architect B, Hybrid Recommendation, prior-art summary, architecture selection. If the committee already produced them, design-specify is re-running a step whose output is already on disk.

The structural fix is not a new branch flag inside design-specify. The structural fix is: **the committee emits an architecture-settled spec-precursor** alongside its verdict. That precursor carries the chosen architecture, the key decisions, and the tension resolutions in spec-ready form — ready for design-specify to read and proceed directly to "Write spec document" (step 4), skipping steps 3's architect dispatch entirely.

---

## What the spec-precursor looks like

The committee's scribe, at the end of a committee run that was convened with a design question, produces two artifacts:

1. **Decision-packet** (current behavior) — the designer-facing summary of the verdict.
2. **Spec-precursor** (new) — a structured handoff document in the shape of "architecture context" that design-specify's "Write spec document" step expects as input.

Spec-precursor fields (mapping directly to what design-specify's front half would have produced):
- `architecture_choice` — the committee's ratified architecture name and one-paragraph rationale (from verdict.md)
- `axes_resolved` — the two or three sharpest tensions the committee deliberated, and how they were resolved (from alignment-map.md)
- `prior_art_context` — what the researcher surfaced that affected the design (from researcher-findings.md)
- `key_decisions` — the enumerated decisions from the verdict (already present in verdict.md; the precursor formats them as spec-input)
- `open_threads` — anything explicitly deferred (Non-Goals seed for the spec)

This is not a new artifact type in the creative sense — all of this data already lives in the committee's round artifacts. The spec-precursor is a **structured extraction and reformatting** of existing committee output into the shape design-specify needs. The scribe already reads the verdict, alignment-map, and consolidator-output to author the decision-packet; it reads the same sources to also produce the spec-precursor.

---

## How design-specify consumes the precursor

design-specify gains a narrow entry condition fork:

- **No precursor present** (current behavior): run the full front half (competing architects, prior-art, architecture selection). This path is unchanged.
- **Precursor present** (committee-fed path): skip step 3 entirely. Read the precursor. Proceed directly to step 4 (Write spec document) using the precursor's architecture_choice as the chosen architecture.

The rest of the chain — fidelity review, adversarial pass, ground-truth, user gate — runs identically. The precursor does not change the hardening chain at all. It only eliminates the redundant derivation work at the front.

---

## Where Option H fits after this reframe

Option H (committee as adversarial pass) is still valid as a second-order gain — but it is now separable from the token-waste problem. The precursor addresses waste. Option H addresses hardening quality. They are complementary, not competing. The designer should evaluate them on separate merit:

- **Precursor:** high structural gain, low execution risk (the scribe already reads all the same inputs; the new output is a reformatting, not new reasoning). Directly addresses the designer's stated problem.
- **Option H (adversarial committee):** additional hardening depth, higher per-spec cost, needs a new scribe template. Valid second step, not the primary fix.

---

## CF1 is still intact

CF1 (committee does not author the spec) holds. The spec-precursor is not a spec. It is architecture context, reformatted as spec-input. design-specify still writes the spec body, still runs all three hardening passes. The committee's output lands at the spec-authorship entry condition, not past it.

---

## Blocking risks

**B1: Scribe output bifurcation.** The scribe currently has one output: the decision-packet. Adding a second structured output (spec-precursor) requires either (a) extending the scribe's dispatch prompt and artifact-template.md, or (b) a second scribe dispatch. Option (a) is simpler — the scribe already reads verdict + alignment-map; it produces both outputs in one pass.

**B2: Precursor-aware entry condition in design-specify.** The fork requires design-specify to detect "was this committee-fed?" The simplest discriminator: does a spec-precursor file exist at the expected path under committee/? If yes, skip step 3. No new protocol handshake needed.

**B3: Committee is not always architecture-focused.** Some committee convenes are charter calls, meta-architecture questions, or scope decisions — not architecture selections. A spec-precursor emitted from a non-architecture committee run could be malformed or empty. The scribe should only produce a spec-precursor when the committee question was architecture/design-decision in nature. The team-lead should declare this in the convening message; the scribe checks before emitting.

---

## Final Position

**Position:** The committee should emit an architecture-settled spec-precursor alongside its decision-packet verdict. The precursor is a structured extraction of existing committee artifacts (verdict, alignment-map, researcher-findings) reformatted as design-specify input. design-specify gains a narrow entry-condition fork: when a precursor is present, skip the front-half architecture-derivation (step 3); proceed directly to spec authorship. The hardening chain (passes 1–3) runs identically. This eliminates the token waste the designer identified without restructuring the spec-writing or hardening sequence.

**Rationale:** The designer's in-scope premise establishes that committee output already settles architecture before design-specify runs. The structural win is removing the re-derivation, not adding more hardening. The precursor routes already-resolved architecture context into design-specify's authorship step. Scribe already reads all the source data; producing a second structured output is a reformatting, not new work.

**Blocking risk:** Scribe output bifurcation (new template section needed). Committee runs that are not architecture-focused should not emit a precursor — the team-lead must declare architecture-focus in the convening message so the scribe knows whether to produce the precursor.

**Warrant:** `{type: in-scope designer-premise, source: designer's round 02 readdress — "committee design work is comprehensive... design-specify's FRONT HALF burns significant tokens RE-DERIVING already-solved architecture" — treated as fact per team-lead dispatch.}`
