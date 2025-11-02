'use client';

/**
 * Screenshot Utility - Code Block to Image Generation
 * Uses modern-screenshot for high-quality PNG generation
 * Includes watermark branding for viral loop attribution
 */

import { domToPng } from 'modern-screenshot';

export interface ScreenshotOptions {
  /** Element to screenshot */
  element: HTMLElement;
  /** Watermark text (default: 'claudepro.directory') */
  watermark?: string;
  /** Watermark position */
  watermarkPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Screenshot quality multiplier (2 for Retina) */
  scale?: number;
  /** Max width in pixels */
  maxWidth?: number;
  /** Background color */
  backgroundColor?: string;
  /** Add padding around element */
  padding?: number;
}

export interface ScreenshotResult {
  /** Data URL of screenshot */
  dataUrl: string;
  /** Blob of screenshot (for clipboard) */
  blob: Blob;
  /** Dimensions */
  width: number;
  height: number;
}

/**
 * Generate screenshot of code block with branding watermark
 * Optimized for social sharing with 2x resolution for Retina displays
 */
export async function generateCodeScreenshot(
  options: ScreenshotOptions
): Promise<ScreenshotResult> {
  const {
    element,
    watermark = 'claudepro.directory',
    watermarkPosition = 'bottom-right',
    scale = 2,
    maxWidth = 1200,
    backgroundColor = 'transparent',
    padding = 24,
  } = options;

  if (!element) {
    throw new Error('Element is required for screenshot generation');
  }

  try {
    // Clone element to avoid modifying original
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.maxWidth = `${maxWidth}px`;
    clone.style.padding = `${padding}px`;

    // Add watermark overlay
    if (watermark) {
      const watermarkDiv = document.createElement('div');
      watermarkDiv.textContent = watermark;
      watermarkDiv.style.cssText = `
        position: absolute;
        ${watermarkPosition.includes('bottom') ? 'bottom: 12px;' : 'top: 12px;'}
        ${watermarkPosition.includes('right') ? 'right: 12px;' : 'left: 12px;'}
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        font-family: monospace;
        pointer-events: none;
        z-index: 1000;
      `;
      clone.style.position = 'relative';
      clone.appendChild(watermarkDiv);
    }

    // Generate PNG with modern-screenshot
    const dataUrl = await domToPng(clone, {
      scale,
      backgroundColor,
      quality: 1.0,
    });

    // Convert to blob for clipboard
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Get dimensions from data URL
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    return {
      dataUrl,
      blob,
      width: img.width,
      height: img.height,
    };
  } catch (error) {
    throw new Error(
      `Screenshot generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Copy screenshot to clipboard
 * Uses Clipboard API with PNG blob
 */
export async function copyScreenshotToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error('Clipboard API not supported in this browser');
  }

  try {
    const clipboardItem = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([clipboardItem]);
  } catch (error) {
    throw new Error(
      `Failed to copy to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Download screenshot as PNG file
 */
export function downloadScreenshot(dataUrl: string, filename = 'code-screenshot.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
  link.remove();
}

/**
 * Generate filename for screenshot based on context
 */
export function generateScreenshotFilename(category?: string, slug?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (category && slug) {
    return `claudepro-${category}-${slug}-${timestamp}.png`;
  }
  return `claudepro-code-${timestamp}.png`;
}
