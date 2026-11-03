import { Color } from "three";

// Seeded rather than a visible Fibonacci lattice. Most stars are small and
// faint, with only a handful of brighter warm/cool points in each view.
export function starField(count = 2400) {
  let seed = 14783;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const positions = [], colors = [], diameters = [];
  const palette = ["#d7e2f5", "#eff0f8", "#bed2f4", "#ffe6c6"];
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1, angle = random() * Math.PI * 2;
    const radius = Math.sqrt(1 - y * y);
    positions.push(Math.cos(angle) * radius * 900, y * 900, Math.sin(angle) * radius * 900);
    const magnitude = Math.pow(random(), 3);
    const color = new Color(palette[Math.floor(random() * palette.length)]);
    color.multiplyScalar(.3 + magnitude * .7);
    colors.push(color.r, color.g, color.b);
    diameters.push(1.4 + magnitude * 2.35);
  }
  return { positions, colors, diameters };
}
