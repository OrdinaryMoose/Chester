// domain-bridge.js — single assembly seam. Constructs port bundles, runs boot sequence,
// exposes seven delivery-port facades. Per spec Components §"Delivery-port facade methods".

import { CATEGORY_REGISTRY } from './schema.js';
import { OPERATION_SPECS, runOperation } from './mutations.js';
import { RULE_TEMPLATES, registerRuleTemplates, getDeclaredEDBPredicates } from './translation.js';
import * as closurePolicy from './closure-policy.js';
import * as frictionPolicy from './friction-policy.js';
import * as render from './render.js';
import * as counterfactual from './counterfactual.js';
import * as tags from './tags.js';
import { validateOperationSpecs, validateCategoryRegistry, validateRuleTemplates, DomainBootError } from './boot-validators.js';
import { normalizeEngine } from './engine-port-adapter.js';

// D9 — payload channel sentinels. Single source of truth for both helpers and
// (indirectly) the VOCABULARY.md documentation. Changing these requires updating
// the doc in lockstep — the test suite does not couple to these constants directly.
const PAYLOAD_START = '===== PAYLOAD_START =====';
const PAYLOAD_END = '===== PAYLOAD_END =====';

/**
 * D9 — Stable payload channel for transport-fragile structured content. Wraps a payload
 * in sentinel delimiters so receiving agents can extract the content without depending
 * on markdown rendering.
 */
export function createPayloadChannel(content) {
  return `${PAYLOAD_START}\n${content}\n${PAYLOAD_END}`;
}

/**
 * D9 — Unwrap a payload channel string. Returns the content between the sentinels,
 * or null if the input is malformed (missing either sentinel).
 */
export function parsePayloadChannel(raw) {
  if (typeof raw !== 'string') return null;
  const startToken = `${PAYLOAD_START}\n`;
  const endToken = `\n${PAYLOAD_END}`;
  const startIdx = raw.indexOf(startToken);
  const endIdx = raw.indexOf(endToken);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  return raw.slice(startIdx + startToken.length, endIdx);
}

/**
 * @param {{engine: object, clock: object, idAllocator: object, consentVerification: object, persistenceRepo: object}} deps
 * @returns {Readonly<object>} frozen facade
 */
