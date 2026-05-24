# Framing Review — Pragmatist (verbatim)

**File:** `framing-review-pragmatist-00.md`
**Pole:** Pragmatist
**Subject:** `framing-00.md`
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

PRAGMATIST INITIAL FRAMING REVIEW — framing-00.md

---

## KEEP

Framing correctly names Clerk as the admin boundary. Explicit "no mechanics in skill.md" rule is load-bearing — prevents rules.md from becoming the new ceremony sink. Three-artifact exit contract stated cleanly: if schema fill doesn't yield all three by read, schema fails. That test is the right test. Word-limit instrument on skill.md and rules.md forces compression; this is the correct operator-ergonomics move.

---

## ADD

90/10 is stated as budget target but framing gives no operationalization. What is the wall-clock budget per round in concrete terms? The AoA's "~2 min Clerk lint + ~3 min batch ratification + ~5 min axiom pre-assertion = ~10 min per round" exists in the AoA but not in framing. Rules.md must carry this or operators cannot measure compliance. Without a concrete ceiling, "90/10" is a slogan.

Operator ergonomics for D3 missing. Framing lists D3 as open but does not give the Committee any operationalization ground to propose from. "LLM agent vs deterministic script" is the right question but the stakes need naming: deterministic script cannot handle malformed pole output gracefully; LLM agent introduces its own context cost and failure mode. Committee needs this framing to propose well.

Cascade invalidation protocol obligation is in accepted risks but framing only says "rules.md must specify the protocol" — no guidance on what the protocol must contain. Rules.md authors need to know: is re-ratification per-Concern or per-Proposition? Is it designer-triggered or Clerk-triggered? Framing should narrow this.

---

## VETO

200-word limit for rules.md. Veto. The operational discipline document for a role-bounded six-agent protocol cannot carry its load in 200 words. The skill.md limit is defensible — entry/exit/purpose is a short thing. The rules.md limit will either produce a document that loses coverage of all ten lenses, or will produce a document that is so compressed it fails on first tired-Tuesday read. The word-limit instrument works where it prevents prose drift. Here it prevents completeness. Recommend: remove limit from rules.md, or raise to 500 words.

---

## RISKS

**Axiom-assertion timing risk.** Framing says "designer pre-asserts known-true axioms per Concern before deliberation opens" but does not specify what happens if designer has no axioms for a Concern and then discovers mid-round that an axiom would have scoped the problem. Late axiom injection mid-round — is that permitted? If yes, rules.md must specify it. If no, framing must say so. Silence here is a gap that will surface under deadline pressure.

**Clerk authority boundary.** Framing says Clerk flags axiom-collision and coverage gaps, but does not say what the Clerk does when a collision is ambiguous — where a Proposition body does not directly contradict an axiom but arguably undermines one. LLM Clerk may hallucinate a violation; script Clerk will miss it. This is not a D3 decision — it is a Clerk charter scoping question that must be answered regardless of implementation form.

**Schema creep under Committee deliberation.** Framing commits to three fields. Committee will produce schema/. If individual poles propose extending the schema during deliberation (e.g., Innovator's D included lens-stance and scope-boundary enumerations), framing needs a gate that prevents the Committee from shipping a four-field schema. The Purist role is supposed to hold this line, but framing gives no mechanical gate. Committee needs an explicit "schema field count is locked at three" instruction in framing, not just inherited from the AoA.

---

## READY

Conditional. Raise or remove rules.md word limit, add concrete 90/10 wall-clock operationalization, add explicit "schema is locked at three fields" gate, clarify cascade invalidation granularity (Concern vs Proposition). On those four changes, framing is ready for Committee dispatch.
