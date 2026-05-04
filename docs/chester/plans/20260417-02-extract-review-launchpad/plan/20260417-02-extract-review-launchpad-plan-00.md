# Extract Review Launchpad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract subagent-facing dispatch templates for the `plan-attack` and `plan-smell` lenses into `skills/plan-build/`, mirroring the existing `plan-reviewer.md` pattern, and rewrite `plan-build/SKILL.md`'s Plan Hardening section to dispatch via these templates.

**Architecture:** Two new dispatch-template files live beside `plan-reviewer.md`. Their bodies copy specified body-only line ranges verbatim from the lens `SKILL.md` files. Plan-build's Plan Hardening section changes from "read the skill file, embed the full skill instructions" to "read the dispatch template, substitute `[PLAN_FILE_PATH]`, launch." No changes to lens SKILL.md files, `plan-reviewer.md`, the Plan Review Loop, or `setup-start`.

**Tech Stack:** Markdown prose files. No runtime code, no tests — verification is via verbatim-content diff against lens line ranges plus cold-read confirmation.

**Verification model (TDD adaptation):** Each create task starts by reading the source line ranges (the "test fixture"), writes the file (the "implementation"), then diffs the written body against the source range (the "assertion"). Plus a cold-read step that confirms a subagent receiving the dispatch template as its full prompt would know what to check, how to cite evidence, and what output format to produce.

---

## Prerequisites

- Working tree clean or in a dedicated worktree. This refactor modifies Chester itself (`skills/plan-build/`) — commits land on the current branch. If running from a non-worktree main branch, pause and confirm.
- `plan-reviewer.md` at `/home/mike/Documents/CodeProjects/Chester/skills/plan-build/plan-reviewer.md` is the template model. Read it once before starting to internalize the pattern: sync reminder (new — not in plan-reviewer.md, but required by spec), purpose line, "Dispatch after:" line, fenced `Task tool:` block with `description:` and `prompt:` fields, "Reviewer returns:" footer.
- The spec at `docs/chester/working/20260417-02-extract-review-launchpad/spec/20260417-02-extract-review-launchpad-spec-02.md` is the authority on what content comes from where. Keep it open while implementing.
- **Capture the pre-refactor HEAD SHA before Task 1 begins.** Task 4's regression check diffs against this SHA rather than relying on `HEAD~3`, which is fragile if any commit gets amended, squashed, or hook-rewritten mid-refactor.

  Run:
  ```bash
  cd /home/mike/Documents/CodeProjects/Chester
  export PRE_REFACTOR_SHA=$(git rev-parse HEAD)
  echo "$PRE_REFACTOR_SHA" > /tmp/extract-review-launchpad-pre-sha
  echo "Pre-refactor SHA: $PRE_REFACTOR_SHA"
  ```

  Expected: full 40-char SHA printed. The value is also persisted to `/tmp/extract-review-launchpad-pre-sha` so it survives new shell invocations across tasks (read with `PRE_REFACTOR_SHA=$(cat /tmp/extract-review-launchpad-pre-sha)` if needed).

---

## Task 1: Create `plan-attack-dispatch.md`

**Files:**
- Create: `skills/plan-build/plan-attack-dispatch.md`
- Reference (read-only): `skills/plan-attack/SKILL.md` (source of verbatim content)
- Reference (read-only): `skills/plan-build/plan-reviewer.md` (template structure)

**What the file needs to do:** Serve as a subagent-facing Task-tool prompt template for the attack lens. When plan-build's Plan Hardening section reads this file and substitutes `[PLAN_FILE_PATH]`, the result must be a complete subagent prompt — no reading of other files required, no dialogue with a user.

- [ ] **Step 1: Read the source line ranges and capture their exact content**

Run:
```bash
sed -n '38,76p' /home/mike/Documents/CodeProjects/Chester/skills/plan-attack/SKILL.md
sed -n '80,88p' /home/mike/Documents/CodeProjects/Chester/skills/plan-attack/SKILL.md
sed -n '92,101p' /home/mike/Documents/CodeProjects/Chester/skills/plan-attack/SKILL.md
```

Expected: three blocks of text. Range `38-76` begins "Read the relevant parts of the existing codebase…" and ends "…do not trust the plan's claim that it covers everything." Range `80-88` begins "Every finding must cite:" and ends "…UNVERIFIABLE against the actual code." Range `92-101` begins "Write findings directly in the conversation." and ends "…Keep it to 2-3 sentences."

