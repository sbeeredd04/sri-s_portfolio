# Authored asset export

Use `optimize_model.py` for its existing static model catalog only. It rejects
an explicit interactive, vegetation or rigged profile before source mutation.

Use the preserving exporter for scene-authored assets:

```sh
blender -b --python-exit-code 1 --python scripts/blender/export_authored.py -- \
  --source /absolute/master.blend --manifest /absolute/asset.json \
  --out /absolute/asset.glb
```

Manifest example (adapt names and provenance to the actual asset):

```json
{
  "version": 1,
  "id": "bay-bench",
  "source": "Original portfolio model",
  "license": "Project-owned",
  "profile": "interactive",
  "units": "metres",
  "nodes": ["bench", "seat", "seat_anchor"],
  "anchors": ["seat_anchor"],
  "parents": {"seat": "bench", "seat_anchor": "bench"},
  "extras": {"bench": {"soundProfile": "wood"}}
}
```

Profiles: static, interactive, vegetation, rigged. Custom glTF vertex attributes
must start with `_`; name required attributes in `attributes`, e.g.
`{"grass": ["_WIND"]}`. Rigged output must contain a skin; set
`requireAnimation: true` when animation is part of the contract. Name collider
proxies and cutaway groups in `nodes` and `colliders`/`cutaways`. These declarations
validate references; they do not create colliders or implement runtime behavior.

One Blender unit equals one metre. Preserve object pivots, hierarchy and custom
properties. Output is written to a temporary GLB, checked, then atomically
replaces the destination. Source files are never saved. This exporter does not
perform lossy optimization or compression; any later compression must rerun the
same contract verification.

Run real export/reimport fixtures:

```sh
blender -b --python-exit-code 1 --python scripts/blender/test_authored_export.py
python3 -m unittest discover -s scripts/blender -p test_export_profiles.py
```

The fixtures prove interactive hierarchy/anchor metadata, vegetation attributes,
and animated skin data survive Blender's exporter/importer. They are test
geometry, not finished portfolio assets. Browser loader verification, visual
quality, footprint clearance and per-device cost remain separate asset gates.
