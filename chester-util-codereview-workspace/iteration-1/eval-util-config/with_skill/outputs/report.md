## Code Review: `chester-util-config/`

**Smell Density: Moderate**

Agents: Bloaters & Dispensables, Couplers & OO Abusers, Change Preventers.
Scope: `chester-util-config/` (2 files, Bash)

### Findings

- **Serious** | `session-start:10-12` | Hard-coded cross-skill path and format knowledge | `session-start` directly reads `${CHESTER_ROOT}/chester-setup-start/SKILL.md`, hard-coding both the path and the assumption that it has YAML frontmatter to strip with sed. If the target skill renames, moves, or changes its frontmatter format, this script silently breaks. | smell: Inappropriate Intimacy + Shotgun Surgery | source: Couplers & OO Abusers, Change Preventers
  > Both agents independently flagged this. The coupling agent identified it as Inappropriate Intimacy (reaching into another skill's internals); the change-preventer agent identified it as Shotgun Surgery (path conventions encoded independently in each script with no shared resolution). Same root cause: no abstraction boundary between skills for content access.

- **Serious** | `session-start:10-13,16-24,27-30` | Three unrelated responsibilities in one script | `session-start` handles (1) reading and parsing another skill's markdown with frontmatter stripping (lines 10-13), (2) JSON string escaping via hand-rolled function (lines 16-24), and (3) constructing the Claude Code hook protocol response (lines 27-30). Each concern has an independent change vector, and all three converge on this single 32-line file. | smell: Divergent Change | source: Change Preventers

- **Minor** | `session-start:16-24` | Hand-rolled JSON escaping | The `escape_for_json` function manually replaces five character classes via bash string substitution. It omits forward slash and Unicode control characters beyond `\r`, `\n`, `\t`. This is fragile compared to delegating to `jq` (which is already a dependency of the sibling script). | smell: Primitive Obsession | source: Bloaters & Dispensables

- **Minor** | `chester-config-read.sh:25-29` | User config tier provides negligible value | The user-config branch (lines 25-29) explicitly ignores directory settings and falls through to defaults. Its only effect is setting `CHESTER_CONFIG_PATH` to the user config path. This is nearly identical to the no-config fallback (lines 30-33), adding a code path with almost no behavioral difference. | smell: Speculative Generality | source: Bloaters & Dispensables

- **Minor** | `session-start:11-13` | Cryptic sed with insufficient comment | The sed expression `'1{/^---$/!q}; 1,/^---$/d'` has a subtle early-exit behavior on line 1 if the file doesn't begin with `---`. The comment ("Remove frontmatter") doesn't convey this edge case. | smell: Comments as Crutch | source: Bloaters & Dispensables

- **Minor** | `chester-config-read.sh:22-23` | Linear config key growth pattern | Each new config key requires adding another `jq -r` extraction with inline default. The pattern scales linearly with config schema size, all in the same if-block. | smell: Divergent Change (mild) | source: Change Preventers

- **Minor** | `session-start:30` | Hook protocol structure hard-coded | The printf constructs the exact JSON shape of the Claude Code hook response. Necessary coupling given the architecture, but any hook protocol change requires modifying this script. | smell: Feature Envy | source: Couplers & OO Abusers

- **Minor** | `chester-config-read.sh:8` | Git workspace assumption | `git rev-parse --show-toplevel` assumes a git repo context. The `|| pwd` fallback mitigates this, but config resolution is structurally coupled to git's workspace model. | smell: Inappropriate Intimacy (mild) | source: Couplers & OO Abusers

### Risk Rationale

- The two Serious findings share a root cause: `session-start` has grown organically to handle cross-skill content reading, format parsing, and protocol construction without boundaries. These concerns reinforce each other -- fixing the coupling requires also addressing the responsibility split.
- The hand-rolled JSON escaper is a latent correctness risk. It works for current content but could produce invalid JSON if skill content includes characters outside its escape set. Using `jq` (already required by `chester-config-read.sh`) would eliminate this class of bug.
- The Minor findings are independent and low-impact individually. None requires immediate action, but the sed fragility and speculative user-config tier add cognitive load disproportionate to their value.
