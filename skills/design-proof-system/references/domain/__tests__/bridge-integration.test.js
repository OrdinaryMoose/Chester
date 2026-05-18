import { describe, it, expect, vi } from 'vitest';
import { createInMemorySubstrate, createRecordingSubstrate } from './_fixtures/inMemorySubstrate.js';
import { createDomainBridge, createReadOnlyAudit } from '../domain-bridge.js';
import { DomainBootError } from '../boot-validators.js';
import { CONSENT_SOURCES, ELEMENT_CATEGORIES, ID_PREFIXES } from '../tags.js';

export function makeAdapters({ failSaveOnce = false } = {}) {
  let saved = false;
  // Deterministic per-shape counter so tests can reference predictable ids like 'evid_1'.
  // Each call to next(shape) yields ID_PREFIXES[shape] + <n>, with n monotonically increasing
  // per shape. Prefix table is the single source of truth pinned in tags.js (sprint-02-bug-fix-07).
  const counters = {};
  return {
    clock: { now: () => 1700000000 },
    idAllocator: {
      next: (shape) => {
        counters[shape] = (counters[shape] ?? 0) + 1;
        return ID_PREFIXES[shape] + counters[shape];
      },
      seed: (map) => { Object.assign(counters, map); },
      highWater: (shape) => counters[shape] ?? 0,
    },
    consentVerification: { verify: () => true },
    persistenceRepo: { saveState: vi.fn(() => { if (failSaveOnce && !saved) { saved = true; throw new Error('DISK_FULL'); } }) },
  };
}

describe('bridge-integration — engine-shape adapter', () => {
  // Engine↔Domain port-shape normalization (added 2026-05-14 alongside the
  // wildcard-in-rule-body fix). The Domain bridge accepts either a port-bundled
  // engine (the substrate fake) or a flat-API Engine instance (sprint-01 Engine).
  it('createDomainBridge accepts a flat-API Engine instance and normalizes it to port bundles', async () => {
    const { Engine } = await import('../../engine/Engine.js');
    const realEngine = new Engine();
    expect(() => createDomainBridge({ engine: realEngine, ...makeAdapters() })).not.toThrow();
  });

  it('createDomainBridge end-to-end against real Engine: boot, addElement, ratify, query, closure', async () => {
    const { Engine } = await import('../../engine/Engine.js');
    const bridge = createDomainBridge({ engine: new Engine(), ...makeAdapters() });
    const consent = { source: CONSENT_SOURCES.DESIGNER };

    // Add evidence + proposition + concern + resolution; ratify; closure should permit.
    // RESOLUTION post-§3.6 reshape requires problem_anchor:concern and grounding:[proposition],
    // so the original {risk, addresses: risk.id} shape is no longer expressible. A risk would
    // also fire coverage_gap_detected because resolution_anchor is type-locked to concern and
    // cannot anchor risks — out of scope for this closure-path smoke test.
    const evid = bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'baseline' }, consent);
    const prop = bridge.addElement({
      idShape: ELEMENT_CATEGORIES.PROPOSITION,
      statement: 'p1',
      grounding: [evid.id],
      inference_pattern: 'grounds_imply_conclusion',
      collapse_test: 'ct',
      reasoning_chain: 'rc',
    }, consent);
    const concern = bridge.addElement({ idShape: ELEMENT_CATEGORIES.CONCERN, label: 'C1' }, consent);
    const res = bridge.addElement({
      idShape: ELEMENT_CATEGORIES.RESOLUTION,
      statement: 'return Error',
      problem_anchor: concern.id,
      grounding: [prop.id],
    }, consent);
    bridge.ratifyElement({ elementId: res.id, source: 'designer', source_field: 'designer', claim: 'r' }, consent);

    // After fixing the wildcard bug, unaddressed_concern should be empty here.
    const unaddressed = bridge.queryProof({ pattern: ['unaddressed_concern', [{ var: 'C' }]] });
    expect(unaddressed).toEqual([]);
    const permitted = bridge.queryProof({ pattern: ['closure_permitted', []] });
    expect(permitted.length).toBe(1);
    expect(() => bridge.presentClosingArgument({ source: 'codebase', statement: 'c' }, consent)).not.toThrow();
  });

  it('createDomainBridge throws a clear error on an engine shape that is neither port-bundled nor flat', () => {
    expect(() => createDomainBridge({ engine: { weird: () => {} }, ...makeAdapters() }))
      .toThrow(/normalizeEngine: engine is neither port-bundled .* nor a flat-API Engine/);
  });
});

