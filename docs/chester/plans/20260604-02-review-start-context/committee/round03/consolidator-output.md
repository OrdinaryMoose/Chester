# Consolidator Output — Round 03 (ATTACK phase)
# Sprint: 20260604-02-review-start-context
# Date: 2026-06-05
# Produced by: consolidator (enumerate-only synthesis)

---

## 1. Per-section attack outcome

### §3.3 — Stub location (separate file vs heredoc)

**Conservator**
- Attack: T8+T9 are addition-blind. T8 checks corruption-in-place only (existing blocks in stub match SKILL.md source). T9 is a ceiling (stub did not grow unexpectedly). Neither fires when a new mandate block is added to SKILL.md and omitted from the stub. The spec's claim "its sole advantage (no drift) is matched by the §4 verbatim test on a copy" is false for the addition case.
- Also: compact-mandate.md needs a file-existence guard before `cat`; without it session-start silently emits empty context on missing file.
- Verdict: KILLED (for the "as drift-safe as extraction" claim). The T8+T9 addition-blind gap is confirmed by Researcher. Conservator locks: if the team keeps separate file, a bidirectional membership test is required; writing that test requires the same heading-anchor logic extraction uses.

**Innovator**
- Attack: separate file does not earn its keep over inline heredoc. The "reviewable by inspection" argument is mechanical (T8 already does it). The "session-start stays trivial" argument is circular (a 40-line heredoc does not add logical complexity). Separate file adds a path-dependency failure mode (silent empty mandate if file is missing or moved). Heredoc co-locates stub with startup logic, has no path dependency, results in one fewer file.
- Verdict: KILLED (for separate file). Innovator calls for flip to inline heredoc.

**Pragmatist**
- Attack: T8 is implementable (~25 lines for both helper functions + comparison block), the heading-rename failure mode is correct (test fires, not silent). T8 does NOT break the heredoc argument — the draft's "reviewable, less buried" is a style preference, not a correctness argument.
- Position: heredoc is still simpler. Separate file adds one more file and one more `cat` call. "This is a low-stakes fork; the spec should call it and move on."
- Verdict: heredoc preferred, but characterizes the fork as low-stakes / style, not a kill.

**Purist**
- §3.3 two-authority concern: CLEARED. F1 (source-of-truth comment) + F3 (verbatim CI test) together make this single-authority-with-derived-copy, not dual-authority. No kill on §3.3 from Purist. Finding 5 is CLEARED.

**Net §3.3 status:** Conservator kills the "as drift-safe as extraction" claim (T8+T9 addition-blind, confirmed by Researcher). Innovator kills the separate file on path-dependency grounds. Pragmatist holds heredoc as simpler. Purist clears the two-authority concern. Three members (Conservator, Innovator, Pragmatist) hold against separate file.

---

### §3.4 — Stub membership

**Conservator**
- CONCEDE. Block list is structurally correct. Membership disputes (Skill Types / Choosing Between Skills) characterized as minor, both defensible.

**Innovator**
- Attack on "Choosing Between Skills OUT": CONCEDE. Draft is correct — it is a navigation hint, not a behavioral rule. Dropping it saves ~70 tokens with zero behavioral loss. Prior develop-phase inclusion was an error.

**Pragmatist**
- Attack on Skill Types exclusion from develop position: CONCEDE. Post-invocation adaptation failure mode is a real category Red Flags does not cover. Accepts the draft's inclusion.

**Purist**
- Findings 6, 7, 8 on §3.4: ALL CLEARED.
  - Finding 6 (orientation line is rule leakage): CLEARED — orientation line is state context ("housekeeping already complete"), not a behavioral rule.
  - Finding 7 ("How to Access Skills" dangling reference): CLEARED — "In Claude Code: Use the Skill tool." is self-contained, no stripped cross-reference.
  - Finding 8 ("User Instructions" is housekeeping): CLEARED — is behavioral mandate, no external dependency.

**Net §3.4 status:** SURVIVES. All members concede or clear. No active attack remains.

---

### §3.5 — First-run gating (sed-strip mechanism)

