import { describe, it, expect } from 'vitest';
import {
  ELEMENT_TYPES,
  createElement,
  validateRefs,
  traverseGroundingChain,
  checkWithdrawnGrounding,
  checkUngrounded,
  checkMissingCollapseTest,
  checkStaleGrounding,
  checkAllIntegrity,
} from '../proof.js';

describe('ELEMENT_TYPES', () => {
  it('contains all five types', () => {
    expect(ELEMENT_TYPES).toEqual([
      'EVIDENCE', 'RULE', 'PERMISSION', 'NECESSARY_CONDITION', 'RISK',
    ]);
  });
});

describe('createElement', () => {
  // --- EVIDENCE ---
  it('creates an EVIDENCE element with codebase source', () => {
    const el = createElement(
      { type: 'EVIDENCE', statement: 'Pipeline has 1,481 lines', source: 'codebase' },
      'EVID-1', 1,
    );
    expect(el.id).toBe('EVID-1');
    expect(el.type).toBe('EVIDENCE');
    expect(el.source).toBe('codebase');
    expect(el.status).toBe('active');
  });

  it('rejects EVIDENCE without source', () => {
    expect(() => createElement({ type: 'EVIDENCE', statement: 'x' }, 'e1', 0))
      .toThrow(/source/i);
  });

  it('rejects EVIDENCE with designer source', () => {
    expect(() => createElement({ type: 'EVIDENCE', statement: 'x', source: 'designer' }, 'e1', 0))
      .toThrow(/designer/i);
  });

  // --- RULE ---
  it('creates a RULE element with designer source', () => {
    const el = createElement(
      { type: 'RULE', statement: 'Canonical form must not favor any consumer', source: 'designer' },
      'RULE-1', 1,
    );
    expect(el.type).toBe('RULE');
    expect(el.source).toBe('designer');
  });

  it('rejects RULE without designer source', () => {
    expect(() => createElement({ type: 'RULE', statement: 'x', source: 'codebase' }, 'r1', 0))
      .toThrow(/designer/i);
  });

  it('rejects RULE with no source', () => {
    expect(() => createElement({ type: 'RULE', statement: 'x' }, 'r1', 0))
      .toThrow(/designer/i);
  });

  // --- PERMISSION ---
  it('creates a PERMISSION element', () => {
    const el = createElement(
      { type: 'PERMISSION', statement: 'May override ADR-100', source: 'designer', relieves: 'ADR-ARCH-100' },
      'PERM-1', 1,
    );
    expect(el.type).toBe('PERMISSION');
    expect(el.relieves).toBe('ADR-ARCH-100');
  });

  it('rejects PERMISSION without designer source', () => {
    expect(() => createElement(
      { type: 'PERMISSION', statement: 'x', source: 'codebase', relieves: 'y' }, 'p1', 0,
    )).toThrow(/designer/i);
  });

  it('rejects PERMISSION without relieves', () => {
    expect(() => createElement(
      { type: 'PERMISSION', statement: 'x', source: 'designer' }, 'p1', 0,
    )).toThrow(/relieves/i);
  });

  // --- NECESSARY_CONDITION ---
  it('creates a NECESSARY_CONDITION element', () => {
    const el = createElement(
      {
        type: 'NECESSARY_CONDITION',
        statement: 'Canonical form must be consumer-neutral',
        grounding: ['EVID-1', 'RULE-1'],
        collapse_test: 'If removed, four of five consumers pay permanent translation tax',
        reasoning_chain: 'IF five consumers planned (RULE-1) AND text is native to one (EVID-1) THEN canonical cannot be text',
        rejected_alternatives: ['Text-based canonical form'],
      },
      'NCON-1', 2,
    );
    expect(el.type).toBe('NECESSARY_CONDITION');
    expect(el.grounding).toEqual(['EVID-1', 'RULE-1']);
    expect(el.collapse_test).toContain('translation tax');
    expect(el.reasoning_chain).toContain('IF');
    expect(el.rejected_alternatives).toEqual(['Text-based canonical form']);
  });

  it('rejects NECESSARY_CONDITION without grounding', () => {
    expect(() => createElement(
      { type: 'NECESSARY_CONDITION', statement: 'x', collapse_test: 'y', reasoning_chain: 'z' },
      'n1', 0,
    )).toThrow(/grounding/i);
  });

  it('rejects NECESSARY_CONDITION with empty grounding', () => {
    expect(() => createElement(
      { type: 'NECESSARY_CONDITION', statement: 'x', grounding: [], collapse_test: 'y', reasoning_chain: 'z' },
      'n1', 0,
    )).toThrow(/grounding/i);
  });

  it('rejects NECESSARY_CONDITION without collapse_test', () => {
    expect(() => createElement(
      { type: 'NECESSARY_CONDITION', statement: 'x', grounding: ['a'], reasoning_chain: 'z' },
      'n1', 0,
    )).toThrow(/collapse_test/i);
  });

  it('rejects NECESSARY_CONDITION without reasoning_chain', () => {
    expect(() => createElement(
      { type: 'NECESSARY_CONDITION', statement: 'x', grounding: ['a'], collapse_test: 'y' },
      'n1', 0,
    )).toThrow(/reasoning_chain/i);
  });

  // --- RISK ---
  it('creates a RISK element', () => {
    const el = createElement(
      { type: 'RISK', statement: 'Migration burden deferred', basis: ['NCON-1'] },
      'RISK-1', 1,
    );
    expect(el.type).toBe('RISK');
    expect(el.basis).toEqual(['NCON-1']);
  });

  // --- General validation ---
  it('rejects unknown type', () => {
    expect(() => createElement({ type: 'OPEN', statement: 'x' }, 'x1', 0))
      .toThrow(/type/i);
  });

  it('rejects missing statement', () => {
    expect(() => createElement({ type: 'RISK' }, 'x1', 0))
      .toThrow(/statement/i);
  });

  it('rejects empty statement', () => {
    expect(() => createElement({ type: 'RISK', statement: '' }, 'x1', 0))
      .toThrow(/statement/i);
  });

  it('defaults optional fields correctly', () => {
    const el = createElement(
      { type: 'EVIDENCE', statement: 'fact', source: 'codebase' },
      'EVID-1', 1,
    );
    expect(el.grounding).toEqual([]);
    expect(el.collapse_test).toBeNull();
    expect(el.reasoning_chain).toBeNull();
    expect(el.rejected_alternatives).toEqual([]);
    expect(el.relieves).toBeNull();
    expect(el.basis).toEqual([]);
    expect(el.revision).toBe(0);
    expect(el.revisedInRound).toBeNull();
  });
});

