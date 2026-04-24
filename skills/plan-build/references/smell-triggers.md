# plan-smell Trigger Categories

Keyword patterns that fire `plan-smell` during the Plan Hardening gate. The list
is deliberately inclusive: false positives cost one extra parallel dispatch; misses
cost an uncaught real bug. Tune toward over-firing.

When adding new triggers, keep the category split and the inclusive bias.

## DI registrations

```
AddScoped
AddSingleton
AddTransient
services.Add
IServiceCollection
composition root
```

## New abstractions

```
new interface
abstract class
new service class
public interface I[A-Z]
public abstract
```

## Async / concurrency primitives

```
async
await
Task.
Task<
SemaphoreSlim
Semaphore
lock (
Interlocked.
ConcurrentDictionary
ConcurrentBag
Channel<
```

## New persistence pathways

```
SaveAsync
DbContext
IRepository
Repository
sqlite
persistence
IDbConnection
SqlConnection
serialize
deserialize
```

## New contract surfaces

```
new contract
new DTO
new record
public record
public class.*Dto
boundary contract
```

## Why This List Is Reference, Not Procedure

The decision logic (run the pre-check, fire conditionally, report matched triggers
in the threat report) lives in `plan-build` SKILL.md under `## Smell Heuristic
Pre-Check`. The list itself changes as patterns emerge across sprints — isolating
it here lets maintainers add categories without touching the decision procedure.

## Matching Discipline

- **Case-insensitive match.** `Addscoped` and `ADDSCOPED` both fire.
- **Any trigger in any category fires plan-smell** — there is no minimum threshold.
- **Triggers that matched are included verbatim in the combined threat report** so
  the designer sees *why* smell fired (or sees the empty list and understands why
  it didn't).
