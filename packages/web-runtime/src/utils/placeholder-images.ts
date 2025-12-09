/**
 * Placeholder Image Utilities
 * 
 * Provides utilities for placeholder/fallback images hosted in Supabase Storage.
 * This ensures we have full control over placeholder assets and don't rely on external services.
 * 
 * ⚠️ Client-Compatible: Safe to use in both server and client components
 */

/**
 * Get the public URL for a placeholder image from Supabase Storage
 * 
 * @param imageName - Name of the placeholder image (e.g., 'default-avatar.png')
 * @param bucket - Storage bucket name (default: 'placeholders')
 * @returns Public URL to the placeholder image
 * 
 * @example
 * ```ts
 * const avatarUrl = getPlaceholderImageUrl('default-avatar.png');
 * // Returns: https://[project].supabase.co/storage/v1/object/public/placeholders/default-avatar.png
 * ```
 */
export function getPlaceholderImageUrl(
  imageName: string = 'default-avatar.png',
  bucket: string = 'placeholders'
): string {
  // Get Supabase project URL from environment
  // NEXT_PUBLIC_* vars are available in both server and client contexts
  // Use bracket notation for TypeScript index signature compliance
  const supabaseUrl = 
    typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_SUPABASE_URL']
      ? process.env['NEXT_PUBLIC_SUPABASE_URL']
      : typeof window !== 'undefined'
        ? (window as unknown as { __NEXT_DATA__?: { env?: { ['NEXT_PUBLIC_SUPABASE_URL']?: string } } }).__NEXT_DATA__?.env?.['NEXT_PUBLIC_SUPABASE_URL']
        : undefined;
  
  if (!supabaseUrl) {
    // Fallback: Return a data URI for a simple SVG placeholder
    // This ensures the function always returns a valid URL even if env is missing
    // Using a simple gray circle with question mark
    const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="%23e5e7eb"/>
      <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="%239ca3af" text-anchor="middle" dominant-baseline="central" font-weight="500">?</text>
    </svg>`;
    // Encode SVG for data URI (client-safe, no Buffer needed)
    const encoded = typeof btoa !== 'undefined' 
      ? btoa(unescape(encodeURIComponent(svg)))
      : svg; // Fallback for Node.js (though this shouldn't happen in client context)
    return `data:image/svg+xml;base64,${encoded}`;
  }
  
  // Construct Supabase Storage public URL
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${imageName}`;
}

/**
 * Get placeholder avatar URL
 * Convenience function for the most common use case
 * 
 * @returns Public URL to default avatar placeholder
 */
export function getPlaceholderAvatarUrl(): string {
  return getPlaceholderImageUrl('default-avatar.png', 'placeholders');
}

/**
 * Check if a URL is a placeholder image URL
 * 
 * @param url - URL to check
 * @returns True if the URL points to a placeholder image
 */
export function isPlaceholderImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes('/storage/v1/object/public/placeholders/');
  } catch {
    return false;
  }
}
