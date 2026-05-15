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

---
id: dr-20260508-08-nc-ratify-path-closes-first-yes-gate-cycle
date: 2026-05-08
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2
stage: execute-write
title: NC ratify path closes first-yes-gate cycle
decision: Ship a dedicated `ratify_necessary_condition` tool mirroring `ratify_resolve_condition`'s shape (state-layer function plus server tool registration plus handler), with three intentional divergences — 2-tuple return shape (matches `ratifyConcern` rather than RC's 3-tuple), `ALREADY_RATIFIED` guard (NC ratify is non-idempotent — re-ratifying a ratified NC errors), and no `processFriction` arms (NC ratify is not a friction trigger) — to provide the missing write path that flips an NC's `ratificationStatus` to `'ratified'` so `present_closing_argument`'s per-element first-yes precondition gate from sprint-d-1-fix-proof-mcp can be cleared.
rationale: sprint-d-1-fix-proof-mcp shipped two interacting changes in the same merge — AC-2.4 removed the bulk-ratify-NCs hook from `recordDesignerGo`, and AC-4.1 / AC-4.2 added a per-element first-yes precondition gate to `present_closing_argument` requiring every active NC to have `ratificationStatus === 'ratified'`. Both ACs were individually correct; their interaction left no code path that could flip an NC's `ratificationStatus` to `'ratified'`, leaving `present_closing_argument` unreachable, formal closure unreachable, and the closing-argument envelope unproducable. Per-element ratify discipline aligns with the per-element first-yes precondition AC-4.1 was clearly aiming for. Alternative paths (restore bulk-ratify, drop NCs from gate, lazy auto-ratify on RC bundle) all weakened the audit semantic AC-4.1 established. A dedicated tool keeps the ratify-discipline shape symmetric across element types that have a ratify lifecycle (RC, Concern, Definition, NC). Lesson: when adding a per-element gate, verify a write path exists for every element type the gate references; the closure-path integration test added by AC-5.1 catches this class of cross-AC interaction miss in CI by exercising NC creation → NC ratify → first-yes gate clearance → present_closing_argument → confirm_closure_go end-to-end.
alternatives:
  - Restore the bulk-ratify-NCs hook in `recordDesignerGo` — rejected because it reverts AC-2.4 and reintroduces the ratify-without-review semantic the sprint-d-1-fix sprint deliberately removed.
  - Drop NCs from the first-yes precondition gate — rejected because it weakens AC-4.1's per-element ratification audit, leaving a class of element with no enforced first-yes record before formal closure.
  - Lazy auto-ratify NCs as a side effect of RC ratification bundle — rejected because it couples two unrelated lifecycle transitions and produces a ratify event with no designer-visible action, defeating the audit semantic.
tags: [mcp, governance, lifecycle]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/spec/sprint-d-1-fix-proof-mcp-2-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-2/plan/sprint-d-1-fix-proof-mcp-2-plan-00.md
---

---
id: dr-20260509-01-read-only-inspection-tool-family
date: 2026-05-09
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3
stage: design-small-task
title: Read-only inspection tools form a canonical no-consent / no-proofStatus / no-write family on the proof MCP
decision: `render_proof_state` joins `get_proof_state` and `manage_definitions op:query-overlap` as the third member of the proof MCP's read-only inspection-tool family, formalizing the canonical shape for any future inspection-style tool — no consent token check, no `proofStatus === 'finish'` gating, no filesystem writes, no state mutation under any input.
rationale: Two prior tools (`get_proof_state` and `manage_definitions op:query-overlap`) established the precedent ad hoc; with a third member shipped under the same shape and with the design brief explicitly anchoring on that precedent, the family is now the canonical pattern, not a one-off. The shape exists because read-only inspection paths must remain available across the entire proof lifecycle — including post-`finish` — without consuming consent tokens that the consent system reserves for mutating intent. Future read-only tools that want to consume consent or gate on `proofStatus` need to argue for a divergence; the default is family membership. Adding a fourth member is now a routine extension, not a new precedent.
alternatives:
  - Treat each read-only tool as an independent decision with no shared family — rejected because the third instance hitting the same shape is the moment a pattern stops being incidental and starts being load-bearing; future contributors should know the shape exists by name.
  - Require consent tokens on read-only tools so the audit log captures every read — rejected because the audit log records mutations, not reads, and consent on reads would block post-`finish` inspection of closed proofs (a workflow the family explicitly preserves).
  - Gate read-only tools on `proofStatus !== 'finish'` to mirror mutation refusal — rejected because reading a finished proof is precisely when designers and reviewers most need inspection access; the gate would break the closure-review workflow.
