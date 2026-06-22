# Committee Analysis — Token-frugal start sequence & master-plan procedure
# File: committee-analysis-01.md dtd 2026-06-04
# Master: (none — standalone sprint) · Sub-sprint: 20260604-02-review-start-context

## Round Overview

One round, one-round-format. Standalone committee consultation (no wrapping skill). Convened
to optimize the Chester start sequence (`setup-start` housekeeping) and Master Plan Mode
procedure — especially `master-plan.md` and its change log — for main-window token
preservation. Anchor question: how to make a status query return a thin greppable line
instead of a paragraph wall. Designer supplied a starting proposal (D1 greppable ledger +
facet prefixes; D2 ledger/narrative split; D3 execution detail evicted to sub-sprint
`summary/`; ~5-bullet cap), marked NOT ratified in design-00. HEAD 099d46c.

**Question (scope: both surfaces — start sequence AND master-plan/change-log):** How should
the start sequence and Master Plan Mode procedure (esp. `master-plan.md` + change log) be
restructured so a status query returns a thin greppable line not a paragraph wall, preserving
main-window context tokens?

**Poles (reporting lens, not a fixed pairing):**
- Reuse the existing register — extend the YAML `freeze_map` already in the header rather than write a parallel prose ledger (Innovator, Pragmatist).
- Close the real sink — the amendment narrative (§11–13), not the status lines, is the token cost; address it structurally (Purist, Conservator).
- Minimum-ceremony — don't build discipline (facet taxonomy, hard cap) for a grep consumer that doesn't exist yet (Pragmatist).

## Initial Deliberation

### Researcher — prior-art findings (verbatim, abridged; DECISIVE on two premises)

Two real master plans exist in `plans/`:
- `20260430-02-rebuild-design-derivation/master-plan.md` — 454 lines, ~14,000 tokens. Has YAML frontmatter with a machine-readable `freeze_map` (status per cluster/task). Status facts braided in TWO places: the `freeze_map` AND inline `- **Status:** done — merged ... (merge commit 5f07c64)` per cluster section. §9 "Active Sub-Sprint" re-narrates all status at ~95 words. Amendment sections §11/§12/§13 each add 200–500-word narrative.
- `20260511-01-mp-redesign-proof-system/master-plan.md` — 73 lines, ~1,700 tokens. No frontmatter; clean compact status section (~93 words). Already terse.

DECISIVE — cost distribution (large plan): status facts themselves (`freeze_map` + 8 inline status lines) ≈ 200 words / ~250 tokens. The token weight is amendment narrative (§11–13 ≈ 1,800 words) + charter prose (§4.3–4.5 ≈ 2,500 words).

DECISIVE — access pattern: grep of `master-plan.md` by line-prefix is currently FALSE. Zero skills, hooks, or scripts grep it. Root `CLAUDE.md` Master Plan Mode instructs a FULL READ of the whole document. The `freeze_map` exists as a human aid; nothing queries it programmatically.

`setup-start` SKILL.md: 207 lines, ~2,000 tokens, injected UNCONDITIONALLY into the system prompt at every session start (hook matcher `startup|clear|compact` — also fires on /clear and compaction). Verification text (Check 0–3) always loaded; only the bash execution is conditional. `setup-start` has ZERO references to master-plan / Master Plan Mode — all that logic lives in root `CLAUDE.md` (~900 tokens) and loads as project instructions on EVERY session regardless of whether a master plan is active.

`feedback_subsprint_completion_annotation` memory DOES NOT EXIST. No file matches in the memory dir. The brief's constraint citing it is unfounded. Closest real memory: `feedback_standalone_documentation` (declarative current state; history in end change-log).

Prior art for greppable status: the `freeze_map` YAML (closest existing machine-readable register); `<!-- produced-by skill@version -->` and `<!-- created-at -->` trailer conventions; implementer status codes (DONE/BLOCKED/…) in task reports; inline `- **Status:**` lines already greppable today.

