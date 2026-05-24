# CLAUDE.md Hygiene — Automated Strategy

**Date:** 2026-05-01 (revised same day for automation focus)
**Author:** Mike (with Claude Opus 4.7 synthesis)
**Status:** Action plan — execute as time allows
**Supplements:** `doc-code-alignment-strategy-2026-05-01.md` §4.5 (CLAUDE.md hygiene)

## Design Principle

No step in this plan asks a human to read a volume of files. Every audit, scan, classification, and diff is produced by a script, a fitness test, or a Chester skill. The human role is **ratify or reject machine-generated diffs**, never to perform the analysis.

This shifts the cost model. One-time tooling investment (~10 hours) replaces recurring human attention (~4 hours per sprint indefinitely). After Steps 1-4, the system runs itself; humans see only pass/fail signals and proposed unified diffs.

## Architecture

Three layers of automation:

- **Layer A — Fitness tests** (always-on, CI-gated). Compiled assertions in `Story.Architecture.Tests`. Fail the build on broken `@import`, missing TDR, sprint-reference accumulation past threshold. Zero human input until red.
- **Layer B — Generators** (deterministic, idempotent). CLI tools that emit canonical content from code. `CurrentStateGenerator` is the prototype; concept-index generator and others follow the same pattern. Run on every build or on demand.
- **Layer C — Auditors** (proposal-emitting, human-ratified). CLI tools that scan CLAUDE.md files and emit unified diffs proposing edits. Human reviews the diff, applies or rejects. Never auto-applies.

Each task in this plan slots into one of the three layers. Each is independently invocable.

## Step Sequence Overview

- **Step 1** — `ClaudeMdAuditor` CLI tool with three checks. (Layer C; ~3 hours.)
- **Step 2** — Fitness tests for `@import` and TDR resolution. (Layer A; ~1 hour.)
- **Step 3** — Pre-commit and CI line-cap guard. (Layer A; ~30 min.)
- **Step 4** — `CurrentStateGenerator` tool. (Layer B; ~4-6 hours.)
- **Step 5** — Replace transitional prose in CLAUDE.md (one-shot, agent-driven). (~1 hour, depends on 4.)
- **Step 6** — Chester skill `audit-claude-md` wrapping the auditor. (Layer C; ~30 min, depends on 1.)
- **Step 7** — Wire audit into `finish-write-records` and `execute-verify-complete`. (~30 min, depends on 6.)
- **Step 8** — Scheduled weekly health-report routine. (~30 min, depends on 1, 4.)

Steps 1-4 are independent. Steps 5-8 compose them. Steps 1, 2, 3 deliver standalone regression prevention even if the rest never ships.

## Step 1 — `ClaudeMdAuditor` CLI Tool

**Layer:** C (auditor — proposes diffs).
**Goal:** One CLI with subcommands. Each subcommand performs one audit and emits machine-readable findings + a proposed unified diff. Human reviews diff.

**Prerequisites:** None.

**Procedure:**

- Create `tools/ClaudeMdAuditor/ClaudeMdAuditor.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>StoryDesigner.Tools.ClaudeMdAuditor</RootNamespace>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="System.CommandLine" Version="2.0.*" />
  </ItemGroup>
</Project>
```

- Implement subcommands:

  - `audit imports` — scans every `CLAUDE.md` for `@<path>` references, reports unresolved.
  - `audit tdrs` — scans for `TDR-XXX-NNN` patterns, reports missing TDR files.
  - `audit sprint-refs` — scans for sprint-state phrases (`Sprint [A-Z0-9.]+ post-ship`, `Sprint [A-Z0-9.]+ Phase`, `\[TRANSITIONAL — Sprint`, `pending Sprint`), cross-references `master-plan.md` if present, classifies each match as `closed` (proposed-for-removal), `open` (keep), `unknown` (flag).
  - `audit line-cap [--root-cap 200] [--per-project-cap 100]` — reports any `CLAUDE.md` exceeding cap.
  - `audit all` — runs all subcommands; emits combined report.
  - `propose --check <name> --output <file.diff>` — produces unified diff of proposed edits to stdout or a file.

- Output format: structured JSON for programmatic consumption, plus human-readable summary. Example:

```json
{
  "check": "sprint-refs",
  "files_scanned": 24,
  "findings": [
    {
      "file": "CLAUDE.md",
      "line": 35,
      "match": "Compiler.Contracts current surface (Sprint B2 post-ship)",
      "sprint_id": "B2",
      "sprint_status": "closed",
      "proposed_action": "remove",
      "rationale": "Sprint B2 closed per master-plan.md row N"
    }
  ],
  "proposed_diff": "..."
}
```

