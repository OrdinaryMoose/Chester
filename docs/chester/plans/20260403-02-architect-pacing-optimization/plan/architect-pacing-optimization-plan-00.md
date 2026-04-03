# chester-design-architect v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use chester-execute-write (recommended) or chester-execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the chester-design-architect skill to deliver objective scoring discipline at figure-out's conversational speed, replacing the subagent pipeline with a single-agent flow backed by an enforcement MCP server.

**Architecture:** Single-agent conversational flow (structurally identical to figure-out) with a custom MCP server providing deterministic scoring, input validation, state tracking, and challenge/closure gating. The agent calls the MCP each round to submit scores and receive computed state — creating a structural dependency that makes scoring difficult to skip. The MCP supplements (does not replace) the existing structured thinking MCP.

**Tech Stack:** Node.js (ESM), @modelcontextprotocol/sdk, vitest (testing), Claude Code MCP registration

---

### Task 1: Initialize Enforcement MCP Project

**Files:**
- Create: `chester-design-architect/enforcement/package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "chester-architect-enforcement",
  "version": "1.0.0",
  "type": "module",
  "description": "Enforcement mechanism MCP server for chester-design-architect scoring discipline",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1"
  },
  "devDependencies": {
    "vitest": "^3.1.1"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npm install`
Expected: `added N packages` — node_modules created with MCP SDK and vitest

- [ ] **Step 3: Add node_modules to .gitignore**

Append to `~/.claude/skills/.gitignore`:
```
chester-design-architect/enforcement/node_modules/
```

- [ ] **Step 4: Commit**

```bash
cd ~/.claude/skills
git add chester-design-architect/enforcement/package.json chester-design-architect/enforcement/package-lock.json .gitignore
git commit -m "feat: initialize enforcement MCP project"
```

---

### Task 2: Scoring Module (TDD)

**Files:**
- Create: `chester-design-architect/enforcement/scoring.js`
- Test: `chester-design-architect/enforcement/__tests__/scoring.test.js`

#### Subtask 2a: Composite Ambiguity Formula

- [ ] **Step 1: Write failing tests for composite ambiguity**

```js
// __tests__/scoring.test.js
import { describe, it, expect } from 'vitest';
import { computeCompositeAmbiguity } from '../scoring.js';

describe('computeCompositeAmbiguity', () => {
  it('returns 1.0 when all scores are 0', () => {
    const scores = {
      intent: 0, outcome: 0, scope: 0,
      constraints: 0, success: 0
    };
    expect(computeCompositeAmbiguity(scores, 'greenfield')).toBe(1.0);
  });

  it('returns 0.0 when all scores are 1.0', () => {
    const scores = {
      intent: 1, outcome: 1, scope: 1,
      constraints: 1, success: 1
    };
    expect(computeCompositeAmbiguity(scores, 'greenfield')).toBe(0.0);
  });

  it('computes greenfield formula correctly', () => {
    const scores = {
      intent: 0.8, outcome: 0.6, scope: 0.4,
      constraints: 0.2, success: 0.1
    };
    // 1 - (0.8*0.30 + 0.6*0.25 + 0.4*0.20 + 0.2*0.15 + 0.1*0.10)
    // 1 - (0.24 + 0.15 + 0.08 + 0.03 + 0.01) = 1 - 0.51 = 0.49
    expect(computeCompositeAmbiguity(scores, 'greenfield')).toBeCloseTo(0.49);
  });

  it('computes brownfield formula correctly', () => {
    const scores = {
      intent: 0.8, outcome: 0.6, scope: 0.4,
      constraints: 0.2, success: 0.1, context: 0.5
    };
    // 1 - (0.8*0.25 + 0.6*0.20 + 0.4*0.20 + 0.2*0.15 + 0.1*0.10 + 0.5*0.10)
    // 1 - (0.20 + 0.12 + 0.08 + 0.03 + 0.01 + 0.05) = 1 - 0.49 = 0.51
    expect(computeCompositeAmbiguity(scores, 'brownfield')).toBeCloseTo(0.51);
  });

  it('ignores context dimension for greenfield', () => {
    const scores = {
      intent: 1, outcome: 1, scope: 1,
      constraints: 1, success: 1, context: 0
    };
    expect(computeCompositeAmbiguity(scores, 'greenfield')).toBe(0.0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: FAIL — `scoring.js` does not exist

- [ ] **Step 3: Implement computeCompositeAmbiguity**

```js
// scoring.js

const GREENFIELD_WEIGHTS = {
  intent: 0.30, outcome: 0.25, scope: 0.20,
  constraints: 0.15, success: 0.10
};

const BROWNFIELD_WEIGHTS = {
  intent: 0.25, outcome: 0.20, scope: 0.20,
  constraints: 0.15, success: 0.10, context: 0.10
};

export function computeCompositeAmbiguity(scores, type) {
  const weights = type === 'brownfield' ? BROWNFIELD_WEIGHTS : GREENFIELD_WEIGHTS;
  let weighted = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    weighted += (scores[dim] ?? 0) * weight;
  }
  return Math.round((1 - weighted) * 1000) / 1000;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: PASS — all 5 tests

#### Subtask 2b: Input Validation

- [ ] **Step 5: Write failing tests for validation**

Add to `__tests__/scoring.test.js`:

```js
import { validateScoreSubmission } from '../scoring.js';

describe('validateScoreSubmission', () => {
  const validScores = {
    intent: { score: 0.5, justification: 'Clear user statement', gap: 'No edge cases discussed' },
    outcome: { score: 0.3, justification: 'Vague end state', gap: 'No success criteria' },
    scope: { score: 0.2, justification: 'Boundaries unclear', gap: 'In/out scope not defined' },
    constraints: { score: 0.1, justification: 'No constraints mentioned', gap: 'Technical limits unknown' },
    success: { score: 0.0, justification: 'Not discussed', gap: 'No criteria defined' }
  };

  it('accepts valid scores', () => {
    const result = validateScoreSubmission(validScores, {});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty justification', () => {
    const scores = {
      ...validScores,
      intent: { score: 0.5, justification: '', gap: 'Something missing' }
    };
    const result = validateScoreSubmission(scores, {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/justification.*intent/i);
  });

  it('rejects empty gap when score < 0.9', () => {
    const scores = {
      ...validScores,
      intent: { score: 0.5, justification: 'Valid', gap: '' }
    };
    const result = validateScoreSubmission(scores, {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/gap.*intent/i);
  });

  it('allows empty gap when score >= 0.9', () => {
    const scores = {
      ...validScores,
      intent: { score: 0.95, justification: 'Very clear', gap: '' }
    };
    const result = validateScoreSubmission(scores, {});
    expect(result.valid).toBe(true);
  });

  it('flags score jump > 0.3 as warning', () => {
    const previousScores = { intent: 0.2 };
    const scores = {
      ...validScores,
      intent: { score: 0.7, justification: 'Major clarification', gap: 'Minor gaps' }
    };
    const result = validateScoreSubmission(scores, previousScores);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/jump.*intent.*0\.2.*0\.7/i);
  });

  it('does not flag score jump <= 0.3', () => {
    const previousScores = { intent: 0.4 };
    const scores = {
      ...validScores,
      intent: { score: 0.7, justification: 'Clarification', gap: 'Minor' }
    };
    const result = validateScoreSubmission(scores, previousScores);
    expect(result.warnings).toHaveLength(0);
  });
});
```

