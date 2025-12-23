'use client';

/**
 * Dialog Stack Component
 *
 * A stack-based dialog system that allows multiple dialogs to be layered on top of each other.
 * Perfect for multi-step wizards, nested modals, and progressive disclosure patterns.
 *
 * @example
 * ```tsx
 * <DialogStack>
 *   <DialogStackTrigger>Open Wizard</DialogStackTrigger>
 *   <DialogStackOverlay />
 *   <DialogStackBody>
 *     <DialogStackContent index={0}>
 *       <DialogStackHeader>
 *         <DialogStackTitle>Step 1</DialogStackTitle>
 *       </DialogStackHeader>
 *       <DialogStackNext>Next</DialogStackNext>
 *     </DialogStackContent>
 *     <DialogStackContent index={1}>
 *       <DialogStackHeader>
 *         <DialogStackTitle>Step 2</DialogStackTitle>
 *       </DialogStackHeader>
 *       <DialogStackPrevious>Back</DialogStackPrevious>
 *     </DialogStackContent>
 *   </DialogStackBody>
 * </DialogStack>
 * ```
 *
 * **When to use:**
 * - Multi-step wizards: Onboarding flows, setup processes
 * - Nested modals: Complex interactions with multiple layers
 * - Progressive disclosure: Reveal information step-by-step
 * - Tutorial flows: Guided experiences
 *
 * **Key features:**
 * - Stack-based navigation (next/previous)
 * - Visual depth with offset positioning
 * - Clickable stack navigation
 * - Smooth transitions
 * - Portal-based rendering
 */

import { useControllableState, PortalPrimitive } from '@heyclaude/web-runtime/utils/radix-re-exports';
import type {
  ButtonHTMLAttributes,
  Dispatch,
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactElement,
  SetStateAction,
} from 'react';
import {
  Children,
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { cn, Button } from '@heyclaude/web-runtime/ui';
import { useOnClickOutside } from '@heyclaude/web-runtime/hooks/use-on-click-outside';
import { useScrollLock } from '@heyclaude/web-runtime/hooks/use-scroll-lock';

type DialogStackContextType = {
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  totalDialogs: number;
  setTotalDialogs: Dispatch<SetStateAction<number>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  clickable: boolean;
};

const DialogStackContext = createContext<DialogStackContextType>({
  activeIndex: 0,
  setActiveIndex: () => {},
  totalDialogs: 0,
  setTotalDialogs: () => {},
  isOpen: false,
  setIsOpen: () => {},
  clickable: false,
});

type DialogStackChildProps = {
  index?: number;
};

export type DialogStackProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  clickable?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export const DialogStack = ({
  children,
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  clickable = false,
  ...props
}: DialogStackProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    prop: open,
    ...(onOpenChange ? { onChange: onOpenChange } : {}),
  });

  // Scroll lock: Lock body scroll when dialog stack is open
  const { lock, unlock } = useScrollLock({ autoLock: false });

  useEffect(() => {
    if (isOpen) {
      lock();
    } else {
      unlock();
    }

    return () => {
      unlock(); // Ensure unlock on unmount
    };
  }, [isOpen, lock, unlock]);

  useEffect(() => {
    if (onOpenChange && isOpen !== undefined) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  return (
    <DialogStackContext.Provider
      value={{
        activeIndex,
        setActiveIndex,
        totalDialogs: 0,
        setTotalDialogs: () => {},
        isOpen: isOpen ?? false,
        setIsOpen: (value) => setIsOpen(Boolean(value)),
        clickable,
      }}
    >
      <div className={className} {...(props as any)}>
        {children}
      </div>
    </DialogStackContext.Provider>
  );
};

export type DialogStackTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export const DialogStackTrigger = ({
  children,
  className,
  onClick,
  asChild,
  ...props
}: DialogStackTriggerProps) => {
  const context = useContext(DialogStackContext);

  if (!context) {
    throw new Error('DialogStackTrigger must be used within a DialogStack');
  }

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    context.setIsOpen(true);
    onClick?.(e);
  };

  return (
    <Button
      asChild={asChild}
      className={className}
      onClick={handleClick}
      {...(props as any)}
    >
      {asChild ? children : <>{children}</>}
    </Button>
  );
};

export type DialogStackOverlayProps = HTMLAttributes<HTMLDivElement>;

export const DialogStackOverlay = ({ className, ...props }: DialogStackOverlayProps) => {
  const context = useContext(DialogStackContext);

  if (!context) {
    throw new Error('DialogStackOverlay must be used within a DialogStack');
  }

  const handleClick = useCallback(() => {
    context.setIsOpen(false);
  }, [context.setIsOpen]);

  if (!context.isOpen) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: "This is a clickable overlay"
    // biome-ignore lint/a11y/useKeyWithClickEvents: "This is a clickable overlay"
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background/80',
        'data-[state=closed]:animate-out data-[state=open]:animate-in',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      onClick={handleClick}
      {...(props as any)}
    />
  );
};

export type DialogStackBodyProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactElement<DialogStackChildProps>[] | ReactElement<DialogStackChildProps>;
};

