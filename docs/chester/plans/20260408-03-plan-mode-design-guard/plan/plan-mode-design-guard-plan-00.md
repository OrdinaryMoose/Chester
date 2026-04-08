# Experimental Design Skill with Formal Proof Language — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use execute-write (recommended) or execute-write in inline mode to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `design-experimental` — an experimental Chester skill that replaces behavioral prohibitions with Plan Mode (Phase 1) and a formal design proof language (Phase 2).

**Architecture:** Clean 4-module MCP with 3-tool surface. `proof.js` owns element model and integrity checks, `metrics.js` owns completeness and challenge triggers, `state.js` owns lifecycle and persistence, `server.js` is thin wiring. The skill is a fork of `design-figure-out` with Phase 1 simplified (no MCP, Plan Mode active) and Phase 2 replaced (proof-building instead of enforcement scoring).

**Tech Stack:** Node.js (ES modules), @modelcontextprotocol/sdk, vitest

---

### Task 1: Package Configuration

**Files:**
- Create: `skills/design-experimental/proof-mcp/package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "chester-design-proof",
  "version": "1.0.0",
  "type": "module",
  "description": "Design proof MCP server for chester-design-experimental",
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

Run: `cd skills/design-experimental/proof-mcp && npm install`
Expected: `node_modules/` created, no errors

- [ ] **Step 3: Verify node_modules is gitignored**

Run: `git check-ignore -q skills/design-experimental/proof-mcp/node_modules 2>/dev/null && echo IGNORED || echo NOT_IGNORED`

If NOT_IGNORED, add to `.gitignore`:
```
skills/design-experimental/proof-mcp/node_modules/
```

- [ ] **Step 4: Commit**

```bash
git add skills/design-experimental/proof-mcp/package.json skills/design-experimental/proof-mcp/package-lock.json
git commit -m "feat: add package.json for design proof MCP server"
```

---

### Task 2: Element Model and Integrity Checks (proof.js + tests)

**Files:**
- Create: `skills/design-experimental/proof-mcp/proof.js`
- Create: `skills/design-experimental/proof-mcp/__tests__/proof.test.js`

- [ ] **Step 1: Write failing tests for element creation**

```js
// __tests__/proof.test.js
import { describe, it, expect } from 'vitest';
import {
  ELEMENT_TYPES,
  createElement,
  validateBasisRefs,
  traverseBasisChain,
  checkWithdrawnBasis,
  checkBoundaryCollision,
  checkConfidenceInversion,
  checkStaleDependency,
  checkAllIntegrity,
} from '../proof.js';

describe('ELEMENT_TYPES', () => {
  it('contains all seven types', () => {
    expect(ELEMENT_TYPES).toEqual([
      'GIVEN', 'CONSTRAINT', 'ASSERTION', 'DECISION', 'OPEN', 'RISK', 'BOUNDARY',
    ]);
  });
});

describe('createElement', () => {
  it('creates a valid GIVEN element', () => {
    const el = createElement({
      type: 'GIVEN',
      statement: 'The system uses five prohibition layers',
      source: 'codebase',
      basis: [],
    }, 'G1', 1);
    expect(el.id).toBe('G1');
    expect(el.type).toBe('GIVEN');
    expect(el.status).toBe('active');
    expect(el.addedInRound).toBe(1);
    expect(el.revision).toBe(0);
  });

  it('rejects missing statement', () => {
    expect(() => createElement({
      type: 'GIVEN',
      statement: '',
      source: 'codebase',
      basis: [],
    }, 'G1', 1)).toThrow(/statement/i);
  });

  it('rejects invalid type', () => {
    expect(() => createElement({
      type: 'INVALID',
      statement: 'Something',
      source: 'agent',
      basis: [],
    }, 'X1', 1)).toThrow(/type/i);
  });

  it('requires confidence for ASSERTION', () => {
    expect(() => createElement({
      type: 'ASSERTION',
      statement: 'Prohibitions degrade over time',
      source: 'agent',
      basis: ['G1'],
    }, 'A1', 1)).toThrow(/confidence/i);
  });

  it('accepts ASSERTION with confidence', () => {
    const el = createElement({
      type: 'ASSERTION',
      statement: 'Prohibitions degrade over time',
      source: 'agent',
      basis: ['G1'],
      confidence: 0.8,
    }, 'A1', 1);
    expect(el.confidence).toBe(0.8);
  });

  it('requires over field for DECISION (can be empty array)', () => {
    const el = createElement({
      type: 'DECISION',
      statement: 'Use Plan Mode as floor',
      source: 'agent',
      basis: ['A1'],
      over: [],
    }, 'D1', 2);
    expect(el.over).toEqual([]);
  });

  it('requires reason for BOUNDARY', () => {
    expect(() => createElement({
      type: 'BOUNDARY',
      statement: 'Compaction hooks are out of scope',
      source: 'agent',
      basis: [],
    }, 'B1', 1)).toThrow(/reason/i);
  });

  it('accepts BOUNDARY with reason', () => {
    const el = createElement({
      type: 'BOUNDARY',
      statement: 'Compaction hooks are out of scope',
      source: 'agent',
      basis: [],
      reason: 'Avoid compounding experimental features',
    }, 'B1', 1);
    expect(el.reason).toBe('Avoid compounding experimental features');
  });
});

describe('validateBasisRefs', () => {
  it('returns empty errors when all refs exist', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', status: 'active' },
    };
    expect(validateBasisRefs(['G1'], elements)).toEqual([]);
  });

  it('returns error for non-existent ref', () => {
    const errors = validateBasisRefs(['X99'], {});
    expect(errors.length).toBe(1);
    expect(errors[0]).toMatch(/X99/);
  });
});

describe('traverseBasisChain', () => {
  it('returns all reachable IDs for a linear chain', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active' },
      C1: { id: 'C1', type: 'CONSTRAINT', basis: ['G1'], status: 'active' },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['C1'], status: 'active' },
    };
    const chain = traverseBasisChain(elements, 'A1');
    expect(chain).toContain('C1');
    expect(chain).toContain('G1');
    expect(chain).not.toContain('A1');
  });

  it('handles cycles without infinite loop', () => {
    const elements = {
      A1: { id: 'A1', type: 'ASSERTION', basis: ['A2'], status: 'active' },
      A2: { id: 'A2', type: 'ASSERTION', basis: ['A1'], status: 'active' },
    };
    const chain = traverseBasisChain(elements, 'A1');
    expect(chain).toContain('A2');
    // Should terminate — no infinite loop
  });

  it('skips withdrawn elements', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'withdrawn' },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['G1'], status: 'active' },
    };
    const chain = traverseBasisChain(elements, 'A1');
    expect(chain).not.toContain('G1');
  });
});

