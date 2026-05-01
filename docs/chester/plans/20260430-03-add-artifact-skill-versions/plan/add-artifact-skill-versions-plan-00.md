# Plan: Artifact Skill-Version Provenance

**Sprint:** 20260430-03-add-artifact-skill-versions
**Spec:** docs/chester/working/20260430-03-add-artifact-skill-versions/design/add-artifact-skill-versions-design-00.md
**Execution mode:** subagent

> **For agentic workers:** Use execute-write to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The plan header `Execution mode` is `subagent` (safe-default fallback for execute-write's single-mode contract). Each task block carries its own `Execution mode:` field — when orchestration is driven by a parent agent that honors per-task mode, it overrides the header value. Tasks 1, 2, and 9 carry novel logic (bash idempotency, sort/dedupe, harvest+section integration) and warrant independent spec-fidelity review per dispatch. Tasks 3-8 and 10 are mechanical SKILL.md inserts and grep-based assertions where review independence buys little.

## Goal

Add an HTML-comment provenance trailer convention to every Chester artifact, plus a session-summary ledger consolidating skill versions across the sprint.

## Architecture

A shared bash helper (`bin/chester-trailer-write` wrapping `chester-util-config/chester-trailer-write.sh`) provides two subcommands: `stamp` (idempotent per-artifact append) and `harvest` (sprint-wide deduped chain). The convention is documented authoritatively in `skills/util-artifact-schema/SKILL.md`. Each producer/modifier skill invokes the helper at its artifact-write site after writing the artifact body, and bumps its `version` frontmatter to mark adoption. `finish-write-records` additionally invokes harvest to produce a `## Session Skill Versions` section in the summary.

## Tech Stack

Bash (POSIX-compatible), GNU coreutils (`grep`, `sed`, `awk`, `find`, `date -u`), `bash` testing scripts (existing pattern in `tests/`).

## Acceptance Criteria (from brief)

- **AC-1** — Every artifact produced by a stamping skill ends with `<!-- created-at: ... -->` followed by one or more `<!-- produced-by <skill>@<version> -->` lines (D1).
- **AC-2** — Re-running the same skill at the same version against an unchanged artifact produces no file modification (D3) and no new trailer entry (D2).
- **AC-3** — A skill running at a new version against a previously-stamped artifact appends a new trailer entry without removing the prior version's entry (D2).
- **AC-4** — Sidecar artifacts (threat report, smell report, audit, thinking) carry independent trailer chains (D7).
- **AC-5** — Subagents do not appear in any trailer chain (D4).
- **AC-6** — Manual edits do not modify the trailer chain (D5).
- **AC-7** — `finish-archive-artifacts` produces archived files whose trailer chains are bytewise identical to working-directory originals (D6).
- **AC-8** — The session summary contains a `## Session Skill Versions` section with the full deduped skill-version chain across all sprint artifacts, in first-touch chronological order, using the per-artifact trailer comment format (D8).
- **AC-9** — The convention is documented in `skills/util-artifact-schema/SKILL.md`, and every stamping skill cites it (D9).
- **AC-10** — Each touched skill's `version` field has been bumped.

## Prior Decisions

None.

---

## Task 1: Create chester-trailer-write helper script (stamp subcommand)

**Type:** code-producing
**Execution mode:** subagent
**Implements:** AC-1, AC-2 (idempotent dedupe), AC-3 (version-change append), AC-6 (no-op rule never re-stamps when caller skips invocation)
**Decision budget:** 4
**Must remain green:** the task's own new test.

**Files:**
- Create: `bin/chester-trailer-write`
- Create: `chester-util-config/chester-trailer-write.sh`
- Test: `tests/test-trailer-write.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
# tests/test-trailer-write.sh — verify stamp subcommand behavior
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TRAILER="$SCRIPT_DIR/bin/chester-trailer-write"

# Sandbox
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Case 1: stamp on a fresh file appends created-at + produced-by block
echo "# Hello" > "$TMP/a.md"
"$TRAILER" stamp "design-large-task@v0001" "$TMP/a.md"
grep -q '<!-- created-at: ' "$TMP/a.md" || fail "case1: created-at not added"
grep -q '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md" || fail "case1: produced-by not added"

# Case 2: stamp same skill+version twice → idempotent (no second produced-by line)
"$TRAILER" stamp "design-large-task@v0001" "$TMP/a.md"
COUNT=$(grep -c '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md")
[ "$COUNT" = "1" ] || fail "case2: dedupe failed (count=$COUNT)"

# Case 3: stamp same skill at new version → both entries kept, in order
"$TRAILER" stamp "design-large-task@v0002" "$TMP/a.md"
grep -q '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md" || fail "case3: prior version dropped"
grep -q '<!-- produced-by design-large-task@v0002 -->' "$TMP/a.md" || fail "case3: new version not added"
LINE_V1=$(grep -n '<!-- produced-by design-large-task@v0001 -->' "$TMP/a.md" | head -1 | cut -d: -f1)
LINE_V2=$(grep -n '<!-- produced-by design-large-task@v0002 -->' "$TMP/a.md" | head -1 | cut -d: -f1)
[ "$LINE_V1" -lt "$LINE_V2" ] || fail "case3: order wrong (v1=$LINE_V1 v2=$LINE_V2)"

# Case 4: created-at is preserved (frozen) across stamps
CREATED_AT=$(grep '<!-- created-at: ' "$TMP/a.md")
"$TRAILER" stamp "plan-build@v0003" "$TMP/a.md"
CREATED_AT_AFTER=$(grep '<!-- created-at: ' "$TMP/a.md")
[ "$CREATED_AT" = "$CREATED_AT_AFTER" ] || fail "case4: created-at changed across stamps"

# Case 5: multiple skills, in first-touch order
COUNT=$(grep -c '<!-- produced-by ' "$TMP/a.md")
[ "$COUNT" = "3" ] || fail "case5: expected 3 produced-by lines (got $COUNT)"

# Case 6: missing args → exit non-zero
if "$TRAILER" stamp 2>/dev/null; then fail "case6: stamp without args should fail"; fi
if "$TRAILER" 2>/dev/null; then fail "case6: bare invocation should fail"; fi

# Case 7: missing file → exit non-zero
if "$TRAILER" stamp "x@v0001" "$TMP/missing.md" 2>/dev/null; then
  fail "case7: stamping missing file should fail"
fi

# Case 8: trailer block separated from content by blank line
echo "# B" > "$TMP/b.md"
"$TRAILER" stamp "x@v0001" "$TMP/b.md"
# expect: header, blank line, then trailer block at end
TAIL3=$(tail -3 "$TMP/b.md")
echo "$TAIL3" | head -1 | grep -qE '^$' || fail "case8: missing blank line before trailer"

# Case 9: column-0 trailer-format examples mid-file (e.g., inside fenced code
# blocks) must NOT register as the artifact's own trailer block. The detector
# anchors to the last 20 lines of the file.
cat > "$TMP/c.md" <<'EOF'
# Doc with embedded examples

The trailer format looks like:

```
<!-- created-at: 2026-04-30T00:00:00Z -->
<!-- produced-by some-skill@v0001 -->
```

End of body content. Plus 20+ lines of filler so the example is well past
the last-20-lines window the detector looks at.
EOF
# Pad with 25 filler lines so the example is outside the last-20 window.
for i in $(seq 1 25); do echo "filler line $i" >> "$TMP/c.md"; done
"$TRAILER" stamp "doc@v0001" "$TMP/c.md"
# Should add a fresh trailer block (created-at + produced-by) at end,
# NOT have appended only a produced-by under the mid-file example.
LAST_TWO=$(tail -2 "$TMP/c.md")
echo "$LAST_TWO" | grep -q '<!-- created-at: ' || fail "case9: created-at not added (false-positive detection of mid-file example)"
echo "$LAST_TWO" | grep -q '<!-- produced-by doc@v0001 -->' || fail "case9: produced-by not added at end"
# The example block's literal lines remain intact (not modified)
grep -q '<!-- produced-by some-skill@v0001 -->' "$TMP/c.md" || fail "case9: example line was disturbed"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS error(s) in trailer-write stamp"
  exit 1
fi
echo "PASS: trailer-write stamp behavior correct"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-trailer-write.sh`
Expected: FAIL with "No such file or directory" (script not yet created)

- [ ] **Step 3: Write minimal implementation**

`bin/chester-trailer-write` (mirrors the `chester-config-read` wrapper pattern):

```bash
#!/usr/bin/env bash
# Self-resolving wrapper — added to PATH by the plugin system
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHESTER_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
exec "$CHESTER_ROOT/chester-util-config/chester-trailer-write.sh" "$@"
```

`chester-util-config/chester-trailer-write.sh`:

```bash
#!/usr/bin/env bash
# chester-trailer-write: append-only artifact provenance trailer manager.
# See skills/util-artifact-schema/SKILL.md for the convention this implements.
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage:
  chester-trailer-write stamp <skill>@<version> <artifact-path>
  chester-trailer-write harvest <sprint-dir>
EOF
  exit 2
}

# --- stamp subcommand ----------------------------------------------------------

do_stamp() {
  [ "$#" -eq 2 ] || usage
  local skill_at_ver="$1"
  local path="$2"
  [ -f "$path" ] || { echo "chester-trailer-write: file not found: $path" >&2; exit 1; }

  # Validate skill@version format (loose).
  case "$skill_at_ver" in
    *@v*) : ;;
    *) echo "chester-trailer-write: expected <skill>@<version> (got '$skill_at_ver')" >&2; exit 2 ;;
  esac

  local stamp_line="<!-- produced-by ${skill_at_ver} -->"

  # Idempotency: if the exact stamp line is already present, no-op.
  if grep -Fxq "$stamp_line" "$path"; then
    return 0
  fi

  local now
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local created_line="<!-- created-at: ${now} -->"

  # Detect existing trailer block — anchor to the last 20 lines of the file
  # so that column-0 examples inside mid-file fenced code blocks (e.g., the
  # schema's docs of the trailer format itself) do not falsely register as
  # the artifact's own trailer block.
  if tail -n 20 "$path" | grep -Eq '^<!-- (created-at|produced-by) '; then
    # Append to existing block: insert before EOF, after the last produced-by line.
    # Strategy: append the new produced-by line as a new last line.
    # If file doesn't end with newline, fix that first.
    [ -z "$(tail -c1 "$path")" ] || printf '\n' >> "$path"
    printf '%s\n' "$stamp_line" >> "$path"
  else
    # No existing trailer block: ensure file ends with newline, add blank line,
    # then created-at + produced-by.
    [ -z "$(tail -c1 "$path")" ] || printf '\n' >> "$path"
    printf '\n%s\n%s\n' "$created_line" "$stamp_line" >> "$path"
  fi
}

# --- harvest subcommand (added in Task 2) -------------------------------------

do_harvest() {
  echo "harvest: not yet implemented" >&2
  exit 99
}

# --- dispatcher ---------------------------------------------------------------

cmd="${1:-}"
case "$cmd" in
  stamp)   shift; do_stamp "$@" ;;
  harvest) shift; do_harvest "$@" ;;
  *)       usage ;;
esac
```

Make both executable:

```bash
chmod +x bin/chester-trailer-write chester-util-config/chester-trailer-write.sh
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-trailer-write.sh`
Expected: `PASS: trailer-write stamp behavior correct`

- [ ] **Step 5: Commit**

```bash
git add bin/chester-trailer-write chester-util-config/chester-trailer-write.sh tests/test-trailer-write.sh
git commit -m "feat(util): add chester-trailer-write stamp subcommand for artifact provenance"
```

---

## Task 2: Add harvest subcommand to chester-trailer-write

**Type:** code-producing
**Execution mode:** subagent
**Implements:** AC-8 (harvest produces deduped chain in summary)
**Decision budget:** 3
**Must remain green:** `tests/test-trailer-write.sh` (Task 1's stamp tests must continue to pass after the harvest function replaces the stub).

**Files:**
- Modify: `chester-util-config/chester-trailer-write.sh:55-58` (replace `do_harvest` stub)
- Test: `tests/test-trailer-harvest.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
# tests/test-trailer-harvest.sh — verify harvest subcommand behavior
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TRAILER="$SCRIPT_DIR/bin/chester-trailer-write"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Build a synthetic sprint dir with three artifacts, varying skill+version chains.
mkdir -p "$TMP/sprint/design" "$TMP/sprint/spec" "$TMP/sprint/plan"

cat > "$TMP/sprint/design/foo-design-00.md" <<'EOF'
# Design

Body.

<!-- created-at: 2026-04-30T10:00:00Z -->
<!-- produced-by design-large-task@v0012 -->
<!-- produced-by design-specify@v0005 -->
EOF

cat > "$TMP/sprint/spec/foo-spec-00.md" <<'EOF'
# Spec

Body.

<!-- created-at: 2026-04-30T11:00:00Z -->
<!-- produced-by design-specify@v0005 -->
EOF

cat > "$TMP/sprint/plan/foo-plan-00.md" <<'EOF'
# Plan

Body.

<!-- created-at: 2026-04-30T12:00:00Z -->
<!-- produced-by plan-build@v0007 -->
<!-- produced-by plan-attack@v0003 -->
EOF

OUT="$("$TRAILER" harvest "$TMP/sprint")"

# Case 1: deduped — design-specify appears once
COUNT=$(echo "$OUT" | grep -c '<!-- produced-by design-specify@v0005 -->')
[ "$COUNT" = "1" ] || fail "case1: design-specify@v0005 not deduped (count=$COUNT)"

# Case 2: all unique (skill, version) tuples present
for tuple in 'design-large-task@v0012' 'design-specify@v0005' 'plan-build@v0007' 'plan-attack@v0003'; do
  echo "$OUT" | grep -q "<!-- produced-by $tuple -->" || fail "case2: missing $tuple"
done

# Case 3: ordered by earliest artifact created-at first-touch
LINE_DLT=$(echo "$OUT" | grep -n 'design-large-task@v0012' | head -1 | cut -d: -f1)
LINE_PB=$(echo "$OUT" | grep -n 'plan-build@v0007' | head -1 | cut -d: -f1)
[ "$LINE_DLT" -lt "$LINE_PB" ] || fail "case3: order wrong (DLT=$LINE_DLT PB=$LINE_PB)"

# Case 4: same skill at different versions — both kept
cat > "$TMP/sprint/plan/foo-plan-01.md" <<'EOF'
# Plan revision

Body.

<!-- created-at: 2026-04-30T13:00:00Z -->
<!-- produced-by plan-build@v0008 -->
EOF
OUT="$("$TRAILER" harvest "$TMP/sprint")"
echo "$OUT" | grep -q 'plan-build@v0007' || fail "case4: plan-build@v0007 lost"
echo "$OUT" | grep -q 'plan-build@v0008' || fail "case4: plan-build@v0008 missing"

# Case 5: missing dir → exit non-zero
if "$TRAILER" harvest "$TMP/missing" 2>/dev/null; then
  fail "case5: harvest of missing dir should fail"
fi

# Case 6: deterministic order when two artifacts share an identical created-at
# (1-second-granularity collision). Tiebreak must be by file path, not by
# filesystem traversal order.
mkdir -p "$TMP/sprint2/design" "$TMP/sprint2/spec"
cat > "$TMP/sprint2/spec/zzz-spec-00.md" <<'EOF'
# Spec
<!-- created-at: 2026-04-30T15:00:00Z -->
<!-- produced-by skill-z@v0001 -->
EOF
cat > "$TMP/sprint2/design/aaa-design-00.md" <<'EOF'
# Design
<!-- created-at: 2026-04-30T15:00:00Z -->
<!-- produced-by skill-a@v0001 -->
EOF
OUT1="$("$TRAILER" harvest "$TMP/sprint2")"
OUT2="$("$TRAILER" harvest "$TMP/sprint2")"
[ "$OUT1" = "$OUT2" ] || fail "case6: harvest output not deterministic across runs"
# Path 'design/aaa-...' sorts before 'spec/zzz-...' alphabetically, so skill-a
# must come before skill-z in the output.
LINE_A=$(echo "$OUT1" | grep -n 'skill-a@v0001' | cut -d: -f1)
LINE_Z=$(echo "$OUT1" | grep -n 'skill-z@v0001' | cut -d: -f1)
[ -n "$LINE_A" ] && [ -n "$LINE_Z" ] && [ "$LINE_A" -lt "$LINE_Z" ] \
  || fail "case6: file-path tiebreak failed (a=$LINE_A z=$LINE_Z)"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS error(s) in trailer-write harvest"
  exit 1
fi
echo "PASS: trailer-write harvest behavior correct"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-trailer-harvest.sh`
Expected: FAIL with `harvest: not yet implemented` (Task 1 left a stub)

- [ ] **Step 3: Write minimal implementation**

Replace the `do_harvest` stub in `chester-util-config/chester-trailer-write.sh`:

```bash
do_harvest() {
  [ "$#" -eq 1 ] || usage
  local sprint_dir="$1"
  [ -d "$sprint_dir" ] || { echo "chester-trailer-write: dir not found: $sprint_dir" >&2; exit 1; }

  # Walk all .md files in sprint_dir. For each, extract the artifact's created-at
  # (one per file) and the in-file order of produced-by entries.
  # Emit lines: <created_at>\t<file_path>\t<position>\t<full produced-by line>
  # Sort by (created_at, file_path, position) — file_path is the secondary key
  # so that artifacts sharing a created-at second produce a deterministic order
  # rather than depending on filesystem traversal. Dedupe by produced-by line
  # keeping the first occurrence, then strip the sort prefix.

  local tmp
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' RETURN

  while IFS= read -r -d '' file; do
    local created
    created="$(grep -E '^<!-- created-at: ' "$file" | head -1 | sed -E 's/^<!-- created-at: (.*) -->$/\1/')"
    [ -n "$created" ] || created="9999-99-99T99:99:99Z"  # files without created-at sort last
    awk -v ts="$created" -v fp="$file" '
      /^<!-- produced-by .* -->$/ { printf("%s\t%s\t%06d\t%s\n", ts, fp, NR, $0) }
    ' "$file" >> "$tmp"
  done < <(find "$sprint_dir" -type f -name '*.md' -print0)

  # Sort by (timestamp, file_path, position), dedupe by produced-by line, keep first.
  sort -t $'\t' -k1,1 -k2,2 -k3,3n "$tmp" \
    | awk -F'\t' '!seen[$4]++ { print $4 }'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-trailer-harvest.sh && bash tests/test-trailer-write.sh`
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add chester-util-config/chester-trailer-write.sh tests/test-trailer-harvest.sh
git commit -m "feat(util): add chester-trailer-write harvest subcommand for sprint-wide chain"
```

---

## Task 3: Document provenance convention in util-artifact-schema

**Type:** docs-producing
**Execution mode:** inline
**Implements:** AC-9 (convention documented), AC-10 (version bump example for util-artifact-schema itself)
**Decision budget:** 2
**Must remain green:** `tests/test-artifact-schema.sh` (existing test must still pass).

**Files:**
- Modify: `skills/util-artifact-schema/SKILL.md` (add Provenance Trailers section near the bottom; bump `version: v0001` → `v0002` in frontmatter)
- Test: `tests/test-artifact-schema-provenance.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
# tests/test-artifact-schema-provenance.sh — verify provenance section exists
set -euo pipefail

SCHEMA="skills/util-artifact-schema/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. Section heading present
grep -q '^## Provenance Trailers' "$SCHEMA" || fail "missing '## Provenance Trailers' section"

# 2. Convention names the helper script
grep -q 'chester-trailer-write' "$SCHEMA" || fail "convention does not reference chester-trailer-write"

# 3. Convention names both subcommands
grep -q 'stamp' "$SCHEMA" || fail "convention does not mention stamp subcommand"
grep -q 'harvest' "$SCHEMA" || fail "convention does not mention harvest subcommand"

# 4. Trailer format documented
grep -qF '<!-- created-at:' "$SCHEMA" || fail "trailer format missing created-at example"
grep -qF '<!-- produced-by' "$SCHEMA" || fail "trailer format missing produced-by example"

# 5. Stamping-skill list (D10 — corrected) present
for skill in design-large-task design-small-task design-specify plan-build execute-write finish-write-records; do
  grep -q "$skill" "$SCHEMA" || fail "stamping-skill list missing $skill"
done

# 6. Non-stamping list mirrors D10 completely (plan-attack and plan-smell are
# inline-only; they do not write artifacts, so plan-build owns the threat-report
# and smell-report chains)
for nonstamp in 'plan-attack' 'plan-smell' 'finish-archive-artifacts' 'subagents' 'execute-test' 'execute-prove' 'execute-verify-complete' 'start-bootstrap'; do
  grep -qi "$nonstamp" "$SCHEMA" || fail "non-stamping list missing $nonstamp"
done

# 7. version bumped to v0002
grep -q '^version: v0002' "$SCHEMA" || fail "version not bumped to v0002"

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS error(s) in provenance docs"
  exit 1
fi
echo "PASS: provenance convention documented"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-artifact-schema-provenance.sh`
Expected: FAIL with `missing '## Provenance Trailers' section` (and version not bumped, etc.)

- [ ] **Step 3: Write minimal implementation**

Edit `skills/util-artifact-schema/SKILL.md`:

(a) Bump frontmatter:
```yaml
version: v0002
```

(b) Append the following section at the end of the file (after `## Inheriting Sprint Context`):

```markdown
## Provenance Trailers

Every artifact produced by a stamping skill carries an HTML-comment provenance
block at the bottom of the file, separated from content by a blank line. The
block records when the artifact was created and which skill (by name and
version) produced or modified it.

### Trailer format

```
<!-- created-at: 2026-04-30T14:23:00Z -->
<!-- produced-by plan-build@v0007 -->
<!-- produced-by plan-attack@v0003 -->
```

- One `<!-- created-at: <ISO 8601 UTC> -->` line per artifact, set on first
  write and frozen thereafter.
- One `<!-- produced-by <skill>@<version> -->` line per participating skill,
  in first-touch chronological order. Each `(skill, version)` tuple appears
  at most once.

### Helper script

Skills do not write the trailer by hand. The shared bash helper handles all
trailer logic — appending, deduplication, idempotency:

```bash
chester-trailer-write stamp <skill>@<version> <artifact-path>
chester-trailer-write harvest <sprint-dir>
```

- **`stamp`** — invoked by a producer/modifier skill immediately after writing
  an artifact. If the artifact has no trailer block, creates one with a
  fresh `created-at` and the skill's `produced-by` line. If the artifact
  already has a trailer block, appends the skill's `produced-by` line. If the
  exact `<skill>@<version>` line is already present, the call is a no-op.
- **`harvest`** — invoked by `finish-write-records` against the sprint
  directory. Walks all `.md` files, extracts every `produced-by` line,
  deduplicates by `(skill, version)` tuple, and emits the consolidated
  chain in first-touch chronological order (using each artifact's
  `created-at` as the temporal anchor and in-file position as the tiebreaker).

### Stamping skills

The following skills invoke `stamp` at every artifact-write site they
own:

- `design-large-task` (design briefs, thinking files)
- `design-small-task` (design briefs)
- `design-specify` (specs, ground-truth reports, skeleton manifests)
- `plan-build` (plans, threat reports — `plan-build` writes the combined
  threat report during the Plan Hardening phase, so it owns that chain)
- `execute-write` (plan amendments)
- `finish-write-records` (summaries, audits)

### Non-stamping skills

The following skills do **not** stamp:

- `plan-attack`, `plan-smell` — these skills produce inline conversation
  output only; they do not write files. Any threat or smell report file
  is written by `plan-build` during hardening, so `plan-build` owns the
  trailer chain on those files.
- `execute-test`, `execute-prove`, `execute-verify-complete` — read-only
  with respect to artifacts.
- `finish-archive-artifacts` — bytewise copy from working to plans
  directory. Copy is not a modification; trailer chains travel intact.
- `start-bootstrap` — scaffolds directories; produces no artifact content.
- All named subagents under `agents/`. The dispatching parent skill owns
  the trailer.

### Sidecar artifacts

Sidecars (threat reports, smell reports, audits, thinking files) carry
**independent** trailer chains. A skill that produces both a primary
artifact and a sidecar in the same run calls `stamp` once on each, with
the artifact paths kept distinct.

### Manual edits

User edits to an artifact never trigger re-stamping. The chain is
provenance, not authority — it represents the last machine touch, not
the artifact's current state.

### Session-wide ledger

The session summary written by `finish-write-records` includes a
`## Session Skill Versions` section populated by the harvest subcommand.
The section is the single consolidated record of which skill versions
participated in the sprint.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-artifact-schema-provenance.sh && bash tests/test-artifact-schema.sh`
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add skills/util-artifact-schema/SKILL.md tests/test-artifact-schema-provenance.sh
git commit -m "docs(util-artifact-schema): document provenance trailer convention (v0001 → v0002)"
```

---

## Task 4: Wire stamping into design-large-task

**Type:** docs-producing
**Execution mode:** inline
**Implements:** AC-1, AC-9 (skill cites convention), AC-10 (version bump)
**Decision budget:** 2
**Must remain green:** existing tests touching `skills/design-large-task/SKILL.md` (run the full suite at the end).

**Files:**
- Modify: `skills/design-large-task/SKILL.md` (add stamp invocations at every artifact-write site; cite util-artifact-schema; bump `version`)
- Test: `tests/test-stamping-design-large-task.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
# tests/test-stamping-design-large-task.sh
set -euo pipefail

SKILL="skills/design-large-task/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. References the helper script at least once
grep -q 'chester-trailer-write stamp' "$SKILL" || fail "no chester-trailer-write stamp invocation"

# 2. Cites the schema convention
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers section"

# 3. Version frontmatter bumped to expected next value.
# Pre-sprint baseline: design-large-task is at v0008 → bump to v0009.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0009" ] || fail "version not bumped to v0009 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-large-task wired"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-stamping-design-large-task.sh`
Expected: FAIL with `no chester-trailer-write stamp invocation`

- [ ] **Step 3: Write minimal implementation**

Edit `skills/design-large-task/SKILL.md`:

(a) Bump version frontmatter (e.g., from current `vNNNN` to `vNNNN+1`).

(b) At every artifact-write site (design brief, thinking file, process evidence file), immediately after the artifact is written, add a Stamp Provenance step. The exact location depends on the skill's existing structure — search for write commands and append the stamp call after each. Pattern to insert:

```markdown
**Stamp provenance.** After writing the artifact, stamp the provenance trailer:

```bash
chester-trailer-write stamp design-large-task@<this-skill-version> "<artifact-path>"
```

This appends a `produced-by` line per the convention in `util-artifact-schema` (see `## Provenance Trailers`). Use the `<this-skill-version>` value from this skill's `version` frontmatter field. Sidecar artifacts (thinking files, process evidence) get their own independent stamp call — do not bundle.
```

(c) If the skill has a single closing-stage artifact-write block, the stamp can live there. If it has multiple write sites (brief + thinking + process), each gets its own stamp call.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-stamping-design-large-task.sh && bash tests/test-large-task-closure.sh`
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-large-task/SKILL.md tests/test-stamping-design-large-task.sh
git commit -m "feat(design-large-task): stamp provenance trailers on artifact writes"
```

---

## Task 5: Wire stamping into design-small-task

**Type:** docs-producing
**Execution mode:** inline
**Implements:** AC-1, AC-9, AC-10
**Decision budget:** 2
**Must remain green:** `tests/test-small-task-artifact-handoff.sh`.

**Files:**
- Modify: `skills/design-small-task/SKILL.md`
- Test: `tests/test-stamping-design-small-task.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/design-small-task/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

grep -q 'chester-trailer-write stamp' "$SKILL" || fail "no stamp invocation"
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# Pre-sprint baseline: design-small-task is at v0001 → bump to v0002.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0002" ] || fail "version not bumped to v0002 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-small-task wired"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-stamping-design-small-task.sh`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Edit `skills/design-small-task/SKILL.md` following the same pattern as Task 4. Bump version, add Stamp Provenance step at the artifact-write site (the design brief), with skill name `design-small-task` in the stamp command.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-stamping-design-small-task.sh && bash tests/test-small-task-artifact-handoff.sh`
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-small-task/SKILL.md tests/test-stamping-design-small-task.sh
git commit -m "feat(design-small-task): stamp provenance trailers on brief writes"
```

---

## Task 6: Wire stamping into design-specify (multiple write sites)

**Type:** docs-producing
**Execution mode:** inline
**Implements:** AC-1, AC-4 (sidecar isolation: spec + ground-truth-report + skeleton are independent), AC-9, AC-10
**Decision budget:** 3 (multiple distinct artifact-write sites; each gets independent stamp call)
**Must remain green:** existing design-specify tests.

**Files:**
- Modify: `skills/design-specify/SKILL.md`
- Test: `tests/test-stamping-design-specify.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/design-specify/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Must invoke stamp for each of: spec, ground-truth report, skeleton manifest
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 3 ] || fail "expected ≥3 stamp invocations (spec, ground-truth, skeleton); got $COUNT"

grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# Pre-sprint baseline: design-specify is at v0001 → bump to v0002.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0002" ] || fail "version not bumped to v0002 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: design-specify wired"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-stamping-design-specify.sh`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Edit `skills/design-specify/SKILL.md`. Identify the three artifact-write sites:
1. Spec (`spec/{sprint-name}-spec-NN.md`)
2. Ground-truth report (`spec/{sprint-name}-spec-ground-truth-report-NN.md`)
3. Skeleton manifest (`spec/{sprint-name}-spec-skeleton-NN.md`)

After each write, add a Stamp Provenance step with skill name `design-specify`. Note D7 in the inserted text: each artifact gets its own independent chain — do not bundle. Bump version frontmatter.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-stamping-design-specify.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-specify/SKILL.md tests/test-stamping-design-specify.sh
git commit -m "feat(design-specify): stamp provenance on spec ground-truth-report skeleton writes"
```

---

## Task 7: Wire stamping into plan-build (plan + threat report)

**Type:** docs-producing
**Execution mode:** inline
**Implements:** AC-1, AC-4 (threat report is sidecar with independent chain), AC-9, AC-10
**Decision budget:** 2
**Must remain green:** `tests/test-plan-build-update.sh`, `tests/test-plan-build-heuristic.sh`.

**Files:**
- Modify: `skills/plan-build/SKILL.md`
- Test: `tests/test-stamping-plan-build.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/plan-build/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# At least 2 stamp invocations: plan + threat report
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 2 ] || fail "expected ≥2 stamp invocations (plan, threat report); got $COUNT"

grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# Pre-sprint baseline: plan-build is at v0002 → bump to v0003.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0003" ] || fail "version not bumped to v0003 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: plan-build wired"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-stamping-plan-build.sh`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Edit `skills/plan-build/SKILL.md`. Add Stamp Provenance steps at:
1. Save Plan Document section — after writing the plan to `plan/`.
2. Plan Hardening — after writing the combined threat report to `plan/`. plan-build owns this chain because plan-attack and plan-smell are inline-only skills — plan-build is the entity that actually writes the file.

Use skill name `plan-build` in both stamp calls. Threat report is a sidecar (D7), independent chain. Bump version.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-stamping-plan-build.sh && bash tests/test-plan-build-update.sh && bash tests/test-plan-build-heuristic.sh`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add skills/plan-build/SKILL.md tests/test-stamping-plan-build.sh
git commit -m "feat(plan-build): stamp provenance on plan and threat-report writes"
```

---

## Task 8: Wire stamping into execute-write (plan amendment site)

**Type:** docs-producing
**Execution mode:** inline
**Implements:** AC-1, AC-9, AC-10
**Decision budget:** 2
**Must remain green:** `tests/test-execute-write-update.sh`, `tests/test-execute-verify-complete-update.sh`.

**Files:**
- Modify: `skills/execute-write/SKILL.md`
- Test: `tests/test-stamping-execute-write.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/execute-write/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

grep -q 'chester-trailer-write stamp' "$SKILL" || fail "no stamp invocation"
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"
# Pre-sprint baseline: execute-write is at v0002 → bump to v0003.
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0003" ] || fail "version not bumped to v0003 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: execute-write wired"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-stamping-execute-write.sh`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Edit `skills/execute-write/SKILL.md`. Add a Stamp Provenance step after every write that modifies the plan file (checkbox toggles, deferred-item annotations, etc.). The dedupe rule (D2) means execute-write only stamps once per plan — subsequent toggles are idempotent. Add stamp at the deferred-items-write site as well. Bump version.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-stamping-execute-write.sh && bash tests/test-execute-write-update.sh && bash tests/test-execute-verify-complete-update.sh`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add skills/execute-write/SKILL.md tests/test-stamping-execute-write.sh
git commit -m "feat(execute-write): stamp provenance on plan amendments"
```

