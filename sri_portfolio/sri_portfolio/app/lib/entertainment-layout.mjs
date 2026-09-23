export function facingYaw(position, target) {
  return Math.atan2(target[0] - position[0], target[2] - position[2]);
}

export const cinemaOrigin = [9, 0, -1.5];
export const cinemaScreen = [0, 2, -0.329];
export const cinemaSeats = [-1.3, 0, 1.3].map((x) => {
  const position = [x, 0.12, 2.4];
  return { position, yaw: facingYaw(position, cinemaScreen) };
});
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