tags: [architecture, mcp, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/design/sprint-d-1-fix-proof-mcp-3-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/spec/sprint-d-1-fix-proof-mcp-3-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/summary/sprint-d-1-fix-proof-mcp-3-summary-00.md
---

---
id: dr-20260509-02-inline-only-default-for-render-tools
date: 2026-05-09
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3
stage: design-small-task
title: Read-only render tools default to inline-only output; disk-write surface deferred until a real consumer drives its shape
decision: `render_proof_state` ships with no `output_path` parameter and no filesystem write of any kind — the rendered string is returned inline in the standard tool-result `content` shape — explicitly rejecting the original problem report's `output_path` axis; the pattern that reads "read-only render tools default to inline-only; disk-write is added later when a real consumer drives the shape" becomes the precedent for future render-style tools.
rationale: The original problem report proposed an `output_path` parameter to bypass inline-result token caps, but the design conversation's live format demonstration (5–8 KB markdown for a 45-element proof, deep render under 1 KB) showed observed output sizes are well under the inline cap. Disk-write surface ages badly without a real consumer driving its concrete shape — path validation rules, parent-directory checks, overwrite policy, three error codes from the report's Q5 — and shipping speculative shape locks future contributors into a contract no caller actually wanted. The honest move is to refuse with a clear error if a future proof exceeds the inline cap, and add disk-write at that point with a real consumer. Future render-style tools on the proof MCP follow the same posture: inline-only by default; disk-write is a deferred, consumer-driven extension.
alternatives:
  - Ship `output_path` per the original problem report — rejected because no current consumer drives the shape, and speculative file-write surface invites maintenance churn through revisions before the first real call.
  - Compromise with a `format: 'inline' | 'file'` enum and a stub file path — rejected as still speculative, plus the enum invites callers to choose the wrong branch and surfaces the same uncovered shape questions inline-only avoids.
  - Stream output in chunks via a multi-call protocol — rejected because the MCP tool surface returns one response object per call and streaming would require harness-level changes for a problem the inline-only path already solves at observed sizes.
tags: [architecture, mcp, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/design/sprint-d-1-fix-proof-mcp-3-design-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/spec/sprint-d-1-fix-proof-mcp-3-spec-00.md
---

---
id: dr-20260509-03-partitioner-sharing-pattern
date: 2026-05-09
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3
stage: design-specify
title: Partitioner-sharing pattern — pure type-and-status filter shared across consumers; closure-specific work stays inline in deriveClosingArgument
decision: `closing-argument.js` exports a new named function `partitionActiveElements(state)` returning seven raw active-by-type lanes (`activeNCsAll`, `activeRCs`, `activeRules`, `activePermissions`, `activeEvidence`, `activeRisks`, `activeConcerns`) with no field projection or sub-mapping; both `deriveClosingArgument` (closure-time consumer) and `renderProofRecap` (conversation-time consumer) consume it as the single source of truth for "which elements are active by type", while ratification splits, projection mapping, friction lifecycle, phantom partitions, locked-concerns logic, and closure provenance all stay inline in `deriveClosingArgument` because they have no other consumer.
rationale: Both the closing-argument envelope and the conversation-time recap need the same active-by-type partition; without a shared producer, two source-of-truth paths drift silently when new element types or dispositions are added later. The partitioner stays a pure type-and-status filter so the recap path doesn't pay for closure-only computation it never consumes (provenance derivation, ratification splits, phantom-element partitioning), and so closure-specific concerns aren't smeared into a function general consumers reach for. The named lane `activeNCsAll` deliberately diverges from `deriveClosingArgument`'s published `activeNCs` key (ratified-only) to prevent caller confusion about ratification semantics. Future render-side or analytics-side tools on the proof MCP that need active-by-type access should consume `partitionActiveElements`; they should not re-derive the partition, and they should not push closure-specific work into the partitioner.
alternatives:
  - Share the full `deriveClosingArgument` derivation including provenance and ratification splits — rejected because closure-specific computation has no consumer in the recap path and paying for it on every recap invocation is waste, plus pulls closure semantics into a general read.
  - Parallel re-derivation of type-and-status filtering inside the render module — rejected because two source-of-truth paths invite silent drift when new element types or dispositions are added later; the partition must be the single producer.
  - Reuse `deriveClosingArgument`'s existing `activeNCs` lane name in the partitioner — rejected because the closure key carries ratified-only semantics and the partitioner's lane is ratified-and-draft; sharing the name would confuse callers about what the lane contains.
tags: [architecture, mcp]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/spec/sprint-d-1-fix-proof-mcp-3-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/summary/sprint-d-1-fix-proof-mcp-3-summary-00.md
---

---
id: dr-20260509-04-deep-render-multi-storage-lookup-scoped-to-seven-types
date: 2026-05-09
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3
stage: design-specify
title: Deep-render multi-storage element lookup is scoped to seven types; FRIC- and DEFN- fall through to ELEMENT_NOT_FOUND
decision: `findElementById(state, id)` in `state-render.js` dispatches by ID prefix to seven element types only — `NCON-`, `RULE-`, `PERM-`, `EVID-`, `RISK-`, `RCON-` go to `state.elements.get(id)`; `CERN-` goes to `state.concerns.find()`; every other prefix including `FRIC-` (FRICTION) and `DEFN-` (DEFINITION) returns `null` and falls through to the structured `ELEMENT_NOT_FOUND` refusal — establishing that the deep-render surface is bounded to designer-readable element types and is not a general-purpose state inspector.
rationale: The design brief's deep-render enumeration explicitly listed seven types with their printable sub-fields; FRIC- and DEFN- have lifecycle and storage shapes (friction events with consent provenance, definitions with overlap-search semantics) whose printable form is not part of designer-recap discipline. Routing them through deep-render would either invite half-rendered output or pull in lifecycle-specific projection that doesn't belong in a render module. The `ELEMENT_NOT_FOUND` fall-through gives the same structured refusal callers already handle for unknown IDs, so out-of-scope prefixes don't need a separate error code. Future render-side tools on the proof MCP follow the same scoping: extending the deep-render surface to a new element type is an explicit decision (add the prefix dispatch, add the per-type render function, add tests), not an automatic consequence of adding a new element type to the proof system.
alternatives:
  - Route every prefix in `state.elements` plus `state.concerns` plus `state.definitions` plus `state.friction` to deep-render — rejected because friction and definition objects carry lifecycle shapes whose printable form is not part of the designer-recap discipline this tool serves; rendering them would either be half-baked or would smear lifecycle concerns into a recap-shaped tool.
  - Add a separate `RENDER_OUT_OF_SCOPE` error code distinct from `ELEMENT_NOT_FOUND` for FRIC-/DEFN- prefixes — rejected because callers already handle `ELEMENT_NOT_FOUND` and the distinction adds caller-side branching for no observable benefit; an unknown ID and an out-of-scope prefix both mean "the agent should fix the ID and re-call".
  - Route FRIC- and DEFN- through a fall-back rendering of just `id + status` so deep render works on every element — rejected because consistent partial output is worse than a clean refusal; designers who deep-render an FRIC- ID need full friction context, which the recap-shaped tool isn't built to produce.
tags: [architecture, mcp, convention]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/spec/sprint-d-1-fix-proof-mcp-3-spec-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/spec/sprint-d-1-fix-proof-mcp-3-spec-ground-truth-report-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/summary/sprint-d-1-fix-proof-mcp-3-summary-00.md
---

---
id: dr-20260509-05-tools-array-named-export-for-introspection
date: 2026-05-09
sprint: 20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3
stage: execute-write
title: Promote proof-mcp/server.js TOOLS array to a named export so schema-introspection tests can consume it
decision: `proof-mcp/server.js` promotes its module-internal `const TOOLS = [...]` definition to `export const TOOLS = [...]`, making the tool registry observable to tests that need to assert on schema shape (input properties, required arrays, presence and absence of fields like `consent`) without spinning up a live MCP server; the change is a deliberate, minimal expansion of the proof MCP's public surface and sets the precedent that read-only test affordances are acceptable expansions of the public module surface when the alternative is process-level integration testing for shape assertions.
rationale: AC-1.1 required tests to assert that `render_proof_state`'s entry exists in `TOOLS` with the correct schema shape and that `consent` is absent — a contract assertion that lives most cleanly at module level, not at protocol level. Without a `TOOLS` export the test would have to spin up the server, send a `ListTools` request over the MCP transport, and inspect the response — adding integration scaffolding for what is structurally a static-data assertion. Promoting the constant to an export adds one keyword and surfaces a stable, append-only registry that already changes only when tools are added. Future proof-MCP work that registers a new tool inherits the introspection-friendly shape; future contributors who want schema assertions over the registry should write static-data tests against `TOOLS` rather than reach for live-server integration tests.
alternatives:
  - Keep `TOOLS` module-internal and write integration tests that send `ListTools` over the MCP transport — rejected because integration scaffolding for static-data assertions is over-engineered, and the test cost compounds with every new tool.
  - Duplicate the tool definitions in a parallel test fixture — rejected because duplication invites silent drift between the registered shape and the asserted shape; the registry must be the single source of truth.
  - Add a `getRegisteredTools()` accessor function rather than exporting the constant — rejected as ceremony around what is already an inert append-only data structure; the export is the simplest shape that satisfies the contract.
tags: [architecture, mcp, tool]
supersedes: null
artifact_refs:
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/plan/sprint-d-1-fix-proof-mcp-3-plan-00.md
  - working/20260430-02-rebuild-design-derivation/cluster-d-build-shared-understanding/sprint-d-1-fix-proof-mcp-3/summary/sprint-d-1-fix-proof-mcp-3-summary-00.md
---

---
id: dr-20260512-01-datalog-constants-exclude-non-finite-numbers
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: execute-write
title: Datalog constants exclude non-finite numbers
decision: `FactStore.isConstant` requires `Number.isFinite(v)` for numeric arguments, narrowing the constant set from `string | number | boolean | null` to `string | finite-number | boolean | null` and rejecting `NaN`, `+Infinity`, and `-Infinity` with `TYPE_ERROR` at the EDB write boundary.
rationale: In JavaScript `typeof NaN === 'number'` and `typeof Infinity === 'number'` are both true, so the original literal phrasing admits non-finite numbers as constants. `JSON.stringify` then serializes `NaN`, `Infinity`, and `-Infinity` all as `null`, which causes silent fact-key collisions between e.g. `assertFact('p', [NaN])` and `assertFact('p', [null])` — corruption that propagates into the Evaluator as wrong-result joins. The tightening must live at the EDB write boundary so every layer above (Domain rule construction, Interface fact assembly) inherits the guarantee without re-implementing the check. Future sprints that build facts programmatically — Domain layer, Interface layer, serialization replay paths — rely on this constraint and must not loosen it.
alternatives:
  - Keep the literal `string | number | boolean | null` definition and document the JSON.stringify hazard in a caller-side note — rejected because callers cannot reliably guard against a serialization collision they cannot observe, and the corruption is silent rather than diagnostic.
  - Move the finite-number check into the Domain layer's fact-assembly path — rejected because the Engine is the single source of truth for EDB validity and the Domain is not the only fact-producing caller (Serializer replay, future test scaffolding, Interface direct assertion all bypass Domain).
  - Detect the collision at query time via a key-equality canary — rejected because the corruption is already in the IDB by query time; the fix must prevent the bad write, not diagnose the bad read.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md
---

---
id: dr-20260512-02-unbound-head-variable-derivation-boundary-guard
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: execute-write
title: Evaluator throws UNBOUND_HEAD_VARIABLE at derivation boundary as defense-in-depth
decision: `Evaluator.fireRule` checks `headArgs` for `undefined` elements (produced when a rule head references a variable absent from all non-negated body atoms) and throws `{ code: 'UNBOUND_HEAD_VARIABLE', ruleId }` at the derivation boundary, surfacing the unsafe-rule defect at `derive()` time rather than allowing a poisoned IDB entry whose key (`JSON.stringify` serializes `undefined` to `null`) silently collides with a legitimate null-valued fact.
rationale: The canonical Datalog safety condition — head variables must be a subset of non-negated body variables — belongs at rule definition (`RuleStore.defineRule`), and an outstanding D2 item carries that work forward. But the derivation-boundary guard remains valuable as defense-in-depth: it converts a silent-corruption failure mode into a loud, attributable throw that points at the offending `ruleId`. The same shape as the D1 finite-number guard (silent `JSON.stringify` key collision converted to a diagnostic refusal), at the IDB write path instead of the EDB write path. Future Engine work that touches the derivation hot path should preserve this guard even after RuleStore-side validation lands, unless the audit explicitly determines the guard has become redundant.
alternatives:
  - Rely solely on RuleStore-side validation when it lands and remove the Evaluator guard now — rejected because the spec/plan/code state during this sprint had no RuleStore safety check, and skipping the runtime backstop would have let the Evaluator silently corrupt the IDB during the sprint's own test runs and any caller that bypassed validation.
  - Treat the unbound-head case as a programming error and let `unify` fail downstream — rejected because the downstream failure is nondeterministic (`undefined !== anything` even for matches the serialized key implies should succeed) and the diagnostic loses the offending ruleId by the time the symptom surfaces.
  - Coerce `undefined` head positions to `null` for serialization consistency — rejected because it papers over the rule defect with a silent data choice, making subsequent debugging strictly harder.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md
---

---
id: dr-20260512-03-negation-as-failure-existential-quantification
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: execute-write
title: Negation-as-failure existentially quantifies unbound atom variables
decision: `Evaluator.matchBodyAtom`'s negation branch implements canonical Datalog semantics by direct-unifying each candidate fact against the atom pattern, then checking the resulting bindings against `currentBindings` for consistency, rather than substituting bound variables and unifying — so a negated atom with unbound variables (e.g. `¬ancestor(X, Y)` with `X` bound) means "there is NO Y such that the atom holds," not "there is no fact whose unbound positions equal `undefined`."
rationale: The plan-prescribed substitute-then-unify algorithm produced `['a', undefined]` for `¬ancestor(a, Y)` and — correctly per the Unifier's contract — failed to match any fact whose second position was a real value, so the negation erroneously succeeded for queries it should have failed. The textbook test case `leaf(X) :- node(X), ¬ancestor(X, Y)` with `parent(a, b)` asserted (and `ancestor(a, b)` derived) must NOT derive `leaf(a)`; the canonical fix restores that semantic and locks AC-9.4. Domain queries in sprint-02 will routinely write negated atoms with unbound variables — necessary-condition stratification depends on "there is no friction event with disposition rejecting this NC" patterns — and they rely on this existential-quantification semantic. Any future change to the negation branch must preserve direct-unify-then-consistency-check; substitute-then-unify is incorrect Datalog.
alternatives:
  - Keep the plan-prescribed substitute-then-unify branch and document the limitation as "all negated atom variables must be bound by prior body atoms" — rejected because it imposes a stronger caller-side discipline than standard Datalog and silently produces wrong results when violated, which Domain-layer authors would routinely violate without realizing.
  - Treat any unbound variable in a negated atom as a malformed-rule error at definition time — rejected because the canonical semantic IS to existentially quantify; rejecting the rule shape would force callers to invent ground-fact-shaped workarounds for queries the engine should answer directly.
  - Substitute bound variables, then for each unbound position iterate the full domain — rejected because it produces an exponential candidate space and discards the natural fact-driven enumeration the Unifier already provides.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md
---

---
id: dr-20260512-04-loadfrom-atomic-via-snapshot-restore
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: execute-write
title: loadFrom guarantees atomicity across all failure modes via snapshot/restore
decision: `loadEngineFrom` snapshots the live engine before `engine.clear()` and wraps replay in a try/catch that calls `engine.restore(rollback)` on any exception — `TYPE_ERROR` on a fact with `NaN`, `MALFORMED_RULE`, `DUPLICATE_RULE_ID`, `CYCLIC_NEGATION`, `UNBOUND_HEAD_VARIABLE`, or any other replay-path throw — so the spec's AC-7.3 atomicity guarantee ("engine state is unchanged from before the failed loadFrom call") holds unconditionally rather than only for the shallow-schema validation gate.
rationale: The plan-prescribed serializer validated payload shape, then cleared, then replayed via public `assertFact`/`defineRule` calls — leaving the engine in a partially-loaded state on any mid-replay throw. The natural reading of AC-7.3 is unconditional atomicity, and the Task-10 snapshot/restore facility makes the wrap mechanically trivial. Spec-promised atomicity guarantees must hold across all failure modes the call site can produce, not just the failure modes the implementation happened to gate at first; if a narrower guarantee is intended, the AC must be tightened, not the code's behavior. Future lifecycle operations on the Engine — bulk-load, replay, migration — inherit the same precedent: any operation that advertises atomicity wraps in snapshot/restore unless atomicity is explicitly bounded in the AC.
alternatives:
  - Keep the non-atomic replay and tighten AC-7.3 to "atomicity holds only for shallow-schema failures" — rejected because the natural reading of the AC favors broader atomicity and the snapshot facility makes the broader guarantee nearly free; narrowing the contract to match a weaker implementation reverses the customary direction.
  - Re-validate each fact and rule pre-clear by running a dry replay against a sandbox engine — rejected because it doubles the replay cost on the happy path and still leaves a window where the live engine is cleared and the replay throws for a non-determinism reason a sandbox can't predict.
  - Move atomicity into the caller by exposing `clear()` and `replay()` separately and requiring the caller to wrap — rejected because `loadFrom` is the spec-named atomic operation; pushing the wrap to callers defeats the abstraction and invites duplication across every caller.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md
---

---
id: dr-20260512-05-snapshot-rollback-transaction-strategy
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: plan-build
title: Transactions implemented via snapshot-at-begin and restore-on-rollback rather than a TransactionBuffer
decision: The Engine implements `ITransaction` by snapshotting the live state at `begin()`, applying all mutations live during the transaction, discarding the snapshot at `commit()`, and restoring the snapshot at `rollback()` — no `TransactionBuffer` class, no shadow write set, no apply step at commit.
rationale: Once the Engine has a cheap full-copy snapshot (`structuredClone`-based, established in Task 10), the snapshot point IS the rollback point, and `read-own-writes` is trivially satisfied because queries inside the transaction see the live state which already reflects the buffered mutations. ADR-0013's stratification-at-defineRule requirement is satisfied for free because the live rule store carries the new rules during the transaction. Commit becomes trivially atomic by construction — there is no apply step to fail, so no try/catch wrapper is needed. The TransactionBuffer file the design cascade originally implied would be dead code, and this decision retroactively justifies extending atomicity guarantees elsewhere (see dr-20260512-04) because the same snapshot facility makes broader atomicity contracts nearly free across the lifecycle surface.
alternatives:
  - Buffered-writes TransactionBuffer with apply-at-commit — rejected because read-own-writes requires queries inside the transaction to traverse both the buffer and the committed view, the stratification check at defineRule must run against the merged view, and commit acquires an apply step that can partially fail and reintroduce atomicity concerns.
  - Copy-on-write per-mutation overlay — rejected because the per-mutation overhead is non-trivial for the rule-heavy workloads Domain layer will produce, and the snapshot at begin is a single bounded cost regardless of transaction size.
  - Two-phase commit with write-ahead log — rejected as over-engineered for an in-process engine with no durability requirements; the spec scope (in-memory, single-process) does not motivate the complexity.
tags: [architecture, tool]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/spec/sprint-01-proof-backend-spec-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-plan-00.md
---

---
id: dr-20260512-06-execute-write-fix-and-defer-pattern-for-reviewer-findings
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: execute-write
title: Fix-inline-and-defer-documentation pattern under reviewer findings during execute-write
decision: When a quality reviewer surfaces a Critical or Important finding in plan-prescribed source during execute-write, the canonical session response is (a) apply a surgical fix inline (or via a re-dispatched implementer) with operator authorization, (b) log a deferred item enumerating the outstanding spec/plan amendments and acceptance criteria for closure, and (c) continue to the next task — the code change does not wait on documentation alignment.
rationale: Sprint-01's execute-write phase produced five such instances (D1-D5), demonstrating that reviewer-surfaced plan deviations are a normal-path outcome of execute-write rather than an exceptional case. Holding the code change until the spec/plan/engine-spec text catches up would block downstream tasks (e.g. D1's silent key collision had to be fixed before Task 6 Evaluator built on a clean EDB) and would batch documentation edits that share natural cadence at sprint close anyway. The deferred-items log carries the spec/plan amendment work forward with explicit acceptance criteria, so the spec → plan → code chain becomes consistent by close-out without serializing the implementation behind documentation revisions. Future plan-build sprints should anticipate this pattern and reserve a documentation-revision slot near `finish-write-records`; future execute-write sessions should treat "apply surgical fix + log D-item" as the default response to reviewer-surfaced plan deviations, not an escalation.
alternatives:
  - Halt execute-write at each reviewer finding and revise spec/plan before resuming — rejected because it serializes implementation behind documentation cadence, blocks downstream tasks, and inflates the number of plan-version bumps mid-sprint.
  - Apply the fix and silently amend the spec/plan inline without a deferred-items entry — rejected because the in-flight edits would have no acceptance criteria for closure, no review surface, and would degrade audit traceability for the deviation.
  - Reject the reviewer finding when it would require a plan deviation, on the principle that execute-write must not deviate from the plan — rejected because the findings flagged genuine correctness gaps (silent fact-key collision, wrong negation semantics, missing atomicity); rejecting them would have shipped known-broken code.
tags: [process, governance, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md
---

---
id: dr-20260512-07-execute-write-deferment-may-escalate-to-design-altitude
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: execute-write
title: Execute-write deferments may escalate to design-level when simple-fix sketches prove insufficient
decision: A deferred item that originated as a "deferred minor optimization" during execute-write MAY be re-categorized to a design-level deferment requiring architectural review when the original simple-fix sketch is attempted and proves insufficient — captured by D5's escalation from per-predicate IDB indexing (attempted, reverted) to "Evaluator performance and indexing architecture" requiring a fresh design-large-task pass or a Task-16-audit-driven follow-up sprint.
rationale: D5 began as a coding-detail optimization with a one-paragraph fix sketch; the attempted per-predicate index produced no measurable improvement on the transitive-closure workload because one predicate dominates the IDB, revealing that the right fix is per-position indexing — a deeper plan deviation that disturbs Task 6's source and risks correctness on negation and intersection paths. Treating this as just-another-D-item would have either pushed an under-reviewed structural change into execute-write or silently shipped the performance gap. Re-categorizing the deferment to design altitude — with the architectural sketch, risk catalog, and recommended closure channel documented in the D-item — gives future sprints the option to run the architectural review at the right altitude rather than discovering the gap from a failing AC. Future execute-write sessions should consider this escalation path whenever a simple-fix sketch fails on attempt and the corrective work would breach the boundary between "surgical fix" and "architectural change."
alternatives:
  - Force the architectural fix to land inside the current sprint to honor AC-11.2 — rejected because the fix has medium correctness risk on negation and intersection paths and no review window remains in the sprint; shipping a structural change without adversarial review would invite the same defect-density the D-items themselves are evidence of.
  - Keep D5 as a coding-level deferment and let the next plan-build pass discover the depth — rejected because the architectural framing IS the discovery; deferring without the escalation hides the design call from the audit and from sprint-02 planning.
  - Recalibrate AC-11.2 to a weaker N to keep the test green without an indexing fix — rejected as a spec deviation that weakens the test contract; the appropriate response is to mark the AC skipped with a documented unskip criterion, not to soften the contract itself.
tags: [process, architecture, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md
---

---
id: dr-20260512-08-it-skip-with-documented-unskip-criterion
date: 2026-05-12
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend
stage: execute-write
title: it.skip with documented unskip criterion is the canonical channel for performance-bounded ACs blocked on deferred work
decision: When an AC's pass condition depends on an optimization or architectural change that has been deferred to a higher decision altitude, the canonical encoding is `it.skip` on the test with a comment naming the deferred-item ID and the unskip criterion — used in sprint-01 for AC-11.2 (N=1000 transitive closure) pointing at D5's per-position indexing work, rather than deleting the test, weakening the bound, or letting the test hang.
rationale: A skipped test with a named D-item creates a stable, in-source breadcrumb that closes only when the deferred work lands — it is more durable than an issue tracker, easier to discover than a deferred-items file scan, and the test itself becomes its own acceptance criterion (when D5 closes, removing `it.skip` either passes or fails, with no separate verification step needed). Deleting the test discards the contract; weakening the bound silently changes the spec; letting the test hang corrupts CI signal. The skip pattern preserves all three. Future sprints whose ACs depend on optimizations not yet implemented — Domain layer's join-shape ACs, Interface layer's render-time ACs, future Engine perf gates — should use this same pattern: `it.skip` with an explicit reference to the deferred-item ID and a one-line unskip criterion.
alternatives:
  - Delete the AC-11.2 test entirely and re-add it when D5 closes — rejected because the spec already promises the AC and deleting the test loses the contract artifact; the skip preserves the contract while parking the verification.
  - Weaken the N from 1000 to 200 so the existing Evaluator passes — rejected as a spec deviation that silently softens the performance contract; AC text would need to change too, multiplying revision surface.
  - Leave the test active and let it time out — rejected because it corrupts CI signal (every run reports a failure unrelated to the change under test) and trains reviewers to ignore the suite's red state.
tags: [convention, process]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend/plan/sprint-01-proof-backend-deferred-00.md
---

---
id: dr-20260512-09-voice-authority-centralization-for-overlays
date: 2026-05-12
sprint: 20260512-01-add-interview-instructions
stage: design-specify
title: Voice-authority centralization as the canonical home for cross-skill interview overlays
decision: Capabilities that shape how interview-style skills present information packets (verbosity, formatting, voice flavor) are written once in the shared voice authority (`util-design-partner-role`) and imported by every interview skill, rather than duplicated per skill or assembled from a per-skill registry.
rationale: Two interview skills (`design-large-task`, `design-small-task`) already share voice rules via the same authority, so cross-cutting style behavior has a single natural home; adding the info-packet style overlay there means future interview skills inherit the capability by importing the existing authority rather than by re-declaring the rule. The competing architect dispatch surfaced the alternative (per-skill duplication or a thin overlay registry) and the hybrid recommendation chose maximum centralization. Future cross-skill voice or presentation rules (multi-voice selection, project-level overrides, third-interview-skill cases) should extend the same authority section rather than fork the rule.
alternatives:
  - Duplicate the overlay logic inside each interview skill's first-turn framing block — rejected because two call sites already share byte-identical handshake prose; a third skill would triple-paste, and rule drift across skills becomes a maintenance hazard.
  - Build a thin overlay registry that interview skills consult at runtime — rejected as over-engineered for two consumers; the voice authority is already the consultation point, so a registry would be a redundant layer.
tags: [architecture, skill, convention]
supersedes: null
artifact_refs:
  - working/20260512-01-add-interview-instructions/design/add-interview-instructions-design-00.md
  - working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md
---

---
id: dr-20260512-10-replace-semantics-for-instruction-directives
date: 2026-05-12
sprint: 20260512-01-add-interview-instructions
stage: design-specify
title: Replace semantics (not accumulate-stack) for in-session instruction directives
decision: Each `instruction` directive issued mid-interview produces a single new full active style that wholly replaces the prior style; there is no accumulation stack, no diff merge, and no per-directive history.
rationale: Replace semantics keeps the active style at all times a single, readable, fully-specified value the designer can audit at any moment via the full-readout acknowledgment — the designer always knows what voice/format/verbosity is live without mentally composing a stack of N successive directives. The competing architect on merge semantics explored accumulate-stack and the hybrid chose replace; the cost is that "undo" requires reissuing the prior style verbatim, but that cost falls on the rare correction case and not on the steady-state every-directive case. Future directive-protocol extensions (other interview-style overlays, project-level rules, scoped overrides) should adopt the same replace semantics unless an explicit accumulation use case justifies the audit cost.
alternatives:
  - Accumulate-stack semantics where each directive layers onto the previous style with explicit pop/clear directives — rejected because the active style becomes a virtual composition of N entries; the designer cannot audit the live voice without mentally replaying the stack, and full-readout acknowledgment grows in size with every directive.
  - Per-axis merge semantics where each directive updates only the named axes and leaves others — rejected because the directive grammar would need to parse axes and the designer would lose the simple "say the new style, that's the new style" mental model.
tags: [convention, architecture, governance]
supersedes: null
artifact_refs:
  - working/20260512-01-add-interview-instructions/design/add-interview-instructions-design-00.md
  - working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md
---

---
id: dr-20260512-11-bootstrap-extension-pattern-for-user-settings
date: 2026-05-12
sprint: 20260512-01-add-interview-instructions
stage: plan-build
title: Bootstrap-extension pattern for new Chester user settings
decision: A new Chester user-level setting reaches skill code through four mechanical pieces in fixed positions — (1) a factory-default constant and a user-config read branch added to `chester-util-config/chester-config-read.sh`, (2) a `printf %q` `eval`-safe export from that script, (3) a `start-bootstrap` `What It Returns` bullet documenting the env var, and (4) a dedicated helper script in `chester-util-config/` plus a self-resolving wrapper in `bin/` whenever the setting needs a programmatic write path.
rationale: This sprint added `info_packet_style` and `CHESTER_INFO_PACKET_STYLE` via exactly this pattern — extending the existing `chester-config-read.sh` rather than introducing a new resolver, exporting via `printf %q` for `eval` consumption rather than building a structured channel, and adding `chester-style-write.sh` + `bin/chester-style-write` for the persistence path rather than embedding write logic in skill prose. The pattern reuses the project-scoped config resolution that `chester-util-config/` already centralizes and keeps the bin-wrapper convention (self-resolving, forwards `"$@"`) consistent. Future settings additions should follow the same four-piece template rather than introducing parallel resolvers, ad-hoc env-var emit points, or skill-local write logic.
alternatives:
  - Introduce a new per-setting resolver script instead of extending `chester-config-read.sh` — rejected because every skill already sources the single resolver via `eval "$(chester-config-read)"`; a parallel script would multiply load points and obscure which settings exist.
  - Embed the persistence write directly in voice-authority skill prose (`jq` invocation in markdown) — rejected because skill prose is interpreted by an agent at runtime; shelling to a dedicated helper isolates atomicity (`mktemp` + `mv`) and `jq --arg` quoting in tested code rather than in prose.
  - Use a structured (JSON) channel between resolver and skills instead of env vars — rejected as inconsistent with existing skill consumption (`eval "$(chester-config-read)"`); env vars round-trip through bash safely once `printf %q` quoting is used.
tags: [architecture, convention, tool]
supersedes: null
artifact_refs:
  - working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md
  - working/20260512-01-add-interview-instructions/plan/add-interview-instructions-plan-00.md
---

---
id: dr-20260512-12-printf-q-idiom-for-eval-bound-exports
date: 2026-05-12
sprint: 20260512-01-add-interview-instructions
stage: plan-build
title: printf %q quoting for user-provided values in eval-consumed exports
decision: User-provided string values emitted from `chester-config-read.sh` (or any future eval-consumed config resolver) are exported via `printf %q` quoting — e.g. `printf 'export CHESTER_INFO_PACKET_STYLE=%q\n' "$value"` — rather than bare interpolation, single-quote wrapping, or printf `%s` with manual escaping, and the asymmetry against existing bare-string exports is documented inline with a comment naming why.
rationale: User-provided settings can contain shell-special characters (quotes, backticks, `$`, `;`, newlines) that would break `eval` consumption with bare or hand-quoted emit; `printf %q` is the bash-builtin canonical answer that produces an `eval`-safe representation for any input. This sprint introduced the idiom inline next to other bare-export lines in `chester-config-read.sh`, so the cohabitation of two emit styles needed a justifying comment to keep future readers from "normalizing" the asymmetry. Future Chester settings whose values originate outside the resolver script (user JSON, env, project config) should use the same idiom and the same inline-comment discipline at the call site.
alternatives:
  - Bare interpolation `export FOO="$value"` — rejected because values containing `"` or `$` corrupt the export; AC-1.4 of this sprint explicitly tested shell-special survival.
  - Manual `sed`/`tr` escaping into a printf `%s` template — rejected as fragile (escape coverage is the writer's burden) and slower than the builtin `%q`.
  - Constrain settings to a closed character set so bare interpolation is safe — rejected because the `info_packet_style` value is free-form prose, and constraining it would compromise the feature.
tags: [convention, tool]
supersedes: null
artifact_refs:
  - working/20260512-01-add-interview-instructions/plan/add-interview-instructions-plan-00.md
---

---
id: dr-20260512-13-memory-and-overlay-as-independent-layers
date: 2026-05-12
sprint: 20260512-01-add-interview-instructions
stage: design-specify
title: Auto-memory and info-packet style overlay remain independent composition layers
decision: Claude Code's auto-memory entries and the info-packet style overlay are treated as two independent layers — auto-memory continues to fire as the harness emits it, the overlay's active style wins for the duration of the session on any axis they conflict, and no merger reads memory entries to seed the overlay (or vice versa).
rationale: Auto-memory and the overlay are produced by different mechanisms at different cadences (memory is harness-emitted across sessions; overlay is session-scoped and designer-driven), and modeling them as a single composed value would force the agent to reconcile cross-axis conflicts at every information packet. Keeping them independent with a deterministic "overlay wins this session" rule lets the designer override memory entries without modifying memory and lets memory continue to inform default behavior when no overlay is active. Future cross-layer composition decisions (project-level overrides, multi-voice selection, scoped style modes) should be evaluated against this two-layer model rather than collapsing back into a merged authority.
alternatives:
  - Deep-merge auto-memory entries into the active overlay style at session start — rejected because memory axes and overlay axes are not coterminous; a merge would require axis mapping logic and would surface as silently-mutating overlay readouts.
  - Have the overlay seed itself from auto-memory entries that look style-ish — rejected as fragile classification (which memory entries are style-ish?) and as conflating two distinct authoring channels.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260512-01-add-interview-instructions/design/add-interview-instructions-design-00.md
  - working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md
---

---
id: dr-20260512-14-substring-match-recognition-for-special-directive-forms
date: 2026-05-12
sprint: 20260512-01-add-interview-instructions
stage: design-specify
title: Substring-match recognition (not structured parsing) for instruction(save) and future special forms
decision: The voice-authority section recognizes the persistence directive by the substring `instruction(save)` appearing in the designer's message rather than by structured grammar parsing; the rest of the directive is treated as free-form prose for the agent to synthesize into the new style.
rationale: Substring recognition matches the rest of the directive protocol, which is intentionally free-form ("say the new style, that's the new style") — adding a parser for one special form would create asymmetric machinery for one branch and invite users to expect parser-like behavior elsewhere. The convention also keeps the recognition rule entirely in voice-authority prose (no code), so adding a second special form is one section edit, not a grammar revision. Future special forms in this directive family (e.g. `instruction(reset)`, `instruction(memory-write)`) should follow the same substring-trigger convention with a one-line addition to the voice-authority recognition list, not by promoting the protocol to a structured grammar.
alternatives:
  - Define a structured directive grammar with explicit lex/parse steps — rejected as inconsistent with the rest of the free-form directive protocol and as overkill for a recognition rule that the agent interprets at runtime anyway.
  - Use a unique sentinel token (e.g. a magic emoji or rare unicode) for save semantics — rejected because the substring `instruction(save)` is already self-describing and discoverable by readers of the voice-authority section without a sentinel legend.
tags: [convention, mcp, governance]
supersedes: null
artifact_refs:
  - working/20260512-01-add-interview-instructions/design/add-interview-instructions-design-00.md
  - working/20260512-01-add-interview-instructions/spec/add-interview-instructions-spec-01.md
---

---
id: dr-20260513-01-idb-per-position-indexing-engine-spec-contract
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3
stage: design-small-task
title: Per-position IDB indexing promoted to engine-spec §5.3 contract
decision: The rule-firing engine carries per-position lookup tables on the derived-facts (IDB) side mirroring the existing base-facts positional index, and the engine specification's internal-data-structures section (§5.3) is amended from the implicit "same shape as the fact store" gesture into an explicit contract stating that the IDB side carries the same by-position lookup machinery with derive-local lifecycle.
rationale: The full linear scan over derived facts per body atom produced O(N^3) cost on recursive transitive-closure workloads, leaving AC-11.2 (1000-element chain) skipped because it could not complete within any reasonable budget. Promoting the gesture into an enforced spec contract — rather than just landing the implementation — locks in the structural commitment so future engine changes (sprint-02 Domain workloads, future perf gates) cannot regress by accident, and gives ADR-0019 a normative anchor in the cascade. The contract is small (one section amendment plus a cross-reference) but binding: any future evaluator implementation must carry per-position IDB indexing or amend §5.3.
alternatives:
  - Land the implementation without amending §5.3, leaving the contract implicit — rejected because the implicit "same shape as the fact store" phrasing had already let the gap persist across two prior passes; the spec must encode the discipline, not gesture at it.
  - Amend §3.1 (fixed-point evaluation) instead of §5.3 — rejected because §3.1 talks about meaning while §5.3 already addresses mechanics; placing the contract in §3.1 would break the spec's semantics-versus-mechanics separation.
tags: [architecture, format]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/design/sprint-01-proof-backend-pass-3-design-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/spec/sprint-01-proof-backend-pass-3-spec-01.md
---

---
id: dr-20260513-02-parallel-positional-index-implementations
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3
stage: design-small-task
title: Parallel positional-index implementations on EDB and IDB sides, no shared helper
decision: The engine ships two parallel positional-index implementations — `FactStore._positionalIndex` (durable, mutable, supports retract) on the EDB side and `DerivedPositionalIndex` (ephemeral, grow-only, derive-local) on the IDB side — rather than extracting a shared by-position-lookup helper, with consolidation deferred to the audit task channel.
rationale: A shared helper would carry two responsibilities (durable mutable versus ephemeral grow-only), expose a `retract` method the derived side never uses (ISP violation), and risk a refused-bequest pattern if subclassed (LSP violation). On blast-radius grounds, extracting a shared component during pass-3 would expand the change into a stable cross-cutting module for non-functional reasons. ADR-0019 records Medium confidence on the long-term consolidation question, so the audit task channel — not a future structural pass — is the right venue for revisiting parallelism once both implementations have settled under real workloads.
alternatives:
  - Extract a shared by-position-lookup helper as part of pass-3 — rejected on SOLID grounds (two responsibilities, ISP and LSP violations) and blast-radius grounds (expands the change into stable-component territory for non-functional reasons).
  - Refactor the base-facts store to match the new derived-side shape — rejected because it touches code outside pass-3's natural scope and contradicts the parallel-implementations call.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/design/sprint-01-proof-backend-pass-3-design-00.md
---

---
id: dr-20260513-03-firerule-delta-driven-body-atom-reorder
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3
stage: execute-write
title: fireRule reorders body-atom processing to drive off the delta-restricted atom
decision: When a rule fires and the delta-restricted atom is not body[0] (i.e. `deltaAtomIndex > 0`), `Evaluator.fireRule` reorders body-atom processing to evaluate the delta atom first and propagate its bindings to the remaining atoms via positional lookup, rather than processing body atoms in source order; the delta `Set→Map` wrap is lifted from `matchBodyAtom` into `fireRule` so wrap cost is O(deltaSize) per atom rather than per binding.
rationale: Tightening AC-11.2's budget to 5 seconds surfaced an asymptotic gap (O(N^3)) in the originally-planned indexing-only architecture that neither the spec nor the framing-00 doc had anticipated — per-position lookup alone could not meet the budget on recursive transitive closure when the delta atom sat at body[1] or later. Driving off the delta atom first drops the asymptote to O(N^2) on these shapes and lets AC-11.2 pass in ~2.6s. The decision is a load-bearing change to evaluation-order semantics: anyone reasoning about `fireRule` must now account for the reorder, which is why ADR-0019's Negative Consequences calls it out explicitly. The heuristic is uniform (always reorders when `deltaAtomIndex > 0`); sprint-02 may need to revisit if Domain-layer workloads exhibit shapes where source-order would be faster.
alternatives:
  - Keep source-order body-atom processing and rely solely on per-position indexing — rejected because per-position indexing alone left AC-11.2 at O(N^3) on recursive workloads, failing the 5-second budget.
  - Make the reorder conditional on per-rule shape analysis — rejected because the uniform heuristic was sufficient for the test contract and the conditional version adds branch complexity without measured benefit; deferred to sprint-02 evidence.
  - Skip AC-11.2 again under a deferred-item — rejected because the indexing work was itself the closure for OQ-1's deferred state; re-deferring would have left the architectural question open across another sprint.
tags: [architecture]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/summary/sprint-01-proof-backend-pass-3-summary-00.md
---

---
id: dr-20260513-04-oq-1-closed-by-adr-0019
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3
stage: execute-write
title: OQ-1 (Evaluator IDB indexing) closed and removed from engine-open-questions
decision: The OQ-1 entry — the engine-tier open architectural question on IDB indexing — is removed from `engine-open-questions.md` (which now contains only the preamble), and ADR-0019 (`0019-evaluator-idb-positional-indexing.md`) explicitly supersedes it in the design-document cascade with its Decision section recording both the hybrid module + helper architecture and the fireRule delta-driven join.
rationale: OQ-1 was the only remaining engine-tier open architectural question; closing it required three artifacts to move in sync — the open-questions document (entry removed), the spec (§5.3 amendment plus front-matter `related_adrs` refresh), and a new ADR (0019) carrying the reasoning and the Supersedes pointer. Future agents reading the cascade must find the closure encoded in the ADR rather than reconstructed from sprint summaries, because the open-questions document itself no longer carries the entry. Recording the closure as a decision record makes the supersession discoverable from the cross-sprint corpus without needing to traverse the cascade.
alternatives:
  - Leave OQ-1 in the open-questions document with a "closed by ADR-0019" annotation — rejected because the open-questions document is for open questions; keeping closed entries would dilute its signal and accumulate cruft across future closures.
  - Land ADR-0019 without removing the OQ-1 entry, treating supersession as semantic only — rejected because the open-questions document would falsely advertise OQ-1 as live work.
tags: [architecture, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-3/summary/sprint-01-proof-backend-pass-3-summary-00.md
---

---
id: dr-20260513-05-hybrid-tiered-cascade-archive-gate
date: 2026-05-13
sprint: 20260513-01-fix-archive-drift
stage: design-specify
title: Hybrid tiered detection-and-reconcile at the archive boundary (preserves cascade history)
decision: Master-Mode cascade-document drift is closed by a tiered pre-flight gate inside `finish-archive-artifacts` — cascade edits continue to land in the worktree's `plans/<master>/design-documents/` during sub-sprint execution (preserving per-commit history), and a divergence scan against `working/<master>/design-documents/` runs at archive time with three tiers (silent MATCH fast path, automatic working/ ← plans/ sync for PLANS_ONLY-only divergence, interactive halt with named operator choices for CONFLICT or WORKING_ONLY) — rather than routing cascade edits through gitignored working/ (Architect A) or always halting interactively (Architect B).
rationale: Architect A (make working/ canonical, plan-build / execute-write resolve paths to working/) would have routed cascade edits through gitignored working/ and lost the per-commit cascade history that sprint-01-proof-backend-pass-3 produced (commits 270fb45, 4d48a8b, 11544fa) and that downstream audits already reference — disqualifying. Architect B (always halt with the full manifest) would have forced an operator prompt on the common PLANS_ONLY-only case (new ADR files), training the operator to rubber-stamp. The hybrid splits the cases: trust the common new-file path, halt only on genuine conflict, and keep the destructive choice (`accept-working`) explicitly named in the prompt and recorded in the commit body. Future cross-tree-divergence problems in the Chester pipeline (e.g. the living-document gap on `master-plan.md`) should evaluate their fix against this tiered-gate-at-the-boundary pattern before reaching for a path-rewrite or always-halt design.
alternatives:
  - Architect A — make working/<master>/ canonical for cascade docs, with plan-build / execute-write resolving paths to working/ — rejected because it routes cascade edits through gitignored working/ and destroys the per-commit cascade history that downstream audits depend on.
  - Architect B — always halt interactively with the full manifest on any divergence — rejected because the common PLANS_ONLY-only case (new ADR files added during the sub-sprint) is unambiguous and forcing an operator prompt there trains rubber-stamping, weakening the halt's signal on actual conflicts.
  - Do nothing and rely on convention — rejected because the silent-reversion hazard already fired at least once during pass-3 and the failure mode is non-recoverable (working/ is gitignored, lost work has no git trail).
tags: [architecture, governance, worktree]
supersedes: null
artifact_refs:
  - working/20260513-01-fix-archive-drift/spec/fix-archive-drift-spec-00.md
  - working/20260513-01-fix-archive-drift/plan/fix-archive-drift-plan-00.md
  - working/20260513-01-fix-archive-drift/summary/fix-archive-drift-summary-00.md
---

---
id: dr-20260513-06-cascade-diff-conflict-line-relpath-last
date: 2026-05-13
sprint: 20260513-01-fix-archive-drift
stage: plan-build
title: cascade-diff manifest CONFLICT line places relpath last so embedded spaces survive parsing
decision: `chester-cascade-diff` emits CONFLICT entries as `CONFLICT <working-hash> <plans-hash> <relpath>` with the relative path as the trailing field, and consumers parse via `read -r tag wh ph relpath <<< "$line"` (the final read variable absorbs the line remainder including any spaces); the tag-then-fixed-width-fields-then-trailing-relpath shape is normative for any future manifest emitter in this family.
rationale: The first draft of the script placed `<relpath>` second (`CONFLICT <relpath> <wh> <ph>`), which silently truncated filenames at the first space when parsed with `awk '{print $2}'` — and 14 of 19 ADR files in the active master plan contain spaces in their names, so the truncation would have fired immediately on the gate's first real exercise. Plan-attack caught this as CRITICAL before any code shipped. The shape generalizes: any manifest line with a path field should put the path last and parse with `read` (not `awk` or array-indexing) so that path-with-spaces is the default-correct case, not a special case requiring quoting. Future Chester scripts emitting categorized file manifests (e.g. a future living-document-drift detector, a per-sprint integrity scanner) should follow the same convention.
alternatives:
  - Keep `<relpath>` in field-position 2 and require consumers to quote-and-shell-escape — rejected because the convention burden falls on every consumer and fails-silent when forgotten; embedded-space filenames are common enough in Chester cascade docs (14/19 ADRs) that the default-correct shape is the only safe choice.
  - Use a non-space delimiter (tab, NUL, or `|`) between fields — rejected because the existing test infrastructure and the broader Chester tooling assume whitespace-separated line-oriented output; introducing a private delimiter would surprise grep/awk-based downstream consumers without solving the asymmetry that relpath-last already solves.
tags: [convention, format]
supersedes: null
artifact_refs:
  - working/20260513-01-fix-archive-drift/plan/fix-archive-drift-plan-00.md
  - working/20260513-01-fix-archive-drift/plan/fix-archive-drift-plan-threat-report-00.md
---

---
id: dr-20260513-07-translator-at-boundary-keeps-internals-untouched
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4
stage: plan-build
title: Boundary-only tuple/object translator keeps engine internals unchanged across public-API form flips
decision: Engine public-API surface form changes are absorbed by a single boundary translator module (`RuleAtomTranslator`) that owns tuple↔internal-object conversion, while every internal engine module (RuleStore, Unifier, Stratifier, Evaluator, Explain, Snapshot, FactStore) continues to operate exclusively on the internal object form and is forbidden from changing as part of the surface flip.
rationale: Pass-4 flipped the public `defineRule` and `explain` signatures and the on-disk serialization schema, but AC-10.1 required the seven internal engine modules to show zero diff lines vs main — and the final review verified this property held exactly. Localizing all form-conversion at the boundary means future surface evolutions (new positional encodings, alternate wire forms, additional serialization versions) can ship as translator-only changes without re-touching evaluation, unification, or storage code, and reviewers gain a single point to audit when validating any future public-form change. The translator also becomes the single validation point: malformed-input throws originate there, so downstream modules can assume well-formed input and stay simpler. This is the architectural commitment that made the strangler-fig migration in this sprint viable, and it is the precedent for any future Chester engine surface change.
alternatives:
  - Push tuple-awareness into each internal module so every consumer accepts both forms — rejected because it doubles the input-shape surface in every module, blurs the validation boundary, and forecloses the AC-10.1 "internals unchanged" property that lets future surface flips ship without re-reviewing the whole engine.
  - Convert at every public entry point with inline conversion code (no shared translator) — rejected because the conversion logic and malformed-input error semantics would drift across entry points, violating the single-validation-point property and creating multiple places to update on the next form change.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/plan/sprint-01-proof-backend-pass-4-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/spec/sprint-01-proof-backend-pass-4-spec-01.md
---

---
id: dr-20260513-08-strangler-fig-with-temporary-test-helper
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4
stage: plan-build
title: Public-API form flip uses a temporary in-test helper as scaffold and deletes it in the final task
decision: When flipping a public API form that has many test callsites, the migration pattern is: (1) flip the public surface in one commit and accept an intentionally-red suite, (2) introduce a temporary in-test helper (e.g. `defineRuleObj`) that wraps the new form in the old shape, (3) migrate well-formed-input tests one file per commit through the helper, leaving failure-mode tests to migrate directly because the helper would mask the failure path, (4) delete the helper and convert remaining helper-wrapped callsites to direct new-form calls in a final cleanup commit.
rationale: Pass-4 executed exactly this pattern across 14 commits (6 tasks plus one amendment) and every per-file commit produced a fully-green suite at its boundary while the public surface stayed flipped throughout — meaning every intermediate commit is bisectable and the test scaffold never lived past the sprint that introduced it. The failure-mode asymmetry (helper bypassed for `failures.test.js`) is load-bearing: a helper that runs translator logic before reaching the boundary would crash on intentionally-malformed input rather than letting the public API throw the expected error code, which would corrupt the migrated test's contract. Future Chester engine surface-form migrations with similar callsite-count pressure should reuse this pattern rather than attempting either a single-commit big-bang rewrite or a long-lived dual-form helper.
alternatives:
  - Single-commit big-bang test rewrite — rejected because every test file migrating in one commit forfeits bisectability, makes review impossibly large, and offers no rollback granularity if one test file's migration uncovers an unanticipated semantic shift.
  - Permanent dual-form helper kept in test-utils — rejected because the helper becomes a second public surface that future contributors will reach for instead of the real API, defeating the purpose of the flip; the temporary-then-deleted lifecycle is what enforces "the new form is the only form" after sprint close.
  - Migrate failure-mode tests through the helper too — rejected because the helper's pre-translator path would consume malformed input before it reached the public surface, producing wrong-layer error codes and breaking the AC contract for failure-mode tests.
tags: [convention, process]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/plan/sprint-01-proof-backend-pass-4-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/spec/sprint-01-proof-backend-pass-4-spec-01.md
---

---
id: dr-20260513-09-engine-schema-version-hard-break-with-actualversion-payload
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4
stage: plan-build
title: Engine serialization schema bumps are hard breaks rejecting prior versions with actualVersion payload
decision: When the engine's on-disk serialization schema changes, `Serializer.loadEngineFrom` rejects any blob whose `version` field does not equal the current schema version by throwing `MALFORMED_SERIALIZED_INPUT` with an `actualVersion` payload field carrying the rejected blob's version; there is no in-engine backward-compat shim and no on-the-fly upgrade path — downstream consumers must re-serialize through the new engine before their stored blobs can be loaded.
rationale: Pass-4 bumped the schema from v1 to v2 to carry tuple-form rules and adopted this hard-break rejection contract explicitly; the `actualVersion` payload lets callers programmatically distinguish version-mismatch from other malformed-input failures and route to migration tooling rather than treating it as data corruption. The hard break (rather than a compat shim) keeps the engine's serialization code at exactly one schema's worth of complexity — every supported wire shape lives in one version of the code, with prior shapes living only in prior engine versions. Future Chester engine schema bumps should follow this pattern: bump version, reject prior versions structurally with `actualVersion`, leave migration to external tooling or to a stand-alone migration utility outside the engine core.
alternatives:
  - Carry an in-engine version-N-to-current upgrade shim — rejected because each shim accretes permanently into the engine, grows quadratically with version count, and ties new-feature work to maintaining all historical conversion paths; the hard-break contract pushes that cost out to a tooling boundary where it belongs.
  - Reject with a generic `MALFORMED_SERIALIZED_INPUT` and no `actualVersion` field — rejected because callers cannot distinguish version-mismatch from genuine corruption, forcing them to parse the blob themselves to decide whether to invoke migration tooling.
tags: [architecture, format]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/plan/sprint-01-proof-backend-pass-4-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/spec/sprint-01-proof-backend-pass-4-spec-01.md
---

---
id: dr-20260513-10-version-check-precedes-shape-check-in-serialized-input-validation
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4
stage: execute-write
title: Serializer version check runs before shape-validity check so callers always get actualVersion on version mismatch
decision: Inside `Serializer.loadEngineFrom`, the `version !== currentSchemaVersion` check executes strictly before the `isValidSerialized` shape check, so any blob whose `version` field is wrong is rejected with `MALFORMED_SERIALIZED_INPUT` carrying `actualVersion` regardless of whether the blob's other fields match the current schema's shape; shape-check rejection (without `actualVersion`) is reserved for blobs that already pass version check.
rationale: The original plan placed the version check after `isValidSerialized`, which the execute-write quality reviewer caught as a contract violation: a real v1 blob carries old field names (`head`/`body`) that fail v2's shape check first, so the caller receives a generic `MALFORMED_SERIALIZED_INPUT` without `actualVersion` and cannot route the failure to migration tooling — defeating the whole point of the hard-break-with-payload contract. The amendment moved the version check earlier and added a regression test for the v1-with-rules case to lock the precedence. This precedence rule generalizes: whenever a validator has both a structural-shape check and a metadata check (version, format-id, schema-id), the metadata check runs first so that "I cannot interpret this at all" is distinguishable from "this is interpretable but malformed" in the error payload. Future Chester engine validators with version-and-shape pairs must order checks this way.
alternatives:
  - Keep the plan's original shape-then-version order — rejected because it silently strips the `actualVersion` payload from the realistic v1-with-rules migration case, breaking AC-5.3 and defeating the hard-break-with-payload contract.
  - Run both checks and merge their results into a richer error — rejected because it complicates the error shape, multiplies the number of failure-mode test cases, and offers no benefit over a strict precedence: once version is wrong, shape-conformance to the new schema is irrelevant.
tags: [convention, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/plan/sprint-01-proof-backend-pass-4-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/spec/sprint-01-proof-backend-pass-4-spec-01.md
---

---
id: dr-20260513-11-per-file-commit-boundaries-required-during-test-migration
date: 2026-05-13
sprint: 20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4
stage: plan-build
title: Each test file's migration during a public-API flip lands as its own commit producing a fully-green suite
decision: During a strangler-fig public-API migration, every test file's migration commits separately and the full suite must run fully green at each commit boundary; the migration plan lists per-file commit messages in advance and the executor produces them one-for-one, even when this means many small commits in a single task.
rationale: Pass-4's Task 5 migrated nine test files across nine commits, each green at its boundary, and the execute-write summary confirmed this is what made the migration bisectable — if a future regression surfaces in any post-migration commit, `git bisect` lands precisely on the file that introduced the form change rather than on a multi-file batch. Bundling several files into one commit forfeits this property irreversibly, and the cost saving is trivial: each per-file commit takes one `git commit` invocation. The constraint also forces the executor to verify the suite green at each step, catching a per-file regression while only one file's worth of changes is in flight rather than discovering it under nine files of pending diff. Future Chester test-suite migrations under a strangler-fig public surface change should follow the per-file-commit rule.
alternatives:
  - Bundle all migrated test files into one commit per task — rejected because a regression anywhere in the bundle requires re-bisecting at the line-diff level within the commit, removing the file-level bisect granularity the per-file pattern preserves at near-zero cost.
  - Bundle by directory or by feature cluster — rejected because the natural unit of "what changed shape" is the test file (each file targets a specific surface area), and any coarser grouping mixes regressions from independent surfaces.
tags: [convention, process]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-01-proof-backend-pass-4/plan/sprint-01-proof-backend-pass-4-plan-00.md
---

---
id: dr-20260514-01-spec-revision-via-nn-versioned-sibling
date: 2026-05-14
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer
stage: design-specify
title: Spec corrections against merged upstream API land as a new NN-versioned spec, not an in-place edit
decision: When an existing sprint spec is found to reference an upstream API that has since merged in an altered form, the corrective pass produces a new `<sprint>-spec-NN.md` sibling (copy-then-patch) rather than mutating the prior spec; the prior spec is frozen as the audit trail of what was assumed before the merge, and the new spec carries a top-of-file revision note enumerating what changed and why.
rationale: Sprint-02 was paused while sprint-01 went through four passes, and the merged Engine API ended up differing from the API spec-01 had been written against (4-arg `defineRule`, 1-arg `explain`, wildcard-rejecting `retractFact`). The corrective pass produced spec-02 as a sibling rather than rewriting spec-01 in place, which preserves the diff spec-01 → spec-02 as direct evidence of which acceptance criteria moved and which assumptions the original plan-00 was built against. Future plan-builders re-running against the new spec can read both versions to understand the delta without archaeology through git history. The same NN-versioned-revision pattern is what `util-artifact-schema` already supports for plans; this record extends the same discipline to specs whenever upstream API drift is the trigger.
alternatives:
  - Edit spec-01 in place — rejected because it destroys the audit trail of pre-merge assumptions and forces reviewers to use git blame to reconstruct which acceptance criteria were originally written against the un-merged API; the NN-versioned-sibling pattern preserves that evidence at near-zero cost.
  - Regenerate the spec from scratch through design-specify — rejected because most of spec-01 was correct (substrate ports, ADR-0013 Parts 2 and 3, snapshot/restore, transaction lifecycle, query surfaces all checked out against the merged Engine); only three targeted patches were needed, and full regeneration would discard the unchanged 95% and re-derive identical content.
tags: [convention, process]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/spec/sprint-02-proof-layer-spec-01.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/spec/sprint-02-proof-layer-spec-02.md
---

---
id: dr-20260514-02-plan-revision-as-delta-not-regenerate
date: 2026-05-14
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer
stage: plan-build
title: Plan revision after spec correction produces an NN-versioned delta plan, not a full regenerate
decision: When a sprint spec is corrected and an existing plan was built against the prior spec, plan-build produces a new `<sprint>-plan-NN.md` by copy-and-patch from the prior plan rather than running the full multi-phase plan-build pipeline cold; the prior plan is preserved as audit trail, and a fresh plan-threat-report is generated against the new plan revision so the hardening gate still runs.
rationale: Plan-00 against spec-01 was 2,756 lines / 16 tasks and structurally aligned with spec-02 (same target directory, same vitest stack, same task shape) — only three spec-02 patches plus a handful of plan-reviewer-loop refinements needed to land. Running plan-build cold would have regenerated ~95% identical content for hours of wall time, then required re-review and re-attack against a plan that was already close to right; the delta path produced plan-01 in a fraction of the time while still running the full plan-attack + plan-smell hardening against the new revision. The discipline is: skip regeneration only when the prior plan is structurally aligned with the new spec (same files, same task decomposition); if structural changes are needed, regenerate. The threat-report sibling is non-negotiable — every plan revision gets a fresh hardening pass even when the source plan was already hardened, because the patches themselves can introduce new risks (and in this sprint, they did: three of the four Critical findings were exposed by the reviewer-loop patches).
alternatives:
  - Run plan-build cold against spec-02 to produce plan-00-of-the-new-spec — rejected because it regenerates ~95% identical content, discards the audit trail showing which plan tasks were affected by the spec correction, and produces no quality gain over the patched plan that still passes the full hardening gate.
  - Edit plan-00 in place — rejected because it destroys the audit trail of which plan tasks the spec correction touched, and conflates two distinct change drivers (spec-02 patches and plan-reviewer-loop refinements) into a single untraceable diff.
tags: [convention, process]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-plan-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-plan-01.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-plan-threat-report-01.md
---

---
id: dr-20260514-03-engine-wire-format-asymmetry-is-normative
date: 2026-05-14
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer
stage: plan-build
title: Engine wire-format asymmetry between rule bodies and query patterns is the normative Domain-layer convention
decision: Domain-layer code calling the Engine adopts the Engine's asymmetric wire-format as a normative convention: rule heads and rule bodies passed to `defineRule` use bare uppercase strings as logical variables (e.g. `['proposition_decl', ['P', '_', '_']]`), while query patterns passed to `query` use `{var: 'X'}` objects for variables (e.g. `query(['ungrounded_proposition', [{var: 'P'}]])`). Constants are bare lowercase strings on both sides; wildcards are the literal `'_'` string. The asymmetry is intentional and load-bearing — the Engine's `Unifier` rejects bare uppercase strings in query position as constants, and rejects `{var: …}` objects in rule-body position.
rationale: This sprint's plan-hardening surfaced the asymmetry as a recurring failure mode: the substrate fake accepted bare uppercase variables in both positions (it had its own uppercase-var regex on both sides), masking the divergence from the real Engine and letting `render.js` ship with bare-uppercase query patterns that the real Engine's `Unifier` would silently fail to bind. The same trap then bit the sprint a second time in the cumulative review (`queryOverlap` passed bare `'T1','T2'` as constants and always returned empty), confirming the convention has to be documented at records-altitude rather than learned per-sprint. The decision to honor the asymmetry rather than smooth it out at a Domain helper is deliberate: every Domain query that touches the Engine must use the same convention the Engine enforces, so future drift between Domain code and Engine semantics is impossible by construction. Future Chester layers above the Engine must follow this wire-format rule, and any in-memory substrate fake used for testing must enforce the same asymmetry (the sprint-02 fake was patched to do so as CR-1 / IM-1 in plan-01).
alternatives:
  - Wrap the Engine in a Domain-layer helper that accepts bare uppercase variables everywhere and lowers them to `{var: …}` for queries — rejected because the helper becomes a second public surface that drifts from the Engine's actual contract, and any Domain code that bypasses the helper (e.g. a future direct query for performance or for new Engine features) hits the asymmetry uncushioned; honoring the asymmetry directly is more painful per-call but eliminates a category of latent bug.
  - Push the lowering into the Engine itself so both rule bodies and query patterns accept either form — rejected because it changes Engine pass-4's public contract that just stabilized in sprint-01, doubles the input-shape surface in `Unifier`, and re-opens the AC-10.1 "internals unchanged" property the pass-4 strangler-fig depended on.
tags: [architecture, convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-plan-01.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-plan-threat-report-01.md
---

---
id: dr-20260514-04-test-only-factory-throws-on-success-path
date: 2026-05-14
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer
stage: plan-build
title: Test-only factory stubs that share a facade with a production factory must throw on success path, not return an empty facade
decision: When a test-only factory (e.g. `createDomainBridgeWith`) shares its post-validation facade shape with a production factory (`createDomainBridge`) but is implemented as a stub pending a shared-helper refactor, the stub's success path must `throw new Error(...)` with a message naming the missing refactor — it must not return `Object.freeze({})` or any other empty/partial facade. The throw is the safety contract: callers who reach the success path without first copying the facade (or extracting the shared helper) are forced to fail loudly rather than silently see `undefined` methods.
rationale: Plan-01's Task 14 originally specified `createDomainBridgeWith` as `return Object.freeze({}); // TODO: copy from createDomainBridge`, which would have let every AC-4.x bridge-integration success-path test type-check and run while every method invocation on the returned facade returned `undefined` — masking failure as a different failure (missing-method TypeError, far from the real cause). The plan-hardening pass replaced the empty-facade with an explicit throw whose message names the required refactor (`_buildBootedBridge` helper extraction), and the deferment was logged in plan-01's "Deferred from threat report" section as IM-5. The throw-on-success pattern generalizes: any test-only factory that shares a facade contract with a production factory and is deliberately left as a stub pending refactor should throw, not return-empty, so that the failure mode is loud and the deferred work is visible at every test run rather than only when the facade is exercised.
alternatives:
  - Return `Object.freeze({})` with a TODO comment — rejected because every method call on the returned facade returns `undefined`, producing TypeError far from the real cause and letting the test suite drift past the missing implementation; the loud-throw contract makes the stub's incompleteness undeniable on first invocation.
  - Implement the facade by copy-pasting from `createDomainBridge` immediately — rejected for this sprint because the clone-and-divergence smell (plan-smell finding F3) was explicitly deferred to a future refactor that extracts a `_buildBootedBridge` helper; copying now would entrench the duplication and lose the deferment's signal value.
tags: [convention, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-plan-01.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-deferred-00.md
---

---
id: dr-20260514-05-cumulative-review-compensates-for-skipped-per-task-reviews
date: 2026-05-14
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer
stage: execute-write
title: A single cumulative code review compensates when per-task spec/quality reviews are skipped under context rot
decision: When per-task spec-reviewer and quality-reviewer dispatches are skipped during execute-write — for example to recover from context-rot mid-sprint — the compensating control is a single cumulative code review dispatched after the last implementation task lands but before the execute-verify-complete checkpoint; its findings are committed as one cumulative-review fix commit on the sub-sprint branch, with any deferred findings logged to a per-sprint `<sprint>-deferred-NN.md` file.
rationale: Sprint-02's tasks T14/T15/T16 had their per-task spec/quality reviews skipped during a context-rot recovery, and the implementer self-reports surfaced four plan defects but no production-code review. The compensating cumulative review caught two Critical bugs (`queryOverlap` constant-vs-variable wire-format trap, missing `friction_disposition` EDB declaration) that per-task quality review would have flagged at task boundaries; without the cumulative pass, both would have shipped silently because all 81 tests passed without them. The pattern generalizes: skipping per-task reviews is a defensible response to context rot or other execution pressure, but the implicit quality-gate that those reviews represent cannot be skipped without replacement — the cumulative review is the explicit replacement, and the per-sprint deferred-NN file is the explicit record of which findings did not land in the same commit. Future Chester sprints that skip per-task reviews for any reason must dispatch a cumulative review before execute-verify-complete.
alternatives:
  - Skip per-task reviews without a cumulative replacement — rejected because the quality gate vanishes silently and bugs that per-task review would have caught ship under a green-tests signal; sprint-02's two Critical findings would both have escaped detection.
  - Re-run all skipped per-task reviews retroactively, one per task — rejected because the per-task review's value comes from running at the task boundary (small diff, fresh context, narrow scope); retroactive per-task review against a mature multi-task tree loses that scoping benefit, costs more total review time, and produces overlapping findings that need de-duplication anyway.
  - Defer the review to a follow-up sprint — rejected because un-reviewed code crossing the sub-sprint merge boundary contaminates main with un-vetted commits and makes the next sprint's first task "review the previous sprint" before its real work, which delays unrelated work and conflates sprint scopes.
tags: [process, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/plan/sprint-02-proof-layer-deferred-00.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer/summary/sprint-02-proof-layer-summary-00.md
---

---
id: dr-20260514-06-cross-layer-real-import-test-compliance-check
date: 2026-05-14
sprint: 20260514-01-create-integration-smoke-probe
stage: execute-write
title: Cross-layer real-import test as compliance check in execute-write
decision: Any module that imports from another layer or package must have at least one test in its test directory that imports the real upstream module (not a mock or fake under `__mocks__/` or `_fixtures/`) and exercises one operation through the consumer's entry point; the implementer self-review prompt and the quality-reviewer subagent both check for this, with absence flagged as Critical by quality review.
rationale: The 2026-05-14 calculator stress test surfaced an Engine↔Domain port-shape divergence that shipped through sprint-02 undetected because every Domain test used an in-memory substrate fake authored alongside Domain itself — the test suite could only verify Domain matched what Domain expected, never what Engine actually exposed. Two layers were independently consistent and integration-broken. The cheapest defense is a single test per cross-layer-consuming module that imports the real upstream and runs one operation; that test would have crashed at the first dispatched task of sprint-02 with a clear shape-mismatch error. The two-prompt enforcement (implementer authors the test as part of TDD; quality-reviewer verifies presence and that the import path resolves to real source, not a mock) introduces no new dispatch slot, no new agent, no new spec section, and adds approximately one line to each of two existing prompt templates. The check defends one bug class — topology divergence at declared cross-layer seams — and does not claim general integration-test coverage; semantic bugs, render-purity violations, and undeclared-path bugs are still in scope for other defenses. Future cross-layer sub-sprints inherit this protection by default through the skill's prompt templates.
alternatives:
  - Add a dedicated probe gate slot in execute-write Section 2.1 between implementer and spec-reviewer — rejected because it adds a new dispatch step, new diagnostic surface, and new maintenance burden for marginal architectural separation; the two existing actors (implementer + quality-reviewer) already cover the concern within their existing mandates when given one prompt line each.
  - Require a `## Seams` section in every spec with declared entry-point + minimum-viable-probe contract, propagated through plan-build as `seam:` task annotations — rejected because most of the elaborated ceremony defends against secondary failure modes (probe gaming, spec-time signature drift, plan-build mapping mismatches) that the minimum convention does not introduce because it does not add the surface area those modes exploit; the spec-section approach is ceremony tax for procedural floors a minimum two-line edit already establishes.
  - Place the check in design-specify after spec write and before user review gate — rejected because at specify time the downstream consumer code does not exist on disk, so any probe can only inspect upstream shape in isolation (a signature check, not an integration check); the exact bug class that motivated this convention — topology divergence between consumer wiring and upstream surface — cannot manifest until consumer code is written, which only happens inside execute-write.
  - Place the check inside spec compliance review only (not also in implementer self-review) — rejected because the implementer benefits from fast-feedback during their TDD loop and the quality-reviewer benefits from independent verification against the committed HEAD; placing the check in both gives cross-verification (implementer's working-tree run + reviewer's committed-state run) at the cost of one prompt line per actor.
tags: [convention, testing, governance]
supersedes: null
artifact_refs:
  - skills/execute-write/SKILL.md
  - skills/execute-write/references/implementer.md
  - skills/execute-write/references/quality-reviewer.md
  - agents/execute-write-quality-reviewer.md
---

---
id: dr-20260515-01-sub-sprint-stays-within-one-proof-system
date: 2026-05-15
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2
stage: design-specify
title: Sub-sprint stays within one proof-system boundary
decision: The Chester repo contains two independently-evolving proof systems — the Domain+Engine system at `skills/design-proof-system/references/` (Datalog cascade + engine + domain bridge) and the older proof-MCP system at `skills/design-large-task/proof-mcp/` — and a single sub-sprint must stay within one system boundary; cross-system parity work requires a dedicated sub-sprint that names both systems in its scope.
rationale: Sprint-02-pass-2 added the missing `CONCERN` element category to the Domain+Engine system after pass-1 shipped without it. During spec authoring, the proof-MCP system surfaced as an alternative integration target because its older Concern partition (dr-20260504-05) already exists; spec ground-truth review flagged the cross-system slip and the scope was held to the Domain+Engine cascade. The two systems share vocabulary (`concern`, `addresses`, `covered`) but not state schemas, state lifecycles, or APIs — any sub-sprint that edits both in one pass risks silent semantic drift because the cascade documents are not shared and divergence has no automated detector. Future Concern-related work, and any future element-category work, must declare which system it modifies in the spec's first paragraph and route any cross-system parity question to a separate sub-sprint.
alternatives:
  - Treat the two systems as one and let any Concern-related sub-sprint touch whichever it needs — rejected because the two state schemas (Engine EDB tuples vs proof-MCP `state.concerns` slot) diverge at every operation and a single sub-sprint cannot hold both invariants without doubling the spec surface; the systems' independent evolution is the source of their separate cascade docs.
  - Merge the two systems into one canonical proof system before any further element-category work — rejected for this sprint because the merge is itself a master-plan-scale effort (changes both cascades, both APIs, both test suites) that cannot be justified by the narrow "add CONCERN" goal; the boundary declaration buys time to decide whether the merge ever happens.
tags: [architecture, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/spec/sprint-02-proof-layer-pass-2-spec-03.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/spec/sprint-02-proof-layer-pass-2-spec-ground-truth-report-01.md
---

---
id: dr-20260515-02-covered-addresses-arity-narrowing
date: 2026-05-15
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2
stage: design-specify
title: covered(C) uses addresses/2 plus approved/3 over cascade's addresses/3
decision: When the cascade document and the implemented code disagree on a predicate's arity, the spec adopts the code's arity as the authoritative shape and recovers the cascade's intended semantics by composing additional predicates rather than rewriting the cascade or the code; concretely, `covered(C) :- addresses(R, C), approved(R, _, _)` was adopted in place of cascade §7.2's `covered(C) :- addresses(R, C, _)` because the existing `addresses/2` EDB writer in `domain/writers.js` predates this sprint and `approved/3` already carries the "ratified Resolution" semantic the cascade's third argument was meant to express.
rationale: Spec ground-truth review (ground-truth-report-01) surfaced the arity mismatch as a CRITICAL ambiguity that would have produced a different bug class depending on which side the implementer matched — changing `addresses/2` to `addresses/3` would have broken every existing Resolution-writer call site, and changing `covered/1` to `addresses(R, C, _)` would have silently dropped the ratification check the cascade prose intended. The composed form `addresses(R, C), approved(R, _, _)` preserves the cascade's intended semantics (a Concern is covered only when at least one ratified Resolution addresses it) while honoring the code's pre-existing wire shape, and lets the cascade document be patched independently in a future sub-sprint without touching this sprint's implementation. The general convention is: in a sub-sprint scoped to add or fix a single capability, prefer composition of existing predicates over arity-changing rewrites; flag the cascade-vs-code divergence in the spec for separate resolution but do not block the current sub-sprint on it. Future sub-sprints that find cascade-vs-code arity mismatches should follow this composition-first pattern.
alternatives:
  - Migrate `addresses/2` to `addresses/3` codebase-wide to match cascade §7.2 — rejected because the migration touches every existing Resolution writer, every test that constructs Resolutions, and the wire format between Domain and Engine in a sub-sprint scoped to adding CONCERN — out-of-scope cost for an unrelated cascade-doc cleanup.
  - Adopt cascade's `addresses(R, C, _)` form for `covered/1` and silently drop the ratification check — rejected because the cascade prose explicitly says "Concerns are covered when a ratified Resolution addresses them" and the third argument's intent was the ratification flag; dropping the check would let unratified Resolutions satisfy `covered/1` and produce false-positive proof-closure signals.
  - Defer the entire `covered/1` rule to a follow-up sub-sprint and ship CONCERN without a coverage predicate — rejected because CONCERN's primary downstream consumer is closure-gate evaluation, which requires `covered/1` to be derivable; shipping CONCERN without `covered/1` would deliver an unusable element category.
tags: [convention, architecture, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/spec/sprint-02-proof-layer-pass-2-spec-03.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/spec/sprint-02-proof-layer-pass-2-spec-ground-truth-report-01.md
---

---
id: dr-20260515-03-canary-test-for-known-latent-bug
date: 2026-05-15
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2
stage: execute-write
title: Canary tests pin known-broken behavior for pre-existing latent bugs touching the sub-sprint surface
decision: When a sub-sprint's implementation surface touches a pre-existing latent bug that the sub-sprint will not fix (e.g. an unrelated `SHAPE_INVALID` throw path triggered by `ratifyConcern` due to a stale validator in a sibling module), the implementer writes a canary test that asserts the current broken behavior (the throw, the wrong return, etc.) with an in-test comment naming the bug, the expected correct behavior, and the future sub-sprint that should flip the assertion; the canary documents the broken state at records-altitude and converts to a normal regression test in the fix sub-sprint by inverting one assertion.
rationale: Sprint-02-pass-2's `ratifyConcern` implementation surfaced a `SHAPE_INVALID` throw originating in a sibling validator that pass-2's scope did not include — the bug is real, the throw is wrong, and a fix would expand scope into validator-rewriting territory unrelated to adding CONCERN. Skipping the test entirely would let future agents assume the throw was intentional; writing a "this should work" test that's expected to fail would leave the suite red; silently catching the throw would erase the signal. The canary pattern threads the needle: the test passes today on `expect(...).toThrow('SHAPE_INVALID')`, the comment block explains the throw is incorrect and names the responsible sub-sprint to fix it, and the future fix flips `.toThrow(...)` to a normal positive assertion in one line. The pattern generalizes to any pre-existing-bug-touches-current-surface situation: pin the broken state with a comment-named owner, defer the fix to a named follow-up sub-sprint, and the canary itself becomes the regression test once the fix lands.
alternatives:
  - Skip the test entirely and document the bug only in the sprint deferred file — rejected because the test suite then contains no executable signal that the bug exists; deferred-file entries are read-on-demand, canary tests are run on every CI cycle and surface in coverage maps.
  - Write a `.skip`'d or `.todo`'d test with the correct assertion — rejected because skip/todo tests do not exercise the code path and produce no signal when the bug is fixed; the suite shows green whether the bug is present or absent.
  - Expand sub-sprint scope to fix the latent bug — rejected because scope expansion violates the sub-sprint's narrow charter (add CONCERN) and the fix requires changes in a sibling validator module that has its own pending design work; pinning with a canary preserves scope discipline.
tags: [convention, testing, governance]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/plan/sprint-02-proof-layer-pass-2-plan-01.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/summary/sprint-02-proof-layer-pass-2-summary-00.md
---

---
id: dr-20260515-04-element-id-long-form-over-shorthand
date: 2026-05-15
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2
stage: design-specify
title: Element ids use the long-form category name with N suffix
decision: New element categories use the long-form `${category}_${n}` id shape (e.g. `concern_1`, `concern_2`) emitted by the existing allocator in `domain/ids.js`, not a shorthand abbreviation; when a cascade document specifies a shorthand id (e.g. cascade §3.8's `cern_N`), the spec adopts the long-form to match the allocator and flags the cascade for documentation cleanup rather than introducing a per-category shorthand exception in the allocator.
rationale: The existing id allocator emits `${idShape}_${n}` where `idShape` is the lowercased category name; every existing element category (`necessary_1`, `resolve_1`, etc.) follows this pattern. Cascade §3.8 specified `cern_N` for Concerns as a shorthand, but adopting the shorthand would require either a special-case branch in the allocator (adds complexity for one category) or a per-category shorthand-map (adds a new vocabulary surface that future categories would have to opt into individually). The long-form pattern is the natural extension of the existing convention, costs zero allocator code, and makes the cascade-vs-code divergence a doc-only cleanup. The general convention: when a cascade document specifies a naming shorthand that conflicts with a uniform allocator pattern already in use, adopt the uniform pattern in code and flag the cascade for doc cleanup; this preserves the allocator's "one rule for all categories" property and avoids drift across future categories.
alternatives:
  - Add a per-category shorthand branch in the allocator so `concern` emits `cern_N` — rejected because it special-cases one category, opens the door to per-category shorthand exceptions for every future element type, and replaces a single uniform rule with an open-ended shorthand map.
  - Adopt `cern_N` everywhere by renaming the allocator's `${idShape}` derivation to consult a shorthand map — rejected because retrofitting requires touching every existing element category's id allocation site and breaks every existing test fixture and stored proof state; cost is disproportionate to the cascade-doc fidelity benefit.
  - Defer the id choice to a follow-up sub-sprint and ship CONCERN without an id pattern — rejected because the allocator is invoked at element creation time; CONCERN cannot be created without committing to an id shape.
tags: [convention]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/spec/sprint-02-proof-layer-pass-2-spec-03.md
---

---
id: dr-20260515-05-derivation-tests-use-real-engine-not-substrate-stub
date: 2026-05-15
sprint: 20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2
stage: execute-write
title: Derivation tests use real Engine via dynamic import, not substrate's no-op fixed-point
decision: Tests that exercise a Datalog derivation rule (e.g. `covered/1`, `approved/3`) must dispatch the rule through the real Engine via the dynamic-import pattern `import('../../engine/Engine.js')` established in `bridge-integration.test.js:37`, not through the in-memory substrate fake whose `_runFixedPoint` is a no-op stub that silently returns the input EDB unchanged; substrate fakes are reserved for tests that exercise Domain-layer state transitions without semantic derivation.
rationale: The substrate fake under `domain/__mocks__/substrate.js` was authored for fast Domain-layer state-transition tests and its `_runFixedPoint` is documented as a no-op — it does not evaluate any rule and returns the EDB unchanged. Tests that exercise derivation rules through the substrate therefore always pass regardless of whether the rule is correctly defined, broken, or absent, producing a green test suite with zero derivation coverage. The real-Engine pattern in `bridge-integration.test.js` dynamically imports the production Engine and runs the actual fixed-point, which catches rule definition errors, predicate arity mismatches, and binding failures at test time. This is a narrower companion to dr-20260514-06's cross-layer real-import convention: that convention requires one real-import test per cross-layer-consuming module to catch topology divergence; this convention adds that any derivation-rule test specifically must use the real Engine because the substrate stub cannot execute derivation. Future sub-sprints that add new Datalog rules or modify existing ones must include at least one real-Engine derivation test per rule; pure state-transition tests may continue using the substrate fake.
alternatives:
  - Implement `_runFixedPoint` in the substrate fake to evaluate rules in memory — rejected because it duplicates the Engine's evaluation logic in a test-only fake, creates a second derivation surface that can drift from the real Engine (the exact bug class dr-20260514-06 was created to prevent), and any divergence between the two evaluators produces ghost failures that pass in one and fail in the other.
  - Mark derivation-rule tests as `.skip` until the substrate gains a real evaluator — rejected because skipped tests provide no signal and the substrate-evaluator implementation is not on any current sub-sprint's roadmap; skipping pushes the coverage gap forward indefinitely.
  - Require all Domain tests to use the real Engine — rejected because pure state-transition tests (e.g. partition-routing, id-allocation, error-path handling) do not exercise derivation and gain no signal from real-Engine dispatch; the dispatch cost is multiplied by every state-transition test for zero added coverage.
tags: [convention, testing, architecture]
supersedes: null
artifact_refs:
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/plan/sprint-02-proof-layer-pass-2-plan-01.md
  - working/20260511-01-mp-redesign-proof-system/sprint-02-proof-layer-pass-2/summary/sprint-02-proof-layer-pass-2-summary-00.md
---
