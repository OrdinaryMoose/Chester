# agents/ — CLAUDE.md

Named subagent definitions used by skills for review-side dispatches that must NOT inherit parent context.

## Why named subagents exist

Independence is the safeguard. Named subagents never fork — even when `CLAUDE_CODE_FORK_SUBAGENT=1` is set in the environment. Construction-time guarantee, not runtime discipline. See `docs/fork-policy.md` for the full per-dispatch policy.

## Use cases

- **Spec-fidelity review** — verify implementation matches spec without inheriting the implementer's framing.
- **Adversarial plan review** — red-team an implementation plan free of authoring bias.
- **Smell forecast** — predict code smells a plan would introduce, scoped to plan text + existing files.
- **Code-fit isolated test generation** — generate tests without seeing the implementation.
- **Independent industry research** — fetch external prior art without the parent's framing leak.
- **Pole-position advocacy** — Cartesian deliberation poles (Conservator/Innovator/Pragmatist/Purist) where each pole must be a clean lens.

## Filename convention

`{skill}-{role}.md` — the filename encodes the originating skill so the binding is obvious.

Examples:
- `plan-build-plan-attacker.md` — adversarial reviewer dispatched by `plan-build`.
- `execute-write-spec-reviewer.md` — spec-fidelity reviewer dispatched by `execute-write`.
- `design-committee-conservator.md` — Conservator pole dispatched by `design-committee`.

## Invocation

`chester:{skill}-{role}` — same plugin namespace prefix as skills.

## Authoring rules

- Each agent file declares its scope, its inputs, and its non-goals. Subagents must not silently expand scope.
- Subagents hold no opinion outside their declared lens. The agent file enforces this in the prompt.
- Tools list is minimal — never include write tools unless the role explicitly mutates state.
