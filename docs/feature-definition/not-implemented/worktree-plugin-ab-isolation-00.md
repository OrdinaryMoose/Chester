# Feature Definition Brief: Worktree-Per-Plugin A/B Isolation for Workflow Framework Comparison

**Status:** Draft
**Date:** 2026-04-28

---

## Problem Statement

Chester is a design-workflow framework whose value claims (better convergence on problem statements, better calibration to designer, less drift into solve-mode during understand, etc.) currently rest on anecdote and self-report. Recent evidence — ncon-02's understanding-state.json showing the agent literally writing "this is a Solve thing" in nine consecutive gap fields — surfaced concrete failure modes that motivated the pluggable Understanding-MCP architecture and the problem-focused MCP. But the question "is Chester actually better than the alternatives?" has no controlled answer.

There is no clean mechanism to run Chester and a competing workflow framework (Superpowers, the user's preferred comparison; or stock Claude Code with no framework; or any other plugin) against the **same task starting from the same git commit** and compare outputs. Without that, design changes ship on speculation. Iteration cycles on the framework are blind: a change feels better in isolation, but whether it actually outperforms an alternative on equivalent work is untested.

The mechanism needed: parallel isolated environments where (a) the source code starting point is identical, (b) the plugin loadout differs cleanly per environment, (c) the same task can be posed to both, and (d) the resulting artifacts can be diffed.

### Prior attempts

- **Pluggable Understanding-MCP architecture (just shipped, commit `f92c291`)** — lets you A/B test *within* Chester (classic vs problemfocused). Solves the within-Chester comparison case. Does not solve cross-plugin comparison.
- **None for cross-plugin comparison.** The Chester repo has no infrastructure or convention for setting up parallel worktrees with different plugin loadouts.

---

## Current State Inventory

### Claude Code plugin loading

- User-level plugin install lives at `~/.claude/plugins/`.
- The marketplace cache is at `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.
- Plugin manifests are tracked in `~/.claude/plugins/installed_plugins.json`.
- User-level settings live at `~/.claude/settings.json`.
- Project-level settings live at `<project>/.claude/settings.json` and `<project>/.claude/settings.local.json`.

### Known mechanisms for plugin scoping

- **`CLAUDE_CONFIG_DIR` env var** — redirects Claude Code's config root. Setting it to a non-default path makes Claude look for `plugins/`, `settings.json`, history, memory, etc. under that root. Confirmed working for development workflows; full plugin isolation behavior worth verifying for this use case.
- **`settings.local.json`** — supports project-level setting overrides. Whether a plugin-disable schema exists in this file is unverified.
- **`--plugin-dir <path>` flag** — points at a local plugin directory. Used during plugin development. Semantics when other user-level plugins are also installed are unverified.

### Chester-specific artifact paths

- `docs/chester/working/<sprint>/` — gitignored scratch space; per-sprint subdirectories contain design briefs, specs, plans, summaries, thinking files, MCP state files. Naturally isolated per worktree because gitignored content lives in the worktree's filesystem, not in shared git state.
- `docs/chester/plans/<sprint>/` — tracked archived versions, copied at sprint close.

### Git worktree mechanics

- `git worktree add <path> <branch>` creates a parallel checkout sharing the same `.git` directory.
- Each worktree has its own working tree but shares git history / refs.
- Two worktrees from the same commit have byte-identical starting source code.
- Worktree-level branches are independent — one worktree's commits don't appear in the other until merged.

### Existing Chester worktree usage

- `chester:util-worktree` skill creates worktrees for Chester sprints. Currently scoped to single-plugin sprints; not designed for A/B parallel runs.

---

## Governing Constraints

- **Cannot require restructuring of either compared plugin.** Both Chester and Superpowers (and any other comparison plugin) must run unmodified. The isolation is at the Claude Code config layer, not inside the plugins.
- **Must use existing CLI workflow.** Designer launches `claude` in each worktree; no custom wrappers required for daily use, though wrappers may help.
- **Must support concurrent and sequential runs.** Some comparisons are run side-by-side (faster); others are run one-at-a-time (avoids rate-limit interference).
- **Memory / history isolation is a feature, not a bug.** Each comparison starts the agent fresh — no contamination from what the other framework remembered or learned.
- **Single Anthropic account.** Concurrent runs share rate limits. The comparison framework must tolerate throttling and document its presence.
- **Reversibility.** Setup must not modify the user's primary `~/.claude` install permanently. Comparison environments are additive, not destructive.
- **Artifact comparability.** Both plugins must produce roughly comparable artifacts (design briefs, plans, conversation transcripts) on the same task, even if the format differs. The comparison protocol captures both.

---

## Design Direction

### Two-Worktree Pairing

Each comparison creates two git worktrees from the same starting commit:

```
git worktree add ../experiment-A-chester main
git worktree add ../experiment-B-superpowers main
```

Naming convention: `experiment-<id>-<plugin>` where `<id>` is a comparison identifier (date, sprint name, ticket reference) and `<plugin>` is the plugin under test. The git mechanic is unchanged from existing worktree usage.

### Per-Worktree `CLAUDE_CONFIG_DIR`

Each worktree is associated with its own Claude Code config directory:

```
~/.claude-experiment-A-chester/       # Chester only
~/.claude-experiment-B-superpowers/   # Superpowers only
```

Setup procedure (one-time per experiment):

1. Copy `~/.claude` to each experiment's config dir:
   ```
   cp -r ~/.claude ~/.claude-experiment-A-chester
   cp -r ~/.claude ~/.claude-experiment-B-superpowers
   ```
2. In `~/.claude-experiment-A-chester/`, uninstall or disable Superpowers; ensure Chester is present.
3. In `~/.claude-experiment-B-superpowers/`, uninstall or disable Chester; ensure Superpowers is present.
4. (Optional) Trim memory directories in each config to start fresh: clear `memory/MEMORY.md` index and entries, or leave intact if shared baseline memory is desired.

### Launch Wrappers

Optional convenience scripts at the experiment root:

```
# bin/launch-A.sh
#!/bin/bash
cd "$(dirname "$0")/../experiment-A-chester"
CLAUDE_CONFIG_DIR=$HOME/.claude-experiment-A-chester claude "$@"

# bin/launch-B.sh
#!/bin/bash
cd "$(dirname "$0")/../experiment-B-superpowers"
CLAUDE_CONFIG_DIR=$HOME/.claude-experiment-B-superpowers claude "$@"
```

These keep the env-var dance out of the way and let the designer focus on the comparison itself.

### Comparison Protocol

For each A/B run:

1. **Define the task** in a single text artifact (a one-paragraph problem statement) saved outside both worktrees so neither plugin sees the other's interpretation. Path suggestion: `~/.claude-experiments/<comparison-id>/task.md`.
2. **Open the task in both sessions** — paste the same problem statement to both Claude instances. Begin work.
3. **Run to a comparable end-state.** Most often: through to a written design brief or plan. Each plugin's natural artifact (Chester's design brief, Superpowers' equivalent) is the comparison object.
4. **Capture artifacts**:
   - Each plugin's authored documents (design briefs, plans, summaries)
   - Each session's conversation transcript (Claude Code provides session log access)
   - Token usage, time elapsed, designer-turn count
5. **Diff the outputs** — manual side-by-side read, or scripted diff for structured artifacts. Capture observations in a `~/.claude-experiments/<comparison-id>/comparison-notes.md`.

### Artifact Naming Convention

Within each worktree, artifacts follow each plugin's own conventions (Chester writes to `docs/chester/working/<sprint>/`, Superpowers writes wherever it writes). The comparison artifact lives outside both worktrees:

```
~/.claude-experiments/
└── <comparison-id>/
    ├── task.md                          # the problem statement given to both
    ├── comparison-notes.md              # designer's diff observations
    ├── A-chester-artifacts/             # copy of relevant Chester output
    └── B-superpowers-artifacts/         # copy of relevant Superpowers output
```

### Pre-Flight Verification

Before running a real comparison, verify the setup with a smoke test: pose a trivial task ("describe the current directory structure") to both sessions and confirm:

- Each session loads only the intended plugin (check `/help` or skill list)
- Memory / history are independent
- Artifact paths land where expected
- No cross-contamination between configs

---

## Open Concerns

- **Does `CLAUDE_CONFIG_DIR` fully isolate plugin install?** Need to confirm that plugins, MCP servers, hooks, and marketplace cache all redirect under the chosen root. If any component still reads from `~/.claude/...` regardless of the env var, isolation breaks. Worth dispatching the `claude-code-guide` agent to verify.
- **Does `settings.local.json` support a plugin-disable schema?** If yes, this could be a lighter-weight alternative to full config-dir forking — both worktrees share user-level plugin install, each disables what it doesn't want via project-local settings. Schema unconfirmed.
- **`--plugin-dir` semantics with already-installed plugins.** If `claude --plugin-dir /path/to/just-chester` still loads other user-level plugins, the flag is for development convenience, not isolation. Worth verifying.
- **Concurrent rate-limit interference.** Two sessions hitting the same Anthropic account share quota. For first comparisons, sequential is safer; concurrent is acceptable when both sessions are using cached prefixes heavily. The comparison protocol should note when throttling was observed.
- **Cache pollution between experiments.** If plugin caches accumulate across runs, later comparisons may behave differently from earlier ones. Each experiment may want a fresh `plugins/cache/` to start truly clean.
- **Identical-starting-state beyond git commit.** Two sessions from the same commit but different memory states aren't truly identical. Whether to seed shared baseline memory or always start blank is a design call per comparison.
- **Determinism gap.** Even with identical inputs, both Claude instances are non-deterministic. A single A/B run is one sample; meaningful conclusions require multiple comparisons. How many before patterns emerge — 3? 5? 10? Probably depends on task complexity.
- **Comparison object equivalence.** Chester writes design briefs in a specific structure; Superpowers may write something differently shaped. The comparison-notes.md must explicitly translate between formats rather than assuming structural parity.
- **Designer effort cost.** Running a real A/B comparison is roughly 2x the work of running one session. The framework should be cheap enough that comparisons happen often, not so heavy that they become rare events.

---

## Acceptance Criteria

- A documented setup procedure exists for creating two worktrees with isolated `CLAUDE_CONFIG_DIR` values, each holding a single plugin loadout.
- Setup is reproducible: a designer can run the procedure on a new comparison without modifying their primary `~/.claude` install.
- Setup is reversible: removing the experiment config dirs and worktrees returns the system to its prior state with no residual changes.
- A pre-flight smoke test verifies plugin isolation before real comparisons begin.
- A comparison protocol documents how to pose the same task to both sessions, capture artifacts, and write comparison notes.
- A comparison-artifacts directory layout is specified for keeping experiment outputs organized outside the worktrees.
- At least one end-to-end comparison run is completed and documented as a proof of concept (Chester vs Superpowers on a real design task).
- Open concerns about `CLAUDE_CONFIG_DIR` full-isolation behavior, `settings.local.json` plugin-disable schema, and `--plugin-dir` semantics are resolved (via claude-code-guide agent or empirical testing) before declaring the procedure stable.
- The comparison framework supports both concurrent and sequential runs, with documented expectations about rate-limit interference in the concurrent case.
