#!/usr/bin/env bash
# Launch Dragon Flight (Godot 4). Uses the installed engine at ~/.local/bin/godot4.
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GODOT="${GODOT:-$HOME/.local/bin/godot4}"
if [ ! -x "$GODOT" ]; then
  echo "Godot not found at $GODOT — install Godot 4 or set GODOT=/path/to/godot" >&2
  exit 1
fi
# --editor opens the editor; default just runs the game.
exec "$GODOT" --path "$DIR" "$@"
