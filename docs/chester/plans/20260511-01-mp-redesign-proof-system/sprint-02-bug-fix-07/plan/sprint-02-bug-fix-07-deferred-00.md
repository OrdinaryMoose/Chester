# Deferred Items — sprint-02-bug-fix-07

## 2026-05-18 | Task 0 (quality review)

### Relocate `makeAdapters` out of `bridge-integration.test.js`

**Source task:** Task 0 — fixture allocator + ID_PREFIXES.

**Description:** Quality reviewer flagged (Important / confidence 85) that `makeAdapters` is exported from a test file (`bridge-integration.test.js`) rather than a fixture module. Downstream test files importing `makeAdapters` will trigger execution of all `describe` blocks inside `bridge-integration.test.js` as a side effect. The clean structural fix is to move `makeAdapters` and its `ID_PREFIXES` import into a new `_fixtures/adapters.js` file, mirroring how `inMemorySubstrate.js` is structured.

**Why deferred:** Pre-existing test-topology concern. The plan accepted the `makeAdapters` export-from-test-file approach by direction; moving it now would require updating every importer in lockstep and re-running the full test suite for an effect that doesn't manifest until a future test imports the helper. Out of scope for sprint-02-bug-fix-07 — would be its own small refactor sub-sprint.

### Relocate D9 payload-channel helpers out of `domain-bridge.js`

**Source task:** Task 2 — D9 payload channel utilities.

**Description:** Quality reviewer flagged (Important / confidence 85) that `createPayloadChannel` / `parsePayloadChannel` are pure string utilities sitting inside `domain-bridge.js`, whose header describes itself as "single assembly seam — constructs port bundles, runs boot sequence". The helpers have no dependency on any wiring concern in this file. Cleaner home: a `payload-channel.js` peer file with the two helpers and the `PAYLOAD_START` / `PAYLOAD_END` sentinel constants.

**Why deferred:** Sprint scope authorized only modifying existing files in `domain/`. Creating a new module is a structural change beyond Task 2's stated file list. Defer to a follow-up sub-sprint or pair with broader `domain-bridge.js` decomposition.

### Note: `this`-binding fragility in substrate `idAllocator`

**Source task:** Task 0 — fixture allocator + ID_PREFIXES.

**Description:** Quality reviewer flagged (Minor / confidence 80) that the substrate's `idAllocator.next` uses `this.counters` (shorthand-method syntax), so destructuring (`const { next } = substrate.idAllocator`) and calling `next` standalone would fail because `this` is unbound. `makeAdapters`'s closure-based version doesn't have this issue.

**Why deferred:** Hypothetical hazard, not a present bug. No caller destructures `idAllocator` methods today. Worth noting for any future implementer who tries; can be addressed alongside the relocation above by rewriting the substrate's allocator to use the same closure-based pattern as `makeAdapters`.

<!-- created-at: 2026-05-18T17:57:15Z -->
<!-- produced-by execute-write@v0006 -->
