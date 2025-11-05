/**
 * Embed Code Generator - Viral Loop Widget Creation
 * Generates iframe embed codes for code snippets
 * Enables users to share code blocks on their blogs/sites
 */

import { APP_CONFIG } from '@/src/lib/constants';

export interface EmbedOptions {
  /** Category of content */
  category: string;
  /** Slug of content */
  slug: string;
  /** Highlight specific code block (optional) */
  codeId?: string;
  /** Width of embed (default: 600) */
  width?: number;
  /** Height of embed (default: 400) */
  height?: number;
  /** Theme for embed (default: inherits from page) */
  theme?: 'light' | 'dark' | 'auto';
  /** Show border (default: true) */
  showBorder?: boolean;
  /** UTM source for tracking */
  utmSource?: string;
}

/**
 * Generate iframe embed code for code snippet
 * Creates viral backlinks and attribution
 */
export function generateEmbedCode(options: EmbedOptions): string {
  const {
    category,
    slug,
    codeId,
    width = 600,
    height = 400,
    theme = 'auto',
    showBorder = true,
    utmSource = 'embed_widget',
  } = options;

  // Build embed URL with UTM tracking
  const embedUrl = new URL(`${APP_CONFIG.url}/embed/${category}/${slug}`);

  // Add query parameters
  if (codeId) {
    embedUrl.searchParams.set('code', codeId);
  }
  embedUrl.searchParams.set('theme', theme);
  embedUrl.searchParams.set('border', showBorder.toString());
  embedUrl.searchParams.set('utm_source', utmSource);
  embedUrl.searchParams.set('utm_medium', 'embed');
  embedUrl.searchParams.set('utm_campaign', 'widget_sharing');

  // Generate iframe HTML
  const iframeCode = `<iframe
  src="${embedUrl.toString()}"
  width="${width}"
  height="${height}"
  frameborder="0"
  loading="lazy"
  allow="clipboard-write"
  sandbox="allow-scripts allow-same-origin"
  title="Code snippet from claudepro.directory"
  style="${showBorder ? 'border: 1px solid #e5e7eb; border-radius: 8px;' : ''}"
></iframe>`;

  return iframeCode;
}

/**
 * Generate WordPress shortcode for embed
 * Alternative format for WordPress users
 */
export function generateWordPressShortcode(options: EmbedOptions): string {
  const { category, slug, codeId, width = 600, height = 400 } = options;

  const codeParam = codeId ? ` code="${codeId}"` : '';
  return `[claudepro category="${category}" slug="${slug}"${codeParam} width="${width}" height="${height}"]`;
}

/**
 * Generate Markdown embed code
 * For markdown-based blogs/documentation
 */
export function generateMarkdownEmbed(options: EmbedOptions): string {
  const embedCode = generateEmbedCode(options);
  return `\`\`\`html\n${embedCode}\n\`\`\``;
}

/**
 * Copy embed code to clipboard
 */
export async function copyEmbedCode(options: EmbedOptions): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    const embedCode = generateEmbedCode(options);
    await navigator.clipboard.writeText(embedCode);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate embed preview URL
 * For showing users what the embed will look like
 */
export function generateEmbedPreviewUrl(options: EmbedOptions): string {
  const { category, slug, codeId, theme = 'auto' } = options;

  const previewUrl = new URL(`${APP_CONFIG.url}/embed/${category}/${slug}`);

  if (codeId) {
    previewUrl.searchParams.set('code', codeId);
  }
  previewUrl.searchParams.set('theme', theme);
  previewUrl.searchParams.set('preview', 'true');

  return previewUrl.toString();
}

/**
 * Track embed generation (fire-and-forget)
 */
export async function trackEmbedGeneration(options: {
  category: string;
  slug: string;
  format: 'iframe' | 'wordpress' | 'markdown';
}): Promise<void> {
  try {
    const { trackInteraction } = await import('@/src/lib/actions/analytics.actions');

    await trackInteraction({
      interaction_type: 'embed_generated',
      content_type: options.category,
      content_slug: options.slug,
      metadata: {
        format: options.format,
      },
    });
  } catch {
    // Silent fail
  }
}
