// Shared first studio frame. Dimensions are metres, sea=0, plaza=2.2m.
export const madeStage = {
  level: 2.2,
  outline: [
    [-47.5, -32],
    [-42, -40],
    [37, -40],
    [47.5, -31],
    [47.5, 28],
    [39, 40],
    [-40, 40],
    [-47.5, 33],
  ],
};
export const aetherSite = {
  id: "aether",
  center: [-26, 2.2, -14],
  yaw: Math.PI / 4,
  size: [12, 8.4, 11],
};
export function aetherPoint([x, y, z]) {
  const c = Math.cos(aetherSite.yaw),
    s = Math.sin(aetherSite.yaw);
  return [
    aetherSite.center[0] + x * c + z * s,
    aetherSite.center[1] + y,
    aetherSite.center[2] - x * s + z * c,
  ];
}
export const aetherViews = {
  outside: {
    position: aetherPoint([17, 11, 22]),
    target: aetherPoint([0, 3.3, 0]),
    fov: 45,
  },
  entry: {
    position: aetherPoint([0, 1.83, 9.5]),
    target: aetherPoint([0, 1.83, -1]),
    fov: 42,
  },
  inside: {
    position: aetherPoint([1.65, 1.83, 1.8]),
    target: aetherPoint([2, 1.55, -2]),
    fov: 50,
  },
};

// Portrait preserves both the exhibit and its back-wall display in one shot.
// These positions also feed the shipped-mesh camera clearance check.
export function aetherView(name, portrait = false) {
  const shot = aetherViews[name];
  if (!portrait) return shot;
  if (name === "inside")
    return {
      position: aetherPoint([1, 1.9, 2.8]),
      target: aetherPoint([1, 1.5, -3.4]),
      fov: 78,
    };
  return {
    ...shot,
    position:
      name === "outside"
        ? shot.position.map(
            (p, i) => shot.target[i] + (p - shot.target[i]) * 1.3,
          )
        : shot.position,
    fov: 65,
  };
}
