---
name: plan-attack
description: >
  Adversarial review of implementation plans. Single-pass review that finds
  structural integrity gaps, execution risks, unstated assumptions, contract
  gaps, and concurrency hazards. Auto-triggers as part of plan-build's
  plan hardening gate. Can also be invoked manually via: "attack this plan",
  "adversarial review", "red-team this", "find the weaknesses", "stress test
  the plan", "what could go wrong", "/plan-attack".
---

# Adversarial Review

Attacks an implementation plan to surface weaknesses before implementation begins.
Every finding must cite real evidence from the codebase — file paths, line numbers,
dependency chains, or concrete code. Unsubstantiated concerns are not findings.

## Workflow

### Step 1 — Identify the plan

Locate the plan to attack. The user will either:

- Point to a specific document or file path
- Have just finished planning in the current session

If no plan is identifiable, ask the user to specify. Do not guess.

Read the full plan. Understand what it proposes before attacking it. Identify:

- The plan's stated scope and goals
- Files and subsystems it claims to touch (and claims NOT to touch)
- Ordering or sequencing assumptions
- Dependencies on existing behavior

### Step 2 — Attack the plan

Read the relevant parts of the existing codebase that the plan references. You need
to verify the plan's claims against what actually exists.

Then attack the plan across these dimensions:

**Structural integrity** — does the plan match reality?
- Do the file paths, class names, and interfaces the plan references actually exist?
- Does the plan correctly describe dependencies between projects/modules?
- Are there internal contradictions — saying X in one place and not-X in another?
- Are "what does NOT change" assertions actually true?

**Execution risk** — what goes wrong during implementation?
- What breaks if a step fails partway through? Are there partial-state dangers?
- Does step N depend on step M, but the plan doesn't enforce ordering?
- Will existing tests break? Does the plan account for test updates?
- Is there a sequence where the build is broken between steps?
- Does any persisted state need to change? Is that addressed?

**Assumptions and edge cases** — what does the plan take for granted?
- What implicit assumptions does the plan make without stating them?
- What happens when the happy path fails? Are error paths addressed?
- Does the plan assume specific framework behavior that may not hold?
- Does the plan implicitly require changes it doesn't list?

**Contract and migration completeness** — are all consumers updated?
- For every type or method the plan renames/replaces, are ALL call sites covered?
- Are there implicit usages (reflection, string-based lookups, serialization) that
  won't surface as compile errors?
- Do constructor/DI changes break object initialization?
- Are there tests referencing old types that the plan doesn't mention updating?

**Concurrency and thread safety** — will it be safe at runtime?
- Does the plan introduce shared mutable state without synchronization?
- Are there async/await hazards (deadlocks, fire-and-forget without error handling)?
- Does the plan access UI-bound objects from background threads?
- Are cancellation paths preserved?

For each dimension, verify claims against actual code. Use grep/search to enumerate
real usages — do not trust the plan's claim that it covers everything.

## Evidence Standard

Every finding must cite:
- A specific file path, line number, or concrete code reference
- What the gap is and why it matters for this plan specifically

If you cannot point to codebase evidence, drop the finding. This is the single most
important rule. Speculative "what if" concerns are not findings.

For assumptions you discover, note whether you verified them as TRUE, FALSE, or
UNVERIFIABLE against the actual code.

## Output

Write findings directly in the conversation. Use whatever severity scale and format
feels natural — the goal is clarity, not taxonomy compliance. Group related findings
when they share a root cause.

Note any assumptions the plan makes that you verified as correct — these reduce
uncertainty for the implementer.

End with a brief risk assessment: does this plan land cleanly, does it have areas
to watch, or are there structural problems that should be addressed first? Keep it
to 2-3 sentences.

### Step 3 — Stop

The report is the deliverable. Do not modify the plan, write files, or take further
action unless the user asks. The user decides how to respond to the findings.

## Boundaries

- This skill attacks plans. It does not review code quality or smell patterns.
- This skill does not write files. All output is inline in the conversation.
- This skill does not modify plans. It reports findings and the user decides.
- Each finding must have codebase evidence. Drop any finding that cannot cite a real
  file or code path. This is the single most important rule.
