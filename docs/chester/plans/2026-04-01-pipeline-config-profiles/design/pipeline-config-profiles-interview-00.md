# Interview Transcript — Pipeline Config Profiles

**Date:** 2026-04-01
**Sprint:** 2026-04-01-pipeline-config-profiles

---

**Problem Statement (confirmed):** Chester's pipeline — the sequence Design → Plan → Execute → Finish — needs to become an explicit, configurable data structure rather than prose hand-offs scattered across skill files. The current design makes the pipeline invisible and rigid; the goal is to enable experimentation with different pipeline shapes without touching skill files.

---

*The conops is deliberate about what constitutes a phase boundary. Design's two-step structure — figure-out then specify — is explicitly called out as internal, not configurable. But the boundary between Plan and Execute is treated as a phase boundary even though execute-write already has an internal planner step.*

*That asymmetry might be intentional — worth understanding what principle distinguishes a phase boundary from an internal hand-off.*

**What makes Design's two steps "internal implementation" while Plan and Execute are separate phases? Is there a principle you're applying, or is it more that Design's steps just haven't needed to be split apart in practice?**

> use the skill titles as the phase boundaries

---

*That's a different model than the conops described. The conops groups figure-out and specify under "Design" and calls their hand-off an internal detail. Using skill titles as phase boundaries means figure-out, specify, plan-build, execute-write, and finish are each independent, configurable slots.*

*That's actually cleaner — no hidden structure inside a phase. But it changes what "skip a phase" means. Skipping "Design" in the conops meant skipping both steps. Now you could skip specify but keep figure-out, or vice versa.*

**Does that mean you want every pipeline skill to be independently nullable — for example, keeping figure-out but skipping specify, or skipping figure-out but keeping specify?**

> no, the groupings of skills define the boundaries. Skip design and write this plan means skipping both interview and specification

---

*OK so the model is: phases are groups of skills, defined by the skill name prefix. Design = figure-out + specify. Plan = build (+ attack/smell). Execute = write (+ test/debug/prove/review). Finish = finish (+ summary/audit). Setting a phase to null skips the entire group.*

*But the conops also talks about "phase replacement" — pointing a profile at a different skill name. That implies the config maps a phase to a skill (or group). If phases are groups, does replacement mean swapping the whole group, or swapping an individual skill within the group?*

**When you say a profile can point to a "new skill implementing a different approach" — does that mean replacing an entire phase group (e.g., a different Design that doesn't use Socratic interview), or replacing an individual skill within a group (e.g., a different specify step but keeping figure-out)?**

> I am envisioning Execute (skill set A) replaced by Execute (skill set B)

---

*So replacement is whole-phase granularity. A profile maps each phase to a skill set, and you swap the entire set — not mix-and-match individual skills across sets.*

*That raises a question about how a skill set is defined. Right now the grouping is implicit in the naming convention. If someone writes an alternative Execute phase, how does the system know which skills belong to it?*

*The more important design question is about what you'd actually want to swap and why.*

**What's the scenario driving phase replacement? Is there a concrete case where you'd want a different Execute or Design, or is this more about keeping the architecture open for future experimentation?**

> or skip entirely

---

*The user keeps steering back to the core value: skip and replace. The replacement scenario is future-looking, not a concrete need today. The immediate value is skip — being able to null out phases for experiments or projects that don't need them.*

*That simplifies the design question. Replacement falls out naturally if the config maps phases to skill sets. But skip is what needs to work well now.*

**When Design is skipped — say you already have a spec from another source — what does the pipeline's entry point look like? Does the user just point at a document, or does some skill still need to ingest and validate the input?**

> yes, or that the step may not be necessary for whatever reason

---

*The user is answering the "why skip" question, not the "what happens when you skip" question. They're saying: sometimes a phase just isn't needed — not necessarily that there's a substitute artifact.*

*So the pipeline needs to handle two skip scenarios: (1) artifact exists from another source, (2) phase is genuinely unnecessary. In both cases, pipeline advances to the next active phase.*

*This means artifact contracts can't be mandatory between every pair of phases.*

**If both Design and Plan are skipped, Execute would start with just the user's request — no spec, no plan. Is that a valid configuration, or should the pipeline enforce that certain phases can't all be skipped together?**

> hmmm, more complicated than I want right now. keep everything like it is.

---

**Session ended by user.** Design discovery surfaced that the artifact contract and skip-validation questions add complexity beyond what's wanted right now. Pipeline configuration deferred.
