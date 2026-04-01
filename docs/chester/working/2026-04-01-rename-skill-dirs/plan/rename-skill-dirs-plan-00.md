# Skill Directory Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-write-code (recommended) or chester-write-code in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all 18 Chester skill directories from flat `chester-{name}` to phased `chester-{phase}-{name}` and update every reference.

**Architecture:** Sequential rename-then-replace. Directories renamed first (via `git mv` for history), then content updated in place. Substitutions ordered longest-first to prevent partial matches.

**Tech Stack:** git, sed, bash, grep

---

### Task 1: Rename skill directories

**Files:**
- Rename: all 18 `chester-*` directories at repo root

- [ ] **Step 1: Rename all directories with git mv**

```bash
git mv chester-start              chester-setup-start
git mv chester-start-debug        chester-setup-start-debug
git mv chester-figure-out         chester-design-figure-out
git mv chester-build-spec         chester-design-specify
git mv chester-build-plan         chester-plan-build
git mv chester-attack-plan        chester-plan-attack
git mv chester-smell-code         chester-plan-smell
git mv chester-write-code         chester-execute-write
git mv chester-test-first         chester-execute-test
git mv chester-fix-bugs           chester-execute-debug
git mv chester-prove-work         chester-execute-prove
git mv chester-review-code        chester-execute-review
git mv chester-finish-plan        chester-finish
git mv chester-write-summary      chester-finish-write-session-summary
git mv chester-trace-reasoning    chester-finish-write-reasoning-audit
git mv chester-make-worktree      chester-util-worktree
git mv chester-dispatch-agents    chester-util-dispatch
git mv chester-hooks              chester-util-config
```

- [ ] **Step 2: Verify**

Run: `ls -d chester-*/`

Expected: 18 directories, all new names:
```
chester-design-figure-out/
chester-design-specify/
chester-execute-debug/
chester-execute-prove/
chester-execute-review/
chester-execute-test/
chester-execute-write/
chester-finish/
chester-finish-write-reasoning-audit/
chester-finish-write-session-summary/
chester-plan-attack/
chester-plan-build/
chester-plan-smell/
chester-setup-start/
chester-setup-start-debug/
chester-util-config/
chester-util-dispatch/
chester-util-worktree/
```

