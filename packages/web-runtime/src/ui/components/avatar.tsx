'use client';

import { cn } from '../utils.ts';
import { squareSize } from '../../design-system/styles/layout.ts';
import { radius } from '../../design-system/styles/radius.ts';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import type * as React from 'react';

const Avatar = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>;
}) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(`relative flex ${squareSize.avatarMd} shrink-0 overflow-hidden ${radius.full}`, className)}
    {...props}
  />
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>>;
}) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
);
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>>;
}) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      `flex h-full w-full items-center justify-center ${radius.full} bg-muted`,
      className
    )}
    {...props}
  />
);
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