Synthesis (facts): status is a small fraction of the token cost; the cost is narrative (amendments + charter). The greppable-ledger payoff is hypothetical until a consumer is written. A machine-readable status register already exists (`freeze_map`) but is unused by tooling. ~2,900 tokens of fixed session overhead (`setup-start` + always-on Master Plan Mode block) load before any master plan is read.

### Conservator — position (verbatim, abridged): adopt D1 + facet-prefix; reject D2/D3 for active scope; compress amendments

Real paragraph-wall is in amendment blocks (§11–13), not "version change-log" entries as the brief describes. Distinction the proposal collapses: ACTIVE context vs AMENDMENT narrative. Active sub-sprint scope + acceptance criteria is load-bearing working context a mid-sprint resuming session needs immediately — and `summary/` doesn't exist until the sprint closes, so eviction (D2) leaves the session nowhere to find it. Keep active scope inline until close, then replace with a `detail:` pointer. Accept D1 + facet prefixes (costs nothing structurally). Accept D3 for amendments specifically — compress §11/§12/§13 to 3–5 bullets + `detail:` pointer (~30 words not 400). `setup-start` is the cleaner bounded win: lazy-load the verification checks (run full logic only on failure). Gate D2/D3 for closed-sprint archive on confirming status-reads dominate narrative-reads.

### Innovator — position (verbatim, abridged): extend freeze_map as the sole status primitive; no parallel ledger

The document conflates three info types: greppable status, charter declarations (read once at launch), amendment paper trail (never queried routinely). D1–D3 identify the symptom but stop short of the existing primitive. The `freeze_map` frontmatter is ALREADY machine-readable, line-addressable status — a session can read ~10 header lines instead of 455. The designer's parallel prose Status Ledger creates TWO representations of the same fact → drift. Right move: EXTEND `freeze_map` (add `active: true`, `merge_commit:`, `dir:`), don't duplicate it in prose. Then a status check reads only the header; the body is read only when charter content is needed (at launch, not every status query). Keep D1 facet prefixes + cap in the change-log body; keep D3 (detail → summary/). Start-sequence cheap path: config read → `.active-master` (1 line) → grep header `active: true` → navigate to `dir:`. Requires formalizing the `freeze_map` contract.

### Pragmatist — position (verbatim, abridged): minimum viable — extend freeze_map + shrink §9; skip taxonomy + cap

Greppability rests on an untested assumption Researcher falsified: nothing greps the file; access is full-read. The facet taxonomy adds writer discipline for a benefit requiring future tooling that doesn't exist — "shorter is better" is the only token argument that survives the evidence. MVC (80% of saving, minimal ceremony): (1) extend `freeze_map` with `active:` + `merge_commit:` — primary status query answerable from header without reading body; (2) shrink §9 "Active Sub-Sprint" to a 3-line pointer — it re-narrates status already in `freeze_map`; removing that re-narration is the single highest-value cut; (3) leave amendments §11–13 as prose — reasoning history, occasional need, near-zero net saving from eviction, file-hop without saving = ceremony. Do NOT implement the facet taxonomy (add it if/when grep tooling is written). Do NOT make the 5-bullet cap a hard rule (violated on first complex entry, then ignored). Do NOT add a parallel prose ledger alongside `freeze_map` (dual-source drift). `setup-start`: gate verification block behind config != none, collapse inline bash to comments (~40 lines saved/session).

### Purist — position (verbatim, abridged): adopt D1+D2+D3, but close the amendment-narrative gap

Status facts (S3: COMPLETE) are a clean category, no leakage — D1 correct. Execution prose (commit hashes, test counts) belongs in sub-sprint `summary/` — D2/D3 correct. STRUCTURAL GAP the proposal does not close: amendment narratives (§11–13) are the LARGEST token cost and are NOT change-log entries — they're retrospective structural revisions (why cluster sequence changed, what the new operative statement is). They can't go to per-sub-sprint `summary/` (wrong scope) and can't collapse to 5 bullets (too load-bearing). Recommend a dedicated `## Amendments` section with a structural-outcome-only constraint: ≤8 lines per amendment (what changed, new operative state, sections affected); reasoning path stays in cluster `design/` artifacts where it already lives — which also satisfies the standalone-documentation rule. Facet fragility: `carry-forward:` and `pending:` are conflated in the proposal and will drift; spec them distinct (`carry-forward:` = crosses sprint boundary, destination in the line; `pending:` = not yet scheduled). 5-bullet cap: scope as "per sub-sprint completion entry," not per version.

