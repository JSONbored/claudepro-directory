import { ConfigCard } from '@/components/ConfigCard';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import { RecommendationItem } from '@/lib/recommendations';

interface RelatedConfigsProps {
  configs: RecommendationItem[];
  title?: string;
}

export const RelatedConfigs = ({ 
  configs, 
  title = "Related Configurations" 
}: RelatedConfigsProps) => {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {configs.map((config) => (
          <div key={config.id} className="relative">
            {config.similarity && config.similarity > 0.7 && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                  High Match
                </Badge>
              </div>
            )}
            <ConfigCard
              {...config}
              type={config.type}
            />
          </div>
        ))}
      </div>
    </section>
  );
};