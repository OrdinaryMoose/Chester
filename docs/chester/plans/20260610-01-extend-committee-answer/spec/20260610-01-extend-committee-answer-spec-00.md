# Spec: Member Warranted Answer-Contribution (Thread A)

**Sprint:** 20260610-01-extend-committee-answer
**Parent brief:** docs/chester/working/20260610-01-extend-committee-answer/design/20260610-01-extend-committee-answer-design-00.md
**Architecture:** Hybrid — an explicit typed-and-sourced `warrant` field in the Final Position schema (structural checkability), delivered to the four advocacy members by a single identical lens-neutral instruction (uniform agent surface, no per-lens scaffolding).

## Goal

Extend the design-committee's member contract so each of the four advocacy members supplies, in its `## Final Position`, the **warrant** for its load-bearing claim — a typed, sourced statement of the ground the claim rests on. The team-lead's Authority Guard then shifts from *originating* a warrant for each answer-body assertion to *verifying* the member-supplied warrant. The change is a content extension to the Final Position schema; the committee's routing, consolidation, and round-folder mechanics are unchanged. This is the member half of the answer-delivery realignment whose team-lead half shipped in sprint `20260609-01-realign-committee-answer` (team-lead.md v0010).

## Components

**Modified — schema authority**
- `skills/design-committee/references/member-protocol.md` § Final Position — the single authority for the Final Position schema. Adds a fourth field, `warrant`, with two named parts (`type`, `source`), plus a content-vs-mechanics boundary note. No `version` frontmatter exists in this file; no bump.

**Modified — the four advocacy agent contracts**
- `agents/design-committee-conservator.md`
- `agents/design-committee-innovator.md`
- `agents/design-committee-pragmatist.md`
- `agents/design-committee-purist.md`
- Each gains one identical, lens-neutral instruction directing the member to supply the typed+sourced warrant for its load-bearing claim in its Final Position, authored from its own lens, citing `member-protocol.md` § Final Position as the schema authority. No per-lens warrant guidance. No `version` frontmatter exists in these files; no bump.
- **Note (delegation):** the agent files already delegate the Final Position schema wholesale to `member-protocol.md` (each says "end with `## Final Position`" and points to the protocol for its contents). The warrant therefore flows into every member automatically once the protocol changes; the per-agent instruction is **salience reinforcement (a pointer)**, not a schema restatement — it must not re-list the field parts, preserving single-authority. Placement: alongside the existing `## Final Position` delegation in each agent's Output Format section.

**Modified — team-lead Authority Guard**
- `skills/design-committee/references/team-lead.md` (v0010 → v0011) — the Authority Guard warrant test, the matching self-evaluation check, and any phrasing that implies the team-lead originates warrants are reworded to verification of member-supplied warrants. Doctrine (what counts as a warrant, count-is-not-a-warrant, C1/C2 firewall, strict premise scope, the three warrant types) is unchanged.

**Unmodified by design**
- `agents/design-committee-researcher.md` — already warrant-shaped (cites file:line/source); holds no advocacy load-bearing claim, so it receives no warrant field. Explicit non-change.
- `agents/design-committee-{consolidator,scribe}.md`, `skills/design-committee/references/artifact-template.md`, `skills/design-committee/references/committee-analysis-round-format.md`, `skills/design-committee/SKILL.md`, `skills/util-design-partner-role/SKILL.md` — untouched.

## Data Flow

The warrant's lifecycle, end to end:

1. **Author.** An advocacy member, writing its transcript, populates the `warrant` field in its `## Final Position`: it picks a `type` (one of `evidence` / `logic` / `in-scope designer-premise`) and writes a `source` (a citation, an inference step, or the designer statement that granted the premise). The warrant is authored from the member's own lens.
2. **Persist.** The member writes the transcript (including the warrant) to its round-folder path, then sends the routing signal — write-then-send is unchanged. The warrant never travels in the routing signal; it lives only in the on-disk `## Final Position`.
3. **Enumerate.** The Consolidator reads the bounded `## Final Position` section and enumerates the round as-found (alignment count, one-line per-member summaries, verbatim quotes) with no validation or synthesis. Its enumerate-only boundary **and its output template are unchanged** — the Consolidator is not required to surface the warrant as a distinct output element, and is not modified to do so.
4. **Verify.** The team-lead's Authority Guard verifies each answer-body assertion against the member-supplied warrant: the `type` fits the claim and the `source` is traceable. **The team-lead sources the warrant by reading the member's on-disk `## Final Position` on demand** — not from `consolidator-output.md`, which stays enumerate-only and carries no dedicated warrant slot. This is consistent with the existing team-lead discipline of reading round detail from disk on demand; it adds no new contract. An assertion whose member-supplied warrant cannot be verified — or whose member supplied no warrant — is demoted to a gap; the team-lead does not originate a warrant on the member's behalf.
5. **Record.** The team-lead writes its warrant record into `alignment-map.md` and `verdict.md` as today, now sourced from member warrants rather than reconstructed.