- [ ] **Step 6: Run tests to verify new tests fail**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: FAIL — `validateScoreSubmission` not exported

- [ ] **Step 7: Implement validateScoreSubmission**

Add to `scoring.js`:

```js
export function validateScoreSubmission(scores, previousScores) {
  const errors = [];
  const warnings = [];

  for (const [dim, entry] of Object.entries(scores)) {
    if (!entry.justification || entry.justification.trim() === '') {
      errors.push(`Empty justification for ${dim}`);
    }
    if (entry.score < 0.9 && (!entry.gap || entry.gap.trim() === '')) {
      errors.push(`Empty gap description for ${dim} (score ${entry.score} < 0.9)`);
    }

    const prev = previousScores[dim];
    if (prev !== undefined && Math.abs(entry.score - prev) > 0.3) {
      warnings.push(
        `Score jump for ${dim}: ${prev} → ${entry.score} (delta ${Math.abs(entry.score - prev).toFixed(2)} > 0.3 threshold)`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: PASS — all 11 tests

#### Subtask 2c: Stage Priority

- [ ] **Step 9: Write failing tests for stage priority**

Add to `__tests__/scoring.test.js`:

```js
import { computeStagePriority } from '../scoring.js';

describe('computeStagePriority', () => {
  it('returns intent-first stage when intent/outcome/scope are weak', () => {
    const scores = {
      intent: { score: 0.3 }, outcome: { score: 0.2 }, scope: { score: 0.4 },
      constraints: { score: 0.8 }, success: { score: 0.7 }
    };
    const result = computeStagePriority(scores, 'greenfield');
    expect(result.stage).toBe('intent-first');
    expect(result.weakest.name).toBe('outcome');
    expect(result.weakest.score).toBe(0.2);
  });

  it('moves to feasibility when intent-first dimensions are strong', () => {
    const scores = {
      intent: { score: 0.8 }, outcome: { score: 0.8 }, scope: { score: 0.8 },
      constraints: { score: 0.3 }, success: { score: 0.2 }
    };
    const result = computeStagePriority(scores, 'greenfield');
    expect(result.stage).toBe('feasibility');
    expect(result.weakest.name).toBe('success');
  });

  it('moves to brownfield-grounding for brownfield when earlier stages strong', () => {
    const scores = {
      intent: { score: 0.8 }, outcome: { score: 0.8 }, scope: { score: 0.8 },
      constraints: { score: 0.8 }, success: { score: 0.8 },
      context: { score: 0.3 }
    };
    const result = computeStagePriority(scores, 'brownfield');
    expect(result.stage).toBe('brownfield-grounding');
    expect(result.weakest.name).toBe('context');
  });

  it('skips brownfield-grounding for greenfield', () => {
    const scores = {
      intent: { score: 0.8 }, outcome: { score: 0.8 }, scope: { score: 0.8 },
      constraints: { score: 0.8 }, success: { score: 0.8 }
    };
    const result = computeStagePriority(scores, 'greenfield');
    expect(result.stage).toBe('feasibility');
    expect(result.weakest.name).toBe('constraints');
  });
});
```

- [ ] **Step 10: Run tests to verify new tests fail**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: FAIL — `computeStagePriority` not exported

- [ ] **Step 11: Implement computeStagePriority**

Add to `scoring.js`:

```js
const STAGE_THRESHOLD = 0.7;

const STAGES = {
  'intent-first': ['intent', 'outcome', 'scope'],
  'feasibility': ['constraints', 'success'],
  'brownfield-grounding': ['context']
};

export function computeStagePriority(scores, type) {
  const stageOrder = type === 'brownfield'
    ? ['intent-first', 'feasibility', 'brownfield-grounding']
    : ['intent-first', 'feasibility'];

  for (const stageName of stageOrder) {
    const dims = STAGES[stageName];
    const dimScores = dims
      .filter(d => scores[d] !== undefined)
      .map(d => ({ name: d, score: scores[d].score }));

    const unsatisfied = dimScores.filter(d => d.score < STAGE_THRESHOLD);
    if (unsatisfied.length > 0) {
      unsatisfied.sort((a, b) => a.score - b.score);
      return { stage: stageName, weakest: unsatisfied[0] };
    }
  }

  // All stages satisfied — return last stage with its weakest dimension
  const lastStage = stageOrder[stageOrder.length - 1];
  const dims = STAGES[lastStage];
  const dimScores = dims
    .filter(d => scores[d] !== undefined)
    .map(d => ({ name: d, score: scores[d].score }));
  dimScores.sort((a, b) => a.score - b.score);
  return { stage: lastStage, weakest: dimScores[0] };
}
```

- [ ] **Step 12: Run tests to verify they pass**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: PASS — all 15 tests

#### Subtask 2d: Challenge Triggers and Stall Detection

- [ ] **Step 13: Write failing tests for challenge triggers and stall detection**

Add to `__tests__/scoring.test.js`:

```js
import { detectChallengeTrigger, detectStall } from '../scoring.js';

