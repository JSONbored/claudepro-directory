'use client';

import Image from 'next/image';
import { useState } from 'react';
import { z } from 'zod';

const optimizedImagePropsSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().default(800),
  height: z.number().default(600),
  className: z.string().default(''),
  priority: z.boolean().default(false),
  blurDataURL: z.string().default(''),
});

type OptimizedImageProps = z.infer<typeof optimizedImagePropsSchema>;

/**
 * Generate a blur placeholder as a base64-encoded 1x1 SVG
 * Uses a subtle gradient for better visual transition
 */
function generateBlurDataURL(width: number, height: number): string {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(var(--muted));stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:hsl(var(--card));stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:hsl(var(--muted));stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function OptimizedImage(props: OptimizedImageProps) {
  const { src, alt, width, height, className, priority, blurDataURL } =
    optimizedImagePropsSchema.parse(props);
  const [isLoading, setLoading] = useState(true);
  const [hasError, setError] = useState(false);

  // Check if it's a local image
  const isLocal = src.startsWith('/') || !src.match(/^https?:\/\//);

  // Generate blur placeholder if not provided
  const blurPlaceholder = blurDataURL.length > 0 ? blurDataURL : generateBlurDataURL(width, height);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg border border-border/50 ${className}`}
        style={{ width, height: Math.round(height * 0.6) }}
      >
        <div className="text-center text-muted-foreground">
          <svg
            className="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="currentColor"
            viewBox="0 0 20 20"
            role="img"
            aria-label="Image failed to load"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm">Image failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border/50 bg-card/30 ${className}`}
    >
      {isLocal ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          placeholder="blur"
          blurDataURL={blurPlaceholder}
          className={`w-full h-auto object-cover transition-all duration-500 ease-out ${
            isLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
          }`}
          style={{ aspectRatio: `${width}/${height}` }}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          placeholder="blur"
          blurDataURL={blurPlaceholder}
          className={`w-full h-auto object-cover transition-all duration-500 ease-out ${
            isLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
          }`}
          style={{ aspectRatio: `${width}/${height}` }}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          loading="lazy"
          unoptimized
        />
      )}
    </div>
  );
}
