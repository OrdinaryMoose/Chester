# Consolidator output — round 01

## Alignment

By consumer kind, the four members land as follows:

**Inline skills / Runtime-read skills (parent-session consumers):**
Runtime-read (all 4): Conservator, Innovator, Pragmatist, Purist

**Teams subagents (committee advocacy members):**
- Runtime-read (dev-mode assumption explicit): Conservator (2), Pragmatist (2)
- Dispatch-time injection: Innovator (1)
- Build-time materialization / scaffold materializer: Purist (1)

Split: 2 runtime-read | 1 dispatch-time injection | 1 build-time materialization

**Named Task subagents (reviewer agents):**
- Build-time generator: Innovator (1), Pragmatist (1), Purist (1)
- Runtime-read / read-as-first-action (accepting production fragility): Conservator (1)

Split: 3 build-time generator | 1 runtime-read

**CLAUDE.md consumers:**
Two-tier summary+pointer (all 4): Conservator, Innovator, Pragmatist, Purist

**Skill catalog (FD-03):**
- Pointer-only index (no generator): Conservator (1)
- Build-time generator from frontmatter: Innovator (1), Pragmatist (1), Purist (1)

Split: 1 pointer-only | 3 build-time generator

---

## Per-member summary

- Conservator: Extend the proven runtime-read citation seam across all consumer kinds; accept production-fragility of repo-root-relative paths as an existing cost requiring a path-discipline fix, not a mechanism replacement; pointer-only index for skill catalog; no build-time generator.
- Innovator: Dispatch-time injection (DTI) as the primary mechanism for Teams and Named Task subagents, with shared instruction text assembled by the dispatch caller from a named injection registry; runtime-read for parent-session skills; build-time generator scoped to skill catalog only.
- Pragmatist: Runtime-read for dev-only consumers (inline skills, runtime-read skills, committee Teams subagents under explicit dev-mode assumption); build-time generator for production Named Task subagent agents; pointer pattern for CLAUDE.md; dispatch-time injection rejected on lifetime token cost grounds.
- Purist: Four-category architecture (Canonical Rule, Parameterized Template, Derived Index, Session Overlay) demanding four distinct mechanisms; build-time materialization for all agent consumers (Teams and Named Task); runtime-read only for parent-session skills; derived generator for skill catalog; no single mechanism governs all categories.
- Researcher: No design opinion; empirical findings only — runtime-read works in dev mode with repo-root-relative paths and fails in production where CWD is the user's project root.

---

## Notable quotes

- Conservator: "The production-fragility of repo-root-relative paths in runtime-read is the hardest objection to the Conservator position. If production deployment (marketplace) is a near-term target, the citation seam does not work without an absolute-path or dispatch-time injection fix. Accepting the citation seam mechanism requires accepting this fix as a concurrent obligation, not a deferred one."
- Innovator: "Production failure is decisive. Teams subagents dispatch with CWD = user's project root; any agent-file path reference to Chester repo content fails silently. DTI eliminates the failure at the root by moving instruction assembly to the dispatch caller (a parent-session skill with stable CWD). Agent files shrink to lens-specific content only. The 70%-identical member scaffold is not a property of agent files — it is a property of the dispatch operation."
- Pragmatist: "Dispatch-time injection meets the litmus but carries token cost on every dispatch for Chester's lifetime; that cost exceeds the generator's one-time authoring cost beyond a small number of sessions."
- Purist: "An agent that never reads its cited source receives no instruction from that source — the citation becomes aspirational decoration, producing exactly the drift it was meant to prevent. A build-time materializer costs a generator build step and on-disk agent files that are generated outputs rather than hand-authored; that is the real trade-off against accepting production-silent drift."
