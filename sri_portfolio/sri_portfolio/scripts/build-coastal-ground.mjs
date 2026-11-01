import sharp from "sharp";
import {
  coastalCoverPixels,
  coastalGround,
} from "../app/lib/coastal-ground.mjs";
await sharp(coastalCoverPixels(), {
  raw: { width: coastalGround.size, height: coastalGround.size, channels: 4 },
})
  .png()
  .toFile("public/materials/coastal-cover.png");
