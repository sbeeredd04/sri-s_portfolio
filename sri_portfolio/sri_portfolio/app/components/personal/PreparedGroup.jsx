"use client";

// Keep authored detail mounted between visits. Renderer-level compileAsync
// proved brittle with mixed custom/standard materials and could leave an
// entire room invisible after navigation, which is worse than a short first
// frame shader warm-up.
export default function PreparedGroup({ visible, children }) {
  return <group visible={visible}>{children}</group>;
}
