import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Engine } from '../Engine.js';

describe('Engine public API — new signatures', () => {
  it('defineRule(ruleId, headAtom, bodyAtoms, metadata) accepts tuple form', () => {
    const e = new Engine();
    e.defineRule('r1', ['p', ['X']], [['q', ['X']]], { source: 'test' });
    expect(e.getRule('r1')).toBeDefined();
  });

  it('defineRule throws MALFORMED_RULE on non-array headAtom', () => {
    const e = new Engine();
    expect(() => e.defineRule('r1', 'not-an-array', [], {})).toThrow(
      expect.objectContaining({ code: 'MALFORMED_RULE', stage: 'translator' })
    );
  });

  it('explain(fact) accepts tuple form and returns derivation tree', () => {
    const e = new Engine();
    e.defineRule('parent_to_ancestor', ['ancestor', ['X', 'Y']], [['parent', ['X', 'Y']]], {});
    e.assertFact('parent', ['a', 'b']);
    e.derive();
    const tree = e.explain(['ancestor', ['a', 'b']]);
    expect(tree).not.toBeNull();
  });

  it('explain returns null for absent facts', () => {
    const e = new Engine();
    expect(e.explain(['nope', ['x', 'y']])).toBeNull();
  });
});

describe('AC-8.2 helper cleanup', () => {
  it('helper file is deleted', () => {
    const helperPath = resolve(import.meta.dirname, 'helpers/defineRuleObj.js');
    expect(existsSync(helperPath)).toBe(false);
  });
});
