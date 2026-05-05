# Cluster C — Restructure Understand: Closing Design Document

**Sprint:** `cluster-c-restructure-understand`
**Status:** Closed without delivery 2026-05-05; scope transferred to cluster D — Build Shared Understanding (master-plan.md §4.5)
**Document type:** Closing design document — captures the session's reasoning trail and handoff for an undelivered cluster
**Date written:** 2026-05-05

---

## Why This Document Exists

Cluster C never closed a proof. The session opened, hit a hard pivot mid-flight on 2026-05-04, paused, resumed under the pivot framing on 2026-05-05, opened a fresh proof, and immediately encountered a higher-altitude reframe from the designer that the cluster C charter could not absorb in-band. Cluster C transfers its learnings to cluster D and closes.

The standard cluster design brief format does not fit — there is no proof envelope to render, no closing argument that landed, no architecture to hand off. What cluster C produced is reasoning trail: a sequence of pivots and reframes that tightened the problem altitude. That reasoning trail is load-bearing inheritance for cluster D and worth preserving with care.

This document captures: (1) the original cluster C charter, (2) the 2026-05-04 pivot, (3) the 2026-05-05 reframe, (4) what survives forward into cluster D as opening seed material, and (5) what dies with cluster C.

---

## Original Cluster C Charter (Pre-Pivot)

Per master-plan.md §4.3 (now retired by §11 amendment):

> Restructure the targeted Phase 4a Understanding MCP so its altitude is design-level and its language is formalized enough to transition cleanly into Phase 4b per cluster B's transition process. Settle Phase 4a operational target. Validate Discovery lens atomicity for Scope / Givens / Dependencies (or replace with different lenses). Define opening sequence (vocabulary first, then conditions, or different sequence). Cluster C modifies only one Understanding MCP; the plugin architecture is preserved.

The charter assumed the Phase 4a / Phase 4b boundary as the design subject and proposed reshaping one side of it.

The cluster C design conversation 2026-05-04 ran the problemfocused Understanding MCP with the targeted-flow framing. It produced extensive vocabulary work (33 terms ratified across two large vocabulary actions, including the Tier 1/2 plugin host model — Interview Plugin system, Plugin slot, Plugin, Content layer, Presentation layer, Submission contribution, Personality plugin, Verbosity plugin, Presentation altitude, Discovery lens) and reached the point of building per-turn rules around the plugin host architecture. That trajectory died at the pivot.

---

## Pivot 1 — One-System Architecture (2026-05-04)

During cluster C round work the designer ratified a structural pivot: the Phase 4a / Phase 4b separation is itself the structural defect cluster C was supposed to repair, not a feature to preserve while restructuring one side. The pivot replaced the cluster C charter with:

> Redesign design-large-task as a one-system architecture using the existing proof MCP throughout, eliminating the Phase 4a / Phase 4b separation while preserving the original Chester insight of channeling completion drive into structured artifacts.

Six pivot pre-conditions surfaced:

- Subagent dispatch during conversation is infeasible at >5 min per round (observed during the cluster C session)
- Designer-codebase asymmetry: in 250k-LOC systems no single human can be authority on patterns
- Five prior interview systems failed (chester small-task / generic LLM-as-interviewer; classic; architectural; problemfocused; team-interview; lens architecture rebuild)
- Channel-don't-prohibit principle is foundational from `plan-mode-design-guard` rationale
- Two-system architecture confirmed as the structural defect (not a target shape)
- Lens architecture (3-lens shared-understanding mechanism) abandoned

The pivot wrote a session-internal restart manifest to `design/cluster-c-proof-seed.json` carrying:

- Reframed one-sentence problem statement
- Seven Concerns (CN-1..CN-7) anchoring the redesign
- Six load-bearing Evidence entries (EV-A through EV-G, with EV-C absent — the original numbering had a gap)
- "All rules invalidated" flag covering master plan R1–R10, cluster A rules, cluster B.1 rules, cluster B.2 rules, all cluster C drafts (later refined to "transitioned to draft pending review, not deleted")

The designer then paused the session.

The pivot was recorded as master-plan.md §11 Pivot Amendment and master CLAUDE.md tail amendment.

---

## Pivot 1 Resume — 2026-05-05

The session resumed 2026-05-05 with bootstrap (worktree + branch `cluster-c-restructure-understand` off main; pre-pivot state archived at `design/archive-prepivot/`). The resumed agent confirmed the seed material with the designer:

- Problem statement: confirmed
- 7 Concerns: confirmed
- 6 Evidence: confirmed
- "All rules invalidated" framing: **corrected by designer** — rules transitioned to draft pending review, not deleted; CN-5 owns the review work

