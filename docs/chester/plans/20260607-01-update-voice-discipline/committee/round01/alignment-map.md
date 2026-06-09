# Alignment map — canonical instruction-injection architecture — round01

## Alignment pattern

Alignment is **per consumer kind**, not one global vote. Two kinds are settled 4-0; the agent-side kinds split.

- **CLAUDE.md consumers** — **4-0**: two-tier summary+pointer (canonical body in root CLAUDE.md, skills/CLAUDE.md points up). SETTLED.
- **Parent-session skills** (inline `design-small-task`, runtime-read `plan-attack`/`plan-smell`/`util-codereview`, team-lead) — **4-0**: runtime-read citation seam. Stable CWD, instruction reaches the agent reliably. SETTLED.
- **Skill catalog (FD-03)** — **3-1**: build-time generator from frontmatter (Innovator, Pragmatist, Purist) vs pointer-only index (Conservator). LEAN generator.
- **Teams subagents** (4 committee advocacy members) — **2-1-1**: runtime-read+path-fix (Conservator, Pragmatist) | dispatch-time injection (Innovator) | build-time materialization (Purist). UNRESOLVED — the crux.
- **Named Task subagents** (reviewer agents) — **3-1**: build-time generator (Pragmatist, Purist, + Innovator via dispatch-injection) vs runtime-read+fix (Conservator). Consolidator binning ambiguous on Innovator (summary = dispatch-injection; count = generator) — flag for R2.

**Decisive cross-cutting fact (researcher, proven):** runtime-read of sibling refs works in dev (CWD = repo root) but **fails in production** (CWD = user's project). Current agent prose citations are already production-broken. This converts "pure runtime-read for agents" into a non-option — Conservator itself concedes the seam needs an absolute-path or dispatch-injection fix as a concurrent obligation.

## Option set

1. **Runtime-read citation seam + path-discipline fix** — every consumer told "read `<canonical>`"; agent-side paths made absolute (or injected) to survive production. DRY-est. (Conservator)
2. **Dispatch-time injection (DTI)** — the dispatch caller (a parent-session skill with stable CWD) reads the canonical text and bakes it into the prompt/`SendMessage` at dispatch; agent files shrink to lens-only. Single-source on disk + text-in-prompt at load. Per-dispatch token cost. (Innovator)
3. **Build-time generator / materializer** — one canonical source; agent files are generated outputs with the text baked in; a generator keeps them synced. One-time authoring cost; generated (not hand-authored) files on disk. (Pragmatist for production agents, Purist for all agents)
4. **Four-category framing (overlay on 1–3)** — distinct mechanism per instruction category: canonical rule / parameterized template / derived index / session-scoped overlay; refuse one mechanism for all. (Purist)
5. **Mixed-per-consumer-kind (emergent shape)** — runtime-read for parent-session skills; generator or DTI for agents; two-tier pointer for CLAUDE.md; generator for catalog; env overlay for session style. The settled 4-0 kinds already force a mix.

## Positions discarded (with reason)

- **Pure runtime-read for agents, no fix** — discarded. Researcher proved it production-broken; even its proponent (Conservator) concedes a fix is mandatory. The seam alone cannot deliver instruction to a Teams/Task subagent in production.
- **Single mechanism governing all consumer kinds** — discarded. The 4-0 settlements (CLAUDE.md = pointer; parent-skills = runtime-read) already prove no single mechanism fits all; Purist's anti-collapse holds. The design IS a mix.
- **DTI rejected outright on token cost** — NOT discarded; live. Pragmatist's lifetime-per-dispatch-cost objection stands against DTI and is the main argument for the generator on the agent side.

## The R2 crux (one question)

For the agent side (Teams + named Task subagents), where runtime-read is conceded-broken: **dispatch-time injection vs build-time generator.** Trade-off — DTI's recurring per-dispatch token cost + caller complexity vs the generator's one-time build step + generated-files-on-disk. Both put the instruction in the prompt at load (both satisfy the no-drift litmus); they differ on cost shape and on whether agent files stay hand-authored.

<!-- created-at: 2026-06-07T11:12:09Z -->
<!-- produced-by design-committee@v0018 -->