---

## Task 9: Wire stamping + harvest into finish-write-records

**Type:** docs-producing
**Execution mode:** subagent
**Implements:** AC-1 (own stamp), AC-8 (harvest into Session Skill Versions section), AC-9, AC-10
**Decision budget:** 4 (multiple write sites: summary, audit, evaluation brief in refactor mode, optional cache analysis; plus harvest integration into summary template)
**Must remain green:** `tests/test-finish-write-records-update.sh`.

**Files:**
- Modify: `skills/finish-write-records/SKILL.md`
- Modify: `skills/finish-write-records/references/record-formats.md` (add Session Skill Versions section spec to summary template)
- Test: `tests/test-finish-write-records-provenance.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

```bash
#!/usr/bin/env bash
set -euo pipefail
SKILL="skills/finish-write-records/SKILL.md"
FORMATS="skills/finish-write-records/references/record-formats.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. Skill invokes harvest before writing summary
grep -q 'chester-trailer-write harvest' "$SKILL" || fail "no harvest invocation"

# 1b. Both feature-mode and refactor-mode harvest paths are mentioned (D8 applies
# to both modes; refactor mode harvests the slug directory under docs/refactor/)
grep -q 'CHESTER_WORKING_DIR' "$SKILL" || fail "feature-mode harvest path not specified"
grep -q 'docs/refactor' "$SKILL" || fail "refactor-mode harvest path not specified"

