// render.js — read-only render and query functions. Takes ReadPorts only.
// Cascade: 05-domain-spec.md §10. Architecture §10 payoffs ("Independent verification path"
// is realized by renderDatalogProjection).

// Withdrawal filter: returns a Set of element ids that have been marked withdrew(I).
// Current-state render surfaces (renderStructuredProof, getProofState) filter against
// this set so withdrawn elements don't appear as if still load-bearing. The verification-
// path projection (renderDatalogProjection) intentionally does NOT filter — it must be
// faithful to the EDB so a second engine can replay it.
function _withdrewIdSet(readPorts) {
  const rows = readPorts.query.query(['withdrew', [{ var: 'I' }]]);
  return new Set(rows.map(r => r.I));
}

/**
 * @param {object} args
 * @param {{query: any, explain: any}} readPorts
 * @returns {string} markdown
 */
export function renderStructuredProof(args, readPorts) {
  const withdrawn = _withdrewIdSet(readPorts);
  const live = (rows) => rows.filter(b => !withdrawn.has(b.I));
  const sections = [];
  sections.push('# Proof\n');
  const evidences = live(readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]]));
  if (evidences.length) sections.push('## Givens (Evidence)\n' + evidences.map(b => `- ${b.I}: ${b.C}`).join('\n') + '\n');
  const risks = live(readPorts.query.query(['risk', [{ var: 'I' }, { var: 'S' }, { var: 'V' }]]));
  if (risks.length) {
    const lines = ['## Risks'];
    for (const r of risks) {
      lines.push(`- ${r.I}: ${r.S} (${r.V})`);
      const basisRows = readPorts.query.query(['risk_basis', [r.I, { var: 'E' }]]);
      if (basisRows.length) {
        lines.push(`  - Basis: ${basisRows.map(b => b.E).join(', ')}`);
      }
    }
    sections.push(lines.join('\n') + '\n');
  }
  const permissions = live(readPorts.query.query(['permission_decl', [{ var: 'I' }, { var: 'S' }]]));
  if (permissions.length) {
    const lines = ['## Permissions'];
    for (const p of permissions) {
      lines.push(`- ${p.I}: ${p.S}`);
      const linkages = readPorts.query.query(['permission', [p.I, { var: 'S2' }, { var: 'R' }]]);
      for (const l of linkages) {
        lines.push(`  - Relieves: ${l.R}`);
      }
      const scopes = readPorts.query.query(['permission_scope', [p.I, { var: 'T' }]]);
      for (const sc of scopes) {
        lines.push(`  - Scope: ${sc.T}`);
      }
    }
    sections.push(lines.join('\n') + '\n');
  }
  const propositions = live(readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]]));
  if (propositions.length) {
    const propBlocks = propositions.map(b => {
      const lines = [`- ${b.I}: ${b.S}`];
      const declRows = readPorts.query.query(['proposition_decl', [b.I, { var: '_S' }, { var: 'P' }]]);
      if (declRows.length) lines.push(`  - Inference pattern: ${declRows[0].P}`);
      const groundingRows = readPorts.query.query(['proposition_grounding', [b.I, { var: 'E' }]]);
      if (groundingRows.length) lines.push(`  - Grounding: ${groundingRows.map(r => r.E).join(', ')}`);
      const ct = readPorts.query.query(['collapse_test', [b.I, { var: 'T' }]]);
      if (ct.length) lines.push(`  - Collapse test: ${ct[0].T}`);
      const rc = readPorts.query.query(['reasoning_chain', [b.I, { var: 'T' }]]);
      if (rc.length) lines.push(`  - Reasoning: ${rc[0].T}`);
      const ra = readPorts.query.query(['rejected_alternative', [b.I, { var: 'A' }, { var: 'R' }]]);
      if (ra.length) {
        lines.push('  - Rejected alternatives:');
        for (const row of ra) lines.push(`    - ${row.A} — ${row.R}`);
      }
      return lines.join('\n');
    });
    sections.push('## Lemmas (Propositions)\n' + propBlocks.join('\n') + '\n');
  }
  const resolutions = live(readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]]));
  if (resolutions.length) {
    const lines = ['## Theorems (Resolutions)'];
    for (const r of resolutions) {
      lines.push(`- ${r.I}: ${r.S}`);
      const anchor = readPorts.query.query(['resolution_anchor', [r.I, { var: 'C' }]]);
      if (anchor.length) lines.push(`  - Problem anchor: ${anchor[0].C}`);
      const grounding = readPorts.query.query(['resolution_grounding', [r.I, { var: 'P' }]]);
      if (grounding.length) lines.push(`  - Grounding: ${grounding.map(g => g.P).join(', ')}`);
    }
    sections.push(lines.join('\n') + '\n');
  }
  const frictions = live(readPorts.query.query(['friction', [{ var: 'I' }, { var: 'S' }, { var: 'A' }, { var: 'B' }, { var: 'D' }]]));
  if (frictions.length) {
    const lines = ['## Frictions'];
    for (const f of frictions) {
      lines.push(`- ${f.I}`);
      lines.push(`  - Friction shape: ${f.S}`);
      lines.push(`  - Anchor A: ${f.A}`);
      lines.push(`  - Anchor B: ${f.B}`);
      lines.push(`  - Disposition: ${f.D}`);
    }
    sections.push(lines.join('\n') + '\n');
  }
  return sections.join('\n');
}