- Skeleton implementation outline:

```csharp
// Program.cs entry point — System.CommandLine command tree
var rootCommand = new RootCommand("CLAUDE.md auditor");
rootCommand.AddCommand(BuildAuditCommand());
rootCommand.AddCommand(BuildProposeCommand());
return await rootCommand.InvokeAsync(args);

// Audit/SprintReferenceAuditor.cs
public sealed class SprintReferenceAuditor
{
    private static readonly Regex[] Patterns =
    {
        new(@"Sprint\s+([A-Z0-9.]+)\s+post-ship", RegexOptions.Compiled),
        new(@"Sprint\s+([A-Z0-9.]+)\s+Phase\s+[A-Z]", RegexOptions.Compiled),
        new(@"\[TRANSITIONAL\s+—\s+Sprint\s+([A-Z0-9.]+)\]", RegexOptions.Compiled),
        new(@"pending\s+Sprint\s+([A-Z0-9.]+)", RegexOptions.Compiled),
    };

    public AuditReport Run(string repoRoot, MasterPlan? masterPlan)
    {
        var claudeMdFiles = FindAllClaudeMdFiles(repoRoot);
        var findings = new List<Finding>();
        foreach (var file in claudeMdFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                foreach (var pattern in Patterns)
                {
                    var match = pattern.Match(lines[i]);
                    if (!match.Success) continue;
                    var sprintId = match.Groups[1].Value;
                    var status = masterPlan?.SprintStatus(sprintId) ?? SprintStatus.Unknown;
                    findings.Add(new Finding(file, i + 1, lines[i], sprintId, status));
                }
            }
        }
        return new AuditReport(findings);
    }
}

// Propose/DiffProposer.cs
public sealed class DiffProposer
{
    public string Propose(AuditReport report)
    {
        // Group findings by file
        // For each finding with proposed_action == "remove":
        //   emit unified diff hunk deleting the offending line(s)
        // For each finding with proposed_action == "replace":
        //   emit hunk with replacement (e.g., @import line)
        // Return concatenated diff
    }
}

// Domain/MasterPlan.cs
public sealed class MasterPlan
{
    public static MasterPlan? TryLoad(string repoRoot) { /* find master-plan.md, parse */ }
    public SprintStatus SprintStatus(string sprintId) { /* lookup */ }
}
```

- Add to solution: `dotnet sln StoryDesigner.sln add tools/ClaudeMdAuditor/ClaudeMdAuditor.csproj`.

**Validation:**

- Run `dotnet run --project tools/ClaudeMdAuditor -- audit all`.
- Confirm sprint-refs subcommand finds at least the lines 35-49 of current CLAUDE.md.
- Confirm imports/tdrs subcommands return empty (current CLAUDE.md has no `@import` or `TDR-` references — they will once Step 2 lands).

**Rollback:** Delete `tools/ClaudeMdAuditor/`, remove from solution.

**Estimated time:** 3 hours.

## Step 2 — Fitness Tests for Reference Resolution

**Layer:** A (always-on).
**Goal:** Move `audit imports` and `audit tdrs` into compiled assertions. CI fails on broken reference. No human action required to detect; only to fix.

**Prerequisites:** None (works against current CLAUDE.md even without `@import` lines yet — assertions pass vacuously).

**Procedure:**

- Create `Story.Architecture.Tests/ClaudeMdReferenceResolutionTests.cs`:

