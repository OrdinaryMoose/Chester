  /btw we have a complex system. is there a way to run simulations on to actually test what we are building? Create and dispatch an "Engineer" agent as a temporary member of the committee with this task under a…

    Short answer: yes in principle, but with sharp limits worth naming before any dispatch.

    What "simulation" can mean for this build:

    (No)- Lint behavior simulation — write fixture files (capped files at various word counts, with/without list items, with/without heading anchors, schemas with/without renamed sections), run the proposed lint
    against them, observe pass/fail. This is real testing, not simulation — it's exactly what AC-6.1 through AC-6.4 in the discarded spec already specified.
    (No)- Session-flow simulation — populate a Constraint Envelope / Resolution Criterion / Coverage Map by hand walking through the twelve procedures and five-phase lifecycle against the worked template. Surfaces
    whether the schema actually composes into a runnable session shape. The design-brief-template.md already does a minimal version of this.
    (Yes)- Drift simulation — author a deliberate schema-heading rename, then check whether capped-file cites still resolve under each candidate lint regime. Directly tests the Camp X vs Camp Y trade-off the
    committee just split on.
    (No)- End-to-end skill-invocation simulation — actually invoke the proposed chester:design-architect-committee skill against a toy architectural question, see if the Clerk role works mechanically without LLM
    judgment, see if the team-lead session-close packaging produces a clean handoff. This is the most valuable kind but it depends on the Clerk script + dispatch convention sub-sprints that are out of scope for
    the current build.

    An Engineer agent fits the third category best. Build fixtures, run the candidate lints, write empirical findings on which proposed mechanism actually catches which drift class. Output is fact-grounded data
    the committee can vote against, not just lens-driven opinion.

    Pattern for adding a temporary member to an existing team:

    - Spawn via the Agent tool with team_name: design-committee-spec-vs-design-review and name: engineer. Existing team members auto-discover the new member through the team config file.
    - Convening message authorizes the engineer to read files, run bash (the lint candidates), and write findings only to conversation record — same prohibition as researcher (no design opinion, no proof-state
    mutations, no team-lead role-play).
    - Team-lead routes engineer's outputs to the four poles; poles factor empirical findings into a revised round.

    Sharp limits to name:

    (designer authorizes temporary members of the committee to be purpose added as needed.  This needs to be recognized in the base skill)- Engineer is a non-canonical role for design-committee. The general SKILL.md defines six roles (team-lead, four poles, researcher). Adding an Engineer is a Mode B overlay via convening message — legal under floor-not-ceiling, but it's a new role for this sprint only, not a precedent for the general primitive.
    
    (Not a permanent member, no registry required) - Subagent_type for the engineer needs to exist in the registry. The chester:design-committee-* family exists for poles and researcher; no engineer agent file ships with the skill. Either spawn as general-purpose with full role instructions in the prompt (clean fallback) or write a new agents/design-committee-engineer.md (heavier, durable change).

    (simulation is meant to inform the designer) - Empirical findings only force a vote re-think if the committee was wrong about facts. If the split is values-based (precautionary principle vs. mechanical-gain principle), simulation evidence settles less than it appears.

    (Yes, do this) The right move here: spawn the engineer as general-purpose with full Researcher-style discipline (no design opinion, write to conversation only) plus a focused empirical scope — "build fixtures for the candidate lint regimes, run each, report which drift classes each catches and misses." Then the committee can run another round informed by ground-truth data instead of anticipated trade-offs.