describe('checkWithdrawnBasis', () => {
  it('flags active element citing withdrawn element', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'withdrawn' },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['G1'], status: 'active' },
    };
    const warnings = checkWithdrawnBasis(elements);
    expect(warnings.length).toBe(1);
    expect(warnings[0].type).toBe('withdrawn-basis');
    expect(warnings[0].element_id).toBe('A1');
    expect(warnings[0].cited_id).toBe('G1');
  });

  it('no warning when all basis active', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active' },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['G1'], status: 'active' },
    };
    expect(checkWithdrawnBasis(elements)).toHaveLength(0);
  });
});

describe('checkBoundaryCollision', () => {
  it('flags DECISION whose basis chain overlaps a BOUNDARY basis', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active' },
      B1: { id: 'B1', type: 'BOUNDARY', basis: ['G1'], status: 'active' },
      D1: { id: 'D1', type: 'DECISION', basis: ['G1'], over: [], status: 'active' },
    };
    const warnings = checkBoundaryCollision(elements);
    expect(warnings.length).toBe(1);
    expect(warnings[0].type).toBe('boundary-collision');
    expect(warnings[0].shared_id).toBe('G1');
  });

  it('no warning when no overlap', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active' },
      G2: { id: 'G2', type: 'GIVEN', basis: [], status: 'active' },
      B1: { id: 'B1', type: 'BOUNDARY', basis: ['G1'], status: 'active' },
      D1: { id: 'D1', type: 'DECISION', basis: ['G2'], over: [], status: 'active' },
    };
    expect(checkBoundaryCollision(elements)).toHaveLength(0);
  });
});

describe('checkConfidenceInversion', () => {
  it('flags high-confidence ASSERTION built on low-confidence', () => {
    const elements = {
      A1: { id: 'A1', type: 'ASSERTION', basis: [], confidence: 0.3, status: 'active' },
      A2: { id: 'A2', type: 'ASSERTION', basis: ['A1'], confidence: 0.8, status: 'active' },
    };
    const warnings = checkConfidenceInversion(elements);
    expect(warnings.length).toBe(1);
    expect(warnings[0].type).toBe('confidence-inversion');
    expect(warnings[0].element_id).toBe('A2');
    expect(warnings[0].low_confidence_id).toBe('A1');
  });

  it('no warning when confidence is consistent', () => {
    const elements = {
      A1: { id: 'A1', type: 'ASSERTION', basis: [], confidence: 0.8, status: 'active' },
      A2: { id: 'A2', type: 'ASSERTION', basis: ['A1'], confidence: 0.9, status: 'active' },
    };
    expect(checkConfidenceInversion(elements)).toHaveLength(0);
  });
});

describe('checkStaleDependency', () => {
  it('flags downstream element not updated after basis revision', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active', revisedInRound: 3 },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['G1'], status: 'active', revisedInRound: null },
    };
    const warnings = checkStaleDependency(elements);
    expect(warnings.length).toBe(1);
    expect(warnings[0].type).toBe('stale-dependency');
    expect(warnings[0].element_id).toBe('A1');
    expect(warnings[0].stale_basis_id).toBe('G1');
  });

  it('no warning when downstream updated after basis', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active', revisedInRound: 3 },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['G1'], status: 'active', revisedInRound: 4 },
    };
    expect(checkStaleDependency(elements)).toHaveLength(0);
  });
});

describe('checkAllIntegrity', () => {
  it('returns combined warnings from all checks', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'withdrawn' },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['G1'], confidence: 0.8, status: 'active', revisedInRound: null },
    };
    const warnings = checkAllIntegrity(elements);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.type === 'withdrawn-basis')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-experimental/proof-mcp && npx vitest run __tests__/proof.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Implement proof.js**