### Member follow-ups

- Innovator ↔ Pragmatist: converged that an extended `freeze_map` (with `active:` + `merge_commit:`) covers both primary status queries; a parallel prose ledger adds maintenance burden with no query advantage. "Highest-value, lowest-cost move."
- Pragmatist → Researcher; Purist → Researcher; Conservator → Researcher: all three independently asked the same load-bearing question — how are sessions actually reading `master-plan.md`? Researcher answered all: full-file-read, no targeted/section/prefix access; amendment sections have no targeted access. This fact reshaped every position (greppability has no consumer today).

### Team Lead

**Convergence (stable, proven).** (1) Status should be a thin, structured read, and the existing `freeze_map` header register is the right home for it — extend it (`active:`, `merge_commit:`, `dir:`), do not hand-write a parallel prose ledger (drift). No member opposed this once surfaced. (2) Execution detail (hashes, test counts) belongs in the sub-sprint's own files, not the master plan (D3). (3) `setup-start` housekeeping is a separate, bounded, low-risk win — compress the verification block. (4) The brief's two load-bearing assumptions are falsified: nothing greps the file (full-read is reality), and the named memory constraint does not exist.

**Alignment.** On the status primitive: effectively 4-0 toward "thin status via the existing register," with Innovator + Pragmatist sharpening it to "extend `freeze_map`, no parallel ledger." On the facet-prefix taxonomy: 3-1 (Conservator/Innovator/Purist keep it, Purist with a distinctness fix; Pragmatist rejects as discipline-without-consumer). On the amendment narrative (the real token sink): 2-1-1 — Purist + Conservator compress in place (structural-outcome bullets + reasoning pointer); Innovator evict to `summary/`; Pragmatist leave as prose. On §9 active section: irreducible tension — Pragmatist shrink to a 3-line pointer vs Conservator keep active scope inline (a mid-sprint session needs it and `summary/` doesn't exist yet). On the 5-bullet cap: keep-with-scoping (3) vs drop/advisory (1, Pragmatist).

**Observations.** The decisive event was the Researcher's full-read finding — it relocated the problem. The designer's proposal optimizes the status lines (~250 tokens), but the tokens live in amendment + charter narrative (~4,300 words) and in ~2,900 tokens of unconditional per-session overhead. The §9 tension is partly reconcilable: §9's status RE-narration should go (duplicated in `freeze_map`), but the active working scope it carries could point to the sub-sprint's `design/` brief (which DOES exist mid-sprint), not `summary/` (which doesn't) — that reframing may dissolve Conservator's objection. The amendment 2-1-1 is the genuine irreducible split and sits on the largest token sink.

## Follow Up 01

Designer narrowed scope to surface (1) the START SEQUENCE ONLY (master-plan parked — the
round-1 view of it stands as the consolidated record). New focus added: minimize INITIAL
context AND COMPACTED context. Headline carried in: the SessionStart hook matcher is
`startup|clear|compact`, so the ~2,000-token `setup-start` body re-injects on EVERY
compaction — a recurring cost, not a one-time startup cost.

### Member follow-ups

Members read the actual hook wiring directly this round (`hooks/hooks.json`,
`chester-util-config/session-start`, `setup-start/SKILL.md` byte measures), so the
ground-truth is folded into the advocacy positions.

**Payload anatomy (Pragmatist + Purist + Innovator, measured, converged):** the ~8,154-byte
/ ~2,000-token injected body is three buckets — (a) first-run config wizard (lines ~33–112,
~700 tokens, new-project-only), (b) returning-session verification checks 0–3 with inline
bash (lines ~113–160, ~500 tokens), (c) skill-discovery mandate (lines ~162–208, ~600
tokens: SUBAGENT-STOP, EXTREMELY-IMPORTANT, Instruction Priority, The Rule, Red Flags,
Skill Types). Remaining ~200 tokens housekeeping outcomes.

**Conservator — final (verbatim, abridged): drop Section A from the compact payload; keep the mandate, confirm Instruction Priority survives.** First-run path is definitionally unreachable post-compaction (config already written); verification checks exist to catch broken state "at session open, not three skills later" — concern located at startup, not mid-session; path-echo already shown. Concrete failure mode of dropping all housekeeping from the compact reinject: none. Must survive every compact: SUBAGENT-STOP + EXTREMELY-IMPORTANT + The Rule + Instruction Priority (the one non-obvious load-bearing item — without it a conflicting CLAUDE.md wins silently with no resolution rule in context). Red Flags table held loosely — trim or keep, ~200 words, not catastrophic. Est. saving ~1,000 tokens/compaction.

**Innovator — final (verbatim, abridged): split the hook into two entries — full on `startup|clear`, mandate-only stub on `compact`.** Compact stub ≈ 35 lines / ~300 tokens: SUBAGENT-STOP + Instruction Priority + EXTREMELY-IMPORTANT/The Rule + one line "housekeeping already complete, config live." Deeper framing: housekeeping state lives in the filesystem (config JSON, dirs) and does NOT decay across compaction; only the behavioral MANDATE decays, so the mandate is the one thing that must survive every compaction — and it must survive cheaply. Current architecture pays ~150 lines of irrelevant housekeeping to deliver ~30 lines of mandate. Surface: `hooks.json` split + new ~35-line `session-start-compact` script; SKILL.md untouched.

**Purist — final (verbatim, abridged): three categories, two payloads.** (a) first-run config setup, (b) returning-session checks, (c) standing skill-discovery mandate. On compaction, (a) is dead instructions and (b) is near-zero value (checks already ran this session); (c) is the only category that must survive — dropping it silently breaks skill discipline for the rest of the session. THAT is the boundary that cannot be crossed. Clean decomposition: FULL payload on startup, MANDATE-only payload (~400–500 tokens) on compact/clear. Bonus initial-load cut: even at startup, the verification bash prose (~400 tokens) is for human readers, not the executing model — collapse to one instruction line. Implementation: session-start reads stdin `trigger` field, ~8 lines bash, no second hook registration needed.

**Pragmatist — final (verbatim, abridged): hook stdin branching is feasible and low-complexity — this changes my prior "high-complexity" assessment.** SessionStart hook receives JSON on stdin with `hook_event_name`/`trigger` (same pattern pre-compact.sh / post-compact.sh already use with `INPUT=$(cat)`); current session-start reads zero stdin. Ranked cuts: (1) HIGHEST — branch on trigger, compact injects skill-routing only (~1,200 tok/compaction saved, ~8 lines bash); (2) HIGH/zero-risk — gate or relocate first-run block so it never loads on established projects (~700 tok saved on EVERY event incl. startup); (3) MEDIUM — compress verification bash to one-sentence descriptions BUT keep the non-obvious `sed -i "\|^$CHESTER_PLANS_DIR|d"` snippet verbatim (~300 tok). DO NOT cut the Red Flags table — its value is precisely at post-compaction turns where rationalization drift is highest; that is the moment it earns its cost. DO NOT split into two separately-registered hooks — one hook with stdin branching is cleaner and matches the existing compact-hook pattern. Compaction floor after cuts: ~600 tokens.

**Researcher — follow-up findings (verbatim, abridged):** Per-block token measures of `setup-start/SKILL.md`: SUBAGENT-STOP ~29; EXTREMELY-IMPORTANT mandate ~84; Instruction Priority ~118; first-run wizard (33–111) ~696; returning-session Checks 0–3 (113–161) ~492; The Rule ~166; Red Flags table ~260; Skill Types ~49; Choosing Between Skills + User Instructions ~109. Full body ~2,014. Minimum load-bearing post-compaction = mandate + Instruction Priority + The Rule + Skill Types ≈ **~417 tokens (21% of payload)**; deferrable on compact ≈ **~1,557 tokens (77%)**. The hook CAN branch: SessionStart stdin carries `hook_event_name`, but `session-start` reads zero stdin today (one `cat` of SKILL.md, no INPUT/jq/branch) — so the lighter-compact-payload is a real, currently-unrealized gap. **CORRECTION (history):** commit 4276087 "chore: remove compaction hooks" lives on the unmerged `20260423-01-refactor-chester-skills` branch — it is NOT on main. Main still carries `compact` in the SessionStart matcher and still registers pre-compact.sh / post-compact.sh. Current main = pre-removal state. Master Plan Mode block in root CLAUDE.md ~1,016 tokens, loads unconditionally every session; CLAUDE.md has NO conditional-include mechanism — its self-gate ("ignore if no breadcrumb") is a model instruction, saves zero tokens.

**Late updates (fork resolution):** Conservator REVERSED on the Red Flags table — keep it in the compact stub, do not replace with a pointer: a pointer is self-defeating because a model on the verge of rationalizing a skip will not invoke the tool to read the list; the table pattern-matches the exact defection paths that reassert post-compaction. Fork (ii) is now unanimous-KEEP (optional safe compression of the 12 rows to ~4–5 canonical forms, ~30 tokens, low priority). Pragmatist addendum: the bash-verbatim cut is STARTUP-ONLY (housekeeping drops entirely from the compact payload under the trigger-split) — keep the non-standard `sed -i "\|^$CHESTER_PLANS_DIR|d"` verbatim (wrong reconstruction = silent, delayed failure: plans dir stays gitignored, caught only when archive artifacts land untracked at sprint finish), compress the mkdir + two git-add-commit snippets to prose (~150 tokens off startup).

### Team Lead

**Convergence (stable, proven).** (1) Split the payload by trigger event: full body on `startup`/`clear`, mandate-only on `compact`. All four advocacy members land here. (2) The compaction floor — what MUST survive every reinject — is SUBAGENT-STOP + EXTREMELY-IMPORTANT/The Rule + Instruction Priority. (3) Safe to drop from the compact payload: first-run wizard, verification checks, path-echo, "Choosing Between Skills." (4) Mechanism is cheap and low-risk: the hook already receives a trigger field on stdin (same pattern the compact hooks use); session-start just needs to read it and branch. (5) Bonus initial-context cuts the designer explicitly asked for: gate/relocate the first-run wizard so it never loads on established projects (~700 tok off every event, startup included), and collapse verification bash prose to one line keeping only the non-obvious `sed` verbatim (~300 tok).

**Alignment.** Effectively 4-0 on the trigger-split and the compaction floor. Two minor, non-irreducible implementation forks: (i) one hook with stdin branching (Pragmatist, Purist) vs two registered hook entries (Innovator) — Pragmatist argues one-hook is cleaner and matches the existing compact-hook pattern; (ii) the Red Flags table in the compact stub — keep (Pragmatist strong: earns its cost exactly at post-compaction drift; Purist groups it in the mandate) vs trim-optional (Conservator, held loosely). Both forks are cost-trivial and do not block the recommendation.

**Observations.** This round converged where Round 1 split, because the fix is a delivery-mechanism change (what the hook emits per event), not a contested content cut. The load-bearing reframe — Innovator's, confirmed by all — is that filesystem state does not decay across compaction; only the behavioral mandate does, so the only thing worth re-paying on each compaction is the mandate. Two estimate ranges for the compact floor (~300 mandate-core vs ~600 mandate-plus-Red-Flags) correspond exactly to fork (ii). Net effect if all adopted: startup payload ~1,000 tokens lighter; every compaction drops from ~2,000 to ~300–600 tokens.

## Final Recommendation

**Decision.** How to cut the start-sequence's context cost at both moments the designer named — the initial session-start injection and the re-injection on every compaction.

**Options:**

1. Trigger-split delivery + initial-load trim (full plan) — all four advocacy members converge; the hook emits the full body only on true startup/clear and a mandate-only stub on compaction, and the first-run wizard is gated out of the established-project payload entirely.

Advantages:
- Cuts the recurring per-compaction cost from ~2,000 to ~300–600 tokens, and the startup cost by ~1,000 tokens.
- No skill-content or behavioral change on initial load; pure delivery-mechanism change in one hook script.

Disadvantages:
- Introduces a second payload shape to keep in sync (the compact stub must never lose the mandate).
- Requires a test that compaction actually fires the stub and the mandate appears post-compact.

Implications: The behavioral mandate is the one thing re-paid each compaction; everything else loads once.

2. Plain shrink only (no trigger branch) — implicitly the fallback; compress the body in place (gate first-run, collapse verification bash) but inject the same trimmed payload on every event.

Advantages:
- Simpler — no per-event branching, one payload.
- Still recovers the first-run and bash-prose savings on every event.

Disadvantages:
- Still re-pays the full mandate-plus-whatever-survives on every compaction; leaves the largest recurring saving on the table.
- The mandate and the residual housekeeping stay braided.

Implications: Banks the initial-load win but not the bigger compaction-recurrence win.

**Minor implementation forks (resolved):** (i) one hook reading the stdin trigger and branching (Pragmatist, Purist — cleaner, matches the existing compact-hook pattern) vs two registered hook entries (Innovator) — recommend one-hook. (ii) Red Flags table in the compact stub — now unanimous KEEP (Conservator reversed: a pointer is self-defeating since a rationalizing model won't invoke the tool to read it). Neither blocks the decision. Measured compact floor: ~417 tokens core, ~700 with SUBAGENT-STOP + Red Flags; saving ~1,300–1,580 tokens per compaction.

**Flag (RESOLVED 2026-06-04 by designer).** An unmerged branch (`20260423-01-refactor-chester-skills`, commit 4276087 "chore: remove compaction hooks") deletes compaction-hook wiring. Designer ruled that branch DEPRECATED and chose SPLIT-AND-KEEP: keep firing the SessionStart injection on compaction, but make the compaction payload cheap (mandate-only stub). The removal direction (strip the `compact` trigger) is not pursued — it would leave the post-compaction agent with no skill mandate (silent skill-skipping).

**ADJUDICATED (2026-06-04).** Designer selected Option 1 (trigger-split + first-run gating), split-and-keep direction, with the two minor forks defaulted: one hook with stdin branching, and keep the Red Flags table inline in the compact stub. This is the settled outcome of the consultation.

**Recommendation.** Opinion: take Option 1 — trigger-split plus first-run gating. My read: Innovator's reframe is dispositive and the other three confirmed it — filesystem state (config, directories) does not decay across compaction, so re-injecting the housekeeping on every compaction is pure waste; only the behavioral mandate decays and must survive, and it can survive in ~300–600 tokens instead of ~2,000. The compaction floor to protect: SUBAGENT-STOP, EXTREMELY-IMPORTANT/The Rule, and Instruction Priority (the non-obvious one — without it a conflicting project instruction wins silently post-compaction). Bank the first-run gating too, since it also lightens true startup, which the designer explicitly asked to minimize. Trade-off accepted: a second payload shape and a required compaction test, in exchange for a recurring win paid back on every compaction cycle for the life of every long session. Settled Follow Up 01; this is the active recommendation (the Round 1 master-plan recommendation is parked, not withdrawn, per the designer's scope narrowing).

**Closing prompt.** Recommend confirming Option 1 and the two minor forks (one-hook + keep Red Flags), then handing to a design-specify pass to formalize the trigger-split contract, the compact-stub content, and the first-run gating.

<!-- created-at: 2026-06-04T17:53:01Z -->
<!-- produced-by design-committee@v0016 -->
