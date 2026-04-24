// Persistent append-only store for decision records.
//
// One markdown file. Each record is an H2 block (`## Decision YYYYMMDD-XXXXX — {Title}`)
// with labelled metadata bullets and H3 section fields. Mutations (supersede,
// finalizeRefs, abandon) rewrite the file under an exclusive file-lock
// provided by `proper-lockfile`. No in-memory caching — every operation scans
// the file fresh. The only state on a Store instance is the lock-holder
// reference used during read-modify-write sequences.
//
// ID format: YYYYMMDD-XXXXX. `nextId()` scans existing headers for today's
// max XXXXX and returns the incremented value (first of the day → -00001).

import { readFile, writeFile, access, constants } from "fs/promises";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import lockfile from "proper-lockfile";
import { validate, DECISION_RECORD_FIELDS } from "./schema.js";

const DEFAULT_STORE_PATH =
  "/docs/chester/decision-record/decision-record.md";

// ---------- helpers ----------

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readFileOrEmpty(path) {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return "";
    throw err;
  }
}

// Format a record as markdown. Record fields are trusted — validate before
// calling. `id` must be present.
function formatRecord(rec) {
  return [
    `## Decision ${rec.id} — ${rec.title}`,
    ``,
    `- **Sprint:** ${rec.sprint}`,
    `- **Task:** ${rec.task}`,
    `- **Status:** ${rec.status}`,
    `- **Tags:** ${rec.tags}`,
    ``,
    `### Trigger`,
    rec.trigger,
    ``,
    `### Context`,
    rec.context,
    ``,
    `### Options Considered`,
    rec.options_considered,
    ``,
    `### Chosen`,
    rec.chosen,
    ``,
    `### Rationale`,
    rec.rationale,
    ``,
    `### Spec Update`,
    rec.spec_update,
    ``,
    `### Test`,
    rec.test,
    ``,
    `### Code`,
    rec.code,
    ``,
    `### Supersedes`,
    rec.supersedes,
    ``,
    `### Superseded By`,
    rec.superseded_by,
    ``,
  ].join("\n");
}

// Parse file content into an array of block objects, each covering one
// record. Preserves the raw lines for exact-text rewrites so we don't mangle
// formatting during supersede/finalizeRefs/abandon.
function parseBlocks(content) {
  if (!content || !content.trim()) return [];
  const lines = content.split("\n");
  const blocks = [];
  let i = 0;
  // Skip any preamble until first `## Decision ` heading.
  while (i < lines.length && !lines[i].startsWith("## Decision ")) i++;
  while (i < lines.length) {
    const start = i;
    // Heading: `## Decision YYYYMMDD-XXXXX — Title`
    const headerMatch = lines[i].match(
      /^## Decision (\d{8}-\d{5}) — (.+)$/,
    );
    i++;
    let end = lines.length;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].startsWith("## Decision ")) {
        end = j;
        break;
      }
    }
    const blockLines = lines.slice(start, end);
    blocks.push({
      start,
      end,
      lines: blockLines,
      id: headerMatch ? headerMatch[1] : null,
      title: headerMatch ? headerMatch[2] : null,
    });
    i = end;
  }
  return blocks;
}

// Extract the value of a `- **Label:** value` bullet from the block.
function readBullet(blockLines, label) {
  const prefix = `- **${label}:** `;
  for (const line of blockLines) {
    if (line.startsWith(prefix)) return line.slice(prefix.length);
  }
  return null;
}

// Rewrite a `- **Label:** value` bullet in-place in the block's lines array.
// Returns true if rewritten.
function writeBullet(blockLines, label, value) {
  const prefix = `- **${label}:** `;
  for (let i = 0; i < blockLines.length; i++) {
    if (blockLines[i].startsWith(prefix)) {
      blockLines[i] = prefix + value;
      return true;
    }
  }
  return false;
}

