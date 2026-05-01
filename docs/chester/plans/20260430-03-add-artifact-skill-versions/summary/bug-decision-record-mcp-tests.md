# Bug Report: Decision-Record MCP Tests Crash When Run From Worktree

**Date filed:** 2026-05-01
**Filed during:** sprint `20260430-03-add-artifact-skill-versions`
**Status:** Open — pre-existing on `main`
**Severity:** Medium — blocks full-suite verification from worktrees; does not affect MCP runtime

## Summary

5 of 8 `tests/test-decision-record-*.sh` scripts fail with `ERR_MODULE_NOT_FOUND` when run from inside a git worktree. The tests pass when run from the main repo. The failure is environmental (missing `node_modules/`), not a code defect in the tests themselves.

## Affected Tests

```
tests/test-decision-record-abandon.sh
tests/test-decision-record-capture-finalize.sh
tests/test-decision-record-cross-sprint.sh
tests/test-decision-record-shared-fixtures.sh
tests/test-decision-record-supersede.sh
```

The other 3 decision-record tests (`test-decision-record-ac-mapping.sh`, `test-decision-record-registration.sh`, `test-decision-record-setup.sh`) pass from both locations because they don't load the MCP server's persistence module.

## Reproduction

```bash
# Main repo — passes
cd /home/mike/Documents/CodeProjects/Chester
bash tests/test-decision-record-abandon.sh
# → PASS: abandon integration test

# Worktree — fails
cd /home/mike/Documents/CodeProjects/Chester/.worktrees/20260430-03-add-artifact-skill-versions
bash tests/test-decision-record-abandon.sh
# → Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'proper-lockfile'
```

## Root Cause

The test scripts compute `REPO_ROOT` as the parent of the script's directory (`tests/..`) and `cd` there before running Node. From a worktree that resolves to the worktree's path, not the main repo. The decision-record MCP server module `mcp/chester-decision-record/store.js` imports `proper-lockfile`, which is installed at `node_modules/proper-lockfile/` in the main repo.

`node_modules/` is gitignored — git worktrees do not replicate it. Node's module resolution walks up from the importer file looking for `node_modules/` and finds nothing inside the worktree's tree.

Stack trace:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'proper-lockfile' imported from
/home/mike/Documents/CodeProjects/Chester/.worktrees/20260430-03-add-artifact-skill-versions/mcp/chester-decision-record/store.js
    at Object.getPackageJSONURL (node:internal/modules/package_json_reader:314:9)
    at packageResolve (node:internal/modules/esm/resolve:767:81)
```

Confirmed: main repo has `node_modules/`; the worktree does not.

```
$ ls /home/mike/Documents/CodeProjects/Chester/node_modules
[present]

$ ls /home/mike/Documents/CodeProjects/Chester/.worktrees/20260430-03-add-artifact-skill-versions/node_modules
ls: cannot access ...: No such file or directory
```

## Why It Matters

Chester's standard workflow runs sprints in worktrees. Every sprint that needs to run the full test suite (e.g., `execute-verify-complete`) hits this. The current workaround is to filter the affected tests out of the suite — but that defeats the value of full-suite verification.

The MCP server itself works correctly at runtime — Claude's MCP host loads the server from the main repo, not the worktree, so `dr_query`, `dr_capture`, etc. function normally during sessions. Only the bash test harnesses break.

## Fix Options

**A. Symlink `node_modules` from main into each worktree.** Cheap, zero per-worktree storage cost. Done at worktree creation time (in `util-worktree`). Risk: if main's deps change while a worktree is active, the symlink picks up the change automatically — which is usually what you want.

**B. Run `npm install` in each worktree.** Per-worktree `node_modules/` directory. Storage-heavier; out-of-sync risk if main updates packages. Doesn't share Chester's existing dep state.

**C. Test scripts should run Node against main's `node_modules`.** Set `NODE_PATH` to `<main-repo>/node_modules` before invoking the MCP server, or have the test script detect "we're in a worktree" and re-resolve `REPO_ROOT` to the main repo's path. Requires test code changes.

**D. Move `proper-lockfile` and other MCP deps to `package.json` `dependencies` and ensure git tracks them.** Doesn't actually solve `node_modules` absence — the deps still need to be installed somewhere.

**Recommendation:** A (symlink) is cleanest. Add to `util-worktree`'s creation step:

```bash
ln -s "$MAIN_REPO/node_modules" "$WORKTREE_PATH/node_modules"
```

One line, zero copy cost, automatically tracks main's dep state.

## Test Output Sample

```
$ bash tests/test-decision-record-abandon.sh
node:internal/modules/package_json_reader:314
  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), null);
        ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'proper-lockfile' imported from /home/mike/Documents/CodeProjects/Chester/.worktrees/20260430-03-add-artifact-skill-versions/mcp/chester-decision-record/store.js
    at Object.getPackageJSONURL (node:internal/modules/package_json_reader:314:9)
    at packageResolve (node:internal/modules/esm/resolve:767:81)
    at moduleResolve (node:internal/modules/esm/resolve:853:18)
    at defaultResolve (node:internal/modules/esm/resolve:983:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:731:20)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:708:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:310:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:182:49) {
  code: 'ERR_MODULE_NOT_FOUND'
}

Node.js v22.22.0
```

## Related Context

- This sprint (`20260430-03-add-artifact-skill-versions`) hit the bug at `execute-verify-complete` Step 1 and resolved by filtering the 5 affected tests from the suite.
- Documented also in this sprint's deferred-items file: `add-artifact-skill-versions-deferred-00.md`.
- The 3 decision-record tests that DO pass from worktrees are the ones that don't load `mcp/chester-decision-record/store.js`. They probably exercise the registration manifest or AC-mapping logic, which lives in pure-bash or in scripts that don't import `proper-lockfile`.
