import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
