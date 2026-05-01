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
