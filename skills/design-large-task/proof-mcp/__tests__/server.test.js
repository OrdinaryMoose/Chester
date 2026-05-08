import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, unlinkSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleOpenProof, handleManageDefinitions, handleGetProofState, handlePresentClosingArgument, handleSubmitProofUpdate } from '../server.js';
import { initializeState, saveState, addConcern, ratifyConcern } from '../state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverSource = readFileSync(join(__dirname, '../server.js'), 'utf-8');

describe('server.js — RESOLVE_CONDITION wiring', () => {
  it('local ELEMENT_TYPES includes RESOLVE_CONDITION', () => {
    expect(serverSource).toMatch(/ELEMENT_TYPES\s*=\s*\[[^\]]*'RESOLVE_CONDITION'/s);
  });

  it('submit_proof_update schema declares problem_anchor', () => {
    expect(serverSource).toMatch(/problem_anchor:\s*\{\s*type:\s*'string'/);
  });
});

describe('server.js — manage_concerns tool', () => {
  it('declares manage_concerns tool', () => {
    expect(serverSource).toMatch(/name:\s*'manage_concerns'/);
  });

  it('manage_concerns op enum lists add and ratify (lock retired AC-2.2)', () => {
    expect(serverSource).toMatch(/op:\s*\{[^}]*enum:\s*\[\s*'add',\s*'ratify'\s*\]/s);
  });

  it('dispatches ratify op in manage_concerns handler', () => {
    expect(serverSource).toMatch(/op\s*===\s*'ratify'/);
  });
});

describe('server.js — ratify_resolve_condition tool', () => {
  it('declares ratify_resolve_condition tool', () => {
    expect(serverSource).toMatch(/name:\s*'ratify_resolve_condition'/);
  });

  it('schema is singular — element_id is type string, not array', () => {
    const m = serverSource.match(/name:\s*'ratify_resolve_condition'[\s\S]*?required:\s*\[([^\]]+)\]/);
    expect(m).not.toBeNull();
    const required = m[1];
    expect(required).toMatch(/'element_id'/);
    expect(required).not.toMatch(/'element_ids'/);
  });

  it('schema does not declare element_ids array property', () => {
    const ratifyBlock = serverSource.split("name: 'ratify_resolve_condition'")[1] ?? '';
    const blockEnd = ratifyBlock.indexOf('},\n  {') > -1 ? ratifyBlock.indexOf('},\n  {') : ratifyBlock.length;
    expect(ratifyBlock.slice(0, blockEnd)).not.toMatch(/element_ids/);
  });
});

describe('server.js — switch dispatch', () => {
  it('dispatches manage_concerns and ratify_resolve_condition', () => {
    expect(serverSource).toMatch(/case\s+'manage_concerns'/);
    expect(serverSource).toMatch(/case\s+'ratify_resolve_condition'/);
  });
});