No old names present.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: rename skill directories to chester-{phase}-{name} convention"
```

---

### Task 2: Update `name:` frontmatter in each SKILL.md

**Files:**
- Modify: 17 `chester-*/SKILL.md` files (all except `chester-util-config/`, which has no SKILL.md)

- [ ] **Step 1: Update each name: field**

```bash
sed -i 's/^name: chester-start$/name: chester-setup-start/'                          chester-setup-start/SKILL.md
sed -i 's/^name: chester-start-debug$/name: chester-setup-start-debug/'              chester-setup-start-debug/SKILL.md
sed -i 's/^name: chester-figure-out$/name: chester-design-figure-out/'               chester-design-figure-out/SKILL.md
sed -i 's/^name: chester-build-spec$/name: chester-design-specify/'                  chester-design-specify/SKILL.md
sed -i 's/^name: chester-build-plan$/name: chester-plan-build/'                      chester-plan-build/SKILL.md
sed -i 's/^name: chester-attack-plan$/name: chester-plan-attack/'                    chester-plan-attack/SKILL.md
sed -i 's/^name: chester-smell-code$/name: chester-plan-smell/'                      chester-plan-smell/SKILL.md
sed -i 's/^name: chester-write-code$/name: chester-execute-write/'                   chester-execute-write/SKILL.md
sed -i 's/^name: chester-test-first$/name: chester-execute-test/'                    chester-execute-test/SKILL.md
sed -i 's/^name: chester-fix-bugs$/name: chester-execute-debug/'                     chester-execute-debug/SKILL.md
sed -i 's/^name: chester-prove-work$/name: chester-execute-prove/'                   chester-execute-prove/SKILL.md
sed -i 's/^name: chester-review-code$/name: chester-execute-review/'                 chester-execute-review/SKILL.md
sed -i 's/^name: chester-finish-plan$/name: chester-finish/'                         chester-finish/SKILL.md
sed -i 's/^name: chester-write-summary$/name: chester-finish-write-session-summary/' chester-finish-write-session-summary/SKILL.md
sed -i 's/^name: chester-trace-reasoning$/name: chester-finish-write-reasoning-audit/' chester-finish-write-reasoning-audit/SKILL.md
sed -i 's/^name: chester-make-worktree$/name: chester-util-worktree/'                chester-util-worktree/SKILL.md
sed -i 's/^name: chester-dispatch-agents$/name: chester-util-dispatch/'              chester-util-dispatch/SKILL.md
```

- [ ] **Step 2: Verify**

Run: `grep "^name:" chester-*/SKILL.md`

Expected: 17 lines, each `name:` value matches its directory name. No old names.

- [ ] **Step 3: Commit**

```bash
git add chester-*/SKILL.md
git commit -m "chore: update SKILL.md name frontmatter to match new directory names"
```

---

### Task 3: Update cross-references inside skill content files

**Files:**
- Modify: all `.md` and `.sh` files under `chester-*/` (post-rename directories)

**Critical:** Substitution order is longest-first to prevent partial matches. `chester-start` is last and uses `\b` word boundary.

- [ ] **Step 1: Collect target files**

```bash
FILES=$(find chester-*/ -type f \( -name "*.md" -o -name "*.sh" \))
```

- [ ] **Step 2: Run substitutions in order**

```bash
# Longer/more-specific names first
sed -i 's/chester-start-debug/chester-setup-start-debug/g'                      $FILES
sed -i 's/chester-figure-out/chester-design-figure-out/g'                        $FILES
sed -i 's/chester-build-spec/chester-design-specify/g'                           $FILES
sed -i 's/chester-build-plan/chester-plan-build/g'                               $FILES
sed -i 's/chester-attack-plan/chester-plan-attack/g'                             $FILES
sed -i 's/chester-smell-code/chester-plan-smell/g'                               $FILES
sed -i 's/chester-write-code/chester-execute-write/g'                            $FILES
sed -i 's/chester-test-first/chester-execute-test/g'                             $FILES
sed -i 's/chester-fix-bugs/chester-execute-debug/g'                              $FILES
sed -i 's/chester-prove-work/chester-execute-prove/g'                            $FILES
sed -i 's/chester-review-code/chester-execute-review/g'                          $FILES
sed -i 's/chester-finish-plan/chester-finish/g'                                  $FILES
sed -i 's/chester-write-summary/chester-finish-write-session-summary/g'          $FILES
sed -i 's/chester-trace-reasoning/chester-finish-write-reasoning-audit/g'        $FILES
sed -i 's/chester-make-worktree/chester-util-worktree/g'                         $FILES
sed -i 's/chester-dispatch-agents/chester-util-dispatch/g'                       $FILES
sed -i 's/chester-hooks/chester-util-config/g'                                   $FILES
# chester-start last — shortest, uses word boundary to avoid matching chester-start-debug
sed -i 's/chester-start\b/chester-setup-start/g'                                 $FILES
```

- [ ] **Step 3: Verify no old names remain**

Run:
```bash
grep -rn 'chester-start-debug\|chester-figure-out\|chester-build-spec\|chester-build-plan\|chester-attack-plan\|chester-smell-code\|chester-write-code\|chester-test-first\|chester-fix-bugs\|chester-prove-work\|chester-review-code\|chester-finish-plan\b\|chester-write-summary\|chester-trace-reasoning\|chester-make-worktree\|chester-dispatch-agents\|chester-hooks' chester-*/
```

Expected: no matches.

Also verify `chester-start` without new-name prefix:
```bash
grep -rn 'chester-start' chester-*/ | grep -v 'chester-setup-start'
```

Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add chester-*/
git commit -m "chore: update skill cross-references to new names"
```

---

### Task 4: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (repo root)

- [ ] **Step 1: Update repository structure section**

