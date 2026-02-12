# Context Hooks Quick Reference Guide

## Overview

The portfolio application now uses React Context for centralized state management, eliminating prop drilling.

---

## Available Hooks

### 1. useNavigation()

**Location**: `/app/hooks/useNavigation.ts`

**Purpose**: Manage navigation between sections and tabs

**Returns**:
```typescript
{
  currentSection: string;
  activeTab: string;
  navigationHistory: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  navigate: (section: string, tab?: string) => void;
  setTab: (tab: string) => void;
  goBack: () => void;
  goForward: () => void;
}
```

**Example**:
```jsx
import { useNavigation } from '@/app/hooks/useNavigation';

export function MyComponent() {
  const { navigate, currentSection, canGoBack, goBack } = useNavigation();
  
  return (
    <div>
      <p>Current: {currentSection}</p>
      <button onClick={() => navigate('about', 'profile')}>Go to About</button>
      {canGoBack && <button onClick={goBack}>Back</button>}
    </div>
  );
}
```

**Available Sections**:
- `home` - Home page
- `about` - About section (tabs: profile, education, hobbies, side-quests)
- `experience` - Experience section (tabs: experience, achievements)
- `projects` - Projects section (tabs: all, deployed)
- `skills` - Skills section (tabs: overview, github)
- `blog` - Blog section
- `contact` - Contact section

---

### 2. useSettings()

**Location**: `/app/hooks/useSettings.ts`

**Purpose**: Access and control global application settings

**Returns**:
```typescript
{
  isSoundEnabled: boolean;
  currentBackground: string;
  showPlayer: boolean;
  isMobile: boolean;
  toggleSound: () => void;
  changeBackground: (background: string) => void;
  togglePlayer: () => void;
}
```

**Example**:
```jsx
import { useSettings } from '@/app/hooks/useSettings';

export function AudioToggle() {
  const { isSoundEnabled, toggleSound } = useSettings();
  
  return (
    <button onClick={toggleSound}>
      {isSoundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
    </button>
  );
}
```

**Features**:
- Settings persist to localStorage
- Mobile detection auto-updates
- Reactive to window resize

---

### 3. useView()

**Location**: `/app/hooks/useView.ts`

**Purpose**: Manage main view states (loader, journey, portfolio)

**Returns**:
```typescript
{
  showLoader: boolean;
  showJourney: boolean;
  showMainPortfolio: boolean;
  isTransitioning: boolean;
  setShowLoader: (show: boolean) => void;
  setShowJourney: (show: boolean) => void;
  setShowMainPortfolio: (show: boolean) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  toggleView: (view: 'showLoader' | 'showJourney' | 'showMainPortfolio') => void;
  resetView: () => void;
}
```

**Example**:
```jsx
import { useView } from '@/app/hooks/useView';

export function ViewManager() {
  const { showLoader, showMainPortfolio, setShowLoader, setShowMainPortfolio } = useView();
  
  if (showLoader) return <Loader />;
  if (showMainPortfolio) return <Portfolio />;
}
```

---

### 4. useBreakpoint()

**Location**: `/app/hooks/useBreakpoint.ts`

**Purpose**: Detect responsive breakpoints

**Returns**:
```typescript
{
  isMobile: boolean;    // window width < 768px
  isTablet: boolean;    // 768px ≤ width < 1024px
  isDesktop: boolean;   // window width ≥ 1024px
}
```

**Example**:
```jsx
import { useBreakpoint } from '@/app/hooks/useBreakpoint';

export function ResponsiveLayout() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  
  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

---

## Context Architecture

```
App Root
├── RootProviders (contexts/providers.tsx)
│   ├── NavigationProvider
│   ├── SettingsProvider
│   └── ViewProvider
│
└── Your Components (can use any hook)
    ├── useNavigation()
    ├── useSettings()
    ├── useView()
    └── useBreakpoint()
```

---

## Common Patterns

### Pattern 1: Section Navigation with Tab
```jsx
const { navigate } = useNavigation();

// Navigate to a section with a specific tab
navigate('about', 'education');
```

### Pattern 2: Responsive Component
```jsx
const { isMobile } = useSettings();
// or
const { isMobile } = useBreakpoint();

return isMobile ? <MobileVersion /> : <DesktopVersion />;
```

### Pattern 3: Settings Persistence
```jsx
const { isSoundEnabled, changeBackground } = useSettings();

