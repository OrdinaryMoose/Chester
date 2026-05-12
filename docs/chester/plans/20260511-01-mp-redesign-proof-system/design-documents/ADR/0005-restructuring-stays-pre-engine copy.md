---
status: Accepted
date: 2026-05-10
deciders: [M]
related_docs: [05-domain-spec]
---

# ADR-0005: Restructuring stays pre-engine

## Status

Accepted.

## Context

The proof MCP's restructuring pipeline (existing module: `restructure.js` plus helpers) handles open-proof submission. It takes loosely-shaped submission material (problem statement, concerns, elements with various levels of completeness) and produces:

- Validated, typed elements with required fields populated
- Action labels per field describing how each value came to be
- Provenance objects with reasoning chains for non-verbatim values
- A restructuring report
- A pass/fail verdict from the open gate

The forward-solve paradigm shift (ADR-0007) raises the question: should restructuring also become an Engine query?

The case *for* engine-resident restructuring:
- Uniformity. Every other validation in the system migrates to engine queries (integrity, closure, friction); restructuring as the lone procedural module breaks the pattern.
- Inspectability. The agent could query "what restructuring rules apply to this submission?" and get a structured answer.
- Adversary leverage. The Adversary could probe restructuring outcomes via the same engine surface.

The case *against*:
- **Bootstrap problem.** The Engine evaluates against typed facts. Restructuring's job is to *produce* the typed facts from untyped input. Running restructuring inside the Engine requires engine-resident type inference and reshaping of unstructured input — capabilities outside Datalog's purview and outside the Engine spec's intentional scope.
- **Wrong paradigm.** Datalog operates on facts; restructuring operates on text and category dispatch. Forcing text-shaping into Datalog rules would either (a) add string-manipulation built-ins to the Engine (rejected by Engine Spec §10.3) or (b) require pre-tokenization that itself happens outside the Engine, leaving the same procedural step in place under a different name.
- **Atomic boundary.** Restructuring is the single atomic transition from "outside" (untyped) to "inside" (typed). After restructuring, the Engine sees typed facts. Before restructuring, no facts exist to operate on. Putting this transition inside the Engine erases its atomicity.
- **Cost-benefit.** Restructuring is exercised once per `open_proof` call. Engine-residency adds implementation cost without comparable runtime benefit.

The architectural question is whether the Engine's role is "the only place inference happens" or "the place where typed-fact inference happens." The latter respects the Engine's intentional scope; the former overreaches into territory Datalog is poorly suited to.

## Decision

**Restructuring stays in the Domain layer, pre-Engine.** It is the bootstrap step that produces typed facts and rules from submission material; once it completes, the Engine takes over.

Specifically:
- Restructuring runs in `domain/restructuring.js`
- It validates submission material against the schema registry
- It assigns per-field action labels and per-element aggregate labels
- It builds provenance objects
- It runs the open gate
- On gate-pass, it asserts the resulting facts and rules into the Engine
- On gate-fail, it persists a rejected-open record in the operation log; no engine state is created

Restructuring does NOT use the Engine for its own operation. The Engine is downstream of restructuring, not surrounding it.

## Consequences

**Positive:**
- **Engine spec stays clean.** The Engine remains a Datalog evaluator with no string-shaping or category-dispatch responsibilities.
- **Bootstrap is explicit.** The architectural boundary "untyped → typed" lives at one place; this is the exact discipline ADR-0001's hexagonal layering depends on.
- **Restructuring is testable in isolation.** The pipeline takes input, produces output; the test surface is direct.
- **Failure mode is scoped.** Submission material that fails the open gate is rejected before any Engine state exists, so there is no need to "roll back" the Engine.

**Negative:**
- **Ad-hoc inspection limited.** The agent cannot probe restructuring decisions via engine queries. The Domain surfaces inspectable decisions through ordinary API methods instead.
- **Asymmetry with later phases.** Closure, integrity, friction, and inference all migrate to engine queries; restructuring stands alone as procedural. This is a real asymmetry. The justification is that the layers are intentional: untyped → typed → derived. Each layer has its own paradigm fit.
- **Adversary on restructuring requires Domain access.** The Adversary cannot probe restructuring through the Engine's query interface; if restructuring becomes an attack surface, the Adversary needs a Domain-level view. This is acceptable.

**Neutral:**
- The boundary between restructuring (Domain) and inference (Engine) maps cleanly to the architecture's layering. Restructuring is part of the Domain because it *uses* the schema registry and the closed-set vocabularies. The Engine is a generic evaluator unaware of those concepts.

## Alternatives considered

- **Engine-resident restructuring**: rejected for the reasons in Context. Engine spec §2.2 explicitly excludes function symbols and external fact sources, both of which engine-resident restructuring would require.
- **Two-stage restructuring (procedural shape detection + engine validation)**: this is essentially the current decision under a different name. The shape-detection stage is restructuring; the validation stage uses Engine integrity rules (Domain Spec §7.5). This is what is implemented.
- **Defer restructuring entirely; treat all submissions as raw**: rejected because the open gate's discipline (action labels, provenance, restructuring report) is part of the channeling architecture; removing it removes a load-bearing constraint on the agent.

## References

- Domain Spec §9 (Restructuring)
- Engine Spec §2.2 (Excluded features)
- ADR-0001 (Three-layer hexagonal)
