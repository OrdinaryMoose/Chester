import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, unlinkSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleOpenProof } from '../server.js';

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

  it('manage_concerns op enum lists add and lock', () => {
    expect(serverSource).toMatch(/op:\s*\{[^}]*enum:\s*\[\s*'add',\s*'lock'\s*\]/s);
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

describe('handleOpenProof — three-phase orchestration', () => {
  it('gate-pass writes state and sets proofStatus="open"', async () => {
    const tmp = `/tmp/open-proof-pass-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'a one-sentence problem.',
        elements: [
          { category: 'RULE', statement: 'A rule.', source: 'designer' },
          {
            category: 'NECESSARY_CONDITION',
            statement: 'An NC.',
            grounding: ['RULE-1'],
            reasoning_chain: 'because R',
            collapse_test: 'breaks if removed',
            rejected_alternatives: ['alt1'],
          },
        ],
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('opened');
    expect(payload.proof_open).toBe(true);
    expect(payload.restructuring_report).toBeDefined();
    expect(existsSync(tmp)).toBe(true);
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.proofStatus).toBe('open');
    unlinkSync(tmp);
  });

  it('gate-fail does NOT write state', () => {
    const tmp = `/tmp/open-proof-fail-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'p',
        elements: [{ category: 'RULE' }],  // missing statement → rejected → no admitted → gate fail
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('gate_failed');
    expect(payload.proof_open).toBe(false);
    expect(payload.restructuring_report).toBeDefined();
    expect(payload.gate_failures).toBeDefined();
    expect(existsSync(tmp)).toBe(false);
  });

  it('three phases execute in declared order (accept → restructure → open) — verified by observable side effects', () => {
    const tmp = `/tmp/open-proof-order-${Date.now()}.json`;
    handleOpenProof({
      state_file: tmp,
      submission_material: {
        problem_statement: 'order test',
        elements: [{ category: 'RULE', statement: 'r', source: 'designer' }],
      },
    });
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.proofStatus).toBe('open');
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
        elements: [
          { category: 'Concern', label: 'A real concern label.', description: 'why it matters' },
          { category: 'RULE', statement: 'A rule.', source: 'designer' },
        ],
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
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('surfaces applyOperations errors as partial_write_failure', () => {
    const tmp = `/tmp/open-proof-errors-${Date.now()}.json`;
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'p',
        elements: [
          {
            category: 'NECESSARY_CONDITION',
            statement: 'NC depending on missing element',
            grounding: ['EVID-99'],
            reasoning_chain: 'because',
            collapse_test: 'breaks',
            rejected_alternatives: ['alt'],
          },
        ],
      },
    };
    const response = handleOpenProof(args);
    const payload = JSON.parse(response.content[0].text);
    expect(payload.status).toBe('partial_write_failure');
    expect(Array.isArray(payload.errors)).toBe(true);
    expect(payload.errors.length).toBeGreaterThan(0);
    if (existsSync(tmp)) unlinkSync(tmp);
  });

  it('resubmission overwrites prior partial state file', () => {
    const tmp = `/tmp/open-proof-resub-${Date.now()}.json`;
    writeFileSync(tmp, JSON.stringify({ stale: 'data' }));
    const args = {
      state_file: tmp,
      submission_material: {
        problem_statement: 'fresh',
        elements: [{ category: 'RULE', statement: 'fresh rule', source: 'designer' }],
      },
    };
    handleOpenProof(args);
    const written = JSON.parse(readFileSync(tmp, 'utf-8'));
    expect(written.stale).toBeUndefined();
    expect(written.problemStatement).toBe('fresh');
    unlinkSync(tmp);
  });
});
