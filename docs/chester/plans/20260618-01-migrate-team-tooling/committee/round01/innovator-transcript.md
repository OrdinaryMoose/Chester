# Innovator Transcript — Round 01

**Member:** Innovator
**Question:** How should Chester's `design-committee` and `execute-write` skills — plus the two stale memories — be refactored to the post-v2.1.178 agent-teams model (no `TeamCreate`/`TeamDelete`, single implicit team, `team_name` ignored, automatic teardown), while preserving the deliberation grid and context-economy architecture?

---

## Analysis

### The Old Model's Shape

The old design-committee built its identity around two explicit lifecycle calls:

- `TeamCreate` with a named slug — the moment the deliberation grid "opened"
- `TeamDelete` — the moment it "closed"

The `team_name` parameter was the discriminator that separated roster members (who could peer-DM) from off-roster one-shots (Consolidator, Scribe) that must not inherit context.

That model is now structurally broken. `TeamCreate` and `TeamDelete` no longer exist. `team_name` is ignored. The discriminator that the Dispatch Discipline section explicitly states as load-bearing — "role peer-DMs? yes → roster; context-isolated one-shot? → Agent tool" — has lost its mechanism.

### What the New Model Actually Offers

Under v2.1.178, the real distinction is not roster vs off-roster. It is:

- **Teammate** = spawned as a named background agent; can receive and send `SendMessage` to named peers; persists until session exits; auto-disposes at session end. No teardown call.
- **Subagent** = dispatched via Agent tool; one-shot; returns to caller; no peer-DM capability; auto-disposes on return.

This is a cleaner model than what Chester was approximating with the `team_name` toggle. The deliberate intent behind Dispatch Discipline — "peer-DMs → roster; context-isolated one-shot → Agent tool" — maps directly onto "peer-DMs → teammate; context-isolated one-shot → subagent." The intent survives. Only the mechanism needs updating.

### The Innovator Proposal: Retire the Roster/Off-Roster Frame Entirely

The terms "roster", "off-roster", and "TeamCreate roster" are artifacts of a plumbing design that no longer exists. They carry a mental model — that there is a named roster object that membership confers privileges on — which is now false. Continuing to use this vocabulary creates a conceptual mismatch between the documentation and the actual runtime.

**I propose retiring the roster/off-roster vocabulary entirely in favor of "teammate" and "subagent."**

This is not a synonym swap. It is a frame replacement that unlocks a cleaner structural account:

1. **Teammates deliberate.** Four advocacy members + researcher are spawned as named background teammates. They receive their convening message via `SendMessage`, peer-DM each other directly by name, and persist for the duration of the session. The team forms implicitly on first spawn. No `TeamCreate` call, no slug.

2. **Subagents produce.** Consolidator and Scribe are dispatched via Agent tool with no peer-DM need. They are one-shot context-isolated workers. Auto-dispose on return. This was always their intent; the mechanism now matches.

3. **Teardown is a record step, not a lifecycle call.** The current `TeamDelete` at `SKILL.md:196` and `team-lead.md:141` carries the comment "MANDATORY — stranded teams leak context." That hazard is gone. Teardown is now automatic at session exit. The Closure phase's actual remaining work is: verify record completeness, stamp provenance, hand off to wrapping skill. Those are record-keeping steps, not lifecycle management. The teardown instruction should be replaced by a record-completion gate — no tool call, just a checklist item: "confirm all round-folder artifacts are final before session exits."

4. **The Checklist (SKILL.md:74-76) can simplify.** Current step 3 is "Convene — team-lead Round 1 confirmation + `TeamCreate` + convening message." Under the new model: "Convene — team-lead Round 1 confirmation + spawn teammates + convening message." Step 5 is "Tear Down — team-lead closure flow + `TeamDelete`." Under the new model: "Closure — record-completion gate + provenance stamp." The phase count stays the same; the substance of each phase improves.

### The Latent Risk: Nested Teams

The context packet surfaces the hard constraint: no nested teams; teammates cannot spawn teammates; the lead is fixed as the main session. SKILL.md:34 states "team-lead = calling agent."

This is fine IF design-committee is always invoked from the main session. The Innovator position is that this constraint should be **surfaced explicitly and made a load-bearing precondition** in the skill, not left as an implicit assumption. Specifically:

- Add a Phase 1 Bootstrap check: "Verify this invocation is from the main session, not from inside a subagent or teammate. If invoked from a subagent context, surface this as a hard blocker — nested teams are prohibited."
- The "Standalone Invocability" section should acknowledge the nested-team constraint alongside its no-sprint-required claim.

Making this explicit is cheap and prevents a silent failure mode that would be extremely hard to debug.

### execute-write: The Simpler Fix