```js
// proof.js — Element model and integrity checks for the design proof MCP.
// Pure functions — no I/O.

export const ELEMENT_TYPES = [
  'GIVEN', 'CONSTRAINT', 'ASSERTION', 'DECISION', 'OPEN', 'RISK', 'BOUNDARY',
];

// ── Element Creation ─────────────────────────────────────────────

export function createElement(input, id, round) {
  if (!ELEMENT_TYPES.includes(input.type)) {
    throw new Error(`Invalid element type: ${input.type}`);
  }
  if (!input.statement || input.statement.trim() === '') {
    throw new Error('Element statement is required');
  }
  if (input.type === 'ASSERTION' && (input.confidence === undefined || input.confidence === null)) {
    throw new Error('ASSERTION requires confidence (0.0-1.0)');
  }
  if (input.type === 'DECISION' && !Array.isArray(input.over)) {
    throw new Error('DECISION requires over field (array of rejected alternatives)');
  }
  if (input.type === 'BOUNDARY' && (!input.reason || input.reason.trim() === '')) {
    throw new Error('BOUNDARY requires reason');
  }

  return {
    id,
    type: input.type,
    statement: input.statement,
    source: input.source || 'agent',
    basis: input.basis || [],
    over: input.over || [],
    confidence: input.confidence ?? null,
    reason: input.reason || null,
    status: 'active',
    resolvedBy: null,
    addedInRound: round,
    revisedInRound: null,
    revision: 0,
  };
}

// ── Basis Reference Validation ───────────────────────────────────

export function validateBasisRefs(basis, elements) {
  const errors = [];
  for (const ref of basis) {
    if (!elements[ref]) {
      errors.push(`Basis reference '${ref}' does not exist in proof`);
    }
  }
  return errors;
}

// ── Basis Chain Traversal ────────────────────────────────────────

export function traverseBasisChain(elements, startId) {
  const visited = new Set();
  const queue = [];

  const startEl = elements[startId];
  if (!startEl) return [];

  for (const ref of (startEl.basis || [])) {
    queue.push(ref);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const el = elements[current];
    if (!el || el.status === 'withdrawn') continue;

    for (const ref of (el.basis || [])) {
      if (!visited.has(ref)) {
        queue.push(ref);
      }
    }
  }

  return [...visited];
}

// ── Integrity Checks ─────────────────────────────────────────────

export function checkWithdrawnBasis(elements) {
  const warnings = [];
  for (const el of Object.values(elements)) {
    if (el.status !== 'active') continue;
    for (const ref of (el.basis || [])) {
      const cited = elements[ref];
      if (cited && cited.status === 'withdrawn') {
        warnings.push({
          type: 'withdrawn-basis',
          element_id: el.id,
          cited_id: ref,
          message: `${el.id} cites ${ref} which has been withdrawn`,
        });
      }
    }
  }
  return warnings;
}

export function checkBoundaryCollision(elements) {
  const warnings = [];
  const boundaries = Object.values(elements).filter(
    e => e.type === 'BOUNDARY' && e.status === 'active'
  );
  const decisions = Object.values(elements).filter(
    e => e.type === 'DECISION' && e.status === 'active'
  );

  for (const boundary of boundaries) {
    const boundaryChain = new Set([
      ...traverseBasisChain(elements, boundary.id),
      ...(boundary.basis || []),
    ]);

    for (const decision of decisions) {
      const decisionChain = new Set([
        ...traverseBasisChain(elements, decision.id),
        ...(decision.basis || []),
      ]);

      for (const id of boundaryChain) {
        if (decisionChain.has(id)) {
          warnings.push({
            type: 'boundary-collision',
            element_id: decision.id,
            boundary_id: boundary.id,
            shared_id: id,
            message: `${decision.id} and ${boundary.id} share basis element ${id}`,
          });
          break; // one warning per decision-boundary pair
        }
      }
    }
  }
  return warnings;
}

export function checkConfidenceInversion(elements) {
  const warnings = [];
  const HIGH_THRESHOLD = 0.7;
  const LOW_THRESHOLD = 0.4;

  for (const el of Object.values(elements)) {
    if (el.type !== 'ASSERTION' || el.status !== 'active') continue;
    if (el.confidence < HIGH_THRESHOLD) continue;

    const chain = traverseBasisChain(elements, el.id);
    for (const ref of chain) {
      const cited = elements[ref];
      if (cited && cited.type === 'ASSERTION' && cited.confidence < LOW_THRESHOLD) {
        warnings.push({
          type: 'confidence-inversion',
          element_id: el.id,
          low_confidence_id: ref,
          message: `${el.id} (confidence ${el.confidence}) depends on ${ref} (confidence ${cited.confidence})`,
        });
        break; // one warning per high-confidence element
      }
    }
  }
  return warnings;
}

export function checkStaleDependency(elements) {
  const warnings = [];

  for (const el of Object.values(elements)) {
    if (el.status !== 'active' || !el.revisedInRound) continue;

    // Find active downstream elements that cite this one
    for (const downstream of Object.values(elements)) {
      if (downstream.status !== 'active') continue;
      if (downstream.id === el.id) continue;
      if (!(downstream.basis || []).includes(el.id)) continue;

      // Downstream not updated after this element was revised
      if (!downstream.revisedInRound || downstream.revisedInRound < el.revisedInRound) {
        warnings.push({
          type: 'stale-dependency',
          element_id: downstream.id,
          stale_basis_id: el.id,
          message: `${downstream.id} cites ${el.id} which was revised in round ${el.revisedInRound} but ${downstream.id} has not been updated`,
        });
      }
    }
  }
  return warnings;
}

export function checkAllIntegrity(elements) {
  return [
    ...checkWithdrawnBasis(elements),
    ...checkBoundaryCollision(elements),
    ...checkConfidenceInversion(elements),
    ...checkStaleDependency(elements),
  ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-experimental/proof-mcp && npx vitest run __tests__/proof.test.js`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-experimental/proof-mcp/proof.js skills/design-experimental/proof-mcp/__tests__/proof.test.js
git commit -m "feat: add element model and integrity checks for design proof MCP"
```

---

### Task 3: Completeness, Challenges, and Closure (metrics.js + tests)

**Files:**
- Create: `skills/design-experimental/proof-mcp/metrics.js`
- Create: `skills/design-experimental/proof-mcp/__tests__/metrics.test.js`

- [ ] **Step 1: Write failing tests**

```js
// __tests__/metrics.test.js
import { describe, it, expect } from 'vitest';
import {
  computeCompleteness,
  computeBasisCoverage,
  detectChallenge,
  detectStall,
  checkClosure,
} from '../metrics.js';

describe('computeCompleteness', () => {
  it('returns all zeros for empty proof', () => {
    const result = computeCompleteness({});
    expect(result.total_elements).toBe(0);
    expect(result.open_count).toBe(0);
    expect(result.boundary_count).toBe(0);
  });

  it('counts elements by type and status correctly', () => {
    const elements = {
      G1: { type: 'GIVEN', status: 'active' },
      G2: { type: 'GIVEN', status: 'active' },
      C1: { type: 'CONSTRAINT', status: 'active' },
      O1: { type: 'OPEN', status: 'active' },
      O2: { type: 'OPEN', status: 'resolved' },
      B1: { type: 'BOUNDARY', status: 'active' },
      D1: { type: 'DECISION', status: 'active', over: ['alt1'] },
    };
    const result = computeCompleteness(elements);
    expect(result.total_elements).toBe(7);
    expect(result.active_elements).toBe(6);
    expect(result.open_count).toBe(1); // only active OPENs
    expect(result.boundary_count).toBe(1);
    expect(result.decisions_with_alternatives).toBe(1);
  });

  it('does not count resolved OPENs in open_count', () => {
    const elements = {
      O1: { type: 'OPEN', status: 'resolved' },
      O2: { type: 'OPEN', status: 'resolved' },
    };
    const result = computeCompleteness(elements);
    expect(result.open_count).toBe(0);
  });
});

describe('computeBasisCoverage', () => {
  it('returns 1.0 when all chains terminate at GIVENs', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active' },
      D1: { id: 'D1', type: 'DECISION', basis: ['G1'], over: [], status: 'active' },
    };
    expect(computeBasisCoverage(elements)).toBe(1.0);
  });

  it('returns < 1.0 when chain ends at ASSERTION', () => {
    const elements = {
      A1: { id: 'A1', type: 'ASSERTION', basis: [], confidence: 0.5, status: 'active' },
      D1: { id: 'D1', type: 'DECISION', basis: ['A1'], over: [], status: 'active' },
    };
    expect(computeBasisCoverage(elements)).toBeLessThan(1.0);
  });

  it('returns 1.0 when no DECISIONs exist', () => {
    const elements = {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active' },
    };
    expect(computeBasisCoverage(elements)).toBe(1.0);
  });
});

describe('detectStall', () => {
  it('returns false with fewer than 4 entries', () => {
    expect(detectStall([3, 3, 3])).toBe(false);
  });

  it('returns true when open count unchanged for 3 rounds', () => {
    expect(detectStall([5, 3, 3, 3, 3])).toBe(true);
  });

  it('returns false when open count is decreasing', () => {
    expect(detectStall([5, 4, 3, 2])).toBe(false);
  });
});

