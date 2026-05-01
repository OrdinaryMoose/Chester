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
