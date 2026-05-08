# Proof MCP — Problems Report

**Date:** 2026-05-08
**Discovered during:** sprint-d-2 (cluster-d-build-shared-understanding)
**Source:** D.2 design session against proof MCP shipped in D.1 (commit `6387b3f`)
**Reference spec:** `sprint-d-1/design/cluster-d-proof-layer-crud-requirements.md`

This report consolidates all defects, gaps, and friction points encountered with the proof MCP server during the D.2 design session. Filed for D.3 (or future maintenance sprint) inheritance.

Defects are grouped by severity and indexed by element type / tool.

---

## Critical — Blocks Designer Intent

### D-1. `manage_concerns op:lock` blocks subsequent `op:add` (CRUD-completeness violation)

**Severity:** Critical — encountered as session blocker.

**Behavior:** After `manage_concerns op:lock` fires, subsequent `manage_concerns op:add` calls return `DOMAIN_ERROR: "Concerns are locked; cannot add"`.

**Spec position:** `cluster-d-proof-layer-crud-requirements.md` lists Concern Create as Closed (functional via `manage_concerns add`) and Concern Update via lock as Closed. The doc explicitly commits: "Every element type supports the full operation set." Lock semantics scoped to status transition (Draft → Ratified), not Create gate.

**Implementation drift:** Lock acts as set-seal against new adds. Contradicts D.1 design directive.

**Hit empirically:** D.2 session round 17. Designer surfaced new Concern (D2-C-12 future modifiability). `manage_concerns op:add` attempted; rejected. Workaround: encode content as RISK or NC; loses Concern-class semantics (no problem_anchor target for RC).

**Fix path:**
- Either remove the lock-blocks-add gate (lock becomes status marker, not seal)
- Or revise CRUD-completeness doc to redefine lock as set-seal and add an `op:reopen` to manage_concerns
- Or both: keep lock-as-seal for closure-gating purposes, add explicit `op:reopen` and document the seal semantics in the tool description

### D-2. `manage_concerns op:lock` is atomic with no per-Concern review path

**Severity:** Critical — encountered when designer wanted per-Concern review.

**Behavior:** `op:lock` takes no `concern_id` parameter. Single call seals all Concerns at once.

**Hit empirically:** D.2 round earlier in session. Designer said "lock concerns"; agent fired bulk `op:lock`; designer pushed back ("did we not have the option to review each concern to lock instead of a group lock? I wanted to review each").

**Fix path:**
- Add `op:lock` parameter `concern_id` for per-Concern lock
- Or split into `op:lock` (global) and `op:lock-one` (per-Concern)
- Or document lock as one-shot bulk seal in tool description (so agent + designer expectations align upfront)

### D-3. `manage_concerns` lacks `op:withdraw` (known D.1 gap)

**Severity:** Critical — already documented as carryforward in D.1 spec.

**Behavior:** Concerns cannot be withdrawn after add. Universal `withdraw` tool may route Concerns to internal `withdrawConcern` per D.1 architecture, but `manage_concerns` itself doesn't expose withdraw.

**Spec position:** `cluster-d-proof-layer-crud-requirements.md` lists Concern Delete as **"Gap. Known cluster C carryforward."**

**Hit empirically:** D.2 session — agent attempted `submit_proof_update.withdraw` for `CERN-1`; result was "element not found or not active." Suggests universal withdraw doesn't see Concerns either, or routing has bug.

**Fix path:**
- Add `op:withdraw` to `manage_concerns` matching the universal withdraw pattern
- Or fix universal `withdraw` routing to recognize CERN-N IDs
- Verify `withdrawConcern` internal function is reachable from any tool

---

## Important — Behavioral Surprises / Lifecycle Gaps

### D-4. RC ratify auto-clears Concern coverage closure_reason; Concern lifecycle stays orphaned

**Severity:** Important — silently collapses designer's two-cadence ratification intent.

**Behavior:** `ratify_resolve_condition` for an RC anchored to a Concern clears the Concern's "not covered by ratified RC or Rule" closure_reason. Concern itself stays in `draft` status. `manage_concerns op:ratify` (cluster-D-1 NC-18 / RULE-6) is a separate axis with no closure-gating consequence in current D.2 schema.

**Spec position:** Cluster-D-1 added per-Concern `status` field + `ratifyConcern` + `manage_concerns ratify op`. The lifecycle exists; the gate doesn't fire.

**Hit empirically:** D.2 round 15. Ratifying RCON-1 cleared CERN-1's gate; designer said "the intent was never that RC approval implied CN approval. The intent was the designer approved concerns which grounded the planning then once all worked out approve the RC."

