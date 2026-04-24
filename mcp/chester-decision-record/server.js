// MCP server for the decision-record discipline.
// Thin wiring layer — all logic lives in handlers.js (tool dispatch),
// store.js (persistence), and schema.js (validation).

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { resolve } from "path";

import { Store } from "./store.js";
import { HANDLERS } from "./handlers.js";

// ── Path resolution ─────────────────────────────────────────────────

const storePath =
  process.env.CHESTER_DECISION_RECORD_PATH ||
  resolve(process.cwd(), "docs/chester/decision-record/decision-record.md");

const store = new Store({ storePath });

// ── Tool definitions (MCP schema) ───────────────────────────────────
//
// Input-schema keeps parameter lists aligned with the spec (Task 4 brief).
// Non-enforcing — the handlers themselves (via schema.js) do the deep
// validation and return structured errors.

const TOOLS = [
  {
    name: "dr_capture",
    description:
      "Capture a new decision record with full context, options, chosen path, and references to the test + code that will implement it.",
    inputSchema: {
      type: "object",
      properties: {
        sprint: { type: "string" },
        task: { type: "string" },
        trigger: { type: "string" },
        context: { type: "string" },
        options_considered: { type: "string" },
        chosen: { type: "string" },
        rationale: { type: "string" },
        spec_update: { type: "string" },
        test: { type: "string" },
        code: { type: "string" },
        tags: { type: "string" },
      },
      required: [
        "sprint",
        "task",
        "trigger",
        "context",
        "options_considered",
        "chosen",
        "rationale",
        "spec_update",
        "test",
        "code",
        "tags",
      ],
    },
  },
  {
    name: "dr_finalize_refs",
    description:
      "Append a SHA suffix to a record's Test and/or Code field, marking those references as real (commit-verified).",
    inputSchema: {
      type: "object",
      properties: {
        record_id: { type: "string" },
        test_sha: { type: "string" },
        code_sha: { type: "string" },
      },
      required: ["record_id"],
    },
  },
  {
    name: "dr_query",
    description:
      "Filter decision records by sprint_subject (substring), tags (any-match), status, recency_days, or criterion_id (substring in spec_update).",
    inputSchema: {
      type: "object",
      properties: {
        sprint_subject: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        status: { type: "string" },
        recency_days: { type: "number" },
        criterion_id: { type: "string" },
      },
    },
  },
  {
    name: "dr_supersede",
    description:
      "Mark an old decision record as Superseded by a new one, linking both records bidirectionally.",
    inputSchema: {
      type: "object",
      properties: {
        old_id: { type: "string" },
        new_id: { type: "string" },
      },
      required: ["old_id", "new_id"],
    },
  },
  {
    name: "dr_abandon",
    description:
      "Mark all Active records for a sprint as Abandoned. Skips already-Superseded records; reports affected + skipped counts.",
    inputSchema: {
      type: "object",
      properties: {
        sprint: { type: "string" },
      },
      required: ["sprint"],
    },
  },
  {
    name: "dr_verify_tests",
    description:
      "Structural check that every decision record in a sprint has a SHA-finalized Test field. Aggregate fails if any record is unfinalized.",
    inputSchema: {
      type: "object",
      properties: {
        sprint: { type: "string" },
      },
      required: ["sprint"],
    },
  },
  {
    name: "dr_audit",
    description:
      "Scan records for drift — currently reports `sha-missing` findings on Active records whose Test or Code field lacks a finalized SHA.",
    inputSchema: {
      type: "object",
      properties: {
        sprint_subject: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        status: { type: "string" },
        recency_days: { type: "number" },
        criterion_id: { type: "string" },
      },
    },
  },
];

// ── Server wiring ───────────────────────────────────────────────────

const server = new Server(
  { name: "chester-decision-record", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = HANDLERS[name];
  if (!handler) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const payload = await handler(args || {}, store);
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
    };
  } catch (err) {
    // Unexpected I/O / lock errors — surface as tool error. Handlers already
    // convert user-correctable errors to `{status:'error', errors:[...]}`
    // payloads, so anything thrown here is genuinely unexpected.
    return {
      content: [{ type: "text", text: err.message || String(err) }],
      isError: true,
    };
  }
});

// ── Startup ─────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
