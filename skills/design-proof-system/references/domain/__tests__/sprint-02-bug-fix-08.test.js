import { describe, it, expect } from 'vitest';
import { createDomainBridge } from '../domain-bridge.js';
import { lookupAuthority } from '../authority.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, ACTION_LABELS } from '../tags.js';

async function makeRealBridge() {
  const { Engine } = await import('../../engine/Engine.js');
  const counters = new Map();
  const idAllocator = {
    next: (shape) => {
      const n = (counters.get(shape) ?? 0) + 1;
      counters.set(shape, n);
      return `${shape}_${n}`;
    },
    seed: (map) => { counters.clear(); for (const [k, v] of Object.entries(map)) counters.set(k, v); },
    highWater: (shape) => counters.get(shape) ?? 0,
  };
  const clock = { now: () => 1700000000 };
  const consentVerification = { verify: () => true };
  const persistenceRepo = { saveState: () => {} };
  return createDomainBridge({ engine: new Engine(), clock, idAllocator, consentVerification, persistenceRepo });
}

const designerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGNER });
const designPartnerConsent = Object.freeze({ source: CONSENT_SOURCES.DESIGN_PARTNER });
const systemConsent = Object.freeze({ source: CONSENT_SOURCES.SYSTEM });

// Helper: author Evidence + Proposition (draft) by the designer.
async function seedEvidenceAndProposition(bridge) {
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
  return { ev, prop };
}

// AC-1.1 — agent IS permitted to add EVIDENCE / PROPOSITION / RISK / FRICTION.
describe('AC-1.1 — DESIGN_PARTNER permitted on add for agent-eligible categories', () => {
  const AGENT_ADD_CATEGORIES = [
    ELEMENT_CATEGORIES.EVIDENCE,
    ELEMENT_CATEGORIES.PROPOSITION,
    ELEMENT_CATEGORIES.RISK,
    ELEMENT_CATEGORIES.FRICTION,
  ];

  for (const category of AGENT_ADD_CATEGORIES) {
    it(`lookupAuthority(${category}, 'add') includes DESIGN_PARTNER`, () => {
      const allow = lookupAuthority(category, ACTION_LABELS.ADD);
      expect(allow).toContain(CONSENT_SOURCES.DESIGN_PARTNER);
    });
  }

  it('agent addElement succeeds on EVIDENCE', async () => {
    const bridge = await makeRealBridge();
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'agent-evidence' },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^evidence_/);
  });

  it('agent addElement succeeds on PROPOSITION', async () => {
    const bridge = await makeRealBridge();
    // Proposition references Evidence; designer authors the evidence so it exists.
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const r = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        statement: 'agent-prop',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^proposition_/);
  });

  it('agent addElement succeeds on RISK', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const r = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'risk-stmt', basis: [ev.id] },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^risk_/);
  });

  it('agent addElement succeeds on FRICTION', async () => {
    const bridge = await makeRealBridge();
    // Friction needs anchors; designer authors two evidence anchors so the references exist.
    const a = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'A' },
      designerConsent,
    );
    const b = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'B' },
      designerConsent,
    );
    const r = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.FRICTION,
        friction_shape: 'overlap',
        anchor_a: a.id,
        anchor_b: b.id,
        disposition: 'address',
      },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^friction_/);
  });
});

