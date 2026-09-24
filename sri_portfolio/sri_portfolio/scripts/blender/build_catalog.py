#!/usr/bin/env python3
"""Write public/models/CATALOG.json + CATALOG.md from assets.json, optimizer stats and the shipped files."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from glb_info import summarize  # noqa: E402

APP = HERE.parents[1]
PUBLIC = APP / "public"
CACHE = APP / "asset-src"
LICENSE = "CC0 1.0 (public domain) via Poly Haven"


def info(kind: str, asset_id: str) -> dict:
    path = CACHE / kind / asset_id / "info.json"
    return json.loads(path.read_text()) if path.exists() else {}


def authors(meta: dict) -> str:
    return ", ".join(f"{name} ({role})" for name, role in meta.get("authors", {}).items())


def model_rows(manifest: dict) -> list[dict]:
    rows = []
    for entry in manifest["models"]:
        stats_path = CACHE / "stats" / f"{entry['out']}.json"
        glb = PUBLIC / "models" / f"{entry['out']}.glb"
        if not stats_path.exists() or not glb.exists():
            print(f"skip {entry['id']}: not built", file=sys.stderr)
            continue
        stats = json.loads(stats_path.read_text())
        shipped = summarize(glb)
        meta = info("models", entry["id"])
        rows.append({
            "file": stats["file"],
            "name": meta.get("name", entry["id"]),
            "group": entry["group"],
            "source": f"https://polyhaven.com/a/{entry['id']}",
            "author": authors(meta),
            "license": LICENSE,
            "triangles": shipped["triangles"],
            "lods": stats["lods"],
            "source_triangles": stats["source_tris"],
            "bytes": glb.stat().st_size,
            "dimensions_m": stats["dimensions_m"],
            "pivot": stats["pivot"],
            "nodes": shipped["nodes"],
            "materials": [
                {"name": m["name"], "alphaMode": m["alphaMode"], "maps": sorted(m["maps"])}
                for m in shipped["materials"]
            ],
            "extensionsRequired": shipped["extensionsRequired"],
            "foliage": "baked billboard-cloud cards" if entry.get("cards") else ("alpha cards thinned" if entry.get("foliage") else None),
            "use": entry["use"],
        })
    return rows


SCULPT_USE = {
    "granite-wall": "El Capitan-inspired sheer wall: face +X, waterfall chute at lz=+0.78, 2.5 m talus apron",
    "granite-dome": "Half Dome-inspired dome: exfoliation plates on the back, sheared face toward -Z",
    "granite-ridge": "Broken granite ridgeline behind the valley",
    "tree-pine-dense": "Dense Sierra-style conifer, 5.5 m, crown radius 1.8 m; LOD0/LOD1 nodes for <Detailed>",
    "office-chair": "Task chair for the home desk; faces +Z, seat top 0.515 m",
    "monitor-27": "27-inch thin-bezel monitor; material 'screen' is the display quad (UV 0..1)",
}


def sculpted_rows() -> list[dict]:
    """Original procedural sculpts from scripts/blender/sculpt_granite.py (no third-party source)."""
    rows = []
    for stats_path in sorted((CACHE / "stats").glob("*.json")):
        stats = json.loads(stats_path.read_text())
        if not (stats_path.stem.startswith("granite-") or stats.get("procedural")):
            continue
        glb = PUBLIC / stats["file"]
        if not glb.exists():
            continue
        shipped = summarize(glb)
        rows.append({
            "file": stats["file"],
            "source": stats.get("source", "original: scripts/blender/sculpt_granite.py (procedural)"),
            "license": "project-owned original (texture inputs CC0 where noted)",
            "triangles": shipped["triangles"],
            "lods": stats.get("lods"),
            "high_poly_triangles": stats.get("high_tris"),
            "bytes": glb.stat().st_size,
            "bounds_local_m": stats.get("bounds_local_m"),
            "dimensions_m": stats.get("dimensions_m"),
            "screen": stats.get("screen"),
            "pivot": stats.get("frame") or stats.get("pivot"),
            "materials": [{"name": m["name"], "maps": sorted(m["maps"])} for m in shipped["materials"]],
            "extensionsRequired": shipped["extensionsRequired"],
            "use": SCULPT_USE.get(glb.stem, ""),
        })
    return rows


def material_rows(manifest: dict) -> list[dict]:
    rows = []
    for entry in manifest["textures"]:
        folder = PUBLIC / "materials" / entry["out"]
        meta = info("textures", entry["id"])
        acg = entry.get("source") == "ambientcg"
        dims = meta.get("dimensions") or [0, 0]
        tile = entry.get("tile_size_m") or [round(dims[0] / 1000, 2), round(dims[1] / 1000, 2)]
        rows.append({
            "folder": f"materials/{entry['out']}/",
            "name": meta.get("name", entry["id"]),
            "source": f"https://ambientcg.com/a/{entry['id']}" if acg else f"https://polyhaven.com/a/{entry['id']}",
            "author": authors(meta),
            "license": "CC0 1.0 (public domain) via ambientCG" if acg else LICENSE,
            "maps": {"color": "sRGB", "normal": "linear, OpenGL +Y", "arm": "linear, R=AO G=rough B=metal (half res)"},
            "tile_size_m": tile,
            "tile_size_note": entry.get("tile_size_note", "Poly Haven measured real-world size"),
            "bytes": sum(p.stat().st_size for p in folder.glob("*.webp")),
            "use": entry["use"],
        })
    return rows


def hdri_rows(manifest: dict) -> list[dict]:
    rows = []
    for entry in manifest["hdris"]:
        path = PUBLIC / "hdri" / f"{entry['out']}.hdr"
        meta = info("hdri", entry["id"])
        rows.append({
            "file": f"hdri/{path.name}",
            "name": meta.get("name", entry["id"]),
            "source": f"https://polyhaven.com/a/{entry['id']}",
            "author": authors(meta),
            "license": LICENSE,
            "resolution": "1024x512 equirectangular",
            "bytes": path.stat().st_size if path.exists() else None,
            "use": entry["use"],
        })
    return rows


def kb(n: int) -> str:
    return f"{n / 1024:.0f}"


def markdown(cat: dict) -> str:
    total = cat["totals"]
    lines = [
        "# 3D asset catalog",
        "",
        "Generated by `scripts/blender/build_catalog.py`. Do not edit by hand; rebuild with "
        "`scripts/blender/build_all.sh`. Every asset is CC0 (Poly Haven, plus ambientCG where noted).",
        "",
        "Loading: GLBs need `EXT_meshopt_compression` (drei `useGLTF` enables the meshopt decoder by default) "
        "and `EXT_texture_webp`. Units are metres, +Y up, pivot at the bottom-centre of the bounding box. "
        "Assets with `_LOD0`/`_LOD1` nodes are meant for drei `<Detailed>`.",
        "",
        f"Totals: models {total['models_mb']} MB, sculpted {total['sculpted_mb']} MB, materials {total['materials_mb']} MB, "
        f"HDRIs {total['hdri_mb']} MB, all {total['all_mb']} MB.",
        "",
        "## Models",
        "",
        "| File | Tris (LODs) | KB | W x H x D (m) | Materials / maps | Author | Use |",
        "|---|---|---|---|---|---|---|",
    ]
    for row in cat["models"]:
        d = row["dimensions_m"]
        lods = " / ".join(str(l["tris"]) for l in row["lods"])
        mats = "; ".join(f"{m['name']} [{', '.join(m['maps']) or 'factors'}{', ' + m['alphaMode'] if m['alphaMode'] != 'OPAQUE' else ''}]"
                         for m in row["materials"])
        lines.append(f"| [{row['file']}]({row['source']}) | {lods} | {kb(row['bytes'])} | "
                     f"{d['width_x']} x {d['height_y']} x {d['depth_z']} | {mats} | {row['author']} | {row['use']} |")
    lines += ["", "## Original procedural assets", "",
              "Built by scripts in scripts/blender/ (sculpt_granite.py, build_pine.py, build_props.py). Granite forms "
              "are in each form's valley-layout local frame (lx, y, lz), origin form.x/z at y=0: place without "
              "re-centring; colour comes from the app's triplanar granite.", "",
              "| File | Tris | KB | Size / bounds (m) | Use |", "|---|---|---|---|---|"]
    for row in cat["sculpted"]:
        if row["bounds_local_m"]:
            b = row["bounds_local_m"]
            size = f"min {b['min']} / max {b['max']}"
            tris = f"{row['triangles']} (high {row['high_poly_triangles']})"
        else:
            d = row["dimensions_m"]
            size = f"{d['width_x']} x {d['height_y']} x {d['depth_z']}"
            tris = " / ".join(str(v) for v in row["lods"].values()) if row["lods"] else str(row["triangles"])
        lines.append(f"| {row['file']} | {tris} | {kb(row['bytes'])} | {size} | {row['use']} |")
    lines += ["", "## Material texture sets", "", "| Folder | Tile (m) | KB | Author | Use |", "|---|---|---|---|---|"]
    for row in cat["materials"]:
        tile = " x ".join(str(v) for v in row["tile_size_m"]) + (" (est.)" if "estimate" in row["tile_size_note"] else "")
        lines.append(f"| [{row['folder']}]({row['source']}) | {tile} | {kb(row['bytes'])} | {row['author']} | {row['use']} |")
    lines += ["", "Each folder holds `color.webp` (sRGB), `normal.webp` (linear, OpenGL) and `arm.webp` "
              "(linear AO/roughness/metalness, glTF ORM order: use as `aoMap` + `roughnessMap` + `metalnessMap`).",
              "", "## HDRIs", "", "| File | KB | Author | Use |", "|---|---|---|---|"]
    for row in cat["hdris"]:
        lines.append(f"| [{row['file']}]({row['source']}) | {kb(row['bytes'] or 0)} | {row['author']} | {row['use']} |")
    return "\n".join(lines) + "\n"


def main() -> None:
    manifest = json.loads((HERE / "assets.json").read_text())
    cat = {"models": model_rows(manifest), "sculpted": sculpted_rows(),
           "materials": material_rows(manifest), "hdris": hdri_rows(manifest)}
    mb = lambda rows: round(sum(r["bytes"] or 0 for r in rows) / 1e6, 2)  # noqa: E731
    cat["totals"] = {"models_mb": mb(cat["models"]), "sculpted_mb": mb(cat["sculpted"]),
                     "materials_mb": mb(cat["materials"]), "hdri_mb": mb(cat["hdris"])}
    cat["totals"]["all_mb"] = round(sum(cat["totals"].values()), 2)
    out = PUBLIC / "models"
    (out / "CATALOG.json").write_text(json.dumps(cat, indent=1) + "\n")
    (out / "CATALOG.md").write_text(markdown(cat))
    print(json.dumps(cat["totals"]))


if __name__ == "__main__":
    main()
