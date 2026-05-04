/**
 * checkOpenGate — pure function. NCON-3 enforcement.
 * Verifies that admitted elements carry restructuring artifacts and that
 * the report is non-empty before proof open.
 * Returns { permitted: boolean, failures: { element_id?, missing_artifact }[] }.
 */
const VALID_LABELS = new Set(['verbatim-preserve', 'reshape', 'gap-fill', 'infer', 'derive']);

export function checkOpenGate(admitted, report) {
  const failures = [];

  if (typeof report !== 'string' || report.trim().length === 0) {
    failures.push({ missing_artifact: 'restructuring_report' });
  }

  if (!Array.isArray(admitted) || admitted.length === 0) {
    failures.push({ missing_artifact: 'admitted_elements' });
    return { permitted: false, failures };
  }

  for (const el of admitted) {
    const id = el.id || `${el.category}@${admitted.indexOf(el)}`;

    if (!el.restructuring_action_label || !VALID_LABELS.has(el.restructuring_action_label)) {
      failures.push({ element_id: id, missing_artifact: 'restructuring_action_label' });
      continue;
    }

    const prov = el.provenance;
    if (!prov || typeof prov !== 'object') {
      failures.push({ element_id: id, missing_artifact: 'provenance' });
      continue;
    }
    if (!prov.source_citation || typeof prov.source_citation !== 'string') {
      failures.push({ element_id: id, missing_artifact: 'source_citation' });
      continue;
    }

    const isVerbatim = el.restructuring_action_label === 'verbatim-preserve';
    if (!isVerbatim && (prov.reasoning_chain === null || prov.reasoning_chain === undefined || prov.reasoning_chain === '')) {
      failures.push({ element_id: id, missing_artifact: 'reasoning_chain' });
    }
  }

  return { permitted: failures.length === 0, failures };
}
