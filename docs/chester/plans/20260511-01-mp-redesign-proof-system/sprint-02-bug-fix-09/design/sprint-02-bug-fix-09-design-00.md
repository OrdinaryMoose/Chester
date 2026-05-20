# Vocabulary Discipline Refinement — Design Brief

## Goal

The proof system enforces a vocabulary discipline that fires at the moment an element is being elevated to load-bearing status. The mechanical enforcement compares the element's text against the canonical terms the proof has already fixed and blocks the elevation when a non-canonical form is found. The current enforcement applies uniformly across every element category and matches canonical terms by substring scan; both choices produce unworkable false positives in descriptive prose, where canonical terms naturally appear as common nouns and inflected forms. This sub-sprint refines the enforcement so it matches the kind of prose each element category carries: descriptive categories are exempt from the mechanical check; argumentative categories continue to police case discipline using whole-word matching.

## Prior Art

The live StoryDesigner proof for the build-result-subscription work demonstrates the false-positive problem and the workaround pressure it creates. The arbiter scripts that ingest the proof's vocabulary into the engine wrap the ratify operations in delegation patches that catch the discipline's violation error, inspect the offending element's category, and (for descriptive categories) bypass the check by directly committing the ratification facts that would have been written had the check passed. Three patches stack: a word-boundary guard on the matcher, a self-term skip for term-fixing element bodies, and a cross-term skip for the prose-bearing categories. The category set the operator empirically settled on — term-fixing entries, concerns, risks — informs this sub-sprint's exempt set. The workaround reaches past the proof system's public surface into the engine's fact store to simulate a successful commit; that escape mechanism is the strongest available signal that the discipline's current strictness is unworkable in practice.

The proof system's canonical vocabulary document already carries the authoring rule "use the capitalized noun form" as discipline guidance, in a section dedicated to naming hygiene. The mechanical enforcement of that rule is not currently described in the same document; the new contract gives the enforcement a home next to the rule it enforces.

## Scope

**In scope:**

- The proof system's mechanical vocabulary check is refined so that descriptive element categories are exempt from canonical-term cross-checking, and the check itself uses whole-word matching rather than substring matching.
- The exempt category set is defined: term-fixing entries, concerns, risks, and evidence claims.
- The word-character set used by the whole-word match is defined: letters and digits count as word characters; underscore, hyphen, period, apostrophe, and whitespace all separate words.
- The proof system's canonical vocabulary document is updated so the existing naming-hygiene section describes the mechanical enforcement and names the exempt categories.
- The proof system's test suite is updated to lock the new contract: tests that locked behaviors no longer held by the contract are retired or relocated; new tests are added for the new contract surface.
- All documentation produced or modified by this sub-sprint is written declaratively about the current state, with lineage carried in an end-of-document change log.

**Out of scope:**

- Field-level granularity within an element category. The rationale fields on rules and permissions stay under the strict check along with their statements; not carved out separately.
- Removal of the operator-side wrapper scripts in downstream proofs that currently bypass the strict check. Downstream removes those wrappers on its own schedule once this engine fix lands.
- Other vocabulary-discipline refinements considered during the design conversation but not adopted: per-element-type policy declarations, lexical-variant lists allowing multiple legal forms per canonical term, and demoting violations to frictions for operator disposition rather than blocking ratification.
- Synonym drift detection. The discipline catches case variance only; substituting an entirely different word for a canonical term is invisible to the engine today and remains so.
- Master-plan administrative bookkeeping for this sub-sprint's provenance — the note that this sub-sprint was driven by a field finding from a downstream proof rather than by the cascade-spec-probe is admin work for finish-write-records, not a design commitment.

## Key Decisions

1. **Granularity is by element category, not by field.** Each element category is either fully exempt from the check or fully subject to it. The alternative considered was field-level granularity, where (for example) a rule's statement is checked but its rationale is exempt. Field-level granularity was rejected because it adds configuration surface without addressing a real problem in this sub-sprint's scope; argumentative elements carry argumentative prose end-to-end, and the rare borderline case of an explanatory rationale on a normative element does not justify the cost of the new granularity machinery.

2. **The exempt set is term-fixing entries, concerns, risks, and evidence claims.** These are the categories whose primary text is descriptive — explaining what a term means, what an aspect of the problem is about, what failure modes exist, or what factual context the proof rests on. The first three categories match the operator's empirical workaround in the StoryDesigner proof. Evidence is included defensively for forward safety: it is not approval-gated today, so the lint never reaches it; but a future redesign could make it approval-gated, and adding it to the exempt set now removes a surprise from that future change. The cost of including it today is zero.

3. **The matcher uses whole-word matching with a narrow word-character set.** Letters and digits are the only characters that count as word characters; underscore, hyphen, period, apostrophe, and whitespace all separate words. The alternative considered was the language-default sense, in which underscore counts as a word character. The narrow sense matches the operator's empirical workaround and errs on the side of strictness — if a code-shaped fragment ever slips into argumentative prose, the discipline still catches case violations of the canonical inside it.

4. **The documentation update lands in the existing naming-hygiene section of the canonical vocabulary document.** The section already carries the authoring rule for canonical form; the mechanical enforcement description sits adjacent to the rule it enforces. The vocabulary document names the rule and the exempt categories; it does not describe the matcher specifics (whole-word boundaries, character set), which live in the spec for this sub-sprint. The asymmetry follows the longer-lived versus shorter-lived nature of the two documents.

5. **Documentation discipline: standalone with end-of-document change log.** Every document this sub-sprint produces or modifies describes the current state declaratively, as if always true. Lineage and history live in a change log at the end of each document. Comparative framing — "was X, now Y" — does not appear in the main body of any artifact.

## Constraints

- Code changes are confined to the proof system's enforcement layer and its test suite. The operator-side wrapper scripts in downstream proofs are untouched by this sub-sprint.
- The change is a one-directional relaxation of the existing contract: any element that currently ratifies successfully continues to ratify successfully. Proofs already in the field require no migration.
- The mechanical enforcement remains tied to ratification time. It does not retroactively re-check elements that were ratified before a canonical term was fixed; that is existing behavior and is unchanged.
- The hard boundary rule between the design-proof-system and the proof-MCP within the design-large-task skill is preserved throughout this sub-sprint's artifacts. The brief, spec, plan, and summary all stay within the design-proof-system scope and do not cross.

## Acceptance Criteria

- The engine's vocabulary check exempts the four descriptive categories (term-fixing entries, concerns, risks, evidence claims) from canonical-term cross-checking when an element of one of those categories is ratified.
- The check uses whole-word matching against the narrow word-character set defined above.
- Ratification of an element in an exempt category whose text contains a non-canonical case form of any ratified canonical term completes successfully.
- Ratification of an element in a non-exempt category whose argumentative text contains a non-canonical case form of any ratified canonical term still fails with the existing violation contract.
- Ratification of an element whose text contains an inflection or compound that does not stand as a whole-word match against any canonical term completes successfully, regardless of which category the element belongs to.
- The canonical vocabulary document's naming-hygiene section describes the mechanical enforcement and names the exempt categories.
- All previously passing proofs in the test suite continue to ratify without regression.
- The downstream operator's wrapper-script bypass is no longer required to ratify the proof patterns the wrappers currently protect; downstream verification of removal is downstream's responsibility, not this sub-sprint's.

<!-- created-at: 2026-05-20T10:09:54Z -->
<!-- produced-by design-small-task@v0003 -->
