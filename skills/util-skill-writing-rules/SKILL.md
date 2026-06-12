---
name: util-skill-writing-rules
description: >
  Line-format rules for Chester skill files and references that get read whole into an
  agent's context. Read this skill (don't invoke it) before writing or reflowing a
  SKILL.md, a references/*.md, an agents/*.md, or an artifact template. If you're about
  to wrap prose to a column width in an agent-read Markdown file, check here first. Also
  defines the companion authoring rule: one concept is one sentence.
version: v0002
---

# Skill Writing Rules — Line Format

This is a **flexible** reference: read it, don't invoke it.
It defines one mechanical rule for how prose is laid out across physical lines in the Markdown files Chester feeds to agents.

## Scope

These rules govern Markdown that Chester loads whole into an agent's context: `SKILL.md`, files under `references/`, `agents/*.md`, and artifact templates.
They do not govern human-read archive prose such as summaries and audits, though following them there costs nothing.
Structural elements are exempt everywhere: frontmatter, headings, code fences, tables, and the checkbox syntax (`- [ ]`) that `execute-write` parses.

## The rule: one sentence, one line

Format prose one sentence per physical line.
Markdown collapses consecutive non-blank lines into a single rendered paragraph, so one-sentence-per-line renders identically to wrapped prose — the rule costs nothing on screen and buys everything mechanical.
Never insert a newline mid-sentence to hit a column width.
Never column-wrap prose to roughly 80 characters: an agent loads the whole file regardless of width, so wrapping buys nothing and splits sentences across lines for no gain.

- One sentence per line. Split at semantic sentence boundaries; an abbreviation period such as `e.g.` or `i.e.` does not end a sentence.
- One sentence per line inside list items too. A multi-sentence bullet puts each sentence on its own line, with continuation lines indented under the item text — never all sentences crammed onto one physical line. If the bullet is one concept fractured into stubs rather than several distinct facts, collapse it to a single sentence instead of splitting — see § The companion: one concept, one sentence.
- One line per blockquote sentence. A one-or-two-sentence blockquote is one or two `>` lines, each a whole sentence; never break mid-sentence across two `>` lines.
- Leave a list item alone when it holds a fenced code block — the fence is structural and owns its own lines.
- Leave structural elements alone: frontmatter, headings, code fences, tables.

## The companion: one concept, one sentence

The line rule above is mechanical; this authoring rule is what feeds it: write a single concept as a single sentence.
Do not fracture one idea into two clipped stub sentences to pad a label — `**Role Setup** — voice + style + reading order. Read once at start.` is one concept written as two stubs, and it collapses to `**Role Setup** — voice + style + reading order, read once at start.`
A genuinely distinct second fact is a second concept — keep it as its own sentence on its own line, and never run two concepts together into one sentence to save a line.
When each concept is one sentence, the line rule lands it on one line for free and never emits a stub fragment.

## Why it matters here

The whole principle reduces to one claim: in agent-read Markdown, the physical line is simultaneously the diff unit and the edit unit.
Every rule above protects those two units.

- The line is the diff unit. One sentence per line yields sentence-granular `git diff`: a reviewer sees exactly which instruction in a skill changed, not a 40-line reflow where one word moved and shifted every wrap after it. This is the strongest reason, and it is provable in this repo's own history.
- The line is the Edit-tool target. Chester edits skills by exact `old_string` match. A sentence on its own line is a short, unique, stable target; a sentence buried inside wrapped prose forces the match to span wrap points and breaks the moment anything reflows.
- The line is the addressable unit. Steps, checklist items, and requirements stay individually referenced, extracted, or reordered without re-splitting wrapped text.

## Editing an existing file

Reflowing a file to this format changes newlines only, never words.
Do not reword while you fix line breaks — that mixes a formatting change with a semantic one and destroys the clean-diff property for that region.
A pure reflow is a comment-only change: it does not bump the skill's `version` field.
A reflow that also alters behavior or contract does bump the version, and it should land as a separate commit from the reflow so each diff stays readable.

Retrofitting a legacy file can take two passes, and they must not mix.
The format pass is mechanical — newline splits only, with non-whitespace content byte-identical to its parent (verify with a whitespace-stripped diff), committed as a pure reflow.
The collapse pass is semantic — it rewords single-concept stub-pairs into single sentences per § The companion, so it changes words, cannot ride a newline-only commit, and lands separately as a content change.

## Enforcement

No linter enforces this rule yet, so files drift back to wrapped prose without vigilance.
Until a check exists, the rule binds new and edited files; treat a whole-file reflow of a legacy skill as its own scoped commit (`chore:` or `docs:`), never folded into a behavior change.
