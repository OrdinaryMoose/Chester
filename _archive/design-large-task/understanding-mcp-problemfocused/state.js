// State management for the problem-focused understanding MCP server.
// Lifecycle: initialize → seed glossary → submit round evidence
//            → vocabulary actions → repeat-back ratification → check transition.

import { readFileSync, writeFileSync } from 'fs';
import {
  TENETS,
  WEIGHTS,
  OVERRIDE_TARGET_TENETS,
  validateRoundSubmission,
  validateVocabularyAction,
  validateEntry,
  classifyTerm,
  computeTenetScore,
  computeOverall,
  findWeakestTenet,
  repeatBackStability,
  checkTransitionReady,
  surfaceTermDriftCandidates,
  classifyPhaseVocabulary,
} from './scoring.js';

// ── Initialize ───────────────────────────────────────────────────

export function initializeState(userPrompt) {
  const tenetEntries = {};
  const tenetScores = {};
  for (const tenet of TENETS) {
    tenetEntries[tenet] = [];
    tenetScores[tenet] = 0;
  }

  return {
    schemaVersion: 'problemfocused-v0.1',
    userPrompt,
    round: 0,
    overallThreshold: 0.65,

    // Per-tenet entry ledgers (append-only history)
    tenetEntries,
    tenetScores,
    scoreHistory: [],

    // Active glossary
    glossary: [],
    vocabularyActionLog: [],
    pendingVocabDispositions: [],

    // Term usage tracking for drift surfacer
    termUsageHistory: {},

    // Convention-Break Override Rule pending list
    pendingOverrides: [],

    // Solve Leakage Ledger — rejected entries parked here
    solveLeakageLedger: [],

    // Problem-Statement Repeat-Back history
    repeatBackHistory: [],

    // Per-round transition snapshots
    transition: { ready: false, reasons: ['session just initialized'] },
    transitionHistory: [],
    warningsHistory: [],
  };
}

// ── Round-Zero Glossary Seeding ──────────────────────────────────

export function seedGlossaryFromExploration(state, seedTerms) {
  const next = structuredClone(state);
  for (const term of seedTerms ?? []) {
    if (!term.canonical_name || !term.definition) continue;
    next.glossary.push({
      canonical_name: term.canonical_name,
      aliases: term.aliases ?? [],
      definition: term.definition,
      source: term.source ?? { kind: 'PROPOSED-PENDING-DESIGNER' },
      sense_constraints: term.sense_constraints ?? [],
      status: 'PROPOSED-PENDING-DESIGNER',
      first_used_round: 0,
      history: [{ event: 'seeded', round: 0, source: term.source ?? null }],
    });
  }
  return next;
}

// ── Vocabulary Actions ───────────────────────────────────────────

