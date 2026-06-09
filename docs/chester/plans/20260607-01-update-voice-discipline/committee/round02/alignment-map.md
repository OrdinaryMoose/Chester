# Alignment map — round 02 (plan adequacy)

## Question
Is plan-00 sufficient for the size of the voice-discipline refactor — where under-scoped, structurally weak, missing tasks?

## Alignment pattern

**On "executable as written": functionally 4-0 NO.**
- Purist + Innovator: explicitly "not executable as written."
- Conservator + Pragmatist: "shippable *with amendments*" — i.e. they too agree it cannot execute in current form; they differ only on how much change that takes.
- No member defends plan-00 as ready to hand to an implementer unchanged.

**On remedy: 3-1.**
- Targeted amendments to the existing 10-task structure (3): Conservator, Pragmatist, Purist.
- Structural re-decomposition to build-then-verify-per-concern, substitution-engine-first (1): Innovator.

## Full option set (remedy)

1. **Amend the existing 10 tasks in place.** Keep task structure, dependency chain, AC traceability, TDD rhythm. Add fix-steps/code for F1, F2, F3; enumerate F4; record F5 decision. Defended by Conservator, Pragmatist, Purist.
2. **Re-decompose to build-then-verify-per-concern.** Build the generator's substitution engine FIRST as its own task, prove it against a semantic-change-detection test, then author sources against the proven engine, then integrate. Defended by Innovator.
3. (Discarded) **Full rewrite from scratch.** No member advocates this. Discarded — would discard the verified-correct T1 core, T4 discipline map, complete code in T1/T2/T8, and AC-by-task traceability for no gain.

## Cross-cutting finding (independent of remedy choice)

Innovator's ordering hazard is endorsed-by-evidence and is NOT automatically solved by option 1:
- F2 unaddressed → T3 authors a wrong scaffold split → T7 commits semantically-changed member files as the baseline → T8's verify test checks byte-identity *against that wrong baseline* → **the semantic error passes the AC-8.1 gate and is locked in.**
- Therefore whichever remedy is chosen, the updated plan must (a) build + independently test the substitution mechanism before the committed baseline is generated, and (b) ensure the verify/no-semantic-change check is anchored to the pre-refactor agent files, not merely to whatever T7 commits.

## Positions discarded with reason
- Full rewrite — discarded; zero advocates; destroys verified-correct assets.
- "Absorb the HIGH findings at implementation time" — discarded; Pragmatist + Purist both rule it out ("a subagent cannot debug a set -u crash from incorrect code"; "a plan that requires reading the threat report to produce working code is not an executable plan").

## Post-position convergence (peer-DM, after Final Positions filed)

The four written Final Positions all framed the F2 fix as the threat report did — "add a placeholder/substitution mechanism to the generator." In peer-DM exchange after filing, all four converged on a **cleaner fix that supersedes that framing**:

- **F2 remedy = redraw the scaffold/lens boundary, NOT add a substitution engine.** Move all lens-woven text (Phase Contract labels, Hard Prohibitions items 2-4, Output-Format template labels, and the lens-adapted Stance elaborations) entirely into the per-lens source files. The member-scaffold then holds only genuinely shared text. Plain section-concatenation reproduces every member file with no `{{Lens}}` placeholder pass.
- **Generator core (T1) stays unchanged** — no substitution mechanism is added. This dissolves the granularity question (substitution-step-in-task vs up-front-engine-task): there is no substitution.
- **Compositional basis (Purist, uncontested):** scaffold-vs-lens is "two different things, two sources" — a clean section/fragment boundary, not a dirty split needing runtime token replacement.
- **This also supersedes the threat report's stated F2 fix.** The threat report prescribed a `{{Lens}}` placeholder pass; the committee's boundary-redraw is cheaper and cleaner and is what round 2 should write.
- **Amendment set converged (4-0 after DM):** correct T3's partition guidance (lens-woven bands → lens files); fix T7 manifest fragment for members (drop the generic-Stance extraction; scaffold + lens fragments only); fix T2 `$tmpl_abs` (F1); fix T5/T10 test convention (F3); enumerate F4's second convergence; record F5 = flat-alphabetical. Purist adds a sixth: a T3 partition-correctness check. T1 generator core untouched.
- **F5 = flat-alphabetical (option a)** — converged, cost-priced by Pragmatist; matches the team-lead lean.

