---
id: dr-20260501-01-audit-time-emission
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Retrospective audit-time emission of decision records
decision: Decision records are emitted at finish-write-records during the reasoning-audit pass, derived from the same JSONL session transcript that the audit reads, with no mid-stage capture anywhere in the pipeline.
rationale: The reasoning-audit pass already discriminates substantive decisions from a complete-session JSONL source, so piggybacking emission on it reuses validated discrimination, fires outside the build cadence, and naturally covers all stages (design-large-task through execute-write) in one pass. Earlier-cycle capture would fragment across skill points, rely on agent memory rather than authoritative transcript, and duplicate the audit's discrimination logic. This commitment locks the capture moment to retrospective and forbids any per-decision or per-stage trigger in future sprints unless this record is superseded.
alternatives:
  - Per-decision MCP capture at each substantive moment in design-specify and plan-build — rejected because it requires new skill steps at every decision point, costs tokens proportional to decision count, and duplicates audit discrimination without the JSONL source.
  - Stage-close emission at end of design-specify and plan-build — rejected because it fragments capture across skill points, gives only partial coverage versus the audit's whole-session reach, and relies on session memory rather than transcript.
  - Plumb-style commit-time gate that intercepts conversation and blocks commit until reviewed — rejected because it is inverse-coupled to spec quality (fires less when specs are good) and adds gate friction at commit time.
tags: [architecture, capture, process]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260501-02-parallel-fork-pattern
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-specify
title: Parallel-fork pattern for audit and records emission
decision: At finish-write-records Step 3 the primary resolves the JSONL transcript path once and dispatches two Agent calls in a single message, forking subagent A for the reasoning audit and subagent B for the records emission, both inheriting transcript context via CLAUDE_CODE_FORK_SUBAGENT=1.
rationale: Two parallel forks from one parent let each output run under its own discrimination filter while sharing the transcript-resolution work and avoiding any primary-resident discriminator. A single forked subagent that produced both outputs would couple the two filters; a chained dispatch (audit then records) would serialize and force one to inherit the other's selections. Future emission-style features inside finish-write-records should follow this same parent-orchestrated parallel-dispatch shape.
alternatives:
  - Single subagent producing both audit and records — rejected because it forces filter coupling and removes the freedom to tune altitudes independently.
  - First-subagent discriminator that produces a candidate set, then a second subagent splits it — rejected because the first agent's altitude choice constrains both outputs and the architecture was explicitly locked by the designer to two independent forks over the same source.
  - Primary-resident discriminator that scans the transcript itself — rejected because it inflates the primary's context cost and re-implements logic the audit fork already performs.
tags: [architecture, skill, capture]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
  - working/20260501-01-fix-decision-record/plan/fix-decision-record-plan-00.md
---

---
id: dr-20260501-03-no-mcp-rule
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Decision-record system uses no MCP server
decision: The decision-record system is implemented entirely via direct file I/O at the skill level; no MCP server mediates capture, query, supersession, or validation, and the prior chester-decision-record MCP package is removed from the repo and from .claude-plugin/mcp.json.
rationale: The prior MCP-mediated system shipped 2026-04-24 was inverse-coupled to upstream spec quality and never fired in production despite being functional and tested. Direct file I/O at finish-write-records is sufficient for a single append-only markdown corpus and removes a class of integration boundaries from the capture path. Future sprints proposing capture or query enhancements must implement them in skill prose plus shell tooling, not by adding a server.
alternatives:
  - Keep the chester-decision-record MCP and rebuild only its trigger surface — rejected because the inverse-coupling failure was structural, not trigger-shape, and the existing 11-field schema demanded values (spec_update, test, code) that have no natural source at design-specify or plan-build moments.
  - Replace with a thinner MCP that only stores records — rejected because no per-record validation is wanted (NG-4 accepts tag drift) and a server adds no value over direct file append.
tags: [mcp, architecture, revert, governance]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260501-04-no-tdd-loop-participation
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Capture does not participate in the TDD write loop
decision: Decision-record capture never gates test-first, implement, or test-pass discipline anywhere in execute-write; the per-task implementer plus spec-reviewer plus quality-reviewer chain runs uninterrupted by record state.
rationale: The 2026-04-24 trigger-check + propagation step inside execute-write coupled record state to the build cadence and was one source of the inverse-coupling failure. Holding capture out of the build loop preserves cadence stability and keeps build review gates focused on code correctness. Future capture features must fire only at finish time and must not introduce read, write, or query against the corpus from any execute-write step.
alternatives:
  - Per-task trigger-check that propagates record state across build tasks — rejected because it inverse-couples capture to build cadence and was the failed prior design.
  - Mid-build advisory hook that records without blocking — rejected because any read or write inside the loop adds noise to TDD review and violates the goal of keeping execute-write minimal.
tags: [process, governance, revert]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260501-05-cooperative-coexistence
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Records and session artifacts coexist cooperatively
decision: Decision records do not replace session-level artifacts; both surfaces may carry duplicate information, with session artifacts (brief, spec, plan, audit, summary) serving session-internal recall and decision records serving cross-sprint trend-finding.
rationale: Session artifacts answer "what did this sprint do" and are read inside the sprint that produced them; records answer "what's been decided about X across sessions" where reading every prior session's artifacts is impractical. Duplication between the two surfaces is acceptable and expected. Future agents must not treat the corpus as authoritative over the in-sprint artifacts, nor vice versa.
alternatives:
  - Make records the canonical store and stop writing per-sprint summaries/audits — rejected because session-internal recall has different access patterns and altitude than cross-sprint queries.
  - Make session artifacts the only store and skip the corpus — rejected because cross-sprint discoverability requires a single grep-able surface that does not exist when knowledge is scattered across per-sprint directories.
tags: [architecture, convention, capture, audit]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
---

---
id: dr-20260501-06-parallel-filter-independence
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Audit and records filters are independent
decision: The reasoning-audit filter and the decision-record filter are documented in separate reference files and apply independent discrimination criteria over the same JSONL source; a decision selected by one filter need not be selected by the other and neither filter is constrained to be a subset or superset of the other.
rationale: The audit serves session-internal recall and the records serve cross-sprint trend-finding, so the two altitudes have different relevance criteria — a minor decision can be session-noise yet cross-sprint-precedent. Coupling the filters strips the freedom to tune each surface independently and forces records to inherit the audit's session-altitude discrimination. Future filter changes apply to one surface at a time unless explicitly noted.
alternatives:
  - Single shared filter that both forks apply — rejected because it loses cross-sprint-vs-session-recall altitude tuning.
  - Records strict subset of audit (records select only what the audit also selects) — rejected because precedent-setting decisions can be session-noise and would never reach the corpus.
  - Records strict superset of audit — rejected because the records altitude is not "more inclusive everywhere"; some session-recall items are not cross-sprint-relevant.
tags: [convention, capture, audit]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
  - skills/finish-write-records/references/decision-record-filter.md
---

---
id: dr-20260501-07-yaml-frontmatter-format
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-specify
title: Eleven-field YAML-frontmatter record shape
decision: Each decision record is a YAML frontmatter block bounded by --- lines carrying exactly eleven fields in this order: id, date, sprint, stage, title, decision, rationale, alternatives, tags, supersedes, artifact_refs.
rationale: Future agents query the corpus mechanically via grep, awk, and frontmatter parse; structured fields with stable ordering keep query simple and resist tag drift. The field set adapts the existing reasoning-audit entry shape (title, alternatives, decision, rationale) and adds cross-sprint affordances (id, sprint, stage, tags, supersedes, artifact_refs). Future record-shape changes must extend rather than reorder; reorderings break grep -A / grep -B procedures that depend on field-line offsets.
alternatives:
  - Free-form prose entries — rejected because query becomes LLM-judgment-mediated parsing and tag drift breaks grep.
  - JSON Lines (one record per line) — rejected because the corpus is human-readable too and YAML frontmatter matches established markdown conventions.
  - Per-file-per-record directory — rejected at NC-03 because it breaks the single grep-able corpus property.
tags: [format, convention, capture]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
  - skills/finish-write-records/references/record-formats.md
---

---
id: dr-20260501-08-single-file-corpus
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Single append-only corpus at fixed path
decision: Decision records live as appended entries in a single markdown file at docs/chester/decision-record/decision-record.md; new records append, prior records are never modified, and the path is hardcoded with no project-config indirection.
rationale: A single file at a canonical path supports grep-based query without directory traversal and lets future-agent procedures hardcode the path. Append-only preserves the historical decision trail intact, so superseded records remain visible and the supersession chain can be walked forward in time. Future enhancements must not split the corpus across files, mutate prior entries to mark supersession, or move the path behind config.
alternatives:
  - Per-file-per-record under docs/chester/decision-record/ — rejected because it breaks single-grep query and forces directory-listing conventions.
  - Mutate prior records to add a back-pointer when superseded — rejected because it breaks append-only and loses the historical trail.
  - Project-config-resolved corpus path — rejected because hardcoding lets future-agent procedures avoid config reads.
tags: [architecture, convention, format]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260501-09-forward-scan-supersession
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-specify
title: Supersession discovered by forward awk scan
decision: To find what supersedes a given record id, scan forward over the corpus with awk, capturing the most recent id: line preceding any supersedes: line that names the target id; the prior record is never modified and carries no back-pointer.
rationale: Append-only invariant forbids editing the prior record to add a back-pointer, so the supersession relation is encoded only on the newer record; forward scan recovers it deterministically. The grep -B1 alternative does not work because YAML field order places tags: immediately before supersedes:, so -B1 returns the tags line, not the id; awk-with-state or grep -B 12 is required. Future supersession-query tooling must follow this awk pattern or its grep -B 12 equivalent.
alternatives:
  - grep -B1 "^supersedes: dr-<id>$" — rejected because YAML field ordering makes -B1 capture the wrong line.
  - Maintain a separate supersession index file — rejected because it duplicates state outside the append-only corpus and creates a second source of truth.
  - Walk a linked-list back-pointer on the prior record — rejected because it requires mutating the prior record and breaks append-only.