Capture these exact strings — they will be pasted into the dispatch template in Step 3 and re-diffed in Step 4.

- [ ] **Step 2: Read `plan-reviewer.md` as the structural model**

Run:
```bash
cat /home/mike/Documents/CodeProjects/Chester/skills/plan-build/plan-reviewer.md
```

Note the structure:
- Title (`# … Reviewer Prompt Template`)
- Purpose and "Dispatch after:" lines
- Fenced block opening with `Task tool (general-purpose):` and indented `description:` + `prompt:` keys
- Prompt body (role, file path placeholders, checklists, output format)
- "Reviewer returns:" footer

The new file mirrors this structure plus one addition required by the spec: a sync-discipline reminder line at the very top (above the purpose line).

- [ ] **Step 3: Write `skills/plan-build/plan-attack-dispatch.md`**

The file contents:

````markdown
> Evidence standard and output format are sourced verbatim from `plan-attack/SKILL.md` — update both files together.

# Plan Attack Dispatch Template

Use this template when dispatching an adversarial plan reviewer (the `plan-attack` lens) as a subagent during `plan-build`'s Plan Hardening phase.

**Purpose:** Adversarial structural review of implementation plans — finds integrity gaps, execution risks, unstated assumptions, contract gaps, and concurrency hazards with codebase evidence.

**Dispatch after:** The plan review loop approves the plan, during Plan Hardening.

```
Task tool (general-purpose):
  description: "Adversarial plan review"
  prompt: |
    You are an adversarial plan reviewer. Attack this implementation plan to surface
    weaknesses before implementation begins. Every finding must cite real evidence
    from the codebase — file paths, line numbers, dependency chains, or concrete code.
    Unsubstantiated concerns are not findings.

    **Plan to review:** [PLAN_FILE_PATH]

    Read the full plan before attacking it. Identify the plan's stated scope and
    goals, the files and subsystems it claims to touch (and claims NOT to touch),
    ordering or sequencing assumptions, and dependencies on existing behavior.

    ## What to Check

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
```

