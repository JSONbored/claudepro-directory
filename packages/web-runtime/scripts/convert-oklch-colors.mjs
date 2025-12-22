/**
 * Script to convert OKLCH colors from globals.css to RGB for email theme
 * Uses the conversion utility to generate accurate RGB values
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the conversion utility
// Note: This is a simplified version for the script
function parseOklch(oklchString) {
  const match = oklchString.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
  if (!match) throw new Error(`Invalid OKLCH format: ${oklchString}`);
  return {
    l: parseFloat(match[1]) / 100,
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
    alpha: match[4] ? parseFloat(match[4]) : undefined,
  };
}

function oklchToOklab(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(hRad), b: c * Math.sin(hRad) };
}

function oklabToLinearRgb(l, a, b) {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const lmsL = Math.pow(l_, 3);
  const lmsM = Math.pow(m_, 3);
  const lmsS = Math.pow(s_, 3);
  const x = +1.2268798758459243 * lmsL - 0.5578149944602171 * lmsM + 0.2813910456659647 * lmsS;
  const y = -0.0405757452148008 * lmsL + 1.112286803280317 * lmsM - 0.0717110580655164 * lmsS;
  const z = -0.0763729366746601 * lmsL - 0.4214933324022432 * lmsM + 1.5869240198367816 * lmsS;
  const r = +3.2409699419045226 * x - 1.537383177570094 * y - 0.4986107602930034 * z;
  const g = -0.9692436362808796 * x + 1.8759675015077202 * y + 0.0415550574071756 * z;
  const b_ = +0.0556300796969937 * x - 0.2039769588889765 * y + 1.0569715142428786 * z;
  return { r, g, b: b_ };
}

function linearRgbToSrgb(r, g, b) {
  const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  return {
    r: gamma(Math.max(0, Math.min(1, r))),
    g: gamma(Math.max(0, Math.min(1, g))),
    b: gamma(Math.max(0, Math.min(1, b))),
  };
}

function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToString(r, g, b, alpha) {
  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(b * 255);
  if (alpha !== undefined) return `rgba(${rInt}, ${gInt}, ${bInt}, ${alpha})`;
  return `rgb(${rInt}, ${gInt}, ${bInt})`;
}

function convertOklchToHex(oklchString) {
  const { l, c, h } = parseOklch(oklchString);
  const { l: labL, a: labA, b: labB } = oklchToOklab(l, c, h);
  const { r, g, b } = oklabToLinearRgb(labL, labA, labB);
  const { r: srgbR, g: srgbG, b: srgbB } = linearRgbToSrgb(r, g, b);
  return rgbToHex(srgbR, srgbG, srgbB);
}

function convertOklchToRgb(oklchString) {
  const { l, c, h, alpha } = parseOklch(oklchString);
  const { l: labL, a: labA, b: labB } = oklchToOklab(l, c, h);
  const { r, g, b } = oklabToLinearRgb(labL, labA, labB);
  const { r: srgbR, g: srgbG, b: srgbB } = linearRgbToSrgb(r, g, b);
  return rgbToString(srgbR, srgbG, srgbB, alpha);
}

// Key OKLCH colors from globals.css that need conversion
const keyColors = {
  // Dark theme
  'dark-bg': 'oklch(24% 0.008 60)',
  'dark-card': 'oklch(28% 0.006 60)',
  'dark-foreground': 'oklch(95% 0.005 60)',
  'dark-bg-tertiary': 'oklch(32% 0.008 60)',
  'dark-bg-quaternary': 'oklch(36% 0.009 60)',
  'dark-bg-selected': 'oklch(40% 0.01 60)',
  'dark-bg-code': 'oklch(12% 0.003 60)',
  'dark-bg-overlay': 'oklch(18% 0.005 0 / 0.8)',
  'dark-text-secondary': 'oklch(78% 0.008 60)', // muted-foreground
  'dark-text-tertiary': 'oklch(72% 0.01 60)',
  'dark-text-disabled': 'oklch(57% 0.012 60)',
  'dark-text-inverse': 'oklch(100% 0 0)',
  'dark-border': 'oklch(30% 0.005 60 / 0.5)',
  'dark-border-light': 'oklch(28% 0.005 60 / 0.3)',
  'dark-border-medium': 'oklch(34% 0.008 60 / 0.6)',
  // Light theme
  'light-bg': 'oklch(99% 0.003 90)',
  'light-card': 'oklch(97.5% 0.005 85)',
  'light-foreground': 'oklch(15% 0.005 60)',
  'light-bg-tertiary': 'oklch(96% 0.007 80)',
  'light-bg-quaternary': 'oklch(94% 0.008 75)',
  'light-bg-selected': 'oklch(92% 0.025 42)',
  'light-bg-code': 'oklch(98% 0.004 85)',
  'light-bg-overlay': 'oklch(98% 0.003 90 / 0.9)',
  'light-text-secondary': 'oklch(42% 0.012 70)',
  'light-text-tertiary': 'oklch(44% 0.01 65)',
  'light-text-disabled': 'oklch(68% 0.008 60)',
  'light-text-inverse': 'oklch(100% 0 0)',
  'light-border': 'oklch(92% 0.006 75)',
  'light-border-light': 'oklch(95% 0.004 80)',
  'light-border-medium': 'oklch(88% 0.008 70)',
  // Brand colors
  'claude-orange': 'oklch(74% 0.2 35)',
  'claude-orange-hover': 'oklch(78% 0.19 35)',
  'claude-orange-active': 'oklch(70% 0.21 35)',
  'claude-orange-light': 'oklch(82% 0.17 37)',
  'claude-orange-muted': 'oklch(65% 0.18 33)',
  // Semantic colors (dark theme)
  'dark-success': 'oklch(72% 0.19 145)',
  'dark-warning': 'oklch(75% 0.155 65)',
  'dark-error': 'oklch(70% 0.195 25)',
  'dark-info': 'oklch(78% 0.168 250)',
  // Semantic colors (light theme)
  'light-success': 'oklch(52% 0.18 145)',
  'light-warning': 'oklch(58% 0.16 65)',
  'light-error': 'oklch(53% 0.19 25)',
  'light-info': 'oklch(54% 0.17 250)',
};

console.log('Converting OKLCH colors to RGB:\n');
const conversions = {};

for (const [name, oklch] of Object.entries(keyColors)) {
  try {
    const hasAlpha = oklch.includes('/');
    const rgb = hasAlpha ? convertOklchToRgb(oklch) : convertOklchToHex(oklch);
    conversions[name] = { oklch, rgb };
    console.log(`${name.padEnd(25)} ${oklch.padEnd(25)} => ${rgb}`);
  } catch (error) {
    console.error(`Error converting ${name}:`, error.message);
  }
}

console.log('\n\nConversion complete. Use these values in theme.ts');

