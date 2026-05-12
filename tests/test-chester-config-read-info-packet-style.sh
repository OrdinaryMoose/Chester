#!/usr/bin/env bash
# Verifies CHESTER_INFO_PACKET_STYLE export across the four spec cases.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="$REPO_ROOT/chester-util-config/chester-config-read.sh"
FACTORY_DEFAULT='bullet list, normal verbosity, Product Manager voice'
FAIL=0

# Build an isolated $HOME for each case so the user's real settings file is untouched.
make_home() {
  local sandbox
  sandbox="$(mktemp -d)"
  mkdir -p "$sandbox/.claude"
  echo "$sandbox"
}

# Case 1: setting absent — file does not exist.
# NOTE: HOME assignment must bind to the bash subprocess in the command
# substitution, not to eval (a builtin). See case4 comment for full rationale.
case1() {
  local home; home="$(make_home)"
  eval "$(HOME="$home" bash "$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$FACTORY_DEFAULT" ]; then
    echo "FAIL case1 (absent file): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Case 2: setting present with custom value.
case2() {
  local home; home="$(make_home)"
  printf '{"info_packet_style":"%s"}\n' "custom prose value" > "$home/.claude/settings.chester.json"
  eval "$(HOME="$home" bash "$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "custom prose value" ]; then
    echo "FAIL case2 (custom value): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Case 3: setting present but null.
case3() {
  local home; home="$(make_home)"
  printf '{"info_packet_style":null}\n' > "$home/.claude/settings.chester.json"
  eval "$(HOME="$home" bash "$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$FACTORY_DEFAULT" ]; then
    echo "FAIL case3 (null value): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

# Case 4: jq unavailable. Simulate by stubbing PATH so jq is not found.
# IMPORTANT: prefix assignments must bind to the command substitution (the bash
# subprocess that runs $SCRIPT), not to the eval builtin. Writing
# `HOME=... PATH=... eval "$(bash "$SCRIPT")"` is WRONG — the assignments only
# apply to eval (a builtin that doesn't use PATH), and the command substitution
# runs with the outer shell's PATH (jq still findable). The correct form puts
# the assignments inside the command substitution so the bash subprocess
# inherits them.
case4() {
  local home; home="$(make_home)"
  local stub_bin; stub_bin="$(mktemp -d)"
  # Use absolute path to bash so the stub PATH (which hides jq) doesn't also
  # hide bash itself. The goal is to make jq unfindable, not to break the
  # bash invocation that runs the script.
  local bash_bin; bash_bin="$(command -v bash)"
  eval "$(HOME="$home" PATH="$stub_bin" "$bash_bin" "$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$FACTORY_DEFAULT" ]; then
    echo "FAIL case4 (no jq): got '$CHESTER_INFO_PACKET_STYLE'" >&2; FAIL=1
  fi
  rm -rf "$home" "$stub_bin"
}

# Case 5: shell-special characters in the style value — single quote, double quote, ampersand, parens, backslash.
case5() {
  local home; home="$(make_home)"
  local hairy
  hairy="bullets; it's \"loud\" & (notable) \\backslash"
  jq -n --arg s "$hairy" '{info_packet_style: $s}' > "$home/.claude/settings.chester.json"
  eval "$(HOME="$home" bash "$SCRIPT")"
  if [ "$CHESTER_INFO_PACKET_STYLE" != "$hairy" ]; then
    echo "FAIL case5 (special chars): got '$CHESTER_INFO_PACKET_STYLE'" >&2
    echo "       expected '$hairy'" >&2; FAIL=1
  fi
  rm -rf "$home"
}

case1; case2; case3; case4; case5

if [ "$FAIL" -eq 0 ]; then
  echo "PASS test-chester-config-read-info-packet-style"
else
  exit 1
fi
