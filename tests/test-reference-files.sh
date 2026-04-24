#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

SPEC_TEMPLATE="skills/design-specify/references/spec-template.md"
SKELETON_GEN="skills/design-specify/references/skeleton-generator.md"
PROPAGATION="skills/execute-write/references/propagation-procedure.md"
TEST_GEN="skills/execute-write/references/test-generator.md"

# (a) each of the four files exists
for f in "$SPEC_TEMPLATE" "$SKELETON_GEN" "$PROPAGATION" "$TEST_GEN"; do
  if [ ! -f "$f" ]; then
    echo "FAIL: $f does not exist"
    ERRORS=$((ERRORS + 1))
  fi
done

# If core files missing, stop here — later checks would spam.
if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors — required reference files missing"
  exit 1
fi

# (b) spec-template.md contains required markers
if ! grep -q '^## Acceptance Criteria' "$SPEC_TEMPLATE"; then
  echo "FAIL: $SPEC_TEMPLATE missing '## Acceptance Criteria' marker"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -q '^### AC-{N.M}' "$SPEC_TEMPLATE"; then
  echo "FAIL: $SPEC_TEMPLATE missing '### AC-{N.M}' marker"
  ERRORS=$((ERRORS + 1))
fi
if ! grep -q '\*\*Observable boundary:\*\*' "$SPEC_TEMPLATE"; then
  echo "FAIL: $SPEC_TEMPLATE missing '**Observable boundary:**' marker"
  ERRORS=$((ERRORS + 1))
fi

# (c) skeleton-generator.md documents Rust/TypeScript/Python/Bash stubs and detection rules
for lang in Rust TypeScript Python Bash; do
  if ! grep -q "$lang" "$SKELETON_GEN"; then
    echo "FAIL: $SKELETON_GEN does not document $lang stub"
    ERRORS=$((ERRORS + 1))
  fi
done
if ! grep -qi 'detection' "$SKELETON_GEN"; then
  echo "FAIL: $SKELETON_GEN does not document detection rules"
  ERRORS=$((ERRORS + 1))
fi
# Concrete per-language detection signals
for signal in 'Cargo.toml' 'package.json' 'pyproject.toml'; do
  if ! grep -q "$signal" "$SKELETON_GEN"; then
    echo "FAIL: $SKELETON_GEN missing detection signal '$signal'"
    ERRORS=$((ERRORS + 1))
  fi
done

# (d) propagation-procedure.md documents three-step sequence
for keyword in 'spec-clause update' 'spec-driven test generation' 'full suite run'; do
  if ! grep -qi "$keyword" "$PROPAGATION"; then
    echo "FAIL: $PROPAGATION missing keyword '$keyword'"
    ERRORS=$((ERRORS + 1))
  fi
done

# (e) test-generator.md declares input context restriction (spec-only, not code)
if ! grep -qi 'spec-only\|spec only\|not.*code\|NOT.*code\|strictly.*spec\|input.*restriction' "$TEST_GEN"; then
  echo "FAIL: $TEST_GEN does not declare spec-only input restriction"
  ERRORS=$((ERRORS + 1))
fi
# Must say it excludes implementer code / existing tests
if ! grep -qi "implementer.*code\|implementation.*code\|code.*diff" "$TEST_GEN"; then
  echo "FAIL: $TEST_GEN does not explicitly exclude implementer code from context"
  ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS errors in reference files"
  exit 1
fi

echo "PASS: all four reference files present with required content"
exit 0
