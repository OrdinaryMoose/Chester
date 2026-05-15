/**
 * Unifier — pattern matching for query patterns and rule body atoms.
 *
 * Wire format:
 *   - Constant: any string/number/boolean/null
 *   - Variable: { var: 'X' } — produced by V('X')
 *   - Wildcard: the literal string '_' — also exported as WILDCARD constant
 *
 * Spec §"Pattern wire format" reserves bare '_' as wildcard; a Domain caller
 * needing the literal string '_' as a constant must escape (out of scope here).
 */

export const WILDCARD = '_';
export const V = (name) => ({ var: name });

const isVariable = (t) => t && typeof t === 'object' && typeof t.var === 'string';
const isWildcard = (t) => t === WILDCARD;

/**
 * unify(pattern, factArgs) → bindings object or null
 *   pattern: Array<term>  (term: constant | { var: name } | '_')
 *   factArgs: Array<constant>
 */
export function unify(pattern, factArgs) {
  if (pattern.length !== factArgs.length) return null;
  const bindings = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    const a = factArgs[i];
    if (isWildcard(p)) continue;
    if (isVariable(p)) {
      const name = p.var;
      if (Object.prototype.hasOwnProperty.call(bindings, name)) {
        if (bindings[name] !== a) return null;
      } else {
        bindings[name] = a;
      }
    } else {
      // constant
      if (p !== a) return null;
    }
  }
  return bindings;
}
