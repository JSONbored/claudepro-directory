/**
 * Type declarations for @imagemagick/magick-wasm
 * This is a Deno-only package used in Edge Functions
 */

declare module '@imagemagick/magick-wasm' {
  export enum MagickFormat {
    Jpeg = 'Jpeg',
    Png = 'Png',
    WebP = 'WebP',
  }

  export interface IMagickImage {
    blur(radius: number, sigma: number): void;
    height: number;
    resize(width: number, height: number): void;
    width: number;
    write(callback: (data: Uint8Array) => Uint8Array): Uint8Array;
  }

  export const ImageMagick: {
    read(
      data: Uint8Array,
      callback: (img: IMagickImage) => Uint8Array
    ): Uint8Array;
  };

  export function initializeImageMagick(wasmBytes: Uint8Array): Promise<void>;
}
