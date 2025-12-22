/**
 * OKLCH to RGB Color Conversion Utility
 *
 * Email clients don't support OKLCH color space, so we need RGB equivalents.
 * This utility provides functions to convert OKLCH values to RGB for email templates.
 *
 * Note: For production use, colors are pre-converted and stored in theme.ts.
 * This utility is primarily for verification and documentation purposes.
 *
 * OKLCH format: oklch(L% C H) or oklch(L% C H / alpha)
 * Where:
 * - L: Lightness (0-100%)
 * - C: Chroma (0-0.4 typically)
 * - H: Hue (0-360 degrees)
 * - alpha: Optional opacity (0-1)
 *
 * @example
 * ```ts
 * convertOklchToRgb('oklch(74% 0.2 35)') // Returns: 'rgb(255, 111, 74)'
 * convertOklchToRgb('oklch(74% 0.2 35 / 0.5)') // Returns: 'rgba(255, 111, 74, 0.5)'
 * ```
 */

/**
 * Parse OKLCH color string and extract components
 */
function parseOklch(oklchString: string): {
  l: number; // Lightness (0-1)
  c: number; // Chroma
  h: number; // Hue (degrees, converted to radians)
  alpha?: number; // Opacity (0-1)
} {
  // Match: oklch(L% C H) or oklch(L% C H / alpha)
  const match = oklchString.match(
    /oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/
  );

  if (!match) {
    throw new Error(`Invalid OKLCH format: ${oklchString}`);
  }

  const l = parseFloat(match[1]!) / 100; // Convert percentage to 0-1
  const c = parseFloat(match[2]!);
  const h = parseFloat(match[3]!);
  const alpha: number | undefined = match[4] ? parseFloat(match[4]) : undefined;

  return { l, c, h, ...(alpha !== undefined ? { alpha } : {}) };
}

/**
 * Convert OKLCH to OKLab (intermediate step)
 * OKLCH → OKLab conversion
 */
function oklchToOklab(l: number, c: number, h: number): {
  l: number;
  a: number;
  b: number;
} {
  const hRad = (h * Math.PI) / 180;
  return {
    l,
    a: c * Math.cos(hRad),
    b: c * Math.sin(hRad),
  };
}

/**
 * Convert OKLab to linear RGB (via XYZ)
 * Using D65 white point and sRGB color space
 */
function oklabToLinearRgb(
  l: number,
  a: number,
  b: number
): { r: number; g: number; b: number } {
  // OKLab to linear OKLMS (via matrix)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  // Linear OKLMS to linear LMS
  const lmsL = Math.pow(l_, 3);
  const lmsM = Math.pow(m_, 3);
  const lmsS = Math.pow(s_, 3);

  // Linear LMS to XYZ (D65 white point)
  const x =
    +1.2268798758459243 * lmsL - 0.5578149944602171 * lmsM +
    0.2813910456659647 * lmsS;
  const y =
    -0.0405757452148008 * lmsL + 1.112286803280317 * lmsM -
    0.0717110580655164 * lmsS;
  const z =
    -0.0763729366746601 * lmsL - 0.4214933324022432 * lmsM +
    1.5869240198367816 * lmsS;

  // XYZ to linear RGB (sRGB matrix, D65)
  const r = +3.2409699419045226 * x - 1.537383177570094 * y - 0.4986107602930034 * z;
  const g = -0.9692436362808796 * x + 1.8759675015077202 * y + 0.0415550574071756 * z;
  const b_ = +0.0556300796969937 * x - 0.2039769588889765 * y + 1.0569715142428786 * z;

  return { r, g, b: b_ };
}

/**
 * Convert linear RGB to sRGB (gamma correction)
 */
function linearRgbToSrgb(r: number, g: number, b: number): {
  r: number;
  g: number;
  b: number;
} {
  const gammaCorrection = (c: number): number => {
    if (c <= 0.0031308) {
      return 12.92 * c;
    }
    return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  return {
    r: gammaCorrection(Math.max(0, Math.min(1, r))),
    g: gammaCorrection(Math.max(0, Math.min(1, g))),
    b: gammaCorrection(Math.max(0, Math.min(1, b))),
  };
}

/**
 * Convert RGB values (0-1) to hex string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number): string => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert RGB values (0-1) to RGB/RGBA string
 */
function rgbToString(
  r: number,
  g: number,
  b: number,
  alpha?: number
): string {
  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(b * 255);

  if (alpha !== undefined) {
    return `rgba(${rInt}, ${gInt}, ${bInt}, ${alpha})`;
  }
  return `rgb(${rInt}, ${gInt}, ${bInt})`;
}

/**
 * Convert OKLCH color string to RGB hex string
 *
 * @param oklchString - OKLCH color string (e.g., 'oklch(74% 0.2 35)')
 * @returns RGB hex string (e.g., '#FF6F4A')
 *
 * @example
 * ```ts
 * convertOklchToHex('oklch(74% 0.2 35)') // Returns: '#FF6F4A'
 * ```
 */
export function convertOklchToHex(oklchString: string): string {
  const { l, c, h } = parseOklch(oklchString);
  const { l: labL, a: labA, b: labB } = oklchToOklab(l, c, h);
  const { r, g, b } = oklabToLinearRgb(labL, labA, labB);
  const { r: srgbR, g: srgbG, b: srgbB } = linearRgbToSrgb(r, g, b);
  return rgbToHex(srgbR, srgbG, srgbB);
}

/**
 * Convert OKLCH color string to RGB/RGBA string
 *
 * @param oklchString - OKLCH color string (e.g., 'oklch(74% 0.2 35 / 0.5)')
 * @returns RGB/RGBA string (e.g., 'rgb(255, 111, 74)' or 'rgba(255, 111, 74, 0.5)')
 *
 * @example
 * ```ts
 * convertOklchToRgb('oklch(74% 0.2 35)') // Returns: 'rgb(255, 111, 74)'
 * convertOklchToRgb('oklch(74% 0.2 35 / 0.5)') // Returns: 'rgba(255, 111, 74, 0.5)'
 * ```
 */
export function convertOklchToRgb(oklchString: string): string {
  const { l, c, h, alpha } = parseOklch(oklchString);
  const { l: labL, a: labA, b: labB } = oklchToOklab(l, c, h);
  const { r, g, b } = oklabToLinearRgb(labL, labA, labB);
  const { r: srgbR, g: srgbG, b: srgbB } = linearRgbToSrgb(r, g, b);
  return rgbToString(srgbR, srgbG, srgbB, alpha);
}

/**
 * Batch convert multiple OKLCH values to RGB
 * Useful for converting theme colors
 *
 * @param oklchMap - Object mapping color names to OKLCH strings
 * @returns Object mapping color names to RGB hex strings
 *
 * @example
 * ```ts
 * const colors = {
 *   primary: 'oklch(74% 0.2 35)',
 *   secondary: 'oklch(60% 0.15 200)',
 * };
 * const rgbColors = batchConvertOklchToHex(colors);
 * // Returns: { primary: '#FF6F4A', secondary: '#5A8BC8' }
 * ```
 */
export function batchConvertOklchToHex(
  oklchMap: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, oklch] of Object.entries(oklchMap)) {
    try {
      result[key] = convertOklchToHex(oklch);
    } catch (error) {
      console.warn(`Failed to convert ${key}: ${oklch}`, error);
      result[key] = '#000000'; // Fallback to black
    }
  }
  return result;
}

