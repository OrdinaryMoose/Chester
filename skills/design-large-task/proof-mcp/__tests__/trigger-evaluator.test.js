// proof-mcp/__tests__/trigger-evaluator.test.js
import { describe, it, expect } from 'vitest';
import { evaluateTrigger, CLOSING_ARG_FLOORS } from '../metrics.js';
import { initializeState, applyOperations, addConcern, ratifyConcern, ratifyResolveCondition } from '../state.js';

function buildClosureReadyState() {
  let s = initializeState('p');
  let [, sa] = addConcern(s, { label: 'broad concern X', description: 'd' }, { source: 'designer', rationale: 'test' });
  s = sa;
  [s] = ratifyConcern(s, 'CERN-1', { source: 'designer', rationale: 'test' });
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'fact-1', source: 'codebase' },
    { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF fact-1 THEN must Q', rejected_alternatives: ['alt'] },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ], { source: 'designer', rationale: 'test' });
  s = r.state;
  r = applyOperations(s, [{ op: 'revise', target: 'NCON-1', collapse_test: 'breaks if no Q at all' }], { source: 'designer', rationale: 'test' });
  s = r.state;
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'designer ratified' }, { source: 'designer', rationale: 'test' });
  while (s.round < 3) {
    r = applyOperations(s, [], { source: 'designer', rationale: 'test' });
    s = r.state;
  }
  return s;
}

describe('evaluateTrigger', () => {
  it('returns permitted=true with all signals clear', () => {
    const s = buildClosureReadyState();
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(true);
    expect(out.reasons).toEqual([]);
  });

  it('returns permitted=false naming each failed per-signal floor', () => {
    const s = initializeState('p');
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(false);
    expect(out.reasons.length).toBeGreaterThan(0);
  });

  it('exports CLOSING_ARG_FLOORS for test override', () => {
    expect(CLOSING_ARG_FLOORS.aggregateScoreFloor).toBeDefined();
    expect(CLOSING_ARG_FLOORS.groundingCoverageFloor).toBeDefined();
  });

  // Per-signal-floor isolation tests (AC-4.1)
  it('isolates grounding-coverage floor failure', () => {
    const s = buildClosureReadyState();
    // remove grounding from the NC to drop coverage below floor
    const nc = s.elements.get('NCON-1');
    nc.grounding = [];
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(false);
    expect(out.reasons.some(r => /grounding_coverage/.test(r))).toBe(true);
  });

  it('isolates unratified-RC floor failure', () => {
    const s = buildClosureReadyState();
    s.elements.get('RCON-1').ratification = null;
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /unratified RCs/.test(r))).toBe(true);
  });

  it('isolates collapse_test floor failure', () => {
    const s = buildClosureReadyState();
    s.elements.get('NCON-1').collapse_test = null;
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /collapse_test/.test(r))).toBe(true);
  });

  it('isolates rejected_alternatives floor failure', () => {
    const s = buildClosureReadyState();
    for (const [, el] of s.elements) {
      if (el.type === 'NECESSARY_CONDITION') el.rejected_alternatives = [];
    }
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /rejected_alternatives/.test(r))).toBe(true);
  });

  it('isolates round-floor failure', () => {
    const s = buildClosureReadyState();
    s.round = 1;
    const out = evaluateTrigger(s);
    expect(out.reasons.some(r => /round/.test(r) && /floor/.test(r))).toBe(true);
  });

  // Aggregate-score boundary tests (AC-4.2) — use the overrides arg, not constant mutation.
  // Object.freeze on CLOSING_ARG_FLOORS prevents accidental in-place mutation that
  // would have leaked between tests; the override arg is the supported test seam.
  it('aggregate-score below override floor fails with aggregate_score reason', () => {
    const s = buildClosureReadyState();
    // Force the aggregate floor above the maximum possible aggregate (1.0) — guaranteed failure.
    // (Plan scaffold used 0.99; corrected to 1.01 because the closure-ready state achieves
    // aggregate=1.0 — 1.0 < 0.99 is false, so the original value never tripped the floor.)
    const out = evaluateTrigger(s, { aggregateScoreFloor: 1.01 });
    expect(out.permitted).toBe(false);
    expect(out.reasons.some(r => /aggregate_score/.test(r))).toBe(true);
  });

  it('aggregate-score at-or-above override floor passes', () => {
    const s = buildClosureReadyState();
    // Force the aggregate floor to 0 — guaranteed pass on the score arm
    const out = evaluateTrigger(s, { aggregateScoreFloor: 0 });
    expect(out.reasons.filter(r => /aggregate_score/.test(r)).length).toBe(0);
  });

  // Integrity-zero isolation test (AC-4.3)
  it('isolates integrity-zero failure (one warning blocks trigger)', () => {
    const s = buildClosureReadyState();
    // inject an ungrounded friction anchor to force one integrity warning
    s.elements.set('FRIC-99', {
      id: 'FRIC-99', type: 'FRICTION', status: 'active',
      friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-99-MISSING', anchor_b: 'NCON-1',
      disposition: 'lived-with',
    });
    const out = evaluateTrigger(s);
    expect(out.permitted).toBe(false);
    expect(out.reasons.some(r => /integrity_warnings/.test(r))).toBe(true);
  });
});
