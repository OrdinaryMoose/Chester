# Framing Review — Designer Decision Packet

**File:** `framing-review-consolidation-00.md`
**Audience:** Designer
**From:** team-lead
**Source returns:** six verbatim files (`framing-review-{pole}-00.md`)
**Subject:** `framing-00.md` initial Committee review
**Date:** 2026-05-21

---

## 1. What the decision is

The Committee reviewed framing-00.md. All six poles return **conditional yes**. No hard vetoes on the framing as a whole, but four specific changes are being asked of you before Committee dispatch.

- Decide the rules.md word cap question (one veto stands against it; two conditional acceptances).
- Decide whether the Arbiter role is gone or retained.
- Decide what the framing pre-closes vs leaves open for Committee design.
- Decide whether the axiom-assertion mechanism (D2) resolves before schema authoring or after.

Below are the decisions, the analysis behind each, and the team-lead recommendation.

---

## 2. Analysis of the catches

### Catch group A — word cap on rules.md

- One pole vetoes the 200-word cap outright (Pragmatist).
- Two poles accept the cap conditionally if enumeration tables and protocol steps live in schema/ instead of rules.md (Conservator, Researcher).
- Three poles do not flag the cap.
- The risk if cap holds without restructuring: cascade-invalidation protocol, Clerk escalation rule, and coverage-map authority each get silently truncated out of rules.md.
- The risk if cap is removed: rules.md grows into the ceremony sink the cap was designed to prevent.

### Catch group B — Arbiter vs Clerk role ambiguity

- Framing says "Clerk replaces Arbiter" in one place and names "Arbiter (consultant)" in the Pole Roles section.
- Purist flags this as a category boundary violation — two named roles for one job.
- The Arbiter-consultant role was created for this session only because there is engine knowledge to draw on.
- The skill that emerges will not have an engine to consult. The Arbiter has no role in the production skill.

### Catch group C — framing pre-closes design decisions that should stay open

- Innovator vetoes the framing pre-deciding the Clerk's behavioral charter ("batch lint, coverage tracking, no synthesis").
- That charter description should live in rules.md after Committee designs it, not in framing.
- Same pattern as the Arbiter-vs-Clerk ambiguity: framing leaks design decisions outside its scope.
- Two independent pole catches of the same defect.

### Catch group D — axiom-assertion mechanism timing

- Researcher and Innovator both flag that D2 must resolve before schema is written.
- The risk: if D2 resolves to "session-open named statements" after schema is finalized, the anchoring benefit collapses mid-session because axioms drift out of agent context.
- The original failure mode in the inaugural proof run was Concern-local, not session-level.
- The schema must reserve a structurally distinct slot for designer-axiom voice versus pole-proposed content. Same field shapes are not enough if provenance is indistinguishable at read time.

### Catch group E — schema/ length is unbounded

- Three poles flag this (Conservator, Pragmatist, Purist).
- Word-limit exemption is necessary because schema density is the channeling instrument. But unbounded length is a path for design decisions to slip into schema/ without designer review.
- Two candidate gates were proposed: schema field count locked at three (Pragmatist), or vocabulary additions require explicit designer ratification (Purist).

### Catch group F — Clerk scope and Clerk-handles-ambiguity

- Researcher names Clerk scope creep as the failure pattern from the prior Arbiter accumulating narrative synthesis across NCON-1 through NCON-6.
- Pragmatist names the Clerk-on-ambiguous-output problem: reject, escalate to designer, or interpret silently.
- Researcher gives the answer: Clerk flags and designer adjudicates. Clerk never interprets.
- This belongs in rules.md as an explicit Clerk-behavior rule.

### Catch group G — withdrawal propagation as a distinct trigger

- Arbiter alone catches this. No pole sees it because engine knowledge is required.
- Framing names cascade invalidation as one accepted risk. Arbiter says withdrawal triggers the same downstream cascade through a different entry point.
- If framing ships without naming withdrawal as a distinct trigger, the rules.md Clerk section will underspecify one of the two load-bearing re-audit triggers.

### Catch group H — body THEN-clause vocabulary openness

- Purist catches that "IF/THEN" closes the body structurally but leaves the THEN clause semantically open.
- Under time pressure, a syntactically valid THEN can carry implementation vocabulary that violates architectural altitude.
- The schema needs a permitted-clause-type enumeration on THEN, plus a keyword blocklist the Clerk can scan for.

### Catch group I — coverage map construction authority

- Researcher catches this gap. Framing says coverage map produces "by read of the ratified record" but does not say who reads and constructs it.
- Default assignment to "agent prose at render time" is the altitude-correction failure pattern from prior generations.
- This needs explicit assignment in rules.md.

### Catch group J — Arbiter inventory of engine behaviors lost

- The Arbiter produced an enumeration no pole could produce — eight specific engine behaviors that disappear with engine elimination.
- This inventory becomes the input to the Clerk scope design in rules.md.
- This is reference material for Committee, not a framing change.

