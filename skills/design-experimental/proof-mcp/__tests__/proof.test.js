import { describe, it, expect } from 'vitest';
import {
  ELEMENT_TYPES,
  createElement,
  validateBasisRefs,
  traverseBasisChain,
  checkWithdrawnBasis,
  checkBoundaryCollision,
  checkConfidenceInversion,
  checkStaleDependency,
  checkAllIntegrity,
} from '../proof.js';

describe('ELEMENT_TYPES', () => {
  it('contains all seven types', () => {
    expect(ELEMENT_TYPES).toEqual([
      'GIVEN', 'CONSTRAINT', 'ASSERTION', 'DECISION', 'OPEN', 'RISK', 'BOUNDARY',
    ]);
  });
});

describe('createElement', () => {
  it('creates a basic CONSTRAINT element', () => {
    const el = createElement({ type: 'CONSTRAINT', statement: 'Must be fast' }, 'c1', 1);
    expect(el).toEqual({
      id: 'c1',
      type: 'CONSTRAINT',
      statement: 'Must be fast',
      source: null,
      basis: [],
      over: null,
      confidence: null,
      reason: null,
      status: 'active',
      resolvedBy: null,
      addedInRound: 1,
      revisedInRound: null,
      revision: 0,
    });
  });

  it('creates a GIVEN element with source', () => {
    const el = createElement({ type: 'GIVEN', statement: 'API exists', source: 'docs' }, 'g1', 0);
    expect(el.type).toBe('GIVEN');
    expect(el.source).toBe('docs');
  });

  it('creates an ASSERTION element with confidence', () => {
    const el = createElement(
      { type: 'ASSERTION', statement: 'It will scale', confidence: 0.8, basis: ['g1'] },
      'a1', 2,
    );
    expect(el.confidence).toBe(0.8);
    expect(el.basis).toEqual(['g1']);
  });

  it('creates a DECISION element with over field', () => {
    const el = createElement(
      { type: 'DECISION', statement: 'Use Redis', over: ['a1', 'a2'] },
      'd1', 3,
    );
    expect(el.over).toEqual(['a1', 'a2']);
  });

  it('creates a DECISION element with empty over array', () => {
    const el = createElement(
      { type: 'DECISION', statement: 'Use Redis', over: [] },
      'd1', 3,
    );
    expect(el.over).toEqual([]);
  });

  it('creates a BOUNDARY element with reason', () => {
    const el = createElement(
      { type: 'BOUNDARY', statement: 'No SQL', reason: 'Legacy constraint' },
      'b1', 1,
    );
    expect(el.reason).toBe('Legacy constraint');
  });

  it('creates an OPEN element', () => {
    const el = createElement({ type: 'OPEN', statement: 'Need to decide on DB' }, 'o1', 1);
    expect(el.type).toBe('OPEN');
    expect(el.status).toBe('active');
  });

  it('creates a RISK element', () => {
    const el = createElement({ type: 'RISK', statement: 'Might be slow' }, 'r1', 1);
    expect(el.type).toBe('RISK');
  });

  // Validation failures
  it('rejects unknown type', () => {
    expect(() => createElement({ type: 'UNKNOWN', statement: 'x' }, 'x1', 0))
      .toThrow(/type/i);
  });

  it('rejects missing statement', () => {
    expect(() => createElement({ type: 'CONSTRAINT' }, 'x1', 0))
      .toThrow(/statement/i);
  });

  it('rejects empty statement', () => {
    expect(() => createElement({ type: 'CONSTRAINT', statement: '' }, 'x1', 0))
      .toThrow(/statement/i);
  });

  it('rejects ASSERTION without confidence', () => {
    expect(() => createElement({ type: 'ASSERTION', statement: 'x' }, 'x1', 0))
      .toThrow(/confidence/i);
  });

  it('rejects ASSERTION with out-of-range confidence', () => {
    expect(() => createElement({ type: 'ASSERTION', statement: 'x', confidence: 1.5 }, 'x1', 0))
      .toThrow(/confidence/i);
    expect(() => createElement({ type: 'ASSERTION', statement: 'x', confidence: -0.1 }, 'x1', 0))
      .toThrow(/confidence/i);
  });

  it('rejects DECISION without over field', () => {
    expect(() => createElement({ type: 'DECISION', statement: 'x' }, 'x1', 0))
      .toThrow(/over/i);
  });

  it('rejects BOUNDARY without reason', () => {
    expect(() => createElement({ type: 'BOUNDARY', statement: 'x' }, 'x1', 0))
      .toThrow(/reason/i);
  });

  it('rejects GIVEN without source', () => {
    expect(() => createElement({ type: 'GIVEN', statement: 'x' }, 'x1', 0))
      .toThrow(/source/i);
  });

  it('preserves optional fields passed in input', () => {
    const el = createElement(
      { type: 'CONSTRAINT', statement: 'x', basis: ['a', 'b'], source: 'spec' },
      'c1', 1,
    );
    expect(el.basis).toEqual(['a', 'b']);
    expect(el.source).toBe('spec');
  });
});

describe('validateBasisRefs', () => {
  const elements = new Map([
    ['a1', { id: 'a1' }],
    ['a2', { id: 'a2' }],
  ]);

  it('returns empty array when all refs exist', () => {
    expect(validateBasisRefs(['a1', 'a2'], elements)).toEqual([]);
  });

  it('returns error strings for missing refs', () => {
    const errors = validateBasisRefs(['a1', 'missing1', 'missing2'], elements);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/missing1/);
    expect(errors[1]).toMatch(/missing2/);
  });

  it('returns empty array for empty basis', () => {
    expect(validateBasisRefs([], elements)).toEqual([]);
  });
});

describe('traverseBasisChain', () => {
  it('traverses a linear chain', () => {
    const elements = new Map([
      ['a', { id: 'a', basis: ['b'], status: 'active' }],
      ['b', { id: 'b', basis: ['c'], status: 'active' }],
      ['c', { id: 'c', basis: [], status: 'active' }],
    ]);
    const result = traverseBasisChain(elements, 'a');
    expect(result).toContain('b');
    expect(result).toContain('c');
    // Should not contain the start element itself
    expect(result).not.toContain('a');
  });

  it('handles cycles without infinite loop', () => {
    const elements = new Map([
      ['a', { id: 'a', basis: ['b'], status: 'active' }],
      ['b', { id: 'b', basis: ['a'], status: 'active' }],
    ]);
    const result = traverseBasisChain(elements, 'a');
    expect(result).toContain('b');
    // Should visit each node at most once
    expect(new Set(result).size).toBe(result.length);
  });

  it('skips withdrawn elements', () => {
    const elements = new Map([
      ['a', { id: 'a', basis: ['b'], status: 'active' }],
      ['b', { id: 'b', basis: ['c'], status: 'withdrawn' }],
      ['c', { id: 'c', basis: [], status: 'active' }],
    ]);
    const result = traverseBasisChain(elements, 'a');
    // b is withdrawn, so it and its descendants should not be traversed
    expect(result).not.toContain('b');
    expect(result).not.toContain('c');
  });

  it('returns empty array when start has no basis', () => {
    const elements = new Map([
      ['a', { id: 'a', basis: [], status: 'active' }],
    ]);
    expect(traverseBasisChain(elements, 'a')).toEqual([]);
  });

  it('handles missing elements gracefully', () => {
    const elements = new Map([
      ['a', { id: 'a', basis: ['nonexistent'], status: 'active' }],
    ]);
    expect(traverseBasisChain(elements, 'a')).toEqual([]);
  });
});

