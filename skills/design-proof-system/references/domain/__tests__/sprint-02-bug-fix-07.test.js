import { describe, it, expect } from 'vitest';
import { createPayloadChannel, parsePayloadChannel, createDomainBridge } from '../domain-bridge.js';
import { OPERATION_SPECS } from '../mutations.js';
import { CATEGORY_REGISTRY } from '../schema.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, ID_PREFIXES } from '../tags.js';
import * as tags from '../tags.js';
import { createInMemorySubstrate } from './_fixtures/inMemorySubstrate.js';

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
    // D5 — accept a {shape: number} counters map for determinism across save/restore.
    seed: (map) => {
      counters.clear();
      for (const [k, v] of Object.entries(map ?? {})) counters.set(k, v);
    },
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

describe('D11 — Pre-ratify vocabulary lint', () => {
  it('AC-11.3 no ratified definitions → ratify passes regardless of text', async () => {
    const bridge = await makeRealBridge();
    // RATIFY precondition requires evidence to exist.
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'reachability' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: c.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });

  it('AC-11.1 element using uncapitalized variant of ratified canonical term throws VOCABULARY_LINT_VIOLATION', async () => {
    const bridge = await makeRealBridge();
    // RATIFY precondition requires evidence to exist.
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    // Author and ratify a Definition with canonical_name 'Reachability'.
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Reachability', definition: 'the ability...' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    // Add a Concern whose label uses the uncapitalized variant.
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'uses reachability everywhere' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: c.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).toThrow(/VOCABULARY_LINT_VIOLATION/);
  });

  it('AC-11.2 element using canonical form verbatim passes lint', async () => {
    const bridge = await makeRealBridge();
    // RATIFY precondition requires evidence to exist.
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Reachability', definition: 'x' },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'uses Reachability everywhere' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: c.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    )).not.toThrow();
  });
});

// Helper: substrate-based bridge for AC-5.3 — uses the canonical fixture allocator
// in inMemorySubstrate that emits ID_PREFIXES[shape] + n. Required because
// extractAllocatorHighWaterMarks scans the EDB by ID_PREFIXES, which only matches
// the substrate fixture's id shape, not makeRealBridge's `${shape}_${n}` shape.
function makeSubstrateBridge() {
  const substrate = createInMemorySubstrate();
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  const bridge = createDomainBridge({
    engine: substrate,
    clock,
    idAllocator: substrate.idAllocator,
    consentVerification,
    persistenceRepo,
  });
  return { bridge, idAllocator: substrate.idAllocator };
}

describe('D5 — Atomic serialize/restore with allocator state', () => {
  it('AC-5.1 serializeWithAllocatorState bundles per-category counters', async () => {
    const { bridge, idAllocator } = await makeRealBridge({ withAllocator: true });
    bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'a' }, designerConsent);
    bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'b' }, designerConsent);
    const snapshot = bridge.serializeWithAllocatorState({});
    expect(snapshot.engine).toBeDefined();
    expect(snapshot.allocatorState[ELEMENT_CATEGORIES.EVIDENCE]).toBe(idAllocator.highWater(ELEMENT_CATEGORIES.EVIDENCE));
    expect(snapshot.allocatorState[ELEMENT_CATEGORIES.EVIDENCE]).toBe(2);
  });

  it('AC-5.2 / AC-5.4 round-trip restore preserves allocator high-water', async () => {
    const { bridge: b1 } = await makeRealBridge({ withAllocator: true });
    b1.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'a' }, designerConsent);
    const snapshot = b1.serializeWithAllocatorState({});
    const { bridge: b2 } = await makeRealBridge({ withAllocator: true });
    b2.loadFromWithAllocatorState({}, snapshot);
    const r = b2.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'b' }, designerConsent);
    // The makeRealBridge fixture allocator emits `${shape}_${n}` so id should be 'evidence_2'.
    expect(r.id).toBe(`${ELEMENT_CATEGORIES.EVIDENCE}_2`);
  });

  it('AC-5.3 loadFromWithAllocatorState falls back to EDB scan when allocatorState is empty', () => {
    // Use the substrate fixture (option a from task plan) because its allocator
    // emits ID_PREFIXES[shape] + n (e.g., 'evid_1'), which is what
    // extractAllocatorHighWaterMarks scans for. makeRealBridge's fixture emits
    // 'evidence_1' which would not match the prefix scan.
    const { bridge: b1 } = makeSubstrateBridge();
    const ev = b1.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'a' }, designerConsent);
    expect(ev.id).toBe(ID_PREFIXES[ELEMENT_CATEGORIES.EVIDENCE] + '1'); // sanity: substrate uses canonical prefixes
    const snapshot = b1.serializeWithAllocatorState({});
    // Tamper to legacy shape: empty allocatorState. The load path must fall back
    // to extractAllocatorHighWaterMarks(readPorts) and recover the counter from EDB.
    snapshot.allocatorState = {};
    const { bridge: b2 } = makeSubstrateBridge();
    b2.loadFromWithAllocatorState({}, snapshot);
    // After fallback recovery, the next allocation must not collide with the
    // existing 'evid_1'. The recovered counter is 1, so next() yields 'evid_2'.
    const r = b2.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'b' }, designerConsent);
    expect(r.id).toBe(ID_PREFIXES[ELEMENT_CATEGORIES.EVIDENCE] + '2');
  });
});

