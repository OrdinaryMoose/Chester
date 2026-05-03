# Documentation–Code Alignment Strategy for StoryDesigner

**Date:** 2026-05-01
**Author:** Mike (with Claude Opus 4.7 research synthesis)
**Status:** Recommendation — not yet adopted
**Scope:** Industry survey of documentation-code alignment practices, with focus on AI-coding-agent contexts; tailored hybrid recommendation for StoryDesigner under Claude Code

## 1. Problem Statement

StoryDesigner evolves rapidly. Documentation surfaces — TDRs, ADRs, GPRs, the project wiki, per-project `CLAUDE.md` files, Chester sprint artifacts, the concept index, and the system architecture document — drift behind code. The pain is felt in three forms:

- **Authoring lag.** Code changes ship; docs follow days or weeks later, if at all.
- **Cross-reference rot.** A type renamed in one place leaves stale citations in N other places. Three ADR numbering-scheme reboots already in `Archived/Requirements Documents/` evidence the problem at structural scale.
- **AI-agent amplification.** Claude Code drives most of the velocity. Agents are stateless across sessions and rely on documentation as primary context. Stale docs become misleading instructions; gaps become hallucination invitations.

This report surveys what the industry does about this, what works under AI-agent pressure, and what hybrid fits StoryDesigner specifically.

## 2. Industry Landscape

Documentation-code alignment patterns split into five categories. Each has different leverage and different failure mode under AI-agent workflows.

### 2.1 Authoring Discipline Patterns (Process)

- **Docs-as-code** — documentation in the code repo, PR-reviewed, CI-built. Necessary baseline; not sufficient. Proximity does not enforce updates. CI verifies format and link integrity, not semantic accuracy.
- **README-driven development** (Tom Preston-Werner, 2010) — write external interface document first, code second. Strong for libraries with stable contracts; weak for fast-evolving internal architecture.
- **Architecture Decision Records / Technical Decision Records** (Michael Nygard 2011, MADR, arc42 §9) — single decision per record, immutable, supersession chain, lifecycle status (proposed → accepted → deprecated → superseded). Empirical study (arXiv:2604.27333, 2026) found Nygard and MADR formats score highest for comprehension and adoption efficiency. Failure modes: directories accumulate without pruning; "proposed" records sit indefinitely; nothing enforces that accepted records still match current code.
- **Diátaxis** (Daniele Procida) — documentation classified into Tutorial, How-to Guide, Reference, Explanation. Organizational framework, not a synchronization mechanism. StoryDesigner's wiki structure (`intents/`, `models/`, `concepts/`, `artifacts/`, `decisions/`, `rules/`) is a natural Diátaxis instantiation.
- **Living Documentation** (Cyrille Martraire, Addison-Wesley 2019) — annotations on code elements, conventions tools can parse, runtime extraction. Code becomes the source of truth; documentation is generated. Strong for API surface and structural diagrams; weak for rationale and intent.
- **Spec-Driven Development for AI agents** (GitHub Spec-kit, AWS Kiro, Tessl, 2025) — spec is the contract; agent derives implementation; acceptance criteria stated as `GIVEN/WHEN/THEN`. Most-discussed AI-doc pattern of 2025. Direct historical parallel: Model-Driven Development collapsed at the same point — when problem space exceeded model expressiveness. Failure mode: spec doesn't update when implementation discovers reality; both diverge silently.

### 2.2 Mechanical Binding Patterns (Enforcement)

These hold sync regardless of process discipline. Highest leverage category for fast-moving codebases.

