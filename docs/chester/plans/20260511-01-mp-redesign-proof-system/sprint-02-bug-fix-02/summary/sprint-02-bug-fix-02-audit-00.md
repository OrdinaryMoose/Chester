# Reasoning Audit: Close PERMISSION.relieves and RISK.basis silent-drop gaps; introduce INVALID_REFERENCE existence validation

**Date:** 2026-05-17
**Session:** `00`
**Plan:** `sprint-02-bug-fix-02-plan-00.md`

## Executive Summary

The session closed two cascade-vs-implementation silent-drop bugs (PERMISSION.relieves H-2 and RISK.basis H-3) surfaced by the 2026-05-17 cascade-spec probe, and introduced `INVALID_REFERENCE` as a new domain-layer error code for existence-check failures. The most consequential decision was choosing the Hybrid Recommendation — a declarative schema directive (`referenceFields`) extending the `verifyArgsShape` framework — over Architect B's imperative orchestration approach, anchored by Explorer-surfaced precedent that sprint-02-proof-layer's Key Decision 1 forbade imperative checks in `mutations.js`. Implementation stayed on-plan: all 8 plan-text mitigations from the SIGNIFICANT threat report were folded inline without re-dispatching reviewers (architecture unchanged), 305 tests passed at execute-verify-complete, and 10 follow-up items were deferred rather than expanded into sprint scope.

## Plan Development

The designer skipped `design-small-task` and authored an option-b lightweight six-section brief directly, because cascade §3.3 / §3.5 fully determined the design space and the bug-fix-01 closure pattern was an established precedent. `design-specify` then ran a competing-architecture review on the single open architectural axis — declarative schema directive vs imperative orchestration check for existence validation — resolved by Hybrid Recommendation favoring Architect A's declarative spine with Architect B's risk-discovery items folded in. Three review passes hardened the spec: fidelity (clean with three advisory recommendations folded), adversarial (1 HIGH + 1 MEDIUM finding both fixed, advancing spec-00 → spec-01), ground-truth (clean — all 13 spec claims confirmed at file:line). `plan-build` produced a 6-task plan; plan-reviewer caught one buildability issue (Task 4 nonexistent bridge helper); plan-attack + plan-smell hardening fired SIGNIFICANT with 8 plan-text findings + 1 convergent finding (F2/S1 error-throw shape). User chose Option (a) to proceed with directed mitigations — all 8 applied inline, no re-dispatch needed because architecture was unchanged.

## Decision Log

### Choosing the Hybrid Recommendation (declarative directive) over imperative orchestration

**Context:**
The single open architectural axis at design-specify time was the mechanism for existence-check validation of `relieves` and `basis` references. Architect A proposed a declarative schema directive extending `verifyArgsShape`; Architect B proposed imperative orchestration logic inside `mutations.js` ADD/REVISE call sites.

**Information used:**
- sprint-02-proof-layer summary, Key Decision 1: "no imperative orchestration checks in mutations.js — validators are data-driven"
- Existing `verifyArgsShape` framework precedent established by sprint-02-bug-fix-01 (`nonEmptyStringFields`, `closedEnumFields` directives)
- Explorer subagent surfaced both as load-bearing prior art before architects committed

**Alternatives considered:**
- `Architect B imperative approach` — rejected because it violated the load-bearing constraint from sprint-02-proof-layer; would have placed bespoke validation logic in `mutations.js` and broken the data-driven validator pattern
- `Pure Architect A declarative` — adopted as the spine but folded in Architect B's risk-discovery items (pre-existing `PROJECTION_ARITIES.risk: 2` arity mismatch + `boot-validators` allow-list assumption check)

**Decision:** Adopt declarative `referenceFields` directive on descriptors, validated by `verifyArgsShape` with an optional third `readPort` parameter; thread the port through the single `mutations.js:231` ADD/REVISE call site.

**Rationale:** The Explorer's surfacing of sprint-02-proof-layer Key Decision 1 made imperative orchestration architecturally forbidden, not just unwanted. The declarative path also extended an already-paying-rent framework (one new directive, no new mechanism), kept the change localized, and preserved data-driven validator uniformity across descriptors.

