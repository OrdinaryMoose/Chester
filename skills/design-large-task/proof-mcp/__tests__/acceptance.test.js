import { describe, it, expect } from 'vitest';
import { ELEMENT_TYPES, createElement, checkStaleRatification } from '../proof.js';
import { initializeState, addConcern, lockConcerns, applyOperations, ratifyResolveCondition } from '../state.js';
import { checkConcernCoverage, checkClosure } from '../metrics.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve as resolvePath } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolvePath(__dirname, '../../references/design-brief-template.md');
const SPECIFY_PATH = resolvePath(__dirname, '../../../design-specify/SKILL.md');
const SERVER_PATH = resolvePath(__dirname, '../server.js');

// ---------------------------------------------------------------------------
// AC-1.x — RESOLVE_CONDITION element type
// ---------------------------------------------------------------------------

describe('AC-1.1 RESOLVE_CONDITION element type registered', () => {
  it('ac-1-1-resolve-condition-registered', () => {
    expect(ELEMENT_TYPES).toContain('RESOLVE_CONDITION');
    expect(ELEMENT_TYPES[ELEMENT_TYPES.length - 1]).toBe('RESOLVE_CONDITION');
    const state = initializeState('test');
    expect(state.elementCounters.RESOLVE_CONDITION).toBe(0);
  });
});

describe('AC-1.2 RESOLVE_CONDITION created with valid fields', () => {
  it('ac-1-2-resolve-condition-create-valid', () => {
    const el = createElement(
      { type: 'RESOLVE_CONDITION', statement: 'invalid input rejected', problem_anchor: 'CERN-1' },
      'RCON-1',
      1,
    );
    expect(el.statement).toBe('invalid input rejected');
    expect(el.problem_anchor).toBe('CERN-1');
    expect(el.ratification).toBeNull();
    expect(el.status).toBe('active');
  });
});

describe('AC-1.3 RESOLVE_CONDITION rejects missing problem_anchor', () => {
  it('ac-1-3-resolve-condition-rejects-missing-anchor', () => {
    expect(() => createElement(
      { type: 'RESOLVE_CONDITION', statement: 's' },
      'RCON-1',
      1,
    )).toThrow(/problem_anchor/);
  });
});

describe('AC-1.4 RESOLVE_CONDITION rejects designer source', () => {
  it('ac-1-4-resolve-condition-rejects-designer-source', () => {
    expect(() => createElement(
      { type: 'RESOLVE_CONDITION', statement: 's', problem_anchor: 'CERN-1', source: 'designer' },
      'RCON-1',
      1,
    )).toThrow(/source/);
  });
});

describe('AC-1.5 stale-ratification sentinel empty by default', () => {
  it('ac-1-5-stale-ratification-sentinel-empty', () => {
    expect(checkStaleRatification(new Map())).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AC-2.x — Concerns lifecycle
// ---------------------------------------------------------------------------

describe('AC-2.1 addConcern appends sequential CERN IDs', () => {
  it('ac-2-1-add-concern-appends-sequential', () => {
    let state = initializeState('test');
    let id1, id2;
    [id1, state] = addConcern(state, { label: 'A' });
    expect(id1).toBe('CERN-1');
    expect(state.concerns).toHaveLength(1);
    expect(state.concernCounter).toBe(1);
    [id2, state] = addConcern(state, { label: 'B' });
    expect(id2).toBe('CERN-2');
    expect(state.concerns).toHaveLength(2);
  });
});

describe('AC-2.2 lockConcerns is irreversible', () => {
  it('ac-2-2-lock-concerns-irreversible', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    let err;
    [state, err] = lockConcerns(state);
    expect(err).toBeNull();
    expect(state.concernsLocked).toBe(true);
    [, err] = lockConcerns(state);
    expect(err).toMatch(/already locked/i);
  });
});

describe('AC-2.3 addConcern refused after lock', () => {
  it('ac-2-3-add-concern-refused-after-lock', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [state] = lockConcerns(state);
    const [id, sameState, err] = addConcern(state, { label: 'B' });
    expect(id).toBeNull();
    expect(sameState).toBe(state);
    expect(err).toMatch(/locked/i);
  });
});

describe('AC-2.4 lockConcerns refuses empty Concerns set', () => {
  it('ac-2-4-lock-concerns-refuses-empty', () => {
    const state = initializeState('test');
    const [sameState, err] = lockConcerns(state);
    expect(sameState).toBe(state);
    expect(err).toMatch(/empty/i);
  });
});

// ---------------------------------------------------------------------------
// AC-3.x — Closure conditions
// ---------------------------------------------------------------------------

describe('AC-3.1 closure refuses unlocked Concerns', () => {
  it('ac-3-1-closure-refuses-unlocked-concerns', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    const closure = checkClosure(state);
    expect(closure.reasons).toContain('Concerns must be locked before closure');
  });
});

describe('AC-3.2 closure refuses empty Concerns', () => {
  it('ac-3-2-closure-refuses-empty-concerns', () => {
    const state = initializeState('test');
    const closure = checkClosure(state);
    expect(closure.reasons.some(r => /No Concerns enumerated/.test(r))).toBe(true);
  });
});

describe('AC-3.3 closure per-Concern uncovered detection', () => {
  it('ac-3-3-closure-per-concern-uncovered', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [, state] = addConcern(state, { label: 'B' });
    [state] = lockConcerns(state);
    const closure = checkClosure(state);
    expect(closure.reasons.some(r => /CERN-2/.test(r))).toBe(true);
  });
});

