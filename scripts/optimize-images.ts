/**
 * Optimize Static Images
 * 
 * Optimizes static images in public/ directory by converting to WebP and AVIF formats.
 * Reduces image sizes by 50-70% as identified by PageSpeed Insights.
 * 
 * Optimized: Now runs automatically during build process to ensure images are always optimized.
 * 
 * Usage:
 * ```bash
 * pnpm optimize:images
 * ```
 * 
 * This script runs automatically during `pnpm build` to ensure images are optimized before deployment.
 */

import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { resolve, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import imageminAvif from 'imagemin-avif';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = resolve(__dirname, '../apps/web/public');
const optimizedDir = resolve(__dirname, '../apps/web/public/optimized');

// Image extensions to optimize
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

async function optimizeImages() {
  try {
    console.log('🖼️  Optimizing static images...');
    
    // Find all images in public directory (excluding already optimized)
    const files: string[] = [];
    
    async function findImages(dir: string, basePath: string = '') {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = join(basePath, entry.name);
        
        // Skip optimized directory and node_modules
        if (entry.name === 'optimized' || entry.name === 'node_modules') {
          continue;
        }
        
        if (entry.isDirectory()) {
          await findImages(fullPath, relativePath);
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();
          if (imageExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }
    
    await findImages(publicDir);
    
    if (files.length === 0) {
      console.log('ℹ️  No images found to optimize');
      return;
    }
    
    console.log(`📸 Found ${files.length} images to optimize`);
    
    // Optimize to WebP
    console.log('🔄 Converting to WebP...');
    const webpFiles = await imagemin(files, {
      destination: optimizedDir,
      plugins: [
        imageminWebp({
          quality: 85, // Good balance between quality and size
        }),
      ],
    });
    
    // Optimize to AVIF (better compression, but less browser support)
    console.log('🔄 Converting to AVIF...');
    const avifFiles = await imagemin(files, {
      destination: optimizedDir,
      plugins: [
        imageminAvif({
          quality: 80, // AVIF is more efficient, can use lower quality
        }),
      ],
    });
    
    console.log(`✅ Optimized ${webpFiles.length} images to WebP`);
    console.log(`✅ Optimized ${avifFiles.length} images to AVIF`);
    console.log(`📁 Optimized images saved to: ${optimizedDir}`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Review optimized images');
    console.log('   2. Update image references to use optimized versions');
    console.log('   3. Use <picture> element with WebP/AVIF fallbacks');
  } catch (error) {
    console.error('❌ Error optimizing images:', error);
    process.exit(1);
  }
}

optimizeImages();
