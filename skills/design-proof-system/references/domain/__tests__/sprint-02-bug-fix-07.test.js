import { describe, it, expect } from 'vitest';
import { createPayloadChannel, parsePayloadChannel, createDomainBridge } from '../domain-bridge.js';
import { OPERATION_SPECS } from '../mutations.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import * as tags from '../tags.js';

async function makeRealBridge({ withAllocator = false } = {}) {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
    highWater: (shape) => counters.get(shape) ?? 0,
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  const bridge = createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
  return withAllocator ? { bridge, idAllocator } : bridge;
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });

describe('D1 — RATIFY does not advance the ID allocator', () => {
  // Implementation note: chose option (b) — augment makeRealBridge to optionally return
  // the allocator. Smaller diff than constructing an inline substrate-based bridge here,
  // and the existing Engine-backed scaffold already exercises the same code path.
  it('AC-1.1 add+ratify advances counter exactly once (the ADD)', async () => {
    const { bridge, idAllocator } = await makeRealBridge({ withAllocator: true });
    // RATIFY's precondition requires an evidence fact to exist (weak existence probe).
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    // Author a Concern (advances concern counter), then ratify it (must not advance further).
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'x' },
      designerConsent,
    );
    const before = idAllocator.highWater(ELEMENT_CATEGORIES.CONCERN);
    bridge.ratifyElement(
      { elementId: c.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' },
      designerConsent,
    );
    const after = idAllocator.highWater(ELEMENT_CATEGORIES.CONCERN);
    expect(after).toBe(before);
  });
});

describe('D2 — Optional caller-supplied id', () => {
  it('AC-2.1 supplied unique id is used; allocator counter not advanced', async () => {
    const { bridge, idAllocator } = await makeRealBridge({ withAllocator: true });
    // Note: ID_PREFIXES[EVIDENCE] is 'evid_'. The fixture allocator currently emits
    // `${shape}_${n}` (e.g., 'evidence_1') NOT 'evid_1'. Use a caller-supplied id matching
    // ID_PREFIXES['evidence'] = 'evid_'.
    const before = idAllocator.highWater(ELEMENT_CATEGORIES.EVIDENCE);
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, id: 'evid_5', source: 'industry', statement: 'x' },
      designerConsent,
    );
    expect(r.id).toBe('evid_5');
    expect(idAllocator.highWater(ELEMENT_CATEGORIES.EVIDENCE)).toBe(before);
  });

  it('AC-2.2 supplied colliding id throws DUPLICATE_ID', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, id: 'evid_5', source: 'industry', statement: 'x' },
      designerConsent,
    );
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, id: 'evid_5', source: 'industry', statement: 'y' },
      designerConsent,
    )).toThrow(/DUPLICATE_ID/);
  });

  it('AC-2.3 supplied prefix-mismatched id throws ID_PREFIX_MISMATCH', async () => {
    const bridge = await makeRealBridge();
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, id: 'cern_1', source: 'industry', statement: 'x' },
      designerConsent,
    )).toThrow(/ID_PREFIX_MISMATCH/);
  });
});

describe('D3 — presentClosingArgument has its own argShape', () => {
  it('AC-3.1 OPERATION_SPECS[PRESENT_CLOSING_ARGUMENT] carries an inline argShape with no required fields', () => {
    const spec = OPERATION_SPECS[tags.ACTION_LABELS.PRESENT_CLOSING_ARGUMENT];
    expect(spec.argShape).toBeDefined();
    expect(spec.argShape).toMatchObject({ requiredFields: [], closedEnumFields: {} });
  });
});