describe('validateRefs', () => {
  const elements = new Map([
    ['EVID-1', { id: 'EVID-1' }],
    ['RULE-1', { id: 'RULE-1' }],
  ]);

  it('returns empty array when all refs exist', () => {
    expect(validateRefs(['EVID-1', 'RULE-1'], elements)).toEqual([]);
  });

  it('returns error strings for missing refs', () => {
    const errors = validateRefs(['EVID-1', 'MISSING'], elements);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/MISSING/);
  });

  it('returns empty array for empty refs', () => {
    expect(validateRefs([], elements)).toEqual([]);
  });
});

describe('traverseGroundingChain', () => {
  it('traverses a grounding chain through NECESSARY_CONDITION', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1', 'RULE-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active' }],
      ['RULE-1', { id: 'RULE-1', type: 'RULE', grounding: [], basis: [], status: 'active' }],
    ]);
    const result = traverseGroundingChain(elements, 'NCON-1');
    expect(result).toContain('EVID-1');
    expect(result).toContain('RULE-1');
    expect(result).not.toContain('NCON-1');
  });

  it('traverses through nested conditions', () => {
    const elements = new Map([
      ['NCON-2', { id: 'NCON-2', type: 'NECESSARY_CONDITION', grounding: ['NCON-1'], basis: [], status: 'active' }],
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active' }],
    ]);
    const result = traverseGroundingChain(elements, 'NCON-2');
    expect(result).toContain('NCON-1');
    expect(result).toContain('EVID-1');
  });

  it('follows basis for RISK elements', () => {
    const elements = new Map([
      ['RISK-1', { id: 'RISK-1', type: 'RISK', grounding: [], basis: ['NCON-1'], status: 'active' }],
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active' }],
    ]);
    const result = traverseGroundingChain(elements, 'RISK-1');
    expect(result).toContain('NCON-1');
    expect(result).toContain('EVID-1');
  });

  it('handles cycles without infinite loop', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['NCON-2'], basis: [], status: 'active' }],
      ['NCON-2', { id: 'NCON-2', type: 'NECESSARY_CONDITION', grounding: ['NCON-1'], basis: [], status: 'active' }],
    ]);
    const result = traverseGroundingChain(elements, 'NCON-1');
    expect(result).toContain('NCON-2');
    expect(new Set(result).size).toBe(result.length);
  });

  it('skips withdrawn elements', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'withdrawn' }],
    ]);
    const result = traverseGroundingChain(elements, 'NCON-1');
    expect(result).not.toContain('EVID-1');
  });

  it('returns empty array when start has no refs', () => {
    const elements = new Map([
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active' }],
    ]);
    expect(traverseGroundingChain(elements, 'EVID-1')).toEqual([]);
  });
});

