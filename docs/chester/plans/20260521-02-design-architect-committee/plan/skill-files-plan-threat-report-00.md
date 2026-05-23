# Plan Threat Report — `skill-files-plan-00.md`

**Plan reviewed:** `plan/skill-files-plan-00.md`
**Spec context:** `spec/skill-files-spec-02.md`
**Sprint:** `20260521-02-design-architect-committee`
**Date:** 2026-05-23
**Reviews run:** `plan-attack` only (user directed `plan-smell` skip at plan-build invocation)
**Combined implementation risk level:** **Significant**

---

## Smell Skip — Justification

`plan-smell` was skipped per user direction at plan-build kickoff. A retrospective check against the five trigger categories in `references/smell-triggers.md` (DI registrations, new abstractions, async/concurrency primitives, new persistence pathways, new contract surfaces):

- No DI registrations — this is a Markdown + bash sprint.
- No new abstractions in the executable sense — the schema token convention is documentation, not code.
- No async or concurrency — synchronous shell lint.
- No new persistence pathways — file writes only.
- One new contract surface — the token-anchor citation convention between capped files and `schema/`. Borderline trigger.

Conclusion: smell would have been a borderline trigger if run. The skip is defensible for this sprint; the contract-surface concern is partially covered by plan-attack's findings around the regex/heading mismatch (see CRITICAL-1 below).

---

## CRITICAL Findings (block proceeding without fix)

### CRITICAL-1 — Token definition regex / heading-prefix mismatch

**Root cause.** Plan Tasks 3–9 write every schema token as a Markdown heading prefixed with `## ` or `### ` (e.g., Task 3 writes `## **[FK-RULES]**`, Task 5 writes `### **[PROC-ADD-CONCERN]**`). Three downstream consumers anchor their regex to column 0 with no heading prefix:

- `scripts/lint-skill-files.sh` `check_tokens_resolve` (plan line ~236): `grep -q "^\*\*\[$token\]\*\*"`.
- `scripts/lint-skill-files.sh` `check_no_collisions` (plan line ~245): `grep -hoE '^\*\*\[[A-Z][A-Z-]+\]\*\*'`.
- `tests/test-design-architect-committee-schema.sh` (Task 10): `grep -qE "^\*\*\[$2\]\*\*$"`.

Plan-attack verified empirically that these patterns do not match a `## **[FOO]**` line. The "Expected" counts in every schema task's verification step would under-count by exactly the number of definitions.

**Impact.** Lint sub-checks 3 and 4 would silently emit PASS while finding zero tokens to validate (vacuous PASS). Schema structural test would FAIL on every assertion. Build cannot complete.

**Fix options.**
- **(a)** Drop heading prefix from token definitions; write each `**[TOKEN]**` as a plain bold line at column 0 with a separate prose heading above it. Tasks 3–9 rewrite.
- **(b)** Loosen every regex to `^(#+ +)?\*\*\[...\]\*\*$`. Lint script + schema test rewrite, one line per check.
- **(c)** Hybrid — keep headings as-is in `schema/` for navigability, but the regex absorbs the optional `#+` prefix. Same fix as (b).

### CRITICAL-2 — Pre-commit hook symlink resolves to main tree where script does not exist at Task 15 execution

**Root cause.** Task 15 step 2 creates a **relative** symlink:

```bash
ln -s ../../skills/design-architect-committee/scripts/lint-skill-files.sh \
   /home/mike/Documents/CodeProjects/Chester/.git/hooks/pre-commit
```

Symlink target resolves relative to the symlink's own location (`.git/hooks/`), not the cwd at exec time. So target resolves to `/home/mike/Documents/CodeProjects/Chester/skills/design-architect-committee/scripts/lint-skill-files.sh` — the **main tree**. The sprint branch lives in `.worktrees/20260521-02-design-architect-committee/`; main tree does not have the new skill directory until the worktree branch merges.

Compounding: `.git/config` shows `core.hooksPath` is the shared `.git/hooks/` (verified at ground-truth review). This hook fires on every commit in **every worktree, the main branch, and every future sprint** — and will fail-on-broken-symlink until the sprint merges, then will fail-when-files-missing on any future branch where the skill files are intentionally absent or partial.

**Impact.** Task 15 step 4's `git commit --allow-empty` cannot succeed — kernel returns ENOENT on the broken symlink. The plan's claim "lint runs, prints PASS" is false. After merge, the hook becomes a persistent blocker for any future sprint that touches files in transient states.

**Fix options.**
- **(a)** Defer hook wiring until after the worktree merges to main. Add a follow-up sub-sprint or document the manual install step.
- **(b)** Make the symlink absolute pointing into the worktree path. Fragile after worktree teardown; not recommended.
- **(c)** Use a CI workflow file instead of `.git/hooks/`. AC-6.5 explicitly permits CI as the wiring mechanism.
- **(d)** Wrap the hook as a shell script that early-exits with success when the target schema files are missing on the current commit's tree. Allows the hook to be repo-wide without blocking unrelated work.