**Confidence:** High — the constraint was explicit prior-art and the directive pattern was already proven by bug-fix-01.

---

### Establishing `INVALID_REFERENCE` error shape using `Object.assign(new Error(...), {...})`

**Context:**
Plan-attack F2 and plan-smell S1 independently flagged that the plan's proposed `throw { code, field, referencedId }` plain-object form was inconsistent with the existing `Object.assign(new Error(msg), { code, field })` pattern at `schema.js:107-128`. Watch-Item 5 of the plan even incorrectly characterized the existing pattern as "plain object, not an Error subclass."

**Information used:**
- `schema.js:107-128` actual existing pattern: `Object.assign(new Error(...), { code, field })`
- Convergent finding F2 + S1 from independent reviewers
- The same function would otherwise contain two inconsistent throw idioms after the change

**Alternatives considered:**
- `Plain object throw { code, field, referencedId }` — rejected; would create within-function inconsistency and diverge from established convention
- `Custom Error subclass` — rejected (inferred); not in use elsewhere in the codebase, would be a larger contract surface

**Decision:** Use `Object.assign(new Error(msg), { code: 'INVALID_REFERENCE', field, referencedId })` for both new directive loops; update Watch-Item 5 to reflect the actual pattern.

**Rationale:** Two independent reviewers flagging the same idiom from different angles signals structural rather than framing risk. One fix tightened both review surfaces and aligned the new code to the codebase pattern.

**Confidence:** High — convergent finding with cheap localized fix; pattern verifiable at file:line.

---

### Preserving `permission_decl/2` alongside new `permission/3` emission

**Context:**
The cascade-spec'd predicate signature for PERMISSION is `permission(PermId, Statement, RuleId)`. The existing `_CATEGORY_PROBES` table at `mutations.js` uses `permission_decl/2` as the RATIFY-state probe predicate. Replacing rather than supplementing the emission would have required editing the probe table in lockstep.

**Information used:**
- `mutations.js` `_CATEGORY_PROBES` RATIFY-compat dependency on `permission_decl/2`
- Translator emission flexibility (a single translator can emit multiple facts per element)
- Cost-of-coupling analysis: a probe-table edit means more risk surface in this sub-sprint

**Alternatives considered:**
- `Replace permission_decl with permission/3 everywhere` — rejected because it required `_CATEGORY_PROBES` table edits inside `mutations.js`, expanding blast radius into the probe substrate
- `Emit only permission/3 and rewrite the probe to use it` — rejected for the same blast-radius reason; deferred as DEF-9

**Decision:** Translator emits both `permission_decl(id, statement)` AND `permission(id, statement, relieves)`; `mutations.js` `_CATEGORY_PROBES` table is unchanged.

**Rationale:** Tactical compatibility move — preserves the probe substrate untouched, lets the new cascade-required linkage land cleanly, and defers the migration hygiene tax to a follow-up (DEF-9). Trades a small amount of dual-emission redundancy for substantially lower coupling risk in this sprint.

**Confidence:** High — the duplication is explicit and tracked as a deferred follow-up.

---

### Skipping design-small-task in favor of option-b lightweight brief

**Context:**
At session start, the designer was given a choice between running `design-small-task` (interactive Q&A loop with structured info packages) or option-b (human-written six-section brief direct to design-specify).

**Information used:**
- Cascade §3.3 / §3.5 fully determined the predicate signatures and required-field structure (no design space ambiguity)
- sprint-02-bug-fix-01 had established a mechanical closure pattern (schema → translator → whitelist → render → tests) that could be applied verbatim twice
- Only four genuinely open micro-decisions existed: RISK.severity retention, error-code naming, render layout, deferring `unknownFieldPolicy`

**Alternatives considered:**
- `Run design-small-task` — rejected; the interactive design conversation has overhead and there was no meaningful design space to explore — only mechanical closure decisions
- `Run design-large-task` — rejected (inferred); even further overkill for a bug-fix sprint with a known closure pattern

**Decision:** Skip design-small-task; designer authors an option-b lightweight six-section brief consolidating the four micro-decisions.

**Rationale:** The design space was determined by prior cascade text and prior-sprint closure pattern. The brief still presented one open question to the user (`nonEmptyArrayFields` directive scope) for ratification.