---

## 3. Team-lead recommendation

Recommended actions for framing-01, in order of priority.

No - **Rules.md word cap — restructure, not remove.** Apply the cap to prose only; exempt enumeration tables and protocol steps. This honors the channeling instrument purpose while preventing silent truncation of the cascade protocol, Clerk escalation rule, and coverage-map authority. Conservator and Researcher both proposed this shape; Pragmatist's veto is addressed because the load-bearing content moves out of the prose surface.
Yes - **Drop Arbiter from production skill role inventory.** The consultant role exists for this session only. Framing should explicitly say the production skill has Clerk as the sole non-pole role, no Arbiter. Removes Purist's category boundary catch.
<Resolve>
**Strip Clerk behavioral charter from framing.** Framing should say what the Clerk replaces (the proof-engine custody) and what scope the Clerk's existence covers (D3 open). It should not pre-specify "batch lint, coverage tracking, no synthesis" as Clerk's charter. That sentence belongs in rules.md after Committee designs it. Addresses Innovator's veto.
- **Resolve D2 before schema is authored.** Framing should add an explicit ordering rule: D2 (axiom-assertion mechanism) adjudicates before schema/ work begins. Add to framing's "What ratification looks like" section.
- **Constrain D2 candidate space to closed-set with named properties.** Three properties any acceptable D2 candidate must have: designer-voice provenance is structurally distinct from pole-proposed content, axioms are per-Concern not session-level, and Clerk lint runs against axiom field shapes (not exempted from lint scope). Addresses Conservator, Researcher, Innovator, Purist convergence.
- **Add schema/ growth gate.** Field count locked at three. Vocabulary additions to any field's closed-set enumeration require designer ratification before Committee uses them. Addresses three-pole convergence (Conservator, Pragmatist, Purist).
- **Add withdrawal as distinct cascade trigger to accepted risks.** One sentence in framing's accepted risks list, parallel to cascade invalidation. Addresses Arbiter-only catch.
- **Add Clerk-on-ambiguous-output rule to framing constraints on rules.md.** Clerk flags and escalates to designer. Clerk never interprets. One sentence binding Committee's rules.md work.
- **Add coverage-map construction authority to framing constraints on rules.md.** Coverage map is constructed by Clerk from the ratified record, not authored as prose by any pole. One sentence binding Committee's rules.md work.
- **Add body THEN-clause enumeration requirement to framing constraints on schema/.** Schema must specify a permitted-clause-type list for the body field's THEN, plus a keyword blocklist for Clerk's altitude scan. Addresses Purist + Innovator (Innovator's contrapositive machine-check is the same surface).
</Resolve>
---

## Notable verbatim quotes

Pole voice the synthesis above loses.

- **Conservator on the rules.md cap (conditional acceptance):** *"At 200 words this is achievable only if the enumerations live in schema/ and rules.md carries forward-references, not inline tables. If the Committee authors rules.md with inline enum tables, it will either violate the cap or truncate the protocol."*
- **Pragmatist on the rules.md cap (veto):** *"The operational discipline document for a role-bounded six-agent protocol cannot carry its load in 200 words. The skill.md limit is defensible — entry/exit/purpose is a short thing. The rules.md limit will either produce a document that loses coverage of all ten lenses, or will produce a document that is so compressed it fails on first tired-Tuesday read."*
- **Innovator on framing pre-closing D3:** *"D3 is supposed to be an open designer decision. The framing partially resolves it before Committee deliberation begins."*
- **Purist on Arbiter-vs-Clerk:** *"Arbiter-as-consultant is a hybrid that dissolves the Clerk/Arbiter distinction the AoA established. Pick one: Arbiter is gone (Clerk replaces fully), or Arbiter is retained with a hard-bounded charter."*
- **Researcher on D2 timing:** *"If D2 resolves to anything weaker than per-Concern pre-assertion, axiom-anchoring degrades to session-level scope. Must resolve before schema is written, not after."*
- **Researcher on axioms as laundry path (paraphrasing Innovator's finding):** *"If designer-voice axioms can contain architectural-altitude violations (axioms naming implementation constructs), Clerk cannot flag them because axioms are designer-asserted and exempt from pole-review. Risk: axioms become a provenance-laundry path — designer-voice label on implementation-altitude content, bypassing lint."* (verbatim from Innovator)
- **Arbiter on the lost-engine-behavior inventory completeness:** *"Withdrawal triggers the same downstream cascade (ungrounding, uncovering, reopening) through a different entry point. Clerk lint spec for D3 must address withdrawal re-audit as explicitly as it addresses revision cascade — they are different triggers, same structural consequence."*

---

## What happens next

Awaiting your adjudication on the ten recommended changes. On adjudication, framing-01 written, Committee receives full dispatch packet (framing-01 + lens criteria + Vision reference + Arbiter engine-behavior inventory). Committee then drafts skill.md / rules.md / schema/ / design-brief-template.md in their respective files.
