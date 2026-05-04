/**
 * assignActionLabel — pure function. Decides which action label applies to a
 * caller-supplied field value against the registry's expected type.
 * Returns { label, reshapedValue?, ruleCitation? }.
 *
 * Mechanical labels only: verbatim-preserve, reshape, gap-fill.
 * Anchor-disciplined labels (infer, derive) handled separately by validateAnchor.
 */
export function assignActionLabel({ callerValue, expectedType, requiredFieldName, gapFillRule, gapFillValue }) {
  if (callerValue === undefined || callerValue === null) {
    if (gapFillRule !== undefined) {
      return { label: 'gap-fill', reshapedValue: gapFillValue, ruleCitation: gapFillRule };
    }
    return { label: null };
  }

  if (expectedType === 'string' && typeof callerValue === 'string' && callerValue === callerValue.trim() && callerValue.length > 0) {
    return { label: 'verbatim-preserve' };
  }
  if (expectedType === 'array' && Array.isArray(callerValue)) {
    return { label: 'verbatim-preserve' };
  }

  if (expectedType === 'string' && typeof callerValue === 'string' && callerValue !== callerValue.trim()) {
    return { label: 'reshape', reshapedValue: callerValue.trim() };
  }

  return { label: null };
}

/**
 * isRejectedValue — decides whether a required-field value is too hollow to admit.
 * Catches empty strings, null, common placeholders, and metadata-redirect strings.
 * Returns { rejected: boolean, reason: string }.
 */
const PLACEHOLDER_VALUES = new Set(['todo', 'not specified', 'tbd', 'n/a']);
const REDIRECT_PREFIX_REGEX = /^see metadata/i;

export function isRejectedValue(value) {
  if (value === null || value === undefined) {
    return { rejected: true, reason: 'empty (null/undefined)' };
  }
  if (typeof value !== 'string') {
    return { rejected: false, reason: '' };
  }
  if (value.length === 0) {
    return { rejected: true, reason: 'empty string' };
  }
  const lowered = value.trim().toLowerCase();
  if (PLACEHOLDER_VALUES.has(lowered)) {
    return { rejected: true, reason: `placeholder ("${value}")` };
  }
  if (REDIRECT_PREFIX_REGEX.test(value)) {
    return { rejected: true, reason: `redirect to metadata channel ("${value}")` };
  }
  return { rejected: false, reason: '' };
}