describe('detectChallengeTrigger', () => {
  it('returns none when no trigger conditions met', () => {
    const state = {
      round: 1,
      challengeModesUsed: [],
      ambiguityHistory: [1.0],
      scores: { intent: { score: 0.3 }, outcome: { score: 0.3 }, scope: { score: 0.3 } }
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBe('none');
  });

  it('triggers contrarian at round 2+', () => {
    const state = {
      round: 2,
      challengeModesUsed: [],
      ambiguityHistory: [1.0, 0.8],
      scores: { intent: { score: 0.3 }, outcome: { score: 0.3 }, scope: { score: 0.3 } }
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBe('contrarian');
  });

  it('does not re-trigger used challenge mode', () => {
    const state = {
      round: 3,
      challengeModesUsed: ['contrarian'],
      ambiguityHistory: [1.0, 0.8, 0.75],
      scores: { intent: { score: 0.5 }, outcome: { score: 0.3 }, scope: { score: 0.3 } }
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).not.toBe('contrarian');
  });

  it('triggers simplifier when scope grows faster than outcome', () => {
    const state = {
      round: 4,
      challengeModesUsed: ['contrarian'],
      ambiguityHistory: [1.0, 0.8, 0.7, 0.65],
      scoreHistory: [
        { scope: 0.2, outcome: 0.3 },
        { scope: 0.4, outcome: 0.3 },
        { scope: 0.6, outcome: 0.35 }
      ],
      scores: { scope: { score: 0.6 }, outcome: { score: 0.35 } }
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBe('simplifier');
  });

  it('triggers ontologist on stall', () => {
    const state = {
      round: 5,
      challengeModesUsed: ['contrarian', 'simplifier'],
      ambiguityHistory: [1.0, 0.5, 0.49, 0.485, 0.48],
      scoreHistory: [],
      scores: { intent: { score: 0.5 }, outcome: { score: 0.5 } },
      stall: true
    };
    const result = detectChallengeTrigger(state);
    expect(result.mode).toBe('ontologist');
  });
});

describe('detectStall', () => {
  it('returns false with fewer than 3 rounds', () => {
    expect(detectStall([1.0, 0.5])).toBe(false);
  });

  it('returns false when ambiguity is changing', () => {
    expect(detectStall([1.0, 0.8, 0.6, 0.4])).toBe(false);
  });

  it('returns true when ambiguity stalls for 3 rounds', () => {
    expect(detectStall([1.0, 0.5, 0.49, 0.485, 0.48])).toBe(true);
  });

  it('returns false when stall breaks', () => {
    expect(detectStall([1.0, 0.5, 0.49, 0.485, 0.3])).toBe(false);
  });
});
```

- [ ] **Step 14: Run tests to verify new tests fail**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: FAIL — `detectChallengeTrigger` and `detectStall` not exported

- [ ] **Step 15: Implement detectStall and detectChallengeTrigger**

Add to `scoring.js`:

```js
const STALL_THRESHOLD = 0.05;
const STALL_WINDOW = 3;

export function detectStall(ambiguityHistory) {
  if (ambiguityHistory.length < STALL_WINDOW + 1) return false;

  const recent = ambiguityHistory.slice(-STALL_WINDOW);
  const baseline = ambiguityHistory[ambiguityHistory.length - STALL_WINDOW - 1];

  return recent.every(v => Math.abs(v - baseline) < STALL_THRESHOLD);
}

export function detectChallengeTrigger(state) {
  const { round, challengeModesUsed, ambiguityHistory, stall } = state;

  // Ontologist: stall detected (highest priority challenge — breaks deadlocks)
  if (stall && !challengeModesUsed.includes('ontologist')) {
    return { mode: 'ontologist', reason: 'Ambiguity stalled for 3+ rounds' };
  }

  // Simplifier: scope expanding faster than outcome clarity
  if (!challengeModesUsed.includes('simplifier') && state.scoreHistory && state.scoreHistory.length >= 2) {
    const history = state.scoreHistory;
    const recent = history[history.length - 1];
    const earlier = history[0];
    if (recent.scope !== undefined && recent.outcome !== undefined &&
        earlier.scope !== undefined && earlier.outcome !== undefined) {
      const scopeGrowth = recent.scope - earlier.scope;
      const outcomeGrowth = recent.outcome - earlier.outcome;
      if (scopeGrowth > 0.2 && scopeGrowth > outcomeGrowth * 2) {
        return { mode: 'simplifier', reason: `Scope growing (${scopeGrowth.toFixed(2)}) faster than outcome clarity (${outcomeGrowth.toFixed(2)})` };
      }
    }
  }

  // Contrarian: round 2+ (fires earliest, lowest bar)
  if (round >= 2 && !challengeModesUsed.includes('contrarian')) {
    return { mode: 'contrarian', reason: `Round ${round} reached — core premise challenge due` };
  }

  return { mode: 'none', reason: null };
}
```

- [ ] **Step 16: Run tests to verify they pass**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: PASS — all tests

#### Subtask 2e: Closure Check

- [ ] **Step 17: Write failing tests for closure check**

Add to `__tests__/scoring.test.js`:

```js
import { checkClosure } from '../scoring.js';

describe('checkClosure', () => {
  it('permits closure when all conditions met', () => {
    const state = {
      compositeAmbiguity: 0.15,
      gates: { nonGoalsExplicit: true, decisionBoundariesExplicit: true },
      pressurePassComplete: true
    };
    expect(checkClosure(state)).toEqual({ permitted: true, reasons: [] });
  });

  it('blocks closure when ambiguity above threshold', () => {
    const state = {
      compositeAmbiguity: 0.25,
      gates: { nonGoalsExplicit: true, decisionBoundariesExplicit: true },
      pressurePassComplete: true
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons).toContain('Ambiguity 0.25 above threshold 0.20');
  });

  it('blocks closure when gates unsatisfied', () => {
    const state = {
      compositeAmbiguity: 0.10,
      gates: { nonGoalsExplicit: false, decisionBoundariesExplicit: true },
      pressurePassComplete: true
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons[0]).toMatch(/non-goals/i);
  });

  it('blocks closure when pressure pass incomplete', () => {
    const state = {
      compositeAmbiguity: 0.10,
      gates: { nonGoalsExplicit: true, decisionBoundariesExplicit: true },
      pressurePassComplete: false
    };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons[0]).toMatch(/pressure/i);
  });
});
```

- [ ] **Step 18: Run tests to verify new tests fail**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: FAIL — `checkClosure` not exported

- [ ] **Step 19: Implement checkClosure**

Add to `scoring.js`:

```js
const AMBIGUITY_THRESHOLD = 0.20;

export function checkClosure(state) {
  const reasons = [];

  if (state.compositeAmbiguity > AMBIGUITY_THRESHOLD) {
    reasons.push(`Ambiguity ${state.compositeAmbiguity} above threshold ${AMBIGUITY_THRESHOLD}`);
  }
  if (!state.gates.nonGoalsExplicit) {
    reasons.push('Non-goals not yet explicit');
  }
  if (!state.gates.decisionBoundariesExplicit) {
    reasons.push('Decision boundaries not yet explicit');
  }
  if (!state.pressurePassComplete) {
    reasons.push('Pressure pass not yet complete');
  }

  return { permitted: reasons.length === 0, reasons };
}
```

- [ ] **Step 20: Run tests to verify they pass**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/scoring.test.js`
Expected: PASS — all tests

- [ ] **Step 21: Commit**

```bash
cd ~/.claude/skills
git add chester-design-architect/enforcement/scoring.js chester-design-architect/enforcement/__tests__/scoring.test.js
git commit -m "feat: implement scoring module with validation, formulas, and challenge detection"
```

---

### Task 3: State Module (TDD)

**Files:**
- Create: `chester-design-architect/enforcement/state.js`
- Test: `chester-design-architect/enforcement/__tests__/state.test.js`

- [ ] **Step 1: Write failing tests for state initialization and update**

```js
// __tests__/state.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeState, updateState, loadState, saveState } from '../state.js';
import { existsSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('initializeState', () => {
  it('creates greenfield state with correct dimensions', () => {
    const state = initializeState('greenfield', 'Test problem statement');
    expect(state.type).toBe('greenfield');
    expect(state.round).toBe(0);
    expect(state.problemStatement).toBe('Test problem statement');
    expect(Object.keys(state.scores)).toHaveLength(5);
    expect(state.scores.context).toBeUndefined();
    expect(state.gates.nonGoalsExplicit).toBe(false);
    expect(state.gates.decisionBoundariesExplicit).toBe(false);
    expect(state.pressurePassComplete).toBe(false);
    expect(state.challengeModesUsed).toEqual([]);
    expect(state.ambiguityHistory).toEqual([]);
    expect(state.scoreHistory).toEqual([]);
  });

  it('creates brownfield state with context dimension', () => {
    const state = initializeState('brownfield', 'Test');
    expect(Object.keys(state.scores)).toHaveLength(6);
    expect(state.scores.context).toBeDefined();
  });
});

describe('updateState', () => {
  it('increments round and updates scores', () => {
    let state = initializeState('greenfield', 'Test');
    const newScores = {
      intent: { score: 0.5, justification: 'Clear', gap: 'Edge cases' },
      outcome: { score: 0.3, justification: 'Vague', gap: 'No criteria' },
      scope: { score: 0.2, justification: 'Unclear', gap: 'Boundaries' },
      constraints: { score: 0.1, justification: 'None', gap: 'Unknown' },
      success: { score: 0.0, justification: 'N/A', gap: 'Not discussed' }
    };
    state = updateState(state, newScores, {});
    expect(state.round).toBe(1);
    expect(state.scores.intent.score).toBe(0.5);
    expect(state.ambiguityHistory).toHaveLength(1);
    expect(state.scoreHistory).toHaveLength(1);
  });

  it('updates gate evidence', () => {
    let state = initializeState('greenfield', 'Test');
    const scores = {
      intent: { score: 0.5, justification: 'x', gap: 'y' },
      outcome: { score: 0.3, justification: 'x', gap: 'y' },
      scope: { score: 0.2, justification: 'x', gap: 'y' },
      constraints: { score: 0.1, justification: 'x', gap: 'y' },
      success: { score: 0.0, justification: 'x', gap: 'y' }
    };
    state = updateState(state, scores, { nonGoalsAddressed: true });
    expect(state.gates.nonGoalsExplicit).toBe(true);
    expect(state.gates.decisionBoundariesExplicit).toBe(false);
  });

  it('records pressure pass when follow-up provided', () => {
    let state = initializeState('greenfield', 'Test');
    const scores = {
      intent: { score: 0.5, justification: 'x', gap: 'y' },
      outcome: { score: 0.3, justification: 'x', gap: 'y' },
      scope: { score: 0.2, justification: 'x', gap: 'y' },
      constraints: { score: 0.1, justification: 'x', gap: 'y' },
      success: { score: 0.0, justification: 'x', gap: 'y' }
    };
    state = updateState(state, scores, { pressureFollowUp: { originalRound: 2 } });
    expect(state.pressurePassComplete).toBe(true);
  });
});

describe('saveState / loadState', () => {
  const testDir = join(tmpdir(), 'enforcement-test-' + Date.now());
  const testFile = join(testDir, 'test-state.json');

  beforeEach(() => mkdirSync(testDir, { recursive: true }));
  afterEach(() => rmSync(testDir, { recursive: true, force: true }));

  it('round-trips state through file', () => {
    const state = initializeState('brownfield', 'Round-trip test');
    saveState(state, testFile);
    expect(existsSync(testFile)).toBe(true);
    const loaded = loadState(testFile);
    expect(loaded).toEqual(state);
  });

  it('throws on missing file', () => {
    expect(() => loadState(join(testDir, 'nonexistent.json'))).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/state.test.js`
Expected: FAIL — `state.js` does not exist

- [ ] **Step 3: Implement state module**

```js
// state.js
import { readFileSync, writeFileSync } from 'fs';
import { computeCompositeAmbiguity, computeStagePriority, detectStall, detectChallengeTrigger } from './scoring.js';

const DIMENSIONS_GREENFIELD = ['intent', 'outcome', 'scope', 'constraints', 'success'];
const DIMENSIONS_BROWNFIELD = [...DIMENSIONS_GREENFIELD, 'context'];

export function initializeState(type, problemStatement) {
  const dims = type === 'brownfield' ? DIMENSIONS_BROWNFIELD : DIMENSIONS_GREENFIELD;
  const scores = {};
  for (const dim of dims) {
    scores[dim] = { score: 0, justification: '', gap: '' };
  }

  return {
    type,
    round: 0,
    problemStatement,
    problemStatementRevised: false,
    scores,
    gates: {
      nonGoalsExplicit: false,
      decisionBoundariesExplicit: false
    },
    pressurePassComplete: false,
    challengeModesUsed: [],
    ambiguityHistory: [],
    scoreHistory: [],
    challengeLog: [],
    pressureTracking: []
  };
}

export function updateState(state, newScores, gateEvidence) {
  const updated = structuredClone(state);
  updated.round += 1;

  // Update scores
  for (const [dim, entry] of Object.entries(newScores)) {
    if (updated.scores[dim] !== undefined) {
      updated.scores[dim] = entry;
    }
  }

  // Compute and record ambiguity
  const flatScores = {};
  for (const [dim, entry] of Object.entries(updated.scores)) {
    flatScores[dim] = entry.score;
  }
  const ambiguity = computeCompositeAmbiguity(flatScores, updated.type);
  updated.compositeAmbiguity = ambiguity;
  updated.ambiguityHistory.push(ambiguity);

  // Record score snapshot for history
  const snapshot = {};
  for (const [dim, entry] of Object.entries(updated.scores)) {
    snapshot[dim] = entry.score;
  }
  updated.scoreHistory.push(snapshot);

  // Update gates
  if (gateEvidence.nonGoalsAddressed) {
    updated.gates.nonGoalsExplicit = true;
  }
  if (gateEvidence.decisionBoundariesAddressed) {
    updated.gates.decisionBoundariesExplicit = true;
  }
  if (gateEvidence.pressureFollowUp) {
    updated.pressurePassComplete = true;
    updated.pressureTracking.push(gateEvidence.pressureFollowUp);
  }

  // Detect stall
  updated.stall = detectStall(updated.ambiguityHistory);

  // Compute stage priority
  const priority = computeStagePriority(updated.scores, updated.type);
  updated.currentStage = priority.stage;
  updated.weakestDimension = priority.weakest;

  // Detect challenge trigger
  const challenge = detectChallengeTrigger(updated);
  updated.pendingChallenge = challenge;

  // Check closure
  const closureState = {
    compositeAmbiguity: updated.compositeAmbiguity,
    gates: updated.gates,
    pressurePassComplete: updated.pressurePassComplete
  };
  // Import inline to avoid circular — actually checkClosure is in scoring.js, import at top
  // We'll compute closure in server.js instead to keep state.js focused
  
  return updated;
}

export function markChallengeUsed(state, mode) {
  const updated = structuredClone(state);
  updated.challengeModesUsed.push(mode);
  updated.challengeLog.push({ mode, round: updated.round });
  return updated;
}

export function saveState(state, filePath) {
  writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function loadState(filePath) {
  const data = readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run __tests__/state.test.js`
Expected: PASS — all tests

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/skills
git add chester-design-architect/enforcement/state.js chester-design-architect/enforcement/__tests__/state.test.js
git commit -m "feat: implement state module with init, update, persist, and load"
```

---

### Task 4: MCP Server

**Files:**
- Create: `chester-design-architect/enforcement/server.js`

- [ ] **Step 1: Implement MCP server with three tools**

```js
// server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  computeCompositeAmbiguity,
  validateScoreSubmission,
  computeStagePriority,
  detectChallengeTrigger,
  detectStall,
  checkClosure
} from './scoring.js';
import { initializeState, updateState, markChallengeUsed, saveState, loadState } from './state.js';

const server = new Server(
  { name: 'chester-enforcement', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(
  { method: 'tools/list' },
  async () => ({
    tools: [
      {
        name: 'initialize_interview',
        description: 'Initialize a new interview with fresh scoring state. Call once at the start of a design interview.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['greenfield', 'brownfield'],
              description: 'Whether the project targets an existing codebase (brownfield) or is new (greenfield)'
            },
            problem_statement: {
              type: 'string',
              description: 'The confirmed problem statement from round one'
            },
            state_file: {
              type: 'string',
              description: 'Absolute path where interview state will be persisted'
            }
          },
          required: ['type', 'problem_statement', 'state_file']
        }
      },
      {
        name: 'submit_scores',
        description: 'Submit dimension scores for the current round. Call once per round after the user responds. Returns computed state including composite ambiguity, challenge triggers, and closure status.',
        inputSchema: {
          type: 'object',
          properties: {
            state_file: {
              type: 'string',
              description: 'Absolute path to the interview state file'
            },
            scores: {
              type: 'object',
              description: 'Dimension scores. Each key is a dimension name, value is { score: 0.0-1.0, justification: string, gap: string }',
              additionalProperties: {
                type: 'object',
                properties: {
                  score: { type: 'number', minimum: 0, maximum: 1 },
                  justification: { type: 'string' },
                  gap: { type: 'string' }
                },
                required: ['score', 'justification', 'gap']
              }
            },
            gate_evidence: {
              type: 'object',
              description: 'Evidence for readiness gates addressed this round',
              properties: {
                non_goals_addressed: { type: 'boolean' },
                decision_boundaries_addressed: { type: 'boolean' },
                pressure_follow_up: {
                  type: 'object',
                  properties: { original_round: { type: 'number' } },
                  nullable: true
                }
              }
            },
            challenge_used: {
              type: 'string',
              enum: ['contrarian', 'simplifier', 'ontologist'],
              description: 'If a challenge mode was used this round, which one',
              nullable: true
            }
          },
          required: ['state_file', 'scores']
        }
      },
      {
        name: 'get_state',
        description: 'Read current interview state. Use for resume or to check status without submitting scores.',
        inputSchema: {
          type: 'object',
          properties: {
            state_file: {
              type: 'string',
              description: 'Absolute path to the interview state file'
            }
          },
          required: ['state_file']
        }
      }
    ]
  })
);

