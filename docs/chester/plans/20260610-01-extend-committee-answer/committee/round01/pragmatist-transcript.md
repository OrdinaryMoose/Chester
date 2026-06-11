# Pragmatist — Round 01 Transcript

## Topic

How committee members move from advocacy stance to answer-contribution stance.

## Reading

Consumed: member-protocol.md (Final Position schema), team-lead.md v0010 (Authority Guard, Output Surfaces),
feature brief Thread A, prior-sprint design-00.md Open Threads, pragmatist.md (own contract),
researcher.md (warrant-model reference).

## Position Development

**The problem in concrete terms.**

Team-lead v0010 runs a warrant test at synthesis: every answer-body assertion must carry evidence, logic, or
in-scope designer premise, or it is demoted to a gap. Members currently emit Final Positions structured as
advocacy stance — position-I-defend, rationale, blocking risk. None of those fields name a warrant. The
team-lead must therefore originate warrants for each claim it wants to include in the answer body. That
origination pass is extra work, and worse, it is unverifiable: the team-lead's reconstructed warrant for a
member's claim is not the member's warrant; it may be plausible but wrong, and the member never sees it.
The Authority Guard is doing double duty — originating and verifying — when it should only verify.

**What the researcher shows us.**

Researcher already emits evidence with file:line/source citations as a first-class output discipline. The
researcher's Final Position is non-advocacy ("no design opinion") but its finding-bodies are natively
warrant-shaped. This is the model. The researcher didn't need a new schema; it just needed to cite sources
consistently. The advocacy members need the same discipline applied to their load-bearing claim.

**The simplest sufficient change.**

Add one field to the Final Position schema: `warrant`. The field names (a) the warrant type (evidence /
logic / in-scope designer premise) and (b) the source (citation, inference chain step, or designer statement
that grants the premise). The member already knows its gating fact — the `blocking_risk` field essentially
names what the member thinks the decisive consideration is. `warrant` asks: what makes your load-bearing
claim defensible rather than an assertion?

This is a **content extension, not a schema/routing/mechanics change.** The routing signal shape is
unchanged (four fields: member, status, round, transcript). The Consolidator's enumerate-only boundary is
unchanged — it reads Final Positions from disk and summarizes them; it just now summarizes one more field.
Round-folder discipline, write-then-send sequencing, committee-root resolution — all untouched.

**What I sacrifice.**

Typed warrant subtypes (evidence | logic | designer-premise) add verifiability but also rigidity. A member
that can't cleanly classify its warrant will either pick the wrong type or hedge in ways that reduce
signal. The brief explicitly names this as the open concern: free-text cheap but unverifiable; typed
checkable but rigid. My recommendation: **typed warrant with a mandatory source**. The type tells the
team-lead where to look for verification; the source IS the warrant in verifiable form. A member that has
no source for its load-bearing claim will discover this at write time — that is a feature, not a defect.
That discovery is the warrant test running at the right place.

**Shipping cost.**

Five agent files need one instruction added: "your Final Position must include a `warrant` field naming
type (evidence / logic / in-scope designer premise) and source." member-protocol.md gains one field in its
schema definition section. Consolidator reads one more field — no structural change, just a summary line.
Team-lead.md already documents the warrant test; this change makes it say "verify member-supplied warrant"
rather than "originate warrant." The change surface is narrow and the cost is low.

**What I defend.**

Typed warrant with mandatory source citation. That is the simplest change that makes the Authority Guard
run as verification rather than origination. Free-text warrant (cheaper) is insufficient: the team-lead
cannot verify a warrant whose source is unnamed. No-warrant-field (zero cost) is insufficient: the
origination problem persists. A fully structured warrant schema (more fields, more types) is excessive: the
warrant is load-bearing context for the team-lead, not a formal proof obligation.

**Blocking risk I name for the alternative (free-text warrant or no-warrant).**

Free-text warrant still requires the team-lead to judge whether the member's prose constitutes a real
warrant or a restatement of the claim. Untyped, unanchored warrant text = opinion disguised as evidence.
The origination problem is not solved; it is just moved one field to the right.

---

## Final Position

position: Add a single `warrant` field to the Final Position schema. Field carries two sub-parts — warrant
type (evidence / logic / in-scope designer premise) and source (citation, inference step, or designer
statement that grants premise). Member authors this field alongside position, rationale, blocking_risk.

rationale: Team-lead v0010 Authority Guard must verify member warrants, not originate them. Researcher
already ships natively warrant-shaped output as the model. Typed warrant with mandatory source citation is
the minimum change that makes verification possible — free-text is too weak (team-lead still must judge
whether it constitutes a warrant), and no-warrant preserves the origination problem. Shipping cost: one
instruction in five agent files, one field in member-protocol.md, one summary line in the Consolidator.
Mechanics — routing signal shape, Consolidator enumerate-only boundary, round-folder discipline — unchanged.

blocking_risk: The sole hard objection to this change is that typed warrant adds schema rigidity to a
contract marked C-RIGID. A member unable to cleanly classify its warrant may mistype it or hedge. My
answer: misclassification is surfaced by the team-lead's verification pass; discovering you have no clean
source for your load-bearing claim is the warrant test working correctly, not a defect to prevent.
