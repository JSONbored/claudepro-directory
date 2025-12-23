import { defineConfig } from 'tsup';

export default defineConfig([
  // CJS build - MUST output CommonJS syntax (module.exports, require)
  // MUST be first entry to build before ESM
  {
    entry: ['src/index.ts'],
    format: 'cjs', // Use string, not array
    dts: false, // Generate manually with tsc to avoid tsconfig issues
    splitting: false,
    sourcemap: true,
    clean: true, // Clean before CJS build
    treeshake: true,
    bundle: true, // Bundle all dependencies into single file
    external: ['@prisma/client'],
    // Use separate tsconfig with CommonJS module setting
    tsconfig: './tsconfig.cjs.json',
    outExtension({ format }) {
      // Use .js extension for CommonJS
      return { js: format === 'cjs' ? '.js' : '.js' };
    },
    // Force esbuild to output CommonJS
    esbuildOptions(options) {
      options.format = 'cjs';
      options.platform = 'node';
      options.target = 'node18';
    },
  },
  // ESM build - Output ESM syntax (export, import)
  // Runs after CJS (second entry)
  {
    entry: ['src/index.ts'],
    format: 'esm', // Use string, not array
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean - CJS already built
    treeshake: true,
    bundle: true, // Bundle all dependencies into single file
    external: ['@prisma/client'],
    tsconfig: './tsconfig.json',
    outExtension({ format }) {
      // Use .mjs extension for ESM
      return { js: format === 'esm' ? '.mjs' : '.mjs' };
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