describe('AC-3.4 closure permits Rule-union coverage', () => {
  it('ac-3-4-closure-permits-rule-union-coverage', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'Performance' });
    [, state] = addConcern(state, { label: 'Correctness' });
    [state] = lockConcerns(state);
    const result = applyOperations(state, [
      { op: 'add', type: 'RULE', statement: 'preserve Performance baseline', source: 'designer' },
      { op: 'add', type: 'RULE', statement: 'require CERN-2 enforcement', source: 'designer' },
    ]);
    state = result.state;
    const { uncovered } = checkConcernCoverage(state);
    expect(uncovered).toEqual([]);
  });
});

describe('AC-3.5 closure refuses unratified RC', () => {
  it('ac-3-5-closure-refuses-unratified-rc', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [state] = lockConcerns(state);
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 's', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    const closure = checkClosure(state);
    expect(closure.reasons).toContain('Unratified Resolve Conditions exist — ratify each before closure');
  });
});

// ---------------------------------------------------------------------------
// AC-4.x — ratifyResolveCondition
// ---------------------------------------------------------------------------

describe('AC-4.1 ratify single RC succeeds', () => {
  it('ac-4-1-ratify-single-rc-success', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [state] = lockConcerns(state);
    const result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 's', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    let err;
    [state, err] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'PM approves' });
    expect(err).toBeNull();
    expect(state.elements.get('RCON-1').ratification).toMatchObject({ text: 'PM approves' });
    expect(state.ratificationLog).toHaveLength(1);
    expect(state.ratificationLog[0]).toMatchObject({ event: 'ratified', target: 'RCON-1' });
  });
});

describe('AC-4.2 ratify tool schema is singular', () => {
  it('ac-4-2-ratify-tool-schema-singular', () => {
    const src = readFileSync(SERVER_PATH, 'utf-8');
    const m = src.match(/name:\s*'ratify_resolve_condition'[\s\S]*?required:\s*\[([^\]]+)\]/);
    expect(m).not.toBeNull();
    expect(m[1]).toMatch(/'element_id'/);
    expect(m[1]).not.toMatch(/'element_ids'/);
  });
});

describe('AC-4.3 ratify rejects non-RC element', () => {
  it('ac-4-3-ratify-rejects-non-rc', () => {
    let state = initializeState('test');
    const result = applyOperations(state, [
      { op: 'add', type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
    ]);
    state = result.state;
    const [, err] = ratifyResolveCondition(state, { elementId: 'EVID-1', ratificationText: 'x' });
    expect(err).toMatch(/RESOLVE_CONDITION/);
  });
});

// ---------------------------------------------------------------------------
// AC-5.x — Revise-clears-ratification
// ---------------------------------------------------------------------------

describe('AC-5.1 revise statement clears ratification', () => {
  it('ac-5-1-revise-statement-clears-ratification', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [state] = lockConcerns(state);
    let result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 'orig', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'ok' });
    result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', statement: 'updated' },
    ]);
    state = result.state;
    expect(state.elements.get('RCON-1').ratification).toBeNull();
    const cleared = state.ratificationLog.find(l => l.event === 'cleared-on-revise');
    expect(cleared).toBeDefined();
    expect(cleared.fields).toEqual(['statement']);
  });
});

