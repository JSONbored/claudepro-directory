# Zed IDE Configuration

## Debug Configurations

The `.zed/debug.json` file contains debug configurations for runtime debugging (breakpoints, stepping through code).

### Available Debug Configurations

1. **Next.js: Debug Dev Server** - Debug the Next.js development server
2. **Next.js: Debug Production Server** - Debug the production Next.js server
3. **TypeScript: Debug Current File** - Debug the currently open TypeScript file
4. **Script: Generate Categories** - Debug the category generation script
5. **Script: Sync Database Schema** - Debug the database schema sync script
6. **Script: Generate Database Overrides** - Debug the database overrides generation script

### How to Use

1. Press `F4` or click the debug button in the status bar
2. Select a debug configuration from the list
3. Set breakpoints by clicking in the gutter next to line numbers
4. Use the debug controls to step through code

## Static Analysis (Finding Issues Automatically)

**Important**: The debugger is for **runtime debugging**. To automatically detect issues across your codebase, you need **static analysis** (TypeScript errors, linting errors).

### Static Analysis Tools

Your project uses:
- **TypeScript** - Type checking (shows in Problems panel automatically)
- **Biome** - Linting (shows in Problems panel automatically)
- **Deno** - For edge functions (shows in Problems panel automatically)

### Viewing Issues

1. **Problems Panel**: View → Problems (or `Cmd+Shift+M` on macOS)
   - **Note**: By default, TypeScript only checks open files. See "Full Workspace Analysis" below.

2. **Hover Diagnostics**: Hover over code to see type information and errors
3. **Inline Errors**: Red squiggles show TypeScript errors directly in the editor

### Full Workspace Analysis

**Issue**: TypeScript language server typically only checks files that are:
- Currently open in the editor
- Referenced by open files
- Part of the project's include paths

This is **normal behavior** - it's a performance optimization. The language server doesn't check every file in your project to save resources.

**Solution**: To see ALL issues across the entire codebase:

#### Option 1: Use Zed Tasks (Recommended - Easiest)

1. Press `Cmd+Shift+P` (or `Ctrl+Shift+P`) to open Command Palette
2. Type "Tasks: Run Task" and select it
3. Choose one of these tasks:
   - **"Type Check: Full Workspace"** - Checks all TypeScript files
   - **"Lint: Full Workspace"** - Checks all linting issues
   - **"Full Analysis: All Checks"** - Runs all checks (TypeScript + Lint + Edge Functions)
4. Results will appear in the terminal output with ALL files listed

#### Option 2: Run Commands Manually

Open a terminal in Zed and run:

```bash
# Check all TypeScript errors across entire codebase
pnpm type-check

# Check all linting errors
pnpm lint

# Check edge functions
pnpm type-check:edge
pnpm lint:edge
```

#### Option 3: Use Problems Panel After Full Check

After running a full check via tasks or commands:
1. The terminal will show all errors
2. Some errors may also appear in the Problems panel
3. You can search/filter the terminal output for specific files

**Note**: The Problems panel will still primarily show issues from open files, but running the full check gives you a complete list in the terminal.

### If Issues Don't Show Automatically

1. **Restart TypeScript Server**: Command Palette → "TypeScript: Restart TS Server"
2. **Check Language Server**: Ensure TypeScript language server is running
3. **Run Full Check**: Use the tasks above or run `pnpm type-check` manually
4. **Check Settings**: Ensure TypeScript and linting are enabled in Zed

### Manual Commands

```bash
# Check all TypeScript errors
pnpm type-check

# Check all linting errors
pnpm lint

# Check edge function type errors
pnpm type-check:edge

# Check edge function lint errors
pnpm lint:edge
```

## Troubleshooting

If the debugger doesn't work:
1. Ensure Node.js is installed and in PATH
2. Check that `tsx` is installed (`pnpm install -g tsx` or via package.json)
3. Verify the debug adapter is working (check debug panel logs)

If static analysis doesn't work:
1. Restart Zed
2. Restart TypeScript server
3. Check that `tsconfig.json` is valid
4. Check that `biome.json` is valid
