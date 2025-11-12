/**
 * Container - Responsive layout container wrapper
 * Database-First: No logic, just layout primitive
 */

import type { HTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

export function Container({ className, ...props }: ContainerProps) {
  return <div className={cn('container mx-auto px-4', className)} {...props} />;
}
