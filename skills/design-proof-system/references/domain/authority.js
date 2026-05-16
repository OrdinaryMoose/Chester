import { CONSENT_SOURCES, ACTION_LABELS, assertExhaustive } from './tags.js';
import { CATEGORY_REGISTRY } from './schema.js';

/**
 * @param {string|string[]} allowedSources — single CONSENT_SOURCES value or a list of them
 * @param {{source: string, token?: string}} consent — caller-supplied consent
 * @param {{verify: (consent: any) => boolean}} consentPort — IConsentVerification
 */
export function verifyConsent(allowedSources, consent, consentPort) {
  const allowed = Array.isArray(allowedSources) ? allowedSources : [allowedSources];
  if (!consent || typeof consent !== 'object') {
    throw Object.assign(new Error('CONSENT_INVALID: missing consent'), { code: 'CONSENT_INVALID' });
  }
  if (!allowed.includes(consent.source)) {
    const expected = allowed.length === 1 ? allowed[0] : `one of [${allowed.join(', ')}]`;
    throw Object.assign(new Error(`CONSENT_INVALID: source ${consent.source} does not match required ${expected}`), { code: 'CONSENT_INVALID' });
  }
  if (!consentPort.verify(consent)) {
    throw Object.assign(new Error('CONSENT_INVALID: port rejected'), { code: 'CONSENT_INVALID' });
  }
  return true;
}

const ACTION_TO_AUTHORITY_KEY = Object.freeze({
  [ACTION_LABELS.ADD]: 'add',
  [ACTION_LABELS.REVISE]: 'revise',
  [ACTION_LABELS.WITHDRAW]: 'withdraw',
  [ACTION_LABELS.RATIFY]: 'ratify',
});

export function lookupAuthority(idShape, action) {
  const desc = CATEGORY_REGISTRY[idShape];
  if (!desc) throw new Error(`AUTHORITY_LOOKUP: unknown idShape ${idShape}`);
  const key = ACTION_TO_AUTHORITY_KEY[action] ?? action;
  return desc.authority[key] ?? [];
}