---

## HIGH Findings (likely block proceeding; designer adjudication recommended)

### HIGH-1 — `skill.md` lowercase filename violates plugin loader's `SKILL.md` discovery convention

**Root cause.** Plan Task 1 creates `skills/design-architect-committee/skill.md` (lowercase). Every other Chester skill uses `SKILL.md` (uppercase) — verified at `skills/design-committee/SKILL.md`, `skills/setup-start/SKILL.md`, etc. Root `CLAUDE.md` warns explicitly: "Filename case matters. Claude Code auto-discovers `CLAUDE.md` (uppercase) — lowercase `claude.md` files are not loaded as context on case-sensitive filesystems." Same case-sensitivity applies to `SKILL.md` discovery by the plugin loader.

The spec also uses lowercase `skill.md` (lines 17, 28). This is spec-level drift inherited by the plan, not a plan-only defect.

**Impact.** The skill registers under the plugin name but the Skill tool may not discover the SKILL.md content. AC-7.3's `skill-index.md` entry would refer to a registered-but-non-functional skill.

**Fix options.**
- **(a)** Rename to `SKILL.md` (uppercase) throughout spec, plan, and execute. Spec needs bump to v03; plan needs revision.
- **(b)** Verify empirically with the plugin loader whether lowercase `skill.md` discovery works (some loaders are case-insensitive on macOS / Windows but not Linux ext4). If it works on the Linux filesystem in use, accept the lowercase form. **(spec line 17 uses lowercase, so this resolution requires confirming the loader actually loads it.)**
- **(c)** Defer to designer — this is genuine spec ambiguity, not a mechanical plan error.

### HIGH-2 — `rules.md` frontmatter declares it a registered skill that the index never registers

