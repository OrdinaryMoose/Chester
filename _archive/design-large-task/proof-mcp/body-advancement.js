/**
 * body-advancement.js — Pure-function module computing the body-advancement
 * signal between a pre-mutation snapshot and the post-mutation state.
 *
 * Counts adds, revises (revisedInRound delta), and withdrawals across all
 * load-bearing element types plus Concerns and Definitions. Bookkeeping
 * operations (ratification flips, friction-disposition flips) do NOT count.
 *
 * No I/O. No imports from state.js or server.js.
 */

function activeElementIds(elements) {
  const ids = new Set();
  for (const [id, el] of elements) {
    if (el.status === 'active') ids.add(id);
  }
  return ids;
}

function activeConcernIds(concerns) {
  const ids = new Set();
  for (const c of concerns || []) {
    if (c.status !== 'withdrawn') ids.add(c.id);
  }
  return ids;
}

function activeDefinitionIds(definitions) {
  const ids = new Set();
  for (const d of definitions || []) {
    if (d.status !== 'withdrawn') ids.add(d.id);
  }
  return ids;
}

export function computeBodyAdvancement(prevSnapshot, currentState) {
  const beforeEl = activeElementIds(prevSnapshot.elements);
  const afterEl = activeElementIds(currentState.elements);
  const beforeC = activeConcernIds(prevSnapshot.concerns);
  const afterC = activeConcernIds(currentState.concerns);
  const beforeD = activeDefinitionIds(prevSnapshot.definitions);
  const afterD = activeDefinitionIds(currentState.definitions);

  let addCount = 0;
  for (const id of afterEl) if (!beforeEl.has(id)) addCount++;
  for (const id of afterC) if (!beforeC.has(id)) addCount++;
  for (const id of afterD) if (!beforeD.has(id)) addCount++;

  let withdrawCount = 0;
  for (const id of beforeEl) if (!afterEl.has(id)) withdrawCount++;
  for (const id of beforeC) if (!afterC.has(id)) withdrawCount++;
  for (const id of beforeD) if (!afterD.has(id)) withdrawCount++;

  let reviseCount = 0;
  for (const [id, after] of currentState.elements) {
    const before = prevSnapshot.elements.get(id);
    if (!before) continue;
    if ((before.revisedInRound ?? null) !== (after.revisedInRound ?? null)) {
      reviseCount++;
    }
  }

  return {
    advanced: addCount + reviseCount + withdrawCount > 0,
    addCount,
    reviseCount,
    withdrawCount,
  };
}
