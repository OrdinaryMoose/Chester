# Committee Analysis — Round 03 (clean generate, open ownership framing)

**Question:** For each non-fixed committee role (consolidate, synthesize, converge, author), who owns it — team-lead, dedicated agent, members collectively, or shared disk — to best meet R1 converge / R2 enable-decisions / R3 min-context / R4 retain-meaning?

## Researcher cost table (per-round, grounded in round01 JSONL)

- CONSOLIDATE: off-TL cheaper ~14.7k/round. Already off-TL; gap is enforcement drift (actual ~5,598 vs spec ~902), not ownership.
- SYNTHESIZE: TL-owns cheaper by ~1.9k/round IF input bounded (smallest gap of the four). Dispatching an agent is a net loss here.
- CONVERGE: off-TL "cheaper by ~6k" — but that 6k is the digest-leak cost, not convergence; from bounded signals TL-converge is cheap.
- AUTHOR: off-TL cheaper by ~24k–47k PER ARTIFACT. The dominant lever. Synthesis and authoring are SEPARABLE.

## Alignment

**Unanimous (all four fresh advocates + cost table agree):**
- CONSOLIDATE = dedicated agent (existing consolidator). Real fix = enforce the hard cap (drift, not ownership).
- AUTHOR = dedicated scribe/agent. The single largest saving (~24–47k/artifact).

**Contested — synthesize & converge ownership:**
- pragmatist-r3, conservator-r3: synthesize=TL, converge=TL (cheaper from bounded input; R2 — TL must own the option set to defend it to designer).
- innovator-r3: collapse consolidate+synthesize; converge=members-collectively via blackboard quorum, TL fallback on splits only.
- purist-r3: synthesize/converge can sit on a dedicated agent OR on the TL — **agent count is not the boundary; the artifact is.**

**The reconciling finding (purist-r3) — SEQUENCING, not ownership, is the real failure:**
- The category failure is the TL doing consolidate→synthesize→converge→author→present in ONE in-context loop with no artifact checkpoints. They merge and bloat.
- Fix: hard artifact checkpoints between each role. Each step reads the prior artifact, writes its own (alignment-map.md, verdict.md), and evicts. "The artifact IS the boundary. Agent separation is optional; artifact separation is mandatory."
- With a verdict artifact, converge+present live cleanly on the TL. Without it, they must be separate agents.
- Killer corollary: "Authoring is convergence-in-disguise unless convergence is complete before authoring begins." The round04 57k growth was convergence happening DURING drafting. Sequencing discipline (verdict complete → then scribe drafts) is what makes authoring cheaply offloadable; otherwise the scribe becomes a de-facto converger.

## Emerging optimal design (spine)

1. Consolidate → consolidator agent, hard-enforced cap.
2. Synthesize → TL-owns, writes alignment-map.md, evicts (cheapest + R2).
3. Converge → TL-owns, writes verdict.md, evicts (cheap from bounded input) — OR members-collectively (innovator's radical variant) — the one genuine open split.
4. Author → scribe agent, fed the COMPLETE verdict; cannot start before convergence is done.
5. Members → disk transcripts + bounded structured signal (routing + position fields); NO prose digest stream to TL.
6. **Mandatory artifact checkpoints between every role** — the load-bearing discipline that lets the TL own synthesize+converge without bloat.

## Projected savings

- conservator-r3: ~37–49k TL context for a 4-round session vs ~297k measured (~83–87% reduction).
- pragmatist-r3: ~139.7k saved across 4 rounds (~47% of session growth above baseline).
- Floor reminder (researcher): ~35–50k system-prompt baseline is irreducible by any committee redesign.

## Post-peer-exchange convergence (round03 step 3)

The peer channel closed the one open split with no round04 vote needed:
- innovator-r3 conceded members-self-converge: "synthesis relocates not eliminates; verdict COMPLETENESS is the gate, not who converges."
- conservator-r3 contamination-asymmetry ruling: synthesize+converge may co-locate on TL because their contamination is *visible/auditable* (alignment-map.md + verdict.md are written artifacts stating what was discarded); consolidate+synthesize contamination is *invisible/unrecoverable* (a dropped quote never appears), so consolidate stays a separate agent.

### Converged design (all four fresh advocates)

- CONSOLIDATE = consolidator agent, fixed by READ-SCOPING (not output-capping): reads only each member's capped `## Final Position` section. Bounded input → bounded output, structurally.
- SYNTHESIZE = team-lead; writes alignment-map.md to disk, then evicts.
- CONVERGE = team-lead; reads alignment-map.md, writes verdict.md, then evicts.
- AUTHOR = scribe agent; fed the COMPLETE verdict + annotated template + consolidator output; never the session thread; cannot start before convergence is complete.
- MEMBERS → TL = typed routing signal only (no prose); peer exchange member-to-member, capped.
- Discipline under all of it: a disk artifact checkpoint between every step; each step's dispatch carries the prior artifact as a required input field.

### Five cross-design requirements (converged independently, become spec requirements)

1. **Member `## Final Position` section** — mandatory, fixed location (transcript end), 200-word cap, schema `{position, rationale, blocking_risk}`, all fields member-authored. Consolidator reads only this. Field detail: `position` = chosen option; `rationale` = one-line why, member's words; `blocking_risk` = member's own articulation (~20 words, member framing, NOT a category label or consolidator paraphrase) of their hardest objection to the non-chosen options. blocking_risk is the field that gives R4 teeth — the one place minority framing is guaranteed to survive to the TL's convergence decision and onward to the designer via the Dissent Record.
2. **Typed routing-signal schema, member→TL** — no free-text; schema fields ARE the whole message; defined in member-protocol.
3. **TL rejection-by-default for malformed signals** — pre-read schema check; any field outside `{member, status, round, transcript}` → discard unread + one correction prompt; defined in team-lead.
4. **Mandatory `Dissent Record` section in the handoff artifact** — named required header, not advisory prose; enforced by artifact structure (the TL's present-read is guaranteed to encounter it); protects R4.
5. **alignment-map.md written to disk before converge begins** — audit record, not just sequencing; wherever synthesize+converge co-locate (i.e. on the TL), this is what keeps the contamination auditable.
6. **Consolidator copies member-authored fields verbatim** — the `## Final Position` rationale is written by the member, not selected by the consolidator. Consolidator spec = "copy the Final Position fields," not "summarize member reasoning." This is the cleanest enumeration/synthesis split: enumeration = copy member-authored fields; synthesis = TL reading them for alignment. Boundary holds by instruction, not discipline.

### Projected effect

~37–49k TL context for a 4-round session vs ~297k measured (~83–87% reduction); ~35–50k is irreducible baseline.

## Status

Design substantially converged in round03. Round04 (if run) = ratify + stress-test, not generate. Awaiting designer: ratify via round04, or write straight to spec.