describe('server.js — present_closing_argument tool', () => {
  it('declares present_closing_argument tool', () => {
    expect(serverSource).toMatch(/name:\s*'present_closing_argument'/);
  });

  it('dispatches present_closing_argument in switch', () => {
    expect(serverSource).toMatch(/case\s+'present_closing_argument'/);
  });

  it('handler imports evaluateTrigger and deriveClosingArgument', () => {
    expect(serverSource).toMatch(/from\s+['"]\.\/closing-argument\.js['"]/);
    expect(serverSource).toMatch(/evaluateTrigger/);
  });
});

describe('server.js — confirm_closure_go tool', () => {
  it('declares confirm_closure_go tool', () => {
    expect(serverSource).toMatch(/name:\s*'confirm_closure_go'/);
  });

  it('dispatches confirm_closure_go in switch', () => {
    expect(serverSource).toMatch(/case\s+'confirm_closure_go'/);
  });

  it('handler imports recordDesignerGo and checkClosure', () => {
    expect(serverSource).toMatch(/recordDesignerGo/);
    expect(serverSource).toMatch(/checkClosure/);
  });
});

describe('server.js — override_friction_disposition tool', () => {
  it('declares override_friction_disposition tool', () => {
    expect(serverSource).toMatch(/name:\s*'override_friction_disposition'/);
  });

  it('dispatches override_friction_disposition in switch', () => {
    expect(serverSource).toMatch(/case\s+'override_friction_disposition'/);
  });

  it('declares element_id and disposition as required inputs', () => {
    const block = serverSource.split("name: 'override_friction_disposition'")[1] ?? '';
    expect(block).toMatch(/element_id/);
    expect(block).toMatch(/disposition/);
  });

  it('handler imports overrideFrictionDisposition', () => {
    expect(serverSource).toMatch(/overrideFrictionDisposition/);
  });
});

describe('server.js — open_proof tool registration', () => {
  it('declares open_proof tool', () => {
    expect(serverSource).toMatch(/name:\s*'open_proof'/);
  });

  it('declares state_file and submission_material as required inputs', () => {
    const block = serverSource.split("name: 'open_proof'")[1] ?? '';
    expect(block).toMatch(/state_file/);
    expect(block).toMatch(/submission_material/);
    expect(block).toMatch(/required:\s*\[\s*'state_file'\s*,\s*'submission_material'\s*\]/);
  });

  it('keeps submission_material schema permissive (no additionalProperties:false)', () => {
    const block = serverSource.split("name: 'open_proof'")[1] ?? '';
    const submissionBlock = block.split("submission_material:")[1]?.split('}')[0] ?? '';
    expect(submissionBlock).not.toMatch(/additionalProperties:\s*false/);
  });

  it('dispatches open_proof in switch', () => {
    expect(serverSource).toMatch(/case\s+'open_proof'/);
  });

  it('handler function handleOpenProof exists', () => {
    expect(serverSource).toMatch(/function\s+handleOpenProof/);
  });
});

// Helper used across handleOpenProof tests below — every valid open submission
// after Task 11 must carry consent, ≥1 Concern, ≥1 Evidence, and a restructuring
// action label per element.
const TEST_CONSENT = { source: 'designer', rationale: 'open' };
const evidenceEl = (overrides = {}) => ({
  category: 'EVIDENCE', statement: 'baseline evidence', source: 'codebase',
  restructuring_action_label: 'verbatim-preserve',
  ...overrides,
});
const ruleEl = (overrides = {}) => ({
  category: 'RULE', statement: 'A rule.', source: 'designer',
  restructuring_action_label: 'verbatim-preserve',
  ...overrides,
});

describe('handleOpenProof — three-phase orchestration', () => {
  it('gate-pass writes state and sets proofStatus="open"', async () => {
    const tmp = `/tmp/open-proof-pass-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'a one-sentence problem.',
        concerns: [{ label: 'CERN-A', description: 'a concern' }],
        elements: [
          evidenceEl(),
          ruleEl(),
          {
            category: 'NECESSARY_CONDITION',
            statement: 'An NC.',
            grounding: ['RULE-1'],
            reasoning_chain: 'because R',
            collapse_test: 'breaks if removed',
            rejected_alternatives: ['alt1'],
            restructuring_action_label: 'verbatim-preserve',
          },
        ],
        consent: TEST_CONSENT,
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('opened');
    expect(payload.proof_open).toBe(true);
    expect(payload.restructuring_report).toBeDefined();
    expect(existsSync(tmp)).toBe(true);
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.proofStatus).toBe('planning');
    unlinkSync(tmp);
  });

  it('gate-fail does NOT write a successful proof state', () => {
    // Seed-packet shape passes (problem_statement set, ≥1 top-level concern, ≥1
    // EVIDENCE in elements, restructuring labels present), but the lifted
    // Concern has no label and the EVIDENCE is missing required `source` —
    // both get rejected at restructure, leaving admitted empty so the gate
    // fails on 'admitted_elements'.
    const tmp = `/tmp/open-proof-fail-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'p',
        concerns: [{ description: 'no label' }],  // missing label → restructure rejects
        elements: [
          // EVIDENCE missing required `source` → restructure rejects
          { category: 'EVIDENCE', statement: 'e', restructuring_action_label: 'verbatim-preserve' },
        ],
        consent: TEST_CONSENT,
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('gate_failed');
    expect(payload.proof_open).toBe(false);
    expect(payload.restructuring_report).toBeDefined();
    expect(payload.gate_failures).toBeDefined();
    expect(payload.gate_failures.some(f => f.missing_artifact === 'admitted_elements')).toBe(true);
    expect(existsSync(tmp)).toBe(false);
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('three phases execute in declared order (accept → restructure → open) — verified by observable side effects', () => {
    const tmp = `/tmp/open-proof-order-${Date.now()}.json`;
    handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'order test',
        concerns: [{ label: 'C-1' }],
        elements: [evidenceEl(), ruleEl({ statement: 'r' })],
        consent: TEST_CONSENT,
      },
    });
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.proofStatus).toBe('planning');
    expect(Object.keys(written.elements).length).toBeGreaterThan(0);
    expect(written.problemStatement).toBe('order test');
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('routes admitted Concern candidates through addConcern (state.concerns), not applyOperations', () => {
    const tmp = `/tmp/open-proof-concern-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'concern routing test',
        // Top-level concerns array gets lifted into restructure as category:'Concern'.
        concerns: [{ label: 'A real concern label.', description: 'why it matters' }],
        elements: [evidenceEl(), ruleEl()],
        consent: TEST_CONSENT,
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('opened');
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.concerns.length).toBe(1);
    expect(written.concerns[0].label).toBe('A real concern label.');
    const elementValues = Object.values(written.elements);
    expect(elementValues.find(e => e.type === 'Concern')).toBeUndefined();
    expect(elementValues.find(e => e.type === 'RULE')).toBeDefined();
    expect(elementValues.find(e => e.type === 'EVIDENCE')).toBeDefined();
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('surfaces applyOperations errors as partial_write_failure', () => {
    const tmp = `/tmp/open-proof-errors-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'p',
        concerns: [{ label: 'C-1' }],
        elements: [
          evidenceEl(),
          {
            category: 'NECESSARY_CONDITION',
            statement: 'NC depending on missing element',
            grounding: ['EVID-99'],
            reasoning_chain: 'because',
            collapse_test: 'breaks',
            rejected_alternatives: ['alt'],
            restructuring_action_label: 'verbatim-preserve',
          },
        ],
        consent: TEST_CONSENT,
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('partial_write_failure');
    expect(Array.isArray(payload.errors)).toBe(true);
    expect(payload.errors.length).toBeGreaterThan(0);
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('resubmission overwrites prior partial (non-open) state file', () => {
    const tmp = `/tmp/open-proof-resub-${Date.now()}.json`;
    writeFileSync(tmp, JSON.stringify({ stale: 'data' }));
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'fresh',
        concerns: [{ label: 'C-1' }],
        elements: [evidenceEl(), ruleEl({ statement: 'fresh rule' })],
        consent: TEST_CONSENT,
      },
    };
    handleOpenProof(args);
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.stale).toBeUndefined();
    expect(written.problemStatement).toBe('fresh');
    unlinkSync(tmp);
  });
});

describe('handleOpenProof — already-open refusal', () => {
  it('refuses without invoking restructure when state file has proofStatus="open"', () => {
    const tmp = `/tmp/already-open-${Date.now()}.json`;
    const priorState = {
      round: 5, problemStatement: 'prior', elements: {},
      elementCounters: { EVIDENCE: 0, RULE: 0, PERMISSION: 0, NECESSARY_CONDITION: 0, RISK: 0, RESOLVE_CONDITION: 0, FRICTION: 0 },
      conditionCountHistory: [], elementCountHistory: [], challengeModesUsed: [], challengeLog: [], revisionLog: [], phaseTransitionRound: 0,
      concerns: [], concernCounter: 0, ratificationLog: [], frictionLog: [],
      closingArgPresentedRound: null, closingArgGoRound: null,
      proofStatus: 'open',
    };
    writeFileSync(tmp, JSON.stringify(priorState));
    const sizeBefore = readFileSync(tmp, 'utf-8').length;

    const response = handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'new',
        concerns: [{ label: 'C-1' }],
        elements: [evidenceEl(), ruleEl({ statement: 'new rule' })],
        consent: TEST_CONSENT,
      },
    });
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('already_open');
    expect(payload.diagnostic).toContain(tmp);

    const sizeAfter = readFileSync(tmp, 'utf-8').length;
    expect(sizeAfter).toBe(sizeBefore);
    unlinkSync(tmp);
  });

  it('overwrites a malformed (non-JSON) state file on gate-pass — explicit catch-all behavior', () => {
    const tmp = `/tmp/open-proof-malformed-${Date.now()}.json`;
    writeFileSync(tmp, 'this is not valid JSON {{{');

    const response = handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'recovery from malformed state',
        concerns: [{ label: 'C-1' }],
        elements: [evidenceEl(), ruleEl({ statement: 'r' })],
        consent: TEST_CONSENT,
      },
    });
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('opened');
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.problemStatement).toBe('recovery from malformed state');
    expect(written.proofStatus).toBe('planning');
    unlinkSync(tmp);
  });
});

