import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
// Authored color/normal/packed ARM maps, reduced once at build time. No runtime
// canvas resampling/upload burst on Safari; original desktop maps stay intact.
const root = path.resolve('public/materials');
let oldPixels = 0, newPixels = 0, count = 0;
for (const dir of await readdir(root, {withFileTypes:true})) {
  if (!dir.isDirectory() || dir.name === 'mobile') continue;
  for (const name of ['color.webp','normal.webp','arm.webp']) {
    const input = path.join(root, dir.name, name);
    let meta;
    try { meta = await sharp(input).metadata(); } catch { continue; }
    const output = path.join(root, 'mobile', dir.name, name);
    await mkdir(path.dirname(output), {recursive:true});
    const info = await sharp(input).resize({width:512,height:512,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toFile(output);
    oldPixels += meta.width * meta.height; newPixels += info.width * info.height; count++;
  }
}
console.log(JSON.stringify({count,oldPixels,newPixels,estimatedRgbaMipBytesBefore:oldPixels*4*4/3,estimatedRgbaMipBytesAfter:newPixels*4*4/3}));