# 2. Skill invokes stamp on summary, audit, and (refactor) brief
COUNT=$(grep -c 'chester-trailer-write stamp' "$SKILL" || true)
[ "$COUNT" -ge 3 ] || fail "expected ≥3 stamp invocations (summary, audit, brief); got $COUNT"

# 3. Skill cites the convention
grep -q 'util-artifact-schema' "$SKILL" || fail "does not cite util-artifact-schema"
grep -qi 'Provenance Trailers' "$SKILL" || fail "does not reference Provenance Trailers"

# 4. Summary template includes Session Skill Versions section
grep -q 'Session Skill Versions' "$FORMATS" || fail "record-formats.md missing Session Skill Versions section"

# 5. Skill mentions Session Skill Versions in summary-write step
grep -q 'Session Skill Versions' "$SKILL" || fail "skill text missing Session Skill Versions"

# 6. Version bumped — pre-sprint baseline v0001 → bump to v0002
CUR_VER="$(awk '/^version:/ {print $2; exit}' "$SKILL")"
[ "$CUR_VER" = "v0002" ] || fail "version not bumped to v0002 (got $CUR_VER)"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: finish-write-records wired with harvest"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-finish-write-records-provenance.sh`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Edit `skills/finish-write-records/SKILL.md`:

(a) Bump version frontmatter.

