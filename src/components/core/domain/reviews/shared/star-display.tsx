import { Star } from '@/src/lib/icons';

/**
 * Shared star rating display component
 * Used across all review variants for consistent star visualization
 */
export function StarDisplay({
  rating,
  maxStars = 5,
  size = 'md',
  showFilled = true,
}: {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showFilled?: boolean;
}) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <>
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={`star-${i + 1}`}
          className={`${sizeClasses[size]} ${
            showFilled && i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-muted-foreground/30'
          }`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
