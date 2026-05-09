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
  renderNC,
  renderRule,
  renderRC,
  renderConcern,
  renderEvidence,
  renderPermission,
  renderRisk,
  findElementById,
  renderProofRecap,
  renderElementDeep,
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

describe('per-type render functions', () => {
  it('renderNC includes statement, grounding, reasoning_chain, collapse_test', () => {
    const el = {
      id: 'NCON-1', type: 'NECESSARY_CONDITION', status: 'active',
      ratificationStatus: 'ratified',
      statement: 'must Q',
      grounding: ['EVID-1'],
      reasoning_chain: 'IF evidence THEN must Q',
      collapse_test: 'breaks if no Q',
    };
    const out = renderNC(el);
    expect(out).toContain('NCON-1');
    expect(out).toContain('must Q');
    expect(out).toContain('EVID-1');
    expect(out).toContain('IF evidence THEN must Q');
    expect(out).toContain('breaks if no Q');
    expect(out).not.toContain('rejected_alternatives');
  });

  it('renderNC emits rejected_alternatives sub-bullet only when populated', () => {
    const elWith = {
      id: 'NCON-2', statement: 'X', grounding: ['EVID-1'],
      reasoning_chain: 'IF', collapse_test: 'C',
      rejected_alternatives: ['alt one', 'alt two'],
    };
    const elWithout = { ...elWith, id: 'NCON-3', rejected_alternatives: [] };
    expect(renderNC(elWith)).toContain('rejected_alternatives');
    expect(renderNC(elWithout)).not.toContain('rejected_alternatives');
  });

  it('renderRule(el, false) emits the full statement', () => {
    const el = { id: 'RULE-1', statement: 'Single sentence rule.' };
    const out = renderRule(el, false);
    expect(out).toContain('Single sentence rule.');
    expect(out).not.toContain('sub-clauses — request deep render');
  });

  it('renderRule(el, true) truncates to firstSentence and appends parenthetical pointer', () => {
    const el = {
      id: 'RULE-2',
      statement: 'Big rule.\n  18.1 a\n  18.2 b\n  18.3 c\n  18.4 d\n  18.5 e',
    };
    const out = renderRule(el, true);
    expect(out).toContain('Big rule');
    expect(out).toContain('5 sub-clauses — request deep render to view in full');
  });

  it('renderRC includes statement, problem_anchor, ratification, grounding NC IDs', () => {
    const el = {
      id: 'RCON-1', statement: 'system Qs',
      problem_anchor: 'CERN-1',
      ratification: { ratifiedAtRound: 2, text: 'designer ok' },
      grounding: ['NCON-1'],
    };
    const out = renderRC(el);
    expect(out).toContain('RCON-1');
    expect(out).toContain('system Qs');
    expect(out).toContain('CERN-1');
    expect(out).toContain('NCON-1');
  });

  it('renderConcern includes label, description, status', () => {
    const c = { id: 'CERN-1', label: 'concern X', description: 'desc body', status: 'ratified' };
    const out = renderConcern(c);
    expect(out).toContain('CERN-1');
    expect(out).toContain('concern X');
    expect(out).toContain('desc body');
    expect(out).toContain('ratified');
  });

  it('renderEvidence includes statement and source', () => {
    const el = { id: 'EVID-1', statement: 'evidence body', source: 'codebase' };
    const out = renderEvidence(el);
    expect(out).toContain('EVID-1');
    expect(out).toContain('evidence body');
    expect(out).toContain('codebase');
  });

  it('renderPermission includes statement and relieves', () => {
    const el = { id: 'PERM-1', statement: 'permission body', relieves: 'RULE-1' };
    const out = renderPermission(el);
    expect(out).toContain('PERM-1');
    expect(out).toContain('permission body');
    expect(out).toContain('RULE-1');
  });

  it('renderRisk includes statement and basis', () => {
    const el = { id: 'RISK-1', statement: 'risk body', basis: 'EVID-1' };
    const out = renderRisk(el);
    expect(out).toContain('RISK-1');
    expect(out).toContain('risk body');
    expect(out).toContain('EVID-1');
  });

  it('per-type render surfaces withdrawal_disposition for withdrawn elements', () => {
    const el = {
      id: 'NCON-3', type: 'NECESSARY_CONDITION', status: 'withdrawn',
      ratificationStatus: 'ratified',
      statement: 'old NC', grounding: ['EVID-1'],
      reasoning_chain: 'IF', collapse_test: 'C',
      withdrawal_disposition: 'superseded',
    };
    const out = renderNC(el);
    expect(out).toContain('superseded');
  });
});

describe('findElementById multi-storage lookup', () => {
  it('returns elements.get for the six in-scope element-Map prefixes', () => {
    const s = seedFullProof();
    expect(findElementById(s, 'NCON-1')).toBe(s.elements.get('NCON-1'));
    expect(findElementById(s, 'RULE-1')).toBe(s.elements.get('RULE-1'));
    expect(findElementById(s, 'PERM-1')).toBe(s.elements.get('PERM-1'));
    expect(findElementById(s, 'EVID-1')).toBe(s.elements.get('EVID-1'));
    expect(findElementById(s, 'RISK-1')).toBe(s.elements.get('RISK-1'));
    expect(findElementById(s, 'RCON-1')).toBe(s.elements.get('RCON-1'));
  });

  it('returns matching concern from concerns array for CERN- prefix', () => {
    const s = seedFullProof();
    expect(findElementById(s, 'CERN-1')).toBe(s.concerns[0]);
  });

  it('returns null for FRIC- (out of scope)', () => {
    const s = seedFullProof();
    expect(findElementById(s, 'FRIC-1')).toBeNull();
  });

  it('returns null for DEFN- (out of scope)', () => {
    const s = seedFullProof();
    expect(findElementById(s, 'DEFN-1')).toBeNull();
  });

  it('returns null for unknown prefix', () => {
    const s = seedFullProof();
    expect(findElementById(s, 'XYZ-1')).toBeNull();
  });

  it('returns null when prefix is in-scope but ID does not exist', () => {
    const s = seedFullProof();
    expect(findElementById(s, 'NCON-999')).toBeNull();
  });
});

describe('renderProofRecap', () => {
  it('emits exactly eight section headings in canonical order', () => {
    const s = seedFullProof();
    const out = renderProofRecap(s, partitionActiveElements(s));
    const expectedHeadings = [
      '## Problem Statement',
      '## Concerns',
      '## Rules',
      '## Permissions',
      '## Evidence',
      '## Necessary Conditions',
      '## Resolve Conditions',
      '## Risks',
    ];
    let cursor = 0;
    for (const h of expectedHeadings) {
      const idx = out.indexOf(h, cursor);
      expect(idx).toBeGreaterThanOrEqual(0);
      cursor = idx + h.length;
    }
  });

  it('Problem Statement section presents state.problemStatement text', () => {
    const s = seedFullProof();
    const out = renderProofRecap(s, partitionActiveElements(s));
    expect(out).toContain('design problem');
  });

  it('emits one bulleted line per active element, withdrawn elements absent', () => {
    let s = seedFullProof();
    const r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2', withdrawal_disposition: 'superseded' }], consent);
    s = r.state;
    const out = renderProofRecap(s, partitionActiveElements(s));
    expect(out).toContain('NCON-1');
    expect(out).not.toMatch(/^- \*\*NCON-2\*\*/m);
  });

  it('orders elements within a section in ID-ascending numeric order', () => {
    let s = seedFullProof();
    let r = applyOperations(s, [
      { op: 'add', type: 'NECESSARY_CONDITION', statement: 'C', collapse_test: 'c', grounding: ['EVID-1'], reasoning_chain: 'IF' },
    ], consent);
    s = r.state;
    // (seedFullProof creates NCON-1, NCON-2; explicit add above creates NCON-3;
    //  this loop creates NCON-4 through NCON-10 across 7 iterations.)
    for (let i = 0; i < 7; i++) {
      r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: `extra ${i}`, collapse_test: 'x', grounding: ['EVID-1'], reasoning_chain: 'IF' }], consent);
      s = r.state;
    }
    const out = renderProofRecap(s, partitionActiveElements(s));
    const ncSection = out.slice(out.indexOf('## Necessary Conditions'));
    const idxNCON3 = ncSection.indexOf('NCON-3');
    const idxNCON10 = ncSection.indexOf('NCON-10');
    expect(idxNCON3).toBeGreaterThanOrEqual(0);
    expect(idxNCON10).toBeGreaterThan(idxNCON3);
  });

  it('renders rules with >= 3 numbered sub-clauses with parenthetical pointer', () => {
    let s = seedFullProof();
    const r = applyOperations(s, [
      { op: 'add', type: 'RULE',
        statement: 'Big rule.\n  21.1 a\n  21.2 b\n  21.3 c',
        source: 'designer' },
    ], consent);
    s = r.state;
    const out = renderProofRecap(s, partitionActiveElements(s));
    expect(out).toContain('3 sub-clauses — request deep render to view in full');
  });

  it('reads from the partition object rather than re-deriving from raw state (AC-2.3 sub-assertion d)', () => {
    const s = seedFullProof();
    const partition = partitionActiveElements(s);
    const fakeRisk = {
      id: 'RISK-99',
      type: 'RISK',
      status: 'active',
      statement: 'fake risk pushed only into partition lane, not into state.elements',
      basis: [],
    };
    partition.activeRisks.push(fakeRisk);
    const out = renderProofRecap(s, partition);
    expect(out).toContain('RISK-99');
    expect(out).toContain('fake risk pushed only into partition lane');
    expect(s.elements.get('RISK-99')).toBeUndefined();
  });
});

describe('renderElementDeep', () => {
  it('returns markdown for an in-scope element with all sub-fields', () => {
    const s = seedFullProof();
    const out = renderElementDeep('NCON-1', s);
    expect(out).toContain('NCON-1');
    expect(out).toContain('must Q');
    expect(out).toContain('breaks if no Q');
  });

  it('surfaces withdrawal_disposition for withdrawn elements', () => {
    let s = seedFullProof();
    const r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2', withdrawal_disposition: 'superseded' }], consent);
    s = r.state;
    const out = renderElementDeep('NCON-2', s);
    expect(out).toContain('NCON-2');
    expect(out).toContain('superseded');
  });

  it('returns null for an unknown ID (handler will translate to ELEMENT_NOT_FOUND)', () => {
    const s = seedFullProof();
    expect(renderElementDeep('NCON-999', s)).toBeNull();
  });
});