(b) In Step 3 (Write Artifacts), add a sub-step before writing the session summary: "Harvest the sprint's skill-version chain":

```markdown
**Harvest the skill-version chain.** Before writing the summary, run:

```bash
chester-trailer-write harvest "$CHESTER_WORKING_DIR/{sprint-subdir}"
```

Capture the output. It is the deduped, ordered chain of `<!-- produced-by ... -->` lines for the entire sprint. Embed this output verbatim under a `## Session Skill Versions` section in the summary (see `references/record-formats.md`). For refactor mode, harvest the slug directory instead: `docs/refactor/{slug}`. See `util-artifact-schema` `## Provenance Trailers` for the convention.
```

(c) After every artifact-write block (summary, audit, evaluation brief in refactor mode, optional cache analysis), add a stamp call:

```bash
chester-trailer-write stamp finish-write-records@<this-version> "<artifact-path>"
```

(d) Edit `skills/finish-write-records/references/record-formats.md` to add the `## Session Skill Versions` section to the session-summary template:

```markdown
## Session Skill Versions

*(populated by `chester-trailer-write harvest`; see `util-artifact-schema` `## Provenance Trailers`)*

<!-- produced-by design-large-task@vNNNN -->
<!-- produced-by design-specify@vNNNN -->
<!-- produced-by plan-build@vNNNN -->
<!-- ... -->
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-finish-write-records-provenance.sh && bash tests/test-finish-write-records-update.sh`
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add skills/finish-write-records/SKILL.md skills/finish-write-records/references/record-formats.md tests/test-finish-write-records-provenance.sh
git commit -m "feat(finish-write-records): harvest sprint chain into Session Skill Versions section"
```

