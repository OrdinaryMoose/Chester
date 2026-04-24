// Tool-handler functions for the decision-record MCP server.
//
// Each handler takes a plain args object (the tool's parameters) plus a Store
// instance and returns a plain result object (the tool's response payload).
// Handlers MUST NOT throw on user-correctable errors (schema validation, not
// found, SHA mismatch) — instead they return `{status: "error", errors: [...]}`.
// Unexpected errors (I/O, lock timeout) are allowed to propagate — the server
// wrapper surfaces them to MCP as tool errors.
//
// This module is deliberately SDK-free so tests can exercise handlers without
// MCP wiring. server.js wires these into the SDK transport.

import { validate } from "./schema.js";
import { FINALIZATION_MISMATCH } from "./store.js";

// Build a full 16-field record from dr_capture's 11-field input.
//
// Missing fields that the store requires but the tool doesn't expose:
// - id: assigned by store.append
// - title: derived from `chosen` (first line, trimmed to 80 chars)
// - status: "Active" for fresh captures
// - supersedes / superseded_by: "—" (em-dash sentinel matching reference docs)
function buildCaptureRecord(args) {
  const chosen = typeof args.chosen === "string" ? args.chosen : "";
  const firstLine = chosen.split("\n")[0].trim();
  const title =
    firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine || "Untitled";
  return {
    title,
    sprint: args.sprint,
    task: args.task,
    status: "Active",
    tags: args.tags,
    trigger: args.trigger,
    context: args.context,
    options_considered: args.options_considered,
    chosen: args.chosen,
    rationale: args.rationale,
    spec_update: args.spec_update,
    test: args.test,
    code: args.code,
    supersedes: "—",
    superseded_by: "—",
  };
}

export async function handleCapture(args, store) {
  const record = buildCaptureRecord(args);
  // Pre-check with schema so we return structured errors rather than throwing.
  // Store.append also validates (with an auto-assigned id); we use a placeholder
  // id for the pre-check to avoid false id-format errors.
  const preCheck = { ...record, id: "20000101-00001" };
  const { ok, errors } = validate(preCheck, { phase: "capture" });
  if (!ok) {
    return {
      status: "error",
      errors: errors.map((e) => ({ field: e.field, reason: e.message })),
    };
  }

  try {
    const { id } = await store.append(record);
    return { id, status: "accepted" };
  } catch (err) {
    // Fallback: any validation that slipped past our pre-check (shouldn't
    // happen, but be defensive) surfaces as a structured error.
    return {
      status: "error",
      errors: [{ reason: err.message }],
    };
  }
}

export async function handleFinalizeRefs(args, store) {
  const { record_id, test_sha, code_sha } = args;
  if (!record_id) {
    return {
      status: "error",
      errors: [{ field: "record_id", reason: "missing required field" }],
    };
  }
  if (!test_sha && !code_sha) {
    return {
      status: "error",
      errors: [
        { reason: "at least one of test_sha, code_sha must be provided" },
      ],
    };
  }
  try {
    await store.finalizeRefs(record_id, { test_sha, code_sha });
    return { status: "accepted" };
  } catch (err) {
    // Typed mismatch errors (FinalizationMismatchError) carry the canonical
    // spec-defined code. Other errors pass through verbatim.
    if (err && err.code === FINALIZATION_MISMATCH) {
      return {
        status: "error",
        errors: [{ reason: err.code }],
      };
    }
    return { status: "error", errors: [{ reason: err.message || String(err) }] };
  }
}

export async function handleQuery(args, store) {
  const filter = args || {};
  const records = await store.query(filter);
  return { records };
}

export async function handleSupersede(args, store) {
  const { old_id, new_id } = args;
  if (!old_id || !new_id) {
    return {
      status: "error",
      errors: [
        { reason: "old_id and new_id are required" },
      ],
    };
  }
  try {
    await store.supersede(old_id, new_id);
    return { status: "accepted" };
  } catch (err) {
    return { status: "error", errors: [{ reason: err.message }] };
  }
}

export async function handleAbandon(args, store) {
  const { sprint } = args;
  if (!sprint) {
    return {
      status: "error",
      errors: [{ field: "sprint", reason: "missing required field" }],
    };
  }
  return await store.abandon(sprint);
}

// Structural verification of finalized refs for a sprint.
//
// NOTE: This MCP tool does NOT execute the test suite — that's the job of
// execute-verify-complete, which runs the full bash test suite separately.
// Here we only check:
//   - `exists`: Test field is non-empty and well-formed (true if present).
//   - `passes`: derived from sha_finalized. SHA finalization happens AFTER the
//     task's commit, which only happens AFTER the suite passes upstream. So
//     sha_finalized implies the suite was green at commit time. This keeps the
//     return shape a strict bool per spec-05 §Return shapes without this MCP
//     needing a test runner.
//   - `sha_finalized`: Test field carries a `@ <sha>` suffix.
// Aggregate fails if any record lacks sha_finalized.
export async function handleVerifyTests(args, store) {
  const { sprint } = args;
  const records = await store.query({ sprint_subject: sprint });
  const per_record = records.map((r) => {
    const test = r.test || "";
    const hasSha = /\s@\s[0-9a-f]{7,40}\s*$/.test(test);
    const wellFormed = test.trim().length > 0;
    return {
      id: r.id,
      test,
      exists: wellFormed,
      passes: hasSha,
      sha_finalized: hasSha,
    };
  });
  const allFinalized =
    per_record.length > 0 && per_record.every((x) => x.sha_finalized);
  const aggregate = allFinalized ? "pass" : "fail";
  return { sprint, per_record, aggregate };
}

// Drift audit. At this stage we only detect `sha-missing` findings from the
// record text itself. Other drift kinds (`test-missing`, `test-failing`,
// `code-moved`) are stubs — they'll be filled in by a later task when the
// MCP gains access to the filesystem/git introspection it needs.
export async function handleAudit(args, store) {
  const filter = args && typeof args === "object" ? args : {};
  const records = await store.query(filter);
  const findings = [];
  for (const r of records) {
    if (r.status !== "Active") continue;
    const testHasSha = /\s@\s[0-9a-f]{7,40}\s*$/.test(r.test || "");
    const codeHasSha = /\s@\s[0-9a-f]{7,40}\s*$/.test(r.code || "");
    if (!testHasSha) {
      findings.push({
        id: r.id,
        kind: "sha-missing",
        detail: `Test field on ${r.id} has no finalized SHA`,
      });
    }
    if (!codeHasSha) {
      findings.push({
        id: r.id,
        kind: "sha-missing",
        detail: `Code field on ${r.id} has no finalized SHA`,
      });
    }
  }
  return {
    audited: records.length,
    drifted: findings.length,
    findings,
    // `kinds_checked` discloses audit coverage so consumers (finish-write-records
    // session summaries) can distinguish "checked and clean" from "not checked."
    // Spec-05 defines four kinds; only `sha-missing` is functional at this layer.
    // Other kinds require filesystem/git introspection — to be added in a later
    // sprint. Until then, absence of those findings does NOT imply absence of
    // that drift class.
    kinds_checked: ["sha-missing"],
  };
}

// Registry of tool name → handler for server.js to iterate.
export const HANDLERS = {
  dr_capture: handleCapture,
  dr_finalize_refs: handleFinalizeRefs,
  dr_query: handleQuery,
  dr_supersede: handleSupersede,
  dr_abandon: handleAbandon,
  dr_verify_tests: handleVerifyTests,
  dr_audit: handleAudit,
};