## Error Handling

- **Missing warrant.** A member Final Position with no `warrant` field: the team-lead treats the associated assertion as unwarranted and demotes it to a gap. It does not supply a substitute warrant. (This is the verification discipline, not a malformed-signal rejection — the routing signal schema is unchanged, so a missing warrant does not make the signal malformed.)
- **Mistyped or unsourced warrant.** A warrant whose `type` does not fit the claim, or whose `source` is not traceable, fails verification and the assertion is demoted to a gap. Discovery of a no-clean-source claim is the warrant test working correctly.
- **No structural enforcement.** Nothing validates the warrant at write time or at consolidation (the Consolidator stays enumerate-only). Verification is the team-lead's Authority Guard pass — a disciplined read, consistent with how the Guard already operates.

## Testing Strategy

Doc-contract change; no runtime code. Verification is by inspection of the contract files, suitable for a bash assertion script in `tests/` and/or manual review:

- **Presence assertions** — the `warrant` field with `type` and `source` parts appears in `member-protocol.md` § Final Position; the boundary note appears; the identical warrant instruction appears in all four advocacy agent files; `team-lead.md` warrant-test wording contains the verification framing and not the origination framing.
- **Absence/invariance assertions** — routing-signal schema, Consolidator enumerate-only language, round-folder discipline, write-then-send sequencing, the locked decision-communication packet, and `util-design-partner-role` are byte-unchanged; the researcher agent has no warrant field; the three warrant types are unchanged.
- **Uniformity assertion** — the warrant instruction text is identical across the four advocacy agent files (no per-lens divergence).
- **Version assertion** — `team-lead.md` is `v0011`; no other file gains or changes a `version` field.
- **Regression** — the existing `tests/test-*.sh` suite passes unchanged.

## Constraints

- **Mechanics frozen (C-RIGID).** Routing-signal schema `{member, status, round, transcript}`, the Consolidator enumerate-only boundary, round-folder discipline, and write-then-send sequencing are byte-unchanged. The warrant is a content extension to the Final Position section only.
- **Single schema authority.** The warrant field is defined only in `member-protocol.md` § Final Position. Agent files and team-lead.md reference it; they do not restate the schema.
- **Three warrant types frozen.** `evidence` / `logic` / `in-scope designer-premise` — reused from team-lead.md v0010; no new type coined. (Wording note: team-lead.md currently writes this type unhyphenated — "in-scope designer premise" / "in-scope premise". Same type, different surface text; the "types unchanged" check compares substance, not bytes, and plan-build should reconcile member-protocol's new enum wording with team-lead's existing phrasing.)
- **200-word Final Position cap unchanged.** The warrant is authored within the existing cap; on pressure, the member trims `rationale`/`blocking_risk`, not the warrant.
- **v0010 doctrine must not regress.** Answer-shape rule, count-is-not-a-warrant, C1 audit, C2 firewall, strict premise scope are unchanged; only origination→verification framing moves.
- **Voice invariants untouched.** `util-design-partner-role` is not edited. Transcripts and the Final Position are internal records where code vocabulary is permitted; the Translation Gate continues to apply only to designer-facing surfaces.
- **Uniform agent surface.** The four advocacy agent instructions are identical and lens-neutral — no per-lens warrant scaffolding (the rejected Architect-B end).

## Non-Goals

- **Thread B** — session-artifact ownership (scribe-vs-team-lead). Out.
- **Thread C** — the both-sides-of-a-split question packet layout. Out.
- **Thread D** — threshold wave-off wording + ledger calibration record. Out.
- **Consolidator contract change** — not needed; enumerating one more field is within its existing enumerate-only mandate. Out.
- **New warrant types or a runtime validator** — out; verification is the team-lead's disciplined read.
- **Researcher warrant field** — out by design.

## Acceptance Criteria

### AC-1.1 — Typed, sourced warrant field in the schema authority

**Observable boundary:**
- `member-protocol.md` § Final Position lists a fourth field `warrant` alongside `position`, `rationale`, `blocking_risk`.
- The field definition names two parts: `type` (enum `evidence | logic | in-scope designer-premise`) and `source` (citation / inference step / designer statement that granted the premise), and states it is the ground under the member's load-bearing claim, member-authored, not a restatement of `rationale`.

