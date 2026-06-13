# Adversarial Spec Review (inline)

Spec-flavored adversarial review. Modeled on `chester:plan-attack` but tuned for the
spec stage — the target is a spec document, not an implementation plan, and the
review runs **inline** in the dispatcher's context rather than as a subagent dispatch.
The dispatcher already holds the architect choice, prior-art findings, and brief
intent — losing that context to a subagent would degrade the review.

## Purpose

Surface gaps, contradictions, and unstated assumptions in the spec **before** the
plan stage plans against false premises. Fidelity review (the upstream pass) checks
that the spec aligns with the brief. This review checks that the spec aligns with
**reality** — what the codebase actually contains and how the proposed work will
actually behave.

## Workflow

### Step 1 — Re-read the spec with adversarial intent

Read the spec end to end as if you are about to build it and want to find every
reason the plan-stage work will hit surprises. Identify:

- The spec's stated scope and what it claims will and will not change
- Files, types, interfaces, and APIs the spec references
- Ordering, dependency, and runtime assumptions
- Contracts the spec describes (signatures, parameter lists, return types, DI
  registrations)

### Step 2 — Verify against the codebase

Read the relevant source files. The spec passed fidelity review against the brief
— that does not mean it matches the codebase. Open every file the spec names and
verify the spec's claims against what the code actually shows.

### Step 3 — Attack the spec across these dimensions

**Structural integrity** — does the spec match reality?

- Do the file paths, type names, and interfaces the spec references actually exist?
- Does the spec correctly describe dependencies between projects/modules?
- Are there internal contradictions — saying X in one section and not-X in another?
- Are "what does NOT change" assertions actually true? (Specs frequently understate
  blast radius — verify each "will not affect" claim.)

**Execution risk** — what goes wrong during plan-stage work or implementation?

- What breaks if a step in the spec's described work fails partway through?
- Are there partial-state dangers? Migration sequences that leave the system
  inconsistent if interrupted?
- What pre-existing behavior will the proposed changes interact with in ways the
  spec doesn't address?

**Unstated assumptions** — what is the spec assuming that isn't explicit?

- Runtime behavior (ordering, concurrency, idempotence)
- Deployment environment (DI lifetimes, configuration, feature flags)
- Dependencies on other in-flight work (sprints, tickets, infrastructure changes)
- Data shapes the spec assumes will be present at runtime

**Contract gaps** — are the interfaces described accurately and completely?

- Signatures, parameter lists, return types, nullability, error handling
- DI registrations and lifetimes
- Public API surface — do callers exist that the spec doesn't mention?

**Concurrency and interaction hazards** — what happens at the system seams?

- Will the proposed changes interact with existing background work, schedulers,
  or event handlers?
- Will the spec's changes change the *order* in which existing operations happen,
  even if no individual operation changes?
- Are there cache coherence, race condition, or transaction boundary risks the
  spec glosses over?

## Evidence Rule

Every finding **must** cite specific evidence:

- A file path (and line number if relevant)
- A concrete passage from the spec
- A concrete code reference that contradicts or undermines the spec

If you cannot point to a specific file:line or a specific spec passage, drop the
finding. Speculative concerns are not findings. **This is the single most important
rule** — without it, adversarial review degrades into vibes.

## Severity Scale

| Severity | Meaning |
|----------|---------|
| HIGH | Spec claim is factually wrong or structurally broken — plan-stage work based on this will fail or produce wrong behavior |
| MEDIUM | Spec is misleading or incomplete — plan stage will work but may include dead work, wrong counts, or unnecessary complexity |
| LOW | Spec omits useful context — latent risks, edge cases, or adjacent code worth flagging to the implementer |

## Output Format (for the dispatcher's own working notes)

```
## Adversarial Spec Review

**Status:** Clean | Findings

**Verified Claims:**
- [Claim from spec] — CONFIRMED at [file:line]

**Findings (if any):**
- **[SEVERITY]: [One-line summary]**
  Spec says: "[what the spec claims]"
  Code shows / reality is: "[what actually exists]" — [file:line if applicable]
  Impact: [why this matters for plan stage or implementation]

**Risk Assessment:**
[2-3 sentences: does this spec accurately describe what it touches; are there areas
to watch; are there factual or structural errors that should be fixed before
proceeding to plan-build?]
```

## Addressing Findings

After completing the review, address findings inline in the same session:

- **HIGH and MEDIUM findings:** fix the spec, bump the version per
  `util-artifact-schema`.
- **LOW findings:** leave a note in the spec or skip — these are context, not
  required fixes.

No subagent re-dispatch. No iteration cap. The single inline pass is the gate.
If findings are so numerous that confidence in the spec is shaken, escalate to
the user with the review notes and ask whether to keep iterating, revise the
architecture choice, or revisit the brief.

## Why Inline (and Not a Subagent)

Subagent dispatch wins when bias isolation matters more than context. Spec
fidelity review is dispatched precisely for that reason — a fresh-context
reviewer applying a tight checklist catches drift the writer can't see.

Adversarial review is different. The findings depend on knowing:

- Which architect option the user picked and what its declared sacrifices were
- What the prior-art explorer surfaced about adjacent sprints
- What the brief intent actually is, beyond what made it into the spec text
- What the dispatcher already noticed but didn't yet write down

A subagent would have to be re-fed all of this, and would still miss the
dispatcher's tacit context. Inline keeps the full mental model intact and makes
re-running the review (after user-requested changes at the review gate) cheap.