```csharp
using System.Text.RegularExpressions;

namespace Story.Architecture.Tests;

[TestFixture]
public sealed class ClaudeMdReferenceResolutionTests
{
    private static readonly string RepoRoot = FindRepoRoot();
    private static readonly Regex ImportPattern = new(@"@(docs/[^\s\)]+)", RegexOptions.Compiled);
    private static readonly Regex TdrPattern = new(@"\bTDR-[A-Z]+-\d{3}\b", RegexOptions.Compiled);

    [TestCaseSource(nameof(AllClaudeMdFiles))]
    public void ClaudeMd_AllImports_ResolveToExistingFiles(string claudeMdPath)
    {
        var content = File.ReadAllText(claudeMdPath);
        var imports = ImportPattern.Matches(content)
            .Select(m => m.Groups[1].Value)
            .Distinct();
        var missing = imports
            .Where(p => !File.Exists(Path.Combine(RepoRoot, p)))
            .ToList();
        Assert.That(missing, Is.Empty,
            $"Broken @import in {claudeMdPath}: {string.Join(", ", missing)}");
    }

    [TestCaseSource(nameof(AllClaudeMdFiles))]
    public void ClaudeMd_AllTdrReferences_ResolveToExistingTdrFiles(string claudeMdPath)
    {
        var content = File.ReadAllText(claudeMdPath);
        var tdrIds = TdrPattern.Matches(content).Select(m => m.Value).Distinct();
        var tdrDir = Path.Combine(RepoRoot,
            "docs", "storydesigner", "Approved", "Requirements Documents", "TDR");
        var existing = Directory.Exists(tdrDir)
            ? Directory.GetFiles(tdrDir, "*.md").Select(Path.GetFileName).ToHashSet()
            : new HashSet<string>();
        var missing = tdrIds
            .Where(id => !existing.Any(f => f!.Contains(id)))
            .ToList();
        Assert.That(missing, Is.Empty,
            $"Missing TDR files for refs in {claudeMdPath}: {string.Join(", ", missing)}");
    }

    private static IEnumerable<string> AllClaudeMdFiles() =>
        Directory.GetFiles(RepoRoot, "CLAUDE.md", SearchOption.AllDirectories)
            .Where(p => !p.Contains("/bin/") && !p.Contains("/obj/") && !p.Contains("/node_modules/"));

    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "StoryDesigner.sln")))
            dir = dir.Parent;
        return dir?.FullName ?? throw new InvalidOperationException("Repo root not found");
    }
}
```

**Validation:** `dotnet test Story.Architecture.Tests` green. Manually inject a broken reference (rename a TDR file temporarily); rerun; expect failure. Revert.

**Rollback:** Delete the new test file.

**Estimated time:** 1 hour.

## Step 3 — Line-Cap Guard

**Layer:** A (always-on).
**Goal:** Hard fail on bloat. No human counts lines.

**Prerequisites:** None.

**Procedure:**

- Add a fitness test alongside Step 2:

```csharp
[TestFixture]
public sealed class ClaudeMdLineCapTests
{
    private const int RootCap = 200;
    private const int PerProjectCap = 100;

    [Test]
    public void RootClaudeMd_LineCount_BelowHardCap()
    {
        var path = Path.Combine(FindRepoRoot(), "CLAUDE.md");
        var lines = File.ReadAllLines(path).Length;
        Assert.That(lines, Is.LessThanOrEqualTo(RootCap),
            $"Root CLAUDE.md is {lines} lines (cap: {RootCap}). Refactor via @import or generator.");
    }

    [TestCaseSource(nameof(PerProjectClaudeMdFiles))]
    public void PerProjectClaudeMd_LineCount_BelowCap(string path)
    {
        var lines = File.ReadAllLines(path).Length;
        Assert.That(lines, Is.LessThanOrEqualTo(PerProjectCap),
            $"{path} is {lines} lines (cap: {PerProjectCap}).");
    }

    private static IEnumerable<string> PerProjectClaudeMdFiles() =>
        Directory.GetFiles(FindRepoRoot(), "CLAUDE.md", SearchOption.AllDirectories)
            .Where(p => p != Path.Combine(FindRepoRoot(), "CLAUDE.md"))
            .Where(p => !p.Contains("/bin/") && !p.Contains("/obj/") && !p.Contains("/docs/"));

    private static string FindRepoRoot() { /* same as Step 2 */ }
}
```

**Validation:** Test passes against current 158-line root file. Inject 100 dummy lines; rerun; expect failure. Revert.

**Rollback:** Delete test class.

**Estimated time:** 30 minutes.

## Step 4 — `CurrentStateGenerator` Tool

**Layer:** B (generator — emits canonical content from code).
**Goal:** Eliminate prose narration of project surface. Replace with always-current generated markdown.

**Prerequisites:** None.

**Procedure:**

- Create `tools/CurrentStateGenerator/CurrentStateGenerator.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Build" Version="17.*" ExcludeAssets="runtime" />
    <PackageReference Include="Microsoft.Build.Locator" Version="1.*" />
    <PackageReference Include="System.CommandLine" Version="2.0.*" />
  </ItemGroup>
</Project>
```

- Implement `Program.cs`. Walks `*.csproj` from solution; emits markdown listing each project, its `ProjectReference` edges, and its top-level public namespaces. Reads `<TransitionalEdge>true</TransitionalEdge>` MSBuild property if present and surfaces it. Idempotent — same code state produces byte-identical output.

