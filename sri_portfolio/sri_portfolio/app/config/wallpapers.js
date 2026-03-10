/**
 * Wallpaper Configuration
 * Centralized list of all available wallpapers for consistent preloading across the app
 */

export const WALLPAPERS = [
  { name: "Default", path: "/background/homeEnv.jpg" },
  { name: "Tahoe", path: "/background/tahoe-dark.jpg" },
  { name: "Sequoia", path: "/background/sequoia-dark.jpg" },
  { name: "Sunrise", path: "/background/sequoia-sunrise.jpg" },
  { name: "Sonoma", path: "/background/sonoma-light.jpg" },
  { name: "Sonoma Dark", path: "/background/sonoma-dark.jpg" },
  { name: "Ventura", path: "/background/ventura-dark.jpg" },
  { name: "Monterey", path: "/background/monterey-dark.jpg" },
  { name: "Big Sur", path: "/background/big-sur-night.jpg" },
  { name: "Big Sur Day", path: "/background/big-sur-color-day.jpg" },
  { name: "Catalina", path: "/background/catalina-night.jpg" },
  { name: "Mojave", path: "/background/mojave-night.jpg" },
  { name: "Island", path: "/background/island.jpg" },
  { name: "Aurora", path: "/background/aurora.jpg" },
  { name: "Dunes", path: "/background/desert-dunes.jpg" },
  { name: "Ocean", path: "/background/ocean-cliffs.jpg" },
  { name: "Alpine", path: "/background/mountain-lake.jpg" },
  { name: "Peaks", path: "/background/twilight-peaks.jpg" },
  { name: "Moon", path: "/background/moon.jpg" },
  { name: "Canyon", path: "/background/antelope.jpg" },
  { name: "Stars", path: "/background/purpleStars.jpg" },
  { name: "Forest", path: "/background/bg2.jpg" },
  { name: "Bridge", path: "/background/bridge.jpg" },
];

/**
 * Preload wallpaper images
 * Call this during the loading phase to ensure images are cached before portfolio loads
 */
export function preloadWallpapers() {
  if (typeof window === 'undefined') return;
  
  WALLPAPERS.forEach(wallpaper => {
    // Create img element to start loading
    const img = new Image();
    img.src = wallpaper.path;
    img.onload = () => console.debug(`Wallpaper preloaded: ${wallpaper.name}`);
    img.onerror = () => console.warn(`Failed to preload wallpaper: ${wallpaper.name} from ${wallpaper.path}`);
  });
  
  // Also create link prefetch hints for better browser caching
  WALLPAPERS.forEach(wallpaper => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = wallpaper.path;
    document.head.appendChild(link);
  });
}