describe('checkWithdrawnBasis', () => {
  it('flags active elements citing withdrawn elements', () => {
    const elements = new Map([
      ['a1', { id: 'a1', basis: ['w1'], status: 'active' }],
      ['w1', { id: 'w1', basis: [], status: 'withdrawn' }],
    ]);
    const warnings = checkWithdrawnBasis(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual({
      type: 'withdrawn-basis',
      element_id: 'a1',
      cited_id: 'w1',
      message: expect.any(String),
    });
  });

  it('returns empty when no withdrawn basis', () => {
    const elements = new Map([
      ['a1', { id: 'a1', basis: ['a2'], status: 'active' }],
      ['a2', { id: 'a2', basis: [], status: 'active' }],
    ]);
    expect(checkWithdrawnBasis(elements)).toEqual([]);
  });

  it('ignores withdrawn elements as the citing element', () => {
    const elements = new Map([
      ['w1', { id: 'w1', basis: ['w2'], status: 'withdrawn' }],
      ['w2', { id: 'w2', basis: [], status: 'withdrawn' }],
    ]);
    expect(checkWithdrawnBasis(elements)).toEqual([]);
  });
});

describe('checkBoundaryCollision', () => {
  it('flags decisions whose basis chain overlaps with boundary basis', () => {
    const elements = new Map([
      ['d1', { id: 'd1', type: 'DECISION', basis: ['shared'], status: 'active' }],
      ['b1', { id: 'b1', type: 'BOUNDARY', basis: ['shared'], status: 'active' }],
      ['shared', { id: 'shared', type: 'GIVEN', basis: [], status: 'active' }],
    ]);
    const warnings = checkBoundaryCollision(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual({
      type: 'boundary-collision',
      element_id: 'd1',
      boundary_id: 'b1',
      shared_id: 'shared',
      message: expect.any(String),
    });
  });

  it('returns empty when no overlap', () => {
    const elements = new Map([
      ['d1', { id: 'd1', type: 'DECISION', basis: ['g1'], status: 'active' }],
      ['b1', { id: 'b1', type: 'BOUNDARY', basis: ['g2'], status: 'active' }],
      ['g1', { id: 'g1', type: 'GIVEN', basis: [], status: 'active' }],
      ['g2', { id: 'g2', type: 'GIVEN', basis: [], status: 'active' }],
    ]);
    expect(checkBoundaryCollision(elements)).toEqual([]);
  });

  it('excludes withdrawn elements from basis chains', () => {
    const elements = new Map([
      ['d1', { id: 'd1', type: 'DECISION', basis: ['w1'], status: 'active' }],
      ['b1', { id: 'b1', type: 'BOUNDARY', basis: ['w1'], status: 'active' }],
      ['w1', { id: 'w1', type: 'GIVEN', basis: [], status: 'withdrawn' }],
    ]);
    const warnings = checkBoundaryCollision(elements);
    expect(warnings).toEqual([]);
  });

  it('detects overlap through deep chain', () => {
    const elements = new Map([
      ['d1', { id: 'd1', type: 'DECISION', basis: ['mid'], status: 'active' }],
      ['b1', { id: 'b1', type: 'BOUNDARY', basis: ['mid'], status: 'active' }],
      ['mid', { id: 'mid', type: 'ASSERTION', basis: ['deep'], status: 'active', confidence: 0.5 }],
      ['deep', { id: 'deep', type: 'GIVEN', basis: [], status: 'active' }],
    ]);
    const warnings = checkBoundaryCollision(elements);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe('checkConfidenceInversion', () => {
  it('flags high-confidence assertion built on low-confidence assertion', () => {
    const elements = new Map([
      ['high', { id: 'high', type: 'ASSERTION', confidence: 0.9, basis: ['low'], status: 'active' }],
      ['low', { id: 'low', type: 'ASSERTION', confidence: 0.2, basis: [], status: 'active' }],
    ]);
    const warnings = checkConfidenceInversion(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual({
      type: 'confidence-inversion',
      element_id: 'high',
      low_confidence_id: 'low',
      message: expect.any(String),
    });
  });

  it('does not flag when confidence is consistent', () => {
    const elements = new Map([
      ['high', { id: 'high', type: 'ASSERTION', confidence: 0.9, basis: ['also_high'], status: 'active' }],
      ['also_high', { id: 'also_high', type: 'ASSERTION', confidence: 0.8, basis: [], status: 'active' }],
    ]);
    expect(checkConfidenceInversion(elements)).toEqual([]);
  });

  it('detects inversion through deep chain', () => {
    const elements = new Map([
      ['high', { id: 'high', type: 'ASSERTION', confidence: 0.7, basis: ['mid'], status: 'active' }],
      ['mid', { id: 'mid', type: 'CONSTRAINT', basis: ['low'], status: 'active' }],
      ['low', { id: 'low', type: 'ASSERTION', confidence: 0.3, basis: [], status: 'active' }],
    ]);
    const warnings = checkConfidenceInversion(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].low_confidence_id).toBe('low');
  });

  it('does not flag boundary confidence values (0.7 on 0.4)', () => {
    const elements = new Map([
      ['a', { id: 'a', type: 'ASSERTION', confidence: 0.7, basis: ['b'], status: 'active' }],
      ['b', { id: 'b', type: 'ASSERTION', confidence: 0.4, basis: [], status: 'active' }],
    ]);
    // 0.7 >= 0.7 (high) and 0.4 >= 0.4 (not low), so no inversion
    expect(checkConfidenceInversion(elements)).toEqual([]);
  });

  it('ignores non-ASSERTION elements for confidence check', () => {
    const elements = new Map([
      ['high', { id: 'high', type: 'ASSERTION', confidence: 0.9, basis: ['c1'], status: 'active' }],
      ['c1', { id: 'c1', type: 'CONSTRAINT', basis: [], status: 'active' }],
    ]);
    expect(checkConfidenceInversion(elements)).toEqual([]);
  });
});

describe('checkStaleDependency', () => {
  it('flags active element citing a revised element it has not been updated since', () => {
    const elements = new Map([
      ['downstream', {
        id: 'downstream', basis: ['revised'], status: 'active',
        revisedInRound: null, revision: 0,
      }],
      ['revised', {
        id: 'revised', basis: [], status: 'active',
        revisedInRound: 3, revision: 2,
      }],
    ]);
    const warnings = checkStaleDependency(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual({
      type: 'stale-dependency',
      element_id: 'downstream',
      stale_basis_id: 'revised',
      message: expect.any(String),
    });
  });

  it('returns empty when basis has not been revised', () => {
    const elements = new Map([
      ['a', { id: 'a', basis: ['b'], status: 'active', revisedInRound: null, revision: 0 }],
      ['b', { id: 'b', basis: [], status: 'active', revisedInRound: null, revision: 0 }],
    ]);
    expect(checkStaleDependency(elements)).toEqual([]);
  });

  it('returns empty when downstream was updated after basis revision', () => {
    const elements = new Map([
      ['downstream', {
        id: 'downstream', basis: ['revised'], status: 'active',
        revisedInRound: 5, revision: 1,
      }],
      ['revised', {
        id: 'revised', basis: [], status: 'active',
        revisedInRound: 3, revision: 2,
      }],
    ]);
    expect(checkStaleDependency(elements)).toEqual([]);
  });

  it('ignores withdrawn elements', () => {
    const elements = new Map([
      ['w', { id: 'w', basis: ['revised'], status: 'withdrawn', revisedInRound: null, revision: 0 }],
      ['revised', { id: 'revised', basis: [], status: 'active', revisedInRound: 3, revision: 2 }],
    ]);
    expect(checkStaleDependency(elements)).toEqual([]);
  });
});

describe('checkAllIntegrity', () => {
  it('combines results from all four checks', () => {
    const elements = new Map([
      // withdrawn-basis: active a1 cites withdrawn w1
      ['a1', { id: 'a1', type: 'CONSTRAINT', basis: ['w1'], status: 'active', revisedInRound: null, revision: 0 }],
      ['w1', { id: 'w1', type: 'GIVEN', basis: [], status: 'withdrawn', revisedInRound: null, revision: 0 }],
      // confidence-inversion: high assertion on low assertion
      ['high', { id: 'high', type: 'ASSERTION', confidence: 0.9, basis: ['low'], status: 'active', revisedInRound: null, revision: 0 }],
      ['low', { id: 'low', type: 'ASSERTION', confidence: 0.1, basis: [], status: 'active', revisedInRound: null, revision: 0 }],
    ]);
    const warnings = checkAllIntegrity(elements);
    const types = warnings.map(w => w.type);
    expect(types).toContain('withdrawn-basis');
    expect(types).toContain('confidence-inversion');
  });

  it('returns empty array when proof is clean', () => {
    const elements = new Map([
      ['g1', { id: 'g1', type: 'GIVEN', basis: [], status: 'active', revisedInRound: null, revision: 0 }],
      ['c1', { id: 'c1', type: 'CONSTRAINT', basis: ['g1'], status: 'active', revisedInRound: null, revision: 0 }],
    ]);
    expect(checkAllIntegrity(elements)).toEqual([]);
  });
});