```csharp
using Microsoft.Build.Construction;
using Microsoft.Build.Locator;
using System.CommandLine;
using System.Text;

MSBuildLocator.RegisterDefaults();

var solutionOpt = new Option<FileInfo>("--solution") { IsRequired = true };
var outputOpt = new Option<FileInfo>("--output") { IsRequired = true };
var root = new RootCommand { solutionOpt, outputOpt };
root.SetHandler((sln, output) => Generate(sln.FullName, output.FullName), solutionOpt, outputOpt);
return await root.InvokeAsync(args);

static void Generate(string solutionPath, string outputPath)
{
    var solution = SolutionFile.Parse(Path.GetFullPath(solutionPath));
    var projects = solution.ProjectsInOrder
        .Where(p => p.AbsolutePath.EndsWith(".csproj"))
        .OrderBy(p => p.ProjectName)
        .ToList();

    var sb = new StringBuilder();
    sb.AppendLine("# StoryDesigner Project Surface");
    sb.AppendLine();
    sb.AppendLine($"**Generated:** {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
    sb.AppendLine("**Source:** Generated by `tools/CurrentStateGenerator`. Do not edit by hand.");
    sb.AppendLine();

    foreach (var p in projects)
    {
        var root = ProjectRootElement.Open(p.AbsolutePath);
        var refs = root.Items
            .Where(i => i.ItemType == "ProjectReference")
            .Select(i => new {
                Name = Path.GetFileNameWithoutExtension(i.Include),
                Transitional = i.Metadata.Any(m =>
                    m.Name == "Transitional" && m.Value == "true"),
            })
            .OrderBy(r => r.Name)
            .ToList();

        sb.AppendLine($"## {p.ProjectName}");
        sb.AppendLine();
        if (refs.Count > 0)
        {
            sb.AppendLine("**References:**");
            foreach (var r in refs)
            {
                var marker = r.Transitional ? " *(transitional)*" : "";
                sb.AppendLine($"- {r.Name}{marker}");
            }
            sb.AppendLine();
        }

        var projectDir = Path.GetDirectoryName(p.AbsolutePath)!;
        var namespaces = Directory.GetFiles(projectDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("/obj/") && !f.Contains("/bin/"))
            .Select(f => Path.GetRelativePath(projectDir, f))
            .Select(rel => Path.GetDirectoryName(rel))
            .Where(d => !string.IsNullOrEmpty(d))
            .Select(d => d!.Replace(Path.DirectorySeparatorChar, '.'))
            .Distinct()
            .OrderBy(n => n)
            .ToList();

        if (namespaces.Count > 0)
        {
            sb.AppendLine("**Top-level namespaces:**");
            foreach (var n in namespaces) sb.AppendLine($"- `{p.ProjectName}.{n}`");
            sb.AppendLine();
        }
    }

    Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
    File.WriteAllText(outputPath, sb.ToString());
}
```

- For transitional edges that need explanation, mark them in the consuming `csproj`:

```xml
<ProjectReference Include="..\Story.Application.Logic\Story.Application.Logic.csproj">
  <Transitional>true</Transitional>
  <TransitionalRetiresIn>Sprint B3.2</TransitionalRetiresIn>
  <TransitionalReason>Carries ISolutionDirtyStateReader; see TDR-ARCH-150</TransitionalReason>
</ProjectReference>
```

- Generator surfaces these MSBuild-property values in the output. Single source of truth for transitional metadata. When the edge retires, the metadata is deleted in the same commit as the code change. No prose drift.

- MSBuild integration in `Story.Architecture.Tests.csproj`:

```xml
<Target Name="GenerateCurrentState" BeforeTargets="Build">
  <Exec Command="dotnet run --project ..\tools\CurrentStateGenerator -- --solution ..\StoryDesigner.sln --output ..\docs\architecture\current-state.md"
        ContinueOnError="false" />
</Target>
```

- Add a fitness test that asserts `docs/architecture/current-state.md` was generated within the last build (file mtime newer than newest `.csproj` mtime). Catches CI environments where the Exec target was skipped.

**Validation:**

- `dotnet run --project tools/CurrentStateGenerator -- --solution StoryDesigner.sln --output docs/architecture/current-state.md`.
- Inspect output: 23 projects listed, references and namespaces present.
- Add `<Transitional>true</Transitional>` to one ProjectReference; rerun; observe marker in output.

