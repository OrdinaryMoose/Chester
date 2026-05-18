import { describe, it, expect } from 'vitest';
import { createPayloadChannel, parsePayloadChannel } from '../domain-bridge.js';
import { OPERATION_SPECS } from '../mutations.js';
import * as tags from '../tags.js';

describe('D3 — presentClosingArgument has its own argShape', () => {
  it('AC-3.1 OPERATION_SPECS[PRESENT_CLOSING_ARGUMENT] carries an inline argShape with no required fields', () => {
    const spec = OPERATION_SPECS[tags.ACTION_LABELS.PRESENT_CLOSING_ARGUMENT];
    expect(spec.argShape).toBeDefined();
    expect(spec.argShape).toMatchObject({ requiredFields: [], closedEnumFields: {} });
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