export function applyVocabularyAction(state, action) {
  const errors = validateVocabularyAction(action);
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const next = structuredClone(state);
  const { action: kind, target_terms, new_term, reason, designer_quote, classification } = action;
  const round = next.round;

  switch (kind) {
    case 'ADD': {
      if (!new_term || !new_term.canonical_name || !new_term.definition) {
        return { valid: false, errors: ['ADD requires new_term { canonical_name, definition }'] };
      }
      next.glossary.push({
        canonical_name: new_term.canonical_name,
        aliases: new_term.aliases ?? [],
        definition: new_term.definition,
        source: new_term.source ?? null,
        sense_constraints: new_term.sense_constraints ?? [],
        status: designer_quote ? 'DEFINED' : 'AMBIGUOUS',
        first_used_round: round,
        history: [{ event: 'ADD', round, designer_quote, reason }],
      });
      break;
    }
    case 'REMOVE': {
      const target = target_terms[0];
      const idx = next.glossary.findIndex(e =>
        e.canonical_name === target || (e.aliases ?? []).includes(target)
      );
      if (idx === -1) return { valid: false, errors: [`REMOVE: term ${target} not in glossary`] };
      next.glossary[idx].status = 'DEPRECATED';
      next.glossary[idx].history.push({ event: 'REMOVE', round, designer_quote, reason });
      break;
    }
    case 'RENAME': {
      const oldName = target_terms[0];
      const newName = new_term?.canonical_name;
      if (!newName) return { valid: false, errors: ['RENAME requires new_term.canonical_name'] };
      const entry = next.glossary.find(e =>
        e.canonical_name === oldName || (e.aliases ?? []).includes(oldName)
      );
      if (!entry) return { valid: false, errors: [`RENAME: term ${oldName} not in glossary`] };
      const formerName = entry.canonical_name;
      entry.canonical_name = newName;
      entry.aliases = [...new Set([...(entry.aliases ?? []), formerName])];
      entry.history.push({ event: 'RENAME', round, from: formerName, to: newName, designer_quote, reason });
      break;
    }
    case 'SPLIT': {
      const oldName = target_terms[0];
      if (!new_term || !Array.isArray(new_term.split_into) || new_term.split_into.length !== 2) {
        return { valid: false, errors: ['SPLIT requires new_term.split_into of length 2'] };
      }
      const idx = next.glossary.findIndex(e =>
        e.canonical_name === oldName || (e.aliases ?? []).includes(oldName)
      );
      if (idx === -1) return { valid: false, errors: [`SPLIT: term ${oldName} not in glossary`] };
      const original = next.glossary[idx];
      next.glossary.splice(idx, 1);
      for (const part of new_term.split_into) {
        next.glossary.push({
          canonical_name: part.canonical_name,
          aliases: part.aliases ?? [],
          definition: part.definition,
          source: part.source ?? original.source,
          sense_constraints: part.sense_constraints ?? [],
          status: designer_quote ? 'DEFINED' : 'AMBIGUOUS',
          first_used_round: round,
          history: [{ event: 'SPLIT-FROM', round, source_term: oldName, designer_quote, reason }],
        });
      }
      break;
    }
    case 'MERGE': {
      if (target_terms.length < 2) return { valid: false, errors: ['MERGE requires ≥2 target_terms'] };
      const canonicalChoice = new_term?.canonical_name ?? target_terms[0];
      // Collect all entries for the targets
      const matchedEntries = next.glossary.filter(e =>
        target_terms.some(t => e.canonical_name === t || (e.aliases ?? []).includes(t))
      );
      if (matchedEntries.length < 2) {
        return { valid: false, errors: ['MERGE: fewer than 2 matched glossary entries'] };
      }
      // Pick the canonical entry (matches canonicalChoice or the first)
      const canonicalEntry = matchedEntries.find(e => e.canonical_name === canonicalChoice) ?? matchedEntries[0];
      const others = matchedEntries.filter(e => e !== canonicalEntry);
      // Absorb aliases
      canonicalEntry.aliases = [...new Set([
        ...(canonicalEntry.aliases ?? []),
        ...others.flatMap(e => [e.canonical_name, ...(e.aliases ?? [])]),
      ])];
      canonicalEntry.canonical_name = canonicalChoice;
      canonicalEntry.history.push({
        event: 'MERGE',
        round,
        merged_from: others.map(e => e.canonical_name),
        designer_quote,
        reason,
      });
      // Remove others
      next.glossary = next.glossary.filter(e => e === canonicalEntry || !others.includes(e));
      break;
    }
    case 'REMOVE_AND_ADD': {
      // Compound action: REMOVE old, ADD fresh
      const removeRes = applyVocabularyAction(next, {
        action: 'REMOVE', target_terms, reason, designer_quote,
      });
      if (!removeRes.valid) return removeRes;
      const addRes = applyVocabularyAction(removeRes.state, {
        action: 'ADD', target_terms: [new_term?.canonical_name], new_term, reason, designer_quote,
      });
      if (!addRes.valid) return addRes;
      return addRes;
    }
    case 'DEFER': {
      next.pendingVocabDispositions.push({
        target_terms,
        classification,
        reason,
        deferred_round: round,
        resolved: false,
      });
      break;
    }
    default:
      return { valid: false, errors: [`unhandled action: ${kind}`] };
  }

  next.vocabularyActionLog.push({
    action: kind,
    target_terms,
    new_term: new_term ? { canonical_name: new_term.canonical_name } : null,
    reason,
    designer_quote,
    classification,
    executed_round: round,
    executed_at: new Date().toISOString(),
  });

  return { valid: true, state: next };
}

// ── Round Evidence Submission ────────────────────────────────────