describe('detectChallenge', () => {
  it('returns null at round 1', () => {
    const state = {
      round: 1,
      elements: {},
      openCountHistory: [0],
      elementCountHistory: [0],
      challengeModesUsed: [],
    };
    expect(detectChallenge(state).mode).toBeNull();
  });

  it('fires Contrarian when ASSERTION lacks designer GIVEN in chain', () => {
    const state = {
      round: 2,
      elements: {
        G1: { id: 'G1', type: 'GIVEN', source: 'codebase', basis: [], status: 'active' },
        A1: { id: 'A1', type: 'ASSERTION', source: 'agent', basis: ['G1'], confidence: 0.8, status: 'active' },
      },
      openCountHistory: [1, 1],
      elementCountHistory: [1, 2],
      challengeModesUsed: [],
    };
    const result = detectChallenge(state);
    expect(result.mode).toBe('contrarian');
  });

  it('does not fire Contrarian when designer GIVEN exists in chain', () => {
    const state = {
      round: 2,
      elements: {
        G1: { id: 'G1', type: 'GIVEN', source: 'designer', basis: [], status: 'active' },
        A1: { id: 'A1', type: 'ASSERTION', source: 'agent', basis: ['G1'], confidence: 0.8, status: 'active' },
      },
      openCountHistory: [1, 1],
      elementCountHistory: [1, 2],
      challengeModesUsed: [],
    };
    const result = detectChallenge(state);
    expect(result.mode).not.toBe('contrarian');
  });

  it('does not re-fire used Contrarian', () => {
    const state = {
      round: 2,
      elements: {
        G1: { id: 'G1', type: 'GIVEN', source: 'codebase', basis: [], status: 'active' },
        A1: { id: 'A1', type: 'ASSERTION', source: 'agent', basis: ['G1'], confidence: 0.8, status: 'active' },
      },
      openCountHistory: [1, 1],
      elementCountHistory: [1, 2],
      challengeModesUsed: ['contrarian'],
    };
    expect(detectChallenge(state).mode).not.toBe('contrarian');
  });

  it('fires Simplifier when elements grow by 3+ with no OPEN decrease', () => {
    const state = {
      round: 3,
      elements: {},
      openCountHistory: [2, 2, 2],
      elementCountHistory: [3, 5, 8],
      challengeModesUsed: [],
    };
    const result = detectChallenge(state);
    expect(result.mode).toBe('simplifier');
  });

  it('does not fire Simplifier when growth is 1', () => {
    const state = {
      round: 3,
      elements: {},
      openCountHistory: [2, 2, 2],
      elementCountHistory: [3, 4, 5],
      challengeModesUsed: [],
    };
    // Growth is only 1 per round — below threshold of 3
    const result = detectChallenge(state);
    expect(result.mode).not.toBe('simplifier');
  });

  it('fires Ontologist on 3-round stall', () => {
    const state = {
      round: 5,
      elements: {},
      openCountHistory: [3, 2, 2, 2, 2],
      elementCountHistory: [5, 6, 7, 8, 9],
      challengeModesUsed: ['contrarian', 'simplifier'],
    };
    const result = detectChallenge(state);
    expect(result.mode).toBe('ontologist');
  });
});

