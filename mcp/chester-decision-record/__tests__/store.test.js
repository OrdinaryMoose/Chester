import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "../store.js";
import { mkdtemp, rm, readFile, writeFile, stat } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function makeRecord(overrides = {}) {
  return {
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

let tmpDir;
let tmpStore;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "dr-test-"));
  tmpStore = join(tmpDir, "decision-record.md");
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("Store — constructor", () => {
  it("defaults storePath to absolute /docs/chester/decision-record/decision-record.md when unset", () => {
    const store = new Store();
    expect(store.storePath).toBe(
      "/docs/chester/decision-record/decision-record.md",
    );
  });

  it("honors storePath override", () => {
    const store = new Store({ storePath: tmpStore });
    expect(store.storePath).toBe(tmpStore);
  });
});

describe("Store — append", () => {
  it("creates the file if absent and writes the record", async () => {
    const store = new Store({ storePath: tmpStore });
    const result = await store.append(makeRecord());
    expect(result.status).toBe("accepted");
    expect(result.id).toBe(`${today()}-00001`);
    const content = await readFile(tmpStore, "utf8");
    expect(content).toContain(`## Decision ${today()}-00001 — Use phase-aware validation`);
    expect(content).toContain("- **Status:** Active");
    expect(content).toContain("### Trigger");
    expect(content).toContain("### Rationale");
  });

  it("increments IDs across successive appends", async () => {
    const store = new Store({ storePath: tmpStore });
    const r1 = await store.append(makeRecord());
    const r2 = await store.append(makeRecord({ title: "Second" }));
    expect(r1.id).toBe(`${today()}-00001`);
    expect(r2.id).toBe(`${today()}-00002`);
    const content = await readFile(tmpStore, "utf8");
    expect(content).toContain(`${today()}-00001`);
    expect(content).toContain(`${today()}-00002`);
  });

  it("throws on invalid record (missing trigger)", async () => {
    const store = new Store({ storePath: tmpStore });
    const bad = makeRecord();
    delete bad.trigger;
    await expect(store.append(bad)).rejects.toThrow(/trigger/);
  });

  it("separates records with blank line", async () => {
    const store = new Store({ storePath: tmpStore });
    await store.append(makeRecord({ title: "First" }));
    await store.append(makeRecord({ title: "Second" }));
    const content = await readFile(tmpStore, "utf8");
    // Two H2 decision headings
    const matches = content.match(/^## Decision /gm);
    expect(matches).toHaveLength(2);
    // Blank line between records
    expect(content).toMatch(/\n\n## Decision /);
  });
});

describe("Store — nextId", () => {
  it("returns today-00001 on empty/missing file", async () => {
    const store = new Store({ storePath: tmpStore });
    const id = await store.nextId();
    expect(id).toBe(`${today()}-00001`);
  });

  it("returns incremented ID when records exist for today", async () => {
    const store = new Store({ storePath: tmpStore });
    await store.append(makeRecord());
    await store.append(makeRecord({ title: "Second" }));
    const id = await store.nextId();
    expect(id).toBe(`${today()}-00003`);
  });

  it("ignores records from previous days", async () => {
    await writeFile(
      tmpStore,
      `## Decision 20200101-00099 — Old\n\n- **Status:** Active\n`,
    );
    const store = new Store({ storePath: tmpStore });
    const id = await store.nextId();
    expect(id).toBe(`${today()}-00001`);
  });
});

describe("Store — supersede", () => {
  it("marks old record Superseded + links both records; body unchanged elsewhere", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id: oldId } = await store.append(
      makeRecord({ title: "Original", rationale: "Unique rationale 42" }),
    );
    const { id: newId } = await store.append(
      makeRecord({ title: "Replacement" }),
    );
    const result = await store.supersede(oldId, newId);
    expect(result.accepted).toBe(true);

    const content = await readFile(tmpStore, "utf8");
    // Old record has Status=Superseded + Superseded By=newId
    const oldBlock = extractBlock(content, oldId);
    expect(oldBlock).toMatch(/- \*\*Status:\*\* Superseded/);
    expect(oldBlock).toContain(`### Superseded By\n${newId}`);
    expect(oldBlock).toContain("Unique rationale 42"); // body preserved
    // New record has Supersedes=oldId
    const newBlock = extractBlock(content, newId);
    expect(newBlock).toContain(`### Supersedes\n${oldId}`);
  });

  it("throws if old ID not found", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id: newId } = await store.append(makeRecord());
    await expect(
      store.supersede(`${today()}-99999`, newId),
    ).rejects.toThrow();
  });

  it("throws if new ID not found", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id: oldId } = await store.append(makeRecord());
    await expect(
      store.supersede(oldId, `${today()}-99999`),
    ).rejects.toThrow();
  });
});

