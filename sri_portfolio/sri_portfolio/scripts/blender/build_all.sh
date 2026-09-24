#!/usr/bin/env bash
# Rebuild every CC0 asset listed in scripts/blender/assets.json, plus the original procedural assets
# (granite forms, dense pine, office chair, monitor).
#   scripts/blender/build_all.sh              # fetch + textures + models + previews + catalog
#   scripts/blender/build_all.sh fir_tree_01  # only these model ids (still re-catalogs)
# Env: BLENDER (default: blender on PATH), PREVIEW_DIR (default: asset-src/previews).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../.." && pwd)"
BLENDER="${BLENDER:-blender}"
PREVIEW_DIR="${PREVIEW_DIR:-$APP/asset-src/previews}"
LOG_DIR="$APP/asset-src/logs"
mkdir -p "$LOG_DIR"
cd "$APP"

ids=("$@")
if [ $# -eq 0 ]; then
  python3 "$HERE/fetch_polyhaven.py"
  python3 "$HERE/process_textures.py"
  while IFS= read -r id; do ids+=("$id"); done < <(
    python3 -c 'import json,sys; [print(m["id"]) for m in json.load(open(sys.argv[1]))["models"]]' "$HERE/assets.json")
else
  python3 "$HERE/fetch_polyhaven.py" --only models --ids "${ids[@]}"
fi

failed=()
for id in "${ids[@]}"; do
  echo "== $id"
  if ! "$BLENDER" -b --factory-startup --python "$HERE/optimize_model.py" -- --id "$id" >"$LOG_DIR/$id.log" 2>&1; then
    echo "   FAILED (see $LOG_DIR/$id.log)"; failed+=("$id"); continue
  fi
  grep '^STATS' "$LOG_DIR/$id.log" | cut -c1-160
done

if [ $# -eq 0 ]; then
    for script in sculpt_granite build_pine build_props; do
    echo "== $script"
    "$BLENDER" -b --factory-startup --python "$HERE/$script.py" >"$LOG_DIR/$script.log" 2>&1 \
      || { echo "   FAILED (see $LOG_DIR/$script.log)"; failed+=("$script"); }
  done
fi

"$BLENDER" -b --factory-startup --python "$HERE/render_preview.py" -- --out-dir "$PREVIEW_DIR" public/models/*.glb \
  >"$LOG_DIR/previews.log" 2>&1
"$BLENDER" -b --factory-startup --python "$HERE/render_preview.py" -- --out-dir "$PREVIEW_DIR/granite" --overcast \
  --engine CYCLES --triplanar public/materials/granite-cliff/color.webp public/models/granite-*.glb \
  >"$LOG_DIR/previews-granite.log" 2>&1
python3 "$HERE/build_catalog.py"

if [ ${#failed[@]} -gt 0 ]; then echo "failed: ${failed[*]}"; exit 1; fi