**Reviewer returns:** Findings grouped by root cause (severity scale at the reviewer's discretion), verified assumptions, brief risk assessment.
````

**Verbatim-content check (write-time discipline):** The three body regions above — under headings `## What to Check`, `## Evidence Standard`, `## Output` — must match the captured content from Step 1 character-for-character modulo the 4-space indentation of the fenced `prompt: |` block. Do not paraphrase. Do not drop bullets. Do not impose a severity table.

- [ ] **Step 4: Verify verbatim match**

Run (diff check on the three body regions, using heading anchors on both sides so the check is robust to future line-number drift in either file):

```bash
DISP=/home/mike/Documents/CodeProjects/Chester/skills/plan-build/plan-attack-dispatch.md
SRC=/home/mike/Documents/CodeProjects/Chester/skills/plan-attack/SKILL.md

# What-to-check: dispatch body between `## What to Check` and `## Evidence Standard`
#                source body between `### Step 2 — Attack the plan` and `## Evidence Standard`
diff <(sed -n '/^    ## What to Check$/,/^    ## Evidence Standard$/p' "$DISP" | sed '1d;$d' | sed 's/^    //' | sed '/^$/d') \
     <(sed -n '/^### Step 2 — Attack the plan$/,/^## Evidence Standard$/p' "$SRC" | sed '1d;$d' | sed '/^$/d')

# Evidence standard: both sides bounded by `## Evidence Standard` → `## Output`
diff <(sed -n '/^    ## Evidence Standard$/,/^    ## Output$/p' "$DISP" | sed '1d;$d' | sed 's/^    //' | sed '/^$/d') \
     <(sed -n '/^## Evidence Standard$/,/^## Output$/p' "$SRC" | sed '1d;$d' | sed '/^$/d')

# Output: dispatch body from `## Output` to end of fenced block; source body from `## Output` to `### Step 3 — Stop`
diff <(sed -n '/^    ## Output$/,/^```$/p' "$DISP" | sed '1d;$d' | sed 's/^    //' | sed '/^$/d') \
     <(sed -n '/^## Output$/,/^### Step 3 — Stop$/p' "$SRC" | sed '1d;$d' | sed '/^$/d')
```

Expected: each diff produces **no output** (files identical modulo 4-space indent and blank lines).

*Why heading anchors:* if content is ever added or removed above these sections in either file, line numbers shift but heading boundaries don't. Makes the verification idempotent under future edits.

*Tolerance note:* The diffs strip the 4-space indentation introduced by the YAML fenced `prompt: |` block and ignore blank lines, which is the "modulo heading level and fenced-block indentation" tolerance the spec allows.

- [ ] **Step 5: Cold-read test**

Open the dispatch file and read it top to bottom as if you were the subagent receiving it. Confirm:
- You know which plan file to review (`[PLAN_FILE_PATH]` placeholder, will be substituted at dispatch time)
- You know the five attack dimensions to check
- You know the evidence standard ("cite file path, line, or concrete code; drop findings that can't cite")
- You know what output to produce (findings + risk assessment, no prescribed taxonomy)
- You are NOT told to "ask the user" or "identify the plan" — those are Step-1 interactive behaviors excluded by design

If any of these fail, fix the file and re-run Step 4.

- [ ] **Step 6: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/plan-build/plan-attack-dispatch.md
git commit -m "feat: add plan-attack-dispatch.md template

Subagent-facing dispatch prompt for the attack lens. Mirrors
plan-reviewer.md structure; body regions copied verbatim from
plan-attack/SKILL.md lines 38-76, 80-88, 92-101.
"
```

Expected: commit succeeds. Run `git log -1 --stat` to confirm exactly one file was added (`skills/plan-build/plan-attack-dispatch.md`).

---

## Task 2: Create `plan-smell-dispatch.md`

**Files:**
- Create: `skills/plan-build/plan-smell-dispatch.md`
- Reference (read-only): `skills/plan-smell/SKILL.md`

**What the file needs to do:** Same as Task 1, but for the smell lens. Subagent-facing Task-tool prompt template that works as a complete prompt after `[PLAN_FILE_PATH]` substitution.

- [ ] **Step 1: Read the source line ranges and capture their exact content**

Run:
```bash
sed -n '58,87p' /home/mike/Documents/CodeProjects/Chester/skills/plan-smell/SKILL.md
sed -n '91,97p' /home/mike/Documents/CodeProjects/Chester/skills/plan-smell/SKILL.md
sed -n '101,107p' /home/mike/Documents/CodeProjects/Chester/skills/plan-smell/SKILL.md
```

Expected: range `58-87` begins "Read the relevant parts of the existing codebase that the plan touches…" and ends "…does it address thread safety?". Range `91-97` begins "Every finding must cite:" and ends "This is the single most important rule." Range `101-107` begins "Write findings directly in the conversation." and ends "…Keep it to 2-3 sentences."

**Critical:** The third bullet of the `91-97` evidence standard is *"Whether the plan explicitly acknowledges the risk (if so, note it but don't penalize)"* — this is load-bearing and must be preserved.

- [ ] **Step 2: Write `skills/plan-build/plan-smell-dispatch.md`**

The file contents:

````markdown
> Evidence standard and output format are sourced verbatim from `plan-smell/SKILL.md` — update both files together.

# Plan Smell Dispatch Template

Use this template when dispatching a forward-looking code smell reviewer (the `plan-smell` lens) as a subagent during `plan-build`'s Plan Hardening phase.

**Purpose:** Forward-looking code smell analysis of implementation plans — identifies structural smells, coupling risks, and change-prevention patterns the plan would introduce.

**Dispatch after:** The plan review loop approves the plan, during Plan Hardening.

```
Task tool (general-purpose):
  description: "Plan smell review"
  prompt: |
    You are a forward-looking code smell reviewer. Analyze this implementation plan
    for smells it would introduce. Every finding must cite real evidence — plan text,
    proposed class/method names, file paths, or existing constructs the plan touches.
    Speculation without evidence is not a finding.

    **Plan to review:** [PLAN_FILE_PATH]

    Read the full plan before looking for problems. Identify the plan's stated scope
    and goals, new classes/methods/interfaces/abstractions it proposes, files and
    subsystems it touches, structural decisions (inheritance, delegation, composition),
    and any abstractions it defers, leaves partial, or marks "for later".

    ## What to Check

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
```

**Reviewer returns:** Findings grouped by root cause (severity scale at the reviewer's discretion), brief risk assessment.
````

**Verbatim-content check (write-time discipline):** Same rules as Task 1, Step 3. The three body regions must match the source line ranges modulo 4-space indent.

- [ ] **Step 3: Verify verbatim match**

Run (heading anchors on both sides, as in Task 1 Step 4):

```bash
DISP=/home/mike/Documents/CodeProjects/Chester/skills/plan-build/plan-smell-dispatch.md
SRC=/home/mike/Documents/CodeProjects/Chester/skills/plan-smell/SKILL.md

# What-to-check: dispatch body between `## What to Check` and `## Evidence Standard`
#                source body between `### Step 2 — Review for smells` and `## Evidence Standard`
diff <(sed -n '/^    ## What to Check$/,/^    ## Evidence Standard$/p' "$DISP" | sed '1d;$d' | sed 's/^    //' | sed '/^$/d') \
     <(sed -n '/^### Step 2 — Review for smells$/,/^## Evidence Standard$/p' "$SRC" | sed '1d;$d' | sed '/^$/d')

# Evidence standard: both sides bounded by `## Evidence Standard` → `## Output`
diff <(sed -n '/^    ## Evidence Standard$/,/^    ## Output$/p' "$DISP" | sed '1d;$d' | sed 's/^    //' | sed '/^$/d') \
     <(sed -n '/^## Evidence Standard$/,/^## Output$/p' "$SRC" | sed '1d;$d' | sed '/^$/d')

# Output: dispatch body from `## Output` to end of fenced block; source body from `## Output` to `### Step 3 — Stop`
diff <(sed -n '/^    ## Output$/,/^```$/p' "$DISP" | sed '1d;$d' | sed 's/^    //' | sed '/^$/d') \
     <(sed -n '/^## Output$/,/^### Step 3 — Stop$/p' "$SRC" | sed '1d;$d' | sed '/^$/d')
```

Expected: each diff produces no output. If divergence appears — especially if the "explicitly acknowledges the risk" bullet is missing from the evidence-standard region — fix before committing.

- [ ] **Step 4: Cold-read test**

Same as Task 1, Step 5. Confirm a subagent receiving this file as its full prompt would know:
- Which plan to review
- The two structural dimensions + practical risks sub-section
- The three-bullet evidence standard including the "explicitly acknowledges the risk" clause
- The open-ended output format (no taxonomy)

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/plan-build/plan-smell-dispatch.md
git commit -m "feat: add plan-smell-dispatch.md template

Subagent-facing dispatch prompt for the smell lens. Body regions
copied verbatim from plan-smell/SKILL.md lines 58-87, 91-97, 101-107.
Preserves the load-bearing 'explicitly acknowledges the risk' bullet
that prevents finding-inflation.
"
```

Expected: commit succeeds. `git log -1 --stat` confirms one file added.

---

## Task 3: Rewrite Plan Hardening section of `skills/plan-build/SKILL.md`

**Files:**
- Modify: `skills/plan-build/SKILL.md` (lines 169-187 — current Plan Hardening section)

**What changes:** Only the first three steps of the Plan Hardening section change. Steps 4-7 (today's) become steps 5-8 (new) with renumbering only — content identical.

- [ ] **Step 1: Capture pre-edit state of the target lines**

Run:
```bash
sed -n '169,187p' /home/mike/Documents/CodeProjects/Chester/skills/plan-build/SKILL.md
```

This is the 19-line block being replaced. Confirm it matches the pre-refactor expected content (the "read the skill files / embed the full skill instructions" mechanism). Save this output to compare against Step 4's diff.

- [ ] **Step 2: Capture pre-edit state of the surrounding structure**

The following sections must remain unchanged by this task:
- **Plan Review Loop** (roughly lines 152-167) — fidelity reviewer loop
- **Save Plan Document** (lines 189+)
- All other sections

Run:
```bash
md5sum /home/mike/Documents/CodeProjects/Chester/skills/plan-build/SKILL.md
wc -l /home/mike/Documents/CodeProjects/Chester/skills/plan-build/SKILL.md
```

Record: current md5sum and line count. After editing, these change — but Task 4 (regression check) verifies the *unchanged* sections are still unchanged.

- [ ] **Step 3: Replace the Plan Hardening section**

Using the Edit tool (not sed — preserve exact whitespace), replace the block from `## Plan Hardening` (line 169) through line 187 (ending with "Wait for the human's decision. Do not auto-trigger any action.") with:

```markdown
## Plan Hardening

**MANDATORY GATE: This step runs automatically after the plan review loop completes. Do not skip.**

After the plan review loop approves the plan:

1. Read `plan-attack-dispatch.md` and `plan-smell-dispatch.md` from this skill directory (parallel reads).
2. In each template, substitute `[PLAN_FILE_PATH]` with the absolute path to the plan document.
3. Launch two Agent subagents in parallel (in a single message), one per substituted template. Use the default general-purpose agent — do NOT set `subagent_type` to `feature-dev:code-reviewer` or any typed agent.
4. Wait for both to complete.
5. Read both reports and synthesize a single combined implementation risk level — this is a judgment call, not a formula. Consider how findings from both reports interact and compound.
6. Present to the human:
   - The combined implementation risk level (Low / Moderate / Significant / High)
   - 3-5 statements explaining why this level was chosen
   - The human's four options: proceed, proceed with directed mitigations, return to design with additional requirements, or stop
7. Write the combined threat report to the `plan/` subdirectory as `{sprint-name}-plan-threat-report-00.md` (see `util-artifact-schema`).
8. Wait for the human's decision. Do not auto-trigger any action.
```

**Note on typography:** The replacement block above uses `3-5` (hyphen) to match the glyph currently present in `SKILL.md` line 184. This is an intentional choice to minimize diff noise — verify the paste-in text retains the hyphen and does not silently autoconvert to an en-dash.

- [ ] **Step 4: Verify the edit is correct and bounded**

Run:
```bash
sed -n '169,188p' /home/mike/Documents/CodeProjects/Chester/skills/plan-build/SKILL.md
```

Expected: the replacement text above. Confirm:
- Line 169 starts `## Plan Hardening`
- The step `Read plan-attack-dispatch.md and plan-smell-dispatch.md` is present
- The step `substitute [PLAN_FILE_PATH]` is present
- Synthesis, human gate, and threat-report steps are present and unchanged
- The next section after the replaced block is `## Save Plan Document`

Run:
```bash
sed -n '155,168p' /home/mike/Documents/CodeProjects/Chester/skills/plan-build/SKILL.md
```

Expected: the Plan Review Loop section is present and unchanged from before (no accidental edits to the fidelity loop).

- [ ] **Step 5: Commit**

```bash
cd /home/mike/Documents/CodeProjects/Chester
git add skills/plan-build/SKILL.md
git commit -m "refactor: plan-build hardening uses dispatch templates

Plan Hardening section now reads plan-attack-dispatch.md and
plan-smell-dispatch.md, substitutes [PLAN_FILE_PATH], and launches
subagents — instead of reading lens SKILL.md files and embedding
full skill instructions. Synthesis, human gate, and threat-report
steps unchanged.
"
```

Expected: commit succeeds. `git log -1 --stat` confirms one file modified.

---

## Task 4: Regression check — confirm unchanged files

**Files:**
- Read-only: `skills/plan-attack/SKILL.md`, `skills/plan-smell/SKILL.md`, `skills/plan-build/plan-reviewer.md`, `skills/setup-start/SKILL.md`
- Read-only (partial): `skills/plan-build/SKILL.md` Plan Review Loop section

**What this task verifies:** The spec's Acceptance Criterion 4 — that five specific files/sections were not touched.

- [ ] **Step 1: Confirm lens files are byte-identical to their pre-refactor state**

Run:
```bash
cd /home/mike/Documents/CodeProjects/Chester
PRE_REFACTOR_SHA=$(cat /tmp/extract-review-launchpad-pre-sha)
echo "Diffing against pre-refactor SHA: $PRE_REFACTOR_SHA"
git diff "$PRE_REFACTOR_SHA" HEAD -- skills/plan-attack/SKILL.md skills/plan-smell/SKILL.md skills/plan-build/plan-reviewer.md skills/setup-start/SKILL.md
```

Expected: `git diff` output is empty. The refactor touched only the three files it was supposed to touch. If diff shows any content, something was accidentally modified.

- [ ] **Step 2: Confirm Plan Review Loop section was not touched**

Run:
```bash
PRE_REFACTOR_SHA=$(cat /tmp/extract-review-launchpad-pre-sha)
git diff "$PRE_REFACTOR_SHA" HEAD -- skills/plan-build/SKILL.md | grep -E "^[-+]" | grep -v "^[-+]{3}"
```

Expected: every `+` and `-` line is within the Plan Hardening section (lines 169-187 pre-refactor, roughly 169-188 post-refactor). No `+`/`-` lines should touch the Plan Review Loop section. Review visually — if any line outside Plan Hardening changed, it's a regression.

- [ ] **Step 3: Cold-read the integration**

Open `skills/plan-build/SKILL.md` and read from `## Plan Review Loop` through `## Save Plan Document` as a continuous flow. Confirm the narrative still makes sense:
- Plan Review Loop iterates on fidelity until approved
- Plan Hardening dispatches both lenses via templates
- The "budget guard" reminder at line 10 still applies (unchanged)
- The integration with `util-artifact-schema` for the threat report path still works (unchanged text)

No commit — this is a verification task.

---

## Task 5: Plugin cache refresh and final verification

**Files:**
- No files edited in this task.

**What this task does:** Ensures the marketplace plugin cache picks up the new skill files so future sessions use the refactored Plan Hardening section. Without this step, subsequent Claude Code sessions still load the pre-refactor version from the cache.

- [ ] **Step 1: Refresh the plugin cache**

The user has a `/refresh-chester` slash command that syncs the local Chester repo into the plugin cache at `/home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/`. Run it from the Claude Code session (not bash):

```
/refresh-chester
```

If the command is not available in the current session, the equivalent manual step is to rsync / copy `/home/mike/Documents/CodeProjects/Chester/skills/` into that cache path.

Expected: the refresh command confirms files synced, or the rsync completes without errors.

- [ ] **Step 2: Confirm the cached plan-build directory now contains the two new files**

Run:
```bash
ls /home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/skills/plan-build/
```

Expected: directory listing includes `plan-attack-dispatch.md`, `plan-smell-dispatch.md`, `plan-reviewer.md`, and `SKILL.md`.

Run:
```bash
grep -l "plan-attack-dispatch.md" /home/mike/.claude/plugins/cache/ordinarymoose/chester/1.0.0/skills/plan-build/SKILL.md
```

Expected: the cached SKILL.md references the new dispatch files (grep match found). If either check fails, `/refresh-chester` did not run — re-invoke it before proceeding.

- [ ] **Step 3: End-to-end dry run (optional but recommended)**

Pick one existing plan artifact from `docs/chester/plans/` (any recent sprint). Mentally walk through the new Plan Hardening section steps as if dispatching hardening on that plan:

1. Read both dispatch files — confirm they exist and parse as prompts
2. Substitute `[PLAN_FILE_PATH]` with the existing plan's absolute path — confirm the resulting prompt is coherent
3. Would a Task-tool call with that prompt as the `prompt:` argument succeed? (Yes, if the prompt is a valid YAML-like block with proper indentation)

No commit. No code execution. Just a confidence check that the refactored mechanism is operable.

- [ ] **Step 4: Final git sanity check**

Run:
```bash
cd /home/mike/Documents/CodeProjects/Chester
PRE_REFACTOR_SHA=$(cat /tmp/extract-review-launchpad-pre-sha)
git log --oneline "$PRE_REFACTOR_SHA"..HEAD
git status
```

Expected:
- Three commits: `feat: add plan-attack-dispatch.md template`, `feat: add plan-smell-dispatch.md template`, `refactor: plan-build hardening uses dispatch templates`
- Working tree clean (no uncommitted changes)

If three commits appear correctly, clean up the temp file:
```bash
rm /tmp/extract-review-launchpad-pre-sha
```

No further commit in this task.

---

## Post-Implementation

The refactor is complete when:
1. Both dispatch templates exist with verbatim-matching bodies
2. Plan Hardening section is rewritten
3. Lens files, plan-reviewer.md, Plan Review Loop, and setup-start are unchanged
4. Three commits on the current branch
5. Plugin cache refreshed

Future sessions invoking `chester:plan-build` will dispatch attack and smell via the new templates. The behavioral change is internal — the human-facing flow (risk synthesis, four options, threat report) is byte-identical.

**What this does not do:**
- Phase B (conditional iteration-2 parallelization) — deferred, gated on measurement data
- Threat-report instrumentation with `rewrite_required` field — deferred with Phase B
- Unification with `design-specify/ground-truth-reviewer.md` — deferred until a third instance emerges

**If the plan-attack/plan-smell SKILL.md ever changes** in the evidence-standard or output sections, the dispatch templates must be updated in the same commit. The sync-discipline reminder at the top of each dispatch template is a manual backstop.
