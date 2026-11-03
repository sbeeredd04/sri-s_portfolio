import test from "node:test";
import assert from "node:assert/strict";
import { madeCampus } from "../app/lib/made-campus-data.mjs";
import {
  madeGalleryLayout,
  buildMadeGallery,
  madeGalleryStories,
} from "../app/lib/made-gallery.mjs";

for (const site of madeCampus.studios.filter((s) => madeGalleryStories[s.id])) {
  test(`${site.name}: gallery furniture leaves the complete centre approach open and rests on its floor`, () => {
    const layout = madeGalleryLayout(site),
      built = buildMadeGallery(site);
    try {
      const aisle = layout.aisle;
      for (const key of ["wood", "metal", "paper"]) {
        const p = built[key].attributes.position;
        for (let i = 0; i < p.count; i += 3) {
          const xs = [0, 1, 2].map((j) => p.getX(i + j)),
            ys = [0, 1, 2].map((j) => p.getY(i + j)),
            zs = [0, 1, 2].map((j) => p.getZ(i + j));
          if (Math.max(...ys) <= layout.floor + 0.025 || Math.min(...ys) > 2.2)
            continue;
          const overlaps =
            Math.max(...xs) > aisle.minX &&
            Math.min(...xs) < aisle.maxX &&
            Math.max(...zs) > aisle.minZ &&
            Math.min(...zs) < aisle.maxZ;
          assert(
            !overlaps,
            `${key} triangle ${i / 3} intrudes into full 4m approach`,
          );
        }
      }
      const metal = built.metal.attributes.position;
      for (const x of [-0.17, 0.17])
        for (const z of [-0.83, 0.83]) {
          const heights = [];
          for (let i = 0; i < metal.count; i++)
            if (
              Math.abs(metal.getX(i) - layout.bench[0] - x) < 0.03 &&
              Math.abs(metal.getZ(i) - layout.bench[2] - z) < 0.03 &&
              metal.getY(i) < 1
            )
              heights.push(metal.getY(i));
          assert(heights.length > 0, "each bench leg exists");
          assert(
            Math.abs(Math.min(...heights) - layout.floor) < 0.001,
            "each bevelled leg touches the rendered floor",
          );
        }
      assert.equal(
        layout.exhibit[1],
        layout.floor,
        "exhibit starts on rendered floor",
      );
      const w = site.size[0] / 2,
        d = site.size[2] / 2;
      for (const key of ["wood", "metal", "paper"]) {
        const p = built[key].attributes.position;
        for (let i = 0; i < p.count; i++) {
          assert(Math.abs(p.getX(i)) < w, `${key} remains inside side walls`);
          // Facade plaque is intentionally on the exterior lintel.
          assert(
            p.getZ(i) > -d + 0.25 && p.getZ(i) < d + 0.07,
            `${key} stays inside rear wall / attached facade`,
          );
        }
      }
    } finally {
      Object.values(built).forEach((g) => g.dispose());
    }
  });
}
