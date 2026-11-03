export function facingYaw(position, target) {
  return Math.atan2(target[0] - position[0], target[2] - position[2]);
}

export const cinemaOrigin = [9, 0, -1.5];
export const cinemaScreen = [0, 2, -0.329];
export const cinemaSeats = [-1.3, 0, 1.3].map((x) => {
  const position = [x, 0.12, 2.4];
  return { position, yaw: facingYaw(position, cinemaScreen) };
});
export const listeningPendants = [[-2.8, 4, 0], [0.6, 4, -1.4], [2.8, 4, 2]];
export const listeningHearth = { position: [3.7, 0, -1.7], flame: [0, 1.05, 0.36] };
export const listeningRoomSign = { position: [-3.25, 3.3, 3.7], size: [2.3, .75] };
export const listeningSeat = {
  position: [-3, 0.14, 1.35],
  target: [-2, 1.1, -2.55],
};
export const entertainmentPaths = [
  [[-4, 6], [13, 6], 3],
  [[0, 7], [0, 4.4], 3],
  [[12.8, 6], [12.8, 2.3], 2],
  [[12.8, 2.3], [11.8, 2.3], 2],
];

// The cinema's garden, in the cinema's frame: a bulb marquee over the
// canopy, beanbags behind the chairs, string lights along both sides (none
// across the view, so no bulb hangs in front of the picture), a
// projector booth off the aisle and a popcorn cart by the east edge.
export const cinemaGarden = {
  marquee: { position: [0, 4.3, 0.2], size: [4.2, 0.9] },
  beanbags: [-1.95, -0.65, 0.65, 1.95].map((x, i) => {
    const position = [x, 0.12, 3.85];
    return {
      position,
      yaw: facingYaw(position, cinemaScreen),
      color: ["#b35d4c", "#3f6b73", "#c89a4b", "#5b5f8f"][i],
    };
  }),
  posts: [
    [-3, 4.4],
    [3, 4.4],
  ],
  strands: [
    [[-2.65, 3.45, 0.5], [-3, 2.75, 4.4]],
    [[2.65, 3.45, 0.5], [3, 2.75, 4.4]],
  ],
  booth: { position: [-2.7, 0, 5.3], size: [1.2, 2.1, 1] },
  cart: { position: [3.9, 0, 3.2], yaw: -Math.PI / 2 },
};

// The instanced bulbs and practical lights use the same strand samples.
export function cinemaStrandBulbs([a, b]) {
  return Array.from({ length: 11 }, (_, i) => {
    const t = (i + 0.5) / 11;
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * 0.32,
      a[2] + (b[2] - a[2]) * t,
    ];
  });
}