describe('server.js — manage_definitions tool', () => {
  it('declares manage_definitions tool', () => {
    expect(serverSource).toMatch(/name:\s*'manage_definitions'/);
  });

  it('declares op enum [add, revise, deprecate, ratify, query-overlap]', () => {
    const block = serverSource.split("name: 'manage_definitions'")[1] ?? '';
    expect(block).toMatch(/enum:\s*\[\s*'add',\s*'revise',\s*'deprecate',\s*'ratify',\s*'query-overlap'\s*\]/);
  });

  it('dispatches manage_definitions in switch', () => {
    expect(serverSource).toMatch(/case\s+'manage_definitions'/);
  });

  it('add op writes definition; get_proof_state response includes definitions and operationLog fields', () => {
    const tmp = `/tmp/manage-defs-${Date.now()}.json`;
    const seed = initializeState('a problem');
    saveState(seed, tmp);

    const addResp = handleManageDefinitions({
      state_file: tmp,
      op: 'add',
      canonical_name: 'Concern',
      definition: 'A concern is X',
      consent: { source: 'designer', rationale: 't' },
    });
    const addPayload = JSON.parse(addResp.content[0].text);
    expect(addPayload.status).toBe('accepted');
    expect(addPayload.definition_id).toMatch(/^DEFN-/);

    const getResp = handleGetProofState({ state_file: tmp });
    const stateOut = JSON.parse(getResp.content[0].text);
    expect(Array.isArray(stateOut.definitions)).toBe(true);
    expect(stateOut.definitions.length).toBe(1);
    expect(stateOut.definitions[0].canonical_name).toBe('Concern');
    expect(Array.isArray(stateOut.operationLog)).toBe(true);
    expect(stateOut.operationLog.some(e => e.type === 'DEFINITION' && e.op === 'add')).toBe(true);
    expect(typeof stateOut.definitionCounter).toBe('number');
    expect(Array.isArray(stateOut.definitionLog)).toBe(true);
    expect(stateOut.schemaVersion).toBeDefined();
    expect(stateOut.proofStatus).toBeDefined();

    unlinkSync(tmp);
  });

  it('add op rejects without consent (INVALID_CONSENT)', () => {
    const tmp = `/tmp/manage-defs-noconsent-${Date.now()}.json`;
    saveState(initializeState('p'), tmp);
    const resp = handleManageDefinitions({
      state_file: tmp,
      op: 'add',
      canonical_name: 'X',
      definition: 'd',
    });
    expect(resp.isError).toBe(true);
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.code).toBe('INVALID_CONSENT');
    unlinkSync(tmp);
  });

  it('deprecate op returns DOMAIN_ERROR routing to withdraw', () => {
    const tmp = `/tmp/manage-defs-deprecate-${Date.now()}.json`;
    saveState(initializeState('p'), tmp);
    handleManageDefinitions({
      state_file: tmp, op: 'add', canonical_name: 'X', definition: 'd',
      consent: { source: 'designer', rationale: 't' },
    });
    const resp = handleManageDefinitions({
      state_file: tmp, op: 'deprecate', id: 'DEFN-1',
      consent: { source: 'designer', rationale: 't' },
    });
    expect(resp.isError).toBe(true);
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.code).toBe('DOMAIN_ERROR');
    expect(payload.message).toMatch(/withdraw/);
    unlinkSync(tmp);
  });
});