describe('checkClosure', () => {
  const makeClosableState = () => ({
    round: 4,
    phaseTransitionRound: 0,
    elements: {
      G1: { id: 'G1', type: 'GIVEN', basis: [], status: 'active', source: 'designer', revisedInRound: null },
      C1: { id: 'C1', type: 'CONSTRAINT', basis: ['G1'], status: 'active', revisedInRound: null },
      A1: { id: 'A1', type: 'ASSERTION', basis: ['G1'], confidence: 0.8, status: 'active', revisedInRound: 2 },
      D1: { id: 'D1', type: 'DECISION', basis: ['C1'], over: ['alternative A'], status: 'active', revisedInRound: null },
      B1: { id: 'B1', type: 'BOUNDARY', basis: [], status: 'active', reason: 'Out of scope', revisedInRound: null },
    },
  });

  it('permits closure when all conditions met', () => {
    const result = checkClosure(makeClosableState());
    expect(result.permitted).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('blocks closure when active OPEN exists', () => {
    const state = makeClosableState();
    state.elements.O1 = { id: 'O1', type: 'OPEN', basis: [], status: 'active', revisedInRound: null };
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.some(r => /open/i.test(r))).toBe(true);
  });

  it('blocks closure when no BOUNDARY', () => {
    const state = makeClosableState();
    delete state.elements.B1;
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.some(r => /boundary/i.test(r))).toBe(true);
  });

  it('blocks closure when no DECISION with alternatives', () => {
    const state = makeClosableState();
    state.elements.D1.over = [];
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.some(r => /alternative/i.test(r))).toBe(true);
  });

  it('blocks closure when no revision after designer interaction', () => {
    const state = makeClosableState();
    state.elements.A1.revisedInRound = null;
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.some(r => /revis/i.test(r))).toBe(true);
  });

  it('blocks closure when round < 3', () => {
    const state = makeClosableState();
    state.round = 2;
    const result = checkClosure(state);
    expect(result.permitted).toBe(false);
    expect(result.reasons.some(r => /round/i.test(r))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-experimental/proof-mcp && npx vitest run __tests__/metrics.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Implement metrics.js**

```js
// metrics.js — Completeness, challenge triggers, and closure for the design proof MCP.
// Pure functions — no I/O.

import { traverseBasisChain } from './proof.js';

// ── Completeness ─────────────────────────────────────────────────

export function computeCompleteness(elements) {
  const all = Object.values(elements);
  const active = all.filter(e => e.status === 'active');

  return {
    total_elements: all.length,
    active_elements: active.length,
    open_count: active.filter(e => e.type === 'OPEN').length,
    boundary_count: active.filter(e => e.type === 'BOUNDARY').length,
    decisions_with_alternatives: active.filter(
      e => e.type === 'DECISION' && (e.over || []).length > 0
    ).length,
    revision_count: all.filter(e => e.revisedInRound !== null && e.revisedInRound !== undefined).length,
  };
}

export function computeBasisCoverage(elements) {
  const decisions = Object.values(elements).filter(
    e => e.type === 'DECISION' && e.status === 'active'
  );
  if (decisions.length === 0) return 1.0;

  const TERMINAL_TYPES = new Set(['GIVEN', 'CONSTRAINT']);
  let covered = 0;

  for (const decision of decisions) {
    const chain = traverseBasisChain(elements, decision.id);
    // Check that every leaf in the chain is a GIVEN or CONSTRAINT
    const leaves = chain.filter(id => {
      const el = elements[id];
      return el && (el.basis || []).length === 0;
    });

    const allTerminal = leaves.length > 0 && leaves.every(id => {
      const el = elements[id];
      return el && TERMINAL_TYPES.has(el.type);
    });

    if (allTerminal) covered++;
  }

  return Math.round((covered / decisions.length) * 100) / 100;
}

// ── Stall Detection ──────────────────────────────────────────────

const STALL_WINDOW = 3;

export function detectStall(openCountHistory) {
  if (openCountHistory.length < STALL_WINDOW + 1) return false;

  const recent = openCountHistory.slice(-STALL_WINDOW - 1);
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] !== recent[i - 1]) return false;
  }
  return true;
}

// ── Challenge Triggers ───────────────────────────────────────────

export function detectChallenge(state) {
  const { round, elements, openCountHistory, elementCountHistory, challengeModesUsed } = state;
  const used = new Set(challengeModesUsed);

  // Ontologist: stall detected (open count unchanged for 3 rounds)
  if (!used.has('ontologist') && detectStall(openCountHistory)) {
    return { mode: 'ontologist', reason: 'Open questions are not being resolved — reframe the problem space' };
  }

  // Simplifier: element count grew by 3+ and open count did not decrease
  if (!used.has('simplifier') && elementCountHistory.length >= 2) {
    const prevCount = elementCountHistory[elementCountHistory.length - 2];
    const currCount = elementCountHistory[elementCountHistory.length - 1];
    const growth = currCount - prevCount;

    const prevOpen = openCountHistory[openCountHistory.length - 2] ?? 0;
    const currOpen = openCountHistory[openCountHistory.length - 1] ?? 0;
    const openReduction = prevOpen - currOpen;

    if (growth >= 3 && openReduction <= 0) {
      return { mode: 'simplifier', reason: 'Scope is expanding without resolving existing questions' };
    }
  }

  // Contrarian: any ASSERTION with no designer-sourced GIVEN in basis chain
  if (!used.has('contrarian') && round >= 2) {
    const assertions = Object.values(elements).filter(
      e => e.type === 'ASSERTION' && e.status === 'active'
    );

    for (const assertion of assertions) {
      const chain = traverseBasisChain(elements, assertion.id);
      const hasDesignerGiven = chain.some(id => {
        const el = elements[id];
        return el && el.type === 'GIVEN' && el.source === 'designer';
      });

      if (!hasDesignerGiven) {
        return {
          mode: 'contrarian',
          reason: `Assertion ${assertion.id} has no designer-confirmed basis — untested assumption`,
        };
      }
    }
  }

  return { mode: null, reason: null };
}

// ── Closure ──────────────────────────────────────────────────────

const MIN_ROUNDS = 3;

export function checkClosure(state) {
  const reasons = [];
  const { elements, round, phaseTransitionRound } = state;
  const active = Object.values(elements).filter(e => e.status === 'active');

  // Condition 0: minimum rounds
  if (round < MIN_ROUNDS) {
    reasons.push(`Only ${round} rounds completed (minimum ${MIN_ROUNDS})`);
  }

  // Condition 1: zero active OPENs
  const activeOpens = active.filter(e => e.type === 'OPEN');
  if (activeOpens.length > 0) {
    reasons.push(`${activeOpens.length} active open question(s) remaining`);
  }

  // Condition 2: full basis coverage
  const coverage = computeBasisCoverage(elements);
  if (coverage < 1.0) {
    reasons.push(`Basis coverage is ${coverage} — some decisions lack complete chains to established facts`);
  }

  // Condition 3: at least one BOUNDARY
  const boundaries = active.filter(e => e.type === 'BOUNDARY');
  if (boundaries.length === 0) {
    reasons.push('No boundary elements — what is explicitly out of scope has not been stated');
  }

  // Condition 4: at least one DECISION with alternatives
  const decisionsWithAlts = active.filter(
    e => e.type === 'DECISION' && (e.over || []).length > 0
  );
  if (decisionsWithAlts.length === 0) {
    reasons.push('No decision has documented alternatives that were considered');
  }

  // Condition 5: at least one revision after designer interaction
  const revisedAfterTransition = Object.values(elements).some(
    e => e.revisedInRound !== null && e.revisedInRound !== undefined &&
         e.revisedInRound > (phaseTransitionRound || 0)
  );
  if (!revisedAfterTransition) {
    reasons.push('No element has been revised after designer interaction — the proof was not pressure-tested');
  }

  return { permitted: reasons.length === 0, reasons };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-experimental/proof-mcp && npx vitest run __tests__/metrics.test.js`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-experimental/proof-mcp/metrics.js skills/design-experimental/proof-mcp/__tests__/metrics.test.js
git commit -m "feat: add completeness metrics, challenge triggers, and closure checks"
```

---

### Task 4: State Lifecycle (state.js + tests)

**Files:**
- Create: `skills/design-experimental/proof-mcp/state.js`
- Create: `skills/design-experimental/proof-mcp/__tests__/state.test.js`

- [ ] **Step 1: Write failing tests**

```js
// __tests__/state.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initializeState,
  generateId,
  applyOperations,
  markChallengeUsed,
  saveState,
  loadState,
} from '../state.js';

let tempDir;
let stateFile;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'proof-test-'));
  stateFile = join(tempDir, 'test-proof-state.json');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('initializeState', () => {
  it('creates clean state with round 0', () => {
    const state = initializeState('Test problem statement');
    expect(state.round).toBe(0);
    expect(state.problemStatement).toBe('Test problem statement');
    expect(Object.keys(state.elements)).toHaveLength(0);
  });

  it('initializes empty histories', () => {
    const state = initializeState('Test');
    expect(state.openCountHistory).toEqual([]);
    expect(state.elementCountHistory).toEqual([]);
    expect(state.challengeModesUsed).toEqual([]);
    expect(state.revisionLog).toEqual([]);
  });
});

describe('generateId', () => {
  it('generates correct format for GIVEN', () => {
    const state = initializeState('Test');
    const [id, updated] = generateId(state, 'GIVEN');
    expect(id).toBe('G1');
    expect(updated.elementCounters.GIVEN).toBe(1);
  });

  it('increments counter per type', () => {
    let state = initializeState('Test');
    let id;
    [id, state] = generateId(state, 'GIVEN');
    expect(id).toBe('G1');
    [id, state] = generateId(state, 'GIVEN');
    expect(id).toBe('G2');
    [id, state] = generateId(state, 'CONSTRAINT');
    expect(id).toBe('C1');
  });
});

describe('applyOperations', () => {
  it('adds a new element', () => {
    const state = initializeState('Test');
    const ops = [
      { action: 'add', type: 'GIVEN', statement: 'A fact', source: 'designer', basis: [] },
    ];
    const result = applyOperations(state, ops);
    expect(Object.keys(result.state.elements)).toHaveLength(1);
    expect(result.added).toEqual(['G1']);
    expect(result.state.round).toBe(1);
  });

  it('does not mutate original state', () => {
    const state = initializeState('Test');
    const ops = [
      { action: 'add', type: 'GIVEN', statement: 'A fact', source: 'designer', basis: [] },
    ];
    applyOperations(state, ops);
    expect(Object.keys(state.elements)).toHaveLength(0);
    expect(state.round).toBe(0);
  });

  it('resolves an OPEN', () => {
    let state = initializeState('Test');
    state = applyOperations(state, [
      { action: 'add', type: 'GIVEN', statement: 'Fact', source: 'designer', basis: [] },
      { action: 'add', type: 'OPEN', statement: 'Question?', basis: [] },
    ]).state;
    state = applyOperations(state, [
      { action: 'add', type: 'DECISION', statement: 'Answer', basis: ['G1'], over: ['alt'] },
      { action: 'resolve', element_id: 'O1', resolved_by: 'D1' },
    ]).state;
    expect(state.elements.O1.status).toBe('resolved');
    expect(state.elements.O1.resolvedBy).toBe('D1');
  });

  it('revises an element', () => {
    let state = initializeState('Test');
    state = applyOperations(state, [
      { action: 'add', type: 'GIVEN', statement: 'Original', source: 'agent', basis: [] },
    ]).state;
    state = applyOperations(state, [
      { action: 'revise', element_id: 'G1', statement: 'Updated' },
    ]).state;
    expect(state.elements.G1.statement).toBe('Updated');
    expect(state.elements.G1.revision).toBe(1);
    expect(state.elements.G1.revisedInRound).toBe(2);
  });

  it('withdraws an element', () => {
    let state = initializeState('Test');
    state = applyOperations(state, [
      { action: 'add', type: 'GIVEN', statement: 'Wrong', source: 'agent', basis: [] },
    ]).state;
    state = applyOperations(state, [
      { action: 'withdraw', element_id: 'G1' },
    ]).state;
    expect(state.elements.G1.status).toBe('withdrawn');
  });

  it('processes operations sequentially (add then resolve in one batch)', () => {
    let state = initializeState('Test');
    state = applyOperations(state, [
      { action: 'add', type: 'GIVEN', statement: 'Fact', source: 'designer', basis: [] },
      { action: 'add', type: 'OPEN', statement: 'Question?', basis: [] },
    ]).state;

    const result = applyOperations(state, [
      { action: 'add', type: 'DECISION', statement: 'Answer', basis: ['G1'], over: [] },
      { action: 'resolve', element_id: 'O1', resolved_by: 'D1' },
    ]);
    expect(result.state.elements.O1.status).toBe('resolved');
    expect(result.added).toContain('D1');
    expect(result.resolved).toContain('O1');
  });

  it('rejects add with non-existent basis', () => {
    const state = initializeState('Test');
    const result = applyOperations(state, [
      { action: 'add', type: 'ASSERTION', statement: 'Claim', source: 'agent', basis: ['X99'], confidence: 0.8 },
    ]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/X99/);
  });
});

describe('markChallengeUsed', () => {
  it('adds mode to used list', () => {
    const state = initializeState('Test');
    const updated = markChallengeUsed(state, 'contrarian');
    expect(updated.challengeModesUsed).toContain('contrarian');
    expect(updated.challengeLog).toHaveLength(1);
  });

  it('does not mutate original', () => {
    const state = initializeState('Test');
    markChallengeUsed(state, 'contrarian');
    expect(state.challengeModesUsed).toHaveLength(0);
  });
});