---

## Task 10: Regression tests for archive bytewise + subagents non-stamping

**Type:** code-producing
**Execution mode:** inline
**Implements:** AC-5 (subagents do not stamp), AC-7 (archive preserves trailer chains bytewise)
**Decision budget:** 1
**Must remain green:** these new tests pass against the current codebase (no further changes required for the assertions to hold — they encode existing behavior as regression guards).

**Files:**
- Create: `tests/test-archive-bytewise.sh`
- Create: `tests/test-subagents-no-stamping.sh`

**Steps (TDD):**

- [ ] **Step 1: Write the failing test**

`tests/test-archive-bytewise.sh`:

```bash
#!/usr/bin/env bash
# Verify finish-archive-artifacts uses cp -r (bytewise) so trailer chains are preserved
set -euo pipefail
SKILL="skills/finish-archive-artifacts/SKILL.md"
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# 1. Skill uses cp -r (bytewise copy)
grep -q 'cp -r' "$SKILL" || fail "finish-archive-artifacts does not use cp -r"

# 2. Skill must NOT invoke chester-trailer-write (D6: archive does not re-stamp)
if grep -q 'chester-trailer-write' "$SKILL"; then
  fail "finish-archive-artifacts must not invoke chester-trailer-write (D6)"
fi

# 3. Skill notes that copy is not a modification (cite the convention or D6 in prose)
grep -qi 'bytewise\|not a modification\|trailer.*intact\|preserves.*chain' "$SKILL" \
  || fail "finish-archive-artifacts does not document bytewise/no-stamp invariant"

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: archive preserves trailer chains bytewise"
```