Change line 8 from:
```
- `chester-hooks/` — Claude Code session hooks and config scripts.
```
to:
```
- `chester-util-config/` — Claude Code session hooks and config scripts.
```

- [ ] **Step 2: Update skill file conventions**

Change lines 15-19 from:
```
Every skill lives in `chester-<name>/SKILL.md` with YAML frontmatter:

```yaml
---
name: chester-<name>
```
to:
```
Every skill lives in `chester-{phase}-{name}/SKILL.md` with YAML frontmatter:

```yaml
---
name: chester-{phase}-{name}
```

- [ ] **Step 3: Update key scripts section**

Change lines 59-60 from:
```
- `chester-hooks/chester-config-read.sh` — Resolves project-scoped config. Exports `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`.
- `chester-hooks/session-start` — Hook that injects `chester-start` into system prompt at session startup.
```
to:
```
- `chester-util-config/chester-config-read.sh` — Resolves project-scoped config. Exports `CHESTER_WORK_DIR`, `CHESTER_PLANS_DIR`, `CHESTER_CONFIG_PATH`.
- `chester-util-config/session-start` — Hook that injects `chester-setup-start` into system prompt at session startup.
```

- [ ] **Step 4: Update working on skills section**

Change line 64 from:
```
When editing a SKILL.md, the `description` frontmatter field and the skill's entry in `chester-start/SKILL.md` (the available skills list) must stay in sync.
```
to:
```
When editing a SKILL.md, the `description` frontmatter field and the skill's entry in `chester-setup-start/SKILL.md` (the available skills list) must stay in sync.
```

- [ ] **Step 5: Verify**

Run: `grep "chester-" CLAUDE.md`