Source-classification correction surfaced when the agent attempted to open the proof: the original seed had EV-D, EV-E, EV-F, EV-G with `source: "designer"`, which the proof MCP rejects (EVIDENCE source enum cannot be "designer"). Designer corrected: *"designer is not a source of evidence; only observable sources."* The four were reclassified:

- EV-D Subagent infeasibility → `session-observation`
- EV-E Designer-codebase asymmetry → `industry`
- EV-F Five prior interview systems failed → `prior-art`
- EV-G Channel-don't-prohibit foundational → `prior-art`

A first `open_proof` call wrote partial state before the source-validation throw; the file at `design/cluster-c-restructure-understand-proof-state.json` was the residue. A second `open_proof` call against `-state-01.json` succeeded — 6 Evidence admitted via the permissive boundary, 7 Concerns rejected at the boundary because Concerns route through `manage_concerns` not `submission_material.elements[]`.

Seven `manage_concerns add` calls landed CERN-1..CERN-7. The seventh call surfaced a heuristic friction hint: *concern-concern-competition between CERN-2 (Interview initiation to set the proof) and CERN-6 (Balance between proof and interview responsibilities) — shared tokens "interview, proof"*.

The designer was asked to resolve the friction hint (keep distinct / merge / sharpen labels). Instead the designer reframed.

---

## Pivot 2 — Reframe to Shared Understanding (2026-05-05)

The designer's reframe arrived as a complete restatement at higher altitude than cluster C's charter could absorb:

> reframe
> organizing principle 1: 'Design is the code'. Give the agent and designer a formal language to operate with to harness the drive toward implementation back into a design level altitude
> organizing principle 2: 'The purpose is to create Shared Understanding. Through shared understanding the design system delivers a commonly understood set of design requirements to the Specify system'
>
> problem statement; how do we create a unified design system that builds shared understanding of the problem that delivers commonly understood design requirments to the Specify system
>
> [seven new concerns about initial information, explore agents, presentation layer, proof layer, cooperative proof advancement, research direction, specify handoff fidelity]

The reframe is structural. It is not "shape the design differently" — it is "design a different system."

### Why Pivot 2 Forces Cluster Transfer, Not Another In-Cluster Pivot

The 2026-05-04 pivot was an architecture-level move: same problem, different shape. *"Eliminate the 4a/4b boundary"* takes the same target system and proposes a different topology.

The 2026-05-05 reframe is a charter-level move: different problem altitude. *"Create a unified design system that produces shared understanding for Specify handoff"* describes a system whose reason-for-existing is articulated differently than anything cluster C ever held. The two organizing principles (Design is the code; Purpose is Shared Understanding) are foundational rules that no cluster C charter ever carried. They sit above the architecture choice cluster C was about to make.

Two mechanism-level constraints reinforce the cluster-transfer path:

- Cluster B.1 R6: "in-band amendment forbidden after restructuring; only fresh submission per RC-5." The problem statement cannot amend in-band on the open proof.
- `manage_concerns` API: only `add` and `lock` operations are exposed; no `withdraw`. The seven existing concerns cannot be replaced in-band.

Either constraint alone would force a fresh `open_proof`. Together with the charter-level shift, a fresh sub-sprint is the structurally honest path.

---

## What Cluster D Inherits as Opening Seed

The full reframed material carries forward to cluster D:

### Two Organizing Principles (Rule-class)

1. **"Design is the code."** Formal language for the agent and designer; harness implementation drive back into design altitude.
2. **"The purpose is to create Shared Understanding."** Design system delivers commonly understood requirements to Specify through shared understanding.

### Reframed Problem Statement

How do we create a unified design system that builds shared understanding of the problem that delivers commonly understood design requirements to the Specify system?

### Seven New Concerns

1. Initial information available to the skill and how the initial topic and concerns are derived
2. Explore agents researching information relevant to our topic
3. Presentation layer — how information is provided to the designer to build shared understanding
4. Proof layer — how the agent faithfully manages information to build shared understanding
5. Agent and designer cooperatively advancing the proof
6. Proof system directing agent research for the next round presentation
7. Proper information provided to specify so it creates architecture that correctly addresses designer's intent

### Six Evidence Pieces (sources reclassified per the 2026-05-05 correction)

- EV-A `codebase` — design-large-task currently has the two-stage Phase 4a / Phase 4b structure
- EV-B `codebase` — Proof MCP exists with element types: NC, Rule, Permission, Evidence, Risk, Concern, Resolve Condition, Friction
- EV-D `session-observation` — Subagent dispatch during conversation is infeasible at >5 min/round
- EV-E `industry` — Designer-codebase asymmetry: 250k-LOC systems exceed single-human pattern authority
- EV-F `prior-art` — Five prior interview systems failed in Chester sprint history
- EV-G `prior-art` — Channel-don't-prohibit principle is foundational in plan-mode-design-guard rationale