// Per-predicate fact arities for renderElementDeep. The Engine matches by arity exactly
// (Unifier returns null when pattern.length !== fact.length), so each predicate must be
// queried at its declared arity rather than with a fixed-width wildcard fill.
const _ARITIES = Object.freeze({
  evidence: 3,
  rule_decl: 2,
  permission_decl: 2,
  proposition_decl: 3,
  risk: 3,
  resolution_decl: 2,
  friction: 5,
  definition_decl: 3,
});

export function renderElementDeep(args, readPorts) {
  if (!args || !args.id) return null;
  const { id } = args;
  // Annotate (rather than filter) for the programmatic API: the caller needs to
  // distinguish "no such element" (return null) from "element exists but withdrawn"
  // (return record with withdrawn:true). Filtering would conflate the two.
  const withdrawn = _withdrewIdSet(readPorts).has(id);
  for (const [pred, arity] of Object.entries(_ARITIES)) {
    if (arity < 1) continue;
    const pattern = [id, ...Array(arity - 1).fill('_')];
    const rows = readPorts.query.query([pred, pattern]);
    if (rows.length) return { id, predicate: pred, withdrawn, ...rows[0] };
  }
  return null;
}

export function renderClosingArgument(args, readPorts) {
  const permitted = readPorts.query.exists(['closure_permitted', []]);
  // detectedFrictions surfaces auto-detected structural findings at the rendering
  // moment so operators see them right next to the permitted decision. With Option A
  // auto-escalation in place, the closure gate already refuses on coverage_gap,
  // ungrounded_proposition, and overlap_detected — those would block before this
  // render is meaningful. The remaining detections this surfaces are:
  //   - operator-elevated FRICTION elements that have been DEFERred (closure permits
  //     them via the friction_disposition path, but the operator should still see them)
  //   - any future detection categories that aren't yet auto-escalated
  // Failure to compute the friction list never breaks the render — degrade gracefully.
  let detectedFrictions = [];
  try {
    // friction-policy.detectFrictions lives in the domain layer; we re-implement the
    // public-API summary here against readPorts to avoid circular imports. Each entry
    // mirrors the {shape, args} shape detectFrictions returns.
    const SHAPE_QUERIES = [
      ['ungrounded', 'ungrounded_proposition', ['P']],
      ['coverage_gap', 'coverage_gap_detected', ['C']],
    ];
    for (const [shape, pred, vars] of SHAPE_QUERIES) {
      const pattern = [pred, vars.map(v => ({ var: v }))];
      for (const row of readPorts.query.query(pattern)) {
        detectedFrictions.push({ shape, args: vars.map(v => row[v]) });
      }
    }
    // overlap_detected is symmetric pair-shape — canonicalize like detectFrictions does.
    const overlapRows = readPorts.query.query(['overlap_detected', [{ var: 'T1' }, { var: 'T2' }]]);
    const seen = new Set();
    for (const row of overlapRows) {
      if (row.T1 === row.T2) continue;
      const [lo, hi] = row.T1 < row.T2 ? [row.T1, row.T2] : [row.T2, row.T1];
      const key = `${lo}\x1f${hi}`;
      if (seen.has(key)) continue;
      seen.add(key);
      detectedFrictions.push({ shape: 'overlap', args: [lo, hi] });
    }
  } catch {
    detectedFrictions = [];
  }
  return { permitted, asOf: Date.now(), detectedFrictions };
}

