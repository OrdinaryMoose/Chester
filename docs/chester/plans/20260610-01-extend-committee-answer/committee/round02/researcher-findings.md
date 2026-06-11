# Researcher — prior-art findings (verbatim, abridged) — round02
# Sub-sprint: 20260610-01-extend-committee-answer · HEAD (worktree branch)

---

## Finding 1 — Final Position schema: verbatim fields, 200-word cap, member-authored rule, single-authority language

Source: `skills/design-committee/references/member-protocol.md` § Final Position (lines 71–101)

Verbatim quote (lines 71–101):

> Every member transcript ends with a section under the exact header
> `## Final Position`. It is the **last section of the transcript** and the only
> part any downstream step reads to learn what the member concluded. This section
> is the **single authority for the Final Position schema** — the consolidator,
> the team-lead, the round-format reference, and the annotated artifact all cite
> this section rather than restating its fields.
>
> Requirements:
>
> - **Exact header** — `## Final Position`, spelled exactly, so downstream steps
>   locate it structurally.
> - **Last section** — nothing follows it in the transcript.
> - **200-word cap** — the whole section is at most 200 words.
> - **Member-authored** — the member writes every field; no other role composes or
>   edits it.
> - **Schema** — exactly these three fields:
>
> ```
> {position, rationale, blocking_risk}
> ```
>
> - `position` — the option the member lands on, named by what it does
>   structurally.
> - `rationale` — why, from the member's lens; a few sentences.
> - `blocking_risk` — the member's own ~20-word articulation of the hardest
>   objection to the options it did *not* choose. It is the member's reasoning in
>   its own words, **not a label and not a paraphrase** of someone else's point.
>
> No other file restates these fields. Downstream steps read this section directly.

DECISIVE — line 77: "This section is the **single authority for the Final Position schema**" — establishes this section (§ Final Position in member-protocol.md) as the content surface that owns all schema decisions. Any change to the schema fields — adding a fourth field, folding a requirement into an existing field — must land here and only here.

---

## Finding 2 — Routing signal schema and Consolidator enumerate-only boundary

Source: `skills/design-committee/references/member-protocol.md` § Routing signal (lines 18–46)

Verbatim quote (lines 27–46):

> The signal is exactly these four fields and no others:
>
> ```
> {member, status, round, transcript}
> ```
>
> - `member` — the member's role (e.g. `conservator`, `researcher`).
> - `status` — `done` (transcript written, `## Final Position` present) or
>   `blocked` (the member could not complete; the transcript states why).
> - `round` — the zero-padded round number the signal belongs to.
> - `transcript` — the round-folder path to the member's transcript
>   (`committee/roundNN/<member>-transcript.md`, or
>   `committee/roundNN/researcher-findings.md` for the researcher).
>
> These four fields are the whole body. There is **no free-text field** — no
> headline, no summary, no argument. A signal carrying any field outside this
> schema, or omitting one, is **malformed**: the team-lead rejects it unread and
> issues one correction prompt, and the member re-sends a conforming signal. The
> argument never travels in the signal; it lives in the transcript and is
> consolidated only through `## Final Position`.

Consolidator enumerate-only boundary — source: `skills/design-committee/references/team-lead.md` § Per-Round Flow, step 4 (line 103):

> The Consolidator reads only each transcript's bounded `## Final Position`
> section (the last section, schema per `references/member-protocol.md` § Final
> Position) — never the full transcript body — and writes
> `committee/roundNN/consolidator-output.md`, an enumerate-only artifact (alignment
> count, one-line per-member summaries, verbatim notable quotes).

What a fourth field WOULD touch: the Consolidator reads the bounded `## Final Position` section; it enumerates whatever fields are present there. A fourth `warrant` field in the schema would be visible to and enumerated by the Consolidator.

What a fourth field WOULD NOT touch: the routing signal schema is entirely separate — `{member, status, round, transcript}` — a new schema field adds no routing-signal field. The signal carries only the pointer; the substance lives on disk in the transcript.

