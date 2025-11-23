'use client';

import { Star as StarIcon } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import type { KeyboardEvent, MouseEvent, ReactElement, ReactNode } from 'react';
import {
  Children,
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type RatingContextValue = {
  value: number;
  readOnly: boolean;
  hoverValue: number | null;
  focusedStar: number | null;
  handleValueChange: (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
    value: number
  ) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  setHoverValue: (value: number | null) => void;
  setFocusedStar: (value: number | null) => void;
};

const RatingContext = createContext<RatingContextValue | null>(null);

const useRating = () => {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error('useRating must be used within a Rating component');
  }
  return context;
};

export type RatingButtonProps = React.ComponentProps<typeof StarIcon> & {
  index?: number;
  icon?: ReactElement<React.ComponentProps<typeof StarIcon>>;
};

export const RatingButton = ({
  index: providedIndex,
  size = 20,
  className,
  icon = <StarIcon />,
}: RatingButtonProps) => {
  const {
    value,
    readOnly,
    hoverValue,
    focusedStar,
    handleValueChange,
    handleKeyDown,
    setHoverValue,
    setFocusedStar,
  } = useRating();

  const index = providedIndex ?? 0;
  const isActive = index < (hoverValue ?? focusedStar ?? value ?? 0);
  let tabIndex = -1;

  if (!readOnly) {
    tabIndex = value === index + 1 ? 0 : -1;
  }

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      handleValueChange(event, index + 1);
    },
    [handleValueChange, index]
  );

  const handleMouseEnter = useCallback(() => {
    if (!readOnly) {
      setHoverValue(index + 1);
    }
  }, [readOnly, setHoverValue, index]);

  const handleFocus = useCallback(() => {
    setFocusedStar(index + 1);
  }, [setFocusedStar, index]);

  const handleBlur = useCallback(() => {
    setFocusedStar(null);
  }, [setFocusedStar]);

  return (
    <button
      aria-label={`${index + 1} ${index + 1 === 1 ? 'star' : 'stars'}`}
      className={cn(
        'rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'p-0.5',
        readOnly && 'cursor-default',
        className
      )}
      disabled={readOnly}
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      tabIndex={tabIndex}
      type="button"
    >
      {cloneElement(icon, {
        size,
        className: cn(
          'transition-colors duration-200',
          isActive && 'fill-current',
          !readOnly && 'cursor-pointer'
        ),
        'aria-hidden': 'true',
      })}
    </button>
  );
};

export type RatingProps = {
  defaultValue?: number | undefined;
  value?: number | undefined;
  onChange?:
    | ((
        event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>,
        value: number
      ) => void)
    | undefined;
  onValueChange?: ((value: number) => void) | undefined;
  readOnly?: boolean | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: boolean | 'true' | 'false' | undefined;
  'aria-label'?: string | undefined;
};

export const Rating = ({
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  defaultValue = 0,
  onChange,
  readOnly = false,
  className,
  children,
  ...props
}: RatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [focusedStar, setFocusedStar] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build config for useControllableState conditionally to satisfy exactOptionalPropertyTypes
  const controllableConfig = {
    defaultProp: defaultValue,
    prop: controlledValue,
    ...(controlledOnValueChange ? { onChange: controlledOnValueChange } : {}),
  };
  const [value, onValueChange] = useControllableState(controllableConfig);

  const handleValueChange = useCallback(
    (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>, newValue: number) => {
      if (!readOnly) {
        onChange?.(event, newValue);
        onValueChange?.(newValue);
      }
    },
    [readOnly, onChange, onValueChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (readOnly) {
        return;
      }

      const total = Children.count(children);
      let newValue = focusedStar !== null ? focusedStar : (value ?? 0);

      switch (event.key) {
        case 'ArrowRight':
          if (event.shiftKey || event.metaKey) {
            newValue = total;
          } else {
            newValue = Math.min(total, newValue + 1);
          }
          break;
        case 'ArrowLeft':
          if (event.shiftKey || event.metaKey) {
            newValue = 1;
          } else {
            newValue = Math.max(1, newValue - 1);
          }
          break;
        default:
          return;
      }

      event.preventDefault();
      setFocusedStar(newValue);
      handleValueChange(event, newValue);
    },
    [focusedStar, value, children, readOnly, handleValueChange]
  );

  useEffect(() => {
    if (focusedStar !== null && containerRef.current) {
      const buttons = containerRef.current.querySelectorAll('button');
      buttons[focusedStar - 1]?.focus();
    }
  }, [focusedStar]);

  const contextValue: RatingContextValue = {
    value: value ?? 0,
    readOnly,
    hoverValue,
    focusedStar,
    handleValueChange,
    handleKeyDown,
    setHoverValue,
    setFocusedStar,
  };

  // Create descriptive aria-label with current rating
  const total = Children.count(children);
  const defaultAriaLabel = readOnly
    ? `Rating: ${value || 0} out of ${total} stars`
    : `Rate this item: ${value || 0} out of ${total} stars selected`;

  return (
    <RatingContext.Provider value={contextValue}>
      <div
        aria-label={props['aria-label'] || defaultAriaLabel}
        aria-describedby={props['aria-describedby']}
        aria-invalid={props['aria-invalid']}
        className={cn('inline-flex items-center gap-0.5', className)}
        onMouseLeave={() => setHoverValue(null)}
        ref={containerRef}
        role="radiogroup"
      >
        {Children.map(children, (child, index) => {
          if (!child) {
            return null;
          }

          return cloneElement(child as ReactElement<RatingButtonProps>, {
            index,
          });
        })}
      </div>
    </RatingContext.Provider>
  );
};