`tests/test-subagents-no-stamping.sh`:

```bash
#!/usr/bin/env bash
# Verify no subagent definition invokes chester-trailer-write
set -euo pipefail
ERRORS=0
fail() { echo "FAIL: $1" >&2; ERRORS=$((ERRORS + 1)); }

# Walk all subagent definitions under agents/, fail if any invoke the helper
if grep -rl 'chester-trailer-write' agents/ 2>/dev/null; then
  echo "FAIL: subagent(s) above invoke chester-trailer-write — D4 violated" >&2
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then echo "FAIL: $ERRORS"; exit 1; fi
echo "PASS: no subagent invokes chester-trailer-write"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-archive-bytewise.sh`
Expected: FAIL on assertion 3 — `finish-archive-artifacts/SKILL.md` does not currently document the bytewise/no-stamp invariant. Assertions 1 and 2 already pass against the current file (`cp -r` is present, `chester-trailer-write` is absent).

Run: `bash tests/test-subagents-no-stamping.sh`
Expected: PASS (no subagents invoke the helper today; this test is a forward-regression guard).

- [ ] **Step 3: Write minimal implementation**

If `tests/test-archive-bytewise.sh` fails on assertion 3 (the prose check), edit `skills/finish-archive-artifacts/SKILL.md` to add one sentence in the Step 2 (Copy) section:

```markdown
The copy is bytewise — every artifact's provenance trailer (see `util-artifact-schema` `## Provenance Trailers`) is preserved intact in the archive. `finish-archive-artifacts` does not stamp; copy is not a modification.
```

Bump `version` frontmatter accordingly.

If `tests/test-subagents-no-stamping.sh` already passes (it should, since no subagents invoke the helper), no implementation changes are needed for that assertion — it is a forward-guarding regression test.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test-archive-bytewise.sh && bash tests/test-subagents-no-stamping.sh`
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add tests/test-archive-bytewise.sh tests/test-subagents-no-stamping.sh skills/finish-archive-artifacts/SKILL.md
git commit -m "test: regression guards for archive bytewise (AC-7) and subagent non-stamping (AC-5)"
```

---

## Final verification

After all tasks complete, run the full test suite to confirm no regressions:

```bash
for t in tests/test-*.sh; do
  echo "Running: $t"
  bash "$t" || echo "FAILED: $t"
done
```

All tests must pass before declaring the plan complete.