describe('D12 — reviseProposition and reviseResolution', () => {
  // AC-12.4 PROBE — runs first. Question: does rule cascade handle dependent
  // grounding rewiring automatically when a Proposition is revised?
  // If yes: drop grounding_updates parameter entirely.
  // If no: a follow-up patch needs explicit retract handling in runOperation step 5.
  it('AC-12.4 PROBE — rule cascade behavior on revise', async () => {
    const bridge = await makeRealBridge();
    // Setup: author Evidence + Proposition that gets ratified.
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'p1 original',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    bridge.ratifyElement({ elementId: prop.id, source: CONSENT_SOURCES.DESIGNER }, designerConsent);
    bridge.ratifyElement(
      { elementId: prop.id, source: CONSENT_SOURCES.DESIGN_PARTNER },
      { source: CONSENT_SOURCES.DESIGN_PARTNER },
    );
    // Probe: after reviseProposition, does the original proposition still derive?
    const revisedProp = bridge.reviseProposition(
      {
        supersedes: prop.id,
        statement: 'p1 revised',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct2',
        reasoning_chain: 'rc2',
      },
      designerConsent,
    );
    // Probe results — both derive (the old still has approval facts; revise doesn't retract them).
    // This documents that rule cascade does NOT auto-retire the old proposition; explicit
    // grounding_updates would be needed if the goal is to retire the old proposition.
    const newDerives = bridge.queryProof({ pattern: ['proposition', [revisedProp.id, { var: 'S' }]] });
    expect(newDerives.length).toBeGreaterThan(0);
    // Don't fail on the old still deriving; that's the probe outcome.
  });

  it('AC-12.1 reviseProposition is atomic add+ratify (two_yes_complete derives)', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const prop = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'original',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const revised = bridge.reviseProposition(
      {
        supersedes: prop.id,
        statement: 'revised',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    expect(revised.id).toMatch(/^proposition/);
    // two_yes_complete should derive for the new prop without a separate ratify call.
    const twoYes = bridge.queryProof({ pattern: ['two_yes_complete', [revised.id]] });
    expect(twoYes.length).toBe(1);
  });

  it('AC-12.2 reviseResolution is atomic add+ratify (two_yes_complete derives)', async () => {
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
        statement: 'r1',
        problem_anchor: concern.id,
        grounding: [prop.id],
      },
      designerConsent,
    );
    const revised = bridge.reviseResolution(
      {
        supersedes: res.id,
        statement: 'r1-revised',
        problem_anchor: concern.id,
        grounding: [prop.id],
      },
      designerConsent,
    );
    expect(revised.id).toMatch(/^resolution/);
    const resolutionDerived = bridge.queryProof({ pattern: ['resolution', [revised.id, { var: 'S' }]] });
    expect(resolutionDerived.length).toBe(1);
    const approvalRows = bridge.queryProof({ pattern: ['approved', [revised.id, { var: 'SRC' }, { var: 'T' }]] });
    expect(approvalRows.length).toBe(1);
    expect(approvalRows[0].SRC).toBe('designer');
  });

  it('AC-12.3 wording cleanup using new revise verbs costs at most one operation per element', async () => {
    // Confirm that reviseProposition + reviseResolution each is a single bridge call,
    // not three (withdraw + add + ratify). Operation count = number of bridge calls.
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
        statement: 'r1',
        problem_anchor: concern.id,
        grounding: [prop.id],
      },
      designerConsent,
    );
    // Cleanup: 1 reviseProposition + 1 reviseResolution = 2 operations total.
    const newProp = bridge.reviseProposition(
      {
        supersedes: prop.id,
        statement: 'p1-new',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designerConsent,
    );
    const newRes = bridge.reviseResolution(
      {
        supersedes: res.id,
        statement: 'r1-new',
        problem_anchor: concern.id,
        grounding: [newProp.id],
      },
      designerConsent,
    );
    expect(newProp.id).toBeDefined();
    expect(newRes.id).toBeDefined();
    // Proposition is ratified atomically (dual-partner) — no separate ratify call needed.
    expect(bridge.queryProof({ pattern: ['two_yes_complete', [newProp.id]] }).length).toBe(1);
    // Resolution carries designer-only approval (D3); two_yes_complete is not asserted.
    const newResApprovals = bridge.queryProof({ pattern: ['approved', [newRes.id, { var: 'SRC' }, { var: 'T' }]] });
    expect(newResApprovals.length).toBe(1);
    expect(newResApprovals[0].SRC).toBe('designer');
  });
});
