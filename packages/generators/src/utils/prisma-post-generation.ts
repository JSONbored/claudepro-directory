/**
 * Prisma Post-Generation Utilities
 *
 * Utilities for fixing issues that arise after Prisma generates the client.
 * These fixes are applied in the post-prisma-generate script.
 */

import { writeFile, readFile, access, mkdir, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { logger } from '../toolkit/logger.ts';

/**
 * Fix Node.js v25 TypeScript processing issue in Prisma client
 *
 * ARCHITECTURAL FIX: Node.js v25 tries to process TypeScript files in node_modules
 * when they're required via CommonJS. Prisma generates client.ts (ESM) and client.js
 * (CommonJS wrapper that requires client.ts). This causes:
 * "Error: Stripping types is currently unsupported for files under node_modules"
 *
 * Solution: Compile client.ts to JavaScript using esbuild, then modify client.js
 * to require the compiled version instead of the TypeScript file.
 *
 * @param projectRoot - Root directory of the project (where node_modules is located)
 */
export async function fixPrismaClientCommonJSWrapper(projectRoot: string): Promise<void> {
  const PRISMA_CLIENT_DIR = join(projectRoot, 'node_modules/.prisma/client');
  const PRISMA_CLIENT_JS = join(PRISMA_CLIENT_DIR, 'client.js');
  const PRISMA_CLIENT_TS = join(PRISMA_CLIENT_DIR, 'client.ts');
  const PRISMA_CLIENT_COMPILED = join(PRISMA_CLIENT_DIR, 'client-compiled.js');

  try {
    // Check if Prisma client directory exists
    try {
      await access(PRISMA_CLIENT_DIR);
    } catch {
      // Prisma client directory doesn't exist - Prisma hasn't been generated yet
      logger.info('Prisma client directory not found, skipping fix', {
        script: 'post-prisma-generate',
        operation: 'fix-prisma-client-wrapper',
        note: 'Prisma client should be generated to node_modules/.prisma/client (default location)',
      });
      return;
    }

    // Check if client.ts exists (Prisma generates this with ESM)
    let clientTsExists = false;
    try {
      await access(PRISMA_CLIENT_TS);
      clientTsExists = true;
    } catch {
      // client.ts doesn't exist - Prisma might not have generated it
      logger.info('Prisma client.ts not found, skipping fix', {
        script: 'post-prisma-generate',
        operation: 'fix-prisma-client-wrapper',
      });
      return;
    }

    // Check if client.js already exists and is already fixed
    let needsFix = true;
    try {
      const currentContent = await readFile(PRISMA_CLIENT_JS, 'utf-8');
      // If it already requires client-compiled.js, we're done
      if (currentContent.includes("require('./client-compiled.js')")) {
        // Check if compiled file exists
        try {
          await access(PRISMA_CLIENT_COMPILED);
          logger.info('Prisma client.js already fixed', {
            script: 'post-prisma-generate',
            operation: 'fix-prisma-client-wrapper',
          });
          return;
        } catch {
          // Compiled file missing, need to regenerate
          needsFix = true;
        }
      } else if (currentContent.includes("require('./client.ts')")) {
        // Needs fix - requires TypeScript file
        needsFix = true;
      } else {
        // Different pattern, might be okay
        needsFix = false;
      }
    } catch {
      // client.js doesn't exist - we need to create it
      needsFix = true;
    }

    if (!needsFix) {
      return;
    }

    // Fix needed: compile client.ts to client.js (CommonJS)
    if (clientTsExists) {
      // ARCHITECTURAL FIX: Compile client.ts to JavaScript to avoid Node.js v25 TypeScript processing
      // We use esbuild to compile the ESM TypeScript file to CommonJS JavaScript
      let esbuild: typeof import('esbuild');
      try {
        esbuild = await import('esbuild');
      } catch (importError) {
        logger.warn('esbuild not available, cannot compile Prisma client.ts', {
          script: 'post-prisma-generate',
          operation: 'fix-prisma-client-wrapper',
          error: importError instanceof Error ? importError.message : String(importError),
          note: 'Install esbuild as a devDependency in @heyclaude/generators package',
        });
        return;
      }

      try {
        // Bundle client.ts to client-compiled.js (CommonJS format)
        // We bundle to include all dependencies, but externalize Prisma runtime
        // which contains the query engine binary paths that must not be bundled
        logger.info('Compiling Prisma client.ts to JavaScript', {
          script: 'post-prisma-generate',
          operation: 'fix-prisma-client-wrapper',
          entryPoint: PRISMA_CLIENT_TS,
          output: PRISMA_CLIENT_COMPILED,
        });

        await esbuild.build({
          entryPoints: [PRISMA_CLIENT_TS],
          bundle: true, // Bundle to include all .ts imports
          format: 'cjs',
          outfile: PRISMA_CLIENT_COMPILED,
          platform: 'node',
          target: 'node18',
          minify: false,
          sourcemap: false,
          keepNames: true,
          // Externalize Prisma runtime - it's a separate package with query engine binaries
          // We must NOT bundle this as it contains path resolution logic
          external: [
            '@prisma/client/runtime',
            '@prisma/client/runtime/library',
            '@prisma/client/runtime/library.js',
          ],
          // esbuild automatically converts import.meta.url to require('url').fileURLToPath(import.meta.url)
          // when converting ESM to CommonJS. We need to provide a proper polyfill.
          // The issue is that Prisma code uses import.meta.url for __dirname calculation.
          // In CommonJS, we can use __filename directly, but esbuild converts it.
          // Solution: Let esbuild handle it, but we may need to post-process the file.
        });

        logger.info('Successfully compiled Prisma client.ts', {
          script: 'post-prisma-generate',
          operation: 'fix-prisma-client-wrapper',
          output: PRISMA_CLIENT_COMPILED,
        });

        // Post-process compiled file to fix import.meta.url issues
        // esbuild converts import.meta.url to import_meta.url which is undefined in CommonJS
        // We need to replace fileURLToPath(import_meta.url) with proper __dirname calculation
        try {
          let compiledContent = await readFile(PRISMA_CLIENT_COMPILED, 'utf-8');
          // Replace fileURLToPath(import_meta.url) with __dirname
          // The pattern is: fileURLToPath(import_meta.url) where import_meta.url is undefined
          // We replace the entire expression with __dirname
          compiledContent = compiledContent.replace(
            /\(0,\s*import_node_url\.fileURLToPath\)\s*\(\s*import_meta\.url\s*\)/g,
            '__dirname'
          );
          // Also handle the globalThis["__dirname"] assignment pattern
          compiledContent = compiledContent.replace(
            /globalThis\["__dirname"\]\s*=\s*path\.dirname\(\(0,\s*import_node_url\.fileURLToPath\)\s*\(\s*import_meta\.url\s*\)\);/g,
            'globalThis["__dirname"] = __dirname;'
          );
          await writeFile(PRISMA_CLIENT_COMPILED, compiledContent, 'utf-8');
          logger.info('Post-processed compiled client to fix import.meta.url', {
            script: 'post-prisma-generate',
            operation: 'fix-prisma-client-wrapper',
          });
        } catch (postProcessError) {
          logger.warn('Could not post-process compiled client', {
            script: 'post-prisma-generate',
            operation: 'fix-prisma-client-wrapper',
            error:
              postProcessError instanceof Error
                ? postProcessError.message
                : String(postProcessError),
          });
          // Continue - post-processing is optional
        }

        // Create default.ts that re-exports from client.ts (if it doesn't exist)
        // Then create default.js that re-exports from client-compiled.js
        // This is needed for @prisma/client package's main entry point
        const PRISMA_DEFAULT_TS = join(PRISMA_CLIENT_DIR, 'default.ts');
        const PRISMA_DEFAULT_JS = join(PRISMA_CLIENT_DIR, 'default.js');

        try {
          // Create default.ts if it doesn't exist (Prisma doesn't generate it)
          try {
            await access(PRISMA_DEFAULT_TS);
            // default.ts already exists
            logger.info('default.ts already exists, using existing', {
              script: 'post-prisma-generate',
              operation: 'fix-prisma-client-wrapper',
              file: 'default.ts',
            });
          } catch {
            // Create default.ts that re-exports from client.ts
            const defaultTsContent = `// Re-export everything from client.ts
export * from './client.js';
`;
            await writeFile(PRISMA_DEFAULT_TS, defaultTsContent, 'utf-8');
            logger.info('Created default.ts', {
              script: 'post-prisma-generate',
              operation: 'fix-prisma-client-wrapper',
              file: 'default.ts',
            });
          }

          // Create default.js CommonJS wrapper
          const defaultJsContent = `// CommonJS wrapper for default.ts
// Prisma generates default.ts (ESM) that re-exports from client.ts
// ARCHITECTURAL FIX: Node.js v25 can't process TypeScript in node_modules
// Solution: Create a simple CommonJS wrapper that re-exports from the compiled client
module.exports = require('./client-compiled.js');
`;
          await writeFile(PRISMA_DEFAULT_JS, defaultJsContent, 'utf-8');
          logger.info('Created Prisma default.js wrapper', {
            script: 'post-prisma-generate',
            operation: 'fix-prisma-client-wrapper',
            output: PRISMA_DEFAULT_JS,
          });
        } catch (defaultError) {
          logger.warn('Could not create default.js (may not be needed)', {
            script: 'post-prisma-generate',
            operation: 'fix-prisma-client-wrapper',
            error: defaultError instanceof Error ? defaultError.message : String(defaultError),
          });
          // Continue - default.js might not be required
        }

        // Modify client.js to require the compiled version instead of the TypeScript file
        const fixedContent = `// CommonJS wrapper for client.ts
// Prisma generates client.ts (ESM), but CommonJS needs .js
// ARCHITECTURAL FIX: Node.js v25 tries to process TypeScript files in node_modules
// when required via CommonJS, causing "Stripping types is currently unsupported" error.
// Solution: Compile client.ts to JavaScript and require the compiled version instead.
// This compiled version is generated by the post-prisma-generate script.
module.exports = require('./client-compiled.js');
`;

        await writeFile(PRISMA_CLIENT_JS, fixedContent, 'utf-8');

        logger.info('Fixed Prisma client.js CommonJS wrapper', {
          script: 'post-prisma-generate',
          operation: 'fix-prisma-client-wrapper',
          fix: 'compiled-client-ts-to-js',
          compiledFile: 'client-compiled.js',
        });

        // Copy required files to @prisma/client package directory for pnpm compatibility
        // @prisma/client expects .prisma/client to be a sibling directory
        try {
          // Use createRequire to resolve @prisma/client in ESM context
          const { createRequire } = await import('module');
          const require = createRequire(import.meta.url);
          const prismaClientPkgPath = require.resolve('@prisma/client');
          const prismaClientPkgDir = dirname(prismaClientPkgPath);
          // @prisma/client expects .prisma/client to be at @prisma/client/.prisma/client/ (sibling, not parent)
          const expectedPrismaDir = join(prismaClientPkgDir, '.prisma');
          const expectedClientDir = join(expectedPrismaDir, 'client');
          const expectedDefaultJs = join(expectedClientDir, 'default.js');
          const expectedClientCompiledJs = join(expectedClientDir, 'client-compiled.js');

          // Create directory structure
          await mkdir(expectedClientDir, { recursive: true });

          // Ensure directory exists
          await mkdir(expectedClientDir, { recursive: true });

          // Delete existing files if they exist (to ensure clean state)
          try {
            await access(expectedDefaultJs);
            await writeFile(expectedDefaultJs, '', 'utf-8'); // Clear file
          } catch {
            // File doesn't exist, that's fine
          }
          try {
            await access(expectedClientCompiledJs);
            await writeFile(expectedClientCompiledJs, '', 'utf-8'); // Clear file
          } catch {
            // File doesn't exist, that's fine
          }

          // Copy client-compiled.js to expected location
          await copyFile(PRISMA_CLIENT_COMPILED, expectedClientCompiledJs);

          // Write default.js with correct relative path (always overwrite to ensure correct content)
          const defaultJsContentForPnpm = `// CommonJS wrapper for default.ts (pnpm compatibility)
// Prisma generates default.ts (ESM) that re-exports from client.ts
// ARCHITECTURAL FIX: Node.js v25 can't process TypeScript in node_modules
// Solution: Create a simple CommonJS wrapper that re-exports from the compiled client
// This file is created in @prisma/client/.prisma/client/ for pnpm compatibility
module.exports = require('./client-compiled.js');
`;
          await writeFile(expectedDefaultJs, defaultJsContentForPnpm, 'utf-8');

          // Verify files were written correctly
          const verifyDefault = await readFile(expectedDefaultJs, 'utf-8');
          if (!verifyDefault.includes("require('./client-compiled.js')")) {
            throw new Error(
              `default.js was not written correctly. Content: ${verifyDefault.substring(0, 100)}`
            );
          }

          logger.info('Copied Prisma client files for pnpm compatibility', {
            script: 'post-prisma-generate',
            operation: 'fix-prisma-client-wrapper',
            targetDir: expectedClientDir,
            files: ['default.js', 'client-compiled.js'],
          });
        } catch (copyError) {
          logger.error('Failed to copy Prisma client files for pnpm', {
            script: 'post-prisma-generate',
            operation: 'fix-prisma-client-wrapper',
            error: copyError instanceof Error ? copyError.message : String(copyError),
            stack: copyError instanceof Error ? copyError.stack : undefined,
          });
          // Don't throw - allow script to continue, but log as error
        }
      } catch (compileError) {
        logger.error('Failed to compile Prisma client.ts with esbuild', {
          script: 'post-prisma-generate',
          operation: 'fix-prisma-client-wrapper',
          error: compileError instanceof Error ? compileError.message : String(compileError),
          stack: compileError instanceof Error ? compileError.stack : undefined,
        });
        throw compileError; // Fail hard - this is critical
      }
    }
  } catch (error) {
    logger.warn('Could not fix Prisma client.js wrapper', {
      script: 'post-prisma-generate',
      operation: 'fix-prisma-client-wrapper',
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - allow the script to continue even if this fix fails
  }
}
