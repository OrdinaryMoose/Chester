# Deferred Items

## 2026-04-08: Old chester-* skill directories still tracked in git

**Source task:** Task 5 (final verification)
**Description:** The old `chester-*` skill directories are still tracked in git but are not served by the plugin system (which reads from `skills/`). These old files reference `CHESTER_PLANS_DIR` where they should reference `CHESTER_WORKING_DIR`, and contain outdated skill content. They should be removed from git tracking and the `skills/` directory committed as the replacement.
**Why deferred:** The `chester-*` to `skills/` rename is a large migration that's out of scope for this sprint (directory model clarity). It predates this sprint and requires its own commit strategy.

## 2026-04-08: start-bootstrap PLANS_DIR description not updated

**Source task:** Plan hardening (LOW finding)
**Description:** `skills/start-bootstrap/SKILL.md:92` still describes CHESTER_PLANS_DIR as "relative path to tracked plans directory" rather than "archive target, populated only at merge time." Not wrong, but not reinforced with the new framing.
**Why deferred:** Per the Pragmatic architecture approach, only the three authority files were updated. This is a downstream reinforcement, not a correctness issue.
