import { describe, it, expect, vi } from 'vitest';
import { verifyConsent, lookupAuthority } from '../authority.js';
import { ELEMENT_CATEGORIES, CONSENT_SOURCES, ACTION_LABELS } from '../tags.js';

describe('authority', () => {
  it('verifyConsent passes valid consent', () => {
    const port = { verify: vi.fn().mockReturnValue(true) };
    expect(() => verifyConsent(CONSENT_SOURCES.DESIGNER, { source: 'designer', token: 't' }, port)).not.toThrow();
  });

  it('verifyConsent throws CONSENT_INVALID on source mismatch', () => {
    const port = { verify: vi.fn().mockReturnValue(true) };
    expect(() => verifyConsent(CONSENT_SOURCES.DESIGNER, { source: 'system' }, port))
      .toThrow(/CONSENT_INVALID/);
  });

  it('verifyConsent throws CONSENT_INVALID on port rejection', () => {
    const port = { verify: vi.fn().mockReturnValue(false) };
    expect(() => verifyConsent(CONSENT_SOURCES.DESIGNER, { source: 'designer' }, port))
      .toThrow(/CONSENT_INVALID/);
  });

  it('lookupAuthority returns approved-by sources for ratify on Proposition', () => {
    const sources = lookupAuthority(ELEMENT_CATEGORIES.PROPOSITION, ACTION_LABELS.RATIFY);
    expect(sources).toContain(CONSENT_SOURCES.DESIGN_PARTNER);
  });
});
