import { describe, it, expect } from 'vitest';
import {
  initializeState,
  applyOperations,
  addConcern,
  ratifyConcern,
  ratifyResolveCondition,
  ratifyNecessaryCondition,
} from '../state.js';
import { partitionActiveElements } from '../closing-argument.js';
import {
  OUTSIZED_RULE_THRESHOLD,
  isOutsizedRule,
  firstSentence,
  renderHeading,
  renderBullet,
  renderSubBullet,
} from '../state-render.js';

const consent = { source: 'designer', rationale: 'test render' };

function seedFullProof() {
  let s = initializeState('design problem');
  let [, sa] = addConcern(s, { label: 'concern X', description: 'd' }, consent);
  s = sa;
  [s] = ratifyConcern(s, 'CERN-1', consent);
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'evidence body', source: 'codebase' },
    { op: 'add', type: 'RULE', statement: 'rule body', source: 'designer' },
    { op: 'add', type: 'PERMISSION', statement: 'permission body', source: 'designer', relieves: 'RULE-1' },
    { op: 'add', type: 'RISK', statement: 'risk body', source: 'agent-derivation', basis: ['EVID-1'] },
    { op: 'add', type: 'NECESSARY_CONDITION',
      statement: 'must Q', collapse_test: 'breaks if no Q',
      grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must Q' },
    { op: 'add', type: 'NECESSARY_CONDITION',
      statement: 'must R (draft)', collapse_test: 'breaks if no R',
      grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must R' },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs',
      problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ], consent);
  s = r.state;
  [s] = ratifyNecessaryCondition(s, { elementId: 'NCON-1', ratificationText: 'ok' }, consent);
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' }, consent);
  return s;
}

describe('partitionActiveElements', () => {
  it('returns the seven raw active-by-type lanes', () => {
    const s = seedFullProof();
    const p = partitionActiveElements(s);
    expect(Object.keys(p).sort()).toEqual([
      'activeConcerns', 'activeEvidence', 'activeNCsAll',
      'activePermissions', 'activeRCs', 'activeRisks', 'activeRules',
    ]);
    expect(p.activeNCsAll.length).toBe(2);
    expect(p.activeNCsAll).toContain(s.elements.get('NCON-1'));
    expect(p.activeNCsAll).toContain(s.elements.get('NCON-2'));
    expect(p.activeRCs[0]).toBe(s.elements.get('RCON-1'));
    expect(p.activeRules[0]).toBe(s.elements.get('RULE-1'));
    expect(p.activePermissions[0]).toBe(s.elements.get('PERM-1'));
    expect(p.activeEvidence[0]).toBe(s.elements.get('EVID-1'));
    expect(p.activeRisks[0]).toBe(s.elements.get('RISK-1'));
    expect(p.activeConcerns[0]).toBe(s.concerns[0]);
  });
});

describe('state-render primitives and heuristics', () => {
  it('exports OUTSIZED_RULE_THRESHOLD === 3', () => {
    expect(OUTSIZED_RULE_THRESHOLD).toBe(3);
  });

  it('isOutsizedRule returns true at or above threshold of numbered sub-clauses', () => {
    const big = '18. Big rule.\n  18.1 first\n  18.2 second\n  18.3 third';
    const small = 'Just one sentence rule.';
    expect(isOutsizedRule(big, 3)).toBe(true);
    expect(isOutsizedRule(small, 3)).toBe(false);
  });

  it('isOutsizedRule returns false when count is below threshold', () => {
    const two = 'Header.\n  18.1 a\n  18.2 b';
    expect(isOutsizedRule(two, 3)).toBe(false);
  });

  it('firstSentence returns text up to first sentence terminator', () => {
    expect(firstSentence('Hello world. Then more text.')).toBe('Hello world');
    expect(firstSentence('What now? More.')).toBe('What now');
    expect(firstSentence('Wow! Next.')).toBe('Wow');
    expect(firstSentence('No terminator here')).toBe('No terminator here');
  });

  it('renderHeading prints a level-2 heading with newline', () => {
    expect(renderHeading('Necessary Conditions')).toBe('## Necessary Conditions\n');
  });

  it('renderBullet prints id-meta-summary bullet', () => {
    expect(renderBullet('NCON-1', 'ratified', 'must Q')).toBe('- **NCON-1** _(ratified)_ — must Q\n');
  });

  it('renderSubBullet returns empty string for null/undefined/empty array', () => {
    expect(renderSubBullet('reasoning_chain', null)).toBe('');
    expect(renderSubBullet('reasoning_chain', undefined)).toBe('');
    expect(renderSubBullet('rejected_alternatives', [])).toBe('');
  });

  it('renderSubBullet prints two-space indented sub-bullet for non-empty value', () => {
    expect(renderSubBullet('grounding', 'EVID-1')).toBe('  - **grounding:** EVID-1\n');
  });
});