- **Architectural fitness functions** (Ford / Parsons / Kua, *Building Evolutionary Architectures*; ArchUnit, ArchUnit.NET) — documentation claims expressed as compiled assertions. CI fails on violation. StoryDesigner already practices this in `Story.Architecture.Tests/` (5 test files enforcing ARCH-130 family, ARCH-134, ARCH-137, ARCH-151, plus master-plan document binding). Limitation: structural and static only — cannot verify behavioral semantics or runtime contracts.
- **Snippet inclusion tooling** — MarkdownSnippets (Simon Cropp, .NET-native), Embedme (Node), Swimm (commercial, Smart Tokens). Code blocks in documentation extracted from real source files via region markers or HTML comments. Stops example rot. Limitation: covers code examples only, not narrative prose.
- **Generated reference documentation** — DocFX from XML doc comments; Structurizr DSL rendered to architecture diagrams. Pull-based. Always current at generation time. Limitation: shallow — captures structure without rationale.
- **AST-anchored stale detection** — Fiberplane Drift (2025). Documentation entries fingerprinted against source AST; CI flags when fingerprint shifts. Very new, thin operational evidence. False positive on semantic-preserving refactors.
- **Documentation linting** — Vale (prose style), Lychee and markdown-link-check (link integrity). Style consistency, not semantic accuracy. Theater-vulnerable: a perfectly-styled sentence contradicting the code passes Vale.
- **CODEOWNERS for documentation paths** — required reviewer assigned by path glob. Distributes ownership mechanically. Friction-prone on cross-cutting renames touching 50+ files.
- **Git-age staleness detectors** — Cortex TMS, Doc Superpowers. Flag docs whose modification timestamp lags code-churn activity. Imprecise proxy; flags deliberately-stable foundational docs as stale.

### 2.3 AI-Agent-Specific Patterns

Newest category, thinnest published literature, most leverage given Claude Code workflow.

- **Steering file hierarchy** — `CLAUDE.md` (Anthropic, hierarchical: user-level → project-root → subdirectory), `AGENTS.md` (Linux Foundation 2025 cross-tool standard), `.cursor/rules/` (per-rule activation modes), `.github/copilot-instructions.md`. Anthropic's published guidance: cap under 300 lines; for each line ask "would removing this cause Claude to make mistakes?"; if not, cut it. Bloat degrades instruction-following at the ~150-200 rule envelope. Use `@import` syntax to delegate to domain documents rather than inlining.
- **Tiered Memory Architecture** (Cortex TMS, Linux Foundation 2025) — HOT (always loaded, ~27% of files: current sprint, PATTERNS.md, CLAUDE.md), WARM (on-demand, ~55%: architecture docs, design specs), COLD (excluded, ~18%: archives, historical material). Curation overhead is non-trivial; tier assignment requires ongoing sprint-boundary maintenance.
- **Lessons-Learned feedback loops** (Red Hat formulation, October 2025) — agent logs each correction; future sessions read the log. Compounds knowledge but log itself can rot, contradict, or apply old lessons to new architectural states.
- **Ground-truth anchoring** (Mintlify, sub-agent retrieval patterns) — load verified canonical docs before code generation; explicit "use only what is documented" constraints; treat every documentation gap as hallucination invitation. RAG retrieval reduces hallucination; does not eliminate it. Stale retrieval grounds new hallucinations on rotten foundations.
- **Post-run drift audit** — `git diff HEAD --stat` against task scope; scope-compliance scoring (≥80% acceptable, 50–80% scrutiny, <50% revert); JSONL tool-call trace inspection. Detects drift; does not resolve it. Cumulative degradation: each session reasonable in isolation, collective trajectory away from any documented state.

### 2.4 AI-Agent Failure Modes (Named)

Drawn from Galileo, Mintlify, Anthropic best-practices, codeongrass post-run-audit literature.

- **Hallucinated decision records** — agent invents a plausible ADR-053 referencing a nonexistent file. Well-formatted, false. Linting passes.
- **Aspirational documentation** — agent writes "the system does X" when only the spec said X; code never shipped X. Documentation theater.
- **Cross-reference miss** — agent updates one document accurately, leaves N referrers contradicting. Documentation set goes internally inconsistent.
- **Cumulative drift** — each session reasonable; collective trajectory off-spec.
- **Stale-grounding poisoning** — RAG retrieves a doc that was accurate six sprints ago; agent generates new content with high confidence built on that rotten foundation.
- **Wrong instruction worse than no instruction** — outdated `CLAUDE.md` actively misleads; absence would have prompted the agent to ask or read code.

### 2.5 Trade-off Axes

Cross-cutting all patterns above.