export function renderDatalogProjection(args, readPorts) {
  // Serializable Datalog projection: every base/derived fact + every rule.
  // Per Architecture §10 "Independent verification path" — output suitable for
  // ingestion by a second engine.
  //
  // The Engine matches by exact arity (Unifier returns null when pattern.length !==
  // fact.length), so each predicate is queried at its declared arity with positional
  // named variables — variables bind to concrete values, which are then re-collected
  // in positional order to reconstruct the fact tuple.
  // PROJECTION_ARITIES must cover every EDB predicate declared by translation.js's
  // EDB_PREDICATES set — otherwise a second engine ingesting the projection misses
  // facts the first engine had. The set below mirrors EDB_PREDICATES at the time of
  // writing; add to both when a new EDB predicate is introduced.
  //
  // Note on `concern_status`: this predicate name is shared between EDB and derived
  // sources — the CONCERN translator writes (id, 'draft') as EDB at addElement time,
  // and the CONCERN per-element rule template derives (id, 'ratified') after approval.
  // Per-instance overlap is resolved by the RATIFY translator's retraction of the
  // 'draft' EDB row at ratify time (mutations.js — CONCERN ratification cleanup), so
  // a given concern has exactly one concern_status row at any moment. The predicate
  // name is still mixed-source though: post-ratify projections include the (id, 'ratified')
  // row as if it were EDB. Replay by a second engine is idempotent — re-derivation
  // produces the same fact — so replay correctness holds, but pure EDB-only projection
  // would require an engine-side EDB/derived discriminator the current API doesn't expose.
  const PROJECTION_ARITIES = {
    evidence: 3, rule_decl: 2, permission_decl: 2, permission: 3, permission_scope: 2,
    proposition_decl: 3,
    proposition_grounding: 2, collapse_test: 2, reasoning_chain: 2, rejected_alternative: 3,
    risk: 3, risk_basis: 2,
    resolution_decl: 2, resolution_anchor: 2, resolution_grounding: 2,
    friction: 5, friction_disposition: 2, definition_decl: 3, definition_scope: 2, definition_self: 2,
    concern: 3, concern_status: 2, concern_note: 2,
    approved: 3, two_yes: 2,
    closure_committed: 0, closure_pending: 0, round: 1,
    created_at: 2, withdrew: 1, superseded: 2,
  };
  const facts = [];
  for (const [pred, arity] of Object.entries(PROJECTION_ARITIES)) {
    const varNames = Array.from({ length: arity }, (_, i) => `V${i}`);
    const pattern = [pred, varNames.map((n) => ({ var: n }))];
    for (const row of readPorts.query.query(pattern)) {
      // Preserve positional order — Object.values on the binding object is not
      // guaranteed to match insertion order across engines, so reconstruct from varNames.
      facts.push([pred, varNames.map((n) => row[n])]);
    }
  }
  // Rules are projected in tuple-format (the same shape defineRule consumes), so a
  // second engine ingesting this projection can replay the proof faithfully. Each
  // rule is {ruleId, headAtom, bodyAtoms, metadata}. If readPorts is constructed
  // without getAllRules (e.g. by a legacy caller), fall back to an empty array
  // rather than throwing.
  const rules = typeof readPorts.getAllRules === 'function' ? readPorts.getAllRules() : [];
  return { facts, rules };
}

export function renderLaneSlice(args, readPorts) {
  return { lane: args.lane ?? 'all', elements: [] };
}

export function getProofState(args, readPorts) {
  // Current-state inventory: filter withdrawn elements so consumers see only the
  // load-bearing live state. Callers needing the historical EDB use renderDatalogProjection.
  const withdrawn = _withdrewIdSet(readPorts);
  const live = (rows) => rows.filter(b => !withdrawn.has(b.I));
  return {
    evidence: live(readPorts.query.query(['evidence', [{ var: 'I' }, { var: 'S' }, { var: 'C' }]])),
    propositions: live(readPorts.query.query(['proposition', [{ var: 'I' }, { var: 'S' }]])),
    resolutions: live(readPorts.query.query(['resolution', [{ var: 'I' }, { var: 'S' }]])),
    closurePermitted: readPorts.query.exists(['closure_permitted', []]),
  };
}

export function queryProof(args, readPorts) {
  if (!args || !args.pattern) return [];
  return readPorts.query.query(args.pattern);
}