server.setRequestHandler(
  { method: 'tools/call' },
  async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'initialize_interview': {
          const state = initializeState(args.type, args.problem_statement);
          saveState(state, args.state_file);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'initialized',
                type: args.type,
                dimensions: Object.keys(state.scores),
                state_file: args.state_file
              }, null, 2)
            }]
          };
        }

        case 'submit_scores': {
          let state = loadState(args.state_file);

          // Extract previous scores for jump detection
          const previousScores = {};
          for (const [dim, entry] of Object.entries(state.scores)) {
            previousScores[dim] = entry.score;
          }

          // Validate
          const validation = validateScoreSubmission(args.scores, previousScores);
          if (!validation.valid) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'rejected',
                  errors: validation.errors,
                  warnings: validation.warnings
                }, null, 2)
              }],
              isError: true
            };
          }

          // Map gate evidence
          const gateEvidence = {
            nonGoalsAddressed: args.gate_evidence?.non_goals_addressed ?? false,
            decisionBoundariesAddressed: args.gate_evidence?.decision_boundaries_addressed ?? false,
            pressureFollowUp: args.gate_evidence?.pressure_follow_up
              ? { originalRound: args.gate_evidence.pressure_follow_up.original_round }
              : null
          };

          // Update state
          state = updateState(state, args.scores, gateEvidence);

          // Mark challenge if used
          if (args.challenge_used) {
            state = markChallengeUsed(state, args.challenge_used);
          }

          // Check closure
          const closure = checkClosure({
            compositeAmbiguity: state.compositeAmbiguity,
            gates: state.gates,
            pressurePassComplete: state.pressurePassComplete
          });

          // Persist
          saveState(state, args.state_file);

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'accepted',
                round: state.round,
                composite_ambiguity: state.compositeAmbiguity,
                weakest_dimension: state.weakestDimension,
                current_stage: state.currentStage,
                gates: {
                  non_goals_explicit: state.gates.nonGoalsExplicit,
                  decision_boundaries_explicit: state.gates.decisionBoundariesExplicit,
                  pressure_pass_complete: state.pressurePassComplete
                },
                challenge_trigger: state.pendingChallenge,
                stall_detected: state.stall,
                closure_permitted: closure.permitted,
                closure_reasons: closure.reasons,
                warnings: validation.warnings
              }, null, 2)
            }]
          };
        }

        case 'get_state': {
          const state = loadState(args.state_file);
          const closure = checkClosure({
            compositeAmbiguity: state.compositeAmbiguity ?? 1.0,
            gates: state.gates,
            pressurePassComplete: state.pressurePassComplete
          });
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                ...state,
                closure_permitted: closure.permitted,
                closure_reasons: closure.reasons
              }, null, 2)
            }]
          };
        }

        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true
          };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 2: Run all tests to verify nothing is broken**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run`
Expected: PASS — all tests from scoring and state modules

- [ ] **Step 3: Verify server starts without errors**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}},"id":1}' | timeout 3 node server.js 2>/dev/null || true`
Expected: JSON-RPC response with server info (or clean timeout — no crash)

