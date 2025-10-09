'use client';

/**
 * Callout - Alert-style component using shadcn/ui Alert
 * Perfect for templates with different alert types
 * Used in 27+ MDX files across the codebase
 */

import { AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { type CalloutProps, calloutPropsSchema } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function Callout(props: CalloutProps) {
  const validated = calloutPropsSchema.parse(props);
  const { type, title, children } = validated;

  return (
    <Alert className="my-6">
      <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
        {type === 'info' && <Info className="h-4 w-4" />}
        {type === 'warning' && <AlertTriangle className="h-4 w-4" />}
        {type === 'error' && <AlertTriangle className="h-4 w-4" />}
        {type === 'success' && <CheckCircle className="h-4 w-4" />}
        {type === 'tip' && <Zap className="h-4 w-4" />}
        <div className={UI_CLASSES.FLEX_1}>
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription className={UI_CLASSES.MT_2}>{children}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
