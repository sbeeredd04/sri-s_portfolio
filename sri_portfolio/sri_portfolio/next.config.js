const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Configure Turbopack for Next.js 16
  turbopack: {
    resolveAlias: {
      'three': './node_modules/three',
      'three/examples': './node_modules/three/examples'
    }
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
    
    // Add bundle analyzer plugin for performance insights
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.optimize.SplitChunksPlugin({
          chunks: 'all',
          cacheGroups: {
            // Split large dependencies into separate chunks
            three: {
              test: /[\\/]node_modules[\\/]three[\\/]/,
              name: 'three-vendor',
              priority: 10,
              enforce: true,
              reuseExistingChunk: true,
            },
            reactThree: {
              test: /[\\/]node_modules[\\/]@react-three[\\/]/,
              name: 'react-three-vendor',
              priority: 10,
              enforce: true,
              reuseExistingChunk: true,
            },
            tsparticles: {
              test: /[\\/]node_modules[\\/]@tsparticles[\\/]/,
              name: 'tsparticles-vendor',
              priority: 9,
              enforce: true,
              reuseExistingChunk: true,
            },
            framedMotion: {
              test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
              name: 'animation-vendor',
              priority: 8,
              enforce: true,
              reuseExistingChunk: true,
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              name: 'common',
            },
          },
        })
      );
    }
    
    return config;
  }
}

module.exports = withBundleAnalyzer(nextConfig); 