# React Hooks Implementation Guide

This document provides a comprehensive analysis of all newly added hooks, implementation priorities, and recommendations for enhancing existing features.

## 📋 Summary

**Total Hooks Added:** 28 hooks across 8 categories

**Hooks Already Existed:**
- ✅ `useLocalStorage` - Already exists (enhanced version added)
- ✅ `useCopyToClipboard` - Already exists (enhanced version added)
- ✅ `useTheme` - Already exists (simpler version, `useDarkMode`/`useTernaryDarkMode` added as alternatives)

## 🎯 Implementation Priority

### 🔴 HIGH PRIORITY - Implement Immediately

These hooks solve immediate problems in the codebase and should be implemented right away:

#### 1. **State Management Hooks**
- **`useBoolean`** - Replace `useState(false)` patterns throughout codebase
  - **Files to update:**
    - `apps/web/src/components/features/home/hero-search-connection.tsx` - `isSearchFocused`
    - `apps/web/src/components/core/layout/navigation-command-menu.tsx` - `internalOpen`, `isSearching`
    - `apps/web/src/components/features/navigation/command-palette-provider.tsx` - `isOpen`
    - `apps/web/src/app/submit/wizard/page.tsx` - Multiple boolean states
    - All modal/dropdown open states
  
- **`useCounter`** - For quantity selectors, pagination
  - **Potential uses:**
    - Shopping cart quantity controls (if applicable)
    - Pagination page numbers
    - Score tracking in games/features
  
- **`useToggle`** - Simpler boolean toggle
  - **Files to update:**
    - All `useState(false)` with toggle patterns
    - Feature flags, UI toggles, sidebar states

#### 2. **Performance Hooks**
- **`useDebounceValue`** - Replace custom debouncing in search
  - **Files to update:**
    - `packages/web-runtime/src/search/hooks/use-search.ts` - Replace custom debounce logic
    - `packages/web-runtime/src/search/context/search-provider.tsx` - Replace manual debouncing
    - `apps/web/src/components/core/forms/company-selector.tsx` - Replace custom debounce
  
- **`useDebounceCallback`** - For API call debouncing
  - **Files to update:**
    - All search API calls
    - Form validation
    - Auto-save features
  
- **`useInterval`** - Replace `setInterval` usage
  - **Files to update:**
    - `apps/web/src/hooks/use-newsletter-count.ts` - Replace manual setInterval
    - `packages/web-runtime/src/search/utils/search-cache.ts` - Replace setInterval cleanup
    - Any polling mechanisms
  
- **`useTimeout`** - Replace `setTimeout` usage
  - **Files to update:**
    - `packages/web-runtime/src/hooks/use-copy-to-clipboard.ts` - Already uses setTimeout, but could use this
    - `apps/web/src/components/core/infra/pulse.tsx` - Replace setTimeout
    - All delayed actions

#### 3. **UI Interaction Hooks**
- **`useOnClickOutside`** - Improve modal/dropdown closing
  - **Files to update:**
    - `packages/web-runtime/src/ui/components/dialog.tsx` - Enhance outside click handling
    - `packages/web-runtime/src/ui/components/popover.tsx` - Add outside click detection
    - All dropdown menus
  
- **`useHover`** - Hover state detection
  - **Potential uses:**
    - Tooltips
    - Card hover effects
    - Button feedback states

#### 4. **Browser API Hooks**
- **`useMediaQuery`** - Replace window.innerWidth checks
  - **Files to update:**
    - All responsive logic using window checks
    - Navigation mobile/desktop switching
    - Component visibility based on screen size
  
- **`useWindowSize`** - Viewport tracking
  - **Potential uses:**
    - Dynamic grid layouts
    - Canvas sizing
    - Responsive charts

#### 5. **SSR/Client Detection**
- **`useIsClient`** - Replace `typeof window !== 'undefined'` checks
  - **Files to update:**
    - All localStorage access
    - Browser API access
    - Client-only features

- **`useIsMounted`** - Prevent setState warnings
  - **Files to update:**
    - All async operations (API calls, file uploads)
    - Timer callbacks
    - WebSocket handlers

### 🟡 MEDIUM PRIORITY - Implement Soon

These hooks provide valuable functionality but aren't immediately critical:

#### 6. **Advanced Utilities**
- **`useIntersectionObserver`** - Lazy loading improvements
  - **Potential uses:**
    - Image lazy loading
    - Infinite scroll improvements
    - Scroll animations
  
- **`useResizeObserver`** - Element size tracking
  - **Potential uses:**
    - Responsive charts
    - Dynamic modal positioning
    - Canvas scaling
  
- **`useStep`** - Multi-step wizard improvements
  - **Files to update:**
    - `apps/web/src/app/submit/wizard/page.tsx` - Replace manual step management
  
- **`useScrollLock`** - Modal scroll prevention
  - **Files to update:**
    - `packages/web-runtime/src/ui/components/dialog.tsx` - Add scroll locking
    - All modal components

