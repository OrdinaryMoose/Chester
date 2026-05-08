// proof-mcp/__tests__/closing-argument.test.js
import { describe, it, expect } from 'vitest';
import { deriveClosingArgument } from '../closing-argument.js';
import { initializeState, applyOperations, addConcern, lockConcerns, ratifyResolveCondition, manageFriction, overrideFrictionDisposition, withdrawConcern, manageDefinitions, withdrawDefinition } from '../state.js';

function build() {
  let s = initializeState('design problem');
  let [, sa] = addConcern(s, { label: 'concern X', description: 'd' }, { source: 'designer', rationale: 'test' });
  s = sa;
  [s] = lockConcerns(s, { source: 'designer', rationale: 'test' });
  let r = applyOperations(s, [
    { op: 'add', type: 'EVIDENCE', statement: 'evidence body', source: 'codebase' },
    { op: 'add', type: 'NECESSARY_CONDITION', statement: 'must Q', collapse_test: 'breaks if no Q', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN must Q' },
    { op: 'add', type: 'RESOLVE_CONDITION', statement: 'system Qs', problem_anchor: 'CERN-1', grounding: ['NCON-1'] },
  ], { source: 'designer', rationale: 'test' });
  s = r.state;
  [s] = ratifyResolveCondition(s, { elementId: 'RCON-1', ratificationText: 'ratified' }, { source: 'designer', rationale: 'test' });
  return s;
}

describe('deriveClosingArgument', () => {
  it('returns at minimum the required keys', () => {
    const s = build();
    const out = deriveClosingArgument(s);
    const required = ['derivedAtRound', 'problemStatement', 'lockedConcerns', 'resolveConditions', 'phantomNCs', 'phantomRCs', 'liveFriction', 'phantomFriction', 'compositeScore', 'closurePermitted', 'closureReasons'];
    for (const k of required) expect(out).toHaveProperty(k);
    expect(out.derivedAtRound).toBe(s.round);
  });

  it('walks live RCs with grounding NCs', () => {
    const s = build();
    const out = deriveClosingArgument(s);
    expect(out.resolveConditions.length).toBe(1);
    const rc = out.resolveConditions[0];
    expect(rc.id).toBe('RCON-1');
    expect(rc.problem_anchor).toBe('CERN-1');
    expect(rc.groundingNCs.some(nc => nc.id === 'NCON-1')).toBe(true);
  });

  it('is idempotent — same state produces deeply equal output', () => {
    const s = build();
    const a = deriveClosingArgument(s);
    const b = deriveClosingArgument(s);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('includes phantom NC with disposition tag', () => {
    let s = build();
    let r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC2', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN NC2' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2', withdrawal_disposition: 'superseded' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    const out = deriveClosingArgument(s);
    expect(out.phantomNCs.some(p => p.id === 'NCON-2' && p.dispositionTag === 'superseded')).toBe(true);
  });

  it('surfaces unclassified disposition for phantoms with no withdrawal_disposition', () => {
    let s = build();
    let r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'NC3', collapse_test: 'a', grounding: ['EVID-1'], reasoning_chain: 'IF evidence body THEN NC3' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    // simulate a legacy element by deleting withdrawal_disposition
    r = applyOperations(s, [{ op: 'withdraw', target: 'NCON-2' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    delete s.elements.get('NCON-2').withdrawal_disposition;
    const out = deriveClosingArgument(s);
    expect(out.phantomNCs.some(p => p.id === 'NCON-2' && p.dispositionTag === 'unclassified')).toBe(true);
  });

  it('lockedConcerns is empty during planning (AC-6.1)', () => {
    const s = build();
    // build() locks concerns and leaves proofStatus='planning'.
    // Force planning explicitly to assert partition predicate is on proofStatus.
    s.proofStatus = 'planning';
    const env = deriveClosingArgument(s);
    expect(env.lockedConcerns).toEqual([]);
  });

  it('lockedConcerns carries every active Concern at finish (AC-6.1)', () => {
    const s = build();
    s.proofStatus = 'finish';
    const env = deriveClosingArgument(s);
    expect(env.lockedConcerns.length).toBe(1);
    expect(env.lockedConcerns[0].id).toBe('CERN-1');
  });

  it('partitions FRICTION elements: liveFriction holds active, phantomFriction holds withdrawn', () => {
    let s = build();
    // add a second NC so we have two anchorable NCs for the friction
    let r = applyOperations(s, [{ op: 'add', type: 'NECESSARY_CONDITION', statement: 'must not Q', collapse_test: 'breaks if Q forced', grounding: ['EVID-1'], reasoning_chain: 'IF evidence THEN must-not Q' }], { source: 'designer', rationale: 'test' });
    s = r.state;
    // add an active friction
    let [, sActive] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-1', anchor_b: 'NCON-2',
      disposition: 'lived-with', statement: 'Q vs not-Q',
    }, { source: 'designer', rationale: 'test' });
    s = sActive;
    // add a second friction and dismiss it (terminal disposition → withdrawn)
    let [, sBoth] = manageFriction(s, {
      op: 'add', friction_shape: 'nc-nc-opposing-pull',
      anchor_a: 'NCON-2', anchor_b: 'NCON-1',
      disposition: 'lived-with', statement: 'reverse pair',
    }, { source: 'designer', rationale: 'test' });
    s = sBoth;
    let [sDismissed] = overrideFrictionDisposition(s, { elementId: 'FRIC-2', disposition: 'not-really-friction' }, { source: 'designer', rationale: 'test' });
    s = sDismissed;

    const out = deriveClosingArgument(s);
    expect(out.liveFriction.length).toBe(1);
    expect(out.liveFriction[0].id).toBe('FRIC-1');
    expect(out.liveFriction.every(f => f.id !== 'FRIC-2')).toBe(true);
    expect(out.phantomFriction.length).toBe(1);
    expect(out.phantomFriction[0].id).toBe('FRIC-2');
    expect(out.phantomFriction[0].dispositionTag).toBe('not-really-friction');
  });
});

describe('deriveClosingArgument extended envelope (NC-9 + NC-16)', () => {
  it('includes phantomConcerns array with disposition + preserved source', () => {
    let s = initializeState('p');
    let [, sa] = addConcern(s, { label: 'concern X', description: 'd' }, { source: 'designer', rationale: 'test' });
    s = sa;
    let [, sb] = addConcern(s, { label: 'concern Y', description: 'd2' }, { source: 'designer', rationale: 'test' });
    s = sb;
    [s] = lockConcerns(s, { source: 'designer', rationale: 'test' });
    [s] = withdrawConcern(s, 'CERN-2', 'scope-removed', { source: 'designer', rationale: 'test' });
    s.proofStatus = 'finish'; // lockedConcerns partition fires at finish (AC-6.1)
    const env = deriveClosingArgument(s);
    expect(env.phantomConcerns).toBeDefined();
    expect(Array.isArray(env.phantomConcerns)).toBe(true);
    expect(env.phantomConcerns.length).toBe(1);
    expect(env.phantomConcerns[0].id).toBe('CERN-2');
    expect(env.phantomConcerns[0].withdrawal_disposition).toBe('scope-removed');
    // lockedConcerns must exclude the withdrawn concern
    expect(env.lockedConcerns.every(c => c.id !== 'CERN-2')).toBe(true);
    expect(env.lockedConcerns.some(c => c.id === 'CERN-1')).toBe(true);
  });

  it('includes activeNCs (active + ratificationStatus: ratified) standalone', () => {
    let s = build();
    // Promote NCON-1 to ratified
    s.elements.get('NCON-1').ratificationStatus = 'ratified';
    const env = deriveClosingArgument(s);
    expect(env.activeNCs).toBeDefined();
    expect(Array.isArray(env.activeNCs)).toBe(true);
    expect(env.activeNCs.some(nc => nc.id === 'NCON-1')).toBe(true);
    expect(env.activeNCs.every(nc => nc.status === 'active' && nc.ratificationStatus === 'ratified')).toBe(true);
  });

  it('includes draftNCs (active + ratificationStatus: draft) standalone', () => {
    const s = build();
    // Default ratificationStatus from createElement on NCs is 'draft'.
    const env = deriveClosingArgument(s);
    expect(env.draftNCs).toBeDefined();
    expect(Array.isArray(env.draftNCs)).toBe(true);
    expect(env.draftNCs.some(nc => nc.id === 'NCON-1')).toBe(true);
    expect(env.draftNCs.every(nc => nc.status === 'active' && nc.ratificationStatus === 'draft')).toBe(true);
  });

  it('includes activeRules / activePermissions / activeRisks standalone', () => {
    let s = initializeState('p');
    let [, sa] = addConcern(s, { label: 'c', description: 'd' }, { source: 'designer', rationale: 'test' });
    s = sa;
    [s] = lockConcerns(s, { source: 'designer', rationale: 'test' });
    let r = applyOperations(s, [
      { op: 'add', type: 'EVIDENCE', statement: 'e', source: 'codebase' },
      { op: 'add', type: 'RULE', statement: 'rule one', source: 'designer', basis: ['EVID-1'], rejected_alternatives: ['none'] },
      { op: 'add', type: 'PERMISSION', statement: 'permission one', source: 'designer', relieves: 'RULE-1', basis: ['EVID-1'], rejected_alternatives: ['none'] },
      { op: 'add', type: 'RISK', statement: 'risk one', source: 'codebase', basis: ['EVID-1'], rejected_alternatives: ['none'] },
    ], { source: 'designer', rationale: 'test' });
    s = r.state;
    const env = deriveClosingArgument(s);
    expect(env.activeRules).toBeDefined();
    expect(env.activePermissions).toBeDefined();
    expect(env.activeRisks).toBeDefined();
    expect(env.activeRules.some(el => el.id === 'RULE-1')).toBe(true);
    expect(env.activePermissions.some(el => el.id === 'PERM-1')).toBe(true);
    expect(env.activeRisks.some(el => el.id === 'RISK-1')).toBe(true);
  });

  it('includes ratifiedDefinitions and phantomDefinitions', () => {
    let s = initializeState('p');
    let [, sa] = addConcern(s, { label: 'c', description: 'd' }, { source: 'designer', rationale: 'test' });
    s = sa;
    [s] = lockConcerns(s, { source: 'designer', rationale: 'test' });
    let [, ns1] = manageDefinitions(s, 'add', { canonical_name: 'thing-one', definition: 'a thing', aliases: [], sense_constraints: null }, { source: 'designer', rationale: 'test' });
    s = ns1;
    let [, ns2] = manageDefinitions(s, 'add', { canonical_name: 'thing-two', definition: 'another thing', aliases: [], sense_constraints: null }, { source: 'designer', rationale: 'test' });
    s = ns2;
    let [, ns3] = manageDefinitions(s, 'ratify', { id: 'DEFN-1' }, { source: 'designer', rationale: 'test' });
    s = ns3;
    [s] = withdrawDefinition(s, 'DEFN-2', 'scope-removed', { source: 'designer', rationale: 'test' });
    const env = deriveClosingArgument(s);
    expect(env.ratifiedDefinitions).toBeDefined();
    expect(env.phantomDefinitions).toBeDefined();
    expect(env.ratifiedDefinitions.some(d => d.id === 'DEFN-1' && d.status === 'ratified')).toBe(true);
    expect(env.phantomDefinitions.some(d => d.id === 'DEFN-2')).toBe(true);
  });

  it('includes closureProvenance per cited element with derivationChain', () => {
    let s = build();
    s.elements.get('NCON-1').ratificationStatus = 'ratified';
    s.proofStatus = 'finish'; // lockedConcerns partition fires at finish (AC-6.1)
    const env = deriveClosingArgument(s);
    expect(env.closureProvenance).toBeDefined();
    expect(Array.isArray(env.closureProvenance)).toBe(true);
    // Should have an entry for the active NC, RC, and concern at minimum.
    const ids = env.closureProvenance.map(p => p.entityId);
    expect(ids).toContain('NCON-1');
    expect(ids).toContain('RCON-1');
    expect(ids).toContain('CERN-1');
    // Each provenance entry has expected shape.
    const ncProv = env.closureProvenance.find(p => p.entityId === 'NCON-1');
    expect(ncProv).toHaveProperty('entityId');
    expect(ncProv).toHaveProperty('type');
    expect(ncProv).toHaveProperty('source');
    expect(ncProv).toHaveProperty('derivationChain');
    expect(ncProv).toHaveProperty('ratification');
    expect(ncProv).toHaveProperty('restructuringActionLabel');
    expect(Array.isArray(ncProv.derivationChain)).toBe(true);
    // Derivation chain should include the 'add' operation for NCON-1.
    expect(ncProv.derivationChain.some(e => e.entityId === 'NCON-1' && e.op === 'add')).toBe(true);
    // Type is recovered from the element (or via entityType fallback).
    expect(ncProv.type).toBe('NECESSARY_CONDITION');
  });

  it('reads restructuringActionLabel from el.restructuring.restructuring_action_label (admitted-element shape)', () => {
    let s = build();
    s.elements.get('NCON-1').ratificationStatus = 'ratified';
    // Mimic the persisted shape from open_proof's admittedToAddOp:
    // element.restructuring = { metadata, restructuring_action_label, provenance }.
    const nc = s.elements.get('NCON-1');
    nc.restructuring = {
      metadata: { foo: 'bar' },
      restructuring_action_label: 'verbatim-preserve',
      provenance: { source_citation: 'src' },
    };
    const env = deriveClosingArgument(s);
    const ncProv = env.closureProvenance.find(p => p.entityId === 'NCON-1');
    expect(ncProv.restructuringActionLabel).toBe('verbatim-preserve');
  });

  it('is pure: two consecutive calls produce deep-equal output', () => {
    const s = build();
    const a = deriveClosingArgument(s);
    const b = deriveClosingArgument(s);
    expect(a).toEqual(b);
    // Also confirm input state was not mutated.
    expect(s.elements.has('NCON-1')).toBe(true);
  });

  it('returns empty arrays (not undefined) for absent collections', () => {
    let s = initializeState('p');
    let [, sa] = addConcern(s, { label: 'c', description: 'd' }, { source: 'designer', rationale: 'test' });
    s = sa;
    [s] = lockConcerns(s, { source: 'designer', rationale: 'test' });
    s.proofStatus = 'finish'; // lockedConcerns partition fires at finish (AC-6.1)
    const env = deriveClosingArgument(s);
    for (const key of [
      'lockedConcerns', 'phantomConcerns', 'resolveConditions', 'phantomRCs',
      'activeNCs', 'draftNCs', 'phantomNCs',
      'activeRules', 'activePermissions', 'activeRisks',
      'liveFriction', 'phantomFriction',
      'ratifiedDefinitions', 'phantomDefinitions',
      'closureProvenance',
    ]) {
      expect(env[key]).toBeDefined();
      expect(Array.isArray(env[key])).toBe(true);
    }
    // phantomConcerns / phantomRCs / etc. should be empty arrays here.
    expect(env.phantomConcerns.length).toBe(0);
    expect(env.activeNCs.length).toBe(0);
    expect(env.closureProvenance.length).toBe(1); // CERN-1 cited
  });
});
