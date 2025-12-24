import { defineConfig } from 'tsup';

export default defineConfig([
  // CJS build - MUST output CommonJS syntax (module.exports, require)
  // MUST be first entry to build before ESM
  {
    entry: [
      'src/index.ts',
      'src/jest-helpers.ts',
      'src/prisma-types.ts',
      'src/test-utils.ts',
      'src/prisma-ecosystem.ts',
      'src/index-manager.ts',
      'src/query-cache.ts',
      'src/sql-parser.ts',
    ],
    format: 'cjs', // Use string, not array
    dts: false, // Generate manually with tsc to avoid tsconfig issues
    splitting: false,
    sourcemap: true,
    clean: true, // Clean before CJS build
    treeshake: true,
    bundle: true, // Bundle each entry separately
    external: ['@prisma/client'],
    // Use separate tsconfig with CommonJS module setting
    tsconfig: './tsconfig.cjs.json',
    outExtension({ format }) {
      // Use .cjs extension for CommonJS to ensure Node.js treats it as CJS
      return { js: format === 'cjs' ? '.cjs' : '.js' };
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
    entry: [
      'src/index.ts',
      'src/jest-helpers.ts',
      'src/prisma-types.ts',
      'src/test-utils.ts',
      'src/prisma-ecosystem.ts',
      'src/index-manager.ts',
      'src/query-cache.ts',
      'src/sql-parser.ts',
    ],
    format: 'esm', // Use string, not array
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false, // Don't clean - CJS already built
    treeshake: true,
    bundle: true, // Bundle each entry separately
    external: ['@prisma/client'],
    tsconfig: './tsconfig.json',
    outExtension() {
      // Use .mjs extension for ESM
      return { js: '.mjs' };
    },
  },
  {
    // CLI tools build
    entry: ['src/bin/generate-enums.ts', 'src/bin/setup.ts'],
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

