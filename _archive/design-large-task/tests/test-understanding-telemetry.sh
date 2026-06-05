#!/bin/bash
# Tests: AC-2.1, AC-2.2, AC-2.3, AC-2.4 — understanding MCP telemetry persistence
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
TMPDIR="$(mktemp -d)"
STATE_FILE="$TMPDIR/state.json"
trap "rm -rf $TMPDIR" EXIT

cd "$REPO_ROOT"

# Use Node directly to exercise state.js functions
node --input-type=module -e "
import { initializeState, updateState, saveState, loadState } from '$REPO_ROOT/skills/design-large-task/understanding-mcp/state.js';

// AC-2.1, 2.2, 2.3 setup: initialize and run 3 sequential updates
let state = initializeState('brownfield', 'test prompt');

// Verify new fields initialized as empty arrays
if (!Array.isArray(state.groupSaturationHistory) || state.groupSaturationHistory.length !== 0) throw new Error('AC-2.1 init: groupSaturationHistory not empty array');
if (!Array.isArray(state.transitionHistory) || state.transitionHistory.length !== 0) throw new Error('AC-2.2 init: transitionHistory not empty array');
if (!Array.isArray(state.warningsHistory) || state.warningsHistory.length !== 0) throw new Error('AC-2.3 init: warningsHistory not empty array');

const dim = (s) => ({ score: s, justification: 'test', gap: s < 0.9 ? 'gap' : '' });

// Round 1
const scores1 = {
  surface_coverage: dim(0.3), relationship_mapping: dim(0.3), constraint_discovery: dim(0.3), risk_topology: dim(0.3),
  stakeholder_impact: dim(0.3), prior_art: dim(0.3),
  temporal_context: dim(0.3), problem_boundary: dim(0.3), assumption_inventory: dim(0.3),
};
state = updateState(state, scores1, []);

// Round 2 — trigger jump warning by raising one dim by >0.3
const scores2 = { ...scores1, surface_coverage: dim(0.7) };
state = updateState(state, scores2, [{ dimension: 'surface_coverage', message: 'jump>0.3' }]);

// Round 3
const scores3 = { ...scores2, relationship_mapping: dim(0.5) };
state = updateState(state, scores3, []);

// AC-2.1 assertion
if (state.groupSaturationHistory.length !== 3) throw new Error('AC-2.1 length: expected 3 entries, got ' + state.groupSaturationHistory.length);
if (typeof state.groupSaturationHistory[0].landscape !== 'number') throw new Error('AC-2.1 shape: missing landscape numeric');
if (typeof state.groupSaturationHistory[0].human_context !== 'number') throw new Error('AC-2.1 shape: missing human_context numeric');
if (typeof state.groupSaturationHistory[0].foundations !== 'number') throw new Error('AC-2.1 shape: missing foundations numeric');

// AC-2.2 assertion
if (state.transitionHistory.length !== 3) throw new Error('AC-2.2 length: expected 3 entries, got ' + state.transitionHistory.length);
if (typeof state.transitionHistory[0].ready !== 'boolean') throw new Error('AC-2.2 shape: ready must be boolean');
if (!Array.isArray(state.transitionHistory[0].reasons)) throw new Error('AC-2.2 shape: reasons must be array');

// AC-2.3 assertion
if (state.warningsHistory.length !== 3) throw new Error('AC-2.3 length: expected 3 entries, got ' + state.warningsHistory.length);
if (!Array.isArray(state.warningsHistory[1])) throw new Error('AC-2.3 shape: round-2 warnings must be array');
if (state.warningsHistory[1].length === 0) throw new Error('AC-2.3 content: round-2 should contain the jump warning');

// AC-2.4 assertion: existing fields function unchanged
if (state.scoreHistory.length !== 3) throw new Error('AC-2.4: scoreHistory regressed');
if (state.saturationHistory.length !== 3) throw new Error('AC-2.4: saturationHistory regressed');
if (typeof state.overallSaturation !== 'number') throw new Error('AC-2.4: overallSaturation regressed');
if (typeof state.weakest !== 'object') throw new Error('AC-2.4: weakest regressed');
if (typeof state.transition !== 'object') throw new Error('AC-2.4: transition regressed');

console.log('PASS: AC-2.1, AC-2.2, AC-2.3, AC-2.4');
"
