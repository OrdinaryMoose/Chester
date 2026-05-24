# Chester Engine

Pure Datalog evaluator. Generic over predicate symbols and value types; knows nothing about proof concepts.

Implements the six substrate-facing ports (`IFactStore`, `IRuleStore`, `IQueryEngine`, `ISnapshotRestore`, `IExplain`, `ITransaction`) per `docs/chester/working/20260511-01-mp-redesign-proof-system/design-documents/04-engine-spec.md`.

## Run tests

```
npm install
npm test
```
