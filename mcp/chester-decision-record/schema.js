// Phase-aware validation for decision records.
//
// A record is a plain object with 16 snake_case fields. At capture phase, all
// fields must be non-empty strings. At finalize phase, the `test` and `code`
// fields must additionally carry a `@ <sha>` suffix identifying the commit
// that made them real.
//
// Returns { ok: boolean, errors: [{field, message}] }. Pure — no I/O.

const FIELDS = Object.freeze([
  "id",
  "title",
  "sprint",
  "task",
  "status",
  "tags",
  "trigger",
  "context",
  "options_considered",
  "chosen",
  "rationale",
  "spec_update",
  "test",
  "code",
  "supersedes",
  "superseded_by",
]);

const FIELD_SET = new Set(FIELDS);

const STATUS_VALUES = new Set(["Active", "Superseded", "Abandoned"]);

const ID_PATTERN = /^\d{8}-\d{5}$/;

// Finalize-phase ref patterns. Short SHA is 7 hex chars minimum; full SHA is
// 40. Test name allows any non-empty content; code path allows spaces (Windows
// paths like "C:\Program Files\..."). Trailing whitespace rejected by anchoring
// SHA to end of string.
const TEST_SHA_PATTERN = /^\S(?:.*\S)?\s@\s[0-9a-f]{7,40}$/;
const CODE_SHA_PATTERN = /^.+:\d+\s@\s[0-9a-f]{7,40}$/;

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export function validate(record, options) {
  const errors = [];
  const phase = options && options.phase;

  if (phase !== "capture" && phase !== "finalize") {
    errors.push({
      field: "__phase__",
      message: `phase must be "capture" or "finalize", got ${JSON.stringify(phase)}`,
    });
    return { ok: false, errors };
  }

  if (record === null || typeof record !== "object") {
    errors.push({ field: "__record__", message: "record must be an object" });
    return { ok: false, errors };
  }

  // Unknown-field check — report each extra field separately.
  for (const key of Object.keys(record)) {
    if (!FIELD_SET.has(key)) {
      errors.push({ field: key, message: "unknown field" });
    }
  }

  // Presence + non-empty check for every required field.
  for (const field of FIELDS) {
    if (!isNonEmptyString(record[field])) {
      errors.push({
        field,
        message:
          record[field] === undefined
            ? "missing required field"
            : "required field must be a non-empty string",
      });
    }
  }

  // Format-specific checks. Only run when the field is present and stringy —
  // the presence check above has already flagged missing/empty cases.
  if (isNonEmptyString(record.id) && !ID_PATTERN.test(record.id)) {
    errors.push({
      field: "id",
      message: "id must match YYYYMMDD-XXXXX (8 digits, dash, 5 digits)",
    });
  }

  if (isNonEmptyString(record.status) && !STATUS_VALUES.has(record.status)) {
    errors.push({
      field: "status",
      message: `status must be one of: ${[...STATUS_VALUES].join(", ")}`,
    });
  }

  // At finalize phase, test and code must carry `@ <sha>` suffixes.
  if (phase === "finalize") {
    if (isNonEmptyString(record.test) && !TEST_SHA_PATTERN.test(record.test)) {
      errors.push({
        field: "test",
        message: "finalize phase requires format '{test name} @ {sha}'",
      });
    }
    if (isNonEmptyString(record.code) && !CODE_SHA_PATTERN.test(record.code)) {
      errors.push({
        field: "code",
        message: "finalize phase requires format '{file}:{line} @ {sha}'",
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

export const DECISION_RECORD_FIELDS = FIELDS;