### Vocabulary Corpus

Captured at `cluster-a-define-solve/summary/vocabulary-corpus-2026-05-05.md` — full snapshot across master plan immutable + cluster A/B.1/B.2 shipped + cluster C pre-pivot drafts + pivot-introduced terms. Cluster D reads as inheritance.

---

## What Cluster D Does NOT Inherit

### From Original Cluster C (Pre-Pivot 1) Vocabulary Work

The Tier 1/2 plugin host model — Interview Plugin system, Plugin slot, Plugin, Content layer, Presentation layer, Submission contribution, Personality plugin, Verbosity plugin, Presentation altitude — was built around the two-system Phase 4a flow. The 2026-05-04 pivot dissolved the substrate it sat on. The 2026-05-05 reframe further changed the problem altitude. None of these terms carry forward as load-bearing for cluster D.

They survive in the vocabulary corpus as **deprecated drafts** for paper trail — visible to next-readers, marked retired.

### From Pre-Pivot 2 Cluster C Session Rules and NCs

The cluster C session never authored final NCs (the per-turn solve cycle did not run after pivot 2). The pre-pivot R03 + R13 + R20 + R24-R39 drafts ratified during the original cluster C session are part of the prior-corpus rules now held as draft pending review under §12. Cluster D reviews them per CN-5-equivalent work (concerns reshape but the principle of held-draft-rules-pending-review continues).

### Cluster C-Specific Charter Framing

"Restructure Phase 4a Understanding MCP" is dead. So is its successor "redesign as one-system using existing proof MCP." Cluster D's charter is the unified-design-system framing — different problem, different organizing principles.

---

## Lessons Captured (For Cluster D and Future Clusters)

### When Reframes Stack, the Top One Wins

Cluster C absorbed pivot 1 by amendment because pivot 1 was an architecture move within the cluster's altitude. Cluster C could not absorb pivot 2 because pivot 2 changed the altitude itself. The signal that an in-cluster pivot has run out of headroom is the moment a designer's restatement introduces organizing principles the existing charter doesn't carry. At that point the right move is cluster transfer — not another amendment, not a third pivot.

### Vocabulary Work Anchored to a Doomed Substrate is Sunk Cost

The cluster C 2026-05-04 vocabulary work (Interview Plugin system, Plugin slot, etc.) was high-quality design conversation that produced load-bearing terms — but the substrate they were built on (the Phase 4a / Phase 4b split) was about to be retired. The cluster C session did not surface "is the Phase 4a / Phase 4b split itself a defect?" until vocabulary work had already entrenched terms that depended on it. A future-Chester improvement: in design conversations targeting one side of a system boundary, surface "is the boundary itself the design subject?" early — before vocabulary work compounds investment in preserving the boundary.

### Permissive Boundary + Manage_Concerns API Asymmetry

`open_proof` accepts caller-drafted `submission_material.elements[]` of any category labels and routes by 4b-internal restructuring; the API rejected `category: "CONCERN"` as not in `REQUIRED_FIELDS_REGISTRY`. The mechanism for adding Concerns is `manage_concerns add`, not `submission_material.elements[]`. The skill body for `design-large-task` says "elements[] array of caller-drafted typed-element candidates (Concerns drafted in Phase 4a, ...)" — the documentation and the API disagree at the boundary. This is a B.1 follow-up cleanup item or a documentation correction (out of scope for cluster D charter; possibly worth a task sub-sprint).

### EVIDENCE Source Enum is Closed Tighter Than the Skill Body Suggests

The `design-large-task` skill body presents EVIDENCE as having `source: "codebase"` — implicit closed set with one value. The proof MCP actually rejects only `source: "designer"` and accepts arbitrary string sources (codebase, industry, prior-art, session-observation are all accepted). Designer's correction *"designer is not a source of evidence; only observable sources"* maps cleanly: any observable source label passes; only the designer-direct claim shape is rejected. Documentation could be tightened — out of scope for cluster D.

---

## Closing Note

Cluster C produced no shipped code. It produced reasoning trail. The reasoning trail is the deliverable: it reframed the problem twice and ended at a charter cluster D will run from. The session-time invested was not waste — pivot 1 confirmed the Phase 4a / Phase 4b split was the defect, pivot 2 reframed the problem at the altitude where the design system's purpose lives. Cluster D inherits both reframes and the seed material that came out of them.

This is the cluster C design-level document. It closes the cluster.

<!-- created-at: 2026-05-05T10:35:09Z -->
<!-- produced-by design-large-task@v0011 -->
