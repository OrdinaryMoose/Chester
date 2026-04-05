---
name: chester-plan-smell
description: >
  Forward-looking code smell analysis of an implementation plan. Single-pass review
  that identifies structural smells, coupling risks, and change-prevention patterns
  the plan would introduce into the codebase. Auto-triggers as part of
  chester-plan-build's plan hardening gate. Can also be invoked manually via:
  "smell review", "code smell check", "will this introduce smells", "smell analysis",
  "check the plan for smells", "/chester-plan-smell".
---

# Smell Review

Analyzes an implementation plan for code smells it would introduce. Every finding must
cite real evidence — plan text, proposed class/method names, file paths, or existing
constructs the plan touches. Speculation without evidence is not a finding.

## Relationship to other review skills

Independent and complementary to `chester-plan-attack`.

- `chester-plan-attack` attacks internal logic and execution feasibility
- This skill asks: will the plan introduce structural code quality problems?

Both can run on the same plan without meaningful overlap.

## Focus

This skill is **forward-looking**. The primary question is:

> What smells will this plan introduce or worsen?

Existing smells are only relevant if the plan directly touches them and makes them worse.
Note those briefly but do not let smell archaeology dominate findings. The deliverable is
a smell forecast, not a codebase audit.

## Workflow

### Step 1 — Identify the plan

Locate the plan to review. The user will either:

- Point to a specific document or file path
- Have just finished planning in the current session

If no plan is identifiable, ask the user to specify which plan to review. Do not guess.

Read the full plan. Understand what it proposes before looking for problems. Identify:

- The plan's stated scope and goals
- New classes, methods, interfaces, or abstractions it proposes
- Files and subsystems it touches
- Structural decisions it makes (inheritance, delegation, composition choices)
- Any abstractions it defers, leaves partial, or marks "for later"

### Step 2 — Review for smells

Read the relevant parts of the existing codebase that the plan touches. You need to
understand what's already there to judge whether the plan improves or degrades it.

Then analyze the plan across two complementary dimensions:

**Structural concerns** — will the plan make the code harder to maintain?
- Duplication: does the plan reimplement something that already exists, or create
  parallel paths that do the same thing?
- Responsibility overload: does any proposed class take on too many unrelated concerns?
  Would changes to different features all require touching the same class?
- Unnecessary abstraction: does the plan add layers, interfaces, or wrapper classes
  that have no current consumer beyond one call site?
- Deferred complexity: does the plan mark things "for later" in ways that will calcify
  into permanent debt?

**Coupling and change-propagation concerns** — will the plan make the code fragile?
- Tight coupling: do proposed classes reach into each other's internals? Do high-level
  modules depend directly on low-level ones rather than abstractions?
- Shotgun surgery: does the plan distribute a single concern across many files, so that
  future changes to that concern require touching all of them?
- Hierarchy problems: does the plan introduce inheritance where composition belongs?
  Does it create parallel hierarchies that must be kept in sync?
- Contract fragility: does the plan create implicit contracts (string matching, assumed
  field presence, convention-based wiring) that break silently when things change?

Also consider practical risks the plan introduces:
- Error paths: does the plan handle failure cases, or does it only describe the happy path?
- Resource management: does the plan create objects that need cleanup (subscriptions,
  connections, timers) without addressing disposal?
- Concurrency: if the plan involves async or parallel work, does it address thread safety?

## Evidence Standard

Every finding must cite:
- The specific plan section, proposed construct, or existing file that is the evidence
- What the smell is and why it matters for this plan specifically
- Whether the plan explicitly acknowledges the risk (if so, note it but don't penalize)

If you cannot point to concrete evidence in the plan text or codebase, drop the finding.
This is the single most important rule.

## Output

Write findings directly in the conversation. Use whatever severity scale and format feels
natural for the findings — the goal is clarity, not taxonomy compliance. Group related
findings when they share a root cause.

End with a brief risk assessment: does this plan land cleanly, does it have areas worth
watching during implementation, or are there structural problems that should be addressed
before building? Keep it to 2-3 sentences.

### Step 3 — Stop

The report is the deliverable. Do not modify the plan, write files, or take further action
unless the user asks. The user decides how to respond to the findings.

## Boundaries

- This skill reviews plans. For reviewing existing code, use `chester-util-codereview`.
- This skill does not write files. All output is inline in the conversation.
- This skill does not modify plans. It reports findings and the user decides.
- This skill does not attack plan logic or execution feasibility — that is
  `chester-plan-attack`'s job.
- Each finding must have plan or codebase evidence. Drop any finding that cannot cite
  a real proposed construct or file. This is the single most important rule.
