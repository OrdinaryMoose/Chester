# Plan: Chester Subagent Consolidation

## Context

Each subagent spawned via the Agent tool carries ~20K tokens of fixed baseline overhead (Claude Code system prompt + CLAUDE.md + skill descriptions). The per-call cost cannot be reduced, but we can reduce how many times we pay it by consolidating multiple parallel agents into fewer agents with combined prompts.

The previous token optimization investigation (2026-03-26) established that the always-on baseline is 80% Claude Code / 20% Chester and concluded optimization of the per-call cost was not worth the risk. This effort takes a different vector: reducing the **number** of calls rather than the **cost per call**.

**Current plan hardening cost:** attack (6) + smell (4) = 10 parallel agents = ~200K tokens overhead
**Proposed:** attack (3) + smell (2) = 5 parallel agents = ~100K tokens overhead
**Savings:** ~100K tokens per plan hardening cycle (50% reduction)

Doc-sync additionally drops from 3 → 2 agents, saving ~20K per doc-sync invocation.

---

## Scope

Three skills modified, one skill verified unchanged:

- `chester-attack-plan` — 6 agents → 3 agents
- `chester-smell-code` — 4 agents → 2 agents
- `chester-doc-sync` — 3 agents → 2 agents
- `chester-build-plan` — verify-only (invokes attack/smell by skill name, no changes needed)

No changes to sequential skills (write-code, build-plan, build-spec) — their agents depend on prior results and cannot be batched.

---

## Phase 1: chester-attack-plan (6 → 3 agents)

### Consolidation groupings

- **Agent A — Codebase Verification** (merges agents 1, 4, 5)
  - Structural Integrity + Migration Completeness + API Surface Compatibility
  - All three grep the codebase to verify plan claims: paths exist, all usages covered, contracts addressed
  - 16 attack vectors total
- **Agent B — Runtime & Execution** (merges agents 2, 6)
  - Execution Risk + Concurrency & Thread Safety
  - Both analyze runtime behavior: ordering, state, threading, cancellation
  - 12 attack vectors total
- **Agent C — Assumptions & Edge Cases** (stays solo, agent 3)
  - Most orthogonal concern, lightest prompt
  - 5 attack vectors unchanged

### Files to create

- `/home/mike/.claude/skills/chester-attack-plan/subagent-codebase-verification.md`
  - Combined prompt covering all 16 vectors from Structural Integrity, Migration Completeness, API Surface Compatibility
  - Three output subsections so synthesis can still parse by category
  - Shared rules section (evidence-based, severity classification)
- `/home/mike/.claude/skills/chester-attack-plan/subagent-runtime-execution.md`
  - Combined prompt covering all 12 vectors from Execution Risk, Concurrency & Thread Safety
  - Two output subsections
- `/home/mike/.claude/skills/chester-attack-plan/subagent-assumptions-edges.md`
  - Extracted from current inline prompt (agent 3) — externalized, not changed

### Files to modify