export const DialogStackBody = ({ children, className, ...props }: DialogStackBodyProps) => {
  const context = useContext(DialogStackContext);
  const [totalDialogs, setTotalDialogs] = useState(Children.count(children));
  const bodyRef = useRef<HTMLDivElement | null>(null);

  if (!context) {
    throw new Error('DialogStackBody must be used within a DialogStack');
  }

  // Close dialog when clicking outside the body content
  useOnClickOutside(bodyRef as RefObject<HTMLDivElement>, () => {
    if (context.isOpen) {
      context.setIsOpen(false);
    }
  });

  if (!context.isOpen) {
    return null;
  }

  return (
    <DialogStackContext.Provider
      value={{
        ...context,
        totalDialogs,
        setTotalDialogs,
      }}
    >
      <PortalPrimitive.Root>
        <div
          className={cn(
            'pointer-events-none fixed inset-0 z-50 mx-auto flex w-full max-w-lg flex-col items-center justify-center',
            className
          )}
          {...(props as any)}
        >
          <div
            ref={bodyRef}
            className={`pointer-events-auto relative flex w-full flex-col items-center justify-center`}
          >
            {Children.map(children, (child, index) => {
              const childElement = child as ReactElement<{
                index: number;
                onClick: MouseEventHandler<HTMLButtonElement>;
                className?: string;
              }>;

              return cloneElement(childElement, {
                ...childElement.props,
                index,
              });
            })}
          </div>
        </div>
      </PortalPrimitive.Root>
    </DialogStackContext.Provider>
  );
};

export type DialogStackContentProps = HTMLAttributes<HTMLDivElement> & {
  index?: number;
  offset?: number;
};

export const DialogStackContent = ({
  children,
  className,
  index = 0,
  offset = 10,
  ...props
}: DialogStackContentProps) => {
  const context = useContext(DialogStackContext);

  if (!context) {
    throw new Error('DialogStackContent must be used within a DialogStack');
  }

  if (!context.isOpen) {
    return null;
  }

  const handleClick = () => {
    if (context.clickable && context.activeIndex > index) {
      context.setActiveIndex(index ?? 0);
    }
  };

  const distanceFromActive = index - context.activeIndex;
  const translateY =
    distanceFromActive < 0
      ? `-${Math.abs(distanceFromActive) * offset}px`
      : `${Math.abs(distanceFromActive) * offset}px`;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: "This is a clickable dialog"
    // biome-ignore lint/a11y/useKeyWithClickEvents: "This is a clickable dialog"
    <div
      className={cn(
        'card-base bg-background h-auto w-full p-6 shadow-lg transition-all duration-300',
        className
      )}
      onClick={handleClick}
      style={{
        top: 0,
        transform: `translateY(${translateY})`,
        width: `calc(100% - ${Math.abs(distanceFromActive) * 10}px)`,
        zIndex: 50 - Math.abs(context.activeIndex - (index ?? 0)),
        position: distanceFromActive ? 'absolute' : 'relative',
        opacity: distanceFromActive > 0 ? 0 : 1,
        cursor: context.clickable && context.activeIndex > index ? 'pointer' : 'default',
      }}
      {...(props as any)}
    >
      <div
        className={cn(
          'h-full w-full transition-all duration-300',
          context.activeIndex !== index && 'pointer-events-none opacity-0 select-none'
        )}
      >
        {children}
      </div>
    </div>
  );
};

export type DialogStackTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const DialogStackTitle = ({ children, className, ...props }: DialogStackTitleProps) => (
  <h2
    className={cn('text-lg leading-none font-semibold tracking-tight', className)}
    {...(props as any)}
  >
    {children}
  </h2>
);

export type DialogStackDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const DialogStackDescription = ({
  children,
  className,
  ...props
}: DialogStackDescriptionProps) => (
  <p className={cn('text-muted-foreground text-sm', className)} {...(props as any)}>
    {children}
  </p>
);

export type DialogStackHeaderProps = HTMLAttributes<HTMLDivElement>;

export const DialogStackHeader = ({ className, ...props }: DialogStackHeaderProps) => (
  <div
    className={cn('flex flex-col gap-1.5 text-center sm:text-left', className)} // 6px = gap-1.5
    {...(props as any)}
  />
);

export type DialogStackFooterProps = HTMLAttributes<HTMLDivElement>;

export const DialogStackFooter = ({ children, className, ...props }: DialogStackFooterProps) => (
  <div className={cn('flex items-center justify-end gap-2 pt-4', className)} {...(props as any)}>
    {children}
  </div>
);

export type DialogStackNextProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export const DialogStackNext = ({
  children,
  className,
  asChild,
  ...props
}: DialogStackNextProps) => {
  const context = useContext(DialogStackContext);

  if (!context) {
    throw new Error('DialogStackNext must be used within a DialogStack');
  }

  const handleNext = () => {
    if (context.activeIndex < context.totalDialogs - 1) {
      context.setActiveIndex(context.activeIndex + 1);
    }
  };

  // Compose onClick handlers
  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    handleNext();
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <Button
      asChild={asChild}
      className={className}
      disabled={context.activeIndex >= context.totalDialogs - 1}
      onClick={asChild ? undefined : handleClick}
      type="button"
      {...(props as any)}
    >
      {asChild ? children : <>{children || 'Next'}</>}
    </Button>
  );
};

export type DialogStackPreviousProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export const DialogStackPrevious = ({
  children,
  className,
  asChild,
  ...props
}: DialogStackPreviousProps) => {
  const context = useContext(DialogStackContext);

  if (!context) {
    throw new Error('DialogStackPrevious must be used within a DialogStack');
  }

  const handlePrevious = () => {
    if (context.activeIndex > 0) {
      context.setActiveIndex(context.activeIndex - 1);
    }
  };

  // Compose onClick handlers if asChild
  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    handlePrevious();
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <Button
      asChild={asChild}
      className={className}
      disabled={context.activeIndex <= 0}
      onClick={asChild ? undefined : handleClick}
      type="button"
      {...(props as any)}
    >
      {asChild ? (
        children
      ) : (
        <>
          {children || 'Previous'}
        </>
      )}
    </Button>
  );
};
