// Shared by the rendered furniture, collision world, and integration tests.
export const studioSurfaces = {
  floor: { position: [0, -0.2, 0.5], size: [13, 0.38, 9] },
  rug: { position: [-0.25, 0.0175, 0.35], size: [4.7, 0.035, 3.7] },
  desk: { position: [-0.4, 0.745, -1], size: [3, 0.07, 1.15] },
  sofa: { position: [2.48, 0.35, 1.14], size: [1.18, 0.65, 2] },
  sofaBack: { position: [2.94, 0.78, 1.14], size: [0.28, 0.8, 2.02] },
  sofaSeat: { position: [2.42, 0.69, 1.14], size: [0.9, 0.16, 1.85] },
  coffeeTable: { position: [1.15, 0.55, 1.35], size: [0.68, 0.075, 1.1] },
  keyboard: { position: [-0.5, 0.795, -0.57], size: [0.4725, 0.02475, 0.1665] },
  chairSeat: { position: [-0.5, 0.5, -0.07], size: [0.72, 0.15, 0.65] },
  chairBack: { position: [-0.5, 0.96, 0.24], size: [0.72, 0.78, 0.12] },
};
export const studioMonitors = [
  { position: [-1.22, 1.19, -1.23], rotation: 0.16 },
  { position: [-0.48, 1.2, -1.32], rotation: 0 },
  { position: [0.26, 1.19, -1.23], rotation: -0.16 },
];
export const studioMonitorScale = 0.46;
export const studioKeyboardScale = 0.45;
export const studioKeycaps = { centerY: 0.014625, height: 0.0045 };
export const studioProps = {
  mug: {
    position: [0.77, 0.853, -0.68],
    mass: 0.32,
    halfHeight: 0.0696,
    radius: 0.0696,
    scale: 0.48,
  },
  book: {
    position: [-1.61, 0.807, -0.67],
    mass: 0.7,
    halfSize: [0.10764, 0.0234, 0.1638],
    scale: 0.52,
  },
  cushion: {
    position: [2.54, 1.04, 0.5],
    rotation: [0, 0.2, 0.1],
    mass: 0.25,
    halfSize: [0.23, 0.23, 0.095],
  },
};

export const studioCharacter = {
  position: [-0.5, 0.14, -0.18],
  rotation: Math.PI,
};

// The shell and its joinery share a single architectural section.
export const houseSection = {
  halfWidth: 6.42,
  eave: 3.5,
  ridge: 4.8,
  front: 5,
  back: -4,
};

export const studioArrival = {
  position: [20, 13, 30],
  target: [0, -3, 0.5],
  portrait: { position: [23, 18, 44], target: [0, -6, -3], fov: 63 },
};

// Desk joinery and its collision shapes share these metre-scale dimensions.
export const studioDeskFrame = [
  ...[-1.68, 0.88].flatMap((x) => [
    { position: [x, 0.055, -1], size: [0.115, 0.04, 0.92], radius: 0.015 },
    { position: [x, 0.365, -1.06], size: [0.085, 0.58, 0.105], radius: 0.012 },
    { position: [x, 0.61, -1.06], size: [0.065, 0.16, 0.08], radius: 0.008 },
    { position: [x, 0.6925, -1], size: [0.1, 0.035, 0.84], radius: 0.008 },
  ]),
  { position: [-0.4, 0.669, -1.32], size: [2.58, 0.07, 0.065], radius: 0.009 },
];
export const studioDeskLight = {
  position: [-0.48, 1.45, -1.275],
  target: [-0.48, 0.78, -0.64],
  width: 0.42,
};

// The same apartment level is used by the model, lights, cameras and physics.
export const APARTMENT_LEVEL = 9.6;
export const apartmentPoint = ([x, y, z]) => [x, y + APARTMENT_LEVEL, z];
