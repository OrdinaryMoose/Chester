# Design Proof System — Simulation Catalog

A consolidated record of the integration-level simulations that drove the design-proof-system from its initial defect-laden state to its current strict-closure, withdrawal-aware, multi-author-ratification, scope-discriminated form. Each simulation drove a wave of fixes; the probes that grew out of each fix are documented alongside.

**System under test**: `skills/design-proof-system/references/` (the JavaScript reference implementation — engine + domain layers).

**HARD RULE**: this catalog covers only the design-proof-system. The system at `skills/design-large-task/proof-mcp/` is a separate codebase per the project's hard rule (see root `CLAUDE.md`). Do not cross-reference findings, fixes, or simulations between the two.

**Audience**: future maintainers debugging regressions, agents extending the system, design reviewers auditing the validation surface.

---

## 1. Purpose and methodology

### Why simulations exist

The design-proof-system has thorough unit tests (vitest suite under `references/domain/__tests__/`) that verify individual modules in isolation. Simulations sit one layer higher: they exercise the *integration* surface — multiple verbs called against a single bridge across many phases, with state accumulating through ratifications, withdrawals, revisions, and closure attempts.

Unit tests answer "does this function work in isolation." Simulations answer "do all these functions compose into a coherent end-to-end design workflow." Defects only visible at composition (e.g., a rule's body atom that produces correct results in unit tests but the wrong shape when integrated with a ratification translator) surface here.

### Simulation vs probe distinction

- **Simulations** are story-driven: a domain scenario (calculator, session-auth, rate-limiter) drives a sequence of bridge calls through multiple phases. Findings surface as failed attempts or as anomalous query results. Long-lived; one simulation often surfaces several defects across a single run.
- **Probes** are focused verification: a single contract being tested against a single fix. Short, targeted, with explicit PASS/FAIL assertions. Born from simulation findings — each fix gets a probe that locks in the corrected behavior.

Probes are the regression net; simulations are the discovery net.

### The `attempt()` wrapper pattern

Every simulation uses a common error-tolerant wrapper:

```js
const findings = [];
let attemptIdx = 0;
function attempt(label, fn) {
  attemptIdx++;
  const tag = String(attemptIdx).padStart(2, '0');
  try {
    const result = fn();
    console.log(`[${tag}] OK   ${label}` + (result !== undefined ? ` => ${JSON.stringify(result).slice(0, 140)}` : ''));
    return result;
  } catch (e) {
    console.log(`[${tag}] FAIL ${label}\n         message: ${e.message}` + (e.code ? `\n         code: ${e.code}` : ''));
    findings.push({ attempt: tag, label, message: e.message, code: e.code });
    return null;
  }
}
```

This lets a simulation run to completion even when individual operations throw — defects accumulate in the `findings` array rather than halting execution at the first throw. The end-of-run summary reports `Total attempts: N, Failures: M`. **A simulation reporting 0 failures is not necessarily clean** — `OK` results returning the wrong shape are common, and probe-level assertions are required to catch those.

### Bridge construction boilerplate

Every simulation starts with the same setup:

```js
import { Engine } from '<path>/skills/design-proof-system/references/engine/Engine.js';
import { createDomainBridge } from '<path>/skills/design-proof-system/references/domain/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, ... } from '<path>/skills/design-proof-system/references/domain/tags.js';

const engine = new Engine();
let counter = 0;
const bridge = createDomainBridge({
  engine,
  clock: { now: () => 1700000000 },           // constant for deterministic runs
  idAllocator: { next: (s) => `${s}_${++counter}` },
  consentVerification: { verify: () => true },
  persistenceRepo: { saveState: () => {} },
});
const consent = { source: CONSENT_SOURCES.DESIGNER };
```

A constant clock makes runs reproducible (timestamps in derived facts don't vary between executions). The id allocator uses category-prefixed counters so element ids are human-readable in the output (`proposition_15` instead of `uuid-...`).

### The bit-equality fingerprint pattern

The counterfactual stress simulation introduced a stronger validation tool — fingerprint the engine state via `renderDatalogProjection` before and after an operation, compare for bytewise equality:

```js
function fingerprint(bridge) {
  const dl = bridge.renderDatalogProjection({});
  const factsSorted = [...dl.facts].map(f => JSON.stringify(f)).sort();
  const rulesSorted = [...dl.rules].map(r => JSON.stringify(r)).sort();
  return JSON.stringify({ facts: factsSorted, rules: rulesSorted });
}
```

This is the cleanest way to verify that an operation that *claims* to be side-effect-free (e.g., `runCounterfactual`'s snapshot/restore bracket) actually is. Sort facts/rules to be order-independent; compare as strings. Any drift is immediately visible.

---

## 2. Simulation catalog

### 2.1 `calculator-fully-featured-simulation.mjs`

**Domain**: a fully-featured calculator application (operators, operands, expressions, memory functions, error handling for div-by-zero and overflow).

**Goal**: exercise every one of the nine `ELEMENT_CATEGORIES` at least twice through a single end-to-end design proof, then attempt closure. The original test of breadth.

**Phases** (15):
1. Bootstrap
2. DEFINITIONs (4) — Calculator, Operand, Operator, Expression
3. EVIDENCE (4) — user input model, output model, number domain, memory request
4. RULEs (3) — operator precedence, associativity, no implicit coercion
5. PERMISSIONs (3) — clear-all, keyboard entry, parentheses
6. PROPOSITIONs (3) — six operations, deterministic, memory persists
7. RISKs (3) — div-by-zero, overflow, malformed expression
8. RESOLUTIONs (3) — error display, scientific notation, suppress invalid keys
9. CONCERNs (2) — accessibility, mobile touch-target size
10. FRICTIONs (2) — coverage_gap on `%` semantics + SYSTEM-consent probe
11. Ratifications — every approval-gated element
12. Friction disposition (manage_friction verb)
13. Pre-closure inspection (queries + datalog snapshot)
14. presentClosingArgument
15. confirmClosureGo + final renders

**Final state**: 54 attempts, 2 expected refusals (presentClosingArgument and confirmClosureGo correctly refuse because concerns remain unaddressed by design). One intentional negative probe at attempt 28 (SYSTEM consent for FRICTION — was a defect probe, now passes after Calc #3 fix).

**Findings surfaced**: Calc #1 (manage_friction disposition decoupling), Calc #2 (manage_friction shape-check), Calc #3 (per-category authority lookup gap), Calc #4 (positive — closure failure list usefully names blocking ids).

**Re-run**:
```bash
node docs/chester/working/stress-tests/calculator-proof-design-proof-system/calculator-fully-featured-simulation.mjs
```

---

### 2.2 `adversarial-session-design-simulation.mjs`

**Domain**: a session-authentication system design with deliberate term-overlap (multiple definitions of "Session" and "Token"), unaddressed risks (token leak via logs, storage exhaustion), and partial resolution coverage.

**Goal**: provoke the four auto-detection rules in `friction-policy.js` (`ungrounded_proposition_rule`, `coverage_gap_rule`, `overlap_rule`, `conflict_rule`) and probe whether detected frictions can be promoted to real FRICTION elements via the public surface.

**Phases**:
1. Bootstrap
2. DEFINITIONs — deliberate term-overlap (Session×2, Token×2, XSS×1)
3. EVIDENCE — user behavior, industry norms, compliance requirements
4. PROPOSITIONs — all properly grounded
5. RISKs — some addressed, some deliberately not
6. RESOLUTIONs — partial coverage on purpose
7. Ratifications
8. Probe auto-detection predicates (coverage_gap_detected, overlap_detected, ungrounded_proposition, conflict_detected)
9. Probe ungrounded_proposition reachability
10. Probe whether `detectFrictions` is exposed on facade
11. Promote detected frictions → FRICTION elements via SYSTEM consent
12. Disposition the promoted frictions
13. Closure attempt
14. Final renders

**Final state**: 47 attempts, 1 intentional negative probe (attempt 31: PROPOSITION without grounding — schema correctly rejects, which is the desired behavior). Post-Option-A this simulation produces 3 closure refusals because the elevate-and-defer workflow no longer reaches closure under strict gate semantics — those are correct contract changes, not regressions.

**Findings surfaced**: Adv #1 (overlap cardinality noise), Adv #2 (ungrounded_proposition unreachable), Adv #3 (withdrawElement shape-check), Adv #4 (detectFrictions not exposed on facade), plus a positive finding (first proof to actually reach `closure_permitted: true` in the project's history).

**Re-run**:
```bash
node docs/chester/working/stress-tests/calculator-proof-design-proof-system/adversarial-session-design-simulation.mjs
```

---

### 2.3 `evolution-rate-limiter-simulation.mjs`

**Domain**: an API rate-limiter design that evolves over time — v1 (token-bucket global), v2 (token-bucket per-user, a revision of v1), v3 (sliding-window log, replaces v1+v2 entirely).

**Goal**: drive REVISE, WITHDRAW, and ratification cycles to surface dark code in the lifecycle module, the REVISE operation, and the supersession machinery. Every prior simulation was monotonic (add-only); this one tests the time dimension.

**Phases**:
1. Bootstrap + baseline state inspection (round=0?, two_yes empty?, rule count)
2. v1 design — token-bucket, global
3. Ratify v1
4. Probe REVISE shape-check (mirror the WITHDRAW probe pattern)
5. Revise the central proposition to v2; inspect what happened
6. Try to ratify the revised proposition; check whether it derives
7. v3 — withdraw v1+v2, add sliding-window from scratch
8. End-state inventory (proposition_decl, derived proposition, withdrew, approved, detectFrictions)
9. Final render — does it show v3 only, all three, or v1+v3?
10. Findings dump

**Final state**: 34 attempts, 1 intentional negative probe (attempt 14: reviseElement without idShape — schema correctly rejects post-fix with a clear actionable error message). Snapshots show `phase: [{P: 'establishment'}]`, `superseded: [{A: 'proposition_11', B: 'proposition_4'}]`, `two_yes: 7 rows` — all previously-dark lifecycle predicates now alive.

**Findings surfaced**: the densest single simulation — Evol #1 through Evol #6, plus the `closure_permitted: true` for a proof containing withdrawn lemmas observation (which became Evol #3's load-bearing motivation).

**Re-run**:
```bash
node docs/chester/working/stress-tests/calculator-proof-design-proof-system/evolution-rate-limiter-simulation.mjs
```

---

### 2.4 `counterfactual-stress-simulation.mjs`

**Domain**: not a design domain — a primitive-stress test. Build a small coherent proof, then hammer `runCounterfactual` against it in many shapes (single, sequential, repeated, against non-existent ids, with state mutations interleaved, with open external transactions).

**Goal**: validate the snapshot/restore boundary that `runCounterfactual` depends on. Every prior simulation called it once; this one repeats 20+50 times and asserts bit-equal engine state between calls via the `renderDatalogProjection` fingerprint.

**Phases**:
1. Bootstrap; build a coherent closing proof (2 evidences, 3 propositions, 2 risks each with addressing resolution, 1 covered concern)
2. Compute baseline fingerprint
3. Single counterfactual; check fingerprint identity
4. Counterfactual against every ratified proposition; check identity each time
5. Counterfactual against a non-existent propId — graceful baseline
6. Repeated calls against same propId — drift across N=20
7. Counterfactual after withdrawal + revision (full state complexity)
8. Probe: snapshot/restore behavior with an open transaction
9. Rule-store stability check via fingerprint counts (N=50 counterfactuals)

**Final state**: 0 findings post-fix. Snapshot/restore is bit-equal across single, sequential, 20×, and 50× repeated counterfactuals. Rule store and fact store grow zero across counterfactual brackets.

**Findings surfaced**: CF Finding A (PROJECTION_ARITIES incomplete — `renderDatalogProjection` was missing 11 EDB predicates), CF Finding B (open-tx interaction — design question that led to the B+A guard implementation).

**Notable positive results**:
- Snapshot/restore is bit-equal across every reachable scenario
- Counterfactual on non-existent propId is a graceful no-op
- Rule/fact counts stable across 50 brackets

**Re-run**:
```bash
node docs/chester/working/stress-tests/calculator-proof-design-proof-system/counterfactual-stress-simulation.mjs
```

---

## 3. Probe catalog

Probes are organized by the finding they verify. Each is a self-contained Node script with PASS/FAIL assertions.

### Calculator-finding probes
- **`probe-friction-disposition.mjs`** — Calc #1 + #2. Narrows the manage_friction shape-check bug and the friction-disposition-doesn't-propagate-to-closure bug. Five tests (minimal args, filler args, disposition fact landed, unresolved_friction clears, raw friction fact).
- **`probe-consent-axis.mjs`** — Calc #3. Six-cell matrix of {category × consent.source} for ADD verb. Confirms SYSTEM admittable for FRICTION (via per-category authority), DESIGN_PARTNER rejected for EVIDENCE, fallback to spec.consentCategory for verbs without per-action authority.

### Adversarial-finding probes
- **`probe-detect-frictions.mjs`** — Adv #1. Verifies `detectFrictions` canonicalizes symmetric pair frictions (overlap/conflict) to exactly one finding per distinct semantic pair, vs N² raw rows.
- **`probe-ungrounded-proposition.mjs`** — Adv #2. Five tests verifying the new `effective_grounding` rule fires when grounding evidence is withdrawn, and that the structural case is correctly handled.
- **`probe-withdraw.mjs`** — Adv #3. Five tests for WITHDRAW shape: minimal `{id}` succeeds for EVIDENCE/PROPOSITION/FRICTION, filler-args back-compat, missing id correctly rejected.
- **`probe-bridge-detect-frictions.mjs`** — Adv #4. Five tests for the facade-exposed `detectFrictions` and `audit.detectFrictions`. Empty proof yields `[]`, all three reachable shapes detected, overlap canonical, audit adapter inherits.

### Evolution-finding probes
- **`probe-revise.mjs`** — Evol #1. Five tests: REVISE without `supersedes` rejected, with `supersedes` succeeds + emits superseded fact, ratification derives public predicate (proves template installed), works for all four approval-gated categories, REVISE chain (a→b→c) produces 2 supersession links.
- **`probe-render-withdrawn.mjs`** — Evol #2. Four tests: `renderStructuredProof` filters all 3 sections, `getProofState` filters inventories, `renderElementDeep` annotates `withdrawn:true`, `renderDatalogProjection` stays complete.
- **`probe-closure-withdrawal-aware.mjs`** — Evol #3. Three scenarios: withdraw resolution → coverage_gap reopens, withdraw friction → unresolved_friction clears, withdraw concern → unaddressed_concern clears.
- **`probe-revise-shape-error.mjs`** — Evol #4. Four tests: REVISE without idShape gives clear error, REVISE with idShape but missing supersedes gives Issue-#1 message, missing per-category fields gives per-category error (not misleading EVIDENCE), complete call succeeds.
- **`probe-datalog-projection-rules.mjs`** — Evol #5. Five tests, including the **replay test**: a second engine ingesting the projection produces identical derived facts.
- **`probe-phase-and-two-yes.mjs`** — Evol #6. Six tests: phase derives ESTABLISHMENT/PRESENTATION/CONFIRMATION via closure-state facts; RATIFY writes `two_yes`; `two_yes_complete` fires on both DESIGNER+DESIGN_PARTNER yeses.

### Counterfactual-finding probes
- **`probe-counterfactual-tx-guard.mjs`** — CF Finding B (B+A implementation). Five tests: no-tx baseline succeeds; open-tx throws `COUNTERFACTUAL_REFUSED_DURING_TX` with op + JSDoc citation; audit adapter inherits the guard; refusal fires at call site (not later); 20 sequential counterfactuals non-regression.

### Parking-lot task probes
- **`probe-ratify-authority.mjs`** — Task #4. Five tests for the RATIFY per-category authority wiring. PROPOSITION accepts DESIGN_PARTNER; EVIDENCE rejects it; end-to-end multi-author ratification via public API (no `engine.assertFact` hack); fallback for non-existent elementId; FRICTION ratify still works.
- **`probe-concern-status-cleanup.mjs`** — Task #6. Five tests: pre-ratify CONCERN has only 'draft', post-ratify has only 'ratified', non-CONCERN ratify doesn't throw, projection includes only live row per concern, closure-policy `covered_rule` still fires.
- **`probe-overlap-scope.mjs`** — Task #9. Six tests: back-compat for unscoped definitions, no overlap for different explicit scopes, no overlap for mixed (scoped + default), three same-scope yields C(3,2)=3 canonical pairs, mixed-scope partition detects only intra-scope, definition_scope fact lands.
- **`probe-auto-escalation.mjs`** — Task #10. Seven tests: bare bridge permits closure; coverage_gap/ungrounded_proposition/overlap each block closure; escape valves (address risk → restore; different scopes → restore); full presentClosingArgument flow throws CLOSURE_NOT_PERMITTED.
- **`probe-render-detected-frictions.mjs`** — Task #11. Six tests: clean proof yields empty list; single-shape detection appears; multi-shape coexist; overlap canonicalization; backward compat for `.permitted`/`.asOf`; audit-adapter consistency.

---

## 4. Findings index (cross-reference)

| ID | Severity | Finding | Surfaced by | Fixed in commit | Verified by probe |
|---|---|---|---|---|---|
| Calc #1 | Critical | `manage_friction` writes `friction_disposition` satellite but `unresolved_friction_rule` reads element fact's 4th position | calculator-fully-featured | `829b69e` | probe-friction-disposition |
| Calc #2 | Important | `manage_friction` shape-checks against FRICTION element schema instead of operation args | calculator-fully-featured | `829b69e` | probe-friction-disposition |
| Calc #3 | Important | `CATEGORY_REGISTRY[FRICTION].sourceConstraint=SYSTEM` is dead documentation; verifyConsent uses spec.consentCategory only | calculator-fully-featured | `829b69e` | probe-consent-axis |
| Calc #4 | Positive | Closure failure-reason list usefully names blocking element ids | calculator-fully-featured | (no fix needed) | — |
| Adv #1 | Important | `overlap_rule` produces N² rows (reflexive + symmetric pair duplicates) | adversarial-session-design | `829b69e` | probe-detect-frictions |
| Adv #2 | Important | `ungrounded_proposition_rule` structurally unreachable via public API | adversarial-session-design | `829b69e` | probe-ungrounded-proposition |
| Adv #3 | Important | `withdrawElement` shape-check against EVIDENCE schema (same family as Calc #2) | adversarial-session-design | `829b69e` | probe-withdraw |
| Adv #4 | Minor | `bridge.detectFrictions` not exposed on facade | adversarial-session-design | `829b69e` | probe-bridge-detect-frictions |
| Evol #1 | Critical | REVISE generates fresh id but doesn't link to original via `superseded`, doesn't install per-element rule template — REVISE-then-ratify never derives | evolution-rate-limiter | `829b69e` | probe-revise |
| Evol #2 | Critical | `renderStructuredProof` shows withdrawn elements as still load-bearing | evolution-rate-limiter | `829b69e` | probe-render-withdrawn |
| Evol #3 | Critical | Closure-policy rules don't account for withdrawal — withdrawn frictions/concerns/resolutions still drive closure state | evolution-rate-limiter | `829b69e` | probe-closure-withdrawal-aware |
| Evol #4 | Important | REVISE shape-check inherits the WITHDRAW-family bug (defaults to EVIDENCE shape, misleading error) | evolution-rate-limiter | `829b69e` | probe-revise-shape-error |
| Evol #5 | Important | `renderDatalogProjection` returns 0 rules — verification-path projection broken | evolution-rate-limiter | `829b69e` | probe-datalog-projection-rules |
| Evol #6 | Important | Lifecycle predicates (`phase`, `two_yes`, `superseded`) declared in EDB but never written | evolution-rate-limiter | `829b69e` | probe-phase-and-two-yes |
| CF Finding A | Real defect | `PROJECTION_ARITIES` missing 11 EDB predicates (`withdrew`, `superseded`, `two_yes`, `grounding`, `addresses`, etc.) | counterfactual-stress | `829b69e` | (counterfactual-stress Phase 7) |
| CF Finding B | Design question → B+A | `runCounterfactual` silently invalidates open external tx via snapshot/restore | counterfactual-stress | (B+A implementation, see below) | probe-counterfactual-tx-guard |
| Task #4 | Implementation | RATIFY's per-category authority lookup deferred from Calc #3 — blocked DESIGN_PARTNER ratifications | parking-lot triage | `5e556ff` | probe-ratify-authority |
| Task #6 | Implementation | `concern_status('draft')` not retracted on CONCERN ratify — both 'draft' and 'ratified' rows coexist | parking-lot triage | `15086da` | probe-concern-status-cleanup |
| Task #7 | Refactor | `Engine.loadFrom`/`Engine.clear` use inline `_tx` checks instead of public `hasOpenTransaction()` | B+A implementation surface | `8b7d543` | (covered by probe-counterfactual-tx-guard) |
| Task #9 | Implementation | `overlap_detected` ambiguous between legitimate dual-use and real redundancy — needed scope discrimination | Option A pre-work | `e995669` | probe-overlap-scope |
| Task #10 | Design + impl | Closure gate didn't auto-escalate structural detections (coverage_gap, ungrounded_proposition, overlap) — "production breaks silently" | Option A design call | `b7218b8` | probe-auto-escalation |
| Task #11 | Additive | `renderClosingArgument` didn't surface non-blocking detections — operators couldn't see warnings at render time | Option A complement | `7c361df` | probe-render-detected-frictions |

### Commit-to-fixes index

- **`829b69e`** — bundle commit: closes Calc #1-3, Adv #1-4, Evol #1-6, CF Finding A, plus all related additive surface (effective_grounding, effective_addresses, argShape mechanism, hasOpenTransaction)
- **`8b7d543`** — refactor: loadFrom/clear use hasOpenTransaction (Task #7)
- **`5e556ff`** — fix: RATIFY per-category authority (Task #4)
- **`15086da`** — fix: concern_status('draft') retract on CONCERN ratify (Task #6)
- **`e995669`** — feat: scope-discriminated overlap_detected (Task #9)
- **`b7218b8`** — feat: Option A auto-escalation + reflexive-match fix via `definition_self` (Task #10)
- **`7c361df`** — feat: renderClosingArgument returns detectedFrictions (Task #11)
- **`3d29478`** — docs: AGENT-USAGE.md for Mode 1 access

---

## 5. How to add a new simulation

### When to add one

Add a simulation when you have a *new class of scenario* not currently covered — e.g., a different design domain (non-software), a different time pattern (parallel revisions, deep supersession chains), a different stress dimension (concurrent transactions, persistence failure paths). Don't add one for a single contract test — write a probe instead.

### Naming and location

- **Simulations**: `<verb>-<domain>-simulation.mjs` in `docs/chester/working/stress-tests/calculator-proof-design-proof-system/`. Examples: `calculator-fully-featured-simulation.mjs`, `evolution-rate-limiter-simulation.mjs`.
- **Probes**: `probe-<feature>.mjs` in the same directory.

The `calculator-proof-design-proof-system` subdirectory name is historical (from the original calculator focus) — new simulations live alongside even if they're not calculator-domain.

### Template structure

Every simulation should:

1. **Import the bridge boilerplate** (see §1 methodology)
2. **Use the `attempt()` wrapper** for every bridge call so failures don't halt the run
3. **Use `logHeader(title)` between phases** for readable output
4. **Compute fingerprints if testing side-effect-free contracts** (see counterfactual-stress for the pattern)
5. **End with a findings summary** — `Total attempts: N, Failures: M, [if findings] dump them as JSON`
6. **Be deterministic** — constant clock, monotonic id allocator, no external state

### What to put in the simulation vs in a probe

- If you're testing *one specific contract*, write a probe with explicit PASS/FAIL assertions.
- If you're exploring an *integration surface* across multiple verbs to surface unknown defects, write a simulation that uses `attempt()` and lets findings accumulate.
- Every new probe ideally pins a previously-discovered defect. Every new simulation ideally surfaces new defects.

### Re-run conventions

- Output goes to stdout. Pipe to `tee run-output-NN-<label>.log` to capture.
- Log files numbered sequentially as `run-output-NN-<short-label>.log`.
- Logs are gitignored (in `docs/chester/working/`); they're scratch artifacts.

### Non-regression sweep after any fix

After implementing a fix, re-run **all four large simulations** plus the affected probes. The expected baselines are documented in §2 — any deviation that isn't a deliberate contract change is a regression.

---

## 6. Current baseline (as of git SHA `3d29478`)

If you re-run today, expect:

| Simulation | Attempts | Failures | Notes |
|---|---|---|---|
| calculator-fully-featured | 54 | 2 | Both correct-by-design closure refusals (unaddressed concerns) |
| adversarial-session-design | 47 | 3 | 1 intentional negative probe + 2 closure refusals from Option A's strict gate (elevate-and-defer no longer reaches closure) |
| evolution-rate-limiter | 34 | 1 | 1 intentional negative probe (reviseElement shape) |
| counterfactual-stress | 8 | 0 | Clean post-CF-Finding-A fix |

All 18 probes pass.

If your numbers differ, something has changed — check git log against `3d29478` and find what's drifted.

---

## 7. Artifacts and re-running

### File locations

- **Source code** (system under test): `skills/design-proof-system/references/`
- **Simulation scripts**: `docs/chester/working/stress-tests/calculator-proof-design-proof-system/*.mjs`
- **Logs**: same directory, `run-output-NN-*.log` (gitignored)
- **This catalog**: `docs/admin/design-proof-system-simulations.md`
- **Agent-facing usage doc**: `skills/design-proof-system/AGENT-USAGE.md`

### Running everything

```bash
cd docs/chester/working/stress-tests/calculator-proof-design-proof-system
for sim in calculator-fully-featured-simulation.mjs adversarial-session-design-simulation.mjs evolution-rate-limiter-simulation.mjs counterfactual-stress-simulation.mjs; do
  echo "=== $sim ==="; node $sim 2>&1 | grep -E "Total attempts|Failures:|Total findings"
done
for probe in probe-*.mjs; do
  echo "=== $probe ==="; node $probe 2>&1 | grep -E "PASS|FAIL" | head -10
done
```

### Adding a new probe quickly

The smallest probe template (copy from `probe-overlap-scope.mjs` or `probe-withdraw.mjs` for a recent example):

```js
import { Engine } from '<paths>/Engine.js';
import { createDomainBridge } from '<paths>/domain-bridge.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES } from '<paths>/tags.js';

function freshSetup() { /* boilerplate */ }
const consent = { source: CONSENT_SOURCES.DESIGNER };

console.log('--- Test 1: <what> ---');
{
  const bridge = freshSetup();
  // ... exercise the contract
  const ok = /* assertion */;
  console.log(`  result: ${ok ? 'PASS' : 'FAIL'}`);
}

// Add more tests as needed.
```

---

## 8. Maintenance notes

### When to update this catalog

- New simulation added → add a §2.x subsection
- New probe added → add a bullet to §3
- New finding fixed → add a row to §4
- Baseline shifts (e.g., new intentional refusal) → update §6
- Contract changes that affect re-run expectations → update §6 + the affected §2.x

### Decay risk

This catalog is most accurate at the time it's written. Each new fix that changes simulation behavior risks making §6's baseline stale. If you run a simulation and the numbers don't match, **don't assume the catalog is wrong** — check git log for changes between the documented SHA and HEAD. The numbers might have legitimately drifted; or someone added a fix and forgot to update this doc.

The §4 findings table is the most durable section — finding IDs persist even when the codebase moves around them. If a row's listed commit doesn't appear in `git log`, the commit was probably rebased or amended; search by the commit message.

### Versioning

Document references git SHA `3d29478` (HEAD of `main` at time of writing). Subsequent fixes should update §4 (new rows), §6 (baseline numbers), and the versioning anchor here. If you're reading this and the current HEAD is significantly past `3d29478`, treat §6 as a starting point to validate against rather than ground truth.
