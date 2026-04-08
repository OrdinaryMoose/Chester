# Iteration 2 Analysis: Real C# Code (StoryDesigner)

## Test Targets

| Eval | Directory | Files | Description |
|------|-----------|-------|-------------|
| ViewModels | `Story.Application.Desktop/ViewModels/` | 9 | UI layer, MVVM pattern |
| Services | `Story.Application.Desktop/Services/` | ~28 | Application services, DI, providers |
| Core.Domain | `Story.Core.Domain/` | 42 | Domain entities + structural validation |

## Quantitative Summary

### Timing & Cost

| Eval | Baseline (time/tokens) | With Skill (time/tokens) | Time Multiplier | Token Multiplier |
|------|------------------------|--------------------------|-----------------|------------------|
| ViewModels | 67s / 33k | 176s / 45k | 2.6x | 1.4x |
| Services | 93s / 42k | 173s / 52k | 1.9x | 1.2x |
| Core.Domain | 136s / 65k | 269s / 84k | 2.0x | 1.3x |
| **Mean** | **99s / 47k** | **206s / 60k** | **2.1x** | **1.3x** |

### Assertion Pass Rates

| Assertion | With Skill | Baseline | Discriminates? |
|-----------|------------|----------|----------------|
| scope_stated | 3/3 | 3/3 | No |
| file_line_citations | 3/3 | 3/3 | No |
| severity_classification | 3/3 | 0/3 | **Yes** |
| smell_categories | 3/3 | 1/3 | **Partially** |
| scope_contained | 3/3 | 3/3 | No |
| density_rating | 3/3 | 0/3 | **Yes** |
| no_code_modifications | 3/3 | 3/3 | No |
| evidence_based | 3/3 | 3/3 | No |

**Pass rate delta: +33%** — driven entirely by formatting consistency (severity labels, smell taxonomy, density rating), not by finding quality.

### Finding Counts

| Eval | Baseline | With Skill |
|------|----------|------------|
| ViewModels | 12 | 13 |
| Services | 12 | 12 |
| Core.Domain | 13 | 15 |

Counts are nearly identical. The skill does not find meaningfully more issues.

## Qualitative Analysis

### What both found (the high-value overlapping findings)

Every eval produced the same top findings regardless of skill:

- **ViewModels**: DslEditorViewModel God Class (~500 lines, 5+ responsibilities), MainWindowViewModel Large Constructor (11 params), duplicate FindNodeById, dead SpanVisualizerViewModel, empty ViewModelBase
- **Services**: Flat provider copy-paste (3 identical classes), EditorContentLoader large class, duplicated async load boilerplate, dead TreeLoader, StoryScopeFactory unused dependency, factory depending on concretions
- **Core.Domain**: Clone boilerplate duplicated across 13 entity subclasses (while CloneBaseProperties() exists unused), Guid-list validation copy-pasted ~14 times, parallel EntityBase/ConversationElementBase hierarchies, ConversationLine hierarchy break

### What the baseline found that the skill missed

The baseline consistently caught **practical runtime concerns**:

| Eval | Baseline-only finding | Category |
|------|----------------------|----------|
| ViewModels | Anonymous lambda event handler — memory leak risk | Runtime bug |
| ViewModels | Missing `OnPropertyChanged` in `CurrentEntityKind` setter | Runtime bug |
| ViewModels | Disposing injected dependency it doesn't own | Ownership bug |
| ViewModels | Fire-and-forget async without error propagation | Runtime risk |
| ViewModels | Magic number `3` in bounds check | Correctness |
| ViewModels | TreeNodeViewModel misleading naming | Design clarity |
| Services | Bare `catch` blocks swallowing all exceptions | Observability |
| Services | Thread safety gap in ApplicationStateService | Concurrency bug |
| Services | Mutable setter on IMainWindowAccessor interface | API design |
| Services | Inconsistent `sealed` usage | Style consistency |
| Services | Event subscription leak risk in EditorLanguageClient | Runtime risk |
| Core.Domain | Defensive null checks on never-null collections | Unnecessary complexity |
| Core.Domain | `required` keyword applied inconsistently | Style consistency |
| Core.Domain | Stateless check classes instantiated as objects | Design smell |
| Core.Domain | Commented-out Id copy creates bug if helper is ever used | Latent bug |

### What the skill found that the baseline missed

The skill consistently caught **cross-cutting architectural patterns**:

| Eval | Skill-only finding | Category |
|------|-------------------|----------|
| ViewModels | String-based PropertyChanged coupling across 3 files (Shotgun Surgery) | Architecture |
| ViewModels | Feature Envy in TreePanelViewModel.OnSelectedItemChanged | Architecture |
| ViewModels | Scattered DatabaseChanged handling across 3 VMs | Architecture |
| ViewModels | Diagnostic count proliferation as Data Clumps | Architecture |
| Services | TreeMode Shotgun Surgery — adding a mode touches 5+ files (Critical) | Architecture |
| Services | Diagnostic formatting string duplicated across dump methods | Architecture |
| Services | Dead ITreeLoader interface with no live implementation | Architecture |
| Core.Domain | Base validation calls manually included in all 17 checks | Architecture |
| Core.Domain | Parallel entity/check hierarchy as explicit finding | Architecture |
| Core.Domain | Effect.Operation as unvalidated string discriminator | Architecture |

### The tradeoff

The baseline and skill have **complementary blind spots**:

- **Baseline excels at**: practical bugs, runtime risks, style consistency, latent correctness issues — things a developer debugging at 2am cares about
- **Skill excels at**: structural patterns, change propagation analysis, blast radius estimation — things an architect reviewing before a refactor cares about

Neither is strictly better. They find different things.

## Comparison with Iteration 1 (Chester Skill Files)

| Metric | Iter 1 (skill files) | Iter 2 (real C#) |
|--------|---------------------|-------------------|
| Skill pass rate | 95.8% | 100% |
| Baseline pass rate | 66.7% | 66.7% |
| Time multiplier | ~2.9x | ~2.1x |
| Token multiplier | ~1.7x | ~1.3x |
| Finding count delta | ~equal | ~equal |

The skill performs more efficiently on real code (lower multipliers) but the quality gap remains the same: the delta is entirely formatting consistency, not finding quality.

## Conclusion

The 3-agent skill produces **more structured output** but does **not find more or better issues** than the baseline. The baseline actually catches practical runtime bugs the skill misses. The skill catches architectural patterns the baseline misses. The cost is 2x time and 1.3x tokens.

For a human-facing code review tool, the key question is: does the structured taxonomy and density rating justify the cost? The data says the answer depends on the use case — architectural review vs. practical bug hunting.