export function createDomainBridge({ engine: rawEngine, clock, idAllocator, consentVerification, persistenceRepo }) {
  // Step 1: normalize engine shape — accept either port-bundled (substrate fake)
  // or flat-API (real sprint-01 Engine). See engine-port-adapter.js for detection.
  const engine = normalizeEngine(rawEngine);
  // Step 2: construct four frozen port bundles
  // readPorts gets `getAllRules` (a single function, not the full rules port bundle)
  // so renderDatalogProjection can serialize the rule store. Exposing only the function
  // keeps the read-side surface narrow — defineRule/undefineRule remain write-side only.
  const readPorts = Object.freeze({ query: engine.query, explain: engine.explain, getAllRules: () => engine.rules.allRules() });
  const writePorts = Object.freeze({ facts: engine.facts, rules: engine.rules, query: engine.query, explain: engine.explain, tx: engine.tx });
  const probePorts = Object.freeze({ query: engine.query, explain: engine.explain, snapshot: engine.snapshot, facts: engine.facts, hasOpenTransaction: () => engine.tx?.hasOpenTransaction?.() ?? false });
  const fullPorts = Object.freeze({
    ...writePorts, ...probePorts,
    clock, ids: idAllocator, consent: consentVerification, persist: persistenceRepo,
  });

  // Step 3: validate CATEGORY_REGISTRY
  try { validateCategoryRegistry(CATEGORY_REGISTRY, tags); }
  catch (e) { if (e instanceof DomainBootError) throw e; throw new DomainBootError({ validator: 'createDomainBridge', recordId: 'CATEGORY_REGISTRY', field: '*', violation: e.message }); }

  // Step 4: Phase A — static rule registration. Wrap any defineRule throw into DomainBootError.
  for (const policy of [closurePolicy, frictionPolicy]) {
    try { policy.registerStatic(writePorts.rules); }
    catch (e) {
      throw new DomainBootError({ validator: 'Phase A registerStatic', recordId: policy?.name ?? '?', field: '*', violation: e.message, cause: e });
    }
  }

  // Step 5: assemble validPredicates = Phase-A rule heads ∪ EDB predicates
  const validPredicates = getDeclaredEDBPredicates();
  // For sprint-02's scope, Phase-A rule head predicates are added by reading the rule store, OR statically named here.
  for (const p of ['closure_permitted', 'unresolved_friction', 'unaddressed_concern', 'covered', 'effective_addresses', 'ungrounded_proposition', 'effective_grounding', 'coverage_gap_detected', 'overlap_detected', 'conflict_detected', 'proposition', 'resolution', 'definition', 'concern', 'concern_status', 'concern_note', 'phase', 'two_yes_complete']) validPredicates.add(p);

  // Step 6: validate OPERATION_SPECS
  validateOperationSpecs(OPERATION_SPECS, tags, validPredicates);

  // Step 7: validate RULE_TEMPLATES (cross-record only; stratification at Phase B defineRule)
  validateRuleTemplates(RULE_TEMPLATES, CATEGORY_REGISTRY);

  // Step 8: Phase B — install rule templates. defineRule throws (stratification per ADR-0013 Part 3) wrap into DomainBootError.
  // The DomainBootError.recordId carries the failing template id (annotated by registerRuleTemplates per AC-4.3/AC-5.1);
  // if the inner throw is not template-scoped, fall back to a generic 'RULE_TEMPLATES' marker.
  try { registerRuleTemplates(writePorts.rules); }
  catch (e) {
    throw new DomainBootError({
      validator: 'Phase B registerRuleTemplates',
      recordId: e.templateId || 'RULE_TEMPLATES',
      field: e.ruleId ? `ruleId='${e.ruleId}'` : '*',
      violation: e.message,
      cause: e.cause || e,
    });
  }

  // Step 9: return frozen facade — seven delivery-port surfaces as one-line methods.
  return Object.freeze({
    // IElementMutation
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addElement: (args, consent) => runOperation('add', args, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    reviseElement: (args, consent) => runOperation('revise', args, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    withdrawElement: (args, consent) => runOperation('withdraw', args, consent, fullPorts),
    // IRatification
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    ratifyElement: (args, consent) => runOperation('ratify', args, consent, fullPorts),
    // IFrictionManagement
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addFriction: (args, consent) => runOperation('manage_friction', { ...args, action: 'add' }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    overrideFrictionDisposition: (args, consent) => runOperation('manage_friction', { ...args, action: 'override' }, consent, fullPorts),
    // IDefinitionManagement
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addDefinition: (args, consent) => runOperation('add', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    reviseDefinition: (args, consent) => runOperation('revise', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    ratifyDefinition: (args, consent) => runOperation('ratify', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    deprecateDefinition: (args, consent) => runOperation('withdraw', { ...args, idShape: tags.ELEMENT_CATEGORIES.DEFINITION }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    addConcern: (args, consent) => runOperation('add', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    reviseConcern: (args, consent) => runOperation('revise', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    ratifyConcern: (args, consent) => runOperation('ratify', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    withdrawConcern: (args, consent) => runOperation('withdraw', { ...args, idShape: tags.ELEMENT_CATEGORIES.CONCERN }, consent, fullPorts),
    /** @param {object} args @throws {DomainError} @returns {Array<object>} */
    queryOverlap: (args) => render.queryProof({ pattern: ['overlap_detected', [{ var: 'T1' }, { var: 'T2' }]] }, readPorts),
    // IClosureSurface
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    presentClosingArgument: (args, consent) => runOperation('present_closing_argument', args, consent, fullPorts),
    /** @param {object} args @param {object} consent @throws {DomainError} @returns {object} */
    confirmClosureGo: (args, consent) => runOperation('confirm_closure_go', args, consent, fullPorts),
    // IRenderSurface
    /** @param {object} args @throws {DomainError} @returns {string} markdown */
    renderStructuredProof: (args) => render.renderStructuredProof(args, readPorts),
    /** @param {{id: string}} args @throws {DomainError} @returns {object|null} */
    renderElementDeep: (args) => render.renderElementDeep(args, readPorts),
    /**
     * Returns the closing-argument summary plus a `detectedFrictions` list of
     * non-blocking-but-noteworthy structural findings. When `permitted: true`, the
     * list typically contains DEFERred frictions and any detection categories not
     * auto-escalated by closure_permitted_rule — operators should review them even
     * when closure is permitted. When `permitted: false`, the detection list may
     * overlap with closure_failure_reason.
     * @param {object} args
     * @throws {DomainError}
     * @returns {{permitted: boolean, asOf: number, detectedFrictions: Array<{shape: string, args: any[]}>}}
     */
    renderClosingArgument: (args) => render.renderClosingArgument(args, readPorts),
    /** @param {object} args @throws {DomainError} @returns {{facts: Array, rules: Array}} */
    renderDatalogProjection: (args) => render.renderDatalogProjection(args, readPorts),
    /** @param {{lane?: string}} args @throws {DomainError} @returns {object} */
    renderLaneSlice: (args) => render.renderLaneSlice(args, readPorts),
    // IQuerySurface
    /** @param {object} args @throws {DomainError} @returns {object} */
    getProofState: (args) => render.getProofState(args, readPorts),
    /** @param {{pattern: [string, any[]]}} args @throws {DomainError} @returns {Array<object>} */
    queryProof: (args) => render.queryProof(args, readPorts),
    /**
     * Aggregated friction-policy detections across all four detection shapes
     * (UNGROUNDED, COVERAGE_GAP, OVERLAP, CONFLICT). Symmetric pair shapes
     * (OVERLAP, CONFLICT) are canonicalized — one finding per distinct semantic
     * pair, no reflexive matches, no symmetric duplicates. See friction-policy.js.
     * @returns {Array<{shape: string, args: any[]}>}
     */
    detectFrictions: () => frictionPolicy.detectFrictions(readPorts),
    /**
     * Probe what closure looks like if a proposition's approval were retracted —
     * implemented via a snapshot/restore bracket that leaves engine state bit-equal
     * before and after.
     *
     * PRECONDITION: must NOT be called while an external transaction is open on the
     * engine. The snapshot/restore bracket invalidates any in-flight transaction (see
     * Engine.js `restore()` at line 94-96 — open txs are explicitly cleared during
     * restore). Calling this with an open tx throws `COUNTERFACTUAL_REFUSED_DURING_TX`
     * to prevent silent handle invalidation.
     *
     * @param {{propId: string}} args
     * @throws {DomainError} `COUNTERFACTUAL_REFUSED_DURING_TX` if a tx is open
     * @returns {{stillCloses: boolean, failureReasons: string[]}}
     */
    runCounterfactual: (args) => counterfactual.collapseTest(args, probePorts),
  });
}

/**
 * Internal factory used by the bridge integration test suite for injecting
 * corrupted registries to drive the boot-validator failure paths (AC-4.1/4.2/4.3).
 * Production callers should use `createDomainBridge` instead.
 *
 * @param {object} deps {engine, clock, idAllocator, consentVerification, persistenceRepo}
 * @param {{operationSpecs?: object, categoryRegistry?: object, ruleTemplates?: object}} overrides
 * @returns {Readonly<object>} frozen facade
 */
export function createDomainBridgeWith(deps, overrides = {}) {
  const specs = overrides.operationSpecs ?? OPERATION_SPECS;
  const registry = overrides.categoryRegistry ?? CATEGORY_REGISTRY;
  const templates = overrides.ruleTemplates ?? RULE_TEMPLATES;
  // Bridge construction re-runs against the override registries. Implementation mirrors
  // createDomainBridge step-for-step but reads `specs`, `registry`, `templates` instead
  // of the module-level constants.
  const { engine: rawEngine, clock, idAllocator, consentVerification, persistenceRepo } = deps;
  const engine = normalizeEngine(rawEngine);
  const readPorts = Object.freeze({ query: engine.query, explain: engine.explain, getAllRules: () => engine.rules.allRules() });
  const writePorts = Object.freeze({ facts: engine.facts, rules: engine.rules, query: engine.query, explain: engine.explain, tx: engine.tx });
  const probePorts = Object.freeze({ query: engine.query, explain: engine.explain, snapshot: engine.snapshot, facts: engine.facts, hasOpenTransaction: () => engine.tx?.hasOpenTransaction?.() ?? false });
  const fullPorts = Object.freeze({ ...writePorts, ...probePorts, clock, ids: idAllocator, consent: consentVerification, persist: persistenceRepo });

  try { validateCategoryRegistry(registry, tags); }
  catch (e) { if (e instanceof DomainBootError) throw e; throw new DomainBootError({ validator: 'createDomainBridgeWith', recordId: 'CATEGORY_REGISTRY', field: '*', violation: e.message }); }

  for (const policy of [closurePolicy, frictionPolicy]) {
    try { policy.registerStatic(writePorts.rules); }
    catch (e) { throw new DomainBootError({ validator: 'Phase A registerStatic', recordId: '?', field: '*', violation: e.message, cause: e }); }
  }

  const validPredicates = getDeclaredEDBPredicates();
  for (const p of ['closure_permitted', 'unresolved_friction', 'unaddressed_concern', 'covered', 'effective_addresses', 'ungrounded_proposition', 'effective_grounding', 'coverage_gap_detected', 'overlap_detected', 'conflict_detected', 'proposition', 'resolution', 'definition', 'concern', 'concern_status', 'phase', 'two_yes_complete']) validPredicates.add(p);

  validateOperationSpecs(specs, tags, validPredicates);
  validateRuleTemplates(templates, registry);

  // Phase B with per-template annotation so DomainBootError.recordId carries the failing
  // template id (AC-4.3 / AC-5.1).
  for (const [templateId, template] of Object.entries(templates)) {
    const placeholder = `__template_anchor__${template.elementCategory}`;
    const r = template.build(placeholder);
    try {
      writePorts.rules.defineRule(r.ruleId, r.headAtom, r.bodyAtoms, { ...r.metadata, isTemplateAnchor: true });
    } catch (e) {
      throw new DomainBootError({
        validator: 'Phase B registerRuleTemplates',
        recordId: templateId,
        field: `ruleId='${r.ruleId}'`,
        violation: e.message,
        cause: e,
      });
    }
  }

  // createDomainBridgeWith is a test-only factory used by bridge-integration.test.js to inject
  // corrupted registries through the AC-4.x throw paths. The success-path facade is identical
  // to createDomainBridge's facade — implementers MUST copy that block here verbatim, or, if
  // sharing is cleaner, refactor both factories to call a single `_buildFacade(ports, runtime)`
  // helper that returns the frozen facade object. Returning an empty frozen object is forbidden:
  // any test that reaches the success path against this factory would silently see undefined
  // methods instead of an obvious failure.
  throw new Error('createDomainBridgeWith: facade not implemented in this stub — implementer must copy from createDomainBridge or refactor to a shared _buildFacade helper before any success-path test uses this factory.');
}

/**
 * Read-only audit adapter. Exposes IRenderSurface + IQuerySurface methods (per spec AC-11.1
 * line 493). "Read-only" means externally observable state is unchanged by any call —
 * `runCounterfactual` mutates inside a snapshot/restore bracket so the engine state is
 * bit-equal before and after (AC-7.1). The adapter exposes ProbePorts to counterfactual.collapseTest
 * but no IElementMutation/IRatification/IFrictionManagement/IDefinitionManagement/IClosureSurface
 * methods are surfaced — the test asserts the 13-entry forbidden list is absent.
 * Realizes Architecture §10 "Adversary integrates cleanly" payoff.
 */
export function createReadOnlyAudit(engine) {
  const readPorts = Object.freeze({ query: engine.query, explain: engine.explain, getAllRules: () => engine.rules.allRules() });
  const probePorts = Object.freeze({ query: engine.query, explain: engine.explain, snapshot: engine.snapshot, facts: engine.facts, hasOpenTransaction: () => engine.tx?.hasOpenTransaction?.() ?? false });
  return Object.freeze({
    renderStructuredProof: (args) => render.renderStructuredProof(args, readPorts),
    renderElementDeep: (args) => render.renderElementDeep(args, readPorts),
    renderClosingArgument: (args) => render.renderClosingArgument(args, readPorts),
    renderDatalogProjection: (args) => render.renderDatalogProjection(args, readPorts),
    renderLaneSlice: (args) => render.renderLaneSlice(args, readPorts),
    getProofState: (args) => render.getProofState(args, readPorts),
    queryProof: (args) => render.queryProof(args, readPorts),
    detectFrictions: () => frictionPolicy.detectFrictions(readPorts),
    runCounterfactual: (args) => counterfactual.collapseTest(args, probePorts),
  });
}