**Rollback:** Delete `tools/CurrentStateGenerator/`, MSBuild target, and `docs/architecture/current-state.md`.

**Estimated time:** 4-6 hours. First version can be 80 lines of code; refinement passes (filtering noise, public-surface analysis via Roslyn) iterate later.

## Step 5 — Replace Transitional Prose in CLAUDE.md (Agent-Driven)

**Layer:** C (one-shot agent task; not recurring).
**Goal:** Bulk replacement of lines 35-49 of root CLAUDE.md, executed as a Claude Code task, not a human edit. Validated by fitness tests from Steps 2-4.

**Prerequisites:** Step 4 complete; `docs/architecture/current-state.md` exists.

**Procedure:**

- Invoke a Claude Code session with the prompt:

```
Read CLAUDE.md. Identify the three transitional-state paragraphs:
- "Compiler.Contracts current surface (Sprint B2 post-ship)..."
- "Compiler current surface (Sprint B2 post-ship, partial)..."
- "Logic → Compiler transitional edge (Sprint B2 Phase C)..."

Replace these paragraphs with a single block that imports the generated
project-surface document:

  ### Project surface and transitional edges

  Current project surface, hosted types, and transitional dependency
  edges are generated at build time from ProjectReference graphs:

  @docs/architecture/current-state.md

  If a transitional edge requires explanation beyond what the generated
  file shows, that explanation lives in the relevant TDR (governance) or
  wiki intent page (rationale), not here.

After editing, run `dotnet test Story.Architecture.Tests` and confirm
green. Run `dotnet run --project tools/ClaudeMdAuditor -- audit all`
and confirm sprint-refs check has no findings on root CLAUDE.md.
```

- Human ratifies the resulting diff before commit. Standard PR review.

**Validation:** All fitness tests green; auditor returns zero sprint-ref findings on root CLAUDE.md; line count drops from 158 to roughly 130.

**Rollback:** Revert the commit.

**Estimated time:** 1 hour for the agent run plus human review.

## Step 6 — Chester Skill `audit-claude-md`

**Layer:** C (interactive auditor wrapper).
**Goal:** Make Step 1's CLI tool invocable via Chester skill so it composes into pipeline workflows.

**Prerequisites:** Step 1 complete.

**Procedure:**

- Identify Chester skill location (`find ~/.claude -name SKILL.md -path '*chester*' | head`).
- Create `audit-claude-md/SKILL.md` (or wherever new Chester skills are added):

```markdown
---
name: audit-claude-md
description: |
  Run the CLAUDE.md auditor and surface proposed edits as a unified diff.
  Use when the user requests a CLAUDE.md health check, before committing
  large CLAUDE.md edits, or as part of finish-write-records.
---

# audit-claude-md

## Procedure

1. Run `dotnet run --project tools/ClaudeMdAuditor -- audit all` from repo root.
2. If exit code is zero and findings list is empty, report "CLAUDE.md clean"
   and stop.
3. If findings exist, run `dotnet run --project tools/ClaudeMdAuditor --
   propose --check all --output /tmp/claude-md-audit.diff`.
4. Read /tmp/claude-md-audit.diff, present to user grouped by file with
   one-line rationale per hunk.
5. Ask user to ratify, modify, or skip per hunk. Default action is skip.
6. Apply ratified hunks via Edit tool. Do not git commit.
7. Re-run audit to confirm clean state. Report final status.
```

**Validation:** Invoke `/audit-claude-md` (or however Chester routes skills). Confirm tool runs and presents findings.

**Rollback:** Delete the skill file.

**Estimated time:** 30 minutes.

## Step 7 — Wire Audit Into Pipeline

**Layer:** C composed with existing pipeline.
**Goal:** Audit runs automatically at sprint close. Human sees only the diff to ratify.

**Prerequisites:** Step 6 complete.

**Procedure:**

- Locate `chester:finish-write-records` SKILL.md and `chester:execute-verify-complete` SKILL.md.
- Append a step to each:

```markdown
## Step N — CLAUDE.md hygiene check

Invoke `audit-claude-md` skill.

If findings exist, present diff to user. Treat user's "next step"
or "proceed" as skip; require explicit ratification per hunk.
Continue regardless of user's choice — this is advisory, not blocking.
```

**Validation:** Run a synthetic sprint close (or a dry-run of finish-write-records). Confirm audit step fires.

**Rollback:** Remove the appended step.

