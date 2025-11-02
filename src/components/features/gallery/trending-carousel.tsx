/**
 * TrendingCarousel - Center-focused code screenshot carousel
 * Sugar High-inspired design with opacity gradient and momentum scroll
 * Uses Embla Carousel (3KB) + Motion.dev for smooth animations
 */

'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from '@/src/lib/icons';

export interface TrendingItem {
  category: string;
  slug: string;
  title: string;
  description: string;
  screenshot_count: number;
  share_count: number;
  trending_score: number;
}

interface TrendingCarouselProps {
  items: TrendingItem[];
  autoPlayInterval?: number;
}

export function TrendingCarousel({ items, autoPlayInterval = 5000 }: TrendingCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    containScroll: 'trimSnaps',
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!emblaApi || isHovering) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [emblaApi, isHovering, autoPlayInterval]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex">
          {items.map((item, index) => {
            const isCurrent = index === selectedIndex;
            const distance = Math.abs(index - selectedIndex);

            return (
              <motion.div
                key={`${item.category}-${item.slug}`}
                className="min-w-0 flex-[0_0_85%] pl-4 md:flex-[0_0_70%] lg:flex-[0_0_60%]"
                initial={false}
                animate={{
                  opacity: isCurrent ? 1 : distance === 1 ? 0.5 : 0.3,
                  scale: isCurrent ? 1.05 : 0.95,
                  filter: isCurrent ? 'blur(0px)' : 'blur(2px)',
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <a
                  href={`/${item.category}/${item.slug}`}
                  className="group relative block"
                  aria-label={`View ${item.title}`}
                >
                  {/* Card Container */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card/80 to-transparent shadow-2xl transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/20">
                    {/* Preview Image Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
                      <div className="p-6 text-center">
                        <h3 className="mb-2 font-bold text-2xl text-foreground">{item.title}</h3>
                        <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1">
                            <span>📸</span>
                            <span>{item.screenshot_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🔥</span>
                            <span>{Math.round(item.trending_score)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-medium text-primary text-xs backdrop-blur-sm">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        type="button"
        onClick={scrollPrev}
        className="-translate-y-1/2 absolute top-1/2 left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={scrollNext}
        className="-translate-y-1/2 absolute top-1/2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
