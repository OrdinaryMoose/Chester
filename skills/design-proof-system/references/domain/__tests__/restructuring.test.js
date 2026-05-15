import { describe, it, expect } from 'vitest';
import { validateOpenProofPayload, expandIntoOperations } from '../restructuring.js';

describe('restructuring', () => {
  it('validateOpenProofPayload accepts well-formed payload', () => {
    const payload = { elements: [{ category: 'evidence', args: { source: 'codebase', claim: 'x' } }] };
    expect(() => validateOpenProofPayload(payload)).not.toThrow();
  });

  it('validateOpenProofPayload rejects payload missing elements array', () => {
    expect(() => validateOpenProofPayload({})).toThrow(/RESTRUCTURE/);
  });

  it('expandIntoOperations returns one add op per element', () => {
    const payload = { elements: [
      { category: 'evidence', args: { source: 'c', claim: 'x' } },
      { category: 'rule', args: { statement: 's' } },
    ]};
    const ops = expandIntoOperations(payload);
    expect(ops).toHaveLength(2);
    // expandIntoOperations emits the ACTION_LABELS.ADD value ('add') as the verb.
    // The bridge facade layer is what exposes it as `addElement`; the open-proof
    // pipeline routes through runOperation('add', ...).
    expect(ops[0].verb).toBe('add');
  });
});
