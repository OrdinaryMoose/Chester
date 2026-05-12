#!/usr/bin/env bash
# Verifies chester-style-write helper + bin wrapper across the AC-2.x cases.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HELPER="$REPO_ROOT/chester-util-config/chester-style-write.sh"
WRAPPER="$REPO_ROOT/bin/chester-style-write"
CONFIG_READ="$REPO_ROOT/chester-util-config/chester-config-read.sh"
FAIL=0

make_home() {
  local sandbox; sandbox="$(mktemp -d)"
  mkdir -p "$sandbox/.claude"
  echo "$sandbox"
}

# AC-2.2: write to absent file — creates the file with the single key.
ac22() {
  local home; home="$(make_home)"
  HOME="$home" bash "$HELPER" "new style value"
  local got
  got=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  if [ "$got" != "new style value" ]; then
    echo "FAIL AC-2.2: got '$got'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.1: write to file with other keys — preserves the other keys.
ac21() {
  local home; home="$(make_home)"
  printf '{"working_dir":"docs/keep","other":42}\n' > "$home/.claude/settings.chester.json"
  HOME="$home" bash "$HELPER" "shaped prose"
  local style other working
  style=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  other=$(jq -r '.other' "$home/.claude/settings.chester.json")
  working=$(jq -r '.working_dir' "$home/.claude/settings.chester.json")
  if [ "$style" != "shaped prose" ] || [ "$other" != "42" ] || [ "$working" != "docs/keep" ]; then
    echo "FAIL AC-2.1: style=$style other=$other working=$working" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.3a: empty argument fails cleanly.
ac23a() {
  local home; home="$(make_home)"
  if HOME="$home" bash "$HELPER" "" 2>/dev/null; then
    echo "FAIL AC-2.3a: empty arg should fail" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.3b: missing jq fails cleanly. Build an isolated PATH containing
# symlinks to only the tools the helper needs (excluding jq) and run the
# helper with that PATH. Use the absolute path to bash so the subprocess
# can still launch even though PATH is restricted — otherwise a launch
# failure would false-pass the assertion.
# IMPORTANT: prefix assignments bind to the executed bash subprocess, not
# to a builtin, because we invoke bash via its absolute path directly.
ac23b() {
  local home; home="$(make_home)"
  local stub_bin; stub_bin="$(mktemp -d)"
  local tool
  for tool in bash mkdir mv mktemp dirname rm; do
    ln -s "$(command -v "$tool")" "$stub_bin/$tool"
  done
  local bash_bin; bash_bin="$(command -v bash)"
  if HOME="$home" PATH="$stub_bin" "$bash_bin" "$HELPER" "any value" 2>/dev/null; then
    echo "FAIL AC-2.3b: missing jq should fail" >&2; FAIL=1
  fi
  rm -rf "$home" "$stub_bin"
}

# AC-2.4: round-trip — write, then chester-config-read yields the same value.
# IMPORTANT: HOME assignment must bind to the bash subprocess in the command
# substitution, not to eval (a builtin) — same pattern as case4 in the
# config-read test. If HOME binds to eval, the bash subprocess inherits the
# outer shell's HOME and reads the real user's settings file, false-passing
# (or failing) for the wrong reason.
ac24() {
  local home; home="$(make_home)"
  HOME="$home" bash "$HELPER" "round-trip prose"
  eval "$(HOME="$home" bash "$CONFIG_READ")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "round-trip prose" ]; then
    echo "FAIL AC-2.4: got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# AC-2.5: wrapper is invocable and forwards "$@".
ac25() {
  local home; home="$(make_home)"
  HOME="$home" bash "$WRAPPER" "wrapper value"
  local got
  got=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  if [ "$got" != "wrapper value" ]; then
    echo "FAIL AC-2.5: got '$got'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Hairy-input safety — jq --arg binding must survive single quotes, double quotes, ampersands, parens, backslashes.
ac_hairy() {
  local home; home="$(make_home)"
  local hairy
  hairy="bullets; it's \"loud\" & (notable) \\backslash"
  HOME="$home" bash "$HELPER" "$hairy"
  local got
  got=$(jq -r '.info_packet_style' "$home/.claude/settings.chester.json")
  if [ "$got" != "$hairy" ]; then
    echo "FAIL ac_hairy: got '$got'" >&2
    echo "             expected '$hairy'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

ac22; ac21; ac23a; ac23b; ac24; ac25; ac_hairy

if [ "$FAIL" -eq 0 ]; then
  echo "PASS test-chester-style-write"
else
  exit 1
fi