// AC-1.2 — agent NOT permitted to add RULE / PERMISSION.
describe('AC-1.2 — DESIGN_PARTNER rejected on add for designer-only categories', () => {
  const DESIGNER_ONLY_ADD_CATEGORIES = [
    ELEMENT_CATEGORIES.RULE,
    ELEMENT_CATEGORIES.PERMISSION,
  ];

  for (const category of DESIGNER_ONLY_ADD_CATEGORIES) {
    it(`lookupAuthority(${category}, 'add') does NOT include DESIGN_PARTNER`, () => {
      const allow = lookupAuthority(category, ACTION_LABELS.ADD);
      expect(allow).not.toContain(CONSENT_SOURCES.DESIGN_PARTNER);
    });
  }

  it('agent addElement on RULE throws CONSENT_INVALID', async () => {
    const bridge = await makeRealBridge();
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'r' },
      designPartnerConsent,
    )).toThrow(/CONSENT_INVALID/);
  });

  it('agent addElement on PERMISSION throws CONSENT_INVALID', async () => {
    const bridge = await makeRealBridge();
    const rule = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RULE, statement: 'r' },
      designerConsent,
    );
    expect(() => bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.PERMISSION, statement: 'p', relieves: rule.id },
      designPartnerConsent,
    )).toThrow(/CONSENT_INVALID/);
  });
});

// AC-1.3 — agent NOT permitted to ratify DEFINITION / CONCERN / RESOLUTION.
describe('AC-1.3 — DESIGN_PARTNER rejected on ratify for designer-only ratify categories', () => {
  it('agent ratify on DEFINITION throws CONSENT_INVALID', async () => {
    const bridge = await makeRealBridge();
    const d = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.DEFINITION, canonical_name: 'Term', definition: 'meaning' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: d.id, source: CONSENT_SOURCES.DESIGN_PARTNER },
      designPartnerConsent,
    )).toThrow(/CONSENT_INVALID/);
  });

  it('agent ratify on CONCERN throws CONSENT_INVALID', async () => {
    const bridge = await makeRealBridge();
    // RATIFY precondition requires evidence to exist.
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const c = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.CONCERN, label: 'x' },
      designerConsent,
    );
    expect(() => bridge.ratifyElement(
      { elementId: c.id, source: CONSENT_SOURCES.DESIGN_PARTNER },
      designPartnerConsent,
    )).toThrow(/CONSENT_INVALID/);
  });

  it('agent ratify on RESOLUTION throws CONSENT_INVALID', async () => {
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
    expect(() => bridge.ratifyElement(
      { elementId: res.id, source: CONSENT_SOURCES.DESIGN_PARTNER },
      designPartnerConsent,
    )).toThrow(/CONSENT_INVALID/);
  });
});

// AC-1.4 — agent IS permitted to ratify PROPOSITION (dual-partner).
describe('AC-1.4 — DESIGN_PARTNER permitted on ratify for PROPOSITION', () => {
  it('designer add + designer ratify + agent ratify → proposition derives', async () => {
    const bridge = await makeRealBridge();
    const { prop } = await seedEvidenceAndProposition(bridge);
    bridge.ratifyElement(
      { elementId: prop.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: prop.id, source: CONSENT_SOURCES.DESIGN_PARTNER },
      designPartnerConsent,
    );
    const derived = bridge.queryProof({ pattern: ['proposition', [prop.id, { var: 'S' }]] });
    expect(derived.length).toBe(1);
  });
});