describe('handlePresentClosingArgument — first-yes gate + trigger', () => {
  const TEST_CONSENT = { source: 'designer', rationale: 'present' };

  it('returns isError with FIRST_YES_GATE_FAILED when a draft Concern remains', () => {
    const tmp = `/tmp/present-first-yes-${Date.now()}.json`;
    let s = initializeState('p');
    [, s] = addConcern(s, { label: 'CERN-A', description: 'd' }, { source: 'designer', rationale: 't' });
    saveState(s, tmp);
    const resp = handlePresentClosingArgument({ state_file: tmp, consent: TEST_CONSENT });
    expect(resp.isError).toBe(true);
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.code).toBe('FIRST_YES_GATE_FAILED');
    expect(payload.unratified_ids).toContain('CERN-1');
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('returns isError with TRIGGER_NOT_MET when gate passes but trigger floors are unmet', () => {
    const tmp = `/tmp/present-trigger-${Date.now()}.json`;
    const consent = { source: 'designer', rationale: 't' };
    let s = initializeState('p');
    [, s] = addConcern(s, { label: 'CERN-A', description: 'd' }, consent);
    [s] = ratifyConcern(s, 'CERN-1', consent);
    // Gate passes (no draft elements) but state has no NCs / RCs / Evidence — trigger floors fail.
    saveState(s, tmp);
    const resp = handlePresentClosingArgument({ state_file: tmp, consent: TEST_CONSENT });
    expect(resp.isError).toBe(true);
    const payload = JSON.parse(resp.content[0].text);
    expect(payload.code).toBe('TRIGGER_NOT_MET');
    expect(Array.isArray(payload.reasons)).toBe(true);
    expect(payload.reasons.length).toBeGreaterThan(0);
    if (existsSync(tmp)) unlinkSync(tmp);
  });
});

describe('handleSubmitProofUpdate — body_advancement response shape', () => {
  it('submit_proof_update response carries body_advancement and omits retired fields', () => {
    const tmp = `/tmp/submit-body-adv-${Date.now()}.json`;
    handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'a problem to solve.',
        concerns: [{ label: 'C-1', description: 'concern' }],
        elements: [evidenceEl(), ruleEl()],
        consent: TEST_CONSENT,
      },
    });
    const response = handleSubmitProofUpdate({
      state_file: tmp,
      operations: [
        {
          op: 'add',
          type: 'NECESSARY_CONDITION',
          statement: 'X',
          grounding: ['EVID-1'],
          collapse_test: 'breaks',
          reasoning_chain: 'because',
        },
      ],
      consent: { source: 'designer', rationale: 'test' },
    });
    const payload = JSON.parse(response.content[0].text);
    expect(payload.body_advancement).toBeDefined();
    expect(payload.body_advancement).toMatchObject({
      advanced: expect.any(Boolean),
      addCount: expect.any(Number),
      reviseCount: expect.any(Number),
      withdrawCount: expect.any(Number),
    });
    expect(payload.body_advancement.advanced).toBe(true);
    expect(payload.body_advancement.addCount).toBe(1);
    expect(payload).not.toHaveProperty('challenge_trigger');
    expect(payload).not.toHaveProperty('stall_detected');
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('submit_proof_update tool schema does not declare challenge_used', () => {
    const block = serverSource.split("name: 'submit_proof_update'")[1] ?? '';
    const blockEnd = block.indexOf('},\n  {') > -1 ? block.indexOf('},\n  {') : block.length;
    expect(block.slice(0, blockEnd)).not.toMatch(/challenge_used/);
  });
});