**Root cause.** Plan Task 1 step 4 gives `rules.md` SKILL-style frontmatter with `name: design-architect-committee-rules` (per spec line 18, restored after plan-review's recommendation). But `skill-index.md` (Task 16) registers only `design-architect-committee`, not the `-rules` sibling. The plan's own Tech Stack note (line 22) says `rules.md` has no frontmatter — Task 1 then writes frontmatter anyway. Internal plan contradiction.

**Impact.** Either `rules.md` is a registered-but-orphaned second skill (Skill tool finds it; designers can invoke `chester:design-architect-committee-rules` accidentally) or the frontmatter is dead weight. Two-place sync is broken either way.

**Fix options.**
- **(a)** Drop frontmatter from `rules.md` entirely. Treat it as a content sidecar to `skill.md`. Requires spec line 18 correction (spec bump to v03).
- **(b)** Register `design-architect-committee-rules` in `skill-index.md` too. Task 16 gains a second entry; designers see two related entries in the index.
- **(c)** Use a non-SKILL frontmatter shape (`artifact:` instead of `name:`) — plan-review reverted this earlier as a spec-deviation. Acceptable if the spec is corrected to permit it.

---

## MEDIUM Findings (fix during execute-write; do not block)

### MEDIUM-1 — Citation meta-rule grep check is substring-only, not exact-sentence

Plan Task 11 step 5 checks `grep -qF 'cite by token anchor, never restate'`. AC-1.5 requires the *exact* sentence "*Closed-set content lives in `schema/`; capped files cite by token anchor, never restate.*" A future editor rewriting to "always cite by token anchor, never restate" would pass the plan's check but fail AC-1.5's strict reading.

**Fix.** Tighten the grep to anchor on the full sentence pattern.

### MEDIUM-2 — `grep -c 'a\|b\|c'` cannot certify presence of distinct alternatives

Tasks 7 (step 2) and several others use `grep -c 'concern_id\|entry_id\|source\|body\|provenance\|status'` to verify "field names each appear at least once." `grep -c` counts matching lines, not distinct alternatives matched. A file with all six names on a single line returns 1; a file missing two of six but with the rest on separate lines returns 4. Cannot enforce AC-3.1's enumeration requirement.

**Fix.** One assertion per field name, mirroring Task 10's `assert_token` loop for procedures.

### MEDIUM-3 — Lint cite regex matches incidental `[NOTE]` / `[TODO]` / `[FIXME]` prose

Cite regex `\[[A-Z][A-Z-]+\]` matches any bracketed all-caps token in capped-file bodies, including annotations a future editor might write. The "Open observations" section flagged the Markdown-link-anchor variant only.

**Fix.** Either rename annotation conventions in editorial guidance, or anchor the regex with a negative lookahead against `](` and a positive context check for "in token-cite position" (e.g., not following a sentence-ending punctuation).

### MEDIUM-4 — Task 16 description exceeds `skill-index.md` format

`skill-index.md` entries are one-sentence terse descriptions. The plan inserts the full 60-word `skill.md` frontmatter description, two sentences spanning ~5 lines. AC-7.3 says "description matching the frontmatter of `skill.md`" — the spec and index format are in tension.

**Fix.** Either shorten the index entry to one sentence (and document the divergence from `skill.md` frontmatter) or expand `skill-index.md`'s norm to longer entries. Designer pick.

---

## LOW Findings (context for implementer)

- **LOW-1.** Task 15 step 5's empty hook-test commit `test: pre-commit hook fires` persists in main's history when the sprint merges. Violates commit-style guidance in `docs/CLAUDE.md` (scoped commits). Mitigation: undo the empty commit before merge, or verify hook firing via a different mechanism (e.g., direct script invocation).
- **LOW-2.** Task 1 step 6's `git add skills/design-architect-committee/` is a path-prefix `add` rather than explicit-file staging. Root `CLAUDE.md` warns against `git add -A` / `git add .` but does not explicitly ban directory paths; still, the convention elsewhere in the plan (Task 2 step 6, Task 13 step 4) is explicit-file. Outlier.

---

## Verified Claims (correctness reduces uncertainty)

- The verified-anchor skip-list from the ground-truth report holds — locked specs, `chester-trailer-write`, `set -euo pipefail` test convention, `core.hooksPath = .git/hooks`, SKILL.md frontmatter convention all confirmed.
- AC-7.1 invariant (no modification to `skills/design-committee/`) is structurally honored — no task touches that directory.
- `[CE-001]`, `[AX-001]`, `[PR-001]` in the worked template do not match the cite regex `[A-Z][A-Z-]+` (digits filter them out), so template anchors won't trip lint sub-check 3 if ever linted.
- The `awk` frontmatter strip (`state>=2`) correctly emits only post-frontmatter body lines.
- The list-item ban regex `^- |^[0-9]+\. ` works as expected on the body output.
- Task 16's "after `design-specify`" placement in `skill-index.md` is correct in principle.

---

## Combined Implementation Risk Level: **Significant**

Three considerations:

1. **CRITICAL-1 and CRITICAL-2 are mechanically guaranteed-failure defects, not risks.** The plan as written cannot complete. They are also mechanically fixable — pick a fix option, apply it, regenerate the affected tasks. The architecture is sound; the plan text has bugs.
2. **HIGH-1 (SKILL.md case) is spec-level drift, not plan-only.** Resolving it requires either confirming the plugin loader is case-insensitive in this environment or bumping the spec. Designer adjudication needed.
3. **HIGH-2 (rules.md frontmatter) is plan-level contradiction.** The plan says both "no frontmatter" (Tech Stack) and "SKILL frontmatter" (Task 1). Pick one; resolve in plan.

Not **High** (no architectural collapse). Not **Moderate** (CRITICAL findings are mandatory pre-fix). Significant is right.

---

## Designer Options (per plan-build's Plan Hardening user gate)

- **(1) Proceed** — accept the plan as-is and rely on `execute-write`'s context to catch the defects at task time. Not recommended; CRITICAL findings would surface as task failures and re-loop work.
- **(2) Proceed with directed mitigations** — fix CRITICAL-1, CRITICAL-2, HIGH-2 in the plan now (mechanical edits); defer HIGH-1 to a designer ruling at the start of `execute-write`; accept MEDIUM findings as execute-write context.
- **(3) Return to design with additional requirements** — spec bump to v03 resolving SKILL.md case (HIGH-1), `rules.md` frontmatter (HIGH-2), and token-definition format (CRITICAL-1 origin). Then re-plan.
- **(4) Stop** — pause the sprint; address findings later.

---

## Change Log

- **00 (2026-05-23):** Initial threat report. Plan-attack only; plan-smell skipped per user direction with retrospective trigger-check justification. Two CRITICAL, two HIGH, four MEDIUM, two LOW findings. Combined risk: Significant.
- **SUPERSEDED (2026-05-23):** Threat report findings were against plan v00 / spec v02 (token grammar). Plan and spec both abandoned. CRITICAL findings (token-regex/heading mismatch, symlink direction) resolved by the abandonment itself; new plan v01 against spec v03 carries no token grammar to mismatch. HIGH-1 (SKILL.md lowercase) carries forward to v01 as design-level decision (use uppercase SKILL.md per filesystem convention). HIGH-2 (rules.md frontmatter) resolved by spec v03 declaring rules.md a sidecar with no Skill-tool frontmatter. Retained for audit trail.

<!-- created-at: 2026-05-23T09:43:00Z -->
<!-- produced-by plan-build@v0004 -->