#### 7. **Theme Hooks**
- **`useDarkMode`** / **`useTernaryDarkMode`** - Enhance theme system
  - **Files to update:**
    - `packages/web-runtime/src/hooks/use-theme.ts` - Consider migration
    - `packages/web-runtime/src/ui/components/theme/theme-toggle.tsx` - Enhance with ternary mode

#### 8. **Storage Hooks**
- **`useSessionStorage`** - Temporary state persistence
  - **Potential uses:**
    - Form draft saving
    - Shopping cart sessions
    - Multi-step wizard progress
  
- **`useReadLocalStorage`** - Read-only localStorage
  - **Potential uses:**
    - Display user preferences
    - Show authentication status
    - Feature flag reading

### 🟢 LOW PRIORITY - Nice to Have

These hooks are useful but can be implemented as needed:

- **`useMap`** - Entity management (if needed)
- **`useClickAnywhere`** - Global click detection (if needed)
- **`useMousePosition`** - Cursor tracking (if needed)
- **`useCountdown`** - Countdown timers (if needed)
- **`useDocumentTitle`** - Dynamic page titles (if needed)
- **`useScreen`** - Screen information (if needed)
- **`useEventCallback`** - Stable callbacks (if performance issues arise)
- **`useUnmount`** - Centralized cleanup (if needed)
- **`useEventListener`** - Event management (if needed)
- **`useIsomorphicLayoutEffect`** - SSR-safe layout effects (if needed)

## 🚀 Immediate Implementation Recommendations

### 1. Replace useState(false) with useBoolean

**Before:**
```tsx
const [isOpen, setIsOpen] = useState(false);
const openModal = () => setIsOpen(true);
const closeModal = () => setIsOpen(false);
```

**After:**
```tsx
const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useBoolean();
```

**Impact:** Cleaner code, memoized functions prevent re-renders

### 2. Replace Custom Debouncing with useDebounceValue

**Before:**
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

**After:**
```tsx
const [debouncedQuery, setSearchQuery] = useDebounceValue('', 300);
```

**Impact:** Simpler code, better performance, automatic cleanup

### 3. Replace setInterval with useInterval

**Before:**
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

**After:**
```tsx
useInterval(() => {
  fetchData();
}, 5000);
```

**Impact:** Automatic cleanup, no stale closures, pause/resume support

### 4. Enhance Modals with useOnClickOutside

**Before:**
```tsx
<Dialog onPointerDownOutside={(e) => e.preventDefault()}>
```

**After:**
```tsx
const modalRef = useRef<HTMLDivElement>(null);
useOnClickOutside(modalRef, () => setIsOpen(false));

<Dialog ref={modalRef}>...</Dialog>
```

**Impact:** Better outside click detection, supports multiple elements

### 5. Replace Window Checks with useMediaQuery

**Before:**
```tsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

**After:**
```tsx
const isMobile = useMediaQuery('(max-width: 768px)');
```

**Impact:** Simpler code, better performance, automatic updates

### 6. Prevent setState Warnings with useIsMounted

**Before:**
```tsx
useEffect(() => {
  fetchData().then((data) => {
    setData(data); // Warning if component unmounts
  });
}, []);
```

**After:**
```tsx
const isMounted = useIsMounted();

