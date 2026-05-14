/**
 * RuleAtomTranslator — single source of truth for tuple ↔ internal-object atom
 * translation. Used at the engine class boundary (Engine.js) and at the serializer
 * boundary (Serializer.js). Internal modules (RuleStore, Unifier, Stratifier, etc.)
 * continue to consume internal-object form unchanged.
 *
 * Public tuple form (per 04-engine-spec.md §6.2):
 *   atom = [predicate: string, args: Array<string | number>]
 *   negated body atom = ['not', atom]
 *   variable = bare uppercase string ('X', 'NAME')
 *   wildcard = literal '_' string
 *
 * Internal object form (per RuleStore.js):
 *   atom = { predicate, arity, args: Array<constant | {var} | '_'>, negated? }
 *   head atom omits `negated` (heads cannot be negated)
 */

function malformed(field, message) {
  return Object.assign(new Error(`MALFORMED_RULE: ${message}`), {
    code: 'MALFORMED_RULE',
    stage: 'translator',
    field,
    message,
  });
}

const isUppercaseVar = (s) => typeof s === 'string' && /^[A-Z][A-Z0-9_]*$/.test(s);

function translateArg(a) {
  if (a === null || a === undefined) throw malformed('args', 'null or undefined arg value');
  if (a === '_') return '_';
  if (isUppercaseVar(a)) return { var: a };
  return a;
}

function translateAtomShape(atom) {
  // atom must be [predicate: string, args: array]
  if (!Array.isArray(atom)) throw malformed('atom', 'atom must be an array');
  if (atom.length !== 2) throw malformed('atom', 'atom must be [predicate, args]');
  const [predicate, args] = atom;
  if (typeof predicate !== 'string') throw malformed('atom.predicate', 'predicate must be a string');
  if (!Array.isArray(args)) throw malformed('atom.args', 'args must be an array');
  return { predicate, arity: args.length, args: args.map(translateArg) };
}

export function tupleAtomToInternal(atom) {
  if (Array.isArray(atom) && atom[0] === 'not') {
    if (atom.length !== 2) throw malformed('atom', '["not", ...] must have exactly one inner atom');
    const inner = atom[1];
    if (Array.isArray(inner) && inner[0] === 'not') {
      throw malformed('atom', 'double negation ["not", ["not", ...]] is not supported');
    }
    const translated = translateAtomShape(inner);
    return { ...translated, negated: true };
  }
  const translated = translateAtomShape(atom);
  return { ...translated, negated: false };
}

export function tupleRuleToInternal(ruleId, headAtom, bodyAtoms, metadata) {
  if (typeof ruleId !== 'string') throw malformed('ruleId', 'ruleId must be a string');
  if (Array.isArray(headAtom) && headAtom[0] === 'not') {
    throw malformed('head', 'head atom cannot be ["not", ...]; heads are always positive');
  }
  const headInternal = translateAtomShape(headAtom);
  if (!Array.isArray(bodyAtoms)) throw malformed('bodyAtoms', 'bodyAtoms must be an array');
  const bodyInternal = bodyAtoms.map(tupleAtomToInternal);
  return {
    ruleId,
    head: headInternal, // no negated field on head
    body: bodyInternal,
    metadata: metadata ?? {},
  };
}

function untranslateArg(a) {
  if (a && typeof a === 'object' && typeof a.var === 'string') return a.var;
  return a;
}

function untranslateAtom(atom) {
  return [atom.predicate, atom.args.map(untranslateArg)];
}

export function internalRuleToTuple(rule) {
  return {
    ruleId: rule.ruleId,
    headAtom: untranslateAtom(rule.head),
    bodyAtoms: rule.body.map((b) => {
      const tuple = untranslateAtom(b);
      return b.negated ? ['not', tuple] : tuple;
    }),
    metadata: rule.metadata ?? {},
  };
}
