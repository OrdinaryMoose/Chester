# Round 1 — Opening Response

## Initial Observations

You've described a staleness problem in a reference map that sits between entity services and an authored DSL system. Before jumping to solutions, I want to make sure I understand the landscape correctly. Here's what I'm picking up from your description, and where my understanding has gaps:

**What I think I see:**

1. **Entity services** own the source of truth for named entities — when something gets renamed, the rename happens here first.
2. **A reference map** acts as a lookup layer — it maps entity references (presumably by name or some identifier) to their locations or definitions. This map is built at some point and then consulted later.
3. **An authored DSL** contains human-written expressions that reference entities by name. When an entity is renamed at the service layer, the DSL expressions still hold the old name, and the reference map — which was built against the old names — goes stale.

**What I'm uncertain about:**

- Whether "stale" means the map points to entities that no longer exist under that name, or whether it means the map is missing entries for the newly renamed entities, or both.
- Whether the reference map is computed once (at build/publish time) or maintained incrementally (runtime cache, event-driven).
- Whether the DSL is evaluated at authoring time, at deploy time, or at request time — because that determines how wide the blast radius of staleness actually is.

## Opening Question

The thing I want to understand first is the **lifecycle of the reference map itself**, because that shapes everything downstream.

**When is the reference map built, and what triggers a rebuild?** Specifically: is this a compile-time artifact that gets generated during a build or publish step, a runtime cache that gets populated lazily on first access, or something in between — like an event-driven projection that's supposed to stay current but is falling behind? The fix for a stale build artifact is fundamentally different from the fix for a leaky cache invalidation strategy.
