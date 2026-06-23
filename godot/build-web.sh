#!/usr/bin/env bash
# Export Dragon Flight to a browser (WebAssembly) build in ../dist-web/.
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GODOT="${GODOT:-$HOME/.local/bin/godot4}"
OUT="$DIR/../dist-web"
mkdir -p "$OUT"
echo "Exporting Web build -> $OUT"
"$GODOT" --headless --path "$DIR" --export-release "Web" "$OUT/index.html"
echo "Done. Serve it with: $DIR/serve-web.sh"
