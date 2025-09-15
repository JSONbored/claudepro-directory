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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configs.map((config: any) => (
          <div key={config.id} className="relative">
            {typeof config.similarity === 'number' && config.similarity > 0.7 && (
              <div className="absolute -top-3 -right-3 z-20">
                <Badge variant="default" className="bg-primary text-primary-foreground text-xs shadow-sm">
                  High Match
                </Badge>
              </div>
            )}
            <div className="h-full">
              <ConfigCard
                {...config}
                type={type ?? (config.type as any)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};