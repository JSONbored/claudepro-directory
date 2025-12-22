import { defineConfig } from 'tsup';

export default defineConfig([
  // CJS build
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: false, // Generate manually with tsc to avoid tsconfig issues
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean - we'll clean manually
    treeshake: true,
    external: ['@prisma/client'],
    tsconfig: './tsconfig.json',
    outExtension() {
      return {
        js: '.js',
      };
    },
  },
  // ESM build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean - we'll clean manually
    treeshake: true,
    external: ['@prisma/client'],
    tsconfig: './tsconfig.json',
    outExtension() {
      return {
        js: '.mjs',
      };
    },
  },
  {
    /**
     * TODO: Fix CLI tool build configuration
     * 
     * Issue: `npx prismocker generate-enums` fails with:
     *   Error: Cannot find module '/Users/.../dist/bin/generate-enums.cjs'
     * 
     * Current state:
     * - tsup outputs: `dist/bin/generate-enums.js` (CommonJS format)
     * - package.json bin entry expects: `./dist/bin/generate-enums.js`
     * - npx/Node may be looking for: `generate-enums.cjs` extension
     * 
     * Potential fixes to investigate:
     * 1. Add `outExtension: () => ({ js: '.cjs' })` to output `.cjs` extension
     * 2. Update package.json bin entry to match actual output filename
     * 3. Verify build actually generates the file in `dist/bin/` after running `pnpm build`
     * 4. Check if `files` array in package.json includes `bin` directory
     * 5. Ensure the built file has executable permissions (`chmod +x`)
     * 
     * Related files:
     * - packages/prismocker/package.json (bin, exports, files)
     * - packages/prismocker/src/bin/generate-enums.ts (CLI source)
     */
    entry: ['src/bin/generate-enums.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/bin',
    banner: {
      js: '#!/usr/bin/env node',
    },
    external: ['@prisma/client'],
    tsconfig: './tsconfig.json',
    clean: false, // Don't clean for this entry to avoid deleting other builds
  },
]);