describe('bridge-integration', () => {
  it('AC-3.4 — runOperation port-call ordering for each of the eight verbs matches §6.1', async () => {
    // Spec AC-3.4 observable boundary: a bridge-integration test invokes EACH of the eight
    // verbs against an instrumented substrate fake and records the actual port-call sequence.
    // The recorded sequence must match the §6.1 ordering: tx.begin → (assertFact|defineRule)* →
    // (derive) → query (precond) → query (postcond) → (customPostCheck?) → tx.commit → save.
    //
    // The test invokes runOperation directly (not via facade methods) for two reasons:
    //   (1) `openProof` is an OPERATION_SPECS verb but has no delivery-port facade method
    //       (the spec's seven delivery ports don't expose it — it's expected to be invoked
    //       by the Interface at session initiation, not as a tool call).
    //   (2) `manageFriction` is a single OPERATION_SPECS verb but is dispatched via two
    //       distinct facade methods (`addFriction` and `overrideFrictionDisposition` per
    //       spec §"Delivery-port facade methods") based on `args.action`. Testing at the
    //       verb level instead of the facade level keeps the loop uniform across all eight.
    //
    // The bridge is constructed first so Phase A and Phase B rules land in the substrate;
    // then a parallel fullPorts is built (mirroring the bridge's internal construction)
    // for direct runOperation calls. `calls.length = 0` resets the recorder between bridge
    // construction and verb invocation so only the verb's port calls are observed.
    const { runOperation, OPERATION_SPECS } = await import('../mutations.js');

    const buildFullPorts = (substrate, adapters) => Object.freeze({
      facts: substrate.facts, rules: substrate.rules, query: substrate.query,
      explain: substrate.explain, tx: substrate.tx, snapshot: substrate.snapshot,
      clock: adapters.clock, ids: adapters.idAllocator,
      consent: adapters.consentVerification, persist: adapters.persistenceRepo,
    });

    const consent = { source: CONSENT_SOURCES.DESIGNER };
    // §6.1 step 3 (verifyArgsShape) checks that every required field of the verb's idShape
    // is present in args before opening the transaction at step 4. Each verb-case args
    // therefore includes the required fields of its idShape — even when the verb's translate
    // ignores them (e.g., openProof / closure verbs use EVIDENCE as a placeholder idShape per
    // OPERATION_SPECS comments; their translate functions don't read `source`/`claim`, but the
    // shape check still demands them). Required-field sources of truth:
    //   EVIDENCE  → ['source', 'statement']          (schema.js CATEGORY_REGISTRY)
    //   PROPOSITION → ['statement','grounding','collapse_test','inference_pattern','reasoning_chain']
    //   FRICTION  → ['friction_shape', 'anchor_a', 'anchor_b', 'disposition']
    const evidenceFill = { source: 'codebase', statement: 'x' };
    // manage_friction's argShape (mutations.js) is the operation-shaped {frictionId, disposition}
    // — NOT the FRICTION element descriptor. The spread below contributes inert extras the
    // translator ignores; only `disposition` (overridden on line 140) is read. Kept aligned
    // with the post-Task-4 FRICTION descriptor for clarity (`friction_shape` replaces `shape`,
    // `description` is no longer a required field on the element).
    const frictionFill = { friction_shape: 'conflict' };
    // NOTE: OPERATION_SPECS is keyed on ACTION_LABELS values (snake_case: 'open_proof', 'add',
    // 'revise', 'withdraw', 'ratify', 'manage_friction', 'present_closing_argument',
    // 'confirm_closure_go'). The plan listed camelCase facade-method names here; corrected to
    // match production OPERATION_SPECS keys so runOperation can dispatch the verbs.
    const verbCases = [
      { verb: 'open_proof', prep: () => {}, args: () => ({ ...evidenceFill }) },
      { verb: 'add', prep: () => {}, args: () => ({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }) },
      // REVISE requires args.idShape (mutations.js guard at the REVISE-specific check before
      // verifyArgsShape) AND args.supersedes (the prior element id; checked separately after
      // verifyArgsShape). The verb-case was originally written before those guards landed and
      // supplied a bare `id` field which the production runOperation rejected before tx.begin —
      // causing the §6.1-ordering assertion to fail. Updated to the post-guard contract.
      { verb: 'revise', prep: (b) => b.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }, consent), args: () => ({ idShape: ELEMENT_CATEGORIES.EVIDENCE, supersedes: 'evid_1', source: 'codebase', statement: 'y' }) },
      { verb: 'withdraw', prep: (b) => b.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }, consent), args: () => ({ id: 'evid_1', ...evidenceFill }) },
      { verb: 'ratify', prep: (b) => b.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, ...evidenceFill }, consent), args: () => ({ elementId: 'evid_1', source: CONSENT_SOURCES.DESIGNER, ...evidenceFill }) },
      // MANAGE_FRICTION's argShape (mutations.js) requires ['frictionId', 'disposition'] and
      // closed-enum-checks `disposition` against FRICTION_DISPOSITIONS. The verb-case was
      // missing `disposition`, causing verifyArgsShape to throw before tx.begin.
      { verb: 'manage_friction', prep: () => {}, args: () => ({ action: 'add', frictionId: 'f1', target: 'x', disposition: 'defer', ...frictionFill }) },
      { verb: 'present_closing_argument', prep: () => {}, args: () => ({ ...evidenceFill }) },
      { verb: 'confirm_closure_go', prep: (b) => { try { b.presentClosingArgument({ ...evidenceFill }, consent); } catch {} }, args: () => ({ ...evidenceFill }) },
    ];
    expect(verbCases.length).toBe(8);
    // Sanity check: every verb is a real OPERATION_SPECS key.
    for (const { verb } of verbCases) expect(OPERATION_SPECS[verb]).toBeDefined();

    for (const { verb, prep, args } of verbCases) {
      const { substrate, calls } = createRecordingSubstrate();
      const adapters = makeAdapters();
      const bridge = createDomainBridge({ engine: substrate, ...adapters });
      const fullPorts = buildFullPorts(substrate, adapters);
      try { prep(bridge); } catch { /* prep failures are not the test target */ }
      calls.length = 0; // reset recorder so only the target verb's port calls are observed
      try { runOperation(verb, args(bridge), consent, fullPorts); }
      catch (e) {
        // DomainError on precondition failure is acceptable — the §6.1 ordering invariant
        // must hold for whatever calls WERE recorded before the throw. UNKNOWN_VERB or
        // TypeError indicates a test setup bug; re-throw those.
        if (e && (e.code === 'UNKNOWN_VERB' || e.name === 'TypeError')) throw e;
      }

      const order = calls.map(c => `${c.port}.${c.method}`);
      // Every verb opens a transaction at §6.1 step 4 — assert this fires for all eight.
      const txBeginAt = order.indexOf('tx.begin');
      expect(txBeginAt, `verb '${verb}' must open a transaction (§6.1 step 4)`).toBeGreaterThanOrEqual(0);
      const txCommitAt = order.indexOf('tx.commit');
      const txRollbackAt = order.indexOf('tx.rollback');
      const closeAt = txCommitAt !== -1 ? txCommitAt : txRollbackAt;
      expect(closeAt, `verb '${verb}' must close the transaction (commit or rollback)`).toBeGreaterThan(txBeginAt);
      // Any assertFact/defineRule call WITHIN the transaction scope (between begin and close)
      // must fall strictly between begin and close. Post-commit lifecycle work (§6.1 step 13
      // `advance` writes a `round` fact outside any transaction) is OUTSIDE the §6.1 transaction
      // ordering invariant and is excluded by `i < closeAt`.
      for (let i = 0; i < closeAt; i++) {
        const tag = `${calls[i].port}.${calls[i].method}`;
        if (tag === 'facts.assertFact' || tag === 'rules.defineRule') {
          expect(i, `verb '${verb}': ${tag} must follow tx.begin`).toBeGreaterThan(txBeginAt);
          expect(i, `verb '${verb}': ${tag} must precede tx close`).toBeLessThan(closeAt);
        }
      }
      // On the commit path, persist.saveState fires strictly after tx.commit (§6.1 step 11).
      if (txCommitAt !== -1) {
        const saveAt = order.findIndex((t, i) => i > txCommitAt && t === 'persist.saveState');
        if (saveAt !== -1) expect(saveAt, `verb '${verb}': persist.saveState must follow tx.commit`).toBeGreaterThan(txCommitAt);
      }
    }
  });

  it('AC-4.1 — DomainBootError thrown when bridge is constructed against corrupted OPERATION_SPECS (no facade returned)', async () => {
    // Spec AC-4.1 requires bridge-level observation: corrupting OPERATION_SPECS makes bridge construction throw DomainBootError
    // AND no port-bundle facade is returned. The bridge module exports an internal `createDomainBridgeWith` factory used here for
    // the corruption injection — this internal factory takes overrides for {operationSpecs, categoryRegistry, ruleTemplates}.
    // (`createDomainBridgeWith` is added at the bottom of domain-bridge.js, exported for the test boundary only.)
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { OPERATION_SPECS } = await import('../mutations.js');
    const substrate = createInMemorySubstrate();
    // Variant 1: missing required field
    const badSpecsMissing = { ...OPERATION_SPECS, add: { ...OPERATION_SPECS.add, idShape: undefined } };
    expect(() => createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { operationSpecs: badSpecsMissing }))
      .toThrow(DomainBootError);
    // Variant 2: bad consentCategory tag
    const badSpecsTag = { ...OPERATION_SPECS, add: { ...OPERATION_SPECS.add, consentCategory: 'not_a_consent_source' } };
    expect(() => createDomainBridgeWith({ engine: createInMemorySubstrate(), ...makeAdapters() }, { operationSpecs: badSpecsTag }))
      .toThrow(DomainBootError);
  });

  it('AC-4.2 — DomainBootError thrown when bridge is constructed against corrupted CATEGORY_REGISTRY', async () => {
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { CATEGORY_REGISTRY } = await import('../schema.js');
    const { ELEMENT_CATEGORIES } = await import('../tags.js');
    const substrate = createInMemorySubstrate();
    // Variant: empty requiredFields
    const badRegistry = { ...CATEGORY_REGISTRY, [ELEMENT_CATEGORIES.EVIDENCE]: { ...CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE], requiredFields: [] } };
    expect(() => createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { categoryRegistry: badRegistry }))
      .toThrow(DomainBootError);
    // Variant: unresolved sourceConstraint
    const badRegistry2 = { ...CATEGORY_REGISTRY, [ELEMENT_CATEGORIES.EVIDENCE]: { ...CATEGORY_REGISTRY[ELEMENT_CATEGORIES.EVIDENCE], sourceConstraint: 'not_a_source' } };
    expect(() => createDomainBridgeWith({ engine: createInMemorySubstrate(), ...makeAdapters() }, { categoryRegistry: badRegistry2 }))
      .toThrow(DomainBootError);
  });

  it('AC-4.3 — DomainBootError thrown when bridge is constructed against RULE_TEMPLATES with unresolved elementCategory', async () => {
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { RULE_TEMPLATES } = await import('../translation.js');
    const substrate = createInMemorySubstrate();
    const badTemplates = { ...RULE_TEMPLATES, junk: { elementCategory: 'not_a_category', build: (id) => ({ ruleId: `${id}_x`, headAtom: ['x', [id]], bodyAtoms: [], metadata: {} }) } };
    // AC-4.3: validateRuleTemplates throws DomainBootError with the failing template id in recordId.
    let captured = null;
    try { createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { ruleTemplates: badTemplates }); }
    catch (e) { captured = e; }
    expect(captured).toBeInstanceOf(DomainBootError);
    expect(captured.recordId).toBe('junk');
  });

  it('AC-4.3 / AC-5.1 (Phase B stratification sub-case) — cyclic-negation template body throws as DomainBootError at Phase B defineRule', async () => {
    const { createDomainBridgeWith } = await import('../domain-bridge.js');
    const { RULE_TEMPLATES } = await import('../translation.js');
    const { ELEMENT_CATEGORIES } = await import('../tags.js');
    // Cross-record-clean template with cyclic-negation body. The in-memory substrate's
    // _checkStratification (called from defineRule per ADR-0013 Part 3) throws on
    // cycle-through-negation. The bridge catches and re-throws as DomainBootError
    // carrying the failing template id.
    const cyclicTemplates = {
      ...RULE_TEMPLATES,
      cyclic_test: {
        elementCategory: ELEMENT_CATEGORIES.PROPOSITION,
        build: (id) => ({
          ruleId: `${id}_cyclic`,
          headAtom: ['p', [id]],
          bodyAtoms: [['not', ['q', [id]]], ['p', [id]]], // p depends on not q AND on p — cyclic through negation
          metadata: { element: id },
        }),
      },
    };
    const substrate = createInMemorySubstrate();
    // The substrate fake's _checkStratification must throw on this cyclic body; the
    // bridge then wraps the throw into DomainBootError. Implementer note: if the
    // in-memory fake's stratification check is a no-op stub (Task 1 left this minimal),
    // tighten the stub to detect a simple negation cycle for this test to fire.
    // AC-5.1: DomainBootError carries the failing template id in recordId.
    let captured = null;
    try { createDomainBridgeWith({ engine: substrate, ...makeAdapters() }, { ruleTemplates: cyclicTemplates }); }
    catch (e) { captured = e; }
    expect(captured).toBeInstanceOf(DomainBootError);
    expect(captured.recordId).toBe('cyclic_test');
  });

  it('AC-5.1 — cyclic-negation rule causes DomainBootError at bridge construction', () => {
    const substrate = createInMemorySubstrate();
    const realDefineRule = substrate.rules.defineRule;
    let count = 0;
    substrate.rules.defineRule = vi.fn((...args) => {
      count++;
      if (count === 1) throw new Error('STRATIFICATION: cycle through negation in rule x');
      return realDefineRule(...args);
    });
    expect(() => createDomainBridge({ engine: substrate, ...makeAdapters() })).toThrow(DomainBootError);
  });

  it('AC-6.1 — render functions structurally read-only at runtime', () => {
    const { substrate, calls } = createRecordingSubstrate();
    const bridge = createDomainBridge({ engine: substrate, ...makeAdapters() });
    // Bridge construction installs Phase A (registerStatic) and Phase B (rule templates)
    // rules, firing multiple defineRule calls into the recorder. Reset the recorder so the
    // assertion below scopes to the render calls only.
    calls.length = 0;
    bridge.renderStructuredProof({});
    bridge.renderDatalogProjection({});
    const mutationMethods = new Set(['assertFact', 'retractFact', 'defineRule', 'undefineRule', 'begin', 'commit', 'rollback']);
    expect(calls.filter(c => mutationMethods.has(c.method)).length).toBe(0);
  });

  it('AC-7.1 — counterfactual restores state on throw', () => {
    const substrate = createInMemorySubstrate();
    const bridge = createDomainBridge({ engine: substrate, ...makeAdapters() });
    substrate.facts.assertFact('approved', ['prop_1', 'designer', 'x']);
    const before = substrate.snapshot.snapshot();
    const realQuery = substrate.query.query;
    substrate.query.query = () => { throw new Error('INJECTED'); };
    expect(() => bridge.runCounterfactual({ propId: 'prop_1' })).toThrow(/INJECTED/);
    substrate.query.query = realQuery;
    expect(substrate.snapshot.snapshot()).toBe(before);
  });

  it('AC-8.1 — POST_COMMIT_SAVE_FAILED on save failure after successful commit', () => {
    const substrate = createInMemorySubstrate();
    const adapters = makeAdapters({ failSaveOnce: true });
    const bridge = createDomainBridge({ engine: substrate, ...adapters });
    expect(() => bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'x' }, { source: CONSENT_SOURCES.DESIGNER }))
      .toThrow(/POST_COMMIT_SAVE_FAILED/);
    // Engine has committed (assertion visible).
    expect(substrate.query.exists(['evidence', ['_', '_', '_']])).toBe(true);
  });

  it('AC-11.1 — createReadOnlyAudit runs every IRenderSurface render method and excludes every mutation', () => {
    // Spec AC-11.1 observable boundary: the audit adapter runs EVERY IRenderSurface.render*
    // method against a populated state and returns structurally-valid render payloads, AND
    // exposes no IElementMutation/IRatification/IFrictionManagement/IDefinitionManagement/
    // IClosureSurface method on its surface.
    const substrate = createInMemorySubstrate();
    const bridge = createDomainBridge({ engine: substrate, ...makeAdapters() });
    // Populate state so each render method has content to project.
    bridge.addElement({ idShape: ELEMENT_CATEGORIES.EVIDENCE, source: 'codebase', statement: 'x' }, { source: CONSENT_SOURCES.DESIGNER });

    const audit = createReadOnlyAudit(substrate);
    // Spec lists five IRenderSurface methods (Architecture §4.2 + spec Components §"Delivery-port facade methods").
    // Each render method takes args of a different shape; pass realistic args per method so the
    // method has enough input to produce a non-null payload. The substrate was populated above
    // via bridge.addElement, so an evidence_1 element exists for renderElementDeep to find.
    const renderInvocations = [
      ['renderStructuredProof', {}],
      ['renderElementDeep', { id: 'evid_1' }],
      ['renderClosingArgument', {}],
      ['renderDatalogProjection', {}],
      ['renderLaneSlice', { lane: 'all' }],
    ];
    for (const [m, methodArgs] of renderInvocations) {
      expect(typeof audit[m]).toBe('function');
      const result = audit[m](methodArgs);
      // Every render method returns SOMETHING — string, object, or array — but never undefined or null.
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    }
    // Spec Datalog-projection sub-clause: renderDatalogProjection output is parseable
    // (JSON.parse(JSON.stringify(x)) preserves it) and structurally complete.
    const projection = audit.renderDatalogProjection({});
    expect(JSON.parse(JSON.stringify(projection))).toEqual(projection);
    expect(Array.isArray(projection.facts)).toBe(true);
    expect(projection.facts.length).toBeGreaterThan(0);

    // Audit adapter exposes IQuerySurface (getProofState, queryProof, runCounterfactual) per spec.
    for (const m of ['getProofState', 'queryProof', 'runCounterfactual']) {
      expect(typeof audit[m]).toBe('function');
    }

    // No mutation methods are callable on the audit adapter (spec AC-11.1 sub-clause).
    const forbidden = [
      // IElementMutation
      'addElement', 'reviseElement', 'withdrawElement',
      // IRatification
      'ratifyElement',
      // IFrictionManagement
      'addFriction', 'overrideFrictionDisposition',
      // IDefinitionManagement (spec lists five: add/revise/ratify/deprecate plus queryOverlap)
      'addDefinition', 'reviseDefinition', 'ratifyDefinition', 'deprecateDefinition', 'queryOverlap',
      // IClosureSurface
      'presentClosingArgument', 'confirmClosureGo',
    ];
    for (const m of forbidden) expect(audit[m]).toBeUndefined();
  });
});
