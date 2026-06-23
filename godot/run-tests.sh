#!/usr/bin/env bash
# Run the headless test suite. Exits non-zero if any test fails (CI-friendly).
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GODOT="${GODOT:-$HOME/.local/bin/godot4}"
"$GODOT" --headless --path "$DIR" res://tests/Tests.tscn