**Fix path:**
- Add closure gate: "Concerns must be in `ratified` status before closure" — equivalent of cluster-D-1 NC-18 hard gate
- Or document the auto-coverage as a feature; require designer to opt into per-Concern ratify if they want it
- Either way, document the relationship clearly in tool descriptions for `ratify_resolve_condition` and `manage_concerns op:ratify`

### D-5. `manage_concerns op:ratify` requires `concern_id` but no clear lifecycle entry point

**Severity:** Important — designer-flow ambiguity.

**Behavior:** `op:ratify` is per-Concern. No prompt mechanism in skill flow tells agent when to ratify. Without a hook in the round-cycle queue, ratify firings are designer-initiated only or skipped entirely.

**Hit empirically:** D.2 session — Concerns sat in `draft` through 17 rounds despite designer's stated intent for up-front ratification. Path 1 NC (NCON-17) was added in D.2 to encode the ratify-on-creation discipline; this is a skill-level fix, not an MCP fix.

**Fix path:**
- MCP-level: add automatic ratify prompt to `manage_concerns op:add` flow ("Concern added; ratify now?")
- Skill-level: NCON-17 already handles this for D.2; D.3 should propagate to other proof-using skills

### D-6. `submit_proof_update` accepts batch `operations` array; conflicts with strict-mode "ONE op per call"

**Severity:** Important — tool surface invites multi-op shape that strict mode (RULE-16 hook 3) prohibits.

**Behavior:** `operations` is an array. Multiple operations accepted in one call. Each gets its own success/error entry in response.

**Hit empirically:** Not directly during D.2, but RULE-16 hook 3 was authored explicitly to close this drift. Designer flagged the tightening as load-bearing.

**Fix path:**
- Tool-level: enforce `operations` array length = 1 in schema validation
- Or document the recommendation in tool description (less binding)
- Or accept multi-op but require per-op consent tokens in array

---

## Moderate — Detection / Visibility Issues

### D-7. Stall detector counts only NCs

**Severity:** Moderate — false-positive ontologist challenges during ratification phase.

**Behavior:** `condition_count` flat for 3 consecutive rounds → ontologist challenge mode triggers. Stall detector ignores Rule, RC, Permission, Risk, Definition adds as legitimate proof advancement.

**Hit empirically:** D.2 rounds 13-16 — Rule + RC + Permission work classified as stall.

**Fix path:**
- Stall detector should count any element-add or revise as advancement
- Or expose `total_active_elements` flat-for-N rounds as the trigger

### D-8. `get_proof_state` doesn't expose lock state at top level

**Severity:** Moderate — agent + designer must discover lock state by attempting and reading rejection.

**Behavior:** State response includes `concerns[]` array with per-Concern fields, but no top-level "concerns_locked: true/false" flag. Lock state has to be inferred or rediscovered.

**Hit empirically:** D.2 round 17 — agent didn't know lock blocked add until attempting and reading `DOMAIN_ERROR`.

**Fix path:**
- Surface `concerns_locked` as top-level flag in `get_proof_state` response
- Echo current lock state in response of any successful `manage_concerns` op

### D-9. `get_proof_state` response can exceed 25K token limit

**Severity:** Moderate — blocks state inspection during long sessions.

**Behavior:** D.2 round 17 had 42 elements. `get_proof_state` returned 74,530 characters; tool harness rejected output as oversized; required reading from disk file via jq.

**Hit empirically:** D.2 multiple times. Bash + jq workaround viable but adds friction.

**Fix path:**
- Add `summary_only: true` parameter that returns counts + IDs without full element bodies
- Or paginate response by element type
- Or add element-list-only mode

---

## Lower — Documentation / Consistency Gaps

### D-10. `manage_definitions` and `withdraw` not surfaced in session tool catalog

**Severity:** Lower — observed but workaround exists (deferred to glossary in Understanding state).

**Behavior:** `manage_definitions` (NC-7) and `withdraw` (PERM-1, NC-5, NC-6) were registered in `server.js` per D.1 implementation but didn't appear in the live session tool catalog after `/refresh-chester` + `/reload-plugins`. MCP server processes don't restart on plugin reload.

**Hit empirically:** D.2 session — designer asked about G1 promotion via `manage_definitions`; agent confirmed registered in source but tools not visible. Deferred.

**Fix path:**
- Plugin reload flow needs MCP-server-restart step or warning
- Or skill SKILL.md should document the restart requirement explicitly

### D-11. Rule add via `submit_proof_update` succeeded with `source: designer`; semantics unclear vs. RULE-9

**Severity:** Lower — worked, but the relationship between RULE-9 (only designer creates Rules) and the schema-level `source` field deserves documentation.