describe('AC-5.2 revise problem_anchor clears ratification', () => {
  it('ac-5-2-revise-anchor-clears-ratification', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [, state] = addConcern(state, { label: 'B' });
    [state] = lockConcerns(state);
    let result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 's', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'ok' });
    result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', problem_anchor: 'CERN-2' },
    ]);
    state = result.state;
    expect(state.elements.get('RCON-1').ratification).toBeNull();
    const cleared = state.ratificationLog.find(l => l.event === 'cleared-on-revise');
    expect(cleared).toBeDefined();
    expect(cleared.fields).toEqual(['problem_anchor']);
  });
});

describe('AC-5.3 revise other field preserves ratification', () => {
  it('ac-5-3-revise-other-preserves-ratification', () => {
    let state = initializeState('test');
    [, state] = addConcern(state, { label: 'A' });
    [state] = lockConcerns(state);
    let result = applyOperations(state, [
      { op: 'add', type: 'RESOLVE_CONDITION', statement: 's', problem_anchor: 'CERN-1' },
    ]);
    state = result.state;
    [state] = ratifyResolveCondition(state, { elementId: 'RCON-1', ratificationText: 'ok' });
    const logLenBefore = state.ratificationLog.length;
    result = applyOperations(state, [
      { op: 'revise', target: 'RCON-1', rejected_alternatives: ['x'] },
    ]);
    state = result.state;
    expect(state.elements.get('RCON-1').ratification).not.toBeNull();
    expect(state.ratificationLog).toHaveLength(logLenBefore);
  });
});

// ---------------------------------------------------------------------------
// AC-6.x — Brief template sections
// ---------------------------------------------------------------------------

describe('AC-6.1 Brief template includes Resolve Conditions section', () => {
  it('ac-6-1-brief-template-has-resolve-conditions', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf-8');
    expect(content).toMatch(/^### Resolve Conditions/m);
    expect(content).not.toMatch(/^### Acceptance Criteria/m);
    expect(content).not.toMatch(/^## Acceptance Criteria/m);
  });
});

describe('AC-6.2 Brief template includes Concerns section', () => {
  it('ac-6-2-brief-template-has-concerns', () => {
    const content = readFileSync(TEMPLATE_PATH, 'utf-8');
    expect(content).toMatch(/^### Concerns/m);
    expect(content).toMatch(/CERN-/);
    expect(content).toMatch(/RCON-/);
  });
});

// ---------------------------------------------------------------------------
// AC-7.x — Existing element types unchanged
// ---------------------------------------------------------------------------

describe('AC-7.1 five existing element types unchanged', () => {
  it('ac-7-1-five-existing-types-unchanged', () => {
    const ev = createElement({ type: 'EVIDENCE', statement: 's', source: 'codebase' }, 'EVID-1', 1);
    expect(ev.type).toBe('EVIDENCE');
    const rule = createElement({ type: 'RULE', statement: 's', source: 'designer' }, 'RULE-1', 1);
    expect(rule.type).toBe('RULE');
    const perm = createElement({ type: 'PERMISSION', statement: 's', source: 'designer', relieves: 'RULE-1' }, 'PERM-1', 1);
    expect(perm.type).toBe('PERMISSION');
    const nc = createElement({
      type: 'NECESSARY_CONDITION', statement: 's',
      grounding: ['EVID-1'], collapse_test: 'breaks', reasoning_chain: 'IF...THEN',
    }, 'NCON-1', 1);
    expect(nc.type).toBe('NECESSARY_CONDITION');
    const risk = createElement({ type: 'RISK', statement: 's' }, 'RISK-1', 1);
    expect(risk.type).toBe('RISK');
  });
});

// ---------------------------------------------------------------------------
// AC-8.x — design-specify SKILL.md references
// ---------------------------------------------------------------------------

describe('AC-8.1 design-specify SKILL.md references new sections', () => {
  it('ac-8-1-specify-skill-references-new-sections', () => {
    const content = readFileSync(SPECIFY_PATH, 'utf-8');
    expect(content).toMatch(/9-section envelope/);
    expect(content).not.toMatch(/8-section envelope/);
    expect(content).toMatch(/Resolve Conditions/);
    expect(content).toMatch(/Concerns/);
    expect(content).toMatch(/RCON-.*AC-/s);
  });
});
