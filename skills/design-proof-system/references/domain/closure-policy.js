// Closure-policy module. Registers static rules that derive whether closure is permitted.
// Cascade: 05-domain-spec.md §7.

/** @param {{defineRule: any, undefineRule: any, getRule: any}} rulePorts */
export function registerStatic(rulePorts) {
  // closure_permitted derives when all concerns are addressed AND no unresolved friction exists.
  // The body uses negation-as-failure on unresolved_friction and unaddressed_concern.
  rulePorts.defineRule(
    'closure_permitted_rule',
    ['closure_permitted', []],
    [
      ['not', ['unresolved_friction', ['_']]],
      ['not', ['unaddressed_concern', ['_']]],
    ],
    { domain_concept: 'closure_permitted', module: 'closure-policy' },
  );
  rulePorts.defineRule(
    'unresolved_friction_rule',
    ['unresolved_friction', ['F']],
    [['friction', ['F', '_', '_', 'unset']]],
    { domain_concept: 'unresolved_friction', module: 'closure-policy' },
  );
  rulePorts.defineRule(
    'unaddressed_concern_rule',
    ['unaddressed_concern', ['C']],
    [['risk', ['C', '_', '_']], ['not', ['addresses', ['_', 'C']]]],
    { domain_concept: 'unaddressed_concern', module: 'closure-policy' },
  );
  // Diagnostic rules — derive closure_failure_reason(Id) so triggerGate can list the
  // offending elements when the gate fails. Plan Background §7 names this predicate as
  // part of registerStatic's responsibility. One rule per blocking condition; reasons are
  // emitted as element ids (friction id or concern id), not free-text strings.
  rulePorts.defineRule(
    'closure_failure_reason_from_unresolved_friction_rule',
    ['closure_failure_reason', ['F']],
    [['unresolved_friction', ['F']]],
    { domain_concept: 'closure_failure_reason', source: 'unresolved_friction', module: 'closure-policy' },
  );
  rulePorts.defineRule(
    'closure_failure_reason_from_unaddressed_concern_rule',
    ['closure_failure_reason', ['C']],
    [['unaddressed_concern', ['C']]],
    { domain_concept: 'closure_failure_reason', source: 'unaddressed_concern', module: 'closure-policy' },
  );
}

/**
 * customPostCheck body for presentClosingArgument / confirmClosureGo.
 * @param {object} args
 * @param {{query: any, explain: any}} readPorts
 * @returns {{code: string, message: string}|null}
 */
export function triggerGate(args, readPorts) {
  if (!readPorts.query.exists(['closure_permitted', []])) {
    const reasons = readPorts.query.query(['closure_failure_reason', [{ var: 'R' }]]).map(b => b.R);
    return { code: 'CLOSURE_NOT_PERMITTED', message: `Closure failed: ${reasons.join(', ') || 'no reason recorded'}` };
  }
  return null;
}
