'use client';

/**
 * Callout - Alert-style component using shadcn/ui Alert
 * Perfect for templates with different alert types
 * Used in 27+ MDX files across the codebase
 */

import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, Zap } from '@/src/lib/icons';
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
        <div className="flex-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription className="mt-2">{children}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
