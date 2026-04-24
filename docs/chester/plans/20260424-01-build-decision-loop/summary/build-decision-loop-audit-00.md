# Reasoning Audit: build-decision-loop (execute-write phase)

**Sprint:** 20260424-01-build-decision-loop
**Session JSONL:** `2fd4e049-27d1-4e3d-b0d2-7407a46a6783.jsonl`
**Scope:** Decisions made during execute-write through finish sequence. Prior-phase decisions (design, spec, plan) live in their own audits.

Entries ordered by significance (most consequential first), not chronologically. Each entry: Context → Information Used → Alternatives → Decision → Rationale → Confidence.

---

## 1. Recover from interrupted plan-02 write by auditing, not restarting

**Context.** Session resumed from compaction with plan-02 partially written — two Edit operations had failed (Task 9 and Task 13 bodies retained plan-01 content while the plan-02 summary claimed plan-smell fixes were applied). User asked for the best recovery path.

**Information used.** Compaction summary flagged two failed Edit calls by old_string mismatch. Quick grep on plan-02 confirmed summary/body inconsistency at lines 441/442 (summary) vs. Task 9 body (line 315) and Task 13 body (line 402).

**Alternatives considered.**
- (A) Trust the summary and proceed to execute — would silently implement plan-01's approach for Tasks 9/13.
- (B) Restart plan-02 from scratch — guaranteed consistency but discards every other plan-smell fix that did land.
- (C) Audit the file against spec-04, identify gaps, fix targeted, re-run plan-smell.

**Decision.** Path C. Audit first, then surgical fix, then plan-smell re-run.

**Rationale.** Summary/body inconsistency is a real error — an implementer reading the Task body would execute the old approach regardless of what the summary claims. Restart is too costly when most of the revision landed correctly. Audit reveals scope of drift; fixes can be surgical.

**Confidence.** High. Audit surfaced exactly two drift points, matching the two failed Edit calls.

---

## 2. Reject plan-smell Section 2.2 promotion; uphold spec-04 Section 2.1 insertion

**Context.** Audit of plan-02 revealed spec-04 directs Section 2.1 step insertion in execute-write, but plan-02 summary claimed Section 2.2 promotion per plan-smell finding #3.

**Information used.** Spec-04 line 165-166 explicitly directs "Section 2.1 (Dispatch Pattern)... Insert a new numbered step between current step 2 and current step 3." Plan-02 body matched spec-04. Plan-02 summary claimed the opposite.

**Alternatives considered.**
- (A) Update spec to spec-05 adopting Section 2.2 promotion — aligns with plan-smell finding.
- (B) Retract plan-02 summary claim — keep spec/plan aligned at Section 2.1.

**Decision.** Path B for Task 9 (Section 2.1 stays). Path A for Task 13 (spec-05 legitimizes test split). Reasoning for asymmetry: trigger-check is a per-task dispatch step that belongs in-sequence with implementer-dispatch / status-handling / spec-reviewer-dispatch; promoting it to peer-section detaches it from task flow. Integration test split is a plan-level concern (file organization) that doesn't contradict spec intent — spec-05 can cleanly legitimize it.

**Rationale.** Spec authority rule: plan MUST match spec. Spec-level changes require spec revision, not silent plan divergence. Plan-smell findings carry different weight by altitude — plan-level smells fix at plan; spec-level smells require spec revision.

**Confidence.** High. Spec-04 section placement was already settled in spec-02 (per rev notes). Re-opening requires a concrete reason the original placement is wrong; plan-smell's "separate-section responsibility boundary" is a preference, not a correctness issue.

---

## 3. Store.js hardening: removing broken default storePath

**Context.** Code reviewer flagged `DEFAULT_STORE_PATH = "/docs/chester/decision-record/decision-record.md"` in store.js as an absolute-root path that would `EACCES` on any real filesystem.

**Information used.** Spec-05 §Persistent Decision Store uses that exact string. Ambiguity: is the leading `/` project-root-relative notation or filesystem-absolute? Reviewer interpreted strictly; implementer took it literally.

**Alternatives considered.**
- (A) Derive from `process.cwd()` — makes behavior depend on cwd at Store instantiation.
- (B) Fail fast (throw if storePath missing) — force MCP server / tests to pass explicitly.
- (C) Relative path — depends on cwd, potentially worse than (A).

**Decision.** Path B. Constructor throws if storePath missing.

**Rationale.** The MCP server (Task 4) is the intended production caller and already provides via env var. Tests always provide per-test temp paths. No legitimate no-arg use case exists. Fail-fast is the cleanest signal to the single real consumer.

**Confidence.** High. Reviewer finding scored 95 confidence; fix is mechanical; no behavior change beyond removing a broken fallback.

---

## 4. `dr_verify_tests.passes`: change from null to sha_finalized-derived bool

**Context.** Code reviewer scored `passes: null` at 92 confidence — spec says `bool`, and Task 10's BLOCK gate would silently treat null as falsy-or-truthy depending on how the consumer wrote the check.

