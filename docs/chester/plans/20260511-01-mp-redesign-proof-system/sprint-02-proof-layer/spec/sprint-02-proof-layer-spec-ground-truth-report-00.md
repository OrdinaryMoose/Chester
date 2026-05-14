# Sprint-02 Proof Layer — Spec Ground-Truth Report

**Subject:** `sprint-02-proof-layer-spec-01.md`
**Reviewed against:** master cascade docs (Architecture, Engine Spec, Domain Spec, ADRs 0001–0019), sprint-01-proof-backend-pass-3.
**Status (after inline fixes):** Clean

---

## Verified claims (cascade-confirmed)

- Six substrate ports — `IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction` — confirmed at `ADR/0013-relocate-imaterializer-and-specify-tx-visibility copy.md:33` and `03-architecture.md:150`.
- Substrate-port method signatures (`assertFact`, `retractFact`, `defineRule(ruleId, headAtom, bodyAtoms, metadata)`, `undefineRule(ruleId)`, `snapshot()/restore(token)`, `tx.begin/commit/rollback`, `derive`, `query`, `count`, `exists`, `explain(fact)`) — confirmed at `04-engine-spec.md:87-142` (§4.1–§4.8) and re-listed in `03-architecture.md:152-162`.
- Seven delivery ports — confirmed at `03-architecture.md:166-182` (§4.2).
- Four cross-cutting adapters — confirmed at `03-architecture.md:186-196` (§4.3); ADR-0009 referenced.
- §6.1 mutation-flow ordering — confirmed at `05-domain-spec.md:417-427`.
- Eight operation verbs — confirmed at `05-domain-spec.md:408-415`.
- Counterfactual `snapshot → retractFact → derive → query → restore` flow — confirmed at `05-domain-spec.md:720-728` (§11.1); `query_with` / `query_without` generalizations at lines 736-737 (§11.2).
- ADR-0013 Part 1 (six ports), Part 2 (read-own-writes), Part 3 (stratification at `defineRule`) — confirmed at `ADR/0013-...md:31-52`.
- Closed-set tag families — confirmed in `05-domain-spec.md` (INFERENCE_PATTERNS §3.4.1, FRICTION_SHAPES §3.7.1, FRICTION_DISPOSITIONS §3.7.2, WITHDRAWAL_DISPOSITIONS §3.10, ACTION_LABELS §6.2, CONSENT_SOURCES §3.1/§3.2/§5.1, ELEMENT_CATEGORIES §1, PHASES §4.5).
- `CategoryDescriptor.renderSection` field is defensibly closed by domain spec §10 enumeration; the spec's introduction of `RENDER_SECTIONS` as a 9th tag family is grounded in that.
- LOC arithmetic: spec's claimed midpoint sum (~2,650) matches the actual per-module midpoint sum within rounding (155 LOC overshoot of the 2,500 ceiling).
- Read-own-writes transaction visibility — confirmed at `04-engine-spec.md:131-138`.
- Stratification check at `defineRule` time inside transactions — confirmed at `04-engine-spec.md:140`.

## Findings — original review

- **MEDIUM: §10 payoff list misalignment** — Spec inherited brief language "narrow-port audit adapter clean" for the fifth payoff. Cascade `03-architecture.md:463` actually names the fifth payoff "Independent verification path" (the Datalog projection consumable by a second engine for independent confirmation). The brief paraphrased; the spec propagated the paraphrase.
- **LOW: ProbePorts amendment is required by cascade** — Spec amends brief by adding `facts` to ProbePorts so §11.1's `retractFact`-based counterfactual is implementable. The amendment is defensible and well-explained in the spec.
- **LOW (retracted on re-read): `IPersistenceRepository` naming** — Original concern retracted; the four cross-cutting adapters as named in the spec match `03-architecture.md:186-196`.

## Inline fixes applied (spec-01.md)

- **§10 payoff list fix** — replaced the "Coverage map" line "Architecture §10 payoffs (audit adapter runs) → bridge integration" with a six-payoff split that names each §10 payoff verbatim from the cascade and maps each to its sprint-02 coverage scope. Explicit annotation added that the brief's "narrow-port audit adapter clean" paraphrases §10's "Independent verification path" + "Adversary integrates cleanly".
- **AC-11.1 strengthening** — renamed from "Read-only audit adapter via `ReadPorts` runs end-to-end" to "Architecture §10 payoffs mechanically realized"; split into two sub-clauses:
  - **Audit-adapter sub-clause** ("Adversary integrates cleanly") — verifies a `createReadOnlyAudit` helper exposing only `readPorts` + render methods.
  - **Datalog-projection sub-clause** ("Independent verification path") — verifies `IRenderSurface.renderDatalogProjection` returns serializable Datalog projection output suitable for ingestion by a second engine.

## Risk assessment

The spec is substantially accurate against the cascade. The six substrate ports, their method signatures, the seven delivery ports, the four cross-cutting adapters, the §6.1 mutation flow, the §11.1/§11.2 counterfactual flow, ADR-0013's three parts, the eight verb names, the closed-set tag families, and the LOC arithmetic all check out against the cascade. The single MEDIUM finding (§10 payoff list misalignment) was a documentation-fidelity issue inherited from the brief; both fix paths the reviewer named have been applied — the coverage map now names the cascade's six §10 payoffs literally, and AC-11.1 now mechanically tests the cascade's "Independent verification path" payoff via the Datalog-projection sub-clause. Spec is safe for plan-build.

<!-- created-at: 2026-05-13T16:30:26Z -->
<!-- produced-by design-specify@v0003 -->