- **Source-of-truth direction** — code-as-source (XML doc comments → DocFX, ArchUnit assertions); doc-as-source (SDD specs, OpenAPI-first); bidirectional (each fact-class explicitly assigned to one direction). Choosing wrong direction for a fact-class is the structural mistake. API surface naturally code-source; architectural intent naturally doc-source; dependency rules naturally bidirectional bridged by fitness tests.
- **Push vs pull** — push (writer-initiated) accurate at write time, degrades continuously. Pull (generator-initiated) always current at generation time, depends entirely on whether pipeline runs.
- **Centralized vs distributed ownership** — centralized provides consistency, creates bottlenecks. Distributed provides accuracy, produces inconsistency. CODEOWNERS distributes mechanically without solving consistency.
- **High-fidelity sync cost vs iteration speed** — Fowler's Technical Debt Quadrant. "Prudent and deliberate" debt acceptable in prototype phase; expensive during multi-agent production refactor.

### 2.6 Documentation Theater (Anti-pattern)

Documentation that exists, passes all automated checks, looks current — but does not describe what the code does. Structurally indistinguishable from accurate documentation to automated tooling. Detector requires human comprehension comparing code and docs; expensive operation teams defer indefinitely. AI agents are particularly effective at producing it: they can generate plausible style-guide-compliant documentation describing code they have not seen.

Conditions that proliferate it:

- Definition-of-done includes a doc deliverable but no accuracy verification.
- Agents tasked with writing docs without verified current code state as grounding.
- Doc review separated in time from code review.

## 3. StoryDesigner Current Position

What is in place:

- **Fitness tests** — 5 files in `Story.Architecture.Tests/` enforcing ARCH-130 family, ARCH-134 (Contracts validation isolation), ARCH-137 (Compiler.Contracts span isolation), ARCH-151 (UnifiedDiagnostic token vocabulary), plus `MasterPlanRev01DocumentTests.cs` binding the master plan document to compiled assertions. Strong foundation; rare practice.
- **Wiki** — structured `docs/wiki/` with `intents/`, `models/`, `concepts/`, `artifacts/`, `decisions/`, `arcs/`, `rules/` plus `WIKI.md`, `index.md`, `log.md`, `open-questions.md`. ~25 leaf pages. Natural Diátaxis split (intents = explanation, models/rules = reference, concepts = explanation, decisions = ADR-flavored).
- **Governance documents** — TDRs, ADRs, GPRs under `docs/storydesigner/Approved/Requirements Documents/`. Concept index at `ConceptIndex/concept-index-current.md`.
- **Steering** — root `CLAUDE.md` (~270 lines), per-project `CLAUDE.md`, `docs/chester/CLAUDE.md`, `docs/wiki/WIKI.md`. Master Plan Mode override at root.
- **Chester pipeline** — design briefs → specs → plans → execution → summaries, archived to `docs/chester/plans/<master-sprint>/<sub-sprint>/` at sub-sprint merge.
- **System architecture document** — `docs/storydesigner/Working/Context Handoff/01 - StoryDesigner System Architecture v02.md`.

What is weak:

- **Code-to-TDR binding incomplete.** TDR-ARCH-150/151 made it into fitness tests. TDR-IDENT-100 (GUID-first identity), TDR-ARCH-140 (two-system correctness), and several others have no compiled assertion. They drift silently.
- **No wiki-to-TDR link checker.** Wiki pages cite ADR/TDR by ID. A fourth numbering-scheme rotation (three already in archive) breaks references with no CI signal.
- **No snippet binding.** Wiki pages quote code by re-typing. Renames invisibly invalidate examples.
- **Concept index hand-maintained.** Type renames don't propagate.
- **Root `CLAUDE.md` carries transitional state.** Sections labelled `[TRANSITIONAL — Sprint B3]`, "Compiler current surface (Sprint B2 post-ship, partial)" are pre-rotted prose narrating code state that will be wrong as soon as the next sprint ships. Currently above the 200-line healthy budget; close to the 300-line ceiling Anthropic guidance flags.
- **Sprint archive accumulates without curation tier.** `docs/chester/plans/` grows monotonically. Cortex TMS COLD-tier candidate.
- **No agent-side ground-truth loader.** Agents read `CLAUDE.md` but no enforced retrieval of relevant TDR or wiki page before architectural edits.
- **No post-run drift audit.** Reasoning audit covers reasoning; no parallel pass scans diffs against documentation references.