**Confidence:** Medium — saved cycle time but skipped the discipline of a vocabulary-ratification round; the user's explicit option (a) ratification on `nonEmptyArrayFields` partially substituted.

---

### Folding 8 plan-text mitigations inline rather than re-dispatching reviewers

**Context:**
After plan-attack + plan-smell hardening fired with SIGNIFICANT verdict (1 CRITICAL plan-text bug + 3 SIGNIFICANT + 1 convergent finding), the standard options were: (a) proceed with directed mitigations applied inline, (b) major rework with re-dispatch.

**Information used:**
- All 8 findings were plan-text errors with localized fixes (per the threat-report's own analysis)
- The architecture itself was unchanged by any mitigation
- Estimated total mitigation effort: 20-30 minutes of plan edits
- Convergent finding (F2/S1) signaled structural rather than framing risk — meaning the fix tightens both review surfaces

**Alternatives considered:**
- `Re-dispatch attacker + smeller post-mitigation` — rejected; architecture unchanged, mitigations are localized, no new threat surface introduced
- `Defer mitigations and execute the plan as-is` — rejected; F1 (`TRANSLATORS` not exported) and F4 (string-vs-tuple assertion shape) would block TDD at Tasks 2-4

**Decision:** Option (a) — apply all 8 mitigations inline without re-dispatch; advance to execute-write.

**Rationale:** Threat report explicitly acknowledged "no re-dispatch required after mitigations." Re-dispatching review without architectural change burns cycles without finding new threats. The convergent finding's structural-not-framing nature gave additional confidence that one careful pass would close both surfaces.

**Confidence:** High — explicit guidance from the threat report itself; matches Chester's discipline of treating reviews as adversarial sweeps rather than perfunctory passes.

---

### User ratification of `nonEmptyArrayFields` directive scope — option (a) take it now

**Context:**
The design brief surfaced one open question to the designer: whether to introduce `nonEmptyArrayFields` directive in this sprint (option a) or defer it to a separate vocabulary-alignment sprint (option b). RISK.basis is cascade-required non-empty array — without the directive, a caller submitting `basis: []` would pass schema validation, the translator would emit zero `risk_basis` facts, and the H-3 closure would partially re-emerge in array-shape form.

**Information used:**
- Risk analysis in the brief's Residual Risks section
- Existing `nonEmptyStringFields` directive precedent from bug-fix-01 (mirror-able, mechanical)
- Designer's role: explicit option-naming rule — choices must be presented (a)/(b)

**Alternatives considered:**
- `(b) Defer to a separate sprint` — rejected by user; would have left H-3 partially open
- `(a) Take it now` — chosen

**Decision:** Add `nonEmptyArrayFields` directive in this sprint, applied to RISK.basis.

**Rationale:** Without the directive, H-3 closure is incomplete — array-shape silent drop is the same bug class in different syntax. The directive is mechanical (mirrors `nonEmptyStringFields`), adds minimal scope, and is necessary to genuinely close the finding.

**Confidence:** High — user-ratified, mechanical implementation pattern.

---

### Adversarial spec review catching `_ARITIES.risk: 2` bug that fidelity review missed

**Context:**
After fidelity review of spec-00 approved with three advisory recommendations, the adversarial pass found a HIGH finding: `_ARITIES.risk: 2` in `render.js` was already wrong at sprint start (translator emits at arity 3, including severity), causing `renderElementDeep` to return null for any RISK. Fidelity review had not caught it.

**Information used:**
- Existing `render.js` `_ARITIES` table at sprint start
- Translator's actual arity output at `translation.js`
- Independent adversarial perspective (named subagent, never forks)

**Alternatives considered:**
- `Defer the arity correction` — rejected; it's a live bug that intersects the sprint's render-block work
- `Treat as out-of-scope cascade-alignment` — rejected; it's pre-existing impl drift, not cascade drift

**Decision:** Fold the `_ARITIES.risk` correction (2 → 3) and parallel `PROJECTION_ARITIES.risk` correction into the spec; advance spec-00 → spec-01.

**Rationale:** The adversarial pass justified its independence — it surfaced a pre-existing bug that fidelity (a friendlier reviewer) missed. Including the fix kept the sprint coherent (render layer correctness) without expanding architectural scope.

**Confidence:** High — bug verifiable at file:line; fix mechanical.

---

### Backfilling `nonEmptyArrayFields: []` and `referenceFields: {}` defaults on 7 other descriptors

**Context:**
T1 quality reviewer recommended that all 9 descriptors gain empty defaults for the new directives, even though only PERMISSION and RISK use them, to maintain descriptor-shape uniformity.

**Information used:**
- Existing descriptor shape conventions (other directives like `closedEnumFields` use empty `{}` defaults)
- T1 quality-reviewer recommendation
- The cost of NOT backfilling: future descriptor authors might forget the new directives exist

**Alternatives considered:**
- `Only set the directive where used (PERMISSION, RISK)` — rejected; would create descriptor-shape heterogeneity that the codebase explicitly avoids
- `Backfill in a separate sprint` — rejected; mechanical change, naturally lands with T3

**Decision:** Backfill `nonEmptyArrayFields: []` and `referenceFields: {}` on the 7 other descriptors in T3.

**Rationale:** Descriptor-shape uniformity is an existing codebase convention. Backfilling now (in the same sprint that introduces the directives) keeps the convention enforced and removes a future foot-gun.

**Confidence:** High — quality-reviewer-driven, mechanical, conforms to existing convention.

---

### `CHESTER_SKILLS_ROOT` env-var pattern for probe worktree-targeting

**Context:**
T6 needed the cascade-spec probe (`cascade-spec-probe-simulation.mjs` in gitignored `working/stress-tests/`) to run against the worktree's modified domain code, not the main repo's unmodified copy. The probe uses dynamic imports.

**Information used:**
- Probe lives outside any worktree (gitignored `docs/chester/working/`)
- Multi-worktree development requires the probe to point at whichever worktree is being verified
- Default behavior must remain main-repo-targeted for non-worktree runs

**Alternatives considered:**
- `Hardcode the worktree path in the probe` — rejected; breaks default behavior and other worktrees
- `Pass a CLI argument` — rejected (inferred); env var is the more standard pattern for "where do my dependencies live"

**Decision:** Add `CHESTER_SKILLS_ROOT` env var; probe defaults to main repo `skills/` and overrides to worktree `skills/` when set.

**Rationale:** Preserves default behavior, enables worktree-targeting without code change at call sites, and follows the standard env-var pattern for "tell me where the dependency tree is rooted." Pattern is reusable across future probes.

**Confidence:** Medium — minor convention choice; env var name slightly opinionated but justifiable.

---

### Deferring 10 follow-up items rather than expanding sprint scope

**Context:**
Across spec review, plan review, per-task quality reviews, and the full-sprint code review, 10 distinct follow-up items surfaced (DEF-1 through DEF-10) ranging from Minor 80 polish to Important 90 maintenance-hazard concerns.

**Information used:**
- Sprint scope discipline: AC-9.1 confines `git diff` to `references/domain/`
- Severity grades on each finding (Minor, Important — none Critical)
- Risk of scope creep degrading sprint focus

**Alternatives considered:**
- `Fold all 10 into this sprint` — rejected; expands blast radius, delays merge, dilutes focus
- `Fold only Important findings` — rejected; even Important findings (probe-table sync structural test, cascade `risk/3` divergence) have natural homes in future sprints (DEF-7 maintenance refactor, DEF-8 cascade-edit sprint)
- `Discard low-priority findings` — rejected; deferral preserves institutional memory without committing schedule

**Decision:** Record all 10 in `plan/sprint-02-bug-fix-02-deferred-00.md` and proceed to finish phase.

**Rationale:** Sprint discipline favors closing-what-you-opened over scope expansion. Deferred items remain visible (DEF-1 naturally lands in sprint-02-bug-fix-05; DEF-8 in cascade-edit sprint; others as polish opportunities). The full-sprint code review's "Yes — production-ready" verdict with these items as deferred-not-blocking confirms the call.

**Confidence:** High — every deferred item has a natural future home, and the discipline aligns with Chester's iterative-closure philosophy.

---

<!-- produced-by finish-write-records@v0003 -->