- [ ] **Step 4: Commit**

```bash
cd ~/.claude/skills
git add chester-design-architect/enforcement/server.js
git commit -m "feat: implement enforcement MCP server with initialize, submit_scores, and get_state tools"
```

---

### Task 5: MCP Registration

**Files:**
- Create or modify: `~/.claude/skills/.mcp.json`

- [ ] **Step 1: Create project-level MCP registration**

Create `~/.claude/skills/.mcp.json`:

```json
{
  "mcpServers": {
    "chester-enforcement": {
      "command": "node",
      "args": ["chester-design-architect/enforcement/server.js"],
      "cwd": "/home/mike/.claude/skills"
    }
  }
}
```

Note: For cross-project use, the user should also add to their global Claude Code config. This will be documented in the SKILL.md.

- [ ] **Step 2: Verify registration is picked up**

Restart Claude Code (or start a new session) and verify `chester-enforcement` tools appear in the available tools list. The tools should be named:
- `mcp__chester-enforcement__initialize_interview`
- `mcp__chester-enforcement__submit_scores`
- `mcp__chester-enforcement__get_state`

- [ ] **Step 3: Commit**

```bash
cd ~/.claude/skills
git add .mcp.json
git commit -m "feat: register enforcement MCP server for project-level use"
```

---

