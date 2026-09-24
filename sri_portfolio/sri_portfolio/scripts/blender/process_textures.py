#!/usr/bin/env python3
"""Convert cached Poly Haven texture sets to WebP PBR maps and copy HDRIs into public/.

  public/materials/<out>/color.webp   sRGB albedo
  public/materials/<out>/normal.webp  linear, OpenGL (+Y) tangent-space normal
  public/materials/<out>/arm.webp     linear, R=AO G=roughness B=metalness (glTF ORM order)
  public/hdri/<out>.hdr               equirectangular Radiance HDR

Requires `cwebp` (brew install webp). ambientCG sets ship separate AO/roughness maps;
Pillow packs them into arm.jpg first.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[1]
CACHE = APP / "asset-src"
# (output name, WebP quality, size divisor): AO/roughness are low-frequency, so they ship at half size.
MAPS = {"diff": ("color", 78), "nor_gl": ("normal", 80), "arm": ("arm", 80, 2)}


def to_webp(src: Path, dest: Path, quality: int, size: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["cwebp", "-quiet", "-mt", "-q", str(quality), "-m", "6", "-resize", str(size), str(size),
           "-metadata", "none", str(src), "-o", str(dest)]
    subprocess.run(cmd, check=True)


def pack_arm(src_dir: Path) -> None:
    from PIL import Image  # only needed for sets without a packed ARM map

    rough = Image.open(src_dir / "rough.jpg").convert("L")
    ao_path = src_dir / "ao.jpg"
    ao = Image.open(ao_path).convert("L").resize(rough.size) if ao_path.exists() else Image.new("L", rough.size, 255)
    metal = Image.new("L", rough.size, 0)
    Image.merge("RGB", (ao, rough, metal)).save(src_dir / "arm.jpg", quality=95)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=HERE / "assets.json")
    parser.add_argument("--size", type=int, default=1024)
    args = parser.parse_args()
    if not shutil.which("cwebp"):
        print("cwebp not found (brew install webp)", file=sys.stderr)
        return 1
    manifest = json.loads(args.manifest.read_text())
    for entry in manifest["textures"]:
        src_dir = CACHE / "textures" / entry["id"]
        if not (src_dir / "arm.jpg").exists():
            pack_arm(src_dir)
        for key, (name, quality, *div) in MAPS.items():
            size = args.size // (div[0] if div else 1)
            to_webp(src_dir / f"{key}.jpg", APP / "public" / "materials" / entry["out"] / f"{name}.webp", quality, size)
        print(f"material {entry['out']} <- {entry['id']}")
    for entry in manifest["hdris"]:
        res = entry.get("res", manifest["defaults"]["hdri_res"])
        dest = APP / "public" / "hdri" / f"{entry['out']}.hdr"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(CACHE / "hdri" / entry["id"] / f"{entry['id']}_{res}.hdr", dest)
        print(f"hdri {dest.name} <- {entry['id']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
