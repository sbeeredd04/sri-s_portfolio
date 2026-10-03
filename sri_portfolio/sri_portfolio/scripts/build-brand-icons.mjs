// Raster fallbacks for crawlers, older browsers and iOS, from the live SVG mark.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const root = fileURLToPath(new URL("../", import.meta.url));
const svg = await readFile(`${root}app/icon.svg`);
await mkdir(`${root}public/brand`, { recursive: true });
for (const [size, output] of [
  [96, "public/brand/sri-icon-96.png"],
  [180, "app/apple-icon.png"],
])
  await sharp(svg).resize(size, size).png().toFile(`${root}${output}`);
const sizes = [16, 32, 48, 96];
const images = await Promise.all(
  sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
);
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, i) => {
  const at = 6 + i * 16;
  header[at] = sizes[i];
  header[at + 1] = sizes[i];
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(image.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += image.length;
});
await writeFile(`${root}app/favicon.ico`, Buffer.concat([header, ...images]));
console.log(
  "Built favicon, search icon and Apple touch icon from app/icon.svg.",
);