### Task 6: Write SKILL.md v2

**Files:**
- Replace: `chester-design-architect/SKILL.md`

- [ ] **Step 1: Write complete SKILL.md v2**

Replace the entire contents of `chester-design-architect/SKILL.md` with the following. This is the complete skill — conversational flow like figure-out, with enforcement mechanism integration.

````markdown
---
name: chester-design-architect
description: "Quantitatively-disciplined Socratic discovery with objective scoring, enforcement gating, and challenge modes. Parallel alternative to chester-design-figure-out."
---

## Budget Guard Check

Before proceeding with this skill, check the token budget:

1. Run: `cat ~/.claude/usage.json 2>/dev/null | jq -r '.five_hour_used_pct // empty'`
2. If the file is missing or the command fails: log "Budget guard: usage data unavailable" and continue
3. If the file exists, check staleness via `.timestamp` — if more than 60 seconds old, log "Budget guard: usage data stale" and continue
4. Read threshold: `cat ~/.claude/settings.chester.json 2>/dev/null | jq -r '.budget_guard.threshold_percent // 85'`
5. If `five_hour_used_pct >= threshold`: **STOP** and display the pause-and-report, then wait for user response
6. If below threshold: continue normally

**Pause-and-report format:**

> **Budget Guard — Pausing**
>
> **5-hour usage:** {pct}% (threshold: {threshold}%)
> **Resets in:** {countdown from five_hour_resets_at}
>
> **Completed tasks:** {list}
> **Current task:** {current}
> **Remaining tasks:** {list}
>
> **Options:** (1) Continue anyway, (2) Stop here, (3) Other

# Socratic Discovery with Quantitative Discipline

A single-agent Socratic interview with objective scoring discipline. You ask questions. An enforcement mechanism tracks clarity scores, detects stalls, triggers challenges, and gates closure — all deterministically, in code, not in your head.

The user experiences one thoughtful architect asking good questions. The scoring machinery is invisible.

Parallel alternative to `chester-design-figure-out`. Same pipeline position, same downstream transition, compatible artifacts plus a third (process evidence).

<HARD-GATE>
If there are open design questions, you MUST resolve them through this skill before proceeding. Do not assume answers to design questions. Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until the design is resolved and the user has approved it.
</HARD-GATE>

## Anti-Pattern Check

If you think this is too simple for discovery, check: are there design decisions embedded in this task that you're making implicitly? If yes, surface them. If the task is genuinely mechanical (rename, move, delete with no design choices), this skill doesn't apply.

## Checklist

**Task reset (do first, do not track):** Before creating any tasks, call TaskList. If any tasks exist from a previous skill, delete them all via TaskUpdate with status: `deleted`.

You MUST create a task for each of these items and complete them in order:

1. **Sprint setup** — read project config, establish four-word sprint name, construct sprint subdirectory name, `clear_thinking_history()`
2. **Explore project context** — check files, docs, recent commits relevant to the idea
3. **Round one** — present problem statement (WHAT/WHY), user confirms, initialize enforcement mechanism
4. **Interview loop** — per-turn scoring cycle until closure conditions met
5. **Closure** — multi-confirmation, write three artifacts, update lessons table, transition to chester-design-specify

## Role: Software Architect

You are a Software Architect conducting a design interview. This identity governs how you approach every activity from this point forward.

- **Read code as design history** — patterns, boundaries, and connections are evidence of decisions someone made, not inventory to catalogue
- **Think in trade-offs** — balance technical concerns against goals, current state against future needs; never optimize a single axis
- **Evaluate boundaries as choices** — existing structure is the result of prior design decisions, not immutable constraints
- **Operate across abstraction levels** — move fluidly between "what should this achieve" and "what does the user actually need" — never to "how would we build it"
- **Align architecture to intent** — link every structural decision back to what the human is trying to accomplish

---

## Phase 1: Administrative Setup

- Read project config:
  ```bash
  eval "$(~/.claude/skills/chester-util-config/chester-config-read.sh)"
  ```
- Establish four-word sprint name (lowercase, hyphenated) for file naming
- Construct sprint subdirectory name: `YYYYMMDD-##-word-word-word-word`
- `clear_thinking_history()` to reset structured thinking for the session
- Read `~/.chester/thinking.md` if it exists. Scan the lessons table — highest-scoring lessons first. Treat them as signals to hold initial assumptions more loosely in those categories, not as rules. If the file does not exist, continue without it.
- Create the sprint working directory structure:
  ```bash
  mkdir -p "{CHESTER_WORK_DIR}/{sprint-subdir}/design"
  ```

---

## Phase 2: Round One

Round one is setup. No enforcement calls yet.

1. Explore codebase for relevant context. Classify **brownfield** (existing codebase target) vs **greenfield**.
2. For brownfield, collect relevant codebase context before questioning.
3. Present a refined problem statement in two parts:
   - **WHAT** the user wants to achieve
   - **WHY** this is relevant to the current architecture and design
   - Include neutral domain-language facts from code exploration
   - It is NOT a HOW, not a solution structure, and not a decision inventory
