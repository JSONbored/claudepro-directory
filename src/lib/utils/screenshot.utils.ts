'use client';

/**
 * Screenshot Utility - Code Block to Image Generation
 * Uses html2canvas-pro for high-quality PNG generation with modern color support (oklch, lab)
 * Includes watermark branding for viral loop attribution
 */

import html2canvas from 'html2canvas-pro';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

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
  /** Title to display at top of screenshot */
  title?: string | undefined;
  /** Category for title display */
  category?: string | undefined;
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
    title,
    category,
  } = options;

  if (!element) {
    throw new Error('Element is required for screenshot generation');
  }

  try {
    // Create outer wrapper with padding and background
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      background: linear-gradient(135deg, rgb(26, 26, 26) 0%, rgb(20, 20, 20) 100%);
      padding: ${padding}px;
      max-width: ${maxWidth}px;
      position: relative;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    `;

    // Add title header if provided
    if (title || category) {
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      `;

      if (category) {
        const categoryBadge = document.createElement('span');
        categoryBadge.textContent = category;
        categoryBadge.style.cssText = `
          background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        `;
        header.appendChild(categoryBadge);
      }

      if (title) {
        const titleEl = document.createElement('span');
        titleEl.textContent = title;
        titleEl.style.cssText = `
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 500;
          font-family: monospace;
        `;
        header.appendChild(titleEl);
      }

      wrapper.appendChild(header);
    }

    // Clone element - deep clone preserves inline styles
    const clone = element.cloneNode(true) as HTMLElement;

    // Force full height display - override any collapsed state
    // This ensures screenshot captures ALL content, not just visible portion
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';

    // Remove gradient fade overlay if present (used for collapsed state)
    const gradientOverlay = clone.querySelector('[class*="gradient"]');
    if (gradientOverlay && gradientOverlay instanceof HTMLElement) {
      const parent = gradientOverlay.parentElement;
      if (parent && gradientOverlay.style.background?.includes('linear-gradient')) {
        gradientOverlay.remove();
      }
    }

    // Remove expand/collapse button if present (appears after code content)
    const expandButtons = clone.querySelectorAll('button');
    for (const button of expandButtons) {
      // Remove buttons that contain ChevronDown icon or expand text
      if (
        button.textContent?.toLowerCase().includes('expand') ||
        button.textContent?.toLowerCase().includes('collapse') ||
        button.querySelector('svg')
      ) {
        button.remove();
      }
    }

    wrapper.appendChild(clone);

    // Add watermark
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
      wrapper.appendChild(watermarkDiv);
    }

    // Create final container
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.appendChild(wrapper);

    // Temporarily add to DOM for rendering
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Wait for fonts to load
    await document.fonts.ready;

    // Generate canvas with html2canvas-pro
    const canvas = await html2canvas(container, {
      scale,
      backgroundColor: backgroundColor === 'transparent' ? '#1a1a1a' : backgroundColor,
      logging: false,
      allowTaint: true,
      useCORS: true,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
      ignoreElements: (element) => {
        // Ignore motion.div elements that might cause issues
        return element.getAttribute('data-projection-id') !== null;
      },
    });

    // Convert canvas to PNG (clipboard requires PNG, not WebP)
    const dataUrl = canvas.toDataURL('image/png');

    // Remove temporary container
    document.body.removeChild(container);

    // Convert to PNG blob for clipboard
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
    logger.error('generateCodeScreenshot failed', normalizeError(error), {
      hasElement: Boolean(element),
      category: category ?? 'unknown',
      title: title ?? 'untitled',
    });
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
    logger.error('copyScreenshotToClipboard failed', normalizeError(error));
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
export function generateScreenshotFilename(
  category?: string,
  slug?: string,
  format: 'png' | 'webp' = 'webp'
): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ext = format;
  if (category && slug) {
    return `claudepro-${category}-${slug}-${timestamp}.${ext}`;
  }
  return `claudepro-code-${timestamp}.${ext}`;
}