Expected: only new names (`chester-setup-start`, `chester-util-config`, `chester-{phase}-{name}`) — no old names.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "chore: update CLAUDE.md for new skill naming convention"
```

---

### Task 5: Update docs/README.md

**Files:**
- Modify: `docs/README.md`

- [ ] **Step 1: Update skill tables**

Replace every old skill name in the Pipeline, Review, Development discipline, and Utilities tables with its new name. Full mapping:

| Old | New |
|-----|-----|
| `chester-start` | `chester-setup-start` |
| `chester-figure-out` | `chester-design-figure-out` |
| `chester-build-spec` | `chester-design-specify` |
| `chester-build-plan` | `chester-plan-build` |
| `chester-write-code` | `chester-execute-write` |
| `chester-finish-plan` | `chester-finish` |
| `chester-attack-plan` | `chester-plan-attack` |
| `chester-smell-code` | `chester-plan-smell` |
| `chester-test-first` | `chester-execute-test` |
| `chester-fix-bugs` | `chester-execute-debug` |
| `chester-prove-work` | `chester-execute-prove` |
| `chester-review-code` | `chester-execute-review` |
| `chester-make-worktree` | `chester-util-worktree` |
| `chester-dispatch-agents` | `chester-util-dispatch` |
| `chester-write-summary` | `chester-finish-write-session-summary` |
| `chester-trace-reasoning` | `chester-finish-write-reasoning-audit` |

- [ ] **Step 2: Update installation hook path**

Change line 81 from:
```
"command": "~/.claude/skills/chester-hooks/session-start"
```
to:
```
"command": "~/.claude/skills/chester-util-config/session-start"
```

- [ ] **Step 3: Verify**

Run: `grep "chester-" docs/README.md | grep -v "chester-setup\|chester-design\|chester-plan\|chester-execute\|chester-finish\|chester-util"`

Expected: no matches (all names are new-style).

- [ ] **Step 4: Commit**

```bash
git add docs/README.md
git commit -m "chore: update docs/README.md for new skill naming convention"
```

---

### Task 6: Update ~/.claude/settings.json hook path

**Files:**
- Modify: `~/.claude/settings.json` (user config, outside repo)

**Why:** The SessionStart hook points to `chester-hooks/session-start`. If not updated, Chester won't load on next session.

- [ ] **Step 1: Update the hook command path**

Change:
```
"command": "/home/mike/.claude/skills/chester-hooks/session-start",
```
to:
```
"command": "/home/mike/.claude/skills/chester-util-config/session-start",
```

- [ ] **Step 2: Verify**

Run: `grep chester ~/.claude/settings.json`

Expected: only `chester-util-config` — no `chester-hooks`.

- [ ] **Step 3: No commit** (file is outside repo)

---

### Task 7: Update test scripts

**Files:**
- Modify: all 9 `.sh` files in `tests/`

- [ ] **Step 1: Run substitutions**

Same longest-first ordering as Task 3, scoped to `tests/*.sh`:

```bash
sed -i 's/chester-start-debug/chester-setup-start-debug/g'                      tests/*.sh
sed -i 's/chester-figure-out/chester-design-figure-out/g'                        tests/*.sh
sed -i 's/chester-build-spec/chester-design-specify/g'                           tests/*.sh
sed -i 's/chester-build-plan/chester-plan-build/g'                               tests/*.sh
sed -i 's/chester-attack-plan/chester-plan-attack/g'                             tests/*.sh
sed -i 's/chester-smell-code/chester-plan-smell/g'                               tests/*.sh
sed -i 's/chester-write-code/chester-execute-write/g'                            tests/*.sh
sed -i 's/chester-test-first/chester-execute-test/g'                             tests/*.sh
sed -i 's/chester-fix-bugs/chester-execute-debug/g'                              tests/*.sh
sed -i 's/chester-prove-work/chester-execute-prove/g'                            tests/*.sh
sed -i 's/chester-review-code/chester-execute-review/g'                          tests/*.sh
sed -i 's/chester-finish-plan/chester-finish/g'                                  tests/*.sh
sed -i 's/chester-write-summary/chester-finish-write-session-summary/g'          tests/*.sh
sed -i 's/chester-trace-reasoning/chester-finish-write-reasoning-audit/g'        tests/*.sh
sed -i 's/chester-make-worktree/chester-util-worktree/g'                         tests/*.sh
sed -i 's/chester-dispatch-agents/chester-util-dispatch/g'                       tests/*.sh
sed -i 's/chester-hooks/chester-util-config/g'                                   tests/*.sh
sed -i 's/chester-start\b/chester-setup-start/g'                                 tests/*.sh
```

- [ ] **Step 2: Run all tests**

```bash
bash tests/test-start-cleanup.sh
bash tests/test-debug-flag.sh
bash tests/test-write-code-guard.sh
bash tests/test-integration.sh
bash tests/test-chester-config.sh
bash tests/test-config-read-new.sh
bash tests/test-budget-guard-skills.sh
bash tests/test-log-usage-script.sh
bash tests/test-statusline-usage.sh
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add tests/
git commit -m "chore: update test scripts for new skill naming convention"
```

---

### Task 8: Final verification sweep

- [ ] **Step 1: Grep for all old names across repo (excluding docs/ history)**

```bash
grep -rn 'chester-start-debug\|chester-figure-out\|chester-build-spec\|chester-build-plan\|chester-attack-plan\|chester-smell-code\|chester-write-code\|chester-test-first\|chester-fix-bugs\|chester-prove-work\|chester-review-code\|chester-finish-plan\b\|chester-write-summary\|chester-trace-reasoning\|chester-make-worktree\|chester-dispatch-agents\|chester-hooks' \
  --include="*.md" --include="*.sh" --include="*.json" \
  --exclude-dir=docs \
  .
```

Expected: no matches.

- [ ] **Step 2: Also check for bare chester-start (not chester-setup-start)**

```bash
grep -rn 'chester-start' --include="*.md" --include="*.sh" --include="*.json" --exclude-dir=docs . | grep -v 'chester-setup-start'
```

Expected: no matches.

- [ ] **Step 3: Fix any stragglers and commit if needed**

```bash
# Only if matches found above
git add -A
git commit -m "chore: final cleanup of old skill name references"
```
