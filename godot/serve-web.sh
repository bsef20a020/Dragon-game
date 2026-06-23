#!/usr/bin/env bash
# Serve the exported web build locally, then open it in the browser.
# Usage: ./serve-web.sh [port]   (default port 8060)
set -e
PORT="${1:-8060}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../dist-web" && pwd)"
if [ ! -f "$DIR/index.html" ]; then
  echo "No web build found in $DIR — run ./build-web.sh first." >&2
  exit 1
fi
cd "$DIR"
echo "Serving $DIR at http://localhost:$PORT  (Ctrl+C to stop)"
( sleep 1; (xdg-open "http://localhost:$PORT" >/dev/null 2>&1 || true) ) &
exec python3 - "$PORT" <<'PY'
import sys, os
from http.server import HTTPServer, SimpleHTTPRequestHandler
port = int(sys.argv[1])
class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Sent for forward-compat with threaded builds; harmless for same-origin.
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *a):
        pass
HTTPServer(("0.0.0.0", port), H).serve_forever()
PY
