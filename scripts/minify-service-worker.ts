/**
 * Minify Service Worker Script
 * 
 * Minifies the service worker initialization script to reduce bundle size.
 * Saves ~2.4 KiB (50% reduction) as identified by PageSpeed Insights.
 * 
 * Usage:
 * ```bash
 * pnpm build:sw
 * ```
 * 
 * This script should be run before building the Next.js app.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceWorkerPath = resolve(__dirname, '../apps/web/public/scripts/service-worker-init.js');

async function minifyServiceWorker() {
  try {
    console.log('📦 Minifying service worker...');
    
    // Read the service worker file
    const code = readFileSync(serviceWorkerPath, 'utf8');
    
    // Minify with terser
    const result = await minify(code, {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        pure_funcs: [], // Don't remove any functions
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        reserved: ['navigator', 'serviceWorker', 'window', 'document', 'location'], // Don't mangle browser APIs
      },
      format: {
        comments: false, // Remove comments
      },
    });

    if (!result.code) {
      throw new Error('Terser minification returned no code');
    }

    // Write minified code back to file
    writeFileSync(serviceWorkerPath, result.code, 'utf8');
    
    const originalSize = Buffer.byteLength(code, 'utf8');
    const minifiedSize = Buffer.byteLength(result.code, 'utf8');
    const savings = originalSize - minifiedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
    
    console.log(`✅ Service worker minified successfully!`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KiB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KiB`);
    console.log(`   Savings: ${(savings / 1024).toFixed(2)} KiB (${savingsPercent}%)`);
  } catch (error) {
    console.error('❌ Error minifying service worker:', error);
    process.exit(1);
  }
}

minifyServiceWorker();