export function submitRoundEvidence(state, submission) {
  const validation = validateRoundSubmission(submission, state);

  const next = structuredClone(state);
  next.round += 1;
  const round = next.round;

  const acceptedEntries = {};
  const leakedEntries = [];
  const rejectedEntries = [];

  // Process each tenet's entries
  for (const tenet of TENETS) {
    acceptedEntries[tenet] = [];
    const incoming = submission[tenet] ?? [];
    for (const entry of incoming) {
      const v = validateEntry(entry, tenet);
      if (v.errors.length > 0) {
        // Phase-vocabulary violations route to solve leakage; structural errors route to rejected_entries
        const phaseViolation = v.errors.some(e => e.includes('phase-vocabulary'));
        if (phaseViolation) {
          leakedEntries.push({
            origin_tenet: tenet,
            entry,
            errors: v.errors,
            round,
          });
        } else {
          rejectedEntries.push({
            tenet,
            entry_summary: entry.text?.slice(0, 100) ?? '',
            errors: v.errors,
            round,
          });
        }
        continue;
      }

      const accepted = { ...entry, _validation_passed: true, _flags: v.flags, round };

      // Convention-Break Override Rule: tenet-specific triggers
      if (OVERRIDE_TARGET_TENETS.includes(tenet)) {
        const conventionBreak = detectConventionBreak(tenet, entry, next);
        if (conventionBreak && !entry.override_reason) {
          accepted._held_pending_override = true;
          next.pendingOverrides.push({
            tenet,
            entry_summary: entry.text?.slice(0, 100) ?? '',
            break_kind: conventionBreak.kind,
            opened_round: round,
            resolved: false,
          });
        }
      }

      acceptedEntries[tenet].push(accepted);
      next.tenetEntries[tenet].push(accepted);

      // Track term usage for drift surfacer
      const phrases = (entry.text ?? '').toLowerCase().match(/\b[a-z][a-z0-9_-]{2,}\b/g) ?? [];
      for (const p of phrases.slice(0, 20)) {
        next.termUsageHistory[p] ??= [];
        if (!next.termUsageHistory[p].includes(round)) next.termUsageHistory[p].push(round);
      }
    }

    // Recompute tenet score
    next.tenetScores[tenet] = computeTenetScore(next.tenetEntries[tenet], tenet);
  }

  // Park leaked entries
  for (const leaked of leakedEntries) {
    next.solveLeakageLedger.push(leaked);
  }

  // Repeat-back handling
  if (submission.repeat_back_statement) {
    const ratified = !!submission.repeat_back_designer_quote;
    next.repeatBackHistory.push({
      round,
      statement: submission.repeat_back_statement,
      designer_quote: submission.repeat_back_designer_quote ?? null,
      designer_ratified: ratified,
      submitted_at: new Date().toISOString(),
    });
  }

  // Score history snapshot
  next.scoreHistory.push(structuredClone(next.tenetScores));

  // Compute transition
  next.transition = checkTransitionReady(next);
  next.transitionHistory.push(structuredClone(next.transition));
  next.warningsHistory.push(validation.flags);

  return {
    valid: true,
    state: next,
    accepted_entries: acceptedEntries,
    leaked_entries: leakedEntries,
    rejected_entries: rejectedEntries,
    flags: validation.flags,
  };
}

// ── Convention-Break Detector ────────────────────────────────────

function detectConventionBreak(tenet, entry, state) {
  switch (tenet) {
    case 'project_fit':
      if (entry.alignment === 'MISFIT') return { kind: 'project_misfit' };
      return null;
    case 'constraint_envelope':
      // Inheritance-relaxation check: if entry references a previously-set constraint
      // and tags as relaxed/changed
      if (entry.constraint_type === 'inheritance' && entry.relaxes_prior_constraint) {
        return { kind: 'constraint_relaxation' };
      }
      return null;
    case 'scope_boundary':
      // Re-categorization of previously OUT or BORDERLINE → IN
      if (entry.placement === 'IN' && entry.previously_marked && entry.previously_marked !== 'IN') {
        return { kind: 'scope_pull_in' };
      }
      return null;
    default:
      return null;
  }
}

// ── Override Resolution ──────────────────────────────────────────

export function resolveOverride(state, overrideIndex, resolution) {
  const next = structuredClone(state);
  const pending = next.pendingOverrides[overrideIndex];
  if (!pending) throw new Error(`unknown override index ${overrideIndex}`);
  if (pending.resolved) throw new Error(`override ${overrideIndex} already resolved`);
  pending.resolved = true;
  pending.resolution = {
    disposition: resolution.disposition, // RATIFIED | REJECTED | DEFERRED
    designer_quote: resolution.designer_quote ?? null,
    resolved_round: next.round,
    resolved_at: new Date().toISOString(),
  };
  // If RATIFIED, lift the _held_pending_override flag on the corresponding entry
  if (resolution.disposition === 'RATIFIED') {
    for (const entries of Object.values(next.tenetEntries)) {
      for (const e of entries) {
        if (e._held_pending_override && e.text?.startsWith(pending.entry_summary?.slice(0, 50) ?? '___no_match___')) {
          e._held_pending_override = false;
        }
      }
    }
    // Recompute tenet scores
    for (const tenet of TENETS) {
      next.tenetScores[tenet] = computeTenetScore(next.tenetEntries[tenet], tenet);
    }
  }
  return next;
}

// ── Persistence ──────────────────────────────────────────────────

export function saveState(state, filePath) {
  writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function loadState(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}
