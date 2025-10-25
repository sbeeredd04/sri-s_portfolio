# Hydration Error Fixes

## Summary
This document outlines the hydration mismatch errors that were identified and fixed in the React/Next.js portfolio application.

## What Are Hydration Errors?

Hydration errors occur in Server-Side Rendered (SSR) React applications when there's a mismatch between what the server renders and what the client expects. During hydration, React compares the server-generated HTML with the client-side JavaScript render and expects them to match exactly.

## Issues Identified and Fixed

### 1. Math.random() Usage in Render
**Problem**: `Math.random()` generates different values on server vs client, causing hydration mismatch.

**Files Fixed**:
- `app/components/cover.jsx` (lines 90-91, 183-184)
  - **Before**: `duration={Math.random() * 2 + 1}`
  - **After**: Uses stable pseudo-random values based on component index/id
  - **Solution**: Created helper functions `getStableDuration(index)` and `getStableDelay(index)` that generate deterministic values
  - **Solution for Beam component**: Used `useMemo` with hash-based pseudo-random calculation from component `id`

- `app/components/background/Beams.jsx` (lines 265-266)
  - **Before**: `const uvXOffset = Math.random() * 300;`
  - **After**: `const uvXOffset = ((i * 37) % 300);`
  - **Solution**: Index-based deterministic calculations ensuring same values across server and client

### 2. Window Object Access During Render
**Problem**: Accessing `window` object during render causes errors on server where `window` is undefined.

**Files Fixed**:
- `app/components/ExpandableCard.jsx` (line 79)
  - **Before**: `const isMobile = () => { return window && window.innerWidth < 768; }`
  - **After**: Added state `isMobileView` and moved check to `useEffect`
  
- `app/components/apple-cards-carousel.jsx` (line 78)
  - **Before**: Same `isMobile()` function accessing `window` during render
  - **After**: Same solution - state variable updated in `useEffect`

- `app/components/SkillsRadar.jsx` (line 26)
  - **Before**: `const dpr = window.devicePixelRatio || 1;`
  - **After**: Added state `dpr` with default value 1, updated in `useEffect`

### 3. Date.now() Usage in Render
**Problem**: `new Date()` generates different timestamps on server vs client.

**Files Fixed**:
- `app/components/animation/Loader.jsx` (line 1240)
  - **Before**: `text={`Local time: ${new Date().toLocaleTimeString(...)}`}`
  - **After**: Added state `currentTime` with placeholder, updated in `useEffect`
  - **Additional**: Added "use client" directive to ensure proper client-side rendering

## Pattern for Fixing Hydration Errors

### For Random Values:
```javascript
// DON'T: Math.random() during render
const value = Math.random() * 100;

// DO: Use deterministic calculation
const getStableValue = (index) => ((index * 37) % 100);
const value = getStableValue(index);

// OR: Use useMemo with stable seed
const value = useMemo(() => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 100);
}, [id]);
```

### For Browser APIs:
```javascript
// DON'T: Access window during render
const isMobile = window.innerWidth < 768;

// DO: Use state and useEffect
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### For Dynamic Time/Date:
```javascript
// DON'T: Generate date during render
const time = new Date().toLocaleTimeString();

// DO: Use state and update in useEffect
const [time, setTime] = useState('--:--:--');

useEffect(() => {
  setTime(new Date().toLocaleTimeString());
}, []);
```

## Verification

### Build Verification
All changes have been verified with successful builds:
```bash
npm run build
```

### Expected Behavior
- No hydration warnings in console
- Server-rendered HTML matches client-side render
- All animations and interactions work as expected
- Mobile responsive behavior works correctly

## Files Modified
1. `app/components/cover.jsx`
2. `app/components/background/Beams.jsx`
3. `app/components/ExpandableCard.jsx`
4. `app/components/apple-cards-carousel.jsx`
5. `app/components/SkillsRadar.jsx`
6. `app/components/animation/Loader.jsx`

## Testing Recommendations

To verify the fixes work correctly:

1. **Build the application**: `npm run build`
2. **Run in production mode**: `npm start`
3. **Check browser console**: Should see no hydration errors
4. **Test on both desktop and mobile**: Verify responsive behavior works
5. **Verify animations**: All beam effects and transitions should work smoothly
6. **Check time display**: Should show actual local time after initial load

## Additional Notes

- All `localStorage` and `sessionStorage` accesses were already properly wrapped in `useEffect` hooks
- All `window` object accesses in event handlers are safe (they only run client-side)
- The fixes maintain the original functionality while ensuring SSR compatibility