describe('D4 — Resolution.problem_anchor accepts concern or risk', () => {
  it('AC-4.1a schema declares array referenceField targeting concern + risk', () => {
    const desc = CATEGORY_REGISTRY[ELEMENT_CATEGORIES.RESOLUTION];
    expect(desc.referenceFields.problem_anchor).toEqual(['concern', 'risk']);
  });

  it('AC-4.1b authoring a Resolution anchored on a Concern succeeds', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const concern = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'C1' },
      designerConsent,
    );
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const res = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.RESOLUTION,
        statement: 'R-anchored-on-concern',
        problem_anchor: concern.id,
        grounding: [prop.id],
      },
      designerConsent,
    );
    const anchorRows = bridge.queryProof({ pattern: ['resolution_anchor', [res.id, { var: 'C' }]] });
    expect(anchorRows).toHaveLength(1);
    expect(anchorRows[0].C).toBe(concern.id);
  });

  it('AC-4.1c authoring a Resolution anchored on a Risk succeeds', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const risk = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'Risk1', basis: [ev.id] },
      designerConsent,
    );
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const res = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.RESOLUTION,
        statement: 'R-anchored-on-risk',
        problem_anchor: risk.id,
        grounding: [prop.id],
      },
      designerConsent,
    );
    const anchorRows = bridge.queryProof({ pattern: ['resolution_anchor', [res.id, { var: 'C' }]] });
    expect(anchorRows).toHaveLength(1);
    expect(anchorRows[0].C).toBe(risk.id);
  });

  it('AC-4.1d INVALID_REFERENCE when problem_anchor is neither a Concern nor a Risk', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    let captured = null;
    try {
      bridge.addElement(
        {
          idShape: ELEMENT_CATEGORIES.RESOLUTION,
          statement: 'R-bad-anchor',
          problem_anchor: 'nonexistent_id',
          grounding: [prop.id],
        },
        designerConsent,
      );
    } catch (e) { captured = e; }
    expect(captured).not.toBeNull();
    expect(captured.code).toBe('INVALID_REFERENCE');
    expect(captured.field).toBe('problem_anchor');
    expect(captured.referencedId).toBe('nonexistent_id');
    // Error message names both candidate categories.
    expect(captured.message).toMatch(/concern or risk/);
  });

  it('AC-4.2 closure blocks on unaddressed Risk and unblocks when Resolution anchors it', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const risk = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'Risk1', basis: [ev.id] },
      designerConsent,
    );
    // Pre-resolution: coverage_gap_detected fires for this Risk; closure is blocked.
    const gapsBefore = bridge.queryProof({ pattern: ['coverage_gap_detected', [{ var: 'C' }]] });
    expect(gapsBefore.map(r => r.C)).toContain(risk.id);
    const permittedBefore = bridge.queryProof({ pattern: ['closure_permitted', []] });
    expect(permittedBefore.length).toBe(0);

    // Add and ratify a Resolution anchoring the Risk.
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const res = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.RESOLUTION,
        statement: 'R-anchored-on-risk',
        problem_anchor: risk.id,
        grounding: [prop.id],
      },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: res.id, source: CONSENT_SOURCES.DESIGNER, source_field: 'designer', claim: 'r' },
      designerConsent,
    );

    // Post-resolution: coverage_gap_detected(risk.id) is gone; closure permitted.
    const gapsAfter = bridge.queryProof({ pattern: ['coverage_gap_detected', [risk.id]] });
    expect(gapsAfter).toEqual([]);
    const permittedAfter = bridge.queryProof({ pattern: ['closure_permitted', []] });
    expect(permittedAfter.length).toBe(1);
  });

  it('AC-4.3 zero active Risks: Risk-coverage gate does not fire, closure permitted', async () => {
    const bridge = await makeRealBridge();
    // No Risks authored. Closure depends on no unaddressed Concerns and no other blockers.
    const gaps = bridge.queryProof({ pattern: ['coverage_gap_detected', [{ var: 'C' }]] });
    expect(gaps).toEqual([]);
    const permitted = bridge.queryProof({ pattern: ['closure_permitted', []] });
    expect(permitted.length).toBe(1);
  });
});

describe('D6 — Mutation result carries full element record', () => {
  it('AC-6.1 addElement EVIDENCE result includes statement and source', async () => {
    const bridge = await makeRealBridge();
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'observed' },
      designerConsent,
    );
    expect(r).toMatchObject({ id: expect.stringMatching(/^evidence_/), source: 'codebase', statement: 'observed' });
  });

  it('AC-6.2 reviseConcern result includes updated description and notes', async () => {
    const bridge = await makeRealBridge();
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'X', description: 'Y' },
      designerConsent,
    );
    const revised = bridge.reviseElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, supersedes: c.id, label: 'X', description: 'Z' },
      designerConsent,
    );
    expect(revised).toMatchObject({ description: 'Z' });
  });
});