tags: [convention, format, tool]
supersedes: null
artifact_refs:
  - skills/finish-write-records/references/decision-record-filter.md
---

---
id: dr-20260501-10-surgical-revert-strategy
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-large-task
title: Surgical revert of 2026-04-24 build-decision-loop merge
decision: The 2026-04-24 build-decision-loop merge (commit 96ea360) is reverted by selective line and file edits identified per-component in the spec, not by a wholesale git revert of the merge commit; every change that landed after the merge but is independent of the decision-record system is preserved.
rationale: A wholesale merge-revert would also drop independently-validated improvements that landed after 2026-04-24 (provenance trailer stamping, named-subagent fork policy, pluggable Understanding-MCP swap, ground-truth review automation, brief-to-spec AC seeding, Session Skill Versions harvest, heuristic execution-mode selection, cluster-a Resolve Conditions). Surgical edits keep the keep-bucket while removing the dr-specific additions cleanly. Future "remove a feature" sprints whose target commit overlaps with unrelated keep-bucket work must follow this surgical-revert pattern rather than git revert.
alternatives:
  - git revert 96ea360 wholesale — rejected because it would drop the eight named keep-bucket changes that landed independently after the merge.
  - Cherry-pick keep-bucket commits onto a pre-merge baseline — rejected because the keep-bucket changes are interleaved with dr-specific changes inside individual files and cannot be cleanly separated by commit boundaries.
tags: [revert, governance, process]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/design/fix-decision-record-design-00.md
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260501-11-corpus-no-trailer
date: 2026-05-01
sprint: 20260501-01-fix-decision-record
stage: design-specify
title: Corpus file carries no provenance trailer
decision: The records fork does not stamp a provenance trailer on docs/chester/decision-record/decision-record.md, in contrast to all session artifacts which receive a chester-trailer-write trailer.
rationale: Provenance trailers identify the skill version that produced a sprint artifact; the corpus is cross-sprint, accumulating records from many sprints' finish-write-records runs, so a single trailer would be misleading and per-record trailers would duplicate the existing produced-by metadata in each record's stage and sprint fields. Future cross-sprint accumulators (analogous shared corpora) should follow this no-trailer convention; only sprint-scoped artifacts get provenance trailers.
alternatives:
  - Stamp a trailer per emission run — rejected because successive runs would accumulate trailers and the file would no longer be a clean corpus of records.
  - Stamp a single trailer at first emission and never update — rejected because it freezes provenance to one skill version while the file continues to grow under later versions.
tags: [convention, capture, format]
supersedes: null
artifact_refs:
  - working/20260501-01-fix-decision-record/spec/fix-decision-record-spec-00.md
---

---
id: dr-20260503-01-closed-set-module-constants
date: 2026-05-03
sprint: cluster-b-2-define-solve-closing
stage: execute-write
title: Closed-set domain vocabulary as Object.freeze module exports in proof.js
decision: Any closed-set domain vocabulary in the proof MCP is declared as an Object.freeze module-level export in proof.js, imported by callers, and never inlined as a literal at the use site.
rationale: During Tasks 1-10 each new closed set initially appeared as a hardcoded subset at the use site, and the per-task quality reviewer flagged the duplication every time; promoting them to module exports collapsed five separate review cycles into one rule. Five constants now follow the pattern (FRICTION_SHAPES, FRICTION_DISPOSITIONS, TERMINAL_FRICTION_DISPOSITIONS, WITHDRAWAL_DISPOSITIONS, UNCLASSIFIED_DISPOSITION). Future cluster B.3 element-type additions and any new closed enumerations inherit the convention; deviating requires explicit rationale.
alternatives:
  - Inline literal arrays at each use site — rejected because every quality reviewer pass flagged subset drift between detector, validator, and dispatcher.
  - Per-module constants imported by neighbors — rejected because proof.js is the canonical type-shape module and importing from non-canonical neighbors would invert the dependency direction.
  - Single config object with all closed sets nested — rejected because Object.freeze on each named export gives clearer call-site reads and per-set imports.
tags: [convention, architecture]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/spec/cluster-b-2-define-solve-closing-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md
---

---
id: dr-20260503-02-state-mutating-export-tuple-shape
date: 2026-05-03
sprint: cluster-b-2-define-solve-closing
stage: execute-write
title: Uniform tuple shape for state.js mutating exports
decision: state.js mutating exports return a uniform tuple of shape [id?, newState, friction_hints, err] — id-returning functions place the id at position 0; all share (state, hints, err) at the tail.
rationale: Pre-Task-4 plan-time triage ranked tuple-shape inconsistency Minor (PS-6); Task 2 quality reviewer re-ranked it Important once silent server-side id reconstruction surfaced (server.js was rebuilding FRIC-N from state.elementCounters.FRICTION rather than receiving the id directly). Standardizing on the tuple let twenty-plus existing test destructure sites be backfilled mechanically and locked the contract for future callers. Future state.js mutating exports follow this shape; callers of addConcern and manageFriction destructure as [id, state, hints, err]; lockConcerns, ratifyResolveCondition, overrideFrictionDisposition return [state, hints, err]; recordDesignerGo is the documented exception at [state, err] (no hints).
alternatives:
  - Per-function bespoke tuple shapes — rejected because the silent id reconstruction in server.js demonstrated the cost of shape drift across the boundary.
  - Object return ({id, state, hints, err}) — rejected because it breaks twenty-plus existing destructure sites with no offsetting clarity gain over a small fixed-arity tuple.
  - Single result-class wrapper — rejected because it adds a class import to every caller for a pure data shape that destructures cleanly.
tags: [convention, architecture]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/plan/cluster-b-2-define-solve-closing-plan-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md
---

---
id: dr-20260503-03-sticky-friction-dismissal
date: 2026-05-03
sprint: cluster-b-2-define-solve-closing
stage: design-large-task
title: Withdrawn FRICTION elements suppress re-detection
decision: Withdrawn FRICTION elements participate in runFrictionDetection's dedup keyset so a designer-dismissed FRICTION never silently re-emerges on a subsequent state mutation.
rationale: Without sticky dismissal, every state-mutating export would re-run permission-risk-linkage detection and recreate a FRICTION the designer had just terminated, creating a churn loop the designer cannot escape. Including withdrawn FRICTION in the dedup key turns dismissal into a durable signal: a terminal disposition is the designer's commitment that the structural tension is acknowledged and resolved at design level. Future detector additions must respect the same withdrawn-element dedup discipline; bypassing it would re-introduce the churn.
alternatives:
  - Re-detect on every mutation regardless of withdrawal — rejected because it creates an inescapable churn loop and ignores designer intent encoded in the terminal disposition.
  - Time-based suppression (suppress for N rounds after dismissal) — rejected because round-bounded suppression still resurfaces a settled tension and adds tunable surface with no design rationale.
  - Per-shape suppression policy — rejected because all four detector shapes share the same designer-intent semantics; differentiating policy would be ad hoc.
tags: [architecture]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/design/cluster-b-2-define-solve-closing-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md
---

---
id: dr-20260503-04-friction-canonical-paths
date: 2026-05-03
sprint: cluster-b-2-define-solve-closing
stage: design-specify
title: FRICTION lifecycle goes through dedicated MCP tools, never submit_proof_update
decision: manage_friction is the canonical FRICTION creation path; override_friction_disposition is the canonical change path including dismissal via terminal disposition; submit_proof_update add and withdraw branches route-block FRICTION targets so the dedicated tools cannot be bypassed.
rationale: FRICTION elements carry anchor-pair and shape semantics that submit_proof_update's generic add path does not validate, so allowing dual-write would let a caller create a FRICTION without anchor existence pre-validation (the IMPORTANT-1 finding from sprint-level code review). Route-blocking at the dispatch layer collapses the surface to one canonical creation point and one canonical change point, which keeps the friction-detection dedup contract intact (dedup runs against active+withdrawn FRICTION created via the canonical paths). Future code that needs to mutate FRICTION must call manage_friction or override_friction_disposition; submit_proof_update must continue to refuse FRICTION targets.
alternatives:
  - Allow dual-write through submit_proof_update with anchor validation added there too — rejected because it duplicates the validation surface and risks drift between the two creation paths.
  - Use submit_proof_update as the sole creation path and remove manage_friction — rejected because the friction lifecycle (auto-detect, hint-confirm, override) needs a dedicated tool surface for the four shape detectors and the override semantics.
  - Make submit_proof_update an internal dispatch that delegates to manage_friction for FRICTION ops — rejected because it hides the canonical path behind a generic surface and the route-block makes the contract visible at the schema level.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/spec/cluster-b-2-define-solve-closing-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md
---

---
id: dr-20260503-05-two-yes-closure-model
date: 2026-05-03
sprint: cluster-b-2-define-solve-closing
stage: design-large-task
title: Two-yes round-stamped closure model
decision: Closure is gated by an eleventh checkClosure condition that requires closingArgGoRound === state.round, where closingArgPresentedRound and closingArgGoRound are round-stamped flags cleared by every state-mutating export.
rationale: A single yes is insufficient because the closing argument is computed from current state, so any mutation between presentation and confirmation invalidates the artifact the designer is ratifying; mutation-clears discipline forces the designer to re-present and re-confirm against the post-mutation state. Round-stamping (rather than booleans) avoids the trap where a stale go from a prior round survives an intervening mutation that resets the round but not the boolean. Future closure-gate changes must preserve the two-yes-with-mutation-clears invariant; weakening to one-yes or to non-round-stamped flags would let stale ratifications close a proof against state the designer never saw.
alternatives:
  - Single-yes closure (one go signal) — rejected because it lets any state mutation between presentation and confirmation invalidate the artifact being ratified.
  - Two-yes with boolean flags (no round stamp) — rejected because a stale go survives a round reset; round-stamping makes staleness detectable at the gate.
  - Three-yes (present, review, go) — rejected because the second yes adds friction without closing a new failure mode; mutation-clears already covers the staleness gap.
