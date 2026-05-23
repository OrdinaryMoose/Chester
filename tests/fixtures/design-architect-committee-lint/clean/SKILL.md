---
name: clean-fixture
description: A clean skill fixture used to verify the lint script passes when constraints are satisfied.
version: v0001
---

This fixture exists solely to exercise the lint script in its passing path. The body deliberately avoids any line beginning with a dash followed by a space or a numbered marker, so the list ban does not fire. The word count is also held well below the configured cap of two hundred words, ensuring the cap check reports a passing count. Reviewers reading this prose should find it boring, repetitive, and entirely free of structure beyond plain sentences arranged into a single paragraph block here.
