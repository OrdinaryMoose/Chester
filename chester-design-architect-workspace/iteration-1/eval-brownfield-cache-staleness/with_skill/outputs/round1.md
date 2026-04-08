*The system has three named parts — entity services that manage domain objects, a reference map that indexes those objects for lookup, and a DSL authoring system that presumably consumes or interacts with the map. A rename in the entity layer breaks the map's references, meaning the map is coupled to entity identity in a way that doesn't survive change. The shape of the coupling — and whether the DSL is the primary victim or just one consumer — is not yet clear.*

*The most fragile assumption right now is that this is a staleness problem rather than a coupling problem. The map going stale is the symptom, but the design relationship that makes it vulnerable to renames may be the actual issue.*

*This question targets who is affected and how, since the human impact of this failure is completely unknown and determines whether freshness, correctness, or resilience matters most.*

---

**What the codebase reveals**

The system has a layered dependency: domain entities are managed through dedicated services, a reference map provider builds or maintains an index over those entities, and an authored DSL system exists alongside both. The rename operation on entities invalidates the reference map, which means the map is keyed or anchored to something that changes when an entity is renamed — likely the entity's name or a name-derived identifier rather than a stable internal identity.

**What the agent can't determine from code alone**

There are significant gaps in two areas:

*Who is involved and what they experience:* It is unknown who performs entity renames, who authors DSL content, and whether these are the same people or different roles. The experience when the map goes stale — whether it causes visible errors, silent corruption, or workflow interruption — is entirely unclear.

*Why this matters now and what has been tried:* There is no information about whether this is a recent regression or a long-standing friction point, whether workarounds exist, or whether the current design was intentional. The urgency and the history behind the reference map's design are unknown. It is also unclear whether rename-triggered staleness is the full problem or one instance of a broader consistency gap — whether entity creation, deletion, or other changes also cause similar issues.

---

**When the reference map goes stale after a rename, who encounters the problem first — and what does it look like from their perspective?**

---

**Phase 1 (Understand) begins.** The conversation will focus on building shared understanding of the problem before exploring solutions.
