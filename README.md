# Chester

Chester is a Claude Code plugin that provides a structured development workflow: design → specify → plan → implement → finish. It front-loads shared understanding before any code is written.

See [docs/README.md](docs/README.md) for a full description of the pipeline and available skills.

---

## Installation

### 1. Clone to a permanent location

Choose a location you won't move the repo from — the MCP server paths are absolute and will break if you relocate it.

```bash
git clone https://github.com/OrdinaryMoose/Chester.git ~/Documents/Chester
```

### 2. Install MCP server dependencies

Chester's design skills use local MCP servers that require Node.js dependencies:

```bash
cd ~/Documents/Chester
npm install --prefix skills/design-figure-out/enforcement
npm install --prefix skills/design-figure-out/understanding
npm install --prefix skills/design-large-task/proof-mcp
```

### 3. Set absolute paths in .mcp.json

Claude Code does not expand `${CLAUDE_PLUGIN_ROOT}` in MCP server `args`. You must replace it with the absolute path to your Chester directory.

Edit `.mcp.json` and replace every occurrence of `${CLAUDE_PLUGIN_ROOT}` with your actual path:

```json
{
  "mcpServers": {
    "chester-enforcement": {
      "command": "node",
      "args": ["/your/path/to/Chester/skills/design-figure-out/enforcement/server.js"]
    },
    "chester-understanding": {
      "command": "node",
      "args": ["/your/path/to/Chester/skills/design-figure-out/understanding/server.js"]
    },
    "chester-design-proof": {
      "command": "node",
      "args": ["/your/path/to/Chester/skills/design-large-task/proof-mcp/server.js"]
    }
  }
}
```

### 4. Register as a local marketplace and install

```bash
claude plugins marketplace add ~/Documents/Chester
claude plugins install chester@chester
```

### 5. Activate

In a Claude Code session, run `/reload-plugins`. Chester skills will be available immediately and the SessionStart hook will load Chester automatically in every future session.

**Verify:** Open `/mcp` and confirm the three chester MCP servers show as connected.

---

## Updating

After `git pull`, re-run the npm installs and re-sync the plugin:

```bash
npm install --prefix skills/design-figure-out/enforcement
npm install --prefix skills/design-figure-out/understanding
npm install --prefix skills/design-large-task/proof-mcp
claude plugins update chester@chester
```

Then run `/reload-plugins` in your session.

> **Note:** `claude plugins update` re-copies files to the plugin cache. If npm dependencies go missing after an update, re-run the install step above targeting the cache directory at `~/.claude/plugins/cache/chester/chester/<version>/`.

---

## Known limitations

- **`${CLAUDE_PLUGIN_ROOT}` in MCP args is not expanded** by Claude Code. The `.mcp.json` must use absolute paths. This does not affect hooks — `${CLAUDE_PLUGIN_ROOT}` works correctly in `hooks/hooks.json`.
- **Moving the repo breaks MCP servers.** Update `.mcp.json` and the plugin cache copy if you relocate the directory.
