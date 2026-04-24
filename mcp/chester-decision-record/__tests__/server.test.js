// Tests exercise the tool-handler functions directly (handlers.js) rather than
// spawning the SDK stdio server. This is deterministic and fast; the server.js
// wrapper is a thin wiring layer covered by the dispatch smoke test below.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { Store } from "../store.js";
import {
  handleCapture,
  handleFinalizeRefs,
  handleQuery,
  handleSupersede,
  handleAbandon,
  handleVerifyTests,
  handleAudit,
  HANDLERS,
} from "../handlers.js";

let tmpDir;
let tmpStore;
let store;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "dr-server-test-"));
  tmpStore = join(tmpDir, "decision-record.md");
  store = new Store({ storePath: tmpStore });
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

function captureArgs(overrides = {}) {
  return {
    sprint: "20260424-01-build-decision-loop",
    task: "Task 4 (server dispatch)",
    tags: "mcp, server",
    trigger: "Need to wire tools through SDK",
    context: "Implementing seven-tool dispatch for decision-record MCP",
    options_considered: "- **A** — handlers module\n- **B** — inline in server",
    chosen: "A: extract handlers module",
    rationale: "Keeps the server thin and handlers unit-testable",
    spec_update: "AC-10.1",
    test: "server.test.js::dispatches all seven tools",
    code: "handlers.js:1",
    ...overrides,
  };
}

describe("handlers — dr_capture", () => {
  it("returns {id, status:'accepted'} on valid input", async () => {
    const result = await handleCapture(captureArgs(), store);
    expect(result.status).toBe("accepted");
    expect(result.id).toMatch(/^\d{8}-\d{5}$/);
    const content = await readFile(tmpStore, "utf8");
    expect(content).toContain(result.id);
    expect(content).toContain("- **Status:** Active");
  });

  it("returns structured errors when a required field is missing", async () => {
    const args = captureArgs();
    delete args.trigger;
    const result = await handleCapture(args, store);
    expect(result.status).toBe("error");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.some((e) => e.field === "trigger")).toBe(true);
  });

  it("derives a non-empty title from chosen", async () => {
    const args = captureArgs({ chosen: "Pick option B for latency reasons" });
    const { id } = await handleCapture(args, store);
    const content = await readFile(tmpStore, "utf8");
    expect(content).toContain(`## Decision ${id} — Pick option B`);
  });
});

