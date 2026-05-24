import { ELEMENT_CATEGORIES, ACTION_LABELS } from './tags.js';

export function validateOpenProofPayload(payload) {
  if (!payload || !Array.isArray(payload.elements)) {
    throw Object.assign(new Error('RESTRUCTURE_INVALID: missing elements array'), { code: 'RESTRUCTURE_INVALID' });
  }
  for (const [i, el] of payload.elements.entries()) {
    if (!el.category || !Object.values(ELEMENT_CATEGORIES).includes(el.category)) {
      throw Object.assign(new Error(`RESTRUCTURE_INVALID: element[${i}] has unknown category ${el.category}`), { code: 'RESTRUCTURE_INVALID', index: i });
    }
    if (!el.args || typeof el.args !== 'object') {
      throw Object.assign(new Error(`RESTRUCTURE_INVALID: element[${i}] missing args`), { code: 'RESTRUCTURE_INVALID', index: i });
    }
  }
  return payload;
}

export function expandIntoOperations(payload) {
  return payload.elements.map(el => ({
    verb: ACTION_LABELS.ADD,
    args: { idShape: el.category, ...el.args },
  }));
}
