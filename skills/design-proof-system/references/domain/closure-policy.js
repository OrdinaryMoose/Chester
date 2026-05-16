// Closure-policy module. Registers static rules that derive whether closure is permitted.
// Cascade: 05-domain-spec.md §7.

/** @param {{defineRule: any, undefineRule: any, getRule: any}} rulePorts */
export function registerStatic(rulePorts) {
  // Phase transitions, derived from the closure-state facts that PRESENT_CLOSING_ARGUMENT
  // and CONFIRM_CLOSURE_GO already write. Three rules cover the reachable phases:
  //   ESTABLISHMENT → PRESENTATION → CONFIRMATION
  // The fourth PHASES value (LANE_RESOLUTION) has no clear EDB hook today — it would map
  // to "frictions exist but closure not yet attempted," which is detectable but not
  // currently the system's distinguishing transition point. Deferred until the lifecycle
  // gains an explicit lane-tracking signal.
  rulePorts.defineRule(
    'phase_establishment_rule',
    ['phase', ['establishment']],
    [['not', ['closure_pending', []]], ['not', ['closure_committed', []]]],
    { domain_concept: 'phase', module: 'closure-policy' },
  );
  rulePorts.defineRule(
    'phase_presentation_rule',
    ['phase', ['presentation']],
    [['closure_pending', []], ['not', ['closure_committed', []]]],
    { domain_concept: 'phase', module: 'closure-policy' },
  );
  rulePorts.defineRule(
    'phase_confirmation_rule',
    ['phase', ['confirmation']],
    [['closure_committed', []]],
    { domain_concept: 'phase', module: 'closure-policy' },
  );

  // two_yes_complete(I) fires when the same element has been ratified by both DESIGNER
  // and DESIGN_PARTNER sources. Concrete observability for the multi-source-ratification
  // pattern that PROPOSITION/RESOLUTION/DEFINITION/CONCERN's authority.ratify allowlists
  // anticipate. Doesn't change derivation behavior — the existing per-element rule
  // templates still fire on a single approved() fact regardless of source.
  rulePorts.defineRule(
    'two_yes_complete_rule',
    ['two_yes_complete', ['I']],
    [['two_yes', ['I', 'designer']], ['two_yes', ['I', 'design_partner']]],
    { domain_concept: 'two_yes_complete', module: 'closure-policy' },
  );

  // effective_addresses(R, C) holds when R addresses C AND R is not withdrawn.
  // Shared infrastructure for closure-policy (covered_rule) and friction-policy
  // (coverage_gap_rule). Mirrors the effective_grounding pattern from friction-policy:
  // negation operates on a derived intermediate so withdrawal can be threaded through.
  // Stratum 1 (depends on addresses + neg withdrew, both EDB).
  rulePorts.defineRule(
    'effective_addresses_rule',
    ['effective_addresses', ['R', 'C']],
    [['addresses', ['R', 'C']], ['not', ['withdrew', ['R']]]],
    { domain_concept: 'effective_addresses', module: 'closure-policy' },
  );

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
  // A friction is unresolved iff its element fact still says 'unset' AND no
  // friction_disposition satellite has been written for it AND it is not withdrawn.
  // Adding `not withdrew(F)` is part of the closure-policy withdrawal-awareness fix:
  // withdrawing a friction should clear it from the closure check, but withdrawal
  // doesn't retract the friction EDB fact, so the rule must filter explicitly.
  rulePorts.defineRule(
    'unresolved_friction_rule',
    ['unresolved_friction', ['F']],
    [
      ['friction', ['F', '_', '_', 'unset']],
      ['not', ['friction_disposition', ['F', '_']]],
      ['not', ['withdrew', ['F']]],
    ],
    { domain_concept: 'unresolved_friction', module: 'closure-policy' },
  );
  // A ratified concern is unaddressed iff it isn't covered AND it isn't withdrawn.
  // Withdrawal-awareness: a withdrawn concern needs no coverage.
  rulePorts.defineRule(
    'unaddressed_concern_rule',
    ['unaddressed_concern', ['C']],
    [['concern_status', ['C', 'ratified']], ['not', ['covered', ['C']]], ['not', ['withdrew', ['C']]]],
    { domain_concept: 'unaddressed_concern', module: 'closure-policy' },
  );
  // covered now uses effective_addresses (which excludes withdrawn resolutions) so
  // withdrawing the only addressing resolution correctly reopens the concern as
  // unaddressed. The approved(R, _, _) check is preserved — coverage requires both
  // a live addressing fact AND ratification.
  rulePorts.defineRule(
    'covered_rule',
    ['covered', ['C']],
    [
      ['concern_status', ['C', 'ratified']],
      ['effective_addresses', ['R', 'C']],
      ['approved', ['R', '_', '_']],
    ],
    { domain_concept: 'covered', module: 'closure-policy' },
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