// Extract the content of an H3 section (first non-empty line after `### Label`).
// Decision records use one-line values for Test, Code, Chosen, Supersedes,
// Superseded By, Spec Update. For multi-line sections (Options Considered,
// Trigger, Context, Rationale) we return the whole block text up to the next
// H3 — but the mutating ops here only ever touch single-line fields.
function readSection(blockLines, heading) {
  const headerIdx = blockLines.findIndex((l) => l === `### ${heading}`);
  if (headerIdx === -1) return null;
  const out = [];
  for (let i = headerIdx + 1; i < blockLines.length; i++) {
    const l = blockLines[i];
    if (l.startsWith("### ") || l.startsWith("## ")) break;
    out.push(l);
  }
  // Trim trailing blanks.
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

// Replace the content of a single-line H3 section. Assumes current section is
// one non-empty line followed by a blank separator.
function writeSingleLineSection(blockLines, heading, value) {
  const headerIdx = blockLines.findIndex((l) => l === `### ${heading}`);
  if (headerIdx === -1) return false;
  // The next line after the header is the value (our own formatRecord guarantees this).
  if (headerIdx + 1 >= blockLines.length) return false;
  blockLines[headerIdx + 1] = value;
  return true;
}

function assembleBlocks(blocks) {
  // Each block's `lines` already ends with a trailing blank line from
  // formatRecord. Joining with "\n" preserves that. Between blocks, we want
  // exactly one blank line — which is already produced by the trailing blank
  // of the previous block when we join lines with "\n".
  return blocks.map((b) => b.lines.join("\n")).join("\n");
}

// Parse a block into a record object with all 16 fields.
function blockToRecord(block) {
  const rec = {
    id: block.id,
    title: block.title,
    sprint: readBullet(block.lines, "Sprint") || "",
    task: readBullet(block.lines, "Task") || "",
    status: readBullet(block.lines, "Status") || "",
    tags: readBullet(block.lines, "Tags") || "",
    trigger: readSection(block.lines, "Trigger") || "",
    context: readSection(block.lines, "Context") || "",
    options_considered: readSection(block.lines, "Options Considered") || "",
    chosen: readSection(block.lines, "Chosen") || "",
    rationale: readSection(block.lines, "Rationale") || "",
    spec_update: readSection(block.lines, "Spec Update") || "",
    test: readSection(block.lines, "Test") || "",
    code: readSection(block.lines, "Code") || "",
    supersedes: readSection(block.lines, "Supersedes") || "",
    superseded_by: readSection(block.lines, "Superseded By") || "",
  };
  return rec;
}

// ---------- Store ----------

export class Store {
  constructor({ storePath } = {}) {
    this.storePath = storePath || DEFAULT_STORE_PATH;
    this._release = null;
  }

  // Ensures the file exists so proper-lockfile can acquire on it. Creates
  // parent dir and empty file if absent.
  async _ensureFile() {
    if (!(await fileExists(this.storePath))) {
      await mkdir(dirname(this.storePath), { recursive: true });
      await writeFile(this.storePath, "", "utf8");
    }
  }

  async _lock() {
    await this._ensureFile();
    this._release = await lockfile.lock(this.storePath, {
      stale: 10000,
      retries: { retries: 10, factor: 1.5, minTimeout: 20, maxTimeout: 500 },
      realpath: false,
    });
  }

  async _unlock() {
    if (this._release) {
      const r = this._release;
      this._release = null;
      await r();
    }
  }

  async nextId() {
    const content = await readFileOrEmpty(this.storePath);
    const prefix = today();
    const re = new RegExp(`^## Decision (${prefix})-(\\d{5})`, "gm");
    let max = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const n = parseInt(m[2], 10);
      if (n > max) max = n;
    }
    const next = String(max + 1).padStart(5, "0");
    return `${prefix}-${next}`;
  }

  async append(record) {
    await this._lock();
    try {
      const content = await readFileOrEmpty(this.storePath);
      // Compute next ID from file under lock.
      const prefix = today();
      const re = new RegExp(`^## Decision (${prefix})-(\\d{5})`, "gm");
      let max = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const n = parseInt(m[2], 10);
        if (n > max) max = n;
      }
      const id = record.id || `${prefix}-${String(max + 1).padStart(5, "0")}`;
      const full = { ...record, id };

      const { ok, errors } = validate(full, { phase: "capture" });
      if (!ok) {
        const msg = errors.map((e) => `${e.field}: ${e.message}`).join("; ");
        throw new Error(`invalid record: ${msg}`);
      }

      const rendered = formatRecord(full);
      let next;
      if (!content || !content.trim()) {
        next = rendered;
      } else {
        // Ensure exactly one blank line between records. Strip any trailing
        // whitespace, then append "\n\n" + rendered.
        const trimmed = content.replace(/\s+$/, "");
        next = trimmed + "\n\n" + rendered;
      }
      await writeFile(this.storePath, next, "utf8");
      return { id, status: "accepted" };
    } finally {
      await this._unlock();
    }
  }

  async supersede(oldId, newId) {
    await this._lock();
    try {
      const content = await readFileOrEmpty(this.storePath);
      const blocks = parseBlocks(content);
      const oldBlock = blocks.find((b) => b.id === oldId);
      const newBlock = blocks.find((b) => b.id === newId);
      if (!oldBlock) throw new Error(`record not found: ${oldId}`);
      if (!newBlock) throw new Error(`record not found: ${newId}`);
      const oldStatus = readBullet(oldBlock.lines, "Status");
      if (oldStatus !== "Active") {
        throw new Error(
          `cannot supersede ${oldId}: expected Status=Active, got ${oldStatus}`,
        );
      }
      writeBullet(oldBlock.lines, "Status", "Superseded");
      writeSingleLineSection(oldBlock.lines, "Superseded By", newId);
      writeSingleLineSection(newBlock.lines, "Supersedes", oldId);

      await writeFile(this.storePath, assembleBlocks(blocks), "utf8");
      return { accepted: true };
    } finally {
      await this._unlock();
    }
  }

  async finalizeRefs(recordId, { test_sha, code_sha } = {}) {
    if (!test_sha && !code_sha) {
      throw new Error(
        "finalizeRefs requires at least one of test_sha, code_sha",
      );
    }
    await this._lock();
    try {
      const content = await readFileOrEmpty(this.storePath);
      const blocks = parseBlocks(content);
      const block = blocks.find((b) => b.id === recordId);
      if (!block) throw new Error(`record not found: ${recordId}`);

      if (test_sha) {
        const current = readSection(block.lines, "Test") || "";
        const suffixMatch = current.match(/\s@\s([0-9a-f]{7,40})$/);
        if (suffixMatch) {
          if (suffixMatch[1] !== test_sha) {
            throw new Error(
              `Test already finalized with SHA ${suffixMatch[1]}, refusing to rewrite to ${test_sha}`,
            );
          }
          // Idempotent — no-op.
        } else {
          writeSingleLineSection(
            block.lines,
            "Test",
            `${current} @ ${test_sha}`,
          );
        }
      }

      if (code_sha) {
        const current = readSection(block.lines, "Code") || "";
        const suffixMatch = current.match(/\s@\s([0-9a-f]{7,40})$/);
        if (suffixMatch) {
          if (suffixMatch[1] !== code_sha) {
            throw new Error(
              `Code already finalized with SHA ${suffixMatch[1]}, refusing to rewrite to ${code_sha}`,
            );
          }
        } else {
          writeSingleLineSection(
            block.lines,
            "Code",
            `${current} @ ${code_sha}`,
          );
        }
      }

      await writeFile(this.storePath, assembleBlocks(blocks), "utf8");
      return { accepted: true };
    } finally {
      await this._unlock();
    }
  }

  async abandon(sprint) {
    await this._lock();
    try {
      const content = await readFileOrEmpty(this.storePath);
      const blocks = parseBlocks(content);
      let affected = 0;
      let skipped_superseded = 0;
      for (const block of blocks) {
        const s = readBullet(block.lines, "Sprint");
        if (s !== sprint) continue;
        const status = readBullet(block.lines, "Status");
        if (status === "Active") {
          writeBullet(block.lines, "Status", "Abandoned");
          affected++;
        } else if (status === "Superseded") {
          skipped_superseded++;
        }
        // Already-Abandoned records: no-op, not counted.
      }
      await writeFile(this.storePath, assembleBlocks(blocks), "utf8");
      return { affected, skipped_superseded };
    } finally {
      await this._unlock();
    }
  }

  async query(filter = {}) {
    const content = await readFileOrEmpty(this.storePath);
    if (!content.trim()) return [];
    const blocks = parseBlocks(content);
    const records = blocks.map(blockToRecord);

    const {
      sprint_subject,
      tags,
      status,
      recency_days,
      criterion_id,
    } = filter;

    let cutoff = null;
    if (typeof recency_days === "number" && recency_days >= 0) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - recency_days);
      cutoff = d;
    }

    return records.filter((r) => {
      if (sprint_subject && !r.sprint.includes(sprint_subject)) return false;
      if (status && r.status !== status) return false;
      if (criterion_id && !r.spec_update.includes(criterion_id)) return false;
      if (Array.isArray(tags) && tags.length > 0) {
        const recTags = (r.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const hit = tags.some((t) => recTags.includes(t));
        if (!hit) return false;
      }
      if (cutoff) {
        // Parse YYYYMMDD from ID.
        const m = (r.id || "").match(/^(\d{4})(\d{2})(\d{2})-/);
        if (!m) return false;
        const recDate = new Date(
          Number(m[1]),
          Number(m[2]) - 1,
          Number(m[3]),
        );
        if (recDate < cutoff) return false;
      }
      return true;
    });
  }
}

export { DECISION_RECORD_FIELDS };
