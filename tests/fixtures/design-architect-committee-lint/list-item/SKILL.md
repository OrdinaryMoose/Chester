---
name: list-item-fixture
description: A fixture whose body contains a forbidden list item so the lint script flags it.
version: v0001
---

This fixture exercises the list-ban path of the lint script. The body stays comfortably under the configured cap so only the list ban fires. Immediately below this paragraph is a single line that begins with a dash followed by a space, which the lint script must catch and report as a forbidden list pattern.

- some inline list item

The closing paragraph adds a few more sentences of plain prose to round out the fixture without pushing the word count past the cap.
