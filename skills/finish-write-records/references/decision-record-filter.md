# Decision Record Discrimination Filter

The records-fork applies this filter over the session JSONL transcript at `finish-write-records` Step 3. Independent of the audit-altitude filter in `record-formats.md` — a decision selected by one need not be selected by the other.

## What qualifies as a record-worthy decision

A decision belongs in the cross-sprint record when it has any of these signals:

- **Cross-sprint precedent.** The decision sets a convention or pattern that future sprints will likely consult ("we decided to do X this way, future work should follow / override deliberately").
- **Architectural commitment.** A choice between structural alternatives whose reversal would require non-trivial future work — directory layout, file format, integration boundary, naming convention.
- **Constraint adoption.** A new rule that binds future implementations ("no MCP", "append-only", "single-file corpus").
- **Capability deletion or deprecation.** Removing a feature, system, or path that future agents must know is gone.
- **Substantive rejection.** An alternative that was seriously considered and rejected with rationale that future agents may need ("we tried Y, it broke for reason Z").

## What does NOT qualify

- **Mechanical execution choices.** "Use sed to remove these lines" — implementation hygiene, not precedent.
- **Routine debugging decisions.** "Fixed typo in line 42" — code-state, not cross-sprint signal.
- **Style or formatting preferences.** "Use bullets, not tables" — captured in feedback memory or coding conventions, not records.
- **In-session navigation.** "Read file X first" — session-internal, not cross-sprint.

## Canonical tag list

When assigning the `tags` field, use a tag from this list when it fits the decision's domain. Add new tags only when no existing tag matches; new tags must be added to this list in the same emission pass.

- `architecture` — structural commitments
- `convention` — naming, formatting, layout rules
- `mcp` — MCP-server choices (use, removal, replacement)
- `skill` — skill-file structure or behavior
- `revert` — explicit removal of prior mechanism
- `format` — file format / record shape decisions
- `process` — workflow / cadence decisions
- `tool` — tooling choices (test framework, language, dependency)
- `capture` — decision-record-system meta-decisions
- `audit` — audit-system meta-decisions
- `worktree` — worktree / branch management
- `governance` — rules, gates, approval flows

## Record id format

Each record's `id` field follows the format:

```
dr-YYYYMMDD-NN-<slug>
```

- `YYYYMMDD` — emission date
- `NN` — zero-padded sequence number scoped to that emission date (the records fork emits `01`, `02`, ... within a single pass)
- `<slug>` — short hyphenated noun phrase derived from the decision's title (e.g., `fork-pattern-emission`, `mcp-removal`)

Example: `dr-20260501-01-fork-pattern-emission`.

## Supersession discovery

Records are append-only; older records are never modified when superseded. To find what (if anything) supersedes a given record id, awk-scan forward and capture the most recent `id:` value preceding any `supersedes:` line that names the target id:

```bash
awk -v target="dr-<id>" '
  /^id: / { last_id = $2 }
  $0 == "supersedes: " target { print last_id; exit }
' docs/chester/decision-record/decision-record.md
```

The output (if any) is the id of the superseding record. The grep alternative `grep -B1 "^supersedes: dr-<id>$"` does NOT work because YAML field order places `tags:` immediately before `supersedes:`, so `-B1` returns the tags line, not the id. Use awk or `grep -B 12` to scan back far enough to capture the id.

Multiple superseders are possible across time (a chain B → A, then C → B); follow the chain forward to find the current authoritative record. If no match, the queried record is current.

## Output discipline

- One record per substantive decision. Do not emit one record covering five decisions; do not emit five records covering one decision.
- 11 required fields per record (see `record-formats.md` Decision Record Format section). Empty-but-present is acceptable for `supersedes` and `artifact_refs`; all other fields must carry content.
- Append in chronological order within the emission pass (oldest decision first).
- Do not modify any record that already exists in the corpus.
