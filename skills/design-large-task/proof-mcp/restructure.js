import { REQUIRED_FIELDS_REGISTRY } from './restructure-schema.js';
import { assignActionLabel, isRejectedValue } from './restructure-rules.js';

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

/**
 * restructure — pure function. Top-level restructuring entry point.
 * Accepts caller submission_material; returns:
 *   { problem_statement, admitted, rejected, report, rejection_diagnostic? }.
 *
 * If problem_statement is absent, rejection_diagnostic is set and the gate fails.
 * Otherwise admitted elements carry { category, ...typedFields, metadata,
 * restructuring_action_label, provenance }.
 */
export function restructure(submissionMaterial) {
  const result = { admitted: [], rejected: [], report: '' };

  // Phase 2.0 — extract problem statement
  const problemStatement = submissionMaterial?.problem_statement;
  if (typeof problemStatement !== 'string' || problemStatement.trim().length === 0) {
    result.rejection_diagnostic = 'problem_statement is required (top-level non-empty string in submission_material)';
    result.report = 'No restructuring performed: problem_statement missing.';
    return result;
  }
  result.problem_statement = problemStatement;

  // Phase 2.1 — restructure each element candidate
  const elements = Array.isArray(submissionMaterial.elements) ? submissionMaterial.elements : [];
  for (let i = 0; i < elements.length; i++) {
    const candidate = elements[i];
    const category = candidate.category;
    const registryEntry = REQUIRED_FIELDS_REGISTRY[category];
    const sourceCitation = `submission.elements[${i}]`;

    if (!registryEntry) {
      result.rejected.push({
        candidate,
        missing_fields: [],
        diagnostic: `unknown category "${category}" (not in REQUIRED_FIELDS_REGISTRY)`,
      });
      continue;
    }

    const missingFields = [];
    const fieldRejectionReasons = {};  // field name → reason string from isRejectedValue
    const typedFields = {};
    const fieldProvenance = [];  // per-field [{field_name, action_label, reasoning_chain}]
    // Priority order for element-level promotion: gap-fill > reshape > verbatim-preserve.
    const PRIORITY = { 'verbatim-preserve': 0, 'reshape': 1, 'gap-fill': 2, 'infer': 3, 'derive': 4 };
    let primaryActionLabel = 'verbatim-preserve';
    let primaryReasoningChain = null;

    for (const requiredField of registryEntry.required) {
      const callerValue = candidate[requiredField.name];
      const rejectedCheck = isRejectedValue(callerValue);
      if (rejectedCheck.rejected) {
        missingFields.push(requiredField.name);
        fieldRejectionReasons[requiredField.name] = rejectedCheck.reason;
        continue;
      }
      const labelResult = assignActionLabel({
        callerValue,
        expectedType: typeof callerValue === 'object' && Array.isArray(callerValue) ? 'array' : 'string',
        requiredFieldName: requiredField.name,
      });
      if (labelResult.label === null) {
        missingFields.push(requiredField.name);
        continue;
      }
      typedFields[requiredField.name] = labelResult.reshapedValue !== undefined ? labelResult.reshapedValue : callerValue;
      // Per-field provenance entry (smell #2 mitigation)
      const fieldReasoning = labelResult.label === 'verbatim-preserve'
        ? null
        : (labelResult.ruleCitation || `${labelResult.label} applied to field "${requiredField.name}"`);
      fieldProvenance.push({
        field_name: requiredField.name,
        action_label: labelResult.label,
        reasoning_chain: fieldReasoning,
      });
      // Priority promotion for element-level label
      if (PRIORITY[labelResult.label] > PRIORITY[primaryActionLabel]) {
        primaryActionLabel = labelResult.label;
        primaryReasoningChain = fieldReasoning;
      }
    }

    if (missingFields.length > 0) {
      const fieldDetails = missingFields.map(name => {
        const reason = fieldRejectionReasons[name];
        return reason ? `${name} (${reason})` : `${name} (missing)`;
      });
      result.rejected.push({
        candidate,
        missing_fields: missingFields,
        diagnostic: `category ${category}: missing or rejected required fields: ${fieldDetails.join(', ')}`,
      });
      continue;
    }

    // Optional fields (verbatim if present)
    for (const optName of registryEntry.optional) {
      if (candidate[optName] !== undefined) {
        typedFields[optName] = candidate[optName];
      }
    }

    const metadata = extractMetadata({ callerCandidate: candidate, registryEntry });
    const provenance = buildProvenance({
      sourceCitation,
      actionLabel: primaryActionLabel,
      reasoningChain: primaryActionLabel === 'verbatim-preserve' ? null : primaryReasoningChain,
      fieldProvenance,
    });

    result.admitted.push({
      category,
      ...typedFields,
      metadata,
      restructuring_action_label: primaryActionLabel,
      provenance,
    });
  }

  // Phase 2.2 — assemble report
  const lines = [`Restructured ${result.admitted.length} admitted, ${result.rejected.length} rejected.`];
  for (const adm of result.admitted) {
    lines.push(`  ADMIT [${adm.category}] action=${adm.restructuring_action_label} from ${adm.provenance.source_citation}`);
  }
  for (const rej of result.rejected) {
    lines.push(`  REJECT [${rej.candidate.category}] ${rej.diagnostic}`);
  }
  result.report = lines.join('\n');
  return result;
}