describe("Store — finalizeRefs", () => {
  it("appends SHA suffix to Test and Code fields", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id } = await store.append(makeRecord());
    await store.finalizeRefs(id, { test_sha: "abc1234", code_sha: "def5678" });
    const content = await readFile(tmpStore, "utf8");
    const block = extractBlock(content, id);
    expect(block).toMatch(/### Test\n.*@ abc1234/);
    expect(block).toMatch(/### Code\n.*@ def5678/);
  });

  it("is idempotent on identical SHAs", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id } = await store.append(makeRecord());
    await store.finalizeRefs(id, { test_sha: "abc1234", code_sha: "def5678" });
    await store.finalizeRefs(id, { test_sha: "abc1234", code_sha: "def5678" });
    const content = await readFile(tmpStore, "utf8");
    // Should not double-append (only one " @ abc1234")
    const testMatches = content.match(/@ abc1234/g) || [];
    expect(testMatches).toHaveLength(1);
  });

  it("throws on SHA mismatch", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id } = await store.append(makeRecord());
    await store.finalizeRefs(id, { test_sha: "abc1234", code_sha: "def5678" });
    await expect(
      store.finalizeRefs(id, { test_sha: "zzzzzzz", code_sha: "def5678" }),
    ).rejects.toThrow();
  });

  it("accepts only test_sha (leaves code unchanged)", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id } = await store.append(makeRecord());
    await store.finalizeRefs(id, { test_sha: "abc1234" });
    const content = await readFile(tmpStore, "utf8");
    const block = extractBlock(content, id);
    expect(block).toContain("@ abc1234");
    expect(block).not.toContain("@ def");
  });

  it("throws if both test_sha and code_sha are omitted", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id } = await store.append(makeRecord());
    await expect(store.finalizeRefs(id, {})).rejects.toThrow();
  });

  it("throws when record not found", async () => {
    const store = new Store({ storePath: tmpStore });
    await expect(
      store.finalizeRefs(`${today()}-99999`, { test_sha: "abc1234" }),
    ).rejects.toThrow();
  });
});

describe("Store — abandon", () => {
  it("abandons Active records in named sprint; skips Superseded; ignores other sprints", async () => {
    const store = new Store({ storePath: tmpStore });
    // sprint A: three records — one will be superseded, two remain Active
    const { id: a1 } = await store.append(
      makeRecord({ sprint: "sprint-A", title: "A1" }),
    );
    const { id: a2 } = await store.append(
      makeRecord({ sprint: "sprint-A", title: "A2" }),
    );
    const { id: a3 } = await store.append(
      makeRecord({ sprint: "sprint-A", title: "A3-replacement" }),
    );
    await store.supersede(a1, a3);
    // sprint B: one Active record
    await store.append(makeRecord({ sprint: "sprint-B", title: "B1" }));

    const result = await store.abandon("sprint-A");
    // a2 and a3 are Active → affected=2; a1 is Superseded → skipped=1
    expect(result.affected).toBe(2);
    expect(result.skipped_superseded).toBe(1);

    const content = await readFile(tmpStore, "utf8");
    expect(extractBlock(content, a1)).toMatch(/- \*\*Status:\*\* Superseded/);
    expect(extractBlock(content, a2)).toMatch(/- \*\*Status:\*\* Abandoned/);
    expect(extractBlock(content, a3)).toMatch(/- \*\*Status:\*\* Abandoned/);
    // sprint-B untouched
    expect(content).toMatch(/- \*\*Status:\*\* Active/);
  });

  it("returns zero counts when no records match sprint", async () => {
    const store = new Store({ storePath: tmpStore });
    await store.append(makeRecord({ sprint: "sprint-X" }));
    const result = await store.abandon("nonexistent");
    expect(result).toEqual({ affected: 0, skipped_superseded: 0 });
  });
});

