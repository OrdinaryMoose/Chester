/**
 * buildProvenance — pure function. Constructs a provenance record per RC-4.
 * Element-level action_label is the priority-promoted aggregate.
 * Throws if non-verbatim element-level action lacks a reasoning_chain.
 *
 * Per-field detail (smell #2 mitigation): fieldProvenance is an array
 * [{ field_name, action_label, reasoning_chain }] giving the action label per
 * typed field. Element-level action_label is derived from the strongest field
 * label per priority (gap-fill > reshape > verbatim-preserve).
 */
export function buildProvenance({ sourceCitation, actionLabel, reasoningChain, fieldProvenance }) {
  if (actionLabel !== 'verbatim-preserve' && (reasoningChain === null || reasoningChain === undefined)) {
    throw new Error(`buildProvenance: action_label "${actionLabel}" requires non-null reasoning_chain`);
  }
  return {
    source_citation: sourceCitation,
    action_label: actionLabel,
    reasoning_chain: reasoningChain,
    field_provenance: Array.isArray(fieldProvenance) ? fieldProvenance : [],
  };
}

/**
 * extractMetadata — pure function. Routes caller-candidate fields not in the
 * registry's required or optional lists into a free-form metadata object keyed
 * by the original field name. Excludes `category` (structural routing field,
 * not caller-supplied content). Returns {} when no fields are unmapped.
 */
const STRUCTURAL_FIELDS = new Set(['category']);

export function extractMetadata({ callerCandidate, registryEntry }) {
  const knownFields = new Set([
    ...registryEntry.required.map(f => f.name),
    ...registryEntry.optional,
  ]);
  const metadata = {};
  for (const [key, value] of Object.entries(callerCandidate)) {
    if (!knownFields.has(key) && !STRUCTURAL_FIELDS.has(key)) {
      metadata[key] = value;
    }
  }
  return metadata;
}