The execute-write references (implementer.md, spec-reviewer.md) carry the warning: "passing a `team_name` makes it a persistent teammate that strands until `TeamDelete`." That failure mode cannot happen anymore. The warning is now false and should be removed.

The correct replacement instruction is minimal: "Dispatch via Agent tool. One-shot worker — returns its result and auto-disposes." The off-roster/no-`team_name` framing is unnecessary because `team_name` is ignored regardless. The instruction to use Agent tool (not SendMessage) for these workers remains correct and load-bearing; only the justification changes.

### Memory Cleanup: Full Replacement

The two stale memories should not be updated — they should be replaced:

- `project_committee_teardown_gap` describes a bug that no longer exists in a system that no longer works the way described. Replace with a memory that records the v2.1.178 migration: automatic teardown, no stranding hazard, Closure phase is now record-completion only.
- `project_subagent_disposal_offroster` contains a falsehood ("team_name = persistent teammate needing TeamDelete"). Replace with a memory that records the new teammate/subagent distinction: teammates = named background agents spawned as teammates (peer-DM capable, session-scoped, auto-dispose at session exit); subagents = Agent-tool dispatches (one-shot, no peer-DM, auto-dispose on return).

---

## Final Position

**Verdict:** Retire the roster/off-roster vocabulary entirely; replace with the teammate/subagent frame that matches v2.1.178's actual model. Teardown becomes a record-completion gate with no tool call. The nested-team constraint becomes an explicit precondition in Phase 1 Bootstrap.

**Structural changes, ranked by boldness:**

1. **Frame replacement (high impact, low risk):** Everywhere "roster dispatch," "off-roster dispatch," and "TeamCreate roster" appear — replace with "teammate dispatch" and "subagent dispatch." The Dispatch Discipline section (`SKILL.md:122-131`) becomes the natural home for this distinction, rewritten around the teammate/subagent boundary.

2. **Teardown reframe (medium impact, clean win):** Phase 5 "Tear Down" becomes Phase 5 "Closure." The `TeamDelete` call disappears. The step becomes a record-completion gate: verify all round-folder artifacts are final, stamp provenance, signal wrapping skill. The comment "MANDATORY — stranded teams leak context" is struck entirely.

3. **Convene reframe (low impact, accuracy win):** Phase 3 "Convene" drops the `TeamCreate` call. Four advocacy members + researcher are spawned as named teammates via Agent tool with background mode. The team forms implicitly. The convening message is sent via `SendMessage` as before.

4. **Nested-team precondition (low implementation cost, prevents silent failure):** Phase 1 Bootstrap adds an explicit stated entry condition: committee must be invoked from the main session. Two sentences, two placements — Bootstrap (where an invoker looks before firing) and Integration (where caller obligations for wrapping skills live). Residual placement split with pragmatist: pragmatist prefers Bootstrap + Standalone Invocability; innovator and purist hold Bootstrap + Integration on the grounds that Standalone Invocability covers sprint mechanics, not session topology, and Integration is where caller obligations are already catalogued. Both placements agree on Bootstrap; split is only on the second location.

5. **execute-write warning replacement (low impact, correctness fix):** Replace false `team_name`-stranding warning with accurate description: "Dispatch via Agent tool. Auto-disposes on return."

6. **Memory replacement (housekeeping, not structural):** Replace both stale memories with accurate post-v2.1.178 descriptions.

**What NOT to change:**

- Context-economy architecture is orthogonal to plumbing — Conservator + Scribe remain subagents; four advocacy + researcher remain teammates. The information-flow design is unchanged.
- The per-round flow, verdict/alignment-map discipline, Ledger, Translation Gate — none of these are touched by the plumbing migration.
- The Dispatch Discipline discriminator's intent ("peer-DMs? → teammate; one-shot context-isolated? → subagent") is preserved; only the mechanism and vocabulary are updated.

**Risk assessment:** The boldest proposal here — full vocabulary replacement — carries near-zero implementation risk because the underlying intent of the old vocabulary maps cleanly onto the new frame. The main cost is a careful text audit to ensure every occurrence of "roster," "off-roster," and "TeamCreate" is updated consistently. The benefit is a skill that reads correctly against the platform it runs on, with no false-failure-mode warnings and no phantom lifecycle calls.

**Warrant:** Evidence from `SKILL.md:126-131` (Dispatch Discipline), `SKILL.md:194-196` (TeamDelete call), `team-lead.md:141` (TeamDelete call), `execute-write/SKILL.md:96-98` (team_name warning), `execute-write/references/implementer.md:7` (stranding warning), `execute-write/references/spec-reviewer.md:9` (stranding warning). All of these are contradicted by the v2.1.178 facts quoted in the context packet.