## 4. Recommended Hybrid

Strategy: **per-fact-class authority assignment**, with mechanical binding wherever possible, prose only for irreducibly-narrative content. Use Claude Code as both author and auditor.

### 4.1 Layer 1 — Code is Source

Apply to: dependency rules, namespace isolation, type vocabulary, naming conventions, build-result shape, diagnostic-code vocabulary.

Moves:

- Audit every Approved TDR. For each, ask "is this assertable as a structural test?" If yes, write the fitness test with `[Test(Description="TDR-ARCH-XXX clause N")]`. Done already: ARCH-130 family, ARCH-134, ARCH-137, ARCH-151. Candidates surfaced from current TDR set: TDR-IDENT-100 (assert every entity DTO carries `Guid Id`), TDR-ARCH-140 (assert `Story.Compiler` story-problems span-free), forthcoming Sprint B3 boundaries (Save folder relocation).
- Install DocFX. Generated API reference becomes pull-based always-current. Drop hand-maintained API tables from wiki.
- Source-generated concept index. Roslyn generator emits `concept-index-current.md` from `[Concept("name", "summary")]` annotations on canonical types. Renames propagate; no hand sync.

### 4.2 Layer 2 — Doc is Source

Apply to: architectural decisions, intent statements, two-system correctness rationale, contract surfaces, sprint specs.

Moves:

- TDR remains canonical for "what is decided + why". Code references the TDR ID in XML doc comments: `/// <remarks>Per TDR-ARCH-130 (ARCH-134).</remarks>`. Add a fitness test that scans every `TDR-` reference in XML doc comments and asserts the target file exists in `Approved/Requirements Documents/TDR/`. This is a link checker for governance references. Cheap; eliminates an entire class of governance-archaeology breakage.
- Chester sprint specs already function as SDD-style contracts within a sprint. Add the missing piece: at `execute-verify-complete`, enforce that spec acceptance criteria are referenced from at least one shipped test (test method attribute `[Spec("spec-id")]` or naming convention `Spec_<spec-id>_*`).
- Master plan continues to drive sprint sequencing, already bound via `MasterPlanRev01DocumentTests.cs`. Extend: assert that every closed sub-sprint in the plan has a corresponding `docs/chester/plans/<master>/<sub>/summary/` directory.

### 4.3 Layer 3 — Bidirectional with Anchors

Apply to: wiki code examples, TDR illustrative snippets, concept-index examples.

Moves:

- Adopt MarkdownSnippets (`SimonCropp/MarkdownSnippets`) — .NET-native, region-based extraction, MSBuild-integrated. Replace re-typed code in wiki pages with `<!-- snippet: name -->` markers. CI step regenerates and verifies; PR fails if regions vanish from source.
- For prose that cites symbol names without code blocks, add a lightweight grep-test in `Story.Architecture.Tests`: scan `docs/wiki/**/*.md` for backticked identifiers matching common naming patterns (`*Service`, `*Dto`, `I*Read`, `I*Write`); assert each symbol exists in the solution. Catches rename drift in roughly 80% of cases at trivial cost.

### 4.4 Layer 4 — Prose Only

Apply to: design rationale, trade-off explanations, historical context, intent statements, anything that cannot be derived from code.

Moves:

- Hold the Diátaxis line. Don't pollute `intents/` pages with reference detail or `models/` pages with explanatory rationale.
- Decay management: each `intents/*.md` and `concepts/*.md` gets a frontmatter field `last-validated: YYYY-MM-DD`. Quarterly Chester maintenance session reads all pages older than 90 days and prompts a re-validation pass. Manual gate, cheap, catches narrative rot.

### 4.5 Layer 5 — Agent-Aware Mechanics

The new layer; highest leverage given Claude Code workflow.

#### CLAUDE.md hygiene

- Cap root `CLAUDE.md` at 200 lines. Currently ~270.
- Move transitional-edge prose ("Compiler current surface (Sprint B2 post-ship, partial)", "[TRANSITIONAL — Sprint B3]") OUT of `CLAUDE.md` into a generated `docs/architecture/current-state.md` produced by an MSBuild task that scans actual `ProjectReference` graphs. Pull-based; cannot drift.
- Use `@import` syntax for per-tier rules: `@docs/architecture/dependency-graph.md`, `@docs/wiki/intents/index.md`. Keeps root file lean; loads on relevance.
- Add explicit "wrong instruction worse than no instruction" review cadence: every closed sub-sprint, `finish-write-records` includes a `CLAUDE.md` audit step that proposes deletions for any line referring to closed transitional state.