**Hit empirically:** D.2 added RULE-16 and RULE-17 via `submit_proof_update op:add type:RULE source:designer`. Worked. RULE-9 says "agent surfaces candidate Rule in commentary for designer ratification but does not auto-add Rules" — so the path is: agent drafts text, designer accepts, agent fires add with `source: designer` and verbatim accept rationale. This path is correct under strict mode but not directly documented.

**Fix path:**
- Document in tool description: Rule add requires `source: designer` AND consent rationale containing designer's accept text
- Or make this a tool-level pre-condition check

### D-12. Withdrawn elements visible in unfiltered queries

**Severity:** Lower — but caused agent to mislead designer once.

**Behavior:** `select(.type=="RULE")` without status filter returns all 15 Rules including withdrawn. Agent constructed compressed rules list with the unfiltered output and presented 15 to designer; only 7 were active.

**Fix path:**
- Documentation: emphasize `.status == "active"` filter is required for live state queries
- Or add `get_proof_state(active_only: true)` parameter

### D-13. Definitions G1 promotion missing in tool surface

**Severity:** Lower — deferred work; documented in cluster-D-1 known remaining items.

**Behavior:** Definitions exist in proof schema but no end-to-end create-and-promote flow surfaced. G1 slot promotion path unclear from tool docs alone.

**Hit empirically:** D.2 deferred; glossary stays in Understanding MCP state.

---

## Summary Table

| ID | Severity | Surface | Spec? | Workaround |
|---|---|---|---|---|
| D-1 | Critical | `manage_concerns op:add` rejected post-lock | Drift from CRUD doc | Use RISK/NC class |
| D-2 | Critical | `op:lock` no per-Concern path | Drift | Document upfront |
| D-3 | Critical | No Concern withdraw | Known gap | None usable |
| D-4 | Important | RC ratify auto-covers Concern | Lifecycle gap | NCON-17 / PERM-1 split |
| D-5 | Important | No ratify-prompt mechanism | Skill-level | NCON-17 |
| D-6 | Important | `operations[]` invites multi-op | Strict-mode collision | RULE-16 hook 3 |
| D-7 | Moderate | Stall counts NCs only | Behavioral | Ignore false stalls |
| D-8 | Moderate | Lock state not visible in state | Visibility | Attempt and read error |
| D-9 | Moderate | `get_proof_state` size > 25K | Tool harness | jq fallback |
| D-10 | Lower | Tools registered but not catalog-visible | Plugin reload | Defer / restart |
| D-11 | Lower | Rule add semantics undocumented | Doc gap | Strict-mode rationale |
| D-12 | Lower | Withdrawn elements in unfiltered query | Doc gap | Status filter discipline |
| D-13 | Lower | Definition G1 promotion missing | Known remaining | Glossary in Understanding |

---

## Cross-Cutting Observations

### CRUD-completeness directive vs. implementation

D.1 design committed to "every element type supports the full operation set." Implementation falls short:
- Concerns: Create blocked post-lock; no Update field-revise; no Delete
- Definitions: Create exists, Update/Delete unclear, tool catalog inconsistency
- Risks/Permissions: Create works, Delete unclear

D.3 (or maintenance sprint) should systematically audit each element type × CRUD operation against the directive and close gaps.

### Tool-surface-vs-schema disconnect

Several issues stem from tool-surface choices that conflict with implicit schema constraints:
- `submit_proof_update operations: []` accepts any length; strict-mode requires 1
- `manage_concerns op:lock` has no `concern_id`; designer expected per-Concern review
- `withdraw` claims universal coverage but doesn't see Concerns

A tool-design pass for D.3 could realign tool surfaces with their actual schemas + designer-expected semantics.

### Visibility surface gaps

State exposure is wide (full element bodies) but lacks the small flags users actually need (locked, can-add, ratifiable). Adding 3-4 top-level flags to `get_proof_state` response would close most visibility gaps.

---

## Recommendation

**Most-bang-for-buck D.3 fixes (in order):**

1. **D-1 + D-2 + D-3** — fix the Concern CRUD trio. The whole lock vs. ratify vs. withdraw semantics needs alignment with the CRUD-completeness directive. Probably the largest single block of value.
2. **D-4** — decide whether Concern lifecycle ratify is a real closure gate or not, and document the chosen answer.
3. **D-9** — `summary_only: true` flag on `get_proof_state`. Tiny change, big quality-of-life improvement.
4. **D-7** — stall detector fix. Tiny change, removes ongoing false signal.
5. **D-8** — top-level lock visibility. Tiny change, prevents the lock-discovery friction we hit.

D-10, D-11, D-12, D-13 are documentation / minor tool surface fixes; can batch into a sweep.

**Important inheritance for D.3:** Many of these defects were known or partially documented in D.1 spec but slipped through implementation. The CRUD requirements doc is authoritative; D.3 should treat it as the rubric for "is the proof MCP correct?"