// AC-1.5 — agent IS permitted to revise/withdraw EVIDENCE / PROPOSITION / RISK / FRICTION.
describe('AC-1.5 — DESIGN_PARTNER permitted on revise/withdraw for agent-eligible categories', () => {
  it('agent revise EVIDENCE succeeds', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'orig' },
      designerConsent,
    );
    const r = bridge.reviseElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, supersedes: ev.id, source: 'industry', statement: 'revised' },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^evidence_/);
  });

  it('agent withdraw EVIDENCE succeeds', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'orig' },
      designerConsent,
    );
    expect(() => bridge.withdrawElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, id: ev.id, disposition: 'explicit' },
      designPartnerConsent,
    )).not.toThrow();
  });

  it('agent revise PROPOSITION (via reviseElement) succeeds', async () => {
    const bridge = await makeRealBridge();
    const { ev, prop } = await seedEvidenceAndProposition(bridge);
    const r = bridge.reviseElement(
      {
        idShape: ELEMENT_CATEGORIES.PROPOSITION,
        supersedes: prop.id,
        statement: 'revised',
        grounding: [ev.id],
        inference_pattern: 'grounds_imply_conclusion',
        collapse_test: 'ct',
        reasoning_chain: 'rc',
      },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^proposition_/);
  });

  it('agent withdraw PROPOSITION succeeds', async () => {
    const bridge = await makeRealBridge();
    const { prop } = await seedEvidenceAndProposition(bridge);
    expect(() => bridge.withdrawElement(
      { idShape: ELEMENT_CATEGORIES.PROPOSITION, id: prop.id, disposition: 'explicit' },
      designPartnerConsent,
    )).not.toThrow();
  });

  it('agent revise RISK succeeds', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const risk = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'risk1', basis: [ev.id] },
      designerConsent,
    );
    const r = bridge.reviseElement(
      {
        idShape: ELEMENT_CATEGORIES.RISK,
        supersedes: risk.id,
        statement: 'risk1-revised',
        basis: [ev.id],
      },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^risk_/);
  });

  it('agent withdraw RISK succeeds', async () => {
    const bridge = await makeRealBridge();
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'E' },
      designerConsent,
    );
    const risk = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'risk1', basis: [ev.id] },
      designerConsent,
    );
    expect(() => bridge.withdrawElement(
      { idShape: ELEMENT_CATEGORIES.RISK, id: risk.id, disposition: 'explicit' },
      designPartnerConsent,
    )).not.toThrow();
  });

  it('agent revise FRICTION succeeds', async () => {
    const bridge = await makeRealBridge();
    const a = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'A' },
      designerConsent,
    );
    const b = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'B' },
      designerConsent,
    );
    const fric = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.FRICTION,
        friction_shape: 'overlap',
        anchor_a: a.id,
        anchor_b: b.id,
        disposition: 'address',
      },
      designerConsent,
    );
    const r = bridge.reviseElement(
      {
        idShape: ELEMENT_CATEGORIES.FRICTION,
        supersedes: fric.id,
        friction_shape: 'overlap',
        anchor_a: a.id,
        anchor_b: b.id,
        disposition: 'defer',
      },
      designPartnerConsent,
    );
    expect(r.id).toMatch(/^friction_/);
  });

  it('agent withdraw FRICTION succeeds', async () => {
    const bridge = await makeRealBridge();
    const a = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'A' },
      designerConsent,
    );
    const b = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'B' },
      designerConsent,
    );
    const fric = bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.FRICTION,
        friction_shape: 'overlap',
        anchor_a: a.id,
        anchor_b: b.id,
        disposition: 'address',
      },
      designerConsent,
    );
    expect(() => bridge.withdrawElement(
      { idShape: ELEMENT_CATEGORIES.FRICTION, id: fric.id, disposition: 'explicit' },
      designPartnerConsent,
    )).not.toThrow();
  });
});

// AC-2.1 — exactly three agent_action rows for three DESIGN_PARTNER operations.
describe('AC-2.1 — agent_action emitted on every DESIGN_PARTNER operation', () => {
  it('Evidence add + Risk add + Proposition ratify each emit one agent_action row', async () => {
    const bridge = await makeRealBridge();
    // Operation 1: agent adds Evidence.
    const ev = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'agent-ev' },
      designPartnerConsent,
    );
    // Operation 2: agent adds Risk.
    const risk = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.RISK, statement: 'agent-risk', basis: [ev.id] },
      designPartnerConsent,
    );
    // Operation 3: agent ratifies a Proposition (designer authored + ratified first).
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
    bridge.ratifyElement(
      { elementId: prop.id, source: CONSENT_SOURCES.DESIGNER },
      designerConsent,
    );
    bridge.ratifyElement(
      { elementId: prop.id, source: CONSENT_SOURCES.DESIGN_PARTNER },
      designPartnerConsent,
    );
    const rows = bridge.queryProof({
      pattern: ['agent_action', [{ var: 'I' }, { var: 'V' }, { var: 'S' }, { var: 'T' }]],
    });
    expect(rows.length).toBe(3);
    // Build expected (I, V, S, T) bindings.
    const byVerb = new Map(rows.map(r => [r.V, r]));
    expect(byVerb.get(ACTION_LABELS.ADD)).toBeDefined();
    expect(byVerb.get(ACTION_LABELS.RATIFY)).toBeDefined();
    // Two adds (Evidence + Risk) and one ratify — but byVerb collapses duplicates.
    // Inspect element ids precisely instead:
    const ids = rows.map(r => r.I).sort();
    expect(ids).toEqual([ev.id, prop.id, risk.id].sort());
    // Every row has the expected source + timestamp.
    for (const r of rows) {
      expect(r.S).toBe(CONSENT_SOURCES.DESIGN_PARTNER);
      expect(r.T).toBe(1700000000);
    }
    // Verb-by-id mapping.
    const verbById = Object.fromEntries(rows.map(r => [r.I, r.V]));
    expect(verbById[ev.id]).toBe(ACTION_LABELS.ADD);
    expect(verbById[risk.id]).toBe(ACTION_LABELS.ADD);
    expect(verbById[prop.id]).toBe(ACTION_LABELS.RATIFY);
  });
});