describe("handlers — dr_finalize_refs", () => {
  it("accepts matching SHAs", async () => {
    const { id } = await handleCapture(captureArgs(), store);
    const result = await handleFinalizeRefs(
      { record_id: id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    expect(result).toEqual({ status: "accepted" });
  });

  it("is idempotent on identical SHAs", async () => {
    const { id } = await handleCapture(captureArgs(), store);
    await handleFinalizeRefs(
      { record_id: id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    const second = await handleFinalizeRefs(
      { record_id: id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    expect(second.status).toBe("accepted");
  });

  it("returns already-finalized-with-different-sha on mismatch", async () => {
    const { id } = await handleCapture(captureArgs(), store);
    await handleFinalizeRefs(
      { record_id: id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    const result = await handleFinalizeRefs(
      { record_id: id, test_sha: "zzzzzzz", code_sha: "def5678" },
      store,
    );
    expect(result.status).toBe("error");
    expect(result.errors[0].reason).toBe(
      "already-finalized-with-different-sha",
    );
  });

  it("returns error when record_id missing", async () => {
    const result = await handleFinalizeRefs(
      { test_sha: "abc1234" },
      store,
    );
    expect(result.status).toBe("error");
    expect(result.errors[0].field).toBe("record_id");
  });
});

describe("handlers — dr_query", () => {
  it("returns records filtered by status", async () => {
    const r1 = await handleCapture(captureArgs({ chosen: "first" }), store);
    await handleCapture(captureArgs({ chosen: "second" }), store);
    // supersede the first one — becomes Superseded
    const r2 = await handleCapture(captureArgs({ chosen: "replacement" }), store);
    await handleSupersede({ old_id: r1.id, new_id: r2.id }, store);

    const active = await handleQuery({ status: "Active" }, store);
    expect(active.records.every((r) => r.status === "Active")).toBe(true);
    expect(active.records.map((r) => r.id)).not.toContain(r1.id);

    const superseded = await handleQuery({ status: "Superseded" }, store);
    expect(superseded.records).toHaveLength(1);
    expect(superseded.records[0].id).toBe(r1.id);
  });
});

describe("handlers — dr_supersede", () => {
  it("accepts and links old/new records", async () => {
    const r1 = await handleCapture(captureArgs({ chosen: "first" }), store);
    const r2 = await handleCapture(captureArgs({ chosen: "second" }), store);
    const result = await handleSupersede(
      { old_id: r1.id, new_id: r2.id },
      store,
    );
    expect(result.status).toBe("accepted");
    const content = await readFile(tmpStore, "utf8");
    expect(content).toMatch(/- \*\*Status:\*\* Superseded/);
    expect(content).toContain(`### Superseded By\n${r2.id}`);
    expect(content).toContain(`### Supersedes\n${r1.id}`);
  });

  it("returns structured error when old_id missing", async () => {
    const { id } = await handleCapture(captureArgs(), store);
    const result = await handleSupersede(
      { old_id: "20200101-99999", new_id: id },
      store,
    );
    expect(result.status).toBe("error");
    expect(result.errors[0].reason).toMatch(/not found/);
  });
});

describe("handlers — dr_abandon", () => {
  it("returns {affected, skipped_superseded}", async () => {
    await handleCapture(captureArgs({ chosen: "a1" }), store);
    await handleCapture(captureArgs({ chosen: "a2" }), store);
    const result = await handleAbandon(
      { sprint: "20260424-01-build-decision-loop" },
      store,
    );
    expect(result.affected).toBe(2);
    expect(result.skipped_superseded).toBe(0);
  });

  it("returns zeros when sprint has no records", async () => {
    const result = await handleAbandon({ sprint: "nonexistent" }, store);
    expect(result).toEqual({ affected: 0, skipped_superseded: 0 });
  });
});

describe("handlers — dr_verify_tests", () => {
  it("aggregate=fail when any record has sha_finalized=false", async () => {
    const r1 = await handleCapture(captureArgs({ chosen: "first" }), store);
    await handleCapture(captureArgs({ chosen: "second" }), store);
    await handleFinalizeRefs(
      { record_id: r1.id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    const result = await handleVerifyTests(
      { sprint: "20260424-01-build-decision-loop" },
      store,
    );
    expect(result.aggregate).toBe("fail");
    expect(result.per_record).toHaveLength(2);
    const finalizedCount = result.per_record.filter(
      (x) => x.sha_finalized,
    ).length;
    expect(finalizedCount).toBe(1);
  });

  it("aggregate=pass when every record has sha_finalized=true", async () => {
    const r1 = await handleCapture(captureArgs({ chosen: "first" }), store);
    const r2 = await handleCapture(captureArgs({ chosen: "second" }), store);
    await handleFinalizeRefs(
      { record_id: r1.id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    await handleFinalizeRefs(
      { record_id: r2.id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    const result = await handleVerifyTests(
      { sprint: "20260424-01-build-decision-loop" },
      store,
    );
    expect(result.aggregate).toBe("pass");
    expect(result.per_record.every((x) => x.sha_finalized)).toBe(true);
  });

  it("aggregate=fail on empty record set (nothing to verify)", async () => {
    const result = await handleVerifyTests(
      { sprint: "nonexistent-sprint" },
      store,
    );
    expect(result.aggregate).toBe("fail");
    expect(result.per_record).toEqual([]);
  });
});

describe("handlers — dr_audit", () => {
  it("reports sha-missing findings for unfinalized Active records", async () => {
    const r1 = await handleCapture(captureArgs({ chosen: "first" }), store);
    await handleCapture(captureArgs({ chosen: "second" }), store);
    // finalize r1 only
    await handleFinalizeRefs(
      { record_id: r1.id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    const result = await handleAudit({}, store);
    expect(result.audited).toBe(2);
    // r2 contributes two findings (test + code both missing SHAs)
    expect(result.findings.length).toBe(2);
    expect(
      result.findings.every((f) => f.kind === "sha-missing"),
    ).toBe(true);
  });

  it("returns no findings when all records are finalized", async () => {
    const r1 = await handleCapture(captureArgs(), store);
    await handleFinalizeRefs(
      { record_id: r1.id, test_sha: "abc1234", code_sha: "def5678" },
      store,
    );
    const result = await handleAudit({}, store);
    expect(result.findings).toEqual([]);
    expect(result.drifted).toBe(0);
  });
});

describe("HANDLERS registry", () => {
  it("exposes all seven tools by spec name", () => {
    expect(Object.keys(HANDLERS).sort()).toEqual(
      [
        "dr_abandon",
        "dr_audit",
        "dr_capture",
        "dr_finalize_refs",
        "dr_query",
        "dr_supersede",
        "dr_verify_tests",
      ].sort(),
    );
  });
});
