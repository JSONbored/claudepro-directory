'use client';

/**
 * InfoBox - Information highlight box
 * Used in 8 MDX files across the codebase - General-purpose informational component
 */

import { AlertTriangle, CheckCircle, Info, Star } from '@/src/lib/icons';
import { type InfoBoxProps, infoBoxPropsSchema } from '@/src/lib/schemas/shared.schema';

export function InfoBox(props: InfoBoxProps) {
  const validated = infoBoxPropsSchema.parse(props);
  const { title, children, variant } = validated;

  const variantStyles = {
    default: 'border-border bg-card',
    important: 'border-primary bg-primary/5',
    success: 'border-green-500 bg-green-500/5',
    warning: 'border-yellow-500 bg-yellow-500/5',
    info: 'border-blue-500 bg-blue-500/5',
  };

  const iconMap = {
    default: <Info className="h-5 w-5" />,
    important: <Star className="h-5 w-5 text-primary" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div
      itemScope
      itemType="https://schema.org/Note"
      className={`my-6 border-l-4 rounded-r-lg p-6 ${variantStyles[variant]}`}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {iconMap[variant]}
          <h4 className="font-semibold text-foreground" itemProp="name">
            {title}
          </h4>
        </div>
      )}
      <div itemProp="text" className="text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}
