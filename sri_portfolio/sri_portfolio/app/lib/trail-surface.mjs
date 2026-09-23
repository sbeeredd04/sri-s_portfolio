import { renderedSurfaceHeight } from "./terrain-geometry.mjs";
import {
  outdoorsLift,
  overlookElevation,
  trailPavingHeight,
} from "./valley-layout.mjs";

export const localTrailGround = (x, z) =>
  renderedSurfaceHeight("trail", x, z) - outdoorsLift;
let deckTop;
export function localTrailPaving(x, z) {
  deckTop ??= overlookElevation(localTrailGround);
  return trailPavingHeight(x, z, localTrailGround, deckTop);
}
export const trailFootHeight = (x, z) =>
  localTrailPaving(x, z) + outdoorsLift + 0.004;
