# Dependency Upgrade Notes

This document describes the dependency upgrades performed on the sri_portfolio project.

## Major Version Upgrades

### Next.js: 15.0.2 → 16.0.0
- **Breaking Change**: Next.js 16 uses Turbopack by default for builds
- **Migration**: Added `turbopack` configuration in `next.config.js` for Three.js aliases
- **Migration**: Maintained `webpack` configuration for backward compatibility

### React & React DOM: 18.0.0 → 19.2.0
- **Breaking Change**: React 19 uses the new JSX transform
- **Migration**: Updated `tsconfig.json` to use `"jsx": "react-jsx"`
- **Note**: All React components work without changes

### @react-three/fiber: 8.18.0 → 9.4.0
- **Breaking Change**: Requires React 19
- **Migration**: No code changes needed, peer dependencies automatically resolved
- **Note**: Compatible with Three.js 0.180.0

### @react-three/drei: 9.122.0 → 10.7.6
- **Breaking Change**: Requires @react-three/fiber 9.x
- **Migration**: No code changes needed

### framer-motion: 6.5.1 → 12.23.24
- **Major Update**: Multiple major versions jumped
- **Migration**: No breaking changes detected in current usage
- **Note**: New features available but not required for existing code

## Other Significant Upgrades

### Three.js: 0.177.0 → 0.180.0
- Minor version update with bug fixes and improvements
- No breaking changes for current usage

### TypeScript: 5.8.3 → 5.9.3
- Patch version update with bug fixes

### node-fetch: 2.7.0 → 3.3.2
- **Breaking Change**: Now a native ESM module
- **Note**: Works with Next.js 16 without issues

### @tabler/icons-react: 2.47.0 → 3.35.0
- Major version update
- No breaking changes in current icon usage

### Additional Updates
- @tsparticles/engine: 3.5.0 → 3.9.1
- @tsparticles/slim: 3.5.0 → 3.9.1
- @vercel/analytics: 1.4.1 → 1.5.0
- @vercel/speed-insights: 1.1.0 → 1.2.0
- cobe: 0.6.3 → 0.6.5
- dotenv: 16.5.0 → 17.2.3
- katex: 0.16.22 → 0.16.25
- postcss: 8.x → 8.5.6
- tailwind-merge: 2.5.4 → 3.3.1
- tailwindcss: 3.4.1 → 3.4.18
- @types/node: 24.0.1 → 24.9.1
- @types/react: Added 19.2.2
- @types/react-dom: Added 19.2.2

## Code Changes Made

### 1. Fixed CSS Import Order (app/globals.css)
**Issue**: Turbopack requires @import statements to be at the top of CSS files

**Change**: Moved all @import statements before @tailwind directives:
```css
/* Before */
@tailwind base;
@tailwind components;
@tailwind utilities;
@import 'katex/dist/katex.min.css';

/* After */
@import 'katex/dist/katex.min.css';
@import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. Updated Next.js Configuration (next.config.js)
**Issue**: Next.js 16 requires Turbopack configuration for module aliases

**Change**: Added turbopack configuration alongside webpack:
```javascript
turbopack: {
  resolveAlias: {
    'three': './node_modules/three',
    'three/examples': './node_modules/three/examples'
  }
}
```

### 3. Removed Circular Dependency (package.json)
**Issue**: `"sri_portfolio": "file:"` caused installation errors

**Change**: Removed this dependency entry entirely

### 4. Removed Incompatible Optional Dependency
**Issue**: `@next/swc-darwin-arm64@^16.0.0` was specified when using Next.js 15

**Change**: Removed optionalDependencies section (Next.js manages SWC automatically)

### 5. Updated TypeScript Configuration (tsconfig.json)
**Change**: Next.js automatically updated jsx transform:
- `"jsx": "preserve"` → `"jsx": "react-jsx"`
- Added `.next/dev/types/**/*.ts` to include array

## Security Fixes

### Fixed Vulnerabilities
1. **brace-expansion** (Low): Regular Expression Denial of Service - Fixed via npm audit fix
2. **nanoid** (Moderate): Predictable results with non-integer values - Fixed via npm audit fix

## Installation Instructions

### For New Installations
```bash
npm install
```

The `.npmrc` file has been configured with `legacy-peer-deps=true` to handle peer dependency conflicts automatically.

### For Updating Existing Installations
```bash
rm -rf node_modules package-lock.json
npm install
```

## Build & Run Commands

No changes to existing scripts:

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## Verification Checklist

- [x] All dependencies installed without errors
- [x] No security vulnerabilities (npm audit)
- [x] Production build completes successfully
- [x] Development server starts without errors
- [x] TypeScript compilation passes
- [x] Three.js components render correctly
- [x] React Three Fiber works with React 19
- [x] Framer Motion animations function properly
- [x] All @react-three/* packages compatible
- [x] Turbopack builds successfully
- [x] CSS imports processed correctly

## Known Issues & Notes

1. **Legacy Peer Dependencies**: The `.npmrc` file includes `legacy-peer-deps=true` due to some transitive dependencies not yet declaring React 19 compatibility. This is safe and expected during the React 19 transition period.

2. **Tailwind CSS v4**: Tailwind CSS v4 is available but was not upgraded as it requires significant configuration changes. The project remains on v3.4.18 (latest v3).

3. **Turbopack**: While Turbopack is now the default bundler in Next.js 16, webpack configuration is maintained for compatibility. Both bundlers have the same Three.js alias configuration.

## Future Maintenance

- Monitor for updates to peer dependencies declaring React 19 support
- Consider migrating to Tailwind CSS v4 in a future update
- Review Next.js 16 documentation for new features and optimizations
- Keep TypeScript and type definitions up to date

## Rollback Instructions

If issues arise, you can rollback by:

1. Restore previous package.json
2. Run `npm install --legacy-peer-deps`
3. Restore previous next.config.js if needed
4. Restore CSS import order in globals.css if needed