describe('D7 — Concern carries optional notes array', () => {
  it('AC-7.1 addConcern with notes emits concern_note facts', async () => {
    const bridge = await makeRealBridge();
    const concern = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'placement', description: 'where', notes: ['hybrid-case', 'sequencing'] },
      designerConsent,
    );
    const notes = bridge.queryProof({ pattern: ['concern_note', [concern.id, { var: 'N' }]] });
    expect(notes).toHaveLength(2);
    expect(notes.map(r => r.N).sort()).toEqual(['hybrid-case', 'sequencing']);
  });

  it('AC-7.1b addConcern without notes emits zero concern_note facts', async () => {
    const bridge = await makeRealBridge();
    const concern = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'plain', description: 'x' },
      designerConsent,
    );
    const notes = bridge.queryProof({ pattern: ['concern_note', [concern.id, { var: 'N' }]] });
    expect(notes).toHaveLength(0);
  });

  it('AC-7.2 concern_note facts appear in projection', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'c1', notes: ['n1', 'n2'] },
      designerConsent,
    );
    const projection = bridge.renderDatalogProjection({});
    expect(projection.facts.some(f => f[0] === 'concern_note')).toBe(true);
  });
});

describe('D10 — renderElementDeep returns full element record', () => {
  it('AC-10.1 Proposition record includes grounding, collapse_test, reasoning_chain', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct-text',
        reasoning_chain: 'rc-text',
      },
      designerConsent,
    );
    const record = bridge.renderElementDeep({ id: prop.id });
    expect(record.id).toBe(prop.id);
    expect(record.grounding).toEqual([ev.id]);
    expect(record.collapse_test).toBe('ct-text');
    expect(record.reasoning_chain).toBe('rc-text');
  });

  it('AC-10.2 Resolution record includes problem_anchor and grounding', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const concern = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'C1' },
      designerConsent,
    );
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const res = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.RESOLUTION,
        statement: 'R1',
        problem_anchor: concern.id,
        grounding: [prop.id],
      },
      designerConsent,
    );
    const record = bridge.renderElementDeep({ id: res.id });
    expect(record.problem_anchor).toBe(concern.id);
    expect(record.grounding).toEqual([prop.id]);
  });

  it('AC-10.3 / AC-7.3 Concern record includes notes array', async () => {
    const bridge = await makeRealBridge();
    const c1 = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'c1', notes: ['obligation X'] },
      designerConsent,
    );
    const c2 = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'c2' },
      designerConsent,
    );
    expect(bridge.renderElementDeep({ id: c1.id }).notes).toEqual(['obligation X']);
    expect(bridge.renderElementDeep({ id: c2.id }).notes).toEqual([]);
  });

  it('AC-10.4 Permission record includes relieves (regression: arity-3 satellite)', async () => {
    const bridge = await makeRealBridge();
    const rule = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'rule body' },
      designerConsent,
    );
    const perm = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PERMISSION, statement: 'perm body', relieves: rule.id },
      designerConsent,
    );
    const record = bridge.renderElementDeep({ id: perm.id });
    expect(record.relieves).toBe(rule.id);
  });
});

describe('D9 — Payload channel utilities', () => {
  it('AC-9.1 round-trips content through createPayloadChannel + parsePayloadChannel', () => {
    const content = 'evidence claim text with\nmultiple lines\nand "quotes"';
    const wrapped = createPayloadChannel(content);
    expect(wrapped.startsWith('===== PAYLOAD_START =====')).toBe(true);
    expect(wrapped.endsWith('===== PAYLOAD_END =====')).toBe(true);
    expect(parsePayloadChannel(wrapped)).toBe(content);
  });

  it('AC-9.2 returns null when sentinels are missing', () => {
    expect(parsePayloadChannel('no sentinels here')).toBeNull();
    expect(parsePayloadChannel('===== PAYLOAD_START =====\ncontent without end')).toBeNull();
    expect(parsePayloadChannel('content without start =====\n===== PAYLOAD_END =====')).toBeNull();
  });
});
