import { describe, it, expect } from 'vitest';
import { Engine } from '../Engine.js';
import { V } from '../Unifier.js';
import { defineRuleObj } from './helpers/defineRuleObj.js';

describe('Engine.explain', () => {
  function buildAncestor() {
    const e = new Engine();
    e.assertFact('parent', ['a', 'b']);
    e.assertFact('parent', ['b', 'c']);
    defineRuleObj(e, {
      ruleId: 'anc1',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [{ predicate: 'parent', arity: 2, args: [V('X'), V('Y')], negated: false }]
    });
    defineRuleObj(e, {
      ruleId: 'anc2',
      head: { predicate: 'ancestor', arity: 2, args: [V('X'), V('Y')] },
      body: [
        { predicate: 'parent', arity: 2, args: [V('X'), V('Z')], negated: false },
        { predicate: 'ancestor', arity: 2, args: [V('Z'), V('Y')], negated: false }
      ]
    });
    e.derive();
    return e;
  }

  it('returns a derivation tree for a derived fact', () => {
    const e = buildAncestor();
    const tree = e.explain(['ancestor', ['a', 'c']]);
    expect(tree).not.toBeNull();
    expect(tree.fact.predicate).toBe('ancestor');
    expect(tree.ruleId).toBe('anc2');
    expect(tree.children).toBeInstanceOf(Array);
    expect(tree.children.length).toBe(2);
  });

  it('leaves are EDB facts (children empty or marked source: edb)', () => {
    const e = buildAncestor();
    const tree = e.explain(['ancestor', ['a', 'b']]);
    expect(tree.ruleId).toBe('anc1');
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].source).toBe('edb');
  });

  it('returns null for non-derived fact', () => {
    const e = buildAncestor();
    expect(e.explain(['ancestor', ['x', 'y']])).toBeNull();
  });

  it('returns null after retraction-then-rederive removes the fact', () => {
    const e = buildAncestor();
    expect(e.explain(['ancestor', ['a', 'c']])).not.toBeNull();
    e.retractFact('parent', ['b', 'c']);
    e.derive();
    expect(e.explain(['ancestor', ['a', 'c']])).toBeNull();
  });

  it('returns same canonical tree on repeated calls (deterministic)', () => {
    const e = buildAncestor();
    const t1 = e.explain(['ancestor', ['a', 'c']]);
    const t2 = e.explain(['ancestor', ['a', 'c']]);
    expect(JSON.stringify(t1)).toBe(JSON.stringify(t2));
  });
});