useEffect(() => {
  fetchData().then((data) => {
    if (isMounted()) {
      setData(data);
    }
  });
}, []);
```

**Impact:** No more React warnings, cleaner async handling

## 📊 Feature Enhancement Opportunities

### Search Functionality
- **Current:** Custom debouncing in `use-search.ts` and `search-provider.tsx`
- **Enhancement:** Use `useDebounceValue` for search input, `useDebounceCallback` for API calls
- **Benefits:** Simpler code, better performance, automatic cleanup

### Theme System
- **Current:** Simple `useTheme` hook with MutationObserver
- **Enhancement:** Migrate to `useTernaryDarkMode` for light/dark/system modes
- **Benefits:** Better UX, OS preference sync, more professional implementation

### Modal/Dialog Components
- **Current:** Basic outside click handling via Radix UI
- **Enhancement:** Add `useOnClickOutside` for better control, `useScrollLock` for scroll prevention
- **Benefits:** Better UX, no layout shifts, more control

### Form Wizards
- **Current:** Manual step management in `submit/wizard/page.tsx`
- **Enhancement:** Use `useStep` hook for cleaner step navigation
- **Benefits:** Automatic boundary checking, cleaner code, better UX

### Polling/Intervals
- **Current:** Manual `setInterval` with cleanup in `use-newsletter-count.ts`
- **Enhancement:** Use `useInterval` for all polling mechanisms
- **Benefits:** Automatic cleanup, pause/resume, no stale closures

### Responsive Design
- **Current:** CSS media queries and some window checks
- **Enhancement:** Use `useMediaQuery` for JavaScript-based responsive logic
- **Benefits:** Better performance, automatic updates, SSR-safe

### Lazy Loading
- **Current:** Basic lazy loading in some components
- **Enhancement:** Use `useIntersectionObserver` for efficient lazy loading
- **Benefits:** Better performance, native browser API, automatic cleanup

## 🔍 Codebase Analysis

### Patterns Found That Can Be Improved:

1. **Boolean State Management** (10+ instances)
   - Replace with `useBoolean` for cleaner code

2. **Custom Debouncing** (5+ instances)
   - Replace with `useDebounceValue` and `useDebounceCallback`

3. **setInterval Usage** (3+ instances)
   - Replace with `useInterval` for automatic cleanup

4. **setTimeout Usage** (5+ instances)
   - Replace with `useTimeout` for better management

5. **Window Size Checks** (2+ instances)
   - Replace with `useWindowSize` or `useMediaQuery`

6. **typeof window Checks** (10+ instances)
   - Replace with `useIsClient` for consistency

7. **Manual Step Management** (1 instance in wizard)
   - Replace with `useStep` for better UX

## 📝 Migration Checklist

### Phase 1: High Priority (Week 1)
- [ ] Replace `useState(false)` with `useBoolean` in 10+ files
- [ ] Replace custom debouncing with `useDebounceValue` in search hooks
- [ ] Replace `setInterval` with `useInterval` in polling mechanisms
- [ ] Add `useOnClickOutside` to modal/dialog components
- [ ] Replace window checks with `useIsClient`

### Phase 2: Medium Priority (Week 2)
- [ ] Enhance theme system with `useTernaryDarkMode`
- [ ] Add `useScrollLock` to modals
- [ ] Replace wizard step management with `useStep`
- [ ] Add `useIntersectionObserver` for lazy loading
- [ ] Replace window size checks with `useMediaQuery`

### Phase 3: Low Priority (As Needed)
- [ ] Add `useSessionStorage` for form drafts
- [ ] Add `useResizeObserver` for responsive charts
- [ ] Add `useDocumentTitle` for dynamic titles
- [ ] Add `useEventCallback` if performance issues arise

## 🎨 Design System Integration

### Hooks That Enhance Existing Features:

1. **Theme System**
   - Current: `useTheme` (simple)
   - Enhancement: `useTernaryDarkMode` (light/dark/system)
   - Impact: Better UX, professional implementation

2. **Search System**
   - Current: Custom debouncing
   - Enhancement: `useDebounceValue` + `useDebounceCallback`
   - Impact: Simpler code, better performance

3. **Modal System**
   - Current: Basic Radix UI handling
   - Enhancement: `useOnClickOutside` + `useScrollLock`
   - Impact: Better UX, no layout shifts

4. **Form System**
   - Current: Manual state management
   - Enhancement: `useBoolean`, `useStep`, `useSessionStorage`
   - Impact: Cleaner code, better UX

5. **Responsive System**
   - Current: CSS media queries + some JS
   - Enhancement: `useMediaQuery`, `useWindowSize`
   - Impact: Better performance, automatic updates

## 🔗 Related Files

### Files That Should Be Updated:

1. **Search Hooks:**
   - `packages/web-runtime/src/search/hooks/use-search.ts`
   - `packages/web-runtime/src/search/context/search-provider.tsx`
   - `packages/web-runtime/src/search/hooks/use-search-standalone.ts`

2. **Modal/Dialog Components:**
   - `packages/web-runtime/src/ui/components/dialog.tsx`
   - `packages/web-runtime/src/ui/components/popover.tsx`
   - `apps/web/src/components/core/auth/auth-modal.tsx`

3. **Form Components:**
   - `apps/web/src/app/submit/wizard/page.tsx`
   - `apps/web/src/components/core/forms/company-selector.tsx`

4. **Theme Components:**
   - `packages/web-runtime/src/hooks/use-theme.ts`
   - `packages/web-runtime/src/ui/components/theme/theme-toggle.tsx`

5. **Polling Mechanisms:**
   - `apps/web/src/hooks/use-newsletter-count.ts`
   - `packages/web-runtime/src/search/utils/search-cache.ts`

## ✅ Testing Recommendations

### Hooks to Test Immediately:

1. **useBoolean** - Test with modals, dropdowns, toggles
2. **useDebounceValue** - Test with search inputs
3. **useInterval** - Test with polling mechanisms
4. **useOnClickOutside** - Test with modals and dropdowns
5. **useMediaQuery** - Test responsive behavior
6. **useIsMounted** - Test async operations

### Integration Tests Needed:

- Search debouncing with `useDebounceValue`
- Modal outside click with `useOnClickOutside`
- Theme switching with `useTernaryDarkMode`
- Step navigation with `useStep`
- Polling with `useInterval`

## 📚 Documentation Updates Needed

1. Update `packages/web-runtime/README.md` with new hooks
2. Add examples to component documentation
3. Create migration guide for existing code
4. Update design system documentation

## 🎯 Success Metrics

After implementation, we should see:
- ✅ Reduced code complexity (fewer lines, cleaner patterns)
- ✅ Better performance (memoized functions, optimized event handling)
- ✅ Fewer React warnings (useIsMounted, proper cleanup)
- ✅ Better UX (smoother interactions, no layout shifts)
- ✅ Easier maintenance (standardized patterns)

---

**Last Updated:** 2025-01-XX
**Status:** All hooks added, ready for implementation
