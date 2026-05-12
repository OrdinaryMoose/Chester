import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';

describe('Engine lifecycle and serialization', () => {
  it('clear empties EDB and rule store', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    e.clear();
    expect(e.factExists('p', ['a'])).toBe(false);
    expect(e.getRule('r')).toBeUndefined();
    expect(e.query(['p', [V('X')]])).toEqual([]);
  });

  it('serialize/loadFrom round-trip preserves observable state', () => {
    const e1 = new Engine();
    e1.assertFact('p', ['a']);
    e1.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    const s = e1.serialize();
    const json = JSON.stringify(s);
    const reloaded = JSON.parse(json);
    const e2 = new Engine();
    e2.loadFrom(reloaded);
    expect(e2.factExists('p', ['a'])).toBe(true);
    expect(e2.query(['q', [V('X')]])).toEqual([{ X: 'a' }]);
  });

  it('serialize excludes derived facts (IDB recomputes on load)', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.defineRule({
      ruleId: 'r',
      head: { predicate: 'q', arity: 1, args: [V('X')] },
      body: [{ predicate: 'p', arity: 1, args: [V('X')], negated: false }]
    });
    e.derive();
    const s = e.serialize();
    expect(s.idb).toBeUndefined();
    expect(s.derived).toBeUndefined();
  });

  it('loadFrom rejects malformed input with MALFORMED_SERIALIZED_INPUT', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    expect(() => e.loadFrom('not-an-object')).toThrow(
      expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT' })
    );
    expect(() => e.loadFrom({ wrong: 'shape' })).toThrow(
      expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT' })
    );
    // Engine state unchanged.
    expect(e.factExists('p', ['a'])).toBe(true);
  });

  it('loadFrom on empty valid input produces empty engine', () => {
    const e = new Engine();
    e.assertFact('p', ['a']);
    e.loadFrom({ version: 1, facts: [], rules: [] });
    expect(e.factExists('p', ['a'])).toBe(false);
    expect(e.query(['p', [V('X')]])).toEqual([]);
  });
});
