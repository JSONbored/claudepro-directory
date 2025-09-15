import { ConfigCard } from '@/components/ConfigCard';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

type RelatedType = 'rule' | 'mcp' | 'agent' | 'command' | 'hook';

interface RelatedConfigsProps<T = any> {
  configs: T[];
  title?: string;
  type?: RelatedType;
}

export const RelatedConfigs = <T extends { id: string } = any>({ 
  configs, 
  title = "Related Configurations",
  type
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {configs.map((config: any) => (
          <div key={config.id} className="relative min-w-0">
            {typeof config.similarity === 'number' && config.similarity > 0.7 && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                  High Match
                </Badge>
              </div>
            )}
            <ConfigCard
              {...config}
              type={type ?? (config.type as any)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};