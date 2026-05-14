import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';

describe('Serializer schema version 2', () => {
  it('serializeEngine emits version: 2', () => {
    const e = new Engine();
    e.defineRule('r1', ['p', ['X']], [['q', ['X']]], { src: 'test' });
    const out = e.serialize();
    expect(out.version).toBe(2);
  });

  it('loadFrom rejects version 1 blob with MALFORMED_SERIALIZED_INPUT', () => {
    const e = new Engine();
    const oldBlob = { version: 1, facts: [], rules: [] };
    expect(() => e.loadFrom(oldBlob)).toThrow(
      expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT', actualVersion: 1 })
    );
  });

  it('loadFrom rejects real v1 blob (non-empty rules in old head/body shape) with actualVersion payload', () => {
    // Realistic pass-3 v1 data: rules use internal-object head/body field names.
    // Version check must run before the shape check so callers always get the
    // structured actualVersion for any non-v2 input (AC-5.3).
    const e = new Engine();
    const realV1Blob = {
      version: 1,
      facts: [{ predicate: 'q', args: ['a'] }],
      rules: [{ ruleId: 'r1', head: { predicate: 'p', arity: 1, args: [{ var: 'X' }] }, body: [{ predicate: 'q', arity: 1, args: [{ var: 'X' }], negated: false }] }],
    };
    expect(() => e.loadFrom(realV1Blob)).toThrow(
      expect.objectContaining({ code: 'MALFORMED_SERIALIZED_INPUT', actualVersion: 1 })
    );
  });

  it('serialized rules contain tuple-form atoms with ["not"] wrapper', () => {
    const e = new Engine();
    e.defineRule('r1', ['p', ['X']], [['q', ['X']], ['not', ['r', ['X']]]], {});
    const out = e.serialize();
    expect(out.rules).toHaveLength(1);
    expect(out.rules[0].headAtom).toEqual(['p', ['X']]);
    expect(out.rules[0].bodyAtoms).toEqual([['q', ['X']], ['not', ['r', ['X']]]]);
  });

  it('round-trip: serialize then loadFrom in fresh engine produces equivalent rule set', () => {
    const e1 = new Engine();
    e1.defineRule('r1', ['p', ['X']], [['q', ['X']]], { src: 'rt' });
    e1.assertFact('q', ['a']);
    const blob = e1.serialize();
    const e2 = new Engine();
    e2.loadFrom(blob);
    expect(e2.getRule('r1')).toBeDefined();
    expect(e2.exists(['p', ['a']])).toBe(true);
  });
});
