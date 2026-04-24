import { describe, it, expect } from "vitest";
import { validate } from "../schema.js";

// Minimal valid record at capture phase — no SHA on Test/Code yet.
function makeCaptureRecord(overrides = {}) {
  return {
    id: "20260424-00001",
    title: "Use phase-aware validation",
    sprint: "20260424-01-build-decision-loop",
    task: "Task 2 (schema validation)",
    status: "Active",
    tags: "schema, validation",
    trigger: "Ambiguity on capture vs finalize phase requirements",
    context: "Implementing decision-record MCP schema",
    options_considered: "- **A** — foo\n- **B** — bar",
    chosen: "A",
    rationale: "Option A matches the spec",
    spec_update: "AC-3.1 clause updated",
    test: "schema.test.js::validates capture phase",
    code: "schema.js:42",
    supersedes: "—",
    superseded_by: "—",
    ...overrides,
  };
}

// Finalize phase variant — Test and Code carry @ SHA suffix.
function makeFinalizeRecord(overrides = {}) {
  return makeCaptureRecord({
    test: "schema.test.js::validates capture phase @ abc1234",
    code: "schema.js:42 @ abc1234",
    ...overrides,
  });
}

describe("validate — capture phase", () => {
  it("accepts a full record with test = test_name (no SHA)", () => {
    const result = validate(makeCaptureRecord(), { phase: "capture" });
    expect(result).toEqual({ ok: true, errors: [] });
  });

  it("rejects a record missing the trigger field", () => {
    const record = makeCaptureRecord();
    delete record.trigger;
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "trigger" }),
      ]),
    );
  });

  it("rejects an empty-string required field", () => {
    const record = makeCaptureRecord({ rationale: "" });
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "rationale")).toBe(true);
  });

  it("accepts test without SHA at capture phase", () => {
    const record = makeCaptureRecord({ test: "just_a_test_name" });
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(true);
  });

  it("reports multiple errors when multiple fields are missing", () => {
    const record = makeCaptureRecord();
    delete record.trigger;
    delete record.rationale;
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(false);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain("trigger");
    expect(fields).toContain("rationale");
  });

  it("accepts 'none' for spec_update", () => {
    const record = makeCaptureRecord({
      spec_update: "none — decision is purely internal",
    });
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(true);
  });

  it("accepts '—' for supersedes and superseded_by", () => {
    const result = validate(makeCaptureRecord(), { phase: "capture" });
    expect(result.ok).toBe(true);
  });
});

describe("validate — finalize phase", () => {
  it("accepts a record with test = {name} @ {sha}", () => {
    const result = validate(makeFinalizeRecord(), { phase: "finalize" });
    expect(result).toEqual({ ok: true, errors: [] });
  });

  it("rejects finalize when test lacks SHA suffix", () => {
    const record = makeFinalizeRecord({ test: "just_a_test_name" });
    const result = validate(record, { phase: "finalize" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "test")).toBe(true);
  });

  it("rejects finalize when code lacks SHA suffix", () => {
    const record = makeFinalizeRecord({ code: "schema.js:42" });
    const result = validate(record, { phase: "finalize" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "code")).toBe(true);
  });

  it("accepts 7-char short SHA", () => {
    const record = makeFinalizeRecord({
      test: "name @ 1234567",
      code: "file.js:1 @ 1234567",
    });
    const result = validate(record, { phase: "finalize" });
    expect(result.ok).toBe(true);
  });

  it("accepts 40-char full SHA", () => {
    const sha = "a".repeat(40);
    const record = makeFinalizeRecord({
      test: `name @ ${sha}`,
      code: `file.js:1 @ ${sha}`,
    });
    const result = validate(record, { phase: "finalize" });
    expect(result.ok).toBe(true);
  });

  it("rejects non-hex SHA", () => {
    const record = makeFinalizeRecord({
      test: "name @ ZZZZZZZ",
    });
    const result = validate(record, { phase: "finalize" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "test")).toBe(true);
  });
});

describe("validate — format validation", () => {
  it("rejects invalid status values", () => {
    const record = makeCaptureRecord({ status: "InProgress" });
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "status")).toBe(true);
  });

  it("accepts status 'Active'", () => {
    const result = validate(
      makeCaptureRecord({ status: "Active" }),
      { phase: "capture" },
    );
    expect(result.ok).toBe(true);
  });

  it("accepts status 'Superseded'", () => {
    const result = validate(
      makeCaptureRecord({ status: "Superseded" }),
      { phase: "capture" },
    );
    expect(result.ok).toBe(true);
  });

  it("accepts status 'Abandoned'", () => {
    const result = validate(
      makeCaptureRecord({ status: "Abandoned" }),
      { phase: "capture" },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects ID that does not match YYYYMMDD-XXXXX", () => {
    const record = makeCaptureRecord({ id: "bad-id" });
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "id")).toBe(true);
  });

  it("rejects ID with too-short sequence", () => {
    const record = makeCaptureRecord({ id: "20260424-001" });
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "id")).toBe(true);
  });
});

describe("validate — unknown fields", () => {
  it("rejects a record containing an unknown field", () => {
    const record = makeCaptureRecord({ surprise: "extra value" });
    const result = validate(record, { phase: "capture" });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "surprise",
          message: expect.stringMatching(/unknown field/i),
        }),
      ]),
    );
  });

  it("reports each unknown field separately", () => {
    const record = makeCaptureRecord({ foo: "a", bar: "b" });
    const result = validate(record, { phase: "capture" });
    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain("foo");
    expect(fields).toContain("bar");
  });
});