#### Pre-edit ground-truth loader

- Add Chester skill `load-ground-truth`, invoked at start of any `design-*` or `plan-build` session. Reads relevant TDR plus wiki pages by topic-tag matching the sprint slug. Cuts hallucination of nonexistent decisions and file paths.
- Wire into `design-large-task` Phase 2 (Parallel Context Exploration) — make TDR retrieval one of the standard explorers alongside industry research and codebase exploration. Mirror the existing `chester:design-large-task-industry-explorer` with a `prior-art-explorer` (already on roadmap per memory).

#### Post-run drift audit

- Add Chester skill `audit-doc-drift`, invoked at `execute-verify-complete`. For all files touched in `git diff HEAD~N`, find documentation references (`TDR-XXX` in XML comments, wiki backticked symbols, snippet markers). Report drift candidates without auto-fixing; human triage. Aligns with existing reasoning-audit and `chester:execute-verify-complete` capstone discipline.
- Compliance score thresholds match existing reasoning-audit pattern.

#### Sub-agent doc reviewer

- On each sub-sprint merge, dispatch sub-agent (general-purpose) with prompt: read `docs/chester/plans/<master>/<sub>/spec/` and the merged code; flag any spec assertion not visible in shipped code. Independent eyes; ground-truth on both sides. Use existing `chester:plan-build-plan-reviewer` machinery; new variant `chester:finish-spec-fidelity-reviewer`.

#### Tier the archive

- `docs/chester/plans/` grows monotonically. Cortex TMS pattern: introduce `docs/chester/plans/_archive-cold/` for sprints older than 2 master-plan revisions. Files in cold tier are not loaded by ground-truth retrieval. Keeps relevant context budget tight.

## 5. Sequenced First Cuts

Priority by ROI.

- **First** — promote 5–7 currently-unverified TDR claims to fitness tests. Highest leverage: catches the drifts that hurt most (architectural). One sprint of focused work.
- **Second** — install MarkdownSnippets; convert top 10 most-cited wiki snippets to extracted form. Stops example rot.
- **Third** — write `audit-doc-drift` Chester skill. Pure additive, runs at `execute-verify-complete`. Cheap; catches drift you're about to ship.
- **Fourth** — refactor root `CLAUDE.md`: extract transitional-state sections to generated `current-state.md`; cap at 200 lines; add `@imports`. Fixes biggest agent-misleading risk.
- **Fifth** — wire TDR-link-checker fitness test. Low effort; eliminates governance-archaeology breakage class.
- **Sixth** — generate concept index from `[Concept]` attributes. Mid-effort; high payoff in agent-context quality.

## 6. Anti-Recommendations

What NOT to do.

- **Do not adopt SDD wholesale (Kiro / Spec-kit / Tessl).** Chester pipeline already plays this role with better fit. Reading the SDD literature for ideas is useful; importing tooling adds overhead without gain.
- **Do not adopt AST-fingerprint stale detection (Drift).** Too new, too noisy on semantic-preserving refactors. Snippet binding plus fitness tests cover same surface with better precision.
- **Do not centralize doc ownership.** Chester sprint model is distributed-with-template — the right hybrid for solo plus AI workflow.
- **Do not chase 100% documentation coverage.** Theater risk scales with completeness pressure. Target high-traffic docs (intents, models, root `CLAUDE.md`, master plan) for high fidelity; let archive pages drift.

## 7. Synthesis

The strongest theme across the research: AI agents amplify whatever doc-code relationship already exists. Healthy mechanical binding → agents reinforce it. Theater → agents accelerate theater. Existing fitness-test culture is the asset; extending it is higher leverage than any new authoring discipline.

The pattern StoryDesigner most resembles is **Living Documentation + ADR governance + fitness functions**, with Chester sitting where Spec-Driven Development would normally sit. The hybrid is roughly 60% built. Gaps are mechanical (binding) and agent-aware (ground-truth loader plus drift audit), not philosophical. Six sequenced first cuts above close the gap incrementally without large up-front investment.

