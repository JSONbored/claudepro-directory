'use client';

import { Lightbulb } from 'lucide-react';
import { memo } from 'react';
import { ConfigCard } from '@/components/config-card';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { RelatedConfigsProps, UnifiedContentItem } from '@/lib/schemas/component.schema';

// RelatedConfigsProps is now imported from component.schema.ts

const RelatedConfigsComponent = <T extends UnifiedContentItem = UnifiedContentItem>({
  configs,
  title = 'Related Configurations',
}: RelatedConfigsProps<T>) => {
  if (configs.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <Badge variant="outline" className="border-accent/20 bg-accent/5 text-accent">
          AI Recommended
        </Badge>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full max-w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {configs.map((config) => (
            <CarouselItem key={config.slug} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="relative">
                {typeof (config as { similarity?: number }).similarity === 'number' &&
                  (config as { similarity?: number }).similarity! > 0.7 && (
                    <div className="absolute -top-3 -right-3 z-20">
                      <Badge
                        variant="default"
                        className="bg-accent text-accent-foreground text-xs shadow-sm"
                      >
                        High Match
                      </Badge>
                    </div>
                  )}
                <div className="h-full">
                  <ConfigCard
                    item={config}
                    variant="default"
                    showCategory={false}
                    showActions={false}
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
};

const MemoizedRelatedConfigs = memo(RelatedConfigsComponent) as typeof RelatedConfigsComponent;

export const RelatedConfigs = Object.assign(MemoizedRelatedConfigs, {
  displayName: 'RelatedConfigs',
});
