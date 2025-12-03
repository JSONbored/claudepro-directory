'use client';

import { cn } from '../utils.ts';
import { focusRing, transition } from '../../design-system/styles/interactive.ts';
import { size, muted, weight } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { bgGradient } from '../../design-system/styles/colors.ts';
import { gradientFrom, gradientTo } from '../../design-system/styles/colors.ts';
import { bgColor, textColor } from '../../design-system/styles/colors.ts';
import { zLayer } from '../../design-system/styles/effects.ts';
import { display, padding, position, width, height, inset } from '../../design-system/styles/layout.ts';
import { border } from '../../design-system/styles/borders.ts';
import { borderColor } from '../../design-system/styles/colors.ts';
import { opacityLevel } from '../../design-system/styles/effects.ts';
import { cursor } from '../../design-system/styles/interactive.ts';
import { blur } from '../../design-system/styles/effects.ts';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useState } from 'react';

export interface InputProps extends React.ComponentProps<'input'> {
  ref?: React.RefObject<HTMLInputElement | null>;
  error?: boolean;
  errorId?: string;
}

const Input = ({ className, type, ref, error, errorId, onFocus, onBlur, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={position.relative}>
      {/* Glow effect on focus - No layout shift, pure visual enhancement */}
      {isFocused && (
        <motion.div
          className={`${inset.neg05} ${zLayer.behind10} ${position.absolute} ${radius.md} ${bgGradient.toR} ${gradientFrom.accent50} ${gradientTo.primary50} ${blur.sm}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <input
        type={type}
        className={cn(
          `${position.relative} ${display.flex} ${height.search} ${width.full} ${radius.md} ${border.default} ${borderColor.input} ${bgColor.background} ${padding.xCompact} ${padding.yCompact} ${size.base} ring-offset-background ${transition.default} file:border-0 file:bg-transparent file:${weight.medium} file:${textColor.foreground} file:${size.sm} placeholder:${muted.default} ${focusRing.default} disabled:${opacityLevel[50]} disabled:${cursor.notAllowed} md:${size.sm}`,
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId || undefined}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </div>
  );
};
Input.displayName = 'Input';

export { Input };