---

## Finding 3 — How each advocacy agent frames the member's job (advocate / "position you defend" stance language)

All four advocacy agents carry the same structural framing. Quoted per file:

**Conservator** — `agents/design-committee-conservator.md` line 8:
> **Conservator** member, dispatched from `design-committee`. Job: advocate Conservator position in four-member deliberation team for ad-hoc design consultation. Committee Conservator **discusses design alternatives, architecture suggestions, "how might we" framing** — design opinion within lens = whole point of Committee work.

**Innovator** — `agents/design-committee-innovator.md` line 8:
> **Innovator** member, dispatched from `design-committee`. Job: advocate Innovator position in four-member deliberation team for ad-hoc design consultation. Committee Innovator **discusses design alternatives, architecture suggestions, "how might we" framing** — design opinion within lens = whole point of Committee work.

**Pragmatist** — `agents/design-committee-pragmatist.md` line 8:
> **Pragmatist** member, dispatched from `design-committee`. Job: advocate Pragmatist position in four-member deliberation team for ad-hoc design consultation. Committee Pragmatist **discusses design alternatives, architecture suggestions, "how might we" framing** — design opinion within lens = whole point of Committee work.

**Purist** — `agents/design-committee-purist.md` line 8:
> **Purist** member, dispatched from `design-committee`. Job: advocate Purist position in four-member deliberation team for ad-hoc design consultation. Committee Purist **discusses design alternatives, architecture suggestions, "how might we" framing** — design opinion within lens = whole point of Committee work.

Pattern: all four use identical framing — "advocate [Lens] position", "design opinion within lens = whole point of Committee work." No file currently mentions a warrant or evidence requirement on the member's position itself.

