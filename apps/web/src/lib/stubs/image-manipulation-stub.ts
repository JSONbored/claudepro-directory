/**
 * Stub for edge function image manipulation code
 * This file exists to prevent edge function dependencies from being included in the web bundle
 *
 * This module is only used in edge functions and should never be called from the web app.
 */

// Export empty stubs matching the actual exports from packages/shared-runtime/src/image/manipulation.ts
// Match the exact interface from the edge function
export interface ImageProcessOptions {
  /** Blur settings (radius, sigma) */
  blur?: { radius: number; sigma: number };
  /** Output format */
  format?: number; // MagickFormat enum value
  /** Quality for JPEG/WebP (1-100, default: 85) */
  quality?: number;
  /** Resize dimensions (width, height). If only one provided, maintains aspect ratio. */
  resize?: { height?: number; width?: number };
  /** Strip metadata (default: true) */
  stripMetadata?: boolean;
}

export interface ImageDimensions {
  height: number;
  width: number;
}

export async function ensureImageMagickInitialized(): Promise<void> {
  throw new Error('Image manipulation is only available in edge functions');
}

export async function processImage(
  _imageData: Uint8Array,
  _options: ImageProcessOptions = {}
): Promise<Uint8Array> {
  throw new Error('Image manipulation is only available in edge functions');
}

export async function optimizeImage(
  _imageData: Uint8Array,
  _maxDimension: number,
  _format = 0, // MagickFormat.Png
  _quality = 85
): Promise<Uint8Array> {
  throw new Error('Image manipulation is only available in edge functions');
}

export async function resizeImage(
  _imageData: Uint8Array,
  _width: number,
  _height: number,
  _format = 0 // MagickFormat.Png
): Promise<Uint8Array> {
  throw new Error('Image manipulation is only available in edge functions');
}

export async function getImageDimensions(
  _input: ArrayBuffer | Uint8Array
): Promise<ImageDimensions> {
  throw new Error('Image manipulation is only available in edge functions');
}

export async function convertImageFormat(
  _imageData: Uint8Array,
  _targetFormat: number, // MagickFormat enum
  _quality = 85
): Promise<Uint8Array> {
  throw new Error('Image manipulation is only available in edge functions');
}