describe("Store — query", () => {
  it("filters by status", async () => {
    const store = new Store({ storePath: tmpStore });
    const { id: oldId } = await store.append(makeRecord({ title: "Old" }));
    const { id: newId } = await store.append(makeRecord({ title: "New" }));
    await store.supersede(oldId, newId);

    const active = await store.query({ status: "Active" });
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(newId);

    const superseded = await store.query({ status: "Superseded" });
    expect(superseded).toHaveLength(1);
    expect(superseded[0].id).toBe(oldId);
  });

  it("filters by tags (OR semantics within the array)", async () => {
    const store = new Store({ storePath: tmpStore });
    await store.append(makeRecord({ title: "A", tags: "foo, baz" }));
    await store.append(makeRecord({ title: "B", tags: "bar" }));
    await store.append(makeRecord({ title: "C", tags: "qux" }));

    const result = await store.query({ tags: ["foo"] });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("A");

    const multi = await store.query({ tags: ["foo", "bar"] });
    expect(multi.map((r) => r.title).sort()).toEqual(["A", "B"]);
  });

  it("filters by sprint_subject (substring)", async () => {
    const store = new Store({ storePath: tmpStore });
    await store.append(
      makeRecord({ title: "One", sprint: "20260424-01-build-decision-loop" }),
    );
    await store.append(
      makeRecord({ title: "Two", sprint: "20260425-01-refactor-thing" }),
    );
    const result = await store.query({ sprint_subject: "build-decision" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("One");
  });

  it("filters by criterion_id (substring on spec_update)", async () => {
    const store = new Store({ storePath: tmpStore });
    await store.append(
      makeRecord({ title: "A", spec_update: "AC-3.1 clause updated" }),
    );
    await store.append(
      makeRecord({ title: "B", spec_update: "AC-5.2 other clause" }),
    );
    const result = await store.query({ criterion_id: "AC-3.1" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("A");
  });

  it("filters by recency_days", async () => {
    const store = new Store({ storePath: tmpStore });
    // Seed file with old record + append current record
    await writeFile(
      tmpStore,
      [
        `## Decision 20200101-00001 — Ancient`,
        ``,
        `- **Sprint:** old`,
        `- **Task:** Task 1`,
        `- **Status:** Active`,
        `- **Tags:** x`,
        ``,
        `### Trigger`,
        `t`,
        ``,
        `### Context`,
        `c`,
        ``,
        `### Options Considered`,
        `- **A** — x`,
        ``,
        `### Chosen`,
        `A`,
        ``,
        `### Rationale`,
        `r`,
        ``,
        `### Spec Update`,
        `none`,
        ``,
        `### Test`,
        `t`,
        ``,
        `### Code`,
        `f:1`,
        ``,
        `### Supersedes`,
        `—`,
        ``,
        `### Superseded By`,
        `—`,
        ``,
      ].join("\n"),
    );
    await store.append(makeRecord({ title: "Recent" }));
    const result = await store.query({ recency_days: 7 });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Recent");
  });

  it("applies multiple filters with AND semantics", async () => {
    const store = new Store({ storePath: tmpStore });
    await store.append(
      makeRecord({ title: "A", status: "Active", tags: "foo" }),
    );
    const { id: oldId } = await store.append(
      makeRecord({ title: "B", tags: "foo" }),
    );
    const { id: newId } = await store.append(
      makeRecord({ title: "C", tags: "bar" }),
    );
    await store.supersede(oldId, newId);

    const result = await store.query({ status: "Active", tags: ["foo"] });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("A");
  });

  it("returns empty array on missing file", async () => {
    const store = new Store({ storePath: tmpStore });
    const result = await store.query({});
    expect(result).toEqual([]);
  });
});

describe("Store — concurrent append", () => {
  it("two Store instances writing same file do not interleave; both records land", async () => {
    const s1 = new Store({ storePath: tmpStore });
    const s2 = new Store({ storePath: tmpStore });
    const [r1, r2] = await Promise.all([
      s1.append(makeRecord({ title: "From-S1" })),
      s2.append(makeRecord({ title: "From-S2" })),
    ]);
    expect(r1.status).toBe("accepted");
    expect(r2.status).toBe("accepted");
    expect(r1.id).not.toBe(r2.id);

    const content = await readFile(tmpStore, "utf8");
    const headings = content.match(/^## Decision /gm) || [];
    expect(headings).toHaveLength(2);
    expect(content).toContain("From-S1");
    expect(content).toContain("From-S2");

    // IDs should be today-00001 and today-00002 (set)
    const ids = [r1.id, r2.id].sort();
    expect(ids).toEqual([`${today()}-00001`, `${today()}-00002`]);
  });
});

// --- helpers ---

function extractBlock(content, id) {
  const lines = content.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## Decision ${id}`));
  if (start < 0) throw new Error(`block for ${id} not found`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## Decision ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}