Lens-specific stance language (representative quotes showing each member's position is inherently advocacy-based):

- Conservator, line 22: "Frictions described as universal often turn out local; status quo = default unless evidence demands otherwise."
- Innovator, line 21: "Friction inside existing structure often = signal structure is wrong shape for current goal."
- Pragmatist, line 17: "Benefit must be named in concrete terms — benefit no one will use this year not worth cost paid this year."
- Purist, line 20: "Composition is the test: option earns place when result composes cleanly with surrounding shapes."

None of these frames includes a typed-warrant requirement on the member's rationale field.

---

## Finding 4 — How the researcher agent file is already warrant-shaped (evidence-citation discipline)

Source: `agents/design-committee-researcher.md`

Verbatim quote, lines 16–17 (Codebase research):
> Use `Read`, `Glob`, `Grep` aggressively; report findings with file:line citations.

Verbatim quote, lines 42–45 (Voice Discipline / C1 and C2):
> **C1 (Externalized Coverage).** Cite sources. Finding without citation = un-externalized premise.
> **C2 (Fact Default with Marked Departures).** Findings grounded in source = Facts. Inferences from absence (e.g. "no prior brief on this") = `Assumption:` if search wasn't exhaustive. Recommendations out of scope; one slips out → strip before sending.

Verbatim quote, line 50 (Output Format — instruction for findings file ending):
> Write the result block(s) below to `committee/roundNN/researcher-findings.md`, ending with a `## Final Position` section (the researcher's `position` is "no design opinion"; `rationale` names what the findings establish; `blocking_risk` is "none — research role holds no advocacy"). Then send the team-lead the typed routing signal…

Verbatim quote, line 23 (Absence findings):
> **Absence findings.** Surface what is *not* in project as first-class result — "no prior brief explicitly chose this convention", "no decision record on this trade-off", "pattern established by public surface but never named".

The researcher is already structured to produce typed, sourced, file:line-cited evidence. Its C1 rule ("Finding without citation = un-externalized premise") is the closest current analog to a warrant requirement. The four advocacy agents carry no equivalent citation discipline.

---

## Finding 5 — Authority Guard warrant-test wording in team-lead.md (originate vs. verify) and which downstream steps read `## Final Position`

**Authority Guard warrant-test wording:**

Source: `skills/design-committee/references/team-lead.md` § Internal Discipline / Consolidation Rules, Authority Guard (lines 319–325):

> **Warrant test.** Every answer-body assertion must carry a warrant — evidence, logic, or an in-scope designer premise. An assertion with no warrant is not written as answer content; it is demoted to a gap. Assert only what can be warranted; everything else is a gap.

And from Self-Evaluation game (lines 342–343):
> **Authority Guard — warrant coverage.** Does every answer-body assertion carry a warrant (evidence / logic / in-scope premise)? Any unwarranted assertion → demote it to a gap before sending.

DECISIVE — the Authority Guard warrant-test is on the **team-lead's own answer-body assertions** ("every answer-body assertion must carry a warrant"). The word is "carry" — the team-lead must be able to warrant its own assertions in the alignment map and verdict. The authority guard does NOT require the team-lead to verify that member rationale fields carry typed warrants. The warrant-test operates on team-lead output, not on member input.

**Which downstream steps read `## Final Position`:**

Source: `skills/design-committee/references/member-protocol.md` § Final Position (lines 71–78) names these downstream consumers:
> This section is the **single authority for the Final Position schema** — the consolidator, the team-lead, the round-format reference, and the annotated artifact all cite this section rather than restating its fields.

Source: `skills/design-committee/references/team-lead.md` § Per-Round Flow, step 4 (line 103):
> The Consolidator reads only each transcript's bounded `## Final Position` section

Source: `skills/design-committee/references/committee-analysis-round-format.md`, Consolidator output template (lines 157–158):
> Enumeration over this round's transcripts' Final Position sections. No interpretation, no weighting, no synthesis, no recommendation.

Source: `skills/design-committee/references/team-lead.md` § Per-Round Flow, step 8 (lines 107–108):
> The scribe authors the round's decision-packet artifact — including its `Dissent Record` — consuming member-authored fields per `references/member-protocol.md` § Final Position (the schema lives there; do not restate the field names here).

Summary of downstream readers of `## Final Position`:
1. The Consolidator (reads bounded section, enumerates — step 4).
2. The team-lead (reads Consolidator output, not raw Final Position directly — step 5 and 6).
3. The scribe (consumes member-authored fields for the Dissent Record — step 8).
4. The round-format reference (cites the schema as authority — committee-analysis-round-format.md lines 25–28).

No downstream step besides the Consolidator reads the raw `## Final Position` sections from member transcripts; the team-lead reads the Consolidator's enumeration, not the transcripts directly. The scribe reads via verdict + alignment map + consolidator-output (team-lead.md step 8, line 107).

---

Synthesis (facts): The Final Position schema is declared in member-protocol.md § Final Position as the single authority; it has three fields (`position`, `rationale`, `blocking_risk`); its 200-word cap and member-authored rule are co-located in that same section. The routing signal is a separate four-field schema that does not interact with the Final Position field count. The Consolidator reads only the bounded Final Position section and enumerates — it would enumerate any field present there. The advocacy agents currently have no typed-warrant requirement in their rationale field; only the researcher carries explicit citation discipline. The Authority Guard warrant-test in team-lead.md applies to the team-lead's own answer-body assertions ("every answer-body assertion must carry a warrant"), not to member-submitted rationale fields. The downstream consumers of Final Position are the Consolidator (directly), the scribe (via team-lead artifacts), and the round-format reference (as schema citation authority); the team-lead reads only the Consolidator's enumeration.

---

## Final Position

position: no design opinion
rationale: All findings stated as verbatim quotes with file:line; no design recommendation made. Facts establish where the schema lives, what the Consolidator reads, how advocacy is currently framed, how researcher citation discipline works, and how the Authority Guard warrant-test is scoped.
blocking_risk: none — research role holds no advocacy