// Changes automatically persist to localStorage
changeBackground('/background/new.jpg');
```

### Pattern 4: Navigation with History
```jsx
const { navigate, goBack, canGoBack, navigationHistory } = useNavigation();

return (
  <div>
    <button onClick={() => navigate('home')}>Home</button>
    {canGoBack && <button onClick={goBack}>Back</button>}
    <p>Path: {navigationHistory.join(' → ')}</p>
  </div>
);
```

### Pattern 5: View State Management
```jsx
const { showLoader, setShowLoader, setShowMainPortfolio } = useView();

const handleLoaderComplete = () => {
  setShowLoader(false);
  setShowMainPortfolio(true);
};
```

---

## Migration Guide

### Before (Prop Drilling)
```jsx
// Parent Component
<Child 
  activeSection={activeSection}
  setActiveSection={setActiveSection}
  isSoundEnabled={isSoundEnabled}
  toggleSound={toggleSound}
  // ... 10+ more props
/>

// Child Component
function Child({ activeSection, setActiveSection, isSoundEnabled, toggleSound, ...props }) {
  return (
    <GrandChild 
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      isSoundEnabled={isSoundEnabled}
      toggleSound={toggleSound}
      // ... props drilling deeper
    />
  );
}
```

### After (Context Hooks)
```jsx
// Parent Component
<Child />

// Child Component - No props needed!
function Child() {
  const { currentSection, navigate } = useNavigation();
  const { isSoundEnabled, toggleSound } = useSettings();
  
  return <GrandChild />;
}

// GrandChild Component - Also no props!
function GrandChild() {
  const { isMobile } = useBreakpoint();
  // Can access any context state needed
}
```

---

## Best Practices

### 1. Import at Top Level
```jsx
// ✅ Good
import { useNavigation } from '@/app/hooks/useNavigation';

export function MyComponent() {
  const { navigate } = useNavigation(); // Called at top level
  // ...
}

// ❌ Bad
export function MyComponent() {
  if (someCondition) {
    const { navigate } = useNavigation(); // Hooks must be at top level!
  }
}
```

### 2. Use Specific Properties
```jsx
// ✅ Good - only gets what's needed
const { navigate } = useNavigation();

// ⚠️ Less Efficient - gets everything
const navContext = useNavigationContext();
const navigate = navContext.navigate;
```

### 3. Memoize Callbacks if Passing to Children
```jsx
// ✅ Good
const { navigate } = useNavigation();
const handleClick = useCallback(() => navigate('about'), [navigate]);

// Pass handleClick to children instead of navigate directly
<Child onClick={handleClick} />
```

---

## Troubleshooting

### Error: "useNavigation must be used within NavigationProvider"
**Cause**: Component used outside of RootProviders
**Solution**: Ensure RootProviders wraps your app in layout.js

### Settings Not Persisting
**Cause**: Browser doesn't have localStorage access
**Solution**: Check browser privacy settings and console for errors

### Mobile Detection Not Working
**Cause**: Hook called on server-side
**Solution**: Use `'use client'` directive in your component

### Navigation History Empty
**Cause**: Navigating before portfolio loads
**Solution**: Check `showMainPortfolio` state with `useView()`

---

## Context Internals (Advanced)

If you need direct context access:

```jsx
import { useNavigationContext } from '@/app/contexts/NavigationContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';
import { useViewContext } from '@/app/contexts/ViewContext';

// Direct context access (not recommended - use hooks instead)
const navigation = useNavigationContext();
const settings = useSettingsContext();
const view = useViewContext();
```

**Note**: Prefer using the custom hooks instead of direct context access.

---

## Performance Tips

1. **Memoize Components** if they re-render frequently:
```jsx
export const MyComponent = memo(function MyComponent() {
  const { currentSection } = useNavigation();
  // ...
});
```

2. **Use useCallback** for handlers passed to children:
```jsx
const handleNavigate = useCallback(() => {
  navigate('about');
}, [navigate]);
```

3. **Split Contexts** if one section grows too large

---

## Resources

- **Contexts**: `app/contexts/`
- **Hooks**: `app/hooks/`
- **Provider Setup**: `app/contexts/providers.tsx`
- **Usage Reference**: `app/page.js`

---

**Last Updated**: 2026-02-12
