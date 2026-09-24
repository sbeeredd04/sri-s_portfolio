#!/usr/bin/env python3
"""Download the CC0 sources listed in assets.json into asset-src/.

Poly Haven by default; texture entries with "source": "ambientcg" come from ambientCG.

Stdlib only. Files are verified by md5 and skipped when already cached.

  python3 scripts/blender/fetch_polyhaven.py            # everything
  python3 scripts/blender/fetch_polyhaven.py --only models --ids fir_sapling
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

API = "https://api.polyhaven.com"
ACG_API = "https://ambientcg.com/api/v2/full_json"
HERE = Path(__file__).resolve().parent
APP = HERE.parents[1]
CACHE = APP / "asset-src"
UA = {"User-Agent": "sri-portfolio-asset-pipeline/1.0 (CC0 fetch)"}
TEXTURE_MAPS = {"Diffuse": "diff", "nor_gl": "nor_gl", "arm": "arm"}


def get_json(url: str) -> dict:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as resp:
        return json.load(resp)


def md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, dest: Path, expected_md5: str | None = None, retries: int = 3) -> None:
    if dest.exists() and (expected_md5 is None or md5(dest) == expected_md5):
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as resp, tmp.open("wb") as out:
                while chunk := resp.read(1 << 20):
                    out.write(chunk)
            if expected_md5 and md5(tmp) != expected_md5:
                raise ValueError(f"md5 mismatch for {url}")
            tmp.replace(dest)
            print(f"  got {dest.relative_to(CACHE)} ({dest.stat().st_size // 1024} KB)")
            return
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            print(f"  retry {attempt}/{retries} {url}: {exc}", file=sys.stderr)
            time.sleep(2 * attempt)
    raise RuntimeError(f"failed to download {url}")


def save_info(asset_id: str, folder: Path) -> dict:
    info = get_json(f"{API}/info/{asset_id}")
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "info.json").write_text(json.dumps(info, indent=1))
    return info


def fetch_model(asset_id: str, res: str) -> None:
    folder = CACHE / "models" / asset_id
    save_info(asset_id, folder)
    files = get_json(f"{API}/files/{asset_id}")
    # Prefer glTF (jpg textures); some assets only ship .blend (png textures).
    fmt = "gltf" if "gltf" in files else "blend"
    source = files[fmt][res][fmt]
    download(source["url"], folder / Path(source["url"]).name, source.get("md5"))
    for rel, meta in source.get("include", {}).items():
        download(meta["url"], folder / rel, meta.get("md5"))
    # Poly Haven's glTF export drops foliage alpha; fetch the *_alpha maps separately.
    for key, variants in files.items():
        if (key.endswith("_alpha") or key == "Alpha") and res in variants:
            meta = variants[res].get("jpg") or variants[res].get("png")
            download(meta["url"], folder / "textures" / Path(meta["url"]).name, meta.get("md5"))


def fetch_texture(asset_id: str, res: str) -> None:
    folder = CACHE / "textures" / asset_id
    save_info(asset_id, folder)
    files = get_json(f"{API}/files/{asset_id}")
    for key, short in TEXTURE_MAPS.items():
        meta = files[key][res]["jpg"]
        download(meta["url"], folder / f"{short}.jpg", meta.get("md5"))


def fetch_ambientcg_texture(asset_id: str, res: str) -> None:
    """ambientCG ships a zip per resolution; keep Color, NormalGL, Roughness and AO as jpgs."""
    folder = CACHE / "textures" / asset_id
    data = get_json(f"{ACG_API}?id={asset_id}&include=downloadData")["foundAssets"][0]
    downloads = data["downloadFolders"]["default"]["downloadFiletypeCategories"]["zip"]["downloads"]
    attribute = f"{res.upper()}-JPG"
    link = next(d["downloadLink"] for d in downloads if d["attribute"] == attribute)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "info.json").write_text(json.dumps({
        "name": data.get("displayName", asset_id),
        "authors": {"ambientCG (Lennart Demes)": "all"},
        "source": data.get("shortLink"),
        "dimensions": None,
    }, indent=1))
    archive = folder / f"{asset_id}_{attribute}.zip"
    download(link, archive)
    wanted = {"_Color.jpg": "diff.jpg", "_NormalGL.jpg": "nor_gl.jpg",
              "_Roughness.jpg": "rough.jpg", "_AmbientOcclusion.jpg": "ao.jpg"}
    with zipfile.ZipFile(archive) as zf:
        for member in zf.namelist():
            for suffix, name in wanted.items():
                if member.endswith(suffix):
                    (folder / name).write_bytes(zf.read(member))


def fetch_hdri(asset_id: str, res: str) -> None:
    folder = CACHE / "hdri" / asset_id
    save_info(asset_id, folder)
    meta = get_json(f"{API}/files/{asset_id}")["hdri"][res]["hdr"]
    download(meta["url"], folder / f"{asset_id}_{res}.hdr", meta.get("md5"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=HERE / "assets.json")
    parser.add_argument("--only", choices=["models", "textures", "hdris"])
    parser.add_argument("--ids", nargs="*", help="restrict to these Poly Haven ids")
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text())
    defaults = manifest["defaults"]
    jobs = {
        "models": (fetch_model, "model_res"),
        "textures": (fetch_texture, "texture_res"),
        "hdris": (fetch_hdri, "hdri_res"),
    }
    failures = []
    for kind, (fetch, res_key) in jobs.items():
        if args.only and args.only != kind:
            continue
        for entry in manifest[kind]:
            if args.ids and entry["id"] not in args.ids:
                continue
            print(f"[{kind}] {entry['id']}")
            try:
                if entry.get("source") == "ambientcg":
                    fetch_ambientcg_texture(entry["id"], entry.get("res", defaults[res_key]))
                else:
                    fetch(entry["id"], entry.get("res", defaults[res_key]))
            except (RuntimeError, KeyError, urllib.error.URLError) as exc:
                print(f"  FAILED {entry['id']}: {exc}", file=sys.stderr)
                failures.append(entry["id"])
    if failures:
        print(f"failed: {', '.join(failures)}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
