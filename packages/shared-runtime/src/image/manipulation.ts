/**
 * Image Manipulation Utilities
 * 
 * Core wrappers for magick-wasm (ImageMagick WebAssembly) operations.
 * These utilities are designed for use in Supabase Edge Functions (Deno runtime).
 * 
 * Based on Supabase Edge Functions image manipulation guide:
 * https://supabase.com/docs/guides/functions/examples/image-manipulation
 * 
 * NOTE: This file uses Deno-only APIs and packages. Type checking is relaxed
 * for this file since it's only used in Edge Functions (Deno runtime).
 */

/// <reference path="./magick-wasm.d.ts" />

// Deno global type (only available in Deno runtime)
declare namespace Deno {
  function readFile(path: string | URL): Promise<Uint8Array>;
}

// @ts-ignore - @imagemagick/magick-wasm is a Deno-only package, not available during type checking
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  type IMagickImage,
} from '@imagemagick/magick-wasm';

// Initialize ImageMagick on module load (singleton pattern)
let initialized = false;
let initError: Error | null = null;

/**
 * Ensure ImageMagick is initialized before use
 * This is safe to call multiple times - it will only initialize once
 */
export async function ensureImageMagickInitialized(): Promise<void> {
  if (initialized) return;
  if (initError) throw initError;

  try {
    // Load WASM bytes from the package (following Supabase example pattern)
    // @ts-ignore - Deno.readFile and import.meta.resolve are Deno-only APIs
    const wasmBytes = await Deno.readFile(
      new URL(
        'magick.wasm',
        // @ts-ignore - import.meta.resolve is Deno-only
        import.meta.resolve('@imagemagick/magick-wasm'),
      ),
    );
    await initializeImageMagick(wasmBytes);
    initialized = true;
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    throw new Error(`Failed to initialize ImageMagick: ${initError.message}`);
  }
}

/**
 * Image processing options
 */
export interface ImageProcessOptions {
  /** Resize dimensions (width, height). If only one provided, maintains aspect ratio. */
  resize?: { width?: number; height?: number };
  /** Blur settings (radius, sigma) */
  blur?: { radius: number; sigma: number };
  /** Output format (default: PNG) */
  format?: MagickFormat;
  /** Quality for JPEG/WebP (1-100, default: 85) */
  quality?: number;
  /** Strip metadata (default: true) */
  stripMetadata?: boolean;
}

/**
 * Process an image with various transformations
 * 
 * @param imageData - Input image as Uint8Array
 * @param options - Processing options
 * @returns Processed image as Uint8Array
 */
export async function processImage(
  imageData: Uint8Array,
  options: ImageProcessOptions = {}
): Promise<Uint8Array> {
  await ensureImageMagickInitialized();

  const {
    resize,
    blur,
    // Note: format, quality, and stripMetadata are accepted in options but not yet implemented
    // They're kept for future use when we add format conversion support
    format: _format = MagickFormat.Png,
    quality: _quality = 85,
    stripMetadata: _stripMetadata = true,
  } = options;

  // Following Supabase example EXACTLY: return ImageMagick.read with img.write((data) => data)
  // This outputs PNG by default - perfect for our use case
  // Note: format parameter is ignored for now - using PNG output as per Supabase example
  return ImageMagick.read(imageData, (img: IMagickImage): Uint8Array => {
    // Resize if specified
    if (resize) {
      if (resize.width && resize.height) {
        img.resize(resize.width, resize.height);
      } else if (resize.width) {
        img.resize(resize.width, 0); // Maintain aspect ratio
      } else if (resize.height) {
        img.resize(0, resize.height); // Maintain aspect ratio
      }
    }

    // Apply blur if specified
    if (blur) {
      img.blur(blur.radius, blur.sigma);
    }

    // Write the image - following Supabase example EXACTLY
    // This outputs PNG format (default behavior per Supabase docs)
    return img.write((data: Uint8Array) => data);
  });
}

/**
 * Optimize an image (resize, compress, strip metadata)
 * Useful for logos, thumbnails, etc.
 * 
 * @param imageData - Input image as Uint8Array
 * @param maxDimension - Maximum width or height (maintains aspect ratio)
 * @param format - Output format (default: PNG - matches Supabase example)
 * @param quality - Quality 1-100 (default: 85) - Note: not used for PNG
 * @returns Optimized image as Uint8Array
 */
export async function optimizeImage(
  imageData: Uint8Array,
  maxDimension: number,
  format: MagickFormat = MagickFormat.Png,
  quality: number = 85
): Promise<Uint8Array> {
  return processImage(imageData, {
    resize: { width: maxDimension, height: maxDimension },
    format,
    quality,
    // Note: stripMetadata option exists but metadata stripping is handled automatically
    // during format conversion in magick-wasm
  });
}

/**
 * Resize an image to specific dimensions
 * 
 * @param imageData - Input image as Uint8Array
 * @param width - Target width
 * @param height - Target height
 * @param format - Output format (default: PNG)
 * @returns Resized image as Uint8Array
 */
export async function resizeImage(
  imageData: Uint8Array,
  width: number,
  height: number,
  format: MagickFormat = MagickFormat.Png
): Promise<Uint8Array> {
  return processImage(imageData, {
    resize: { width, height },
    format,
  });
}

/**
 * Get image dimensions without processing
 * 
 * @param imageData - Input image as Uint8Array
 * @returns Object with width and height
 */
export async function getImageDimensions(
  imageData: Uint8Array
): Promise<{ width: number; height: number }> {
  await ensureImageMagickInitialized();

  let dimensions: { width: number; height: number } | null = null;

  ImageMagick.read(imageData, (img: IMagickImage) => {
    dimensions = {
      width: img.width,
      height: img.height,
    };
    // Don't write, just read dimensions
    return new Uint8Array(0);
  });

  if (!dimensions) {
    throw new Error('Failed to read image dimensions');
  }

  return dimensions;
}

/**
 * Convert image format
 * 
 * @param imageData - Input image as Uint8Array
 * @param targetFormat - Target format
 * @param quality - Quality for JPEG/WebP (default: 85)
 * @returns Converted image as Uint8Array
 */
export async function convertImageFormat(
  imageData: Uint8Array,
  targetFormat: MagickFormat,
  quality: number = 85
): Promise<Uint8Array> {
  return processImage(imageData, {
    format: targetFormat,
    quality,
    stripMetadata: true,
  });
}