## 8. Sources

- Home Office DDaT Strategy — *Docs as code*. https://engineering.homeoffice.gov.uk/patterns/docs-as-code/
- Hyperlint — *5 critical documentation best practices for docs-as-code*. https://hyperlint.com/blog/5-critical-documentation-best-practices-for-docs-as-code/
- Kong — *What is Docs as Code?* https://konghq.com/blog/learning-center/what-is-docs-as-code
- arXiv 2604.27333 (2026) — *One Size Fits All? An Empirical Comparison of ADR Templates*. https://arxiv.org/abs/2604.27333
- Martin Fowler — *Architecture Decision Record*. https://martinfowler.com/bliki/ArchitectureDecisionRecord.html
- adr.github.io. https://adr.github.io/
- GDS — *Documenting architecture decisions*. https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html
- InfoQ — *Fitness Functions for Your Architecture*. https://www.infoq.com/articles/fitness-functions-architecture/
- Developers Voice — *Architectural Fitness Functions: Automating Modern Architecture Governance in .NET*. https://developersvoice.com/blog/architecture/architectural-fitness-functions-automating-governance/
- InfoQ — *Q&A with Cyrille Martraire on Living Documentation*. https://www.infoq.com/articles/book-review-living-documentation/
- Simon Cropp — *MarkdownSnippets*. https://github.com/SimonCropp/MarkdownSnippets
- Zak Henry — *embedme*. https://github.com/zakhenry/embedme
- Netlify — *A Key to High-Quality Documentation: Docs Linting in CI/CD*. https://www.netlify.com/blog/a-key-to-high-quality-documentation-docs-linting-in-ci-cd/
- Fiberplane — *Drift documentation linter*. https://fiberplane.com/blog/drift-documentation-linter/
- Diátaxis. https://diataxis.fr/
- HiveTrail — *AGENTS.md vs CLAUDE.md*. https://hivetrail.com/blog/agents-md-vs-claude-md-cross-tool-standard
- DeployHQ — *CLAUDE.md, AGENTS.md & Copilot Instructions*. https://www.deployhq.com/blog/ai-coding-config-files-guide
- Anthropic — *Best Practices for Claude Code*. https://code.claude.com/docs/en/best-practices
- HumanLayer — *Writing a good CLAUDE.md*. https://www.humanlayer.dev/blog/writing-a-good-claude-md
- Martin Fowler — *Understanding Spec-Driven Development: Kiro, spec-kit, and Tessl*. https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
- Red Hat Developers — *How spec-driven development improves AI coding quality*. https://developers.redhat.com/articles/2025/10/22/how-spec-driven-development-improves-ai-coding-quality
- GitHub Blog — *Spec-driven development with AI*. https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
- arXiv 2602.00180 (2026) — *Spec-Driven Development: From Code to Contract in the Age of AI Coding Assistants*. https://arxiv.org/html/2602.00180v1
- Addy Osmani — *How to write a good spec for AI agents*. https://addyosmani.com/blog/good-spec/
- Code on Grass — *How to Audit What Your AI Agent Actually Did After the Session*. https://codeongrass.com/blog/how-to-audit-ai-agent-post-run-drift/
- Mintlify — *AI hallucinations: what they are, why they happen, and how accurate documentation prevents them*. https://www.mintlify.com/resources/ai-hallucinations
- Noveum — *Why Your AI Agents Are Hallucinating*. https://noveum.ai/en/blog/why-your-ai-agents-are-hallucinating-and-how-to-stop-it
- Galileo — *7 AI Agent Failure Modes*. https://galileo.ai/blog/agent-failure-modes-guide
- Cortex TMS. https://cortex-tms.org/
- DevRev — *Decentralizing responsibility for company knowledge*. https://thebook.devrev.ai/blog/2024-11-20-docs-op-model/
- Aviator — *The Ultimate CODEOWNERS File Guide*. https://www.aviator.co/blog/a-modern-guide-to-codeowners/
- Tom Preston-Werner — *README Driven Development*. https://tom.preston-werner.com/2010/08/23/readme-driven-development
