# Framing Review — Conservator (verbatim)

**File:** `framing-review-conservator-00.md`
**Pole:** Conservator
**Subject:** `framing-00.md`
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## KEEP

Framing correctly names the five load-bearing Vision principles. The three-artifact exit contract (constraint envelope, resolution criterion, coverage map) is precise and testable. The "if schema fill does not yield all three by read, schema fails" line is the right mechanical gate. Cascade-invalidation regression is named honestly as an accepted cost, not papered over. The pole role charters are correct — Conservator veto authority explicitly stated. Out-of-scope list is well-bounded; prevents re-litigation drift.

## ADD

The framing says "Clerk handles batch lint" but does not specify what vocabulary the Clerk lints against. Conservator requires: rules.md must name the closed-set vocabularies the Clerk enforces, not leave them to schema/. Without that anchor, a Clerk running against an unspecified vocabulary is not external validation — it is theater.

The framing does not state the re-ratification trigger protocol for revision. It names cascade invalidation as a risk to address in rules.md, but gives no structural constraint on what that protocol must include. Conservator requires: the re-ratification trigger must be a named structural rule, not an open design question delegated to rules.md without a shape. Minimum shape: any Proposition revision that changes body or grounding must flag all downstream Propositions citing the same Evidence ID for designer re-ratification before round closes.

The "axiom-assertion mechanism quality" risk defers to three candidates without stating which preservation properties each must satisfy. From the Conservator lens: any axiom-assertion mechanism must guarantee designer-voice provenance is structurally distinct from agent-produced output. This is a structural requirement on the mechanism, not a preference.

## VETO

None. Framing does not dissolve any load-bearing structure. The Q1 ruling acceptance is within bounds — design-language schema satisfies channeling without derivation engine per designer ruling. Framing correctly excludes proof state, Datalog, closure-gate from scope. The 200-word cap on skill.md and rules.md is a channeling instrument, not a structural dissolution — Conservator accepts it with a condition noted below.

## RISKS

**200-word cap on rules.md is tight for vocabulary discipline.** The rules file must specify closed-set enumerations AND the re-ratification trigger protocol AND the Clerk lint scope AND the axiom-assertion provenance requirement. At 200 words this is achievable only if the enumerations live in schema/ and rules.md carries forward-references, not inline tables. If the Committee authors rules.md with inline enum tables, it will either violate the cap or truncate the protocol. Risk: truncated rules.md silently omits the re-ratification trigger, leaving the cascade regression unmitigated.

**Axiom-assertion mechanism design is underconstrained at framing.** The three candidates (Register direct entry, dedicated tool call, session-open named statements) differ in whether designer-voice provenance is structurally enforced or conventionally assumed. "Session-open named statements" has no mechanical provenance check — a pole agent could author a statement that reads like an axiom. The framing does not rule this out. Risk: agent-authored content enters the axiom layer under designer-voice label. This collapses the two-player asymmetric authority at the axiom surface specifically.

**Schema file is word-limit exempt but has no structure constraint.** An exempt file with no structural anchor is an open surface for completeness drift — the schema grows to absorb design decisions that should stay in rules.md or be adjudicated by designer. Risk: schema/ becomes a second rules file without the 200-word discipline, embedding behavioral constraints the designer never ratified.

## READY

Conditional yes. Rules.md must include a named re-ratification trigger protocol shape and a Clerk vocabulary anchor before Committee dispatch. Axiom-assertion mechanism must carry a structural provenance requirement, not just three candidates. If those two conditions are stated as constraints on the committee's design work (not deferred to the committee's discretion), framing is ready to dispatch.