**Conservator**
- Attack 2: content-anchored sed range silently breaks on prose edits or heading renames. The boundary between wizard and checks within `## Session Housekeeping` is prose at line 113 (not a heading). Any rewording of that sentence silently breaks the strip; every established-project startup then emits ~700 tokens of dead first-run instructions with no error. Failure mode is invisible (hook exits 0, valid JSON, silent regression).
- Fix proposed (initial): structural anchor — XML comments or sub-heading split in SKILL.md.
- **Revised after Pragmatist peer exchange:** CONCEDED narrow-strip; accepted wide-strip (heading-to-heading `## Session Housekeeping` → `## How to Access Skills`). Rationale: fragility asymmetry (wide-strip anchors are structural headings, stable to prose edits within the block); coherence (checks already absent from compact payload — holding them load-bearing at startup but acceptable absent post-compact is incoherent). Token saving revised upward to ~1,188 per startup/clear.
- Final verdict on §3.5: wide-strip. Spec must pin exact heading anchors (not defer to implementer).

**Innovator**
- Attack: sed-strip is fragile. Confirmed no heading exists between wizard and checks — boundary is prose at line 113. A narrow-strip sed range must anchor on content-anchored indented prose (fragile). Silent failure mode: anchor miss → no-op → wizard fires on established project with no error.
- Proposed cleaner alternative: extract wizard to `references/first-run-wizard.md`; replace inline wizard in SKILL.md with a one-line pointer; session-start uses `cat "$WIZARD_FILE"` gated on `IS_NEW_PROJECT`. Turns fragile sed-strip into clean conditional include with explicit failure (missing file errors loudly).
- Post-Pragmatist peer exchange: accepts wide-strip is viable IF checks are dropped from established-project startup (scope change). Identifies the fork as a SCOPE FORK not a mechanism fork: (1) if spec retains checks at startup → wide-strip drops them (scope change, must re-open conservator's position) → narrow-strip is broken → extraction is the only viable mechanism; (2) if spec drops checks from startup → wide-strip with heading-to-heading is viable and simpler.
- Post-conservator-concession: wizard-extraction argument is MOOT under wide-strip (heading anchors are robust, extraction not needed). Scope fork resolved by conservator conceding wide-strip.
- Final position: wide-strip (scope fork settled by conservator concession).

**Pragmatist**
- Attack: draft's framing is wrong about what to strip. Strips only wizard while keeping checks 0–3 (~492 tokens of bash prose). Checks are "set-once, rarely-broken." Wide-strip (strip ENTIRE Session Housekeeping for established projects) is one clean heading-to-heading sed expression, tested and confirmed.
- Tested heading-to-heading expression directly: `sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'` — produces 207 → 75 lines, `## How to Access Skills` preserved.
- Additional saving from wide-strip: ~492 tokens per startup/clear (checks dropped). Revised total: ~1,188 tokens per established-project startup.
- T3 must invert: "startup + established config → housekeeping ABSENT (checks absent, wizard absent)" — not "checks present, wizard absent."
- Also: spec must provide the exact sed expression (not defer to implementer).
- Post-conservator-concession: wide-strip confirmed. Innovator's wizard-extraction argument MOOT.

**Purist**
- Finding 1 (BLOCKING): §3.5 wizard strip boundary is underspecified. Two interpretations:
  - Option A: strip lines 37–112 (if-none branch body only; keep eval at line 35). Variable coherence intact. But item-1 label "First-run project configuration" now labels a returning-session path (misleading).
  - Option B: strip lines 33–112 (entire item 1 including eval and wizard). Variable coherence BROKEN — CHESTER_WORKING_DIR and CHESTER_PLANS_DIR referenced in checks 0–3 but never set (eval stripped). Silent behavioral failure.
  - Spec does not specify which. Must pin: wizard sub-block = lines 37–112; eval at line 35 is shared preamble, must NOT be stripped.
- Finding 2 (MODERATE): "heading-to-heading" is a false claim. No Markdown headings between lines 29 and 162. The wizard/checks boundary is prose at line 113. Actual anchors would be prose strings, fragile to rewording or formatting changes. Spec must correct "heading-to-heading" to "prose-anchor" and pin exact anchor strings.
- Finding 3 (MODERATE): item-1 label "First-run project configuration" is misleading after wizard strip (Option A result). Model reading this label on an established project may apply first-run framing. Fix: rename item 1 to "Session configuration:" for all emitted bodies.
- Finding 4 (LOW): single-item numbered list is awkward post-strip but not broken.
- [Note: Purist's findings were written against the narrow-strip framing. Under wide-strip (Pragmatist+Conservator convergence), the entire Session Housekeeping block is dropped for established projects — Option A/B is moot, label issue is moot, single-item-list is moot. Findings 1–4 are superseded by wide-strip adoption, but Purist's eval-shared-preamble finding is formally on record.]

**Researcher**
- FALSIFIED: §3.5 heading-to-heading sed strip separates wizard from checks. Wizard and checks share a single `## Session Housekeeping` heading with no sub-anchor. The transition at line 113 is indented (3-space) prose continuation of item 1, NOT a new list item or sub-heading. A heading-to-heading `sed` range on `## Session Housekeeping`..`## How to Access Skills` deletes BOTH wizard AND checks.
- Goal (gate wizard off established projects): VALID. Mechanism needs revision.
- Alternatives enumerated: (a) strip entire `## Session Housekeeping` block — simplest; (b) add new sub-heading to SKILL.md; (c) assemble startup payload by emitting non-housekeeping sections only.

**Net §3.5 status:** KILLED (as drafted). Researcher FALSIFIES the mechanism. Conservator and Pragmatist converge on wide-strip (heading-to-heading, full Session Housekeeping dropped for established projects). Innovator accepts wide-strip once scope fork is resolved. Purist's specific eval-shared-preamble blocking finding is superseded by wide-strip but is on the record as a reference hazard for any future narrow-strip implementation.

---

### §4 / §5 — Drift control (F3) and test plan

**Conservator**
- T8+T9 addition-blind kill-shot (see §3.3 above).
- T8 confirmed: checks copy-fidelity (no corruption-in-place), NOT membership-completeness (no omission). T9 is a ceiling only.
- Kill-shot confirmed by Researcher (T1–T9 exhaustively reviewed; no test takes the form "for each heading in SKILL.md's mandate zone, assert it is present in the stub").

**Innovator**
- §3.6 token estimate correction: draft states "~300 tok off startup" for verification bash collapse. Correction: ~80–100 tokens (Checks 0 and 1 collapse; Checks 2 and 3 verbatim). Pre-correction figure carried into spec.
- F1, F2, F3 (drift control layers): no attack. Keep.

**Pragmatist**
- T8 KEEP: ~25 lines, both helper functions reusable, heading-rename failure mode fires correctly.
- Blank-line formatting note: T8 spec must call out that stub blank-line formatting must exactly mirror SKILL.md block formatting for byte comparison to pass.
- T9 DROP: redundant given T1/T2 absence assertions. Net 9 → 8 tests.
- T3 inverts under wide-strip: "startup + established config → housekeeping ABSENT."
- T6 (clear trigger): justified. T7 (malformed JSON): justified.

**Purist**
- Finding 5 (§3.3 two-authority): CLEARED (see §3.3 above).
- Findings 6–8 (§3.4 composition checks): CLEARED (see §3.4 above).

**Net §4/§5 status:** T8+T9 addition-blind kill-shot CONFIRMED by Researcher. T9 contested (Pragmatist calls DROP; Conservator holds KEEP if separate file retained). T3 inverts under wide-strip. §3.6 token estimate (~300 vs ~80) is a spec accuracy error requiring correction.

---

## 2. FALSIFIED claims (Researcher markings)

**FALSIFIED — §3.5 heading-to-heading sed mechanism:**
The spec §3.5 claims the wizard strip uses a "content-anchor sed range (heading-to-heading)." FALSIFIED. No Markdown heading separates wizard from checks within `## Session Housekeeping`. The wizard/checks boundary at line 113 is a 3-space-indented prose conditional, not a heading. A heading-to-heading sed range on `## Session Housekeeping`..`## How to Access Skills` deletes BOTH wizard AND checks — it cannot strip only the wizard.

No other claims were marked FALSIFIED by Researcher. Additional claims assessed:
- §2 trigger field, jq idiom, frontmatter strip: DECISIVE (HOLDS).
- §3.4 ~750 tokens / ~2,991 bytes: HOLDS (3,004 bytes / 751 tokens, within rounding).
- §6 skill-index cleanup at 0e79b85: DECISIVE (HOLDS).
- §6 ~696 tok wizard saving: HOLDS exactly.
- `/clear` trigger value: UNCONFIRMED but low risk (conservative branch still emits correct payload).

---

## 3. §3.5 three-way mechanism split

The three proposed mechanisms for first-run gating and who holds each position:

**Wide-strip (heading-to-heading, entire Session Housekeeping dropped):**
- Pragmatist: originates and holds. Tested expression: `sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'`. Confirmed 207 → 75 lines.
- Conservator: CONCEDED to wide-strip after peer exchange. Rationale: fragility asymmetry (wide-strip anchors are structural headings, stable to prose rewording); incoherence argument (checks absent from compact, incoherent to hold them load-bearing at startup).
- Innovator: accepts wide-strip once scope fork (checks-at-startup) is resolved by conservator concession. Wizard-extraction argument declared MOOT under wide-strip.

**Wizard-extraction (extract wizard to references/first-run-wizard.md, use conditional include):**
- Innovator: originates and holds as primary attack on §3.5. Eliminates sed fragility entirely. Checks-at-startup preserved under this path. Declared MOOT under wide-strip adoption.
- Pragmatist: concedes extraction is valid under narrow-strip path. Holds that wide-strip is simpler and trades sed fragility for a two-file sync problem (wizard file must track SKILL.md prose evolution).

**Narrow-strip (prose-anchored sed, keeps checks, strips only wizard):**
- No member holds narrow-strip at round03 close. Conservator abandoned it after peer exchange. Innovator's extraction proposal was offered as the only viable mechanism IF narrow-strip scope (checks-at-startup) is required.

**Open trade-off explicitly named (checks-on-established-startup):**
Innovator explicitly identifies this as a SCOPE FORK not a mechanism fork:
- If checks must survive at established-project startup → wide-strip is off the table; narrow-strip is mechanically broken (no clean anchor per Researcher FALSIFIED); extraction is the only viable mechanism.
- If checks can be dropped from established-project startup → wide-strip with heading-to-heading anchors is viable, simpler, no new file.
- Conservator's concession closes this fork in favor of wide-strip (checks dropped).

---

## 4. One-line-per-member position

**Conservator:** T8+T9 are addition-blind (kill-shot on §3.3 separate-file claim); §3.5 wide-strip correct after peer exchange (fragility asymmetry + coherence argument); spec must pin exact anchor expressions; Check 2 verbatim-keep omission is a spec accuracy error.

**Innovator:** §3.3 flip to heredoc (separate file adds path-dependency failure mode); §3.5 wizard-extraction is cleanest mechanism but MOOT under wide-strip; the §3.5 decision is a scope fork (checks-at-startup or not) that must be made explicitly before mechanism is settled.

**Pragmatist:** wide-strip entire Session Housekeeping for established projects (clean heading-to-heading expression, ~1,188 token saving, T3 inverts); T9 is redundant; T8 keep at ~25 lines; spec must provide the exact sed expression rather than deferring to implementer.

**Purist:** §3.5 blocking gap is that the spec does not pin the strip boundary (eval shared preamble must not be stripped — Option B produces dangling variable refs); "heading-to-heading" is a false mechanism label (anchors are prose, not headings); item-1 label is misleading after strip; §3.3 two-authority concern cleared; §3.4 composition checks cleared.

**Researcher:** §3.5 heading-to-heading mechanism is FALSIFIED (no anchor between wizard and checks exists); T8+T9 addition-blind gap is confirmed (no test in T1–T9 asserts membership-completeness); all other spec claims HOLD or are low-risk unconfirmed.

---

## 5. Verbatim notable quotes

**Conservator — T8+T9 addition-blind kill-shot (§3.3):**
> "T8 has no mechanism to ask 'is there a mandate block in SKILL.md that is absent from the stub?' — it only checks what it finds in the stub."
> "The draft's §3.3 claim — 'its sole advantage (no drift) is matched by the §4 verbatim test on a copy' — is FALSE for the addition case."
> "CI is entirely green. Post-compaction sessions run without `## Skill Invocation Discipline`. Silent behavioral gap in the mandate. No alarm fires."

**Conservator — wide-strip concession after peer exchange:**
> "Holding that they must be present on startup but are acceptable absent on compact is incoherent. The ~492 token saving from dropping them on established-project startup is real and the fragility cost of the narrow-strip is also real."

**Pragmatist — T8 feasibility verdict:**
> "T8 is implementable but costs ~25 lines, and it has one real brittleness."
> "Heading rename in SKILL.md (e.g. `## The Rule` → `## The Mandate`): T8 silently returns empty for that block, comparison fails — TEST FIRES. This is correct behavior."

**Pragmatist — wide-strip tested result:**
> "`sed '/^## Session Housekeeping/,/^## How to Access Skills/{/^## How to Access Skills/!d}'` — This works: 207 → 75 lines, `## How to Access Skills` preserved."

**Researcher — structural falsification of the sed anchor:**
> "The `If \`CHESTER_CONFIG_PATH\` is not \`none\`` line at 113 is INDENTED (3 spaces) — it is the `else` branch of the same prose conditional that started the wizard. It is NOT a new list item or sub-heading."
> "No content anchor exists in the file today that separates wizard from checks within Session Housekeeping."
> "The spec's §3.5 mechanism is FALSIFIED as stated."

**Purist — eval-shared-preamble finding:**
> "**Option B: strip lines 33–112** (entire item 1 including eval and wizard) ... Variable coherence: **BROKEN.** CHESTER_WORKING_DIR and CHESTER_PLANS_DIR are referenced in checks 0–3 but never set — the eval was stripped."
> "The spec must pin the strip boundary to lines 37–112 (the if-none branch body), explicitly preserving the eval at line 35 as shared preamble."

**Innovator — scope fork declaration:**
> "This is a scope fork, not a mechanism fork. The team-lead should decide: are the verification checks required at established-project startup, or can they be dropped? That decision settles the mechanism automatically."

---

## 6. Enumerated divergence points still open

The following items remain unresolved or contested at round03 close. Per-item, the positions are enumerated without weighting.

**OPEN-1 — §3.3 stub location: separate file vs heredoc**
- Conservator: separate file has a T8+T9 addition-blind gap; if kept, requires bidirectional membership test.
- Innovator: heredoc (no path-dependency failure mode; separate file adds maintenance surface without correctness gain given T8).
- Pragmatist: heredoc (simpler; "low-stakes fork, spec should call it and move on").
- Purist: §3.3 two-authority concern cleared; no position stated on file-vs-heredoc choice.
Three members hold heredoc. Conservator's objection is to the "as drift-safe as extraction" spec claim (not to the file-vs-heredoc choice per se), conditional on bidirectional test if file is kept.

**OPEN-2 — §3.3 / §5 T8+T9 addition-blind gap: resolution path**
- Conservator: requires bidirectional membership test (SKILL.md mandate set == stub set) if separate file is kept, OR adopt extraction.
- Pragmatist: T8 keep as-is (~25 lines, catches corruption-in-place, heading-rename fires correctly). No call for bidirectional test. Implicit: the addition-blind gap is accepted if heredoc is adopted (T8 is still useful for what it does).
- Innovator: no explicit position on bidirectional test; attack is on separate-file not on T8 scope.
- Purist: no position on T8 scope.
Positions differ on whether T8 as specified is sufficient or requires scope extension.

**OPEN-3 — §5 T9 (size ceiling): keep vs drop**
- Pragmatist: DROP — redundant given T1/T2 absence assertions.
- Conservator: no explicit drop position; held T9 as useful in the original attack.
- Innovator: no explicit position on T9 at round03 close.
- Purist: no position.
Fork is Pragmatist vs no-clear-opposition from others.

**OPEN-4 — §3.6 verbatim-keep list: Check 2 inclusion**
- Conservator: Check 2 (`! git check-ignore -q`) must also be kept verbatim (exit-code semantics + grep-substitution risk). §3.6 as drafted only specifies Check 3's sed delimiter idiom. Token saving figure is wrong (~300 tok vs ~80 tok for Check 1 only).
- Innovator: corroborates token figure correction (~80–100 tokens, not ~300).
- Pragmatist: no explicit position on Check 2 verbatim-keep.
- Purist: no position.
Conservator and Innovator hold the correction; no member disputes it.

**OPEN-5 — §3.5 exact sed anchor specification vs implementer deferral**
- Pragmatist: spec must provide the tested expression (heading-to-heading, confirmed working). Cannot defer to implementer.
- Conservator: agrees anchor must be specified in spec (not deferred). Wide-strip expression named.
- Innovator: agrees spec must pin the mechanism choice explicitly.
- Purist: agrees anchor strings must be pinned (Finding 2 MODERATE).
All members agree spec must not defer. The specific expression (wide-strip heading-to-heading) has been confirmed tested by Pragmatist. Not a divergence — a convergent fix required.

**OPEN-6 — §3.4 `# Using Skills` H1 inclusion in stub**
- Researcher: structural note — `# Using Skills` H1 at line 166 sits between `## How to Access Skills` and `## The Rule`. Whether to include it in the stub must be pinned by the spec. Both options noted as valid by Researcher.
- No member took a position on this inclusion in round03 transcripts.

**OPEN-7 — Purist Finding 3 (item-1 label misleading after wizard strip): status under wide-strip**
- Purist: item-1 label "First-run project configuration" is misleading after Option A wizard strip. Fix: rename to "Session configuration:".
- Pragmatist + Conservator convergence on wide-strip drops the entire Session Housekeeping block from established-project startup — the label issue is moot under wide-strip (the block is not emitted at all). Under new-project startup the label is accurate.
- Whether a SKILL.md label fix is still required for any established-project emitted payload path: depends on whether any future narrow-strip path is considered.

<!-- produced-by: consolidator / round03 / 2026-06-05 -->
