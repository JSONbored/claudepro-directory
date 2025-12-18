# useBoolean vs useToggle Consolidation Plan

## Analysis Summary

**Current State:**
- `useBoolean`: 151 usages across 60 files
- `useToggle`: 0 direct usages found (may be used indirectly)
- Both hooks provide similar functionality with different APIs

**Key Differences:**

| Feature | useBoolean | useToggle |
|---------|-----------|-----------|
| Return Type | Object `{ value, setValue, setTrue, setFalse, toggle }` | Array `[value, toggle, setValue]` |
| Destructuring | Object destructuring | Array destructuring (useState-like) |
| Explicit Methods | ✅ `setTrue`, `setFalse` | ❌ Only `toggle` |
| useState Pattern | ❌ No | ✅ Yes (array pattern) |
| LOC | ~79 lines | ~67 lines |

**Usage Patterns Found:**

1. **useBoolean with setTrue/setFalse (most common):**
   ```tsx
   const { value: isOpen, setTrue: openModal, setFalse: closeModal } = useBoolean();
   ```

2. **useBoolean with setValue:**
   ```tsx
   const { value: isOpen, setValue: setIsOpen } = useBoolean();
   ```

3. **useBoolean with toggle:**
   ```tsx
   const { value: isOpen, toggle } = useBoolean();
   ```

4. **useToggle (useState-like pattern):**
   ```tsx
   const [isOpen, toggleOpen] = useToggle();
   ```

## Consolidation Strategy

### Option 1: Enhance useBoolean to Support Both Patterns (Recommended)

**Approach:** Make `useBoolean` support both object and array destructuring patterns.

**Implementation:**
```typescript
export function useBoolean(defaultValue: boolean = false) {
  const [value, setValue] = useState<boolean>(defaultValue);
  
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((prev) => !prev), []);
  
  // Support both object and array patterns
  const result = {
    value,
    setValue,
    setTrue,
    setFalse,
    toggle,
    // Array pattern support (for useState-like usage)
    [Symbol.iterator]: function* () {
      yield value;
      yield toggle;
      yield setValue;
    },
  } as const;
  
  return result;
}
```

**Usage:**
```tsx
// Object pattern (existing)
const { value: isOpen, setTrue, setFalse } = useBoolean();

// Array pattern (new, useState-like)
const [isOpen, toggleOpen] = useBoolean();
```

**Pros:**
- ✅ Backward compatible (all existing code works)
- ✅ Supports both patterns
- ✅ Single hook to maintain
- ✅ Can deprecate useToggle gradually

**Cons:**
- ⚠️ Slightly more complex implementation
- ⚠️ Symbol.iterator may not work in all contexts

### Option 2: Keep Both, Document When to Use Each

**Approach:** Keep both hooks, but clearly document when to use each.

**Guidelines:**
- Use `useBoolean` when you need `setTrue`/`setFalse` explicitly
- Use `useToggle` when you prefer useState-like array pattern

**Pros:**
- ✅ No migration needed
- ✅ Each hook optimized for its use case

**Cons:**
- ❌ Code duplication (~146 LOC total)
- ❌ Developer confusion about which to use
- ❌ Maintenance burden (two hooks to maintain)

### Option 3: Deprecate useToggle, Migrate to useBoolean

**Approach:** Remove `useToggle`, migrate all usages to `useBoolean`.

**Migration Pattern:**
```tsx
// Before (useToggle)
const [isOpen, toggleOpen] = useToggle();

// After (useBoolean)
const { value: isOpen, toggle: toggleOpen } = useBoolean();
```

**Pros:**
- ✅ Single hook to maintain
- ✅ More explicit API (setTrue/setFalse available)
- ✅ ~67 LOC reduction

**Cons:**
- ⚠️ Breaking change (requires migration)
- ⚠️ Loss of useState-like pattern (some developers prefer this)

## Recommendation

**Recommended: Option 1 (Enhance useBoolean)**

This provides:
- ✅ Backward compatibility
- ✅ Support for both patterns
- ✅ Single hook to maintain
- ✅ Gradual migration path

**Implementation Steps:**
1. Enhance `useBoolean` to support array destructuring
2. Add deprecation notice to `useToggle`
3. Update documentation
4. Gradually migrate `useToggle` usages (if any found)
5. Remove `useToggle` after migration complete

**Estimated LOC Reduction:** ~67 lines (when useToggle is removed)

**Migration Effort:** Low (if useToggle has few/no usages) to Medium (if many usages)
