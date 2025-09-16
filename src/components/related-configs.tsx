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

type RelatedType = 'rule' | 'mcp' | 'agent' | 'command' | 'hook';

interface RelatedConfigsProps<T = any> {
  configs: T[];
  title?: string;
  type?: RelatedType;
}

const RelatedConfigsComponent = <T extends { id: string } = any>({
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
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
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
          {configs.map((config: any) => (
            <CarouselItem key={config.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="relative">
                {typeof config.similarity === 'number' && config.similarity > 0.7 && (
                  <div className="absolute -top-3 -right-3 z-20">
                    <Badge
                      variant="default"
                      className="bg-primary text-primary-foreground text-xs shadow-sm"
                    >
                      High Match
                    </Badge>
                  </div>
                )}
                <div className="h-full">
                  <ConfigCard {...config} type={type ?? (config.type as any)} />
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

export const RelatedConfigs = memo(RelatedConfigsComponent) as typeof RelatedConfigsComponent;
RelatedConfigs.displayName = 'RelatedConfigs';
