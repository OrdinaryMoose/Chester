import { CONSENT_SOURCES, ACTION_LABELS, assertExhaustive } from './tags.js';
import { CATEGORY_REGISTRY } from './schema.js';

/**
 * @param {string} consentCategory — value from tags.CONSENT_SOURCES
 * @param {{source: string, token?: string}} consent — caller-supplied consent
 * @param {{verify: (consent: any) => boolean}} consentPort — IConsentVerification
 */
export function verifyConsent(consentCategory, consent, consentPort) {
  if (!consent || typeof consent !== 'object') {
    throw Object.assign(new Error('CONSENT_INVALID: missing consent'), { code: 'CONSENT_INVALID' });
  }
  if (consent.source !== consentCategory) {
    throw Object.assign(new Error(`CONSENT_INVALID: source ${consent.source} does not match required ${consentCategory}`), { code: 'CONSENT_INVALID' });
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