**Given:** the current three-field Final Position schema is the single authority.
**When:** the warrant field is added to that section.
**Then:** a reader sees a typed, sourced, member-authored fourth field defined only in member-protocol.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.2 — Content-vs-mechanics boundary note

**Observable boundary:**
- A note in `member-protocol.md` § Final Position states the warrant is a content extension, not a mechanics change, and explicitly names the frozen elements it does not affect: routing signal, Consolidator enumerate-only boundary, round-folder discipline, write-then-send.

**Given:** Conservator's preserved dissent that a fourth field *reads as* touching frozen machinery.
**When:** the boundary note is added.
**Then:** the content-vs-mechanics line is fixed in writing at the schema authority.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-1.3 — Frozen mechanics unchanged

**Observable boundary:**
- The routing-signal schema, the Consolidator enumerate-only description, the round-folder discipline, and write-then-send sequencing in `member-protocol.md` (and the Consolidator/round-format references) are byte-unchanged from the pre-change state.

**Given:** the warrant is a content extension only.
**When:** the change lands.
**Then:** no mechanics section is modified.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.1 — Identical warrant instruction in all four advocacy agents

**Observable boundary:**
- Each of `design-committee-{conservator,innovator,pragmatist,purist}.md` carries an instruction to supply the typed+sourced warrant for its load-bearing claim in its Final Position, authored from its own lens, citing `member-protocol.md` § Final Position.
- The instruction text is identical (byte-for-byte) across the four files.

**Given:** the uniform-agent-surface constraint.
**When:** the instruction is added to each agent file.
**Then:** four identical, lens-neutral instructions exist; no per-lens warrant guidance appears.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-2.2 — Researcher agent unchanged

**Observable boundary:**
- `design-committee-researcher.md` is byte-unchanged; it has no warrant field and no warrant instruction.

**Given:** the researcher holds no advocacy load-bearing claim.
**When:** the change lands.
**Then:** the researcher agent is untouched.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.1 — Authority Guard shifts origination → verification

**Observable boundary:**
- The `team-lead.md` Authority Guard warrant test states the team-lead verifies the member-supplied warrant (type fits the claim, source traceable) and demotes to a gap when the member-supplied warrant cannot be verified.
- The text no longer instructs the team-lead to originate a warrant for an unwarranted assertion.

**Given:** v0010 ran the warrant test as origination over un-warranted member input.
**When:** the wording is reworded to verification.
**Then:** the Guard reads as a verification pass over member-supplied warrants, sourcing each warrant from the member's on-disk `## Final Position` (not from the enumerate-only Consolidator output).

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.2 — Self-evaluation check enforces no-origination

**Observable boundary:**
- The `team-lead.md` Authority-Guard self-evaluation warrant-coverage check asks whether every answer-body assertion traces to a member-supplied warrant, and directs that a missing member warrant is demoted to a gap rather than supplied by the team-lead.

**Given:** the self-eval game runs before every packet.
**When:** the warrant-coverage check is updated.
**Then:** the no-origination discipline is enforced at self-eval time.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.3 — Doctrine unchanged

**Observable boundary:**
- count-is-not-a-warrant, the C2 firewall, the C1 audit, strict premise scope, and the three warrant types in `team-lead.md` are unchanged in substance.

**Given:** the realignment doctrine is settled and must not regress.
**When:** the origination→verification reword lands.
**Then:** only the origination/verification framing moves; the doctrine stands.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-3.4 — team-lead.md version bump

**Observable boundary:**
- `team-lead.md` frontmatter `version` is `v0011`.
- No other changed file gains or alters a `version` field (member-protocol and the agent files carry none).

**Given:** the Authority Guard behavior changes meaningfully.
**When:** the change lands.
**Then:** team-lead.md is v0011 and the version surface is exactly that one file.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.1 — Locked surfaces and voice spec untouched

**Observable boundary:**
- The locked decision-communication packet format (`artifact-template.md` and the four-block Information Packet Format in team-lead.md) and `util-design-partner-role` are byte-unchanged.

**Given:** these are locked/voice invariants.
**When:** the change lands.
**Then:** none of them is modified.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

### AC-4.2 — 200-word cap and member-authored rule preserved

**Observable boundary:**
- The Final Position 200-word cap and the member-authored rule in `member-protocol.md` are unchanged; the warrant field falls under both.

**Given:** the cap and authorship rule govern the whole section.
**When:** the warrant field is added.
**Then:** no cap change and no authorship exception are introduced.

**Implementing tasks:** (populated by plan-build)

**Decisions:** (populated by execute-write)

<!-- created-at: 2026-06-11T01:28:54Z -->
<!-- produced-by design-specify@v0004 -->
