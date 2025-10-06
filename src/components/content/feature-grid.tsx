'use client';

/**
 * FeatureGrid - Grid layout for displaying features with gradients and animations
 * Used in 27+ MDX files across the codebase
 */

import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { type FeatureGridProps, featureGridPropsSchema } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function FeatureGrid(props: FeatureGridProps) {
  const validated = featureGridPropsSchema.parse(props);
  const { features, title, description, columns } = validated;
  const validFeatures = features;
  const gridCols: Record<2 | 3 | 4, string> = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  // Handle undefined or empty features array
  if (validFeatures.length === 0) {
    return null;
  }

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      <div className={UI_CLASSES.MB_6}>
        <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`} itemProp="name">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground" itemProp="description">
            {description}
          </p>
        )}
      </div>

      <div className={`${UI_CLASSES.GRID} grid-cols-1 ${gridCols[columns]} gap-6`}>
        {validFeatures.map((feature, index) => (
          <Card
            key={feature.title}
            itemScope
            itemType="https://schema.org/ListItem"
            className={`${UI_CLASSES.RELATIVE} border border-border/50 bg-gradient-to-br from-card/30 via-card/50 to-card/30 hover:from-card/50 hover:via-card/70 hover:to-card/50 transition-all duration-300 ${UI_CLASSES.H_FULL} ${UI_CLASSES.GROUP} overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1`}
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out forwards',
            }}
          >
            {/* Gradient overlay */}
            <div
              className={`${UI_CLASSES.ABSOLUTE} ${UI_CLASSES.INSET_0} bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${UI_CLASSES.POINTER_EVENTS_NONE}`}
            />

            <CardHeader>
              <CardTitle
                className={`flex ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN} ${UI_CLASSES.RELATIVE} ${UI_CLASSES.Z_10}`}
                itemProp="name"
              >
                <span
                  className={`bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent ${UI_CLASSES.FONT_SEMIBOLD}`}
                >
                  {feature.title}
                </span>
                {feature.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-gradient-to-r from-primary/20 to-primary/30 border-primary/30 shadow-sm"
                  >
                    {feature.badge}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={`${UI_CLASSES.RELATIVE} ${UI_CLASSES.Z_10}`}>
              <p itemProp="description" className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