describe('checkWithdrawnGrounding', () => {
  it('flags NC citing withdrawn element in grounding', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'withdrawn' }],
    ]);
    const warnings = checkWithdrawnGrounding(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('withdrawn-grounding');
    expect(warnings[0].element_id).toBe('NCON-1');
    expect(warnings[0].cited_id).toBe('EVID-1');
  });

  it('flags RISK citing withdrawn element in basis', () => {
    const elements = new Map([
      ['RISK-1', { id: 'RISK-1', type: 'RISK', grounding: [], basis: ['NCON-1'], status: 'active' }],
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: [], basis: [], status: 'withdrawn' }],
    ]);
    const warnings = checkWithdrawnGrounding(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].element_id).toBe('RISK-1');
  });

  it('returns empty when no withdrawn grounding', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active' }],
    ]);
    expect(checkWithdrawnGrounding(elements)).toEqual([]);
  });

  it('ignores withdrawn elements as the citing element', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'withdrawn' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'withdrawn' }],
    ]);
    expect(checkWithdrawnGrounding(elements)).toEqual([]);
  });
});

describe('checkUngrounded', () => {
  it('flags NC with no EVIDENCE/RULE/PERMISSION in chain', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['NCON-2'], basis: [], status: 'active' }],
      ['NCON-2', { id: 'NCON-2', type: 'NECESSARY_CONDITION', grounding: [], basis: [], status: 'active' }],
    ]);
    const warnings = checkUngrounded(elements);
    expect(warnings).toHaveLength(2);
    expect(warnings.every(w => w.type === 'ungrounded-condition')).toBe(true);
  });

  it('does not flag NC grounded in EVIDENCE', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active' }],
    ]);
    expect(checkUngrounded(elements)).toEqual([]);
  });

  it('does not flag NC grounded in RULE', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['RULE-1'], basis: [], status: 'active' }],
      ['RULE-1', { id: 'RULE-1', type: 'RULE', grounding: [], basis: [], status: 'active' }],
    ]);
    expect(checkUngrounded(elements)).toEqual([]);
  });

  it('does not flag NC grounded through chain', () => {
    const elements = new Map([
      ['NCON-2', { id: 'NCON-2', type: 'NECESSARY_CONDITION', grounding: ['NCON-1'], basis: [], status: 'active' }],
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active' }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active' }],
    ]);
    // NCON-2 reaches EVID-1 through NCON-1
    const warnings = checkUngrounded(elements);
    expect(warnings).toEqual([]);
  });

  it('ignores non-NC elements', () => {
    const elements = new Map([
      ['RISK-1', { id: 'RISK-1', type: 'RISK', grounding: [], basis: [], status: 'active' }],
    ]);
    expect(checkUngrounded(elements)).toEqual([]);
  });
});