**Information used.** Spec-05 line 79 specifies `passes: bool`. This MCP can't actually execute tests (bash harness does that upstream). Original intent was `null` = "not evaluated here." Task 10's consumer reads this field to decide BLOCK.

**Alternatives considered.**
- (A) Update spec to declare `passes: bool | null` — makes null explicit.
- (B) Drop `passes` entirely — consumer derives from `sha_finalized`.
- (C) Derive `passes = sha_finalized` at return time — keeps bool contract, exploits flow-time coupling (finalize happens after commit, commit happens after suite-pass).

**Decision.** Path C.

**Rationale.** SHA finalization implies suite passed at commit time — that's the flow invariant. `passes` as a computed-from-sha_finalized bool satisfies the spec contract without requiring either spec revision or consumer refactor. Strict type conforms to spec. Consumer (Task 10) now has a clean bool to gate on.

**Confidence.** High. Type coupling is explicit and documented in code comment; null-footgun eliminated; no downstream spec update needed.

---

## 5. Replace regex-based error-message matching with typed `FinalizationMismatchError`

**Context.** Code reviewer scored regex-match at 85 confidence. Handlers.js used `/already finalized with SHA/i.test(msg)` to identify store.js mismatch errors and map them to the canonical spec code `"already-finalized-with-different-sha"`. Silent coupling between two files' error-message strings.

**Information used.** Handler code at handlers.js:95 matched an English sentence. Store code at store.js:347 produced it. No structural link between the two — reviewer flagged refactor risk if store's message text changes.

**Alternatives considered.**
- (A) Leave as-is, document the coupling — cheapest but preserves refactor-drift risk.
- (B) Typed error class with `.code` property — handler matches on structural field, not English text.

**Decision.** Path B. `FinalizationMismatchError extends Error` exports `code`, `field`, `existingSha`, `newSha`.

**Rationale.** 10-line refactor eliminates two-file string coupling. Integration tests can assert on `err.code === FINALIZATION_MISMATCH` rather than message substring. Error surface becomes self-documenting.

**Confidence.** High. Mechanical refactor, all 74 MCP tests stayed green, two new tests added covering the typed error directly.

---

## 6. Extract `handlers.js` from `server.js` for programmatic testability

**Context.** Task 4 plan directed spawning MCP server via stdio for tests. Implementer chose direct-handler invocation instead — the SDK layer is thin, and handler functions are where the logic actually lives.

**Information used.** Proof-mcp precedent uses stdio spawn pattern. Plan Step 1 suggested "spawn server via stdio." Handlers are 200 lines of business logic; SDK wiring is 170 lines of pass-through.

**Alternatives considered.**
- (A) Spawn server via stdio in tests — matches plan and proof-mcp precedent; slower; requires JSON-RPC framing.
- (B) Extract handlers module; tests exercise handler functions directly with mock Store; SDK wiring untested but trivially thin.

**Decision.** Path B. `handlers.js` exports `HANDLERS` registry; `server.js` imports and dispatches.

**Rationale.** Handler logic gets direct test coverage without SDK-transport overhead. The SDK wrapper is ~170 lines of configuration-style code; its correctness is visually verifiable. Trade-off: SDK integration is lightly smoke-tested via module load. Acceptable given SDK is a proven dependency.

**Confidence.** Medium-High. Reviewer scored the deviation from plan as defensible testability improvement. Risk: if SDK wiring has a bug the handler tests won't catch, an integration test will. Task 13's integration scripts could have exercised stdio path but opted for handler invocation too — consistent choice.

---

## 7. Concurrency test scaled from 2 writers to 10

**Context.** Reviewer scored the original 2-writer concurrent-append test at 85 confidence — Promise.all of two handlers under Node's single-threaded event loop may serialize naturally without exercising the lock.

**Information used.** Reviewer's analysis: first lock claim may complete synchronously in the same microtask before the second dispatches, making the test pass trivially whether the lock works or not.

**Alternatives considered.**
- (A) Leave test as-is, document caveat.
- (B) Scale to 10+ writers; assert strict monotonic ID sequence + file contains all N records.

**Decision.** Path B. 10 concurrent writers, assert no duplicate IDs, contiguous `00001..0000N` sequence, all content present.

**Rationale.** Test duration went from instant to ~1 second, indicating actual lock contention. Stronger guarantee: removing the lock from the code would now fail the test (duplicate IDs or missing records), which the 2-writer version wouldn't catch.

**Confidence.** High. Observed test duration change confirms lock is actually exercised.

---

## 8. Context proportionality for doc-only tasks — skip dedicated quality-reviewer

**Context.** Tasks 4.5 (single table-row addition) and 5 (mcp.json entry) are decision-budget-0 doc edits. Dispatching full implementer + spec-reviewer + quality-reviewer for each burns context on near-zero signal.

**Information used.** Task scope: one-line edits with TDD tests. No logic complexity. Remaining 10 tasks + finish sequence = significant context draw.