4. User confirms or corrects the problem statement. If the user corrects, revise and re-present.
5. `capture_thought()` with tag `problem-statement`, stage `Problem Definition`.
6. Initialize the enforcement mechanism:

   Call `initialize_interview` with:
   - `type`: greenfield or brownfield (from step 1)
   - `problem_statement`: the confirmed statement
   - `state_file`: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/{sprint-name}-enforcement-state.json`

7. Full interview loop starts with the user's first design-relevant response.

---

## Phase 3: Interview Loop

One cycle runs per user response. You are a single agent performing all roles: researcher, analyst, pessimist, and interviewer.

### Per-Turn Flow

After each user response:

**Step 1: Capture thinking.**
If a trigger point is met, call `capture_thought`:
- Problem statement confirmed → tag: `problem-statement`, stage: `Problem Definition`
- Line of thinking shifts → tag by new topic, stage: `Analysis`
- User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
- Complex decision node (3+ viable options) → tag by topic, stage: `Analysis` or `Synthesis`

**Step 2: Score dimensions.**
Assess each clarity dimension on a 0.0–1.0 scale. For each dimension, determine:
- **Score**: how clear this dimension is right now (0 = unknown, 1 = fully resolved)
- **Justification**: why this score — what evidence supports it (cannot be empty)
- **Gap**: what's still missing (cannot be empty if score < 0.9)

Call `submit_scores` with:
- `state_file`: path to the enforcement state file
- `scores`: all dimension scores with justifications and gaps
- `gate_evidence`: whether non-goals, decision boundaries, or pressure follow-up were addressed this round
- `challenge_used`: if you used a challenge mode this round, which one

**Step 3: Read enforcement response.**
The enforcement mechanism returns:
- `composite_ambiguity` — the computed score (you do not compute this yourself)
- `weakest_dimension` — name and score of the dimension needing most attention
- `current_stage` — which stage priority group is active
- `gates` — readiness gate status
- `challenge_trigger` — `none`, `contrarian`, `simplifier`, or `ontologist` with reason
- `stall_detected` — whether ambiguity has plateaued
- `closure_permitted` — whether all closure conditions are met
- `warnings` — any score jump flags

**Step 4: Apply priority rule.**
Choose your next question target using this hardcoded priority (not discretionary):

1. **Challenge mode trigger** — if the enforcement mechanism says a challenge is due, your next question IS the challenge
2. **Foundational untested assumption** — if you identify an assumption whose falsity would collapse the design
3. **Codebase contradiction** — if exploration reveals something that directly contradicts the user's stated intent
4. **Weakest dimension** — the enforcement mechanism's reported weakest dimension within the current stage
5. **Coverage rotation** — next unaddressed dimension

**Step 5: Formulate question.**
Select from the six question types (see Visible Surface). Apply the translation gate. Construct thinking block + question.

**Step 6: Present to user.**
Output thinking block, then bold question.

### Challenge Modes

Three modes, each fires once per interview. Triggered mechanically by the enforcement mechanism.

| Mode | Trigger | Effect |
|------|---------|--------|
| Contrarian | Round 2+ OR foundational untested assumption | Challenge the core premise of the stated approach |
| Simplifier | Scope expanding faster than outcome clarity | Probe minimal viable scope |
| Ontologist | Stall detected (ambiguity < ±0.05 for 3 rounds) OR symptom-level reasoning | Force essence-level reframing |

When triggered, your next question MUST be the challenge — it overrides normal dimension targeting. After asking the challenge question, report it via `challenge_used` in the next `submit_scores` call.

### Checkpoints (Every 5 Rounds)

Pause and summarize:
- What has been resolved so far
- What remains open
- Where the conversation seems to be heading

All in domain language — no scores, gates, or dimension names.

Offer the user an exit opportunity, noting in domain terms which topics haven't been addressed and what that means for downstream work.

**Drift check:** Compare the conversation trajectory against the confirmed problem statement. If the conversation has wandered, reorient the next question. If the problem statement itself was wrong, surface it to the user.

---

## Visible Surface

### Thinking Block (Before Each Question)

Three components, all italic single-sentence lines:

1. **Alignment check** (1-2 sentences) — summarize your understanding of the current design state so the user can correct drift immediately.

2. **Metacognitive reflection** (1-2 sentences) — selected from rotating angles:
   - What did this answer change about the design, and why does that matter?
   - What existing decision in the architecture does this touch or silently depend on?
   - What is the most fragile assumption in the current thinking?
   - Where does this sit uncomfortably against the current state of the system?
   - What is the single most important thing this interview still needs to resolve?

3. **Transparency of intent** (1 sentence) — why this question is being asked now.

### Prohibited Content in Thinking Block

- Dimension names or scores (intent clarity, outcome clarity, etc.)
- Gate names or gate status (non-goals explicit, decision boundaries, pressure pass)
- Challenge mode names (Contrarian, Simplifier, Ontologist)
- Enforcement mechanism references (submit_scores, composite ambiguity, etc.)
- Priority rule references

### Six Question Types

One question per turn. Always in bold. After the thinking block.

- **Clarifying** — "What do you mean by X?" May offer a recommended answer when codebase or context makes one evident.
- **Assumption-probing** — "What are you taking for granted here?" May recommend when the assumption appears sound based on evidence.
- **Evidence/reasoning** — "What makes you think that?" No recommendation — testing the user's grounding.
- **Viewpoint/perspective** — "What would someone who disagrees say?" No recommendation.
- **Implication/consequence** — "If that's true, what follows?" No recommendation.
- **Meta** — "Is this the right question to be asking?" No recommendation.

The recommendation policy is a calibration signal: if recommending answers to most questions, the interview is rubber-stamping rather than discovering.

### Translation Gate

Mandatory on every question, including challenge mode questions:

1. **Strip all code vocabulary.** Type names, class names, property names, method names, file paths, module names — remove them all. Use only domain concepts.
2. **Litmus test:** Could a product manager who understands the domain but has never opened this codebase answer this question?
3. If no, translate further or discard and find the design question underneath.

### Research Boundary

Code exploration is your private work.

- **Explore freely** — read as much code as you need to understand the design landscape
- **Digest internally** — convert findings into domain concepts, relationships, and tensions
- **Never relay raw findings** — type names, property shapes, class hierarchies, and implementation details do not appear in questions, thinking, or the design brief

If the user needs a code-specific term to answer a question, you have failed to translate.

### Structured Thinking Protocol

Use `capture_thought` / `get_thinking_summary` for positional retrieval against the U-shaped context attention curve.

**Capture triggers:**
1. Problem statement established → tag: `problem-statement`, stage: `Problem Definition`
2. Line of thinking changes → tag by new topic, stage: `Analysis`
3. User rejects or corrects → tag: `constraint` + topic, stage: `Constraint`
4. Complex decision node (3+ viable options) → tag by topic, stage: `Analysis` or `Synthesis`

**Retrieval triggers — call `get_thinking_summary` before:**
- The user asks for a recap or summary
- You are about to write the design brief (closure)
- You are about to make a recommendation that depends on earlier analysis

### Behavioral Constraints

- One question per turn — no multi-question messages
- Never assume an answer — if making a design decision without asking, stop and ask
- Recommended answers must be honest — only recommend when genuinely confident
- When the user's answer contradicts your internal model, update the model — don't argue
- Use the codebase to answer questions you can discover yourself — don't ask the user what you can look up
- **Implementation drift** — if your question involves where something should live, how it should be structured, or what pattern to use, you have drifted. Apply the Research Boundary and Translation Gate. Reframe toward intent.
- **Pessimist stance** — continuously evaluate whether the design has uncomfortable truths, unstated assumptions, or hidden complexity. Surface these through questions, not declarations.

---

## Closure Protocol

### When Thinking Recommends Closure

No candidate question clears the materiality threshold — weakest dimension, most significant finding, and sharpest concern are all below consequence level.

### Enforcement Mechanism Must Confirm

Call `submit_scores` one final time. The response must show `closure_permitted: true`. This requires:
- Ambiguity below 0.20
- All three readiness gates satisfied (non-goals explicit, decision boundaries explicit, pressure pass complete)

If `closure_permitted: false`, the interview continues. Surface the reason in domain terms without referencing gates or scores: "We haven't discussed what's out of scope yet" or "There's a question about whether we've circled back on an earlier answer."

### Forced Crystallization

Round 20 hard cap. Crystallize with residual risk notes describing which areas remain underspecified, in domain terms.

### Early Exit

After the first assumption probe and at least one persistent follow-up (ensuring minimum rigor), the user may exit at any checkpoint. Note unsatisfied conditions in domain terms. Record residual risk in the design brief.

### Stall Recovery

1. Stall detected → Ontologist fires (if available)
2. Ontologist already used → present a checkpoint asking whether the interview is stuck because the design is genuinely ambiguous at this level, or because the questions aren't reaching the right topic

---

## Resume Protocol

If interrupted:
1. Retrieve thinking summary via `get_thinking_summary()`
2. Call `get_state` with the state file path to reload enforcement state
3. Pick up from the last completed round
4. User does not re-answer questions

---

## Phase 4: Closure

1. `get_thinking_summary()` to produce the consolidated decision history
2. Reformat the thinking summary into a clean document. Hold in memory.
3. Present the completed design brief to the user — each decision with conclusion and rationale
4. "Does this capture what we're building?"
5. Invoke `chester-util-worktree` to create the branch and worktree. The branch name is the sprint subdirectory name.
6. Read project config in the worktree context:
   ```bash
   eval "$(~/.claude/skills/chester-util-config/chester-config-read.sh)"
   ```
7. Create the output directory structure in the worktree: `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/`, `spec/`, `plan/`, `summary/`
8. Create matching structure in main tree: `{CHESTER_WORK_DIR}/{sprint-subdir}/design/`, `spec/`, `plan/`, `summary/`
9. Write design brief to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-design-00.md` (worktree)
10. Write thinking summary to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-thinking-00.md` (worktree)
11. Write process evidence to `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/{sprint-name}-process-00.md` (worktree). Compile from the enforcement state file: interview profile, drift assessments, challenge mode firings, readiness gate satisfaction, closure decision. Human-readable narrative — stories, not scores.
12. Copy all three artifacts to `{CHESTER_WORK_DIR}/{sprint-subdir}/design/`
13. Commit thinking summary, design brief, and process evidence in worktree with message: `checkpoint: design complete`
14. Update `~/.chester/thinking.md` — review the Key Reasoning Shifts from the session. For each shift, determine whether it matches an existing lesson (increment score by 1) or is a new lesson (add as a new row with score 1, category `—`). If the table exceeds 20 rows, drop the lowest-scoring entry. Present proposed changes to the user and confirm before writing. If the file does not exist, create it with the table header and the first entries.
15. Transition to chester-design-specify

## Output Artifacts

Three artifacts in `{CHESTER_PLANS_DIR}/{sprint-subdir}/design/`:

1. **`{sprint-name}-design-00.md`** — Design brief (WHAT). Domain language. Intent, outcome, in-scope, out-of-scope, decision boundaries, constraints, acceptance criteria, assumptions tested, residual risks.

2. **`{sprint-name}-thinking-00.md`** — Thinking summary (HOW decisions were made). Domain language. Decision history, alternatives considered, user corrections, confidence levels, problem statement shifts.

3. **`{sprint-name}-process-00.md`** — Process evidence (HOW the interview operated). Human-readable narrative. Where challenges fired, how gates were satisfied, where drift was caught, how the interview self-corrected. Compiled from the enforcement mechanism's state at closure.

## File Naming Convention

Sprint name: `YYYYMMDD-##-word-word-word-word` — used for both the branch name and the directory name.

