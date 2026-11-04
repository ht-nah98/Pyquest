#!/usr/bin/env bash
# Class server from a snapshot, never the tree being edited (AGENTS.md §9.9).
# Usage: tools/coach-dev.sh [ref] [port]   (default HEAD, 5174). Stops only the process on that port.
# PQ_HOST=1 also serves it on the local network so the children's laptops / iPad can open it:
# anyone on that Wi-Fi can then reach it, so it is off by default.
set -euo pipefail
REPO="${PQ_REPO:-$(cd "$(dirname "$0")/.." && pwd)}"
REF="${1:-HEAD}"; PORT="${2:-5174}"
WT="$HOME/.cache/pq/coachwt"
pid=$(ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)
[ -n "${pid:-}" ] && kill "$pid" && sleep 1
cd "$REPO"
SHA=$(git rev-parse --verify "$REF^{commit}")
mkdir -p "$(dirname "$WT")"
if [ -d "$WT" ]; then git -C "$WT" checkout -q --detach "$SHA"; else git worktree add -q --detach "$WT" "$SHA"; fi
# node_modules borrowed from the repo (root and each workspace that has one).
for nm in $(cd "$REPO" && find . -maxdepth 3 -name node_modules -type d -not -path './node_modules/*'); do
  [ -e "$WT/$nm" ] || ln -s "$REPO/$nm" "$WT/$nm"
done
[ -f "$REPO/apps/web/.env.local" ] && cp "$REPO/apps/web/.env.local" "$WT/apps/web/.env.local"
# Git-ignored, made by apps/web's postinstall: Blockly media and Pyodide (served locally, no Internet needed).
(cd "$WT/apps/web" && node scripts/copyBlocklyMedia.js && node scripts/copyPyodide.js)
cd "$WT/apps/web"
echo "PyQuest class server: $(git log --oneline -1 "$SHA") on http://localhost:$PORT"
HOST_ARGS=()
if [ "${PQ_HOST:-}" = 1 ]; then
  HOST_ARGS=(--host)
  # Skip Docker/VM bridges (172.16–31.x): the class Wi-Fi is usually 192.168.x or 10.x.
  for ip in $(hostname -I 2>/dev/null); do
    case "$ip" in 172.1[6-9].*|172.2[0-9].*|172.3[01].*|*:*) ;; *) echo "  children open: http://$ip:$PORT" ;; esac
  done
fi
exec npx vite --port "$PORT" --strictPort "${HOST_ARGS[@]}"
