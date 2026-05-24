# Framing Review — Arbiter (verbatim, engine-consultant role)

**File:** `framing-review-arbiter-00.md`
**Role:** Arbiter (proof-engine knowledge consultant, no proof state)
**Subject:** `framing-00.md`
**Mode:** caveman ultra inter-agent
**Returned:** 2026-05-21

---

## ENGINE BEHAVIORS WE LOSE

Behaviors the engine performed mechanically that the typed schema does not replicate without explicit protocol:

- **Cascade invalidation.** REVISE writes `superseded(new_id, old_id)` and re-derives. Every downstream claim grounded on the old element silently loses its grounding — `ungrounded_proposition` fires automatically. Schema has no equivalent. Framing names this; it is real.
- **Withdrawal propagation.** WITHDRAW writes `withdrew(id)`; `effective_grounding`, `effective_addresses`, `covered`, `unresolved_friction` all filter on `not withdrew(id)`. Pulling one element reopens Concerns, ungrounds Propositions, uncovers Risks — all at once, automatically. Schema has no equivalent. Clerk would have to re-audit all grounding citations on every withdrawal.
- **Structural auto-detection.** `ungrounded_proposition`, `coverage_gap_detected`, `overlap_detected` fire automatically as forward-chain side effects — no one asks. Schema has no equivalent. Detection becomes Clerk's round-end lint pass, which is periodic not continuous.
- **Counterfactual collapse test.** `collapseTest(propId)` snapshot/restores engine state, retracts all `approved` facts for the target, re-queries `closure_permitted` — tells you whether closure still holds without that Proposition. This converts `collapse_test` from a prose self-report into a mechanically verifiable property. Alternative F's collapse_test field is again a self-report.
- **ID-prefix integrity.** Engine enforces category-prefix on every element id at ADD time (`ID_PREFIX_MISMATCH` error). Schema cannot enforce this — it depends on Clerk lint catching malformed ids after the fact.
- **Vocabulary lint gate.** At RATIFY time, engine scans all string fields of the target element for case-variant occurrences of ratified Definition terms (`VOCABULARY_LINT_VIOLATION`). Argumentative elements (Proposition, Resolution, Rule, Permission, Friction) are blocked from ratification if vocabulary discipline is violated. Schema has no equivalent unless Clerk lint script replicates this scan.
- **Two-yes-complete tracking.** Engine tracks `two_yes(id, source)` for both DESIGNER and DESIGN_PARTNER and derives `two_yes_complete(id)` when both present. This is the mechanical gate for the two-player asymmetry at the element level. Schema replaces this with designer batch-ratification at round close — still two-player, but no per-element mechanical trace.
- **Transaction atomicity.** Engine runs every operation inside a tx bracket with rollback on any failure. If a batch ingest fails mid-way, the engine rolls back to the last consistent state. Schema's Clerk lint is post-hoc — a malformed batch may be partially applied before the error is caught.

---

## ENGINE BEHAVIORS WE KEEP

Properties that survive engine elimination because they were schema properties, not derivation outputs:

- **Closed-set field enumerations.** Tags (ELEMENT_CATEGORIES, FRICTION_SHAPES, FRICTION_DISPOSITIONS, WITHDRAWAL_DISPOSITIONS, ACTION_LABELS, CONSENT_SOURCES) are closed sets enforced at the call boundary. Alternative F preserves these as field-shape enumerations in the schema — no engine required.
- **IF/THEN body shape.** The Proposition body field is already a typed-field constraint, not a derived fact. Alternative F's three-field schema preserves this directly.
- **Designer-voice axiom provenance.** The engine's DESIGNER vs DESIGN_PARTNER consent source distinction is what gave axioms their authority. Alternative F moves axiom assertion to the designer's own typed input — authority is provenance-by-construction, not by consent-source enum. Equivalent effect, different mechanism.
- **Concern coverage requirement.** The requirement that every ratified Concern be addressed is schema-expressible as a coverage map check. Clerk can perform this per round close without a Datalog derivation.
- **Two-player asymmetry.** Designer ratifies, agent proposes — this is role discipline, not an engine property. Survives elimination.

---

## WHAT CLERK MUST DO

Mechanical operations the engine handled that now need explicit Clerk lint scope:

- **Grounding-citation existence check.** At round close: for every submitted Proposition, verify each Evidence ID in the grounding field exists in the Evidence registry and has not been withdrawn. Engine did this continuously via `effective_grounding` derivation.
- **Withdrawal re-audit.** When any element is withdrawn: re-scan all extant Proposition grounding citations for references to the withdrawn id. Flag any Proposition that is now ungrounded. Engine derived `ungrounded_proposition` automatically.
- **Cascade-on-revision flag.** When a ratified Proposition is revised: identify all other Propositions whose grounding cites the revised Proposition's id (i.e., Proposition-to-Proposition grounding chains). Flag for designer re-ratification. Engine derived this via forward-chain re-evaluation.
- **Overlap detection.** Scan the Definition registry for duplicate (term, scope) pairs at round close. Engine derived `overlap_detected` automatically.
- **Coverage gap detection.** For every Risk in the registry: verify at least one non-withdrawn Proposition covers it. Engine derived `coverage_gap_detected` automatically.
- **Vocabulary consistency check.** Scan Proposition bodies and collapse_test fields for case-variant occurrences of any term appearing in the Designer axiom list. Engine ran `VOCABULARY_LINT_VIOLATION` at every RATIFY call.
- **Coverage map completeness.** At session close: verify every Concern has at least one ratified Proposition plus its axiom-coverage row. Engine derived `unaddressed_concern` automatically.

---

## WHAT DESIGNER MUST DO

Semantic operations the engine deferred to the designer that stay where they are:

- **Semantic validity of collapse_test.** Engine verified structural form (field present, parseable); it never verified that the contrapositive was true or non-trivial. Designer judgment remains the sole gate on semantic quality. Same as before.
- **Axiom assertion quality.** Engine had no equivalent. Designer pre-asserts known-true facts. If axioms are thin or wrong, the agent's argument surface is mis-anchored. No mechanical check possible.
- **Ratification of revised elements.** Engine flagged that a revision happened (via `superseded` metafact) and triggered `clearsTwoYes` (round advance, wiping prior two-yes). Designer had to re-ratify. Same requirement survives — designer must explicitly re-ratify any revised Proposition after Clerk flags it.
- **Friction disposition judgment.** Engine recorded `friction_disposition(id, value)` but never evaluated whether `dismiss` or `override` was a sound call. Designer judgment remains load-bearing. Frictions are gone from Alternative F's schema — but the judgment call about whether to tolerate structural tension now surfaces at designer ratification time with no Friction element as the record vehicle.
- **Semantic coverage adequacy.** Engine verified that a Resolution's `resolution_anchor` pointed at a Concern id. It never verified that the Resolution's prose actually addressed the Concern's substance. Designer's ratification was the load-bearing semantic check. Same placement in Alternative F.

---

## READY

**Conditional — yes with one gap.**

Framing is ready for Committee design work. The five-section inventory above gives the Clerk scope (D3) sufficient grounding to design against. The one gap: framing names cascade invalidation as one accepted risk but does not name withdrawal propagation as a separate distinct risk. Withdrawal triggers the same downstream cascade (ungrounding, uncovering, reopening) through a different entry point. Clerk lint spec for D3 must address withdrawal re-audit as explicitly as it addresses revision cascade — they are different triggers, same structural consequence. If framing ships without naming this, the rules.md Clerk section will underspecify one of the two load-bearing re-audit triggers.
