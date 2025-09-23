'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
}: OptimizedImageProps) {
  const [isLoading, setLoading] = useState(true);
  const [hasError, setError] = useState(false);

  // Check if it's a local image
  const isLocal = src.startsWith('/') || !src.match(/^https?:\/\//);

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
          className={`w-full h-auto object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
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
          className={`w-full h-auto object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ aspectRatio: `${width}/${height}` }}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          loading="lazy"
          unoptimized
        />
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <div className="text-muted-foreground">
            <svg
              className="w-8 h-8 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Loading image"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-25"
              />
              <path
                fill="currentColor"
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