File naming: `{word-word-word-word}-{artifact}-{nn}.md`
- nn: `00` is the original, `01`, `02`, `03` for subsequent versions

## Integration

- **Invoked by:** user directly (as alternative to `chester-design-figure-out`)
- **Transitions to:** chester-design-specify (always — specifications are always produced)
- **May use:** chester-plan-attack (adversarial review of design), chester-plan-smell (code smell review)
- **Does NOT transition to:** chester-plan-build (must go through spec first)
````

- [ ] **Step 2: Verify SKILL.md renders correctly**

Read back the file and confirm:
- Frontmatter has updated description
- All sections present: Budget Guard, Checklist, Role, Phases 1-4, Visible Surface, Closure, Resume, Artifacts, Integration
- Enforcement mechanism tool names match the MCP server implementation
- No sprint 01 references (no subagent dispatch, no role templates)

- [ ] **Step 3: Commit**

```bash
cd ~/.claude/skills
git add chester-design-architect/SKILL.md
git commit -m "feat: rewrite SKILL.md to single-agent flow with enforcement mechanism"
```

---

### Task 7: Clean Up Sprint 01 Files

**Files:**
- Delete: `chester-design-architect/researcher-prompt.md`
- Delete: `chester-design-architect/analyst-prompt.md`
- Delete: `chester-design-architect/pessimist-prompt.md`
- Delete: `chester-design-architect/adversary-prompt.md`
- Delete: `chester-design-architect/architect-prompt.md`

- [ ] **Step 1: Remove sprint 01 subagent templates**

```bash
cd ~/.claude/skills
git rm chester-design-architect/researcher-prompt.md chester-design-architect/analyst-prompt.md chester-design-architect/pessimist-prompt.md chester-design-architect/adversary-prompt.md chester-design-architect/architect-prompt.md
```

- [ ] **Step 2: Verify spec-reviewer.md is still present**

Run: `ls ~/.claude/skills/chester-design-architect/spec-reviewer.md`
Expected: file exists

- [ ] **Step 3: Commit**

```bash
cd ~/.claude/skills
git commit -m "chore: remove sprint 01 subagent templates"
```

---

### Task 8: Update chester-setup-start Description

**Files:**
- Modify: `chester-setup-start/SKILL.md`

- [ ] **Step 1: Update the architect skill description**

In `chester-setup-start/SKILL.md`, find the line:
```
- `chester-design-architect` — Quantitatively-disciplined Socratic discovery with pipeline-based peer analysis, adversarial gating, and problem-validity checking
```

Replace with:
```
- `chester-design-architect` — Quantitatively-disciplined Socratic discovery with objective scoring, enforcement gating, and challenge modes
```

This matches the updated frontmatter description in the architect SKILL.md.

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/skills
git add chester-setup-start/SKILL.md
git commit -m "chore: update architect skill description in setup-start"
```

---

### Task 9: Validation

No files created — this is a manual verification task.

- [ ] **Step 1: Run all enforcement tests**

Run: `cd ~/.claude/skills/chester-design-architect/enforcement && npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Verify directory structure**

Run: `ls -la ~/.claude/skills/chester-design-architect/`
Expected:
```
SKILL.md
spec-reviewer.md
enforcement/
```
No subagent template files.

- [ ] **Step 3: Verify enforcement directory**

Run: `ls -la ~/.claude/skills/chester-design-architect/enforcement/`
Expected:
```
__tests__/
node_modules/
package.json
package-lock.json
scoring.js
server.js
state.js
```

- [ ] **Step 4: Verify MCP registration**

Run: `cat ~/.claude/skills/.mcp.json`
Expected: JSON with `chester-enforcement` server entry

- [ ] **Step 5: End-to-end smoke test**

Run the enforcement MCP manually to verify the full scoring cycle:

```bash
cd ~/.claude/skills/chester-design-architect/enforcement
# This is a manual check — start a new Claude Code session and verify:
# 1. chester-enforcement tools appear in available tools
# 2. initialize_interview creates a state file
# 3. submit_scores validates, computes, and returns state
# 4. get_state returns persisted state
```

- [ ] **Step 6: Commit final state**

```bash
cd ~/.claude/skills
git add -A
git status  # verify nothing unexpected
git commit -m "feat: chester-design-architect v2 complete — enforcement mechanism + single-agent flow"
```
