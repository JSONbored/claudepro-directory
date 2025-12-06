'use client';

/**
 * Particles Background Component
 *
 * Lightweight particle effect for homepage hero section.
 * Uses canvas for GPU-accelerated rendering with minimal performance impact.
 *
 * Features:
 * - 50 particles on desktop, 20 on mobile
 * - Orange/amber brand colors
 * - Smooth floating animation
 * - Respects prefers-reduced-motion
 * - Auto-cleanup on unmount
 *
 * Usage:
 * ```tsx
 * <div className="relative">
 *   <ParticlesBackground />
 *   <YourContent />
 * </div>
 * ```
 */

// Default orange color - can be overridden via props
const DEFAULT_PARTICLE_COLOR = '#F97316';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

interface ParticlesBackgroundProps {
  /** Number of particles (default: 50 on desktop, 20 on mobile) */
  count?: number;
  /** Particle color (default: orange from design tokens) */
  color?: string;
  /** Maximum particle size (default: 3) */
  maxSize?: number;
  /** Particle speed multiplier (default: 1) */
  speed?: number;
  /** Disable animations (respects prefers-reduced-motion) */
  disabled?: boolean;
}

export function ParticlesBackground({
  count,
  color = DEFAULT_PARTICLE_COLOR,
  maxSize = 3,
  speed = 1,
  disabled = false,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (disabled || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive particle count
    const isMobile = window.innerWidth < 768;
    const particleCount = count ?? (isMobile ? 20 : 50);

    // Set canvas size with max size validation
    // Canvas has browser-imposed maximum dimensions (typically 16,384px)
    const MAX_CANVAS_SIZE = 16384;
    const setCanvasSize = () => {
      const baseWidth = canvas.offsetWidth;
      const baseHeight = canvas.offsetHeight;
      
      // Calculate scaled dimensions
      const scaledWidth = baseWidth * window.devicePixelRatio;
      const scaledHeight = baseHeight * window.devicePixelRatio;
      
      // Cap dimensions to browser maximum
      const cappedWidth = Math.min(scaledWidth, MAX_CANVAS_SIZE);
      const cappedHeight = Math.min(scaledHeight, MAX_CANVAS_SIZE);
      
      canvas.width = cappedWidth;
      canvas.height = cappedHeight;
      
      // Only scale if dimensions are within limits
      if (scaledWidth <= MAX_CANVAS_SIZE && scaledHeight <= MAX_CANVAS_SIZE) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      } else {
        // Scale proportionally if we hit the limit
        const scaleX = cappedWidth / baseWidth;
        const scaleY = cappedHeight / baseHeight;
        ctx.scale(scaleX, scaleY);
      }
    };

    setCanvasSize();

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: Math.random() * maxSize + 1,
        speedX: (Math.random() - 0.5) * 0.5 * speed,
        speedY: (Math.random() - 0.5) * 0.5 * speed,
        opacity: Math.random() * 0.3 + 0.1, // 0.1 to 0.4
      }));
    };

    initParticles();

    // Parse color to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      // Remove # if present
      const cleanHex = hex.replace(/^#/, '');

      // Parse hex values
      const r = Number.parseInt(cleanHex.slice(0, 2), 16);
      const g = Number.parseInt(cleanHex.slice(2, 4), 16);
      const b = Number.parseInt(cleanHex.slice(4, 6), 16);

      return { r, g, b };
    };

    const rgb = hexToRgb(color);

    // Animation loop
    const animate = () => {
      if (!(ctx && canvas)) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update and draw particles
      for (const particle of particlesRef.current) {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.opacity})`;
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      setCanvasSize();
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [count, color, maxSize, speed, disabled]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      style={{ opacity: 0.5 }}
    />
  );
}

/**
 * Preset configurations for common use cases
 */
export const ParticlesPresets = {
  hero: {
    count: 50,
    maxSize: 3,
    speed: 1,
  },
  subtle: {
    count: 30,
    maxSize: 2,
    speed: 0.5,
  },
  intense: {
    count: 80,
    maxSize: 4,
    speed: 1.5,
  },
  mobile: {
    count: 20,
    maxSize: 2,
    speed: 0.8,
  },
} as const;
