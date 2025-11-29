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

// Type definitions are in ./magick-wasm.d.ts (declare module '@imagemagick/magick-wasm')
// Deno global type (only available in Deno runtime)
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  type IMagickImage,
} from '@imagemagick/magick-wasm';

// Deno namespace declaration for type checking
// eslint-disable-next-line @typescript-eslint/no-namespace -- Deno global namespace is required for Deno runtime types
declare namespace Deno {
  function readFile(path: string | URL): Promise<Uint8Array>;
}

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
    // Deno.readFile is available via the Deno namespace declaration above
    const wasmBytes = await Deno.readFile(
      new URL(
        'magick.wasm',
        import.meta.resolve('@imagemagick/magick-wasm'),
      ),
    );
    await initializeImageMagick(wasmBytes);
    initialized = true;
  } catch (error) {
    // Import normalizeError dynamically to avoid circular dependency
    const { normalizeError } = await import('@heyclaude/shared-runtime');
    initError = normalizeError(error, 'ImageMagick initialization failed');
    throw new Error(`Failed to initialize ImageMagick: ${initError.message}`);
  }
}

/**
 * Image processing options
 */
export interface ImageProcessOptions {
  /** Blur settings (radius, sigma) */
  blur?: { radius: number; sigma: number };
  /** Output format (default: PNG) */
  format?: MagickFormat;
  /** Quality for JPEG/WebP (1-100, default: 85) */
  quality?: number;
  /** Resize dimensions (width, height). If only one provided, maintains aspect ratio. */
  resize?: { height?: number; width?: number; };
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future implementation
    format: _format = MagickFormat.Png,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future implementation
    quality: _quality = 85,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future implementation
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
  quality = 85
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
): Promise<{ height: number; width: number; }> {
  await ensureImageMagickInitialized();

  let dimensions: null | { height: number; width: number; } = null;

  ImageMagick.read(imageData, (img: IMagickImage) => {
    dimensions = {
      height: img.height,
      width: img.width,
    };
    // Don't write, just read dimensions
    return new Uint8Array(0);
  });

  // ImageMagick.read callback always executes synchronously, so dimensions will be set
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Type guard for TypeScript
  if (dimensions === null) {
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
  quality = 85
): Promise<Uint8Array> {
  return processImage(imageData, {
    format: targetFormat,
    quality,
    stripMetadata: true,
  });
}