describe('checkMissingCollapseTest', () => {
  it('flags NC without collapse_test', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', collapse_test: null, grounding: [], basis: [], status: 'active' }],
    ]);
    const warnings = checkMissingCollapseTest(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('missing-collapse-test');
  });

  it('does not flag NC with collapse_test', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', collapse_test: 'design fails', grounding: [], basis: [], status: 'active' }],
    ]);
    expect(checkMissingCollapseTest(elements)).toEqual([]);
  });

  it('ignores withdrawn NCs', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', collapse_test: null, grounding: [], basis: [], status: 'withdrawn' }],
    ]);
    expect(checkMissingCollapseTest(elements)).toEqual([]);
  });
});

describe('checkStaleGrounding', () => {
  it('flags NC citing revised evidence it has not been updated since', () => {
    const elements = new Map([
      ['NCON-1', {
        id: 'NCON-1', type: 'NECESSARY_CONDITION',
        grounding: ['EVID-1'], basis: [], status: 'active',
        revisedInRound: null, revision: 0,
      }],
      ['EVID-1', {
        id: 'EVID-1', type: 'EVIDENCE',
        grounding: [], basis: [], status: 'active',
        revisedInRound: 3, revision: 2,
      }],
    ]);
    const warnings = checkStaleGrounding(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('stale-grounding');
    expect(warnings[0].element_id).toBe('NCON-1');
    expect(warnings[0].stale_id).toBe('EVID-1');
  });

  it('returns empty when grounding has not been revised', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active', revisedInRound: null, revision: 0 }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active', revisedInRound: null, revision: 0 }],
    ]);
    expect(checkStaleGrounding(elements)).toEqual([]);
  });

  it('returns empty when downstream was updated after grounding revision', () => {
    const elements = new Map([
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], basis: [], status: 'active', revisedInRound: 5, revision: 1 }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active', revisedInRound: 3, revision: 2 }],
    ]);
    expect(checkStaleGrounding(elements)).toEqual([]);
  });

  it('checks basis for RISK elements', () => {
    const elements = new Map([
      ['RISK-1', { id: 'RISK-1', type: 'RISK', grounding: [], basis: ['NCON-1'], status: 'active', revisedInRound: null, revision: 0 }],
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: [], basis: [], status: 'active', revisedInRound: 3, revision: 1 }],
    ]);
    const warnings = checkStaleGrounding(elements);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].element_id).toBe('RISK-1');
  });
});

describe('checkAllIntegrity', () => {
  it('combines results from all four checks', () => {
    const elements = new Map([
      // withdrawn-grounding: NC cites withdrawn evidence
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-W'], basis: [], status: 'active', collapse_test: 'breaks', revisedInRound: null, revision: 0 }],
      ['EVID-W', { id: 'EVID-W', type: 'EVIDENCE', grounding: [], basis: [], status: 'withdrawn', revisedInRound: null, revision: 0 }],
      // missing-collapse-test: NC with no collapse_test
      ['NCON-2', { id: 'NCON-2', type: 'NECESSARY_CONDITION', grounding: ['EVID-1'], collapse_test: null, basis: [], status: 'active', revisedInRound: null, revision: 0 }],
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active', revisedInRound: null, revision: 0 }],
    ]);
    const warnings = checkAllIntegrity(elements);
    const types = warnings.map(w => w.type);
    expect(types).toContain('withdrawn-grounding');
    expect(types).toContain('missing-collapse-test');
  });

  it('returns empty array when proof is clean', () => {
    const elements = new Map([
      ['EVID-1', { id: 'EVID-1', type: 'EVIDENCE', grounding: [], basis: [], status: 'active', revisedInRound: null, revision: 0 }],
      ['RULE-1', { id: 'RULE-1', type: 'RULE', grounding: [], basis: [], status: 'active', revisedInRound: null, revision: 0 }],
      ['NCON-1', { id: 'NCON-1', type: 'NECESSARY_CONDITION', grounding: ['EVID-1', 'RULE-1'], collapse_test: 'design fails', basis: [], status: 'active', revisedInRound: null, revision: 0 }],
    ]);
    expect(checkAllIntegrity(elements)).toEqual([]);
  });
});
