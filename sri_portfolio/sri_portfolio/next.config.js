const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix multiple Three.js instances by aliasing all imports to single copy
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': path.resolve(__dirname, 'node_modules/three'),
      'three/examples': path.resolve(__dirname, 'node_modules/three/examples')
    };
    
    // Ensure all three-related packages use the same Three.js instance
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'three': path.resolve(__dirname, 'node_modules/three')
    };
    
    // Add external handling for three-nebula to prevent bundling conflicts
    if (!isServer) {
      config.externals = config.externals || [];
      // Don't externalize three-nebula, but ensure it uses our Three.js alias
    }
    
    return config;
  }
}

module.exports = nextConfig; 