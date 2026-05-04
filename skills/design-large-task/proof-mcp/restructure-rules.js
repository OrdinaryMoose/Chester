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
