# Post-Upgrade Verification Checklist

Follow this checklist to verify that the dependency upgrades are working correctly.

## 1. Installation Verification

- [ ] **Clean Install**: Delete `node_modules` and `package-lock.json`, then run:
  ```bash
  npm install
  ```
  ✅ Expected: Installation completes without errors

- [ ] **Security Audit**: Run security audit:
  ```bash
  npm audit
  ```
  ✅ Expected: 0 vulnerabilities found

## 2. Build Verification

- [ ] **Production Build**: Create optimized production build:
  ```bash
  npm run build
  ```
  ✅ Expected: 
  - Build completes successfully
  - No TypeScript errors
  - Turbopack compilation successful
  - Static pages generated

- [ ] **Build Output**: Check the build output shows:
  ```
  ▲ Next.js 16.0.0 (Turbopack)
  ✓ Compiled successfully
  ✓ Generating static pages
  ```

## 3. Development Server Verification

- [ ] **Start Dev Server**:
  ```bash
  npm run dev
  ```
  ✅ Expected:
  - Server starts on http://localhost:3000
  - No error messages in console
  - Shows "Ready in [time]"

- [ ] **Hot Module Replacement**: Make a small change to a component and verify:
  - Changes reflect automatically in browser
  - No errors in browser console

## 4. Runtime Verification

- [ ] **Home Page Loads**: Navigate to http://localhost:3000
  ✅ Expected: Page loads without errors

- [ ] **Browser Console**: Open browser developer tools console
  ✅ Expected: 
  - No React errors
  - No "ReactCurrentOwner" errors
  - No "@react-three/fiber" errors
  - No dependency warnings

- [ ] **Three.js Components**: Check if 3D elements render correctly
  ✅ Expected: 
  - Canvas elements visible
  - 3D animations working
  - No WebGL errors

- [ ] **Framer Motion**: Verify animations work
  ✅ Expected: 
  - Page transitions smooth
  - Component animations functioning
  - No motion-related errors

## 5. Component-Specific Tests

- [ ] **React Three Fiber Components**:
  - [ ] Journey3D component renders
  - [ ] Beams background works
  - [ ] Canvas reveal effects function
  ✅ Expected: All 3D components render without errors

- [ ] **Framer Motion Components**:
  - [ ] Page animations work
  - [ ] Hover effects trigger correctly
  - [ ] Scroll animations function
  ✅ Expected: All animations smooth and error-free

- [ ] **Particles System**:
  - [ ] tsparticles components load
  - [ ] Particle animations render
  ✅ Expected: Particles display correctly

## 6. Feature Verification

- [ ] **Navigation**: Test all navigation links
  ✅ Expected: Navigation works without errors

- [ ] **Responsive Design**: Test on different screen sizes
  ✅ Expected: Layout adapts correctly

- [ ] **Performance**: Check page load performance
  ✅ Expected: No significant slowdown compared to before

- [ ] **Images**: Verify images load correctly
  ✅ Expected: All images display properly

## 7. TypeScript Verification

- [ ] **Type Checking**: Run TypeScript compiler:
  ```bash
  npx tsc --noEmit
  ```
  ✅ Expected: No type errors

- [ ] **IDE Support**: Check if IDE shows correct types for:
  - React 19 components
  - Next.js 16 APIs
  - @react-three/fiber hooks

## 8. Vercel Deployment Preparation

- [ ] **Vercel Build Script**: Test vercel build command:
  ```bash
  npm run vercel-build
  ```
  ✅ Expected: Build completes successfully

- [ ] **Environment Variables**: Verify all required env vars are set
  ✅ Expected: No missing environment variables

## 9. Dependencies Compatibility Check

- [ ] **List Dependencies**: Check installed versions:
  ```bash
  npm list --depth=0
  ```
  ✅ Expected versions:
  - next@16.0.0
  - react@19.2.0
  - react-dom@19.2.0
  - @react-three/fiber@9.4.0
  - @react-three/drei@10.7.6
  - framer-motion@12.23.24
  - three@0.180.0

- [ ] **Check Outdated**: See if any packages need updates:
  ```bash
  npm outdated
  ```
  ✅ Expected: Only minor/patch updates available (if any)

## 10. Error Handling

- [ ] **404 Page**: Navigate to non-existent route
  ✅ Expected: Custom 404 page displays

- [ ] **Error Boundaries**: Verify error handling works
  ✅ Expected: Errors caught gracefully

## Common Issues & Solutions

### Issue: "Cannot read properties of undefined (reading 'ReactCurrentOwner')"
**Solution**: This error is resolved by upgrading to React 19 and @react-three/fiber 9.4.0

### Issue: Peer dependency warnings
**Solution**: The `.npmrc` file contains `legacy-peer-deps=true` to handle this

### Issue: CSS import errors
**Solution**: All @import statements are now at the top of globals.css

### Issue: Turbopack configuration errors
**Solution**: The next.config.js includes both turbopack and webpack configurations

### Issue: Build fails with "module not found"
**Solution**: Clear cache and rebuild:
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## Success Criteria

✅ All items in this checklist are checked
✅ Application functions as expected
✅ No console errors or warnings
✅ Build completes successfully
✅ All features working correctly

## If Issues Occur

1. Check UPGRADE_NOTES.md for migration details
2. Verify Node.js version is compatible (18.x or higher recommended)
3. Clear all caches: `.next`, `node_modules`, `package-lock.json`
4. Reinstall dependencies: `npm install`
5. Check browser console for specific error messages
6. Review the git diff to see what changed

## Reporting Issues

If you encounter issues not covered here:
1. Document the exact error message
2. Note which step in the checklist failed
3. Include browser console output
4. Include terminal error output
5. Note your Node.js version: `node --version`
6. Note your npm version: `npm --version`

---

**Last Updated**: After dependency upgrade to Next.js 16 and React 19
**Upgrade Date**: October 27, 2025
