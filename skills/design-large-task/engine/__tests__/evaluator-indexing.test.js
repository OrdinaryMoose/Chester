import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { Evaluator } from '../Evaluator.js';
import { FactStore } from '../FactStore.js';
import { RuleStore } from '../RuleStore.js';
import { V } from '../Unifier.js';

describe('Evaluator IDB indexing — named integration risks', () => {

  // AC-1.1 — Delta-driver case: delta-restricted atom with no bound positions
  // uses the delta as the candidate set, not the full predicate bucket.
  //
  // Workload chosen so that the iteration-3 delta is meaningfully smaller than
  // the full q-bucket — required to distinguish delta-driver from a silent
  // fallback to the full predicate-bucket scan.
  //
  // Chain workload:
  //   base: p(a); chain(a, b); chain(b, c)
  //   r1:  q(X) :- p(X)               — derives q(a) in iter 1
  //   r3:  q(Y) :- q(X), chain(X, Y)  — derives q(b) in iter 1, q(c) in iter 2
  //   r2:  s(X) :- q(X)               — the watched rule (single-atom body, no bound positions)
  //
  // r2's candidate-count trajectory under the delta-driver contract:
  //   iter 1: r2 fires unrestricted; q-bucket holds q(a) (and q(b) if r3 ran before r2).
  //   iter 2: r2 fires with q delta-restricted to iter-1's delta (q(a), q(b)) — count 2.
  //   iter 3: r2 fires with q delta-restricted to iter-2's delta (just q(c)) — count 1.
  //
  // The full q-bucket at iter 3 contains q(a), q(b), q(c) — size 3. A regression that
  // fell back to the full-bucket scan would surface candidateCount 3 at iter 3.
  // Asserting that no r2 invocation reports count 3 catches that regression.
  //
  // Bypasses Engine because Engine.js owns its Evaluator as a transient local inside
  // `derive()` and does NOT expose it (per the spec's "no public API change" non-goal).
  it('AC-1.1: delta-driver case iterates only delta members matching predicate/arity', () => {
    const factStore = new FactStore();
    const ruleStore = new RuleStore();
    factStore.assertFact('p', ['a']);
    factStore.assertFact('chain', ['a', 'b']);
    factStore.assertFact('chain', ['b', 'c']);
    ruleStore.defineRule({
      ruleId: 'r1',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    ruleStore.defineRule({
      ruleId: 'r3',
      head: { predicate: 'q', arity: 1, args: [V('Y')] },
      body: [
        { predicate: 'q', arity: 1, args: [V('X')], negated: false },
        { predicate: 'chain', arity: 2, args: [V('X'), V('Y')], negated: false }
      ]
    });
    ruleStore.defineRule({
      ruleId: 'r2',
      head: { predicate: 's', arity: 1, args: [V('Z')] },
      body: [{ predicate: 'q', arity: 1, args: [V('Z')], negated: false }]
    });

    const evaluator = new Evaluator(factStore, ruleStore);
    const counts = [];
    evaluator.setCandidateCountObserver((ruleId, atomIndex, candidateCount) => {
      counts.push({ ruleId, atomIndex, candidateCount });
    });

    const derived = evaluator.derive();

    // Sanity: q(a), q(b), q(c) and s(a), s(b), s(c) all derived.
    const qFacts = [...derived.values()].filter(f => f.predicate === 'q');
    const sFacts = [...derived.values()].filter(f => f.predicate === 's');
    expect(qFacts.length).toBe(3);
    expect(sFacts.length).toBe(3);

    // r2 has a single body atom (q, no bound positions). Inspect every r2 candidate-count
    // observation. The delta-driver contract forbids ever seeing the full q-bucket size (3)
    // as a candidate count for r2 — every delta-restricted firing must use the iteration-
    // specific delta, which is at most size 2 across the run, and at iter 3 is exactly size 1.
    const r2Counts = counts.filter(c => c.ruleId === 'r2' && c.atomIndex === 0);

    // Iter-3 delta-driver assertion: at least one r2 invocation must report count 1 (iter-3 delta).
    expect(r2Counts.some(c => c.candidateCount === 1)).toBe(true);

    // Regression guard: no r2 invocation may report count 3. A fallback to the full q-bucket
    // at iter 3 (when delta-q has just q(c)) would surface count 3 and fail this assertion.
    expect(r2Counts.every(c => c.candidateCount !== 3)).toBe(true);
  });

  // AC-1.2 — Negation under new lookup preserves existential semantics.
  // Reuses AC-9.4 pattern: leaf(X) :- node(X), ¬ancestor(X, Y).
  it('AC-1.2: negation branch with mixed bound/unbound vars works under new lookup', () => {
    const e = new Engine();
    e.assertFact('node', ['a']);
    e.assertFact('node', ['c']);
    e.assertFact('parent', ['a', 'b']);
    e.defineRule({
      ruleId: 'anc',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    e.defineRule({
      ruleId: 'leaf',
      head: { predicate: 'leaf', arity: 1, args: [V('X')] },
      body: [
        { predicate: 'node', arity: 1, args: [V('X')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')], negated: true }
      ]
    });
    e.derive();
    // a has an ancestor → leaf(a) NOT derived.
    expect(e.exists(['leaf', ['a']])).toBe(false);
    // c has no ancestor → leaf(c) IS derived.
    expect(e.exists(['leaf', ['c']])).toBe(true);
  });

  // AC-1.3 — Repeated variables defer to unification.
  it('AC-1.3: repeated variables in body atom yield only matching pairs', () => {
    const e = new Engine();
    e.assertFact('p', ['a', 'a']);
    e.assertFact('p', ['a', 'b']);
    e.assertFact('p', ['b', 'b']);
    e.assertFact('p', ['c', 'd']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'same', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 2, args: [V('X'), V('X')], negated: false }]
    });
    e.derive();
    expect(e.exists(['same', ['a']])).toBe(true);
    expect(e.exists(['same', ['b']])).toBe(true);
    expect(e.exists(['same', ['c']])).toBe(false);
    expect(e.exists(['same', ['d']])).toBe(false);
    expect(e.count(['same', [V('X')]])).toBe(2);
  });
});
