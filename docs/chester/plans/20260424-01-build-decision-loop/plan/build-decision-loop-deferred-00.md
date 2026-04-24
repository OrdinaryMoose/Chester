# Deferred Items — 20260424-01-build-decision-loop

## 2026-04-24 | Task 1 | `.gitkeep` added to pre-provisioned store directory

**Description:** Plan-02 and spec-05 assumed `docs/chester/decision-record/` was pre-provisioned and committed on main. Reality at BASE_SHA `d59895b`: directory absent in worktree (git does not track empty dirs; on main it exists as an untracked filesystem artifact). Implementer added `.gitkeep` to make the directory real in git so subsequent tasks can rely on it.

**Why deferred:** Not a blocker — `.gitkeep` is standard practice and adjacent tasks (Task 3 creates `decision-record.md` alongside it) work unmodified. Flagged for reviewer awareness in case spec-05 documentation should be updated to say "create a `.gitkeep` placeholder" rather than "verify pre-provisioned."

**Resolution options at sprint-close:**
- Accept `.gitkeep` as permanent (aligned with common practice).
- Delete `.gitkeep` once Task 3's `decision-record.md` lands (real file makes placeholder redundant).
- Update spec-05 / plan-02 wording in a future revision to describe the `.gitkeep` scaffold step explicitly.

## 2026-04-24 | Task 3 | Minor Store.js findings from code review (not addressed)

Fixed inline in commit `f1953b8`: broken `/docs/...` default storePath, `finalizeRefs` empty-current bug, `this._release` concurrency footgun, racy 2-writer concurrency test (now 10 writers).

Deferred as minor — not blocking:

- **Duplicate ID-computation logic.** `append` inlines the regex/scan loop also present in `nextId()`. Extract to private `_computeNextIdFromContent(content)` helper.
- **`nextId()` public API contract.** Stateless read without lock means advisory-only; caller using the returned ID for a subsequent `append` has a TOCTOU race. Consider making private or documenting the advisory contract. `append` already overrides caller-supplied IDs under the lock, so current behavior is safe — cleanup only.
- **`query` `recency_days` silently drops unparseable IDs.** A hand-edited malformed record vanishes from recency filters. Consider warning or treating as "infinitely old."
- **`readSection` exact-match heading.** `### Trigger ` (trailing space) causes silent skip. Add `.trimEnd()` comparison.
- **`assembleBlocks` missing trailing newline.** Output file has no final `\n`. POSIX convention wants one. One-line fix.
- **Multi-line parser fragility.** `### ` or `## ` inside user-provided body text (Context/Rationale) truncates section. Consider capture-phase validator rule rejecting leading `### ` in body text, or escape on write.
- **Reserved SHA-suffix pattern.** If user Test/Code content ends in `@ [0-9a-f]{7,40}` by coincidence, `finalizeRefs` misinterprets as existing finalize. Low probability; document reserved suffix contract.

## 2026-04-24 | Task 4 | MCP hardening findings resolved + tags ambiguity deferred

Fixed inline in commit `4da8baa`:
- `dr_verify_tests.passes` field now strict bool (derived from sha_finalized) per spec-05 line 79 — no silent null that could bypass Task 10's BLOCK gate.
- `dr_audit` adds `kinds_checked: ["sha-missing"]` field so consumers (Task 11 summaries) can distinguish "checked and clean" from "not checked" (three of four drift kinds still stubbed — acceptable for this sprint per implementer's documented stub rationale).
- `dr_abandon` with missing sprint arg now returns structured `{status: "error", errors: [{field: "sprint", ...}]}` instead of silent zero-counts.
- `store.js` now exports `FinalizationMismatchError` class + `FINALIZATION_MISMATCH` code constant. Handler matches on `err.code` not on regex of English message text. Removes two-file string coupling.

**Deferred:**
- **Tags required vs optional (spec ambiguity).** Spec-05 line 62 lists `tags` in `dr_capture` signature without `?` marker suggesting optional. Schema.js treats all 16 fields as required non-empty strings at capture phase. If designer intends tags to be optional (e.g. permit empty tags for decisions with no tag relevance), spec-06 needs to declare that explicitly and both schema.js FIELDS + server.js required[] need updating. Current behavior: `tags: ""` fails validation with "required field must be a non-empty string." Flagging for designer clarification — not blocking this sprint.
- **Expand `dr_audit` drift kinds.** `test-missing`, `test-failing`, `code-moved` remain stubs. Requires filesystem + git introspection (Task layer doesn't have those yet). Candidate for a future sprint.