**Estimated time:** 30 minutes.

## Step 8 — Scheduled Weekly Health Report

**Layer:** B (generator — emits a periodic state document).
**Goal:** Background drift detection without human polling. Output is a markdown report committed to `docs/admin/health-reports/YYYY-MM-DD.md`.

**Prerequisites:** Steps 1 and 4 complete.

**Procedure:**

- Use Claude Code `/schedule` to register a routine, or set up a cron job invoking `claude` headless. Example cron entry:

```cron
# Every Monday at 09:00 UTC
0 9 * * 1 cd /home/mike/RiderProjects/StoryDesigner && /usr/local/bin/claude --headless --skill chester:health-report-claude-md
```

- Or create a Chester skill `health-report-claude-md`:

```markdown
---
name: health-report-claude-md
description: Weekly automated CLAUDE.md health check. Emits a markdown report.
---

# health-report-claude-md

## Procedure

1. Run `dotnet run --project tools/CurrentStateGenerator -- --solution StoryDesigner.sln --output docs/architecture/current-state.md`.
2. Run `dotnet test Story.Architecture.Tests --filter ClaudeMd`.
3. Run `dotnet run --project tools/ClaudeMdAuditor -- audit all` and capture JSON output.
4. Compose `docs/admin/health-reports/CLAUDE-md-YYYY-MM-DD.md` containing:
   - Test result summary
   - Auditor findings (categorized: imports, tdrs, sprint-refs, line-cap)
   - Diff between this week's `current-state.md` and last week's (if prior version exists)
   - Trend: line count of root CLAUDE.md across last 8 weeks
5. Commit the report with message "chore(admin): weekly CLAUDE.md health report".
6. Do not modify any other file.
```

- For trend analysis, the routine reads previous reports from `docs/admin/health-reports/` to compute deltas. Self-contained; no external state store.

**Validation:** Trigger the routine manually first time. Confirm report is generated and committed. Verify next scheduled run fires automatically.

**Rollback:** Disable the schedule entry. Reports already committed remain as history.

**Estimated time:** 30 minutes for skill + schedule wiring.

## What the Human Sees After Full Adoption

- **CI build green:** silence. No action needed.
- **CI build red on `Story.Architecture.Tests`:** broken `@import`, missing TDR, line-cap exceeded, or stale `current-state.md`. Fix indicated by failing test name.
- **Pre-commit hook reject:** local fast-fail before push. Same fixes.
- **Weekly health report committed:** browse `docs/admin/health-reports/` if curious. No required reading.
- **Sprint close (`finish-write-records`):** auditor presents proposed diffs inline. Per-hunk ratify or skip. Default skip.
- **Quarterly review:** still optional, but the data is already there in the weekly reports — quarterly is just a deeper read of accumulated trends, no fresh analysis required.

Human attention scales with **number of proposed diffs**, not with documentation surface area. A clean repo means zero attention. A drifting repo means a small finite list of one-line decisions.

## Total Investment

- Steps 1-4: roughly 8-10 hours. Builds the entire automation surface.
- Steps 5-7: roughly 2 hours. Activates the surface against current CLAUDE.md.
- Step 8: roughly 30 minutes. Background reporting.

First-year all-in: under 13 hours. Annual maintenance after Year 1: near zero — fixes triggered by CI, not by polling.

## Sequencing Recommendation

Recommended PR order. Each PR is independently mergeable and delivers standalone value.

- PR 1: Step 1 (auditor tool, no integration yet).
- PR 2: Step 2 + Step 3 (fitness tests gating CI).
- PR 3: Step 4 (generator + transitional MSBuild metadata pattern).
- PR 4: Step 5 (replace prose; depends on PRs 1, 2, 3).
- PR 5: Steps 6 + 7 (skill wiring).
- PR 6: Step 8 (scheduled health report).

Each PR adds machine surface area, never human surface area.

## Out of Scope

The following are deliberately not included. Track separately if pursued.

- DocFX integration for generated API reference (parent strategy §4.1).
- Source-generated concept index from `[Concept]` attributes (parent strategy §4.1).
- MarkdownSnippets for wiki code examples (parent strategy §4.3).
- `audit-doc-drift` skill at `execute-verify-complete` (broader than CLAUDE.md).
- Sub-agent spec-fidelity reviewer (parent strategy §4.5).
- Cortex-style archive tiering (parent strategy §4.5).

These are independent initiatives. Address after the CLAUDE.md axis is stable.
