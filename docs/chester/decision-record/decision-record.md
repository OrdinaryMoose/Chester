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