// AC-2.2 — zero emissions on designer and system actions.
describe('AC-2.2 — agent_action NOT emitted on designer or system actions', () => {
  it('designer add of Evidence emits zero agent_action rows', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'designer-ev' },
      designerConsent,
    );
    const rows = bridge.queryProof({
      pattern: ['agent_action', [{ var: 'I' }, { var: 'V' }, { var: 'S' }, { var: 'T' }]],
    });
    expect(rows.length).toBe(0);
  });

  it('system add of FRICTION emits zero agent_action rows', async () => {
    const bridge = await makeRealBridge();
    const a = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'A' },
      designerConsent,
    );
    const b = bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'B' },
      designerConsent,
    );
    bridge.addElement(
      {
        idShape: ELEMENT_CATEGORIES.FRICTION,
        friction_shape: 'overlap',
        anchor_a: a.id,
        anchor_b: b.id,
        disposition: 'address',
      },
      systemConsent,
    );
    const rows = bridge.queryProof({
      pattern: ['agent_action', [{ var: 'I' }, { var: 'V' }, { var: 'S' }, { var: 'T' }]],
    });
    expect(rows.length).toBe(0);
  });
});

// AC-2.3 — agent_action appears in renderDatalogProjection.
describe('AC-2.3 — agent_action present in renderDatalogProjection', () => {
  it('renderDatalogProjection.facts contains at least one agent_action row after a DESIGN_PARTNER add', async () => {
    const bridge = await makeRealBridge();
    bridge.addElement(
      { idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'industry', statement: 'agent-ev' },
      designPartnerConsent,
    );
    const projection = bridge.renderDatalogProjection({});
    expect(projection.facts.some(f => f[0] === 'agent_action')).toBe(true);
  });
});

// AC-3.x confirmation — reviseResolution with DESIGNER emits single approved row,
// agent reviseResolution throws.
describe('AC-3.x confirmation — reviseResolution authority + approval', () => {
  it('designer reviseResolution emits exactly one approved row with source=designer; two_yes_complete NOT derived', async () => {
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
    const approvalRows = bridge.queryProof({
      pattern: ['approved', [revised.id, { var: 'SRC' }, { var: 'T' }]],
    });
    expect(approvalRows.length).toBe(1);
    expect(approvalRows[0].SRC).toBe('designer');
    const twoYes = bridge.queryProof({ pattern: ['two_yes_complete', [revised.id]] });
    expect(twoYes.length).toBe(0);
  });

  it('agent reviseResolution throws CONSENT_INVALID', async () => {
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
    expect(() => bridge.reviseResolution(
      {
        supersedes: res.id,
        statement: 'r1-revised',
        problem_anchor: concern.id,
        grounding: [prop.id],
      },
      designPartnerConsent,
    )).toThrow(/CONSENT_INVALID/);
  });
});