describe('saveState / loadState', () => {
  it('round-trips state through JSON', () => {
    let state = initializeState('Test problem');
    state = applyOperations(state, [
      { action: 'add', type: 'GIVEN', statement: 'A fact', source: 'designer', basis: [] },
    ]).state;
    saveState(state, stateFile);
    const loaded = loadState(stateFile);
    expect(loaded.problemStatement).toBe('Test problem');
    expect(loaded.round).toBe(1);
    expect(Object.keys(loaded.elements)).toHaveLength(1);
  });

  it('preserves ID counters across save/load', () => {
    let state = initializeState('Test');
    state = applyOperations(state, [
      { action: 'add', type: 'GIVEN', statement: 'Fact 1', source: 'designer', basis: [] },
      { action: 'add', type: 'GIVEN', statement: 'Fact 2', source: 'designer', basis: [] },
    ]).state;
    saveState(state, stateFile);
    const loaded = loadState(stateFile);
    const [id] = generateId(loaded, 'GIVEN');
    expect(id).toBe('G3');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd skills/design-experimental/proof-mcp && npx vitest run __tests__/state.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Implement state.js**

```js
// state.js — State lifecycle and persistence for the design proof MCP.

import { readFileSync, writeFileSync } from 'fs';
import { createElement, validateBasisRefs, checkAllIntegrity } from './proof.js';
import { computeCompleteness, computeBasisCoverage, detectChallenge, checkClosure } from './metrics.js';

const ID_PREFIX = { GIVEN: 'G', CONSTRAINT: 'C', ASSERTION: 'A', DECISION: 'D', OPEN: 'O', RISK: 'R', BOUNDARY: 'B' };

// ── Initialize ───────────────────────────────────────────────────

export function initializeState(problemStatement) {
  return {
    round: 0,
    problemStatement,
    elements: {},
    elementCounters: { GIVEN: 0, CONSTRAINT: 0, ASSERTION: 0, DECISION: 0, OPEN: 0, RISK: 0, BOUNDARY: 0 },
    openCountHistory: [],
    elementCountHistory: [],
    challengeModesUsed: [],
    challengeLog: [],
    revisionLog: [],
    phaseTransitionRound: 0,
  };
}

// ── ID Generation ────────────────────────────────────────────────

export function generateId(state, type) {
  const next = structuredClone(state);
  next.elementCounters[type] += 1;
  const id = `${ID_PREFIX[type]}${next.elementCounters[type]}`;
  return [id, next];
}

// ── Apply Operations ─────────────────────────────────────────────

export function applyOperations(state, operations) {
  let next = structuredClone(state);
  next.round += 1;

  const added = [];
  const resolved = [];
  const revised = [];
  const withdrawn = [];
  const errors = [];

  for (const op of operations) {
    switch (op.action) {
      case 'add': {
        // Validate basis refs against current state
        const basisErrors = validateBasisRefs(op.basis || [], next.elements);
        if (basisErrors.length > 0) {
          errors.push(...basisErrors.map(e => `add: ${e}`));
          continue;
        }

        let id;
        [id, next] = generateId(next, op.type);

        try {
          const el = createElement(op, id, next.round);
          next.elements[id] = el;
          added.push(id);
        } catch (err) {
          errors.push(`add: ${err.message}`);
        }
        break;
      }

      case 'resolve': {
        const target = next.elements[op.element_id];
        if (!target) {
          errors.push(`resolve: element '${op.element_id}' not found`);
          continue;
        }
        if (target.type !== 'OPEN' || target.status !== 'active') {
          errors.push(`resolve: '${op.element_id}' is not an active OPEN`);
          continue;
        }
        const resolvedByEl = next.elements[op.resolved_by];
        if (!resolvedByEl) {
          errors.push(`resolve: resolved_by '${op.resolved_by}' not found`);
          continue;
        }
        next.elements[op.element_id] = {
          ...target,
          status: 'resolved',
          resolvedBy: op.resolved_by,
        };
        resolved.push(op.element_id);
        break;
      }

      case 'revise': {
        const target = next.elements[op.element_id];
        if (!target) {
          errors.push(`revise: element '${op.element_id}' not found`);
          continue;
        }
        if (target.status !== 'active') {
          errors.push(`revise: '${op.element_id}' is not active`);
          continue;
        }

        const prior = target.statement;
        next.elements[op.element_id] = {
          ...target,
          statement: op.statement ?? target.statement,
          basis: op.basis ?? target.basis,
          over: op.over ?? target.over,
          confidence: op.confidence ?? target.confidence,
          revision: target.revision + 1,
          revisedInRound: next.round,
        };
        next.revisionLog.push({
          elementId: op.element_id,
          round: next.round,
          priorStatement: prior,
        });
        revised.push(op.element_id);
        break;
      }

      case 'withdraw': {
        const target = next.elements[op.element_id];
        if (!target) {
          errors.push(`withdraw: element '${op.element_id}' not found`);
          continue;
        }
        if (target.status !== 'active') {
          errors.push(`withdraw: '${op.element_id}' is not active`);
          continue;
        }
        next.elements[op.element_id] = { ...target, status: 'withdrawn' };
        withdrawn.push(op.element_id);
        break;
      }

      default:
        errors.push(`Unknown action: ${op.action}`);
    }
  }

  // Record histories
  const activeOpens = Object.values(next.elements).filter(
    e => e.type === 'OPEN' && e.status === 'active'
  ).length;
  next.openCountHistory.push(activeOpens);
  next.elementCountHistory.push(Object.keys(next.elements).length);

  // Compute derived state
  const integrityWarnings = checkAllIntegrity(next.elements);
  const completeness = {
    ...computeCompleteness(next.elements),
    basis_coverage: computeBasisCoverage(next.elements),
  };
  const challengeTrigger = detectChallenge(next);
  const stallDetected = next.openCountHistory.length >= 4 &&
    next.openCountHistory.slice(-4).every((v, i, a) => i === 0 || v === a[i - 1]);
  const closure = checkClosure(next);

  return {
    state: next,
    added,
    resolved,
    revised,
    withdrawn,
    errors,
    integrityWarnings,
    completeness,
    challengeTrigger,
    stallDetected,
    closure,
  };
}

// ── Challenge Tracking ───────────────────────────────────────────

export function markChallengeUsed(state, mode) {
  const next = structuredClone(state);
  next.challengeModesUsed.push(mode);
  next.challengeLog.push({ mode, round: next.round });
  return next;
}

// ── Persistence ──────────────────────────────────────────────────

export function saveState(state, filePath) {
  writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function loadState(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd skills/design-experimental/proof-mcp && npx vitest run __tests__/state.test.js`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add skills/design-experimental/proof-mcp/state.js skills/design-experimental/proof-mcp/__tests__/state.test.js
git commit -m "feat: add state lifecycle for design proof MCP"
```

---

### Task 5: MCP Server Wiring (server.js)

**Files:**
- Create: `skills/design-experimental/proof-mcp/server.js`

- [ ] **Step 1: Implement server.js**

```js
// MCP server for design proof discipline.
// Thin wiring layer — all logic lives in proof.js, metrics.js, and state.js.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initializeState, applyOperations, markChallengeUsed, saveState, loadState } from './state.js';
import { checkAllIntegrity } from './proof.js';
import { computeCompleteness, computeBasisCoverage, detectChallenge, checkClosure } from './metrics.js';

const server = new Server(
  { name: 'chester-design-proof', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool Definitions ─────────────────────────────────────────────

const TOOLS = [
  {
    name: 'initialize_proof',
    description: 'Initialize a new design proof session',
    inputSchema: {
      type: 'object',
      properties: {
        problem_statement: { type: 'string', description: 'Confirmed problem statement from Phase 1' },
        state_file: { type: 'string', description: 'Absolute path to persist proof state JSON' },
      },
      required: ['problem_statement', 'state_file'],
    },
  },
  {
    name: 'submit_proof_update',
    description: 'Submit proof element operations for the current round',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to proof state JSON' },
        operations: {
          type: 'array',
          description: 'Array of proof operations (add, resolve, revise, withdraw)',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'resolve', 'revise', 'withdraw'] },
              type: { type: 'string', enum: ['GIVEN', 'CONSTRAINT', 'ASSERTION', 'DECISION', 'OPEN', 'RISK', 'BOUNDARY'] },
              element_id: { type: 'string' },
              statement: { type: 'string' },
              source: { type: 'string', enum: ['codebase', 'designer', 'agent'] },
              basis: { type: 'array', items: { type: 'string' } },
              over: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              resolved_by: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['action'],
          },
        },
        challenge_used: { type: 'string', enum: ['contrarian', 'simplifier', 'ontologist'] },
      },
      required: ['state_file', 'operations'],
    },
  },
  {
    name: 'get_proof_state',
    description: 'Load current proof state for resume or debugging',
    inputSchema: {
      type: 'object',
      properties: {
        state_file: { type: 'string', description: 'Absolute path to proof state JSON' },
      },
      required: ['state_file'],
    },
  },
];

// ── Request Handlers ─────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'initialize_proof':
        return handleInitialize(args);
      case 'submit_proof_update':
        return handleSubmitUpdate(args);
      case 'get_proof_state':
        return handleGetState(args);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: err.message }], isError: true };
  }
});

// ── Tool Handlers ────────────────────────────────────────────────

