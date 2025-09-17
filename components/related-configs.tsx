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
import type { ContentMetadata } from '@/types/content';

type RelatedType = 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks';

interface RelatedConfigsProps<T extends ContentMetadata = ContentMetadata> {
  configs: T[];
  title?: string;
  type?: RelatedType;
}

const RelatedConfigsComponent = <T extends ContentMetadata = ContentMetadata>({
  configs,
  title = 'Related Configurations',
  type,
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
            <CarouselItem key={config.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
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
                  <ConfigCard {...config} type={type || ('agents' as RelatedType)} />
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