tags: [architecture, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/design/cluster-b-2-define-solve-closing-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/spec/cluster-b-2-define-solve-closing-spec-00.md
---

---
id: dr-20260503-06-reviewer-no-tree-mutation
date: 2026-05-03
sprint: cluster-b-2-define-solve-closing
stage: execute-write
title: Reviewer subagent prompts must include explicit no-tree-mutation clause
decision: All spec-fidelity and quality-reviewer subagent dispatches include an explicit no-tree-mutation clause in their prompt, listing read-only commands as the permitted surface; reviewer subagents never run git checkout, git reset, git stash, git restore, or any tool that mutates the working tree.
rationale: Mid-sprint working-tree desync was traced to a reviewer subagent running git checkout <prior-sha> -- <files> to inspect older content and not restoring; reflog showed only no-op git reset events, so root cause was invisible until reproduced. Default subagent permissions are permissive, so read-only-by-convention is insufficient — the prompt must encode the constraint explicitly. Future reviewer dispatches in any sprint must include the no-tree-mutation clause; the parent's verification protocol (git status --porcelain && git diff --stat HEAD after every subagent return) remains the second line of defense.
alternatives:
  - Rely on reviewer convention without explicit prompt clause — rejected because the desync incident demonstrated convention is insufficient against permissive defaults.
  - Restrict reviewer tool surface at dispatch time (named subagent with no Bash) — rejected as insufficient on its own because Read-only inspection of historical content still tempts shell escape; the prompt clause is the durable fix and named-subagent restriction is a future hardening.
  - Run all reviewers in a separate worktree — rejected because it adds setup cost per dispatch and the prompt clause solves the proximate cause directly.
tags: [process, governance, worktree]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-2-define-solve-closing/summary/cluster-b-2-define-solve-closing-summary-00.md
---

---
id: dr-20260504-01-permissive-boundary-internal-rigor
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: design-large-task
title: Permissive contract boundary with internal restructuring rigor
decision: The Phase 4b contract surface (`open_proof`) accepts any submission shape without structural rejection at the MCP boundary; all rigor lives in the 4b-internal restructuring phase, with proof-open gated on per-element artifacts produced by that phase.
rationale: NCON-2 binds the boundary to permissive because the caller is untrusted (R9), the contract is generic for any caller (R2), and assume-guarantee patterns (B-Method, SPARK, JML, Eiffel) place validation rigor at the receiver when senders are heterogeneous (EVID-5). Boundary rejection would force defining caller-side validation, contradicting R9 and breaking the contract's generic-caller property; rigor is preserved by NCON-3's open-gate verifier rather than by schema strictness. Future contract surfaces inside Chester that face untrusted callers must follow the same pattern — keep the schema permissive at the wire, push rigor inside, and gate transitions on artifacts the rigor produces.
alternatives:
  - Minimum-schema validation at boundary — rejected because it pulls validation to the caller side, violating R9.
  - Reject empty submissions at boundary — rejected because defining 'empty' still requires caller-side compliance assumptions, violating R9.
  - Accept-with-warnings — rejected because warnings imply a caller-side correction loop, contradicting R6's one-shot transition.
tags: [architecture, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/design/cluster-b-1-define-transition-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/spec/cluster-b-1-define-transition-spec-00.md
---

---
id: dr-20260504-02-three-module-restructure-split
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: plan-build
title: Three-module split for restructure pipeline
decision: The restructuring pipeline is split across three sibling modules — `restructure-schema.js` (data registry only), `restructure-rules.js` (pure predicates: assignActionLabel, isRejectedValue, validateReasoningAnchor), and `restructure.js` (top-level orchestrator plus provenance and metadata builders) — rather than collected into one file.
rationale: Collapsing all seven responsibilities (registry, three predicates, provenance builder, metadata router, orchestrator) into one module would couple data declaration to rule evaluation to control flow, making each kind of change require navigating unrelated code. The split lets schema edits, rule-table edits, and orchestrator edits land in distinct files with mirrored test files (`restructure-schema.test.js`, `restructure-rules.test.js`, `restructure.test.js`). Future restructure-pipeline extensions (new categories, new action labels, new anchor formats) should preserve this layout — add to the matching module rather than reintroducing a monolith.
alternatives:
  - Single `restructure.js` file containing registry, predicates, and orchestrator — rejected because mixing seven responsibilities couples unrelated change axes and inflates the test file.
  - Two modules (data + behavior) — rejected because rule predicates and orchestrator have different change cadences (rules are stable enums; orchestrator evolves with action-label additions); collapsing them re-couples the axes the split is meant to separate.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/plan/cluster-b-1-define-transition-plan-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/summary/cluster-b-1-define-transition-summary-00.md
---

---
id: dr-20260504-03-per-field-provenance-array
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: plan-build
title: Per-field provenance array with priority-promoted aggregate
decision: Every admitted element's `provenance` carries a `field_provenance: [{field_name, action_label, reasoning_chain}]` array — one entry per typed field — plus an element-level `restructuring_action_label` computed by priority promotion (`gap-fill > reshape > verbatim-preserve`); the aggregate label never replaces per-field detail.
rationale: A single element-level label is a lossy approximation that hides which fields were verbatim-preserved versus reshaped versus gap-filled, and once that aggregate hardens into the API contract downstream consumers can no longer recover field-level intent. Plan-smell flagged this as a Medium-severity smell; the fix preserves per-field granularity in `field_provenance` while keeping the aggregate as a documented, tested priority promotion. Future provenance schema changes must preserve per-field detail; collapsing to a single label is forbidden without superseding this record.
alternatives:
  - Single element-level action label only — rejected because it loses field-level intent and hardens lossy aggregation into the API contract (plan-smell finding).
  - Per-field labels with no aggregate — rejected because the open-gate verifier and downstream consumers benefit from a single summary label for fast-path checks; the aggregate is additive, not substitutive.
tags: [architecture, format]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/plan/cluster-b-1-define-transition-plan-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/plan/cluster-b-1-define-transition-plan-threat-report-00.md
---

---
id: dr-20260504-04-resolve-condition-excluded-from-registry
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: design-specify
title: RESOLVE_CONDITION excluded from REQUIRED_FIELDS_REGISTRY
decision: The `REQUIRED_FIELDS_REGISTRY` covers exactly six B.1-admittable categories (EVIDENCE, RULE, PERMISSION, NECESSARY_CONDITION, RISK, Concern); RESOLVE_CONDITION is intentionally absent, so RCs cannot enter the proof through the `open_proof` contract surface and must be added post-open via existing tools (`submit_proof_update` or `ratify_resolve_condition`).
rationale: `applyOperations` validates `RC.problem_anchor` against `state.concerns`, which is empty immediately after `initializeState` runs inside `handleOpenProof` — admitting an RC at open would always fail the problem-anchor check, so the registry must reflect that constraint at the schema level rather than letting it surface as runtime rejection. FRICTION is also excluded for a different reason (B.2-generated via `manage_friction`, not received from callers). Future contract-surface extensions must preserve both exclusions; admitting RC at the contract requires first establishing Concerns inside `handleOpenProof` and is out of scope for B.1.
alternatives:
  - Include RESOLVE_CONDITION in the registry and let runtime validation reject — rejected because predictable structural impossibility belongs at the schema layer, not as runtime noise.
  - Reorder `handleOpenProof` to provision Concerns before admitting RCs — rejected as out of scope for B.1; would require multi-pass restructuring and a Concern-first ordering rule the spec does not authorize.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/spec/cluster-b-1-define-transition-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/summary/cluster-b-1-define-transition-summary-00.md
---

---
id: dr-20260504-05-concern-partition-routing
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: execute-write
title: Concern partition routing through addConcern
decision: `handleOpenProof` partitions admitted candidates into typed elements (routed through `applyOperations` into `state.elements`) and Concerns (routed through `addConcern` into `state.concerns`); Concerns never flow through `applyOperations` and cannot leak into `state.elements`.
rationale: Concerns live in a separate state slot (`state.concerns`) with their own lifecycle; routing them through `applyOperations` would require Concern-shaped op handling there and risk type bleed into `state.elements` if any branch missed the partition. Splitting at the orchestrator keeps each downstream API focused on one element family and makes the leak-prevention property structural rather than test-asserted. Future contract-surface code must preserve the partition; any new state slot added later (e.g., a Resolve Condition slot if cluster A relocates RCs) must follow the same partition-at-orchestrator pattern.
alternatives:
  - Route Concerns through `applyOperations` with a Concern op type — rejected because it widens applyOperations' surface and risks type bleed into `state.elements`.
  - Route both through a single unified persistence call — rejected because Concerns and elements have different schemas, lifecycles, and downstream consumers; unification removes the structural partition that prevents leakage.
tags: [architecture]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/spec/cluster-b-1-define-transition-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/summary/cluster-b-1-define-transition-summary-00.md
---

---
id: dr-20260504-06-esm-main-module-guard
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: execute-write
title: ESM main-module guard for vitest-importable servers
decision: MCP server entry points guard their `main()` invocation with an ESM main-module check (`import.meta.url === \`file://${process.argv[1]}\``) so that vitest imports of the module do not launch the stdio server.
rationale: Without the guard, importing `server.js` from a vitest test file would auto-launch the MCP stdio server, contending for stdin/stdout and breaking test isolation; the guard is the ESM analog of CommonJS's `if (require.main === module)` pattern. The fix surfaced because the new `open_proof` test surface needs to import handler functions from `server.js` directly. Future MCP server modules in Chester must include the same guard; importable-by-tests is the default, server-launches-on-direct-execution is the opt-in.
alternatives:
  - Split server.js into a library module plus a thin entry script that calls `main()` — rejected because it doubles the file count and most existing tests already import from server.js; the guard is the lower-friction fix.
  - Mock `main()` in test setup — rejected because it requires per-suite mocking discipline that future tests would forget; the guard is structural and forget-proof.
tags: [convention, tool]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/summary/cluster-b-1-define-transition-summary-00.md
---

---
id: dr-20260504-07-initialize-proof-retired
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: execute-write
title: Legacy initialize_proof tool retired in B.1
decision: The legacy `initialize_proof` MCP tool (and its `handleInitialize` handler and TOOLS-array entry and dispatch case) is deleted in this sprint; `open_proof` becomes the sole proof-opening entry point.
rationale: Keeping both tools live would create two parallel paths for proof opening — `initialize_proof` calling only `initializeState` plus `saveState`, and `open_proof` adding `applyOperations` between them — so any future change to proof initialization (e.g., a new required state field) would need to land in two handlers. Plan-smell flagged the duplication as Medium-severity. Earlier guidance (and the spec's initial draft) considered preserving `initialize_proof` for backward compatibility; the designer's mid-sprint direction was to retire it within B.1 rather than defer to a later cluster, so the retirement landed under T13 rather than waiting on cluster C.
alternatives:
  - Preserve `initialize_proof` unchanged for backward compatibility — rejected because the duplication smell hardens with each new init-time field and there are no external callers depending on it.
  - Defer retirement to cluster C — rejected because the longer both tools coexist, the more test and skill-text cleanup the retirement requires; doing it inside B.1 keeps the contract surface clean from sprint close.
tags: [architecture, revert, mcp]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/plan/cluster-b-1-define-transition-plan-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/summary/cluster-b-1-define-transition-summary-00.md
---

---
id: dr-20260504-08-per-task-execution-mode
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: plan-build
title: Per-task Execution mode override in plan files
decision: Plan files may declare `Execution mode: per-task` at the header and then carry an `Execution: inline | subagent` field on each individual task; execute-write reads the per-task field directly when the plan-wide mode is `per-task`, overriding the plan-wide heuristic.
rationale: Plan-wide execution mode forces every task into the same dispatch shape, but cluster B.1's tasks split cleanly between two genuinely-complex orchestrators (T8 restructure, T11 handleOpenProof) that benefit from subagent isolation and twelve mechanical tasks (single-function additions, doc edits) that run cheaper inline. The per-task override lets the designer mark each task at plan-build time without wholesale-switching the sprint. Future plans should reuse this pattern when task complexity is bimodal; the precedent is set for execute-write to honor the per-task field whenever the plan declares per-task mode.
alternatives:
  - Plan-wide subagent mode for all tasks — rejected because twelve mechanical tasks pay subagent overhead for no isolation benefit.
  - Plan-wide inline mode for all tasks — rejected because T8 and T11 carry nested logic and partition routing that benefits from subagent context isolation.
  - Split into two plans (one per mode) — rejected because it fragments task ordering and forces two execute-write passes for one logical sprint.
tags: [process, skill]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/plan/cluster-b-1-define-transition-plan-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/summary/cluster-b-1-define-transition-summary-00.md
---

---
id: dr-20260504-09-open-proof-five-status-responses
date: 2026-05-04
sprint: cluster-b-1-define-transition
stage: design-specify
title: open_proof returns one of five named status values
decision: `open_proof` returns one of exactly five status strings — `opened`, `gate_failed`, `partial_write_failure`, `save_failed`, `already_open` — and resubmissions to the same `state_file` are safe because the gate-fail and partial-write-failure paths write nothing.
rationale: A single boolean success/fail or a free-form error message would erase the structural distinction between failure modes the caller needs to distinguish: gate failures produce a restructuring report the caller can inspect and resubmit against, partial-write failures surface `applyResult.errors` for inspection, save failures are filesystem-level, and already-open is a refusal that protects against unintentional overwrite. Each status carries a distinct response payload; merging any two would force the caller to reverse-engineer which path fired. Future tools that wrap multi-phase orchestration should follow the same pattern — one status per terminal state, resubmission-safe at every failure path.
alternatives:
  - Boolean success plus error string — rejected because callers cannot distinguish gate failures (resubmit with corrected material) from save failures (filesystem retry) from already-open (use a fresh state_file).
  - Throw on failure, return on success — rejected because MCP error responses lose structured payload (the restructuring report and gate diagnostics) the caller needs to act on.
  - Collapse `gate_failed` and `partial_write_failure` into one status — rejected because gate-fail writes nothing while partial-write-failure has already mutated state; the caller's recovery action differs.
tags: [format, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/spec/cluster-b-1-define-transition-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/summary/cluster-b-1-define-transition-summary-00.md
---

---
id: dr-20260504-10-task-nn-refactor-pattern
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation
stage: finish-write-records
title: task-NN-<slug> pattern for non-endstate sub-sprints under master mode
decision: Non-endstate sub-sprints under a master plan use the `task-NN-<slug>` naming pattern, sit parallel to cluster sub-sprints inside the master tree, are single-issue, and inherit master plan Rules read-only without contributing Rules to downstream clusters.
rationale: Cluster letters (A/B/C) are reserved for endstate-bearing work; bundling tooling/doc/process cleanups into cluster sub-sprints would muddy the endstate accounting and create a false signal that the cleanup contributes to cluster Rules inheritance. The `task-NN` prefix signals "non-endstate, no Rules contribution" at a glance, so future cluster readers do not mistake the work for an endstate dependency. Numbering is sequential across the master plan's lifetime so any sub-sprint type registered later (LBDs, follow-up cycles) can coexist without collision.
alternatives:
  - Two micro-fixes on main with no sub-sprint — rejected because it violates master-plan discipline (every sub-sprint goes through pipeline) and leaves no archive trail for the cleanup work.
  - Fold cleanup into cluster C launch as Task 0 — rejected because it muddies endstate scope (cleanup is not endstate point 1 or 2) and sets a bad precedent for future cluster readers who would assume cleanup contributes to cluster Rules.
  - `lbd-NN-<slug>` naming — rejected in favor of `task-NN-<slug>` as a clearer "refactor/cleanup task" framing for non-endstate work.
tags: [convention, governance, process]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/task-01-fix-staleb3-label/summary/task-01-fix-staleb3-label-summary-00.md
---

---
id: dr-20260504-11-task-pipeline-weight-classes
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation
stage: finish-write-records
title: Trivial-edit and investigation-bearing pipeline-weight classes for task sub-sprints
decision: Each task-NN sub-sprint declares a pipeline-weight class at registration — trivial-edit (skip design and plan; bootstrap → execute → finish) or investigation-bearing (full design-small-task → plan-build → execute-write → finish) — with a forced halt-and-re-bootstrap escalation if a trivial edit surfaces unexpected complexity during execution.
rationale: Forcing every task-NN sub-sprint through design-small-task → plan-build → execute-write would over-engineer literal text corrections and one-line fixes, while skipping design entirely would miss legitimate investigation work where the fix shape is unknown at task launch. Declaring the class at registration time keeps the pattern truthful and visible in the master plan; the escalation rule prevents trivial tasks from silently absorbing investigation-grade scope without re-bootstrapping under heavier ceremony. Without the explicit class declaration, §4.4 would over-commit task-NN to a pipeline shape that does not fit single-file text corrections.
alternatives:
  - Single pipeline shape for all task-NN sub-sprints (always full design-small-task → plan-build → execute-write) — rejected because it is overhead for trivial text corrections and creates pressure to relax the cycle informally case-by-case.
  - Per-task ad-hoc pipeline choice with no declared class — rejected because the pattern becomes invisible in the master plan and future tasks cannot consult precedent for similar-shaped work.
  - Allow in-flight downgrade from investigation-bearing to trivial-edit — rejected; only escalation is permitted, because downgrading mid-flight discards work already invested in design or planning.
tags: [process, convention, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/task-01-fix-staleb3-label/summary/task-01-fix-staleb3-label-summary-00.md
---

---
id: dr-20260504-12-master-plan-deferments-section
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation
stage: finish-write-records
title: Master plan §10 known-deferments-out-of-scope discipline
decision: Master plans carry a §10 "Known Deferments — Out of Scope" section that records items surfaced during master-plan execution which are explicitly rejected from current scope but worth preserving across sub-sprint boundaries.
rationale: Items surfaced mid-master that are real follow-up work but not in-scope for any active task or cluster (e.g. stamping-test dynamism in this master) would otherwise be lost between sub-sprint boundaries — sub-sprint summaries archive at merge but are not consulted as cross-sprint memory. Recording deferments in §10 of the master plan keeps them visible at every master-plan read and survives all sub-sprint archives. The section also discriminates "rejected for focus" from "rejected outright" — items in §10 are explicitly preserved for post-master refactor, not silently dropped.
alternatives:
  - Sibling tracker file `master-deferments.md` per the living-document pattern — rejected because it adds another cross-sprint file with the same persistence gap as master-plan.md but without the existing reading-order guarantees.
  - Capture only inside per-task summaries — rejected because summaries are not consulted as cross-sprint memory and the deferment becomes invisible after the task closes.
  - Open a new task-NN entry for every surfaced deferment — rejected because it absorbs scope into the master plan's task count even when the work is correctly out-of-scope (e.g. stamping-test dynamism belongs post-master, not as task-03).
tags: [convention, process, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/task-01-fix-staleb3-label/summary/task-01-fix-staleb3-label-summary-00.md
---

---
id: dr-20260504-13-master-plan-sync-between-archives
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation/task-01-fix-staleb3-label
stage: finish-write-records
title: Sync working/master-plan.md to plans/ between archive merges to close living-document gap
decision: When master-level living documents (master-plan.md and siblings) are edited mid-master between sub-sprint merges, sync them from `working/<master-sprint>/` to `plans/<master-sprint>/` and commit the diff on main as a standalone `docs(master-plan): ...` commit rather than waiting for the next sub-sprint's `finish-archive-artifacts` to carry the changes.
rationale: The living-document persistence gap (root `CLAUDE.md` §"Master Plan Mode" and `docs/chester/CLAUDE.md`) means master-plan.md edits remain gitignored in working/ until the next sub-sprint's archive merge — sometimes days. Intermediate edits have no commit-level history, and stale entries can drift undetected because `git diff` cannot see them. Syncing manually between merges gives the master plan point-in-time git history without waiting on the archive cadence, while preserving the one-way working → plans flow (no reverse copy) and leaving `finish-archive-artifacts` as the canonical archive mechanism. This is a workaround pattern, not a fix to the underlying gap.
alternatives:
  - Wait for next sub-sprint's finish-archive-artifacts to carry edits — rejected when the master-plan edits register a new sub-sprint pattern (task-NN) the about-to-launch sub-sprint depends on; the launch would reference a pattern not yet in git on main.
  - PostToolUse hook auto-syncing on every master-plan.md edit — rejected for now as out-of-scope for this sprint; remains a candidate fix for the underlying gap, surveyed in `master-plan-skill-living-document-problem-brief.md`.
  - Embedded git in working/ — rejected as architecturally heavier than the manual sync workaround for the cadence this master plan needs.
tags: [process, convention, worktree]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/task-01-fix-staleb3-label/summary/task-01-fix-staleb3-label-summary-00.md
---

---
id: dr-20260504-14-confidence-bias-audit-rule
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest
stage: design-small-task
title: Confidence-bias discrimination rule for shell-pipeline audits
decision: Pipeline-and-strict-mode audits in shell scripts harden a site only when the no-match path is reachable in current usage; otherwise leave the pipeline intact and write a one-line safety-invariant comment naming the assumption that keeps it safe.
rationale: Defensive bias produces clutter on pipelines whose no-match condition cannot be triggered by any current call site, while a bug-as-evidence rule (only fix sites with reproduced failures) leaves known-reachable hazards in place. Confidence bias splits the audit cleanly: harden where today's inputs can reach the failure, document where today's invariants block it, and put the burden of breakage on whoever later changes the invariant. Future shell-script audits in Chester should consult this rule before deciding harden-versus-document site by site.
alternatives:
  - Defensive bias (harden every pipeline whose grammar admits no-match) — rejected because it adds noise on call paths that cannot reach the failure under current usage and creates pressure to harden trivially-safe code.
  - Bug-as-evidence (only fix sites with a reproduced failure) — rejected because it leaves known-reachable but not-yet-triggered hazards in place, which is the same posture that produced this task's bug.
tags: [convention, process]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/design/task-02-fix-trailer-write-harvest-design-00.md
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/spec/task-02-fix-trailer-write-harvest-spec-00.md
---

---
id: dr-20260504-15-test-invokes-local-source-not-path-wrapper
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest
stage: design-specify
title: Tests of plugin-cached scripts invoke local source directly, not via PATH wrapper
decision: When a test exercises a fix to a script that is also cached in the plugin install (e.g. anything under `chester-util-config/`), the test invokes the local source directly via `bash "$REPO_ROOT/<path>"` and never via the PATH-resolved wrapper, because the wrapper exec's `$CHESTER_ROOT/...` which resolves to the plugin cache rather than the local repo.
rationale: The PATH wrapper `bin/chester-trailer-write` exec's `$CHESTER_ROOT/chester-util-config/chester-trailer-write.sh` where `$CHESTER_ROOT` resolves to the plugin cache (`OrdinaryMoose/plugins/chester`), not the repo source. A test that follows ergonomic instinct and invokes via PATH would silently pass against un-fixed cached code unless `/refresh-chester` ran first, defeating the test's purpose. Direct local-source invocation locks the test against the repo's working tree so the fix is verifiable end-to-end without depending on plugin-cache state.
alternatives:
  - Run `/refresh-chester` as the first test step — rejected because tests cannot invoke user-scoped slash commands and the precondition would have to be a per-test handoff note rather than a test-internal guarantee.
  - Test via PATH wrapper accepting the cache-staleness risk — rejected because a test that silently passes on un-fixed cached code is worse than no test for the fix.
tags: [convention, tool]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/spec/task-02-fix-trailer-write-harvest-spec-00.md
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/spec/task-02-fix-trailer-write-harvest-spec-ground-truth-report-00.md
---

---
id: dr-20260504-16-refresh-chester-precondition-end-to-end-validation
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest
stage: design-specify
title: /refresh-chester precondition for end-to-end validation of plugin-cached fixes
decision: Any sprint that fixes a script also cached in the plugin install carries an explicit `/refresh-chester` precondition in the spec's end-to-end acceptance criteria and in the sprint's handoff notes, signaling that post-merge sprints which rely on the fix must refresh the plugin cache before invocation.
rationale: Test-via-local-source verifies the fix at the repo level, but the PATH-resolved wrapper used by skills (e.g. `chester-trailer-write` in `finish-write-records` and `execute-write` stamping paths) continues to resolve to the cached plugin until `/refresh-chester` runs. Without an explicit precondition, downstream sprints might invoke the cached pre-fix version unknowingly, surfacing the same bug after it was supposedly fixed. Recording the precondition in the spec and handoff makes the cache-refresh step a normal part of the sprint's exit, not a tribal-knowledge afterthought.
alternatives:
  - Auto-refresh as part of `finish-archive-artifacts` — rejected because that skill cannot invoke user-scoped slash commands and the precondition belongs at the sprint boundary, not the archive step.
  - Treat plugin-cache refresh as ambient developer hygiene — rejected because the cache-staleness window has historically caused silent test passes and bug recurrence; explicit precondition closes the loop.
tags: [process, tool, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/spec/task-02-fix-trailer-write-harvest-spec-00.md
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/summary/task-02-fix-trailer-write-harvest-summary-00.md
---

---
id: dr-20260504-17-hybrid-execution-mode-pattern
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation
stage: plan-build
title: Hybrid execution mode via per-task annotations on inline header
decision: Plans whose execution mode is "hybrid" (some tasks dispatched to subagents, others run inline) declare it via per-task annotations layered on a single inline-mode header — not as a third top-level mode value — following cluster B.1's precedent.
rationale: A third top-level execution mode (`hybrid`) would add a new dimension to the plan-build / execute-write contract and require new branches in both skills' mode-routing logic. Cluster B.1 already established the lightweight pattern: keep the header at `inline`, then mark individual tasks with `Dispatch: subagent` annotations where appropriate. The pattern preserves the binary inline/subagent contract at skill level while letting plans express mixed dispatch in plan-local prose. Future mixed-dispatch plans follow this convention rather than introducing new mode values.
alternatives:
  - New top-level `hybrid` mode in plan header and execute-write — rejected because it expands the skill contract for what is expressible by per-task annotations under the existing inline mode.
  - Always-subagent or always-inline (no mixing) — rejected because real plans have tasks of mixed risk and decision-budget; forcing uniform dispatch over-spends or under-protects depending on the choice.
tags: [convention, process, skill]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/plan/task-02-fix-trailer-write-harvest-plan-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-b-1-define-transition/plan/cluster-b-1-define-transition-plan-00.md
---

---
id: dr-20260504-18-mid-task-master-plan-sync-codified
date: 2026-05-04
sprint: 20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest
stage: execute-write
title: Mid-task working-to-plans sync codified as standard living-document pattern
decision: Mid-task `working/<master-sprint>/master-plan.md` → `plans/<master-sprint>/master-plan.md` sync with a standalone `docs(master-plan): ... (mid-task sync)` commit on main is the standard pattern for any master-plan edit that downstream sub-sprints depend on, exercised inside execute-write task steps rather than only as a one-off pre-bootstrap workaround.
rationale: Task-01 used the sync pattern as a pre-bootstrap step to land the task-NN registration before launching task-02 (`dr-20260504-13`). Task-02 used it again mid-execute-write to land a corrected scope attribution in §4.4.2 while the worktree commit landed on the task-02 branch. Two exercises in two consecutive sub-sprints make this the standard pattern for cross-sub-sprint living-document updates, not an emergency-only workaround. The commit-on-main with `(mid-task sync)` suffix discriminates these from regular `finish-archive-artifacts` archive commits and preserves git history at the moment of the edit, closing the living-document persistence gap for the duration of the master plan.
alternatives:
  - Restrict the sync pattern to pre-bootstrap only — rejected because mid-task scope corrections (e.g. task-02's §4.4.2 attribution fix) are real cases where a sub-sprint's own work modifies the master plan and waiting for the next archive merge would leave inaccurate text on main.
  - Bundle all master-plan edits into the next archive merge — rejected because it stretches the staleness window and allows incorrect master-plan claims to sit on main between merges.
tags: [process, convention, worktree]
supersedes: dr-20260504-13-master-plan-sync-between-archives
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/plan/task-02-fix-trailer-write-harvest-plan-00.md
  - working/20260430-02-rebuild-design-derivation/task-02-fix-trailer-write-harvest/summary/task-02-fix-trailer-write-harvest-summary-00.md
---

---
id: dr-20260505-01-evidence-source-observability-rule
date: 2026-05-05
sprint: 20260430-02-rebuild-design-derivation/cluster-c-restructure-understand
stage: design-large-task
title: EVIDENCE source must name an observable source, never the designer
decision: EVIDENCE elements in any proof MCP submission must carry a `source` that names an observable channel (codebase, industry, prior-art, session-observation, etc.); `source: "designer"` is forbidden because the designer is not a source of evidence — only observable sources are.
rationale: A first `open_proof` call in cluster C failed validation when four evidence entries carried `source: "designer"`. The designer ratified the underlying principle: a designer-direct claim is a Rule (designer-directed restriction) or a Permission, not Evidence. EVIDENCE provenance must trace to something a third party could observe — code, industry practice, prior-art records, session traces. The proof MCP's source enum is permissive on observable labels but rejects the designer-source shape, and that asymmetry is by design. Future proof work routes designer claims to RULE/PERMISSION elements and reserves EVIDENCE for observable provenance.
alternatives:
  - Allow `source: "designer"` as a special EVIDENCE provenance — rejected because it conflates designer-directed restriction (RULE) with observable evidence; the type system loses meaning when a designer's claim can be either.
  - Tighten EVIDENCE source to a closed enum like `{codebase}` only — rejected because real proof work draws on industry practice, prior-art, and in-session observation as legitimate observable sources; the closed-set would force misclassification.
tags: [convention, mcp]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-c-restructure-understand/design/cluster-c-restructure-understand-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-c-restructure-understand/summary/cluster-c-restructure-understand-summary-00.md
---

---
id: dr-20260505-02-master-rules-set-aside-cluster-internal-not-retracted
date: 2026-05-05
sprint: 20260430-02-rebuild-design-derivation/cluster-c-restructure-understand
stage: design-large-task
title: Master-plan rules set aside for a cluster's internal session, not retracted at master level
decision: When a master-plan pivot amendment sets aside master-level rules (e.g. R1–R10) for a cluster's internal proof session, the set-aside scopes to that cluster's session only — the master rules remain authoritative for clusters that already shipped against them and for any cluster that does not invoke the pivot.
rationale: The 2026-05-04 cluster C pivot set R1–R10 aside for cluster C's internal session per the proof seed manifest. That set-aside is now inherited by cluster D (via §11 / §12 amendments) but does not retroactively invalidate cluster A or B.1/B.2's shipped work, which remains framed by R1–R10. A blanket master-level retraction would orphan the prior clusters' provenance; the cluster-internal-scoped set-aside preserves the rule corpus while letting a single cluster reauthor what it needs. Future master-plan pivots that invalidate rules should follow the same scoping discipline: set aside for the affected cluster's session, do not retract from the master corpus.
alternatives:
  - Retract the set-aside rules from the master rule corpus entirely — rejected because shipped clusters were designed and ratified under those rules and a master-level retraction would orphan their provenance.
  - Hard-fork a new master plan when rules need to be set aside — rejected as disproportionate when the inheritance chain (A and B.1/B.2 carry forward as shipped capabilities) remains intact; only the unshipped cluster's framing changes.
tags: [process, master-plan-mode, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/CLAUDE.md
  - working/20260430-02-rebuild-design-derivation/cluster-c-restructure-understand/design/cluster-c-restructure-understand-design-00.md
---

---
id: dr-20260505-03-cluster-transfer-on-charter-level-reframe
date: 2026-05-05
sprint: 20260430-02-rebuild-design-derivation/cluster-c-restructure-understand
stage: design-large-task
title: Charter-level designer reframes force cluster transfer, not in-band amendment
decision: When a designer reframe introduces organizing principles that the active cluster's charter does not carry — i.e. the reframe operates at higher altitude than the cluster's problem framing — the right move is to close the cluster without delivery and open a new sub-sprint with the reframed charter; in-band proof amendment is reserved for architecture-level moves within the existing charter altitude.
rationale: Cluster C absorbed its 2026-05-04 architecture pivot in-band (same problem, different shape) by §11 amendment. It could not absorb its 2026-05-05 reframe (different organizing principles, different problem altitude — "Design is the code"; "Purpose is Shared Understanding") because those principles sit above the architecture choice cluster C was about to make. Mechanism-level constraints reinforced the transfer path: cluster B.1 R6 forbids problem-statement amendment after restructuring, and `manage_concerns` exposes only `add` and `lock` — no `withdraw` — so the seven existing concerns could not be replaced in-band. The discriminating signal is whether the restatement introduces organizing principles the charter does not already carry; if yes, transfer; if no, amend. This is the master plan's first cluster-without-delivery and sets the precedent for handling charter-level reframes across all future master plans.
alternatives:
  - Force the reframe in-band via a third pivot amendment — rejected because the charter could not carry the new organizing principles and mechanism constraints (R6, no-withdraw API) blocked the in-band path; the result would be an amendment-of-amendment chain that obscures the reframe's altitude.
  - Discard the reframe and continue cluster C on the pre-reframe charter — rejected because the reframe was designer-ratified at higher altitude than the charter; ignoring it would commit cluster C to a problem the designer no longer wanted solved.
  - Pause cluster C indefinitely and address the reframe later — rejected because cluster sequencing locks downstream work behind cluster C; an indefinite pause stalls the master plan, and a clean transfer preserves momentum.
tags: [process, master-plan-mode, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/cluster-c-restructure-understand/design/cluster-c-restructure-understand-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-c-restructure-understand/summary/cluster-c-restructure-understand-summary-00.md
---

---
id: dr-20260505-04-closed-without-delivery-cluster-status
date: 2026-05-05
sprint: 20260430-02-rebuild-design-derivation/cluster-c-restructure-understand
stage: finish-write-records
title: closed-without-delivery cluster lifecycle state with scope-transfer pointer
decision: Master-plan freeze-map entries gain a `closed-without-delivery` status value paired with a `scope-transferred-to:` field naming the receiving sub-sprint, capturing clusters that produced reasoning trail and inheritance for a successor but never closed a proof or shipped code.
rationale: Cluster C produced no shipped capability but produced load-bearing reasoning trail (two pivots, source-classification correction, vocabulary corpus) that cluster D inherits as opening seed. The existing lifecycle states (pending / active / done / split) do not describe this shape — `done` implies delivery, `pending` implies not-yet-started, `split` implies decomposition into siblings of the same charter. The new state names the actual shape: charter retired, learnings transferred, no delivery. The paired `scope-transferred-to:` field makes the inheritance pointer machine-readable so future readers and tooling can trace the chain from a closed cluster to its successor without parsing prose. Future master plans use this pair when a cluster's charter retires mid-flight under a designer reframe or other charter-level move.
alternatives:
  - Reuse `done` status with a prose note about non-delivery — rejected because it conflates shipped and unshipped clusters in the freeze-map, breaking the at-a-glance read of what the master plan delivered.
  - Reuse `split` status — rejected because split implies decomposition into siblings carrying the same charter; cluster C's transfer is a charter-altitude shift to a single successor, not a decomposition.
  - Delete the freeze-map entry entirely — rejected because the cluster's reasoning trail is paper trail and the inheritance pointer to cluster D needs to be discoverable from the master plan's index, not buried in design documents.
tags: [convention, master-plan-mode, format]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/master-plan.md
  - working/20260430-02-rebuild-design-derivation/cluster-c-restructure-understand/summary/cluster-c-restructure-understand-summary-00.md
---

---
id: dr-20260507-01-architecture-a-universal-surface-over-heterogeneous-storage
date: 2026-05-07
sprint: cluster-d-1
stage: design-specify
title: Architecture A — universal generic tool surface over heterogeneous internal storage
decision: Cluster D.1's proof layer ships as Architecture A — a universal generic MCP tool surface (one withdraw verb, shared validators, shared consent gate) layered over the existing heterogeneous internal storage (Map<id, element>, concerns[], definitions[]) without collapsing to a homogeneous registry.
rationale: Three architectures were red-teamed against the brief. A's findings were spec-time correctable with no architecture revision; C had structural impossibilities (concernsLocked is a global gate not per-entity status, NC-18 dual-status axis collision, hostile alien-typed legacy archive state); Hybrid introduced new contradictions (NC-7 deprecate removal violated a designer-locked NC; CERN-/CONC- prefix mismatch; federated registry without removing tool aliases). A's blast radius was smallest, B.2-shipped code preserved, no migration. Future cluster-D and cluster-E proof work builds on this layer; reversing the choice would void the shipped code.
alternatives:
  - Architecture C (homogeneous entity registry over collapsed Map) — rejected because concernsLocked global gate cannot collapse to per-entity status, NC-18 active/withdrawn vs Draft/Ratified are orthogonal axes the homogeneous shell cannot host, and migration policy for alien legacy state files (CONSTRAINT/GIVEN/OPEN/BOUNDARY/DECISION) was undefined.
  - Hybrid (federated registry over heterogeneous stores) — rejected because the plan unilaterally removed the brief-ratified NC-7 deprecate operation, the federated abstraction added complexity without retiring the per-category tool aliases, and applyOperations FRICTION guards forced a preserve-or-remove decision the plan did not make.
  - Architecture B (skill-orchestrated proof reasoning) — rejected at the F-A-C suitability gate because co-locating proof orchestration inside the skill body that D.2 will fill with presentation logic breaks the brief §1 service-independence claim.
tags: [architecture, mcp]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/design/cluster-d-1-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/spec/cluster-d-1-spec-03.md
---

---
id: dr-20260507-02-consent-token-shape-lock
date: 2026-05-07
sprint: cluster-d-1
stage: execute-write
title: Consent token shape locked across every mutating proof tool
decision: Every mutating proof MCP tool requires a consent argument of shape `{ source: 'designer' | 'agent-proposed-designer-confirmed', rationale?: string }`, validated through a single shared `validateConsentToken` helper before any state change.
rationale: NC-8 requires consent on every mutation. A single closed shape with two source values (designer-direct vs agent-proposed-designer-confirmed) and an optional rationale string is sufficient to discriminate the two legitimate provenance paths the proof system models, while keeping the schema small enough to thread cleanly through all mutating handlers, processFriction, and applyOperations. Future proof tools (cluster D successors and any later proof-MCP extension) inherit this shape rather than inventing per-tool consent arguments.
alternatives:
  - Per-tool consent shapes — rejected because each new mutating tool would re-derive the validation logic, drift would accumulate, and the audit trail would mix incompatible source vocabularies.
  - Boolean consent flag — rejected because NC-8 requires source-of-consent provenance, not just yes/no; designer vs agent-proposed-designer-confirmed must be discriminable downstream.
  - Free-form consent metadata object — rejected because validators cannot enforce "every mutation has consent" without a closed schema; agents would omit fields under prompt drift.
tags: [convention, mcp, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/spec/cluster-d-1-spec-03.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/plan/cluster-d-1-plan-00.md
---

---
id: dr-20260507-03-perm-1-friction-carve-out-from-universal-withdraw
date: 2026-05-07
sprint: cluster-d-1
stage: design-specify
title: PERM-1 carves FRICTION out of universal withdraw; override_friction_disposition is the lone path
decision: PERM-1 is registered against NC-5 (universal withdrawal grammar) granting FRICTION an exception — FRICTION terminal disposition routes exclusively through `override_friction_disposition`, not through the universal `withdraw` tool, and the universal withdraw schema rejects FRICTION at the door.
rationale: NC-5 frames withdrawal as "universal in semantics" — every category preserves the element and stamps a closed disposition. But FRICTION's terminal-disposition vocabulary (`lived-with`, `relieved-by-exception`, `dissolved-by-revision`, `dissolved-by-scope-cut`, `not-really-friction`) is semantically irreconcilable with non-FRICTION's set (`consolidated`, `superseded`, `found-redundant`, `found-incorrect`, `scope-removed`). Collapsing both into one verb would force false synonymy. The Permission preserves the universal-grammar claim at the semantic level (element preserved, closed disposition set) while documenting at the architecture level that the tool surface carries two terminal verbs. Future architectures considering universal-CRUD over the proof layer must register a comparable carve-out or invent a vocabulary unification.
alternatives:
  - Collapse FRICTION terminal disposition into universal withdraw with a unified vocabulary — rejected because the two disposition sets describe genuinely disjoint semantic categories (FRICTION dispositions describe how a friction was resolved; non-FRICTION dispositions describe why an element was retracted) and unification would lose information.
  - Drop universal withdraw entirely and ship per-category withdraw verbs — rejected because eight of nine categories share the disposition vocabulary; per-category fan-out would duplicate the same disposition list eight times.
  - Treat FRICTION carve-out as undocumented exception — rejected because NC-5 is designer-ratified and an undocumented exception leaves future agents unable to distinguish "the architecture has a gap" from "the architecture has a sanctioned carve-out".
tags: [architecture, mcp, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/spec/cluster-d-1-spec-03.md
---

---
id: dr-20260507-04-universal-withdraw-fan-out-over-heterogeneous-storage
date: 2026-05-07
sprint: cluster-d-1
stage: execute-write
title: Universal withdraw verb dispatches to three internal callees over heterogeneous storage
decision: The universal `withdraw` MCP tool keeps storage heterogeneous — its handler routes by category to one of three internal functions (element-Map withdraw, concerns[] withdraw, definitions[] deprecate) rather than collapsing the underlying state into a homogeneous registry.
rationale: Architecture A's universal-tool ideal lives at the surface; the storage layer remains B.2-shipped (Map<id, element>, concerns[], definitions[]). Trying to homogenize storage was Architecture C's path and failed at concernsLocked semantics, dual-status axis collision, and migration of alien archive state. Routing inside the handler is a small fan-out that preserves the existing fields while delivering the caller-uniform tool. The pattern (universal verb at surface; internal dispatch by category) becomes the template for any future generic proof-tool addition, and a future cleanup pass that collapses storage stays a separate decision the architecture invites without forcing.
alternatives:
  - Collapse storage to a homogeneous Map keyed by entity id — rejected for Architecture C reasons (concernsLocked is a global gate not a per-entity status; status axes are orthogonal; migration of alien legacy types undefined).
  - Three independent withdraw tools at the MCP surface — rejected because callers would lose the uniform CRUD shape that motivates Architecture A; the universal verb is the point.
tags: [architecture, mcp]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/plan/cluster-d-1-plan-00.md
---

---
id: dr-20260507-05-bulk-ratify-on-close-with-flag-preservation-exception
date: 2026-05-07
sprint: cluster-d-1
stage: design-specify
title: confirm_closure_go bulk-ratifies and is the sole closing-flag preservation exception
decision: At `confirm_closure_go`, RULE-9 fires server-side: every active draft NC and every active unratified RC bulk-ratifies, and `recordDesignerGo` is the documented sole exception to the established `clearClosingFlags` pattern that every other mutation observes.
rationale: NC-12 and RULE-9 together require closure to bulk-ratify any element still in draft so the closing artifact carries no unratified content. Every other mutation in proof.js calls `clearClosingFlags` to invalidate any in-flight closing argument, because mutation invalidates the prior derivation. Closure itself cannot clear the closing flags — the flags ARE the closure record. The exception is therefore structural, not incidental: the close path preserves flags by design, all other paths clear them by invariant. Future contributors editing mutation paths must retain the clear-flags invariant; future contributors editing the close path must retain the preservation exception. The asymmetry is load-bearing.
alternatives:
  - Have `recordDesignerGo` clear and re-stamp the closing flags — rejected because the flags carry the very `closingArgGoRound` and closure provenance that closure exists to record; clearing them mid-close would erase the artifact.
  - Delegate bulk-ratify to the skill caller — rejected because RULE-9 is a server invariant; a skill that forgot to bulk-ratify before closing would ship unratified content in the closing envelope, violating the NC-9 hard gate.
  - Skip bulk-ratify and require all elements ratified before close — rejected because the proof workflow allows elements to remain in draft up to closure; forcing pre-closure ratification would push the entire ratification pass into a separate skill step.
tags: [architecture, mcp, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/spec/cluster-d-1-spec-03.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/plan/cluster-d-1-plan-00.md
---

---
id: dr-20260507-06-operationlog-completeness-as-audit-of-record
date: 2026-05-07
sprint: cluster-d-1
stage: execute-write
title: operationLog append on every mutation as audit of record
decision: NC-4's operationLog is the proof system's audit of record — every mutating function in proof-mcp must append an entry, with no exceptions; the final code review folded fixes for `recordClosingArgPresented` and `markChallengeUsed` to make the coverage exhaustive.
rationale: NC-4 requires an operationLog entry on every mutation so the proof history is reconstructible from the persisted state alone. Per-task implementation initially missed two mutation paths (`recordClosingArgPresented` and `markChallengeUsed`) — the cross-task review caught them as a class. Once a single mutation path skips the append, the log becomes "mostly complete" rather than "the audit of record", and downstream consumers cannot trust it as ground truth. The structural rule is now: any function that writes to state appends to operationLog in the same call, with consent token and operation summary; reviewers treat a mutation without an append as a defect, not an omission. Future proof-MCP extensions inherit this invariant.
alternatives:
  - Sample operationLog at higher-traffic paths only — rejected because partial coverage forfeits the "audit of record" claim; a designer reading state cannot tell whether a missing entry means "no mutation occurred" or "mutation occurred but skipped logging".
  - Move logging to a wrapper layer — rejected because mutating functions in proof.js are called from multiple handlers and applyOperations branches; a wrapper would either miss internal call paths or duplicate entries.
tags: [architecture, mcp, audit]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/spec/cluster-d-1-spec-03.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1/plan/cluster-d-1-plan-00.md
---

---
id: dr-20260508-01-binary-proof-lifecycle
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
stage: design-specify
title: Binary proof lifecycle (planning, finish) replaces three-value lifecycle with no reopen motion
decision: The proof MCP's `proofStatus` is a binary terminal-state value — `'planning'` (working state) and `'finish'` (terminal) — with no reopen motion; `loadState` backfills legacy values (`'open' → 'planning'`, `'closed' → 'finish'`, `'unopen' → 'planning'`) so older state files load cleanly, and once a proof reaches `'finish'` no path returns to `'planning'`.
rationale: The d.1 lifecycle carried three states (`'unopen'`, `'open'`, `'closed'`) plus a `reopen_proof` motion that allowed a closed proof to return to working state with a `lastClosureArtifact` retention field. The d.2 design session's friction report flagged this as overcomplication — once a proof is closed, the right move is to open a new proof, not resurrect the old one — and the multi-value `'unopen' → 'open' → 'closed' → reopened` cycle invited callers to model a richer state machine than the proof system actually needs. Collapsing to binary makes terminal-state genuinely terminal at the type level. Future proof-MCP work must not reintroduce a reopen path; new proofs are cheap and clean, reopened proofs hide closure provenance under continued mutation.
alternatives:
  - Preserve three-value lifecycle with reopen for in-place revision — rejected because reopen invites stale-closure-artifact pollution and the d.2 friction report explicitly demanded its retirement.
  - Keep three values but freeze closed proofs (no reopen, but distinguish `unopen` from `open`) — rejected because the `unopen` state was only meaningful before `open_proof` ran and post-`open_proof` the value is always `open`; collapsing to binary erases a state that callers could not observe anyway.
  - Add a `'archived'` fourth state for soft-deletion — rejected as out-of-scope and as recreating the same multi-state hazard the binary collapse eliminates.
tags: [architecture, mcp, revert]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/summary/sprint-d-1-fix-proof-mcp-summary-00.md
---

---
id: dr-20260508-02-first-yes-precondition-replaces-concerns-gate
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
stage: design-specify
title: First-yes precondition gates closing-argument presentation across all four ratification lanes
decision: `present_closing_argument` is gated server-side by a per-element first-yes precondition (`checkFirstYesGate` from `first-yes-gate.js`) that iterates every active NC, RC, Concern, and Definition and refuses with structured `FIRST_YES_GATE_FAILED` (carrying `unratified_ids[]`) if any element remains in working state; this supersedes the narrower `concernsRatificationGate` that previously fired only against draft Concerns at score-derivation time.
rationale: The d.1 closing-argument flow checked Concern ratification at `evaluateTrigger` score-time but did not require NC, RC, or Definition ratification before presentation — closure could proceed with elements in draft so long as Concerns were ratified, then bulk-ratify-on-close (RULE-9) would silently sweep the working elements into the closing artifact. The d.2 friction report flagged this as a closure-discipline failure: bulk-ratify hides what the designer actually approved, so a per-element first-yes pass before presentation makes ratification an explicit precondition rather than an end-of-pipeline implicit conversion. The pure-function `first-yes-gate.js` module localizes the check; `evaluateTrigger`'s remaining quality checks (collapse-test, rejected-alternatives) survive but the ratification gate inside `evaluateTrigger` is removed because the precondition has already enforced it. Future closure-gate changes must preserve the four-lane scope; narrowing to fewer element types reintroduces the silent-promotion hazard.
alternatives:
  - Keep `concernsRatificationGate` as the only gate and add bulk-ratify-on-close — rejected as the d.1 design which the d.2 friction report retired; bulk-ratify hides ratification under closure mechanics.
  - Run the four-lane check at `evaluateTrigger` score time only — rejected because score-time refusal surfaces as a low score rather than a structured tool-level error and the caller cannot distinguish "score insufficient" from "ratification missing."
  - Run the gate at `confirm_closure_go` (the second yes) only — rejected because it lets a closing argument be presented against working state, then reject at the final yes; failing earlier preserves the round and keeps the presentation-then-confirmation contract honest.
tags: [architecture, mcp, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/summary/sprint-d-1-fix-proof-mcp-summary-00.md
---

---
id: dr-20260508-03-bulk-ratify-retired-replaced-by-precondition
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
stage: design-specify
title: Bulk-ratify-on-close hook retired; first-yes precondition makes it unnecessary
decision: The RULE-9 bulk-ratify hook in `recordDesignerGo` is removed entirely — `confirm_closure_go` no longer sweeps active draft NCs and unratified active RCs into ratified state; the first-yes precondition at `present_closing_argument` ensures every element is already ratified by the time closure can be confirmed.
rationale: Bulk-ratify-on-close was load-bearing under d.1's lifecycle because `present_closing_argument` did not enforce per-element ratification; without it, closure could ship a closing artifact carrying unratified content. The first-yes precondition (`dr-20260508-02`) moves ratification enforcement to presentation time, which makes bulk-ratify redundant and structurally inferior — bulk-ratify implicitly converts working content to ratified inside a single tool call, while precondition-then-confirm makes the ratification step the designer's explicit upstream action. Removing the hook also simplifies `recordDesignerGo` to a pure status flip, restoring it to a small ceremonial function. Future closure paths must not reintroduce silent ratification sweeps; ratification is the designer's explicit upstream act, not closure's side effect.
alternatives:
  - Keep bulk-ratify alongside first-yes precondition (defense in depth) — rejected because once the precondition enforces ratification, bulk-ratify either fires against zero elements (dead code) or fires against elements the precondition let through (silent precondition violation); both are bad.
  - Make bulk-ratify configurable via consent token — rejected because adding a knob to a closure path that must be deterministic invites caller drift and the precondition makes the knob meaningless.
tags: [mcp, revert, governance]
supersedes: dr-20260507-05-bulk-ratify-on-close-with-flag-preservation-exception
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/summary/sprint-d-1-fix-proof-mcp-summary-00.md
---

---
id: dr-20260508-04-defense-in-depth-post-finish-refusal
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
stage: execute-write
title: Post-finish mutation refusal lives at both state-layer and handler pre-flight
decision: Every mutating proof-MCP function refuses post-finish mutations at two layers — the state-layer mutator returns a structured `PROOF_FINISHED` error when invoked against `proofStatus === 'finish'`, and every server handler runs a pre-flight `proofFinishedResponse` check before calling the mutator; the handler-layer pre-flight is structural (not redundant) because `handleSubmitProofUpdate` reads `result.errors[]` directly without passing through `classifyStateError`.
rationale: A single state-layer guard would be sufficient for handlers that route errors through `classifyStateError` (which surfaces structured `{code, message}` responses), but `handleSubmitProofUpdate` consumes `applyOperations`' `result.errors[]` as a plain array and would surface `PROOF_FINISHED` as an undifferentiated string. The handler-layer pre-flight ensures every refusal path returns the structured error with `isError: true` and `code: 'PROOF_FINISHED'`, which is what callers and the audit consume. Future post-state-transition refusals (any new terminal status added later, any new mutating tool added later) must replicate the two-layer pattern; the layering is an invariant, not over-engineering. Reviewers should treat a missing pre-flight as a defect when the mutator's state-layer error path bypasses `classifyStateError`.
alternatives:
  - State-layer-only refusal (single guard) — rejected because `handleSubmitProofUpdate` would surface unstructured error strings, breaking the structured-error contract callers depend on.
  - Handler-layer-only refusal (single guard) — rejected because internal callers of mutating state functions (e.g., `processFriction` calling `manageFriction`) bypass the handler layer; without state-layer guards a friction post-finish could mutate state by internal call path.
  - Route every handler through `classifyStateError` — rejected as a larger refactor than the layering pattern needs; existing handlers depend on direct `result.errors[]` reads for fine-grained error reporting.
tags: [architecture, mcp, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/summary/sprint-d-1-fix-proof-mcp-summary-00.md
---

---
id: dr-20260508-05-challenge-mode-personalities-retired
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
stage: design-small-task
title: Challenge-mode personality machinery retired; replaced by round-prompt agent conduct
decision: The structural challenge-mode personality machinery is fully retired — `detectChallenge`, `detectStall`, `STALL_WINDOW`, `markChallengeUsed`, the four challenge-history fields on state (`conditionCountHistory`, `elementCountHistory`, `challengeModesUsed`, `challengeLog`), the `challenge_used` parameter on `submit_proof_update`, and the `challenge_trigger` / `stall_detected` response fields are deleted; the conduct that the three personalities were meant to encode (consolidator, tighten-the-screws, drop-bad-fits) becomes round-prompt agent discipline owned by a future presentation-layer sprint.
rationale: The d.2 friction report identified the challenge-mode machinery as a category error: the proof MCP encoded what should be agent-conduct (how to challenge a stalling proof) as state-machine machinery (count-based stall detection, personality codes flowed back to the agent as triggers). The structural shape made the proof system carry presentation-layer concerns, which violated the proof MCP's role as a pure proof-state service. Retiring the machinery reduces state surface, removes a count-based heuristic that was tunable and brittle, and pushes the conduct discipline to where it belongs — the round prompts in `design-large-task/SKILL.md`. The follow-up doc `challenge-personalities-fold-into-round-prompts.md` exists in the sprint design dir as the handoff for that future work. Future proof-MCP work must not reintroduce stall detection or personality codes in state; the conduct lives in skill prose, not in the proof system.
alternatives:
  - Preserve the machinery and merely soften the agent's use of it — rejected because the structural shape is the bug, not the agent's behavior; soft-touch use of brittle machinery is still brittle.
  - Move the machinery to a sibling MCP (e.g., a dedicated challenge-mode service) — rejected as out-of-scope and as adding integration boundaries for what is fundamentally a presentation-layer concern.
  - Delete the personalities but keep stall detection — rejected because count-based stall detection without the personalities is a signal with no consumer; the count-history fields existed to feed personality selection.
tags: [revert, mcp, architecture]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/design/sprint-d-1-fix-proof-mcp-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/design/challenge-personalities-fold-into-round-prompts.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/summary/sprint-d-1-fix-proof-mcp-summary-00.md
---

---
id: dr-20260508-06-body-advancement-agent-internal-only
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
stage: design-specify
title: body_advancement signal is agent-internal context, never surfaced to the designer
decision: The `body_advancement` field returned by `submit_proof_update` (counts of adds, revises, withdraws across load-bearing element types plus Concerns and Definitions) is agent-internal context only — used by the agent to decide round pacing and prompt shape — and must never appear in any designer-facing turn output, surface text, or proof artifact; the field is also transient (computed in `applyOperations`, returned in the submit response, never persisted to state) and is therefore omitted from `summary_mode`'s response shape.
rationale: The signal exists to give the agent a structured proxy for "is the proof advancing or churning" so round prompts can adapt; surfacing the counts to the designer would burden them with proof-internal mechanics and invite a counting game where the designer optimizes for the metric rather than the proof. Keeping it agent-internal preserves the proof MCP's role as the agent's working tool while leaving the designer's interface clean. The transience constraint (no persistence) was caught during hardening: a `state.bodyAdvancement ?? null` read in summary_mode would always be `null` because the field never lives in state; rather than ship a permanent-null in the contract, the field is dropped from summary_mode entirely. Future agent-internal signals follow the same rule: agent-context data does not flow to the designer surface and does not get persisted unless it has a state-layer consumer.
alternatives:
  - Surface `body_advancement` in turn output as a "round progress" line — rejected because it makes proof mechanics designer-visible and creates a counting game.
  - Persist `body_advancement` to state for cross-round reads — rejected because the signal is per-round by definition; cross-round persistence would give a stale value and force the agent to compute deltas, duplicating the per-round computation.
  - Include `body_advancement` in summary_mode as a snapshot of the most-recent submit — rejected because summary_mode is read by tools that did not necessarily fire the most-recent submit; the value would be ambiguous about which round it describes.
tags: [convention, mcp, governance]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/summary/sprint-d-1-fix-proof-mcp-summary-00.md
---

---
id: dr-20260508-07-summary-mode-for-harness-limits
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp
stage: design-specify
title: get_proof_state summary_mode flag for harness response-size compliance
decision: `get_proof_state` accepts an optional `summary_mode: boolean` parameter; when true, the response carries counts and IDs only — `{ proofStatus, round, counts, closurePermitted, closureReasons, elements: { [id]: { type, status } }, concerns: [{ id, status }], definitions: [{ id, status }] }` — with no element bodies and no operation log, capping the response well under the 25K token harness limit; absent or false, the response is the full-body shape.
rationale: Long sessions accumulate proof state large enough that the full `get_proof_state` response can exceed harness response-size limits, leaving the agent unable to read its own working state. A summary mode lets the agent ask for IDs-and-status when it only needs to navigate the proof's structure, reserving full-body reads for moments that genuinely need them. The flag is opt-in so existing callers continue to receive full state by default; adding a closed shape (counts, IDs, status flags only) keeps the summary deterministic and grep-able. Future proof-MCP read tools that risk crossing harness limits should follow the same pattern: opt-in summary mode with a closed response shape, full-body as the default.
alternatives:
  - Make summary mode the default and full-body opt-in — rejected because it silently changes the contract for every existing caller and forces audit of every read site for whether it needs full bodies.
  - Stream the full response in chunks — rejected because the MCP tool surface returns a single response object; streaming would require a multi-call protocol the harness does not currently support.
  - Add per-field projection (caller specifies which fields to include) — rejected as over-engineered for the actual need; the closed summary shape is what callers want when they want less.
tags: [mcp, format, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/spec/sprint-d-1-fix-proof-mcp-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp/summary/sprint-d-1-fix-proof-mcp-summary-00.md
---