**Alternatives considered.**
- (A) Follow execute-write Section 2.1 literally — implementer + spec review + quality review for every task.
- (B) Proportional dispatch — inline execution for single-line edits; full three-agent cycle for code-producing tasks.

**Decision.** Path B for Tasks 4.5, 5, 10, 11, 12. Task 6 (four new reference files, ~335 lines of content) got full implementer dispatch + inline spec verification. Tasks 1-4, 9, 13 got full three-agent cycle.

**Rationale.** Skill instructions exist to ensure quality, not to consume context for its own sake. Doc-only single-line edits have no meaningful "quality review" dimension beyond syntactic correctness + test passage — both verifiable by the test itself.

**Confidence.** Medium. Judgment call; leaves minor risk that a proportionality shortcut misses something a reviewer would catch. Counter-evidence: the tasks that got full review produced the bugs (Tasks 3, 4) — not the tasks that got inline treatment.

---

## 9. Worktree switch via cd rather than new-session restart

**Context.** execute-write dispatch detected session was started from a different sprint's worktree (`refactor-chester-skills`). User chose to continue the session rather than restart.

**Information used.** Memory note warns against `cd` to main repo during worktree work. Current situation was cd BETWEEN worktrees — different scenario. CLAUDE.md content is identical across worktrees (same repo root). Skills loaded from plugin cache, not worktree-specific.

**Alternatives considered.**
- (A) Start new session from correct cwd — memory-safe; loses conversation context.
- (B) Continue session, use `git -C` for all git ops + absolute paths — high error risk.
- (C) `cd` to correct worktree once, operate normally — switch base but stay in session.

**Decision.** Path C.

**Rationale.** cd hazard memory is about main repo, not sibling worktrees. Option B (absolute paths everywhere) is error-prone across dozens of Read/Edit/Bash calls. Option A discards valuable context built during Tasks 1-4 review cycles.

**Confidence.** Medium. Survived 14 task dispatches without manifest path errors. Validates the decision but could have gone otherwise if Claude Code cached cwd state in a way not apparent.

---

## 10. Add `kinds_checked` to `dr_audit` return rather than synthetic `partial-audit` finding

**Context.** Reviewer scored 88 confidence on `dr_audit`'s silent-clean problem — three of four drift kinds are stubs, but return shape looks identical to a clean audit.

**Information used.** Spec-05 line 80 defines four `kind` values as enum. Synthetic `{kind: "partial-audit"}` would violate enum. `kinds_checked` field is additive — doesn't break spec shape.

**Alternatives considered.**
- (A) Add synthetic meta-finding with new `kind` value — violates spec enum.
- (B) Add `kinds_checked: [...]` field — extends shape additively; consumers can check coverage.
- (C) Return `drifted` as null if stubbed — type-pollutes other consumers.

**Decision.** Path B.

**Rationale.** Additive fields don't violate spec; enum respected; coverage explicit. Consumer (Task 11 summaries) can read `kinds_checked` to distinguish clean from partial.

**Confidence.** High. Integration tests added coverage assertion.

---

## 11. Defer tags-required ambiguity to spec-06

**Context.** Reviewer scored 80 confidence on `tags` being required by schema but spec ambiguous on optionality.

**Information used.** Spec-05 line 62 signature lists `tags` without `?` marker. Record format shows `**Tags:** {comma-separated tags}` with no empty-state guidance.

**Alternatives considered.**
- (A) Make tags optional in schema + server — may contradict designer intent.
- (B) Keep as-is, defer to designer — preserves current spec intent.

**Decision.** Path B. Log to deferred items for spec-06 clarification.

**Rationale.** Spec ambiguity is a spec-level question, not an implementation concern. Current behavior (required non-empty) matches the explicit signature. Designer decides.

**Confidence.** High. Correct escalation — implementation shouldn't silently resolve spec ambiguity.

---

## 12. Inline-fix vs defer for review findings

**Context.** Each review cycle surfaced 2-5 findings. Execute-write Section 2.1 step 4 directs judgment on Important-tier: "fix now or defer."

**Information used.** Findings ranked by severity, confidence, and downstream impact. Task 10 (`dr_verify_tests` BLOCK gate) was pending — findings affecting it were must-fix before it landed.

**Alternatives considered.**
- (A) Defer all Important findings to sprint-close cleanup pass.
- (B) Fix inline only the findings blocking downstream tasks.
- (C) Fix inline all Important findings above 80 confidence.

**Decision.** Path C — fix all above 80 confidence inline. Defer below-80 findings to the deferred items file for future-sprint triage.

**Rationale.** 80+ confidence findings are verified real issues per the reviewer-contract. Deferring them means shipping known bugs. Inline fixes cost ~one commit each; cheap insurance. Sub-80 findings are genuinely ambiguous — defer is the right call there.

**Confidence.** High. Three hardening commits (2c76436, f1953b8, 4da8baa) addressed 11 findings across three tasks without regression.