function handleInitialize({ problem_statement, state_file }) {
  const state = initializeState(problem_statement);
  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'initialized',
        element_types: ['GIVEN', 'CONSTRAINT', 'ASSERTION', 'DECISION', 'OPEN', 'RISK', 'BOUNDARY'],
        operations: ['add', 'resolve', 'revise', 'withdraw'],
        state_file,
      }),
    }],
  };
}

function handleSubmitUpdate({ state_file, operations, challenge_used }) {
  let state = loadState(state_file);

  const result = applyOperations(state, operations);

  if (result.errors.length > 0 && result.added.length === 0 && result.resolved.length === 0 &&
      result.revised.length === 0 && result.withdrawn.length === 0) {
    // All operations failed
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ status: 'rejected', errors: result.errors }),
      }],
      isError: true,
    };
  }

  state = result.state;

  if (challenge_used) {
    state = markChallengeUsed(state, challenge_used);
  }

  saveState(state, state_file);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'accepted',
        round: state.round,
        elements_added: result.added,
        elements_resolved: result.resolved,
        elements_revised: result.revised,
        elements_withdrawn: result.withdrawn,
        errors: result.errors,
        integrity_warnings: result.integrityWarnings,
        completeness: result.completeness,
        challenge_trigger: result.challengeTrigger,
        stall_detected: result.stallDetected,
        closure_permitted: result.closure.permitted,
        closure_reasons: result.closure.reasons,
      }),
    }],
  };
}

function handleGetState({ state_file }) {
  const state = loadState(state_file);

  const integrityWarnings = checkAllIntegrity(state.elements);
  const completeness = {
    ...computeCompleteness(state.elements),
    basis_coverage: computeBasisCoverage(state.elements),
  };
  const challengeTrigger = detectChallenge(state);
  const closure = checkClosure(state);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        ...state,
        integrity_warnings: integrityWarnings,
        completeness,
        challenge_trigger: challengeTrigger,
        closure_permitted: closure.permitted,
        closure_reasons: closure.reasons,
      }),
    }],
  };
}

// ── Startup ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 2: Run all tests**

Run: `cd skills/design-experimental/proof-mcp && npx vitest run`
Expected: All tests in proof.test.js, metrics.test.js, and state.test.js PASS

- [ ] **Step 3: Commit**

```bash
git add skills/design-experimental/proof-mcp/server.js
git commit -m "feat: add MCP server wiring for design proof"
```

---

### Task 6: MCP Registration

**Files:**
- Modify: `.plugin-mcp.json`

- [ ] **Step 1: Add chester-design-proof entry**

Add to `.plugin-mcp.json` after the existing two entries:

```json
"chester-design-proof": {
  "command": "node",
  "args": ["${CLAUDE_PLUGIN_ROOT}/skills/design-experimental/proof-mcp/server.js"]
}
```

The file should now have three entries: `chester-enforcement`, `chester-understanding`, `chester-design-proof`.

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('.plugin-mcp.json', 'utf-8')); console.log('VALID')"`
Expected: `VALID`

- [ ] **Step 3: Commit**

```bash
git add .plugin-mcp.json
git commit -m "feat: register chester-design-proof MCP server"
```

---

### Task 7: Skill Definition (SKILL.md)

**Files:**
- Create: `skills/design-experimental/SKILL.md`

This is the largest file. It forks from `design-figure-out/SKILL.md` with these changes:
- New frontmatter (name, description)
- Phase 1: Add `EnterPlanMode` after bootstrap, remove MCP references, simplify to conversational
- Phase transition: Add `ExitPlanMode` with prescribed framing
- Phase 2: Replace enforcement per-turn flow with proof per-turn flow
- Challenge modes: Update triggers to proof-derived
- Closure: Update to proof completeness conditions
- Resume: Update for proof state recovery
- Safety: Same round cap, checkpoints, stall recovery
- Integration: Reference chester-design-proof instead of enforcement/understanding

- [ ] **Step 1: Write the SKILL.md**

The full skill file content follows the spec sections 8.1–8.8. This is a ~400 line file. Key sections:

1. Frontmatter with `name: design-experimental`
2. HARD-GATE simplified (Plan Mode is active, proof MCP disciplines Phase 2)
3. Checklist (8 items: bootstrap, EnterPlanMode, exploration, round one, understand, transition with ExitPlanMode, proof phase, closure)
4. Role section (same as design-figure-out)
5. Phase 1: Bootstrap (same), Parallel Exploration (same), Round One (no MCP init — just gap map and commentary)
6. Phase 1 per-turn: No scoring cycle — observations, info package, commentary
7. Phase transition: ExitPlanMode with prescribed framing text
8. Phase 2 opening: Problem statement → initialize_proof → seed proof
9. Phase 2 per-turn: submit_proof_update → read response → choose topic → compose visible output
10. Challenge modes: Four modes with proof-derived triggers
11. Safety: Round 20 cap, checkpoints every 5, early exit after 3, stall recovery
12. Visible surface: Same observations, info package, commentary format. Integrity warnings in observations block translated to domain language.
13. Translation Gate, Research Boundary, Behavioral Constraints: Same
14. Resume protocol: Updated for proof state
15. Closure protocol: Proof completeness gated
16. Artifacts: Same three, process evidence includes proof evolution
17. Integration section

- [ ] **Step 2: Verify frontmatter**

Check that `name: design-experimental` and `description` matches the setup-start entry.

- [ ] **Step 3: Commit**

```bash
git add skills/design-experimental/SKILL.md
git commit -m "feat: add design-experimental skill with Plan Mode and formal proof language"
```

---

### Task 8: Setup-Start Registration

**Files:**
- Modify: `skills/setup-start/SKILL.md`

- [ ] **Step 1: Add to Pipeline Skills list**

After the `design-figure-out` entry (line 246), add:

```markdown
- `design-experimental` — Experimental two-phase design skill: Plan Mode understanding (Phase 1), formal proof-building with structural validation (Phase 2). Fork of design-figure-out for validating proof-based design discipline.
```

- [ ] **Step 2: Add to Skill Priority section**

In the gate skills list (line 224), add `design-experimental` alongside `design-figure-out`:

```markdown
1. **Gate skills first** (`design-figure-out`, `design-experimental`, `design-specify`, `plan-build`, `execute-write`, `execute-verify-complete`, `finish-close-worktree`) — these define the overall pipeline stage and determine HOW to approach the task
```

- [ ] **Step 3: Verify description sync**

Confirm the setup-start entry text matches the SKILL.md frontmatter description field.

- [ ] **Step 4: Commit**

```bash
git add skills/setup-start/SKILL.md
git commit -m "feat: register design-experimental in setup-start available skills"
```