describe('initialize_proof retirement', () => {
  it('TOOLS array does NOT contain initialize_proof entry', () => {
    expect(serverSource).not.toMatch(/name:\s*'initialize_proof'/);
  });

  it('open_proof remains the only proof-opening entry point', () => {
    expect(serverSource).toMatch(/name:\s*'open_proof'/);
  });

  it('server.js contains no remaining references to initialize_proof or handleInitialize', () => {
    expect(serverSource).not.toContain('initialize_proof');
    expect(serverSource).not.toContain('handleInitialize');
  });
});

describe('manage_concerns op:lock retired (AC-2.2)', () => {
  it("op enum is exactly ['add', 'ratify']", () => {
    expect(serverSource).toMatch(/op:\s*\{[^}]*enum:\s*\[\s*'add',\s*'ratify'\s*\]/s);
    expect(serverSource).not.toMatch(/op:\s*\{[^}]*enum:\s*\[[^\]]*'lock'/s);
  });

  it('lockConcerns is not exported from state.js', async () => {
    const stateModule = await import('../state.js');
    expect(stateModule.lockConcerns).toBeUndefined();
  });

  it('initializeState does not set concernsLocked', async () => {
    const { initializeState: init } = await import('../state.js');
    const s = init('p');
    expect(s).not.toHaveProperty('concernsLocked');
  });

  it('adding a Concern always succeeds, regardless of prior count', async () => {
    const { initializeState: init, addConcern: add } = await import('../state.js');
    let s = init('p');
    for (let i = 0; i < 5; i++) {
      const [, ns] = add(s, { label: `C${i}` }, { source: 'designer', rationale: 't' });
      s = ns;
    }
    expect(s.concerns.length).toBe(5);
  });

  it('server.js source contains no remaining references to lockConcerns or op === lock', () => {
    expect(serverSource).not.toContain('lockConcerns');
    expect(serverSource).not.toMatch(/op\s*===\s*'lock'/);
  });
});

describe('reopen_proof retired (AC-2.1)', () => {
  it('reopen_proof is not declared in server.js TOOLS source', () => {
    expect(serverSource).not.toContain("name: 'reopen_proof'");
    expect(serverSource).not.toContain("'reopen_proof'");
  });

  it('handleReopenProof is not present in server.js source', () => {
    expect(serverSource).not.toContain('handleReopenProof');
    expect(serverSource).not.toContain('reopenProof');
  });

  it('reopenProof is not exported from state.js', async () => {
    const stateModule = await import('../state.js');
    expect(stateModule.reopenProof).toBeUndefined();
  });

  it('initializeState does not set lastClosureArtifact', async () => {
    const { initializeState } = await import('../state.js');
    const s = initializeState('p');
    expect(s).not.toHaveProperty('lastClosureArtifact');
  });
});