- `/home/mike/.claude/skills/chester-attack-plan/SKILL.md`
  - Step 2: replace 6 inline prompt blocks with template-read-and-dispatch pattern (matching doc-sync's externalization approach)
  - Step 3 synthesis: 3 branch IDs instead of 6 (`codebase-verification`, `runtime-execution`, `assumptions-edges`)
  - Cross-check logic simplifies: C(6,2)=15 pairs → C(3,2)=3 pairs
  - Frontmatter description: "six" → "three"
  - "Reviewed by" line in report template: update agent names
  - SKILL.md shrinks from ~370 lines to ~120 lines

---

## Phase 2: chester-smell-code (4 → 2 agents)

### Consolidation groupings

- **Agent A — Structural Smells** (merges agents 1, 3)
  - Bloaters & Dispensables + Change Preventers
  - All concern code organization and maintainability: size, decomposition, change impact
  - 13 smell categories (5 Bloaters + 5 Dispensables + 3 Change Preventers)
- **Agent B — Design Smells** (merges agents 2, 4)
  - Couplers & OO Abusers + SOLID Violations
  - All concern type relationships and design patterns
  - Eliminates the cross-agent deduplication problem (Refused Bequest/LSP, Feature Envy/SRP now intra-agent)
  - 9 smell categories + 5 SOLID principles

### Files to create

- `/home/mike/.claude/skills/chester-smell-code/subagent-structural-smells.md`
- `/home/mike/.claude/skills/chester-smell-code/subagent-design-smells.md`

### Files to modify

- `/home/mike/.claude/skills/chester-smell-code/SKILL.md`
  - Step 2: replace 4 inline prompt blocks with template-read-and-dispatch
  - Step 3 synthesis: 2 branch IDs (`structural-smells`, `design-smells`)
  - Cross-check simplifies: only Divergent Change (structural) vs SRP (design) remains cross-agent
  - Frontmatter description: "four" → "two"
  - SKILL.md shrinks from ~328 lines to ~100 lines

---

## Phase 3: chester-doc-sync (3 → 2 agents)

### Consolidation groupings

- **Agent 1 — CLAUDE.md Staleness Checker** (stays solo)
  - Different input (git diff vs reasoning audit)
  - Only agent that runs in limited mode
  - File unchanged: `subagent-claude-md.md`
- **Agent 2 — Approved Doc Review** (merges agents 2, 3)
  - Conflict detection + Gap detection in two phases
  - Same input (reasoning audit + same doc indexes), complementary outputs
  - Current cross-agent handoff ("that's Agent 3's job") becomes intra-agent

### Files to create

- `/home/mike/.claude/skills/chester-doc-sync/subagent-approved-doc-review.md`
  - Phase 1: Conflict Detection (finding IDs A-1, A-2...)
  - Phase 2: Gap Detection (finding IDs G-1, G-2...)
  - Shared input section appears once (audit path, index paths, concept index)

### Files to delete

- `/home/mike/.claude/skills/chester-doc-sync/subagent-approved-docs.md` — replaced
- `/home/mike/.claude/skills/chester-doc-sync/subagent-doc-gaps.md` — replaced

### Files to modify

- `/home/mike/.claude/skills/chester-doc-sync/SKILL.md`
  - Step 2 mode logic: Full mode dispatches 2 agents (not 3), Audit-only dispatches 1 (not 2)
  - Step 3: dispatch 2 agents
  - Step 4: collect 2 results
  - Lightweight test-only mode applies to Phase 1 of combined agent only; Phase 2 (gap detection) still runs fully

### Files unchanged

- `subagent-claude-md.md` — kept as-is
- `report-template.md` — output sections remain separate (A-* conflicts, G-* gaps)

---

## Phase 4: Verification

- **chester-build-plan** (`/home/mike/.claude/skills/chester-build-plan/SKILL.md` line 188): invokes attack-plan and smell-code by skill name → no changes needed, verify compatibility
- **chester-start** (`/home/mike/.claude/skills/chester-start/SKILL.md` lines 116-124): skill descriptions reference agent counts in the skill frontmatter, which gets updated — no changes to chester-start itself needed since it reads descriptions from frontmatter dynamically

---

## Capability Preservation Checklist

For each consolidated prompt, every original attack vector / smell category / doc check must appear:

- chester-attack-plan: all 33 attack vectors across 3 agents (16 + 12 + 5 = 33, same as current 5 + 6 + 5 + 5 + 6 + 6 = 33)
- chester-smell-code: all 26 smell items across 2 agents (13 + 13 = 26, same as current 10 + 8 + 3 + 5 = 26)
- chester-doc-sync: all checks across 2 agents (CLAUDE.md staleness + conflict detection + gap detection + concept index check)

Output format sections preserved so synthesis steps can still parse findings by category and severity.

---

## Verification

- After each phase, manually count attack vectors / smell categories in new prompts vs old to confirm completeness
- Run each modified skill against the Sprint 050 plan (`Documents/Refactor/Sprint 050 Editor ViewModel Decomposition/plan/Sprint050-2026-03-27-editor-viewmodel-decomposition.md`) as a smoke test
- Verify Structured Thinking synthesis still produces valid merged reports
- Verify chester-build-plan's hardening gate triggers both skills correctly