### Final reconciliation (settled for team-lead — CORRECTED per Pragmatist + Purist; supersedes a team-lead mis-record)

The boundary-redraw is a clean two-column split: shared scaffold vs per-lens files. ALL lens-varying text moves into the lens files; the generator does pure section-concatenation; T1 is genuinely unchanged. There is NO stitch and NO substitution of any kind. (An earlier team-lead draft of this section wrongly introduced a "scoped Stance stitch"; the committee explicitly rejected that — it reintroduces the very mechanism complexity boundary-redraw was chosen to eliminate.)

- **Lens files carry, verbatim, everything that varies per lens:** Phase Contract labels, Hard Prohibitions items 2-4, Output-Format template labels, AND the full interleaved Stance block (all five generic-principle + lens-elaboration pairs, copied verbatim from the current member files).
- **Member generation does NOT extract from `util-design-partner-role` at all.** The prior plan's Task 7 manifest fragment that pulled the generic Stance section from `util-design-partner-role` is dropped entirely.
- **Single-source is preserved by the consumer-category distinction (Purist's key point):** `util-design-partner-role` remains canonical for the *design-partner runtime* usage (generic-only form). The lens files carry the *interleaved* form as a display artifact — they are NOT a claimed canonical source of the generic principles, so there is no single-source violation. The generic principles appear in the lens files only as display context for each lens elaboration.
- **T1 generator: unchanged. Pure concatenation. No substitution pass, no stitch.**
- **Partition-correctness test (Purist's sixth edit):** a test asserts the scaffold/lens boundary is clean — scaffold holds only genuinely shared text, lens files hold all lens-owned text. This boundary guarantee is what makes the byte-identity verify gate trustworthy.

### Unresolved fork — what to do with structurally-parallel labels (Phase Contract + Output-Format template labels)

Settled: Stance block → lens files verbatim, no stitch, confirmed 4-0.

Open: the Phase Contract labels and Output-Format template labels are structurally identical across members — only the lens name varies (e.g. "<Lens> — response", "from <Lens> lens"). Both forks pass the partition-correctness test; they disagree on what to do with bands that pass it:

- **Fork A — scaffold + `{{Lens}}` substitution (Conservator):** these parallel labels live ONCE in the shared scaffold with a `{{Lens}}` placeholder; T1 gains a substitution pass that fills each member's lens name from a manifest token. DRY on the label template (change the response-template format once, not four times). Cost: T1 gains a permanent substitution mechanism + per-member lens token in the manifest (~3 artifacts of mechanism).
- **Fork B — lens-verbatim, pure concatenation (Purist + Innovator; Pragmatist's "T1 no amendment needed" aligns):** these labels move into the lens files verbatim like all other lens-varying text; T1 stays pure concatenation, no substitution, no manifest lens token. Cost: the tiny label template is authored four times (once per lens file) — but each lens file is per-lens anyway, so the duplication is of a rarely-changing structural label.
- **Alignment: RESOLVED 4-0 toward Fork B.** Conservator conceded to Purist ("Conservator accepts verdict; round complete"); Phase Contract + Output-Format labels go to lens files verbatim; no T1 substitution pass.
- **Decides:** T1 is pure concatenation. No substitution mechanism anywhere in the generator. This is now committee-unanimous, not a designer-gated split.

<!-- team-lead note: fork closed 4-0 to Fork B during deliberation. The verdict's "T1 unchanged / pure concatenation" is now the unanimous committee position. No open committee splits remain. -->

## Convergence count
- Plan-00 not executable unchanged: 4-0.
- F1/F2/F3 must be fixed at plan time, not implementation time: 4-0.
- Remedy = amend vs re-decompose: 3-1.
- Ordering hazard (baseline-lock-in) is real: endorsed by Innovator, uncontested by peers.

<!-- created-at: 2026-06-07 -->

<!-- created-at: 2026-06-08T09:03:36Z -->
<!-- produced-by design-committee@v0018 -->
