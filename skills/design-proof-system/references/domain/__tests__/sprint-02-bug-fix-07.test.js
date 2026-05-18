import { describe, it, expect } from 'vitest';
import { createPayloadChannel, parsePayloadChannel, createDomainBridge } from '../domain-bridge.js';
import { OPERATION_SPECS } from '../mutations.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES } from '../tags.js';
import * as tags from '../tags.js';

async function makeRealBridge() {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });

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
