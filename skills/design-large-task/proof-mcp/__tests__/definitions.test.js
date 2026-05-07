import { describe, it, expect } from 'vitest';
import { createDefinition, validateDefinitionInput, queryOverlapCandidates } from '../definitions.js';
import { initializeState, manageDefinitions } from '../state.js';

const consent = { source: 'designer', rationale: 't' };

describe('definitions', () => {
  it('createDefinition produces shaped object', () => {
    const d = createDefinition({ canonical_name: 'Concern', aliases: ['concern'], definition: 'x', sense_constraints: null }, 'DEFN-1', 0);
    expect(d).toMatchObject({
      id: 'DEFN-1', canonical_name: 'Concern', aliases: ['concern'],
      definition: 'x', status: 'draft', source: 'agent-derivation',
      addedInRound: 0, revision: 0,
    });
  });

  it('validateDefinitionInput requires canonical_name and definition', () => {
    expect(validateDefinitionInput({}).valid).toBe(false);
    expect(validateDefinitionInput({ canonical_name: 'x', definition: 'd' }).valid).toBe(true);
  });

  it('manageDefinitions add succeeds with valid consent', () => {
    let s = initializeState('test problem');
    const [id, after, error] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    expect(error).toBeNull();
    expect(after.definitions).toHaveLength(1);
    expect(id).toMatch(/^DEFN-/);
  });

  it('manageDefinitions ratify transitions status', () => {
    let s = initializeState('test problem');
    let id;
    [id, s] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    [, s] = manageDefinitions(s, 'ratify', { id }, consent);
    const d = s.definitions.find(x => x.id === id);
    expect(d.status).toBe('ratified');
  });

  it('manageDefinitions revise updates definition + appends history', () => {
    let s = initializeState('test problem');
    let id;
    [id, s] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'old' }, consent);
    [, s] = manageDefinitions(s, 'revise', { id, definition: 'new' }, consent);
    const d = s.definitions.find(x => x.id === id);
    expect(d.definition).toBe('new');
    expect(d.history.length).toBeGreaterThan(0);
  });

  it('manageDefinitions query-overlap returns candidates without consent', () => {
    let s = initializeState('test problem');
    [, s] = manageDefinitions(s, 'add', { canonical_name: 'Concern', definition: 'd' }, consent);
    [, s] = manageDefinitions(s, 'add', { canonical_name: 'concern_state', definition: 'd' }, consent);
    const [matches] = manageDefinitions(s, 'query-overlap', { canonical_name: 'concern' }, undefined);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('manageDefinitions add rejects without consent', () => {
    let s = initializeState('test problem');
    const [id, after, error] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, undefined);
    expect(error).toMatch(/INVALID_CONSENT/);
  });

  it('manageDefinitions deprecate routes to withdraw stub error', () => {
    let s = initializeState('test problem');
    let id;
    [id, s] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    const [, , error] = manageDefinitions(s, 'deprecate', { id }, consent);
    expect(error).toMatch(/DOMAIN_ERROR/);
    expect(error).toMatch(/withdraw/);
  });

  it('manageDefinitions add derives source from consent', () => {
    let s = initializeState('test problem');
    let [id, sd] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    const designerDef = sd.definitions.find(d => d.id === id);
    expect(designerDef.source).toBe('designer');

    const agentConsent = { source: 'agent-proposed-designer-confirmed', rationale: 't' };
    let [id2, sa] = manageDefinitions(s, 'add', { canonical_name: 'Y', definition: 'd' }, agentConsent);
    const agentDef = sa.definitions.find(d => d.id === id2);
    expect(agentDef.source).toBe('agent-derivation');
  });

  it('manageDefinitions add appends operationLog with op=add type=DEFINITION', () => {
    let s = initializeState('test problem');
    const before = (s.operationLog ?? []).length;
    const [id, after] = manageDefinitions(s, 'add', { canonical_name: 'X', definition: 'd' }, consent);
    const log = after.operationLog ?? [];
    expect(log.length).toBeGreaterThan(before);
    const entry = log[log.length - 1];
    expect(entry.op).toBe('add');
    expect(entry.type).toBe('DEFINITION');
    expect(entry.entityId).toBe(id);
  });
});
