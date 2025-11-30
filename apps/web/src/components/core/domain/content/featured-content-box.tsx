'use client';

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from '@heyclaude/web-runtime/icons';
import type {
  AccordionProps,
  CalloutProps,
  FAQProps,
  InfoBoxProps,
} from '@heyclaude/web-runtime/types/component.types';
import { between, cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import { cn, INFOBOX_COLORS, INFOBOX_ICON_COLORS } from '@heyclaude/web-runtime/ui';
import { useCallback, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

export type AccordionVariant = AccordionProps & {
  contentType: 'accordion';
};

export type FAQVariant = FAQProps & {
  contentType: 'faq';
};

export type InfoBoxVariant = InfoBoxProps & {
  contentType: 'infobox';
};

export type CalloutVariant = CalloutProps & {
  contentType: 'callout';
};

export type UnifiedContentBoxProps =
  | AccordionVariant
  | FAQVariant
  | InfoBoxVariant
  | CalloutVariant;

/**
 * Renders a content box by delegating to the variant component indicated by `props.contentType`.
 *
 * @param props - Props discriminated by `contentType` that provide the data and configuration for the chosen variant.
 * @returns The JSX element for the selected content box: AccordionBox, FAQBox, InfoBoxComponent, or CalloutComponent.
 * @see AccordionBox
 * @see FAQBox
 * @see InfoBoxComponent
 * @see CalloutComponent
 */
export function UnifiedContentBox(props: UnifiedContentBoxProps) {
  switch (props.contentType) {
    case 'accordion':
      return <AccordionBox {...props} />;
    case 'faq':
      return <FAQBox {...props} />;
    case 'infobox':
      return <InfoBoxComponent {...props} />;
    case 'callout':
      return <CalloutComponent {...props} />;
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = props;
      return _exhaustive;
    }
  }
}

/**
 * Render an accordion of expandable items with optional single- or multi-open behavior.
 *
 * Renders an accessible section containing a list of cards; each card can be expanded to reveal its answer/content.
 *
 * @param props - AccordionVariant props
 * @param props.items - Ordered list of accordion items. Each item should include `title`, `content`, and optional `defaultOpen` to pre-open that item.
 * @param props.title - Optional heading for the entire accordion section.
 * @param props.description - Optional descriptive text shown under the section heading.
 * @param props.allowMultiple - When true, multiple items may be open at once; when false, opening an item closes others.
 * @returns A React element representing the accordion UI.
 *
 * @see UnifiedContentBox
 * @see AccordionVariant
 */
function AccordionBox(props: AccordionVariant) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { items, title, description, allowMultiple } = props;
  const validItems = items;

  const [openItems, setOpenItems] = useState<Set<number>>(
    new Set(
      validItems.map((item, index) => (item.defaultOpen ? index : -1)).filter((i) => i !== -1)
    )
  );

  const toggleItem = useCallback(
    (index: number) => {
      const newOpenItems = new Set(openItems);
      if (openItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        if (!allowMultiple) {
          newOpenItems.clear();
        }
        newOpenItems.add(index);
      }
      setOpenItems(newOpenItems);
    },
    [allowMultiple, openItems]
  );

  return (
    <section className="my-8" aria-label={title || 'Accordion section'}>
      {title && (
        <div className="mb-6">
          <h3 className="mb-2 font-bold text-xl">{title}</h3>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="space-y-2">
        {validItems.map((item, index) => (
          <Card
            key={`accordion-item-${index}-${item.title}`}
            itemScope={true}
            itemType="https://schema.org/Question"
            className="border border-border"
          >
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="w-full text-left"
              aria-expanded={openItems.has(index)}
            >
              <CardHeader className="transition-colors hover:bg-muted/30">
                <CardTitle className={between.center} itemProp="name">
                  <span>{item.title}</span>
                  <div className="ml-4 shrink-0">
                    {openItems.has(index) ? (
                      <ChevronUp
                        className={`${iconSize.sm} text-muted-foreground transition-transform`}
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        className={`${iconSize.sm} text-muted-foreground transition-transform`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
            </button>

            {openItems.has(index) && (
              <CardContent className="pt-0" itemScope={true} itemType="https://schema.org/Answer">
                <div itemProp="text">{item.content}</div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * Render a list of frequently asked questions as styled cards.
 *
 * Renders a section containing an optional title and description followed by one card per FAQ entry.
 *
 * @param props - Component props
 * @param props.questions - Array of FAQ items with `question` and `answer` fields; if empty or undefined, the component renders `null`.
 * @param props.title - Optional heading displayed above the FAQ list.
 * @param props.description - Optional descriptive text displayed under the heading.
 * @returns A section element containing FAQ cards, or `null` when `questions` is empty.
 *
 * @see UnifiedContentBox
 * @see AccordionBox
 */
function FAQBox(props: FAQVariant) {
  const { questions, title, description } = props;
  const validQuestions = questions || [];

  if (validQuestions.length === 0) {
    return null;
  }

  return (
    <section className="my-8 space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 font-bold text-2xl">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="space-y-4">
        {validQuestions.map((faq) => (
          <Card key={faq.question} className="border border-border bg-code/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-start gap-3 font-semibold text-lg">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-bold text-primary text-sm">Q</span>
                </div>
                {faq.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pl-9">
                <div className="text-muted-foreground leading-relaxed">{faq.answer}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * Render an informational box with an icon, optional title, and content styled according to the variant.
 *
 * @param props - Component props
 * @param props.title - Optional heading text displayed alongside the variant icon
 * @param props.children - Content rendered inside the info box
 * @param props.variant - Visual variant key; one of `'info' | 'warning' | 'success' | 'error'`. Defaults to `'info'`
 * @returns A JSX element representing a schema.org `Note` with variant-specific colors and iconography
 *
 * @see UnifiedContentBox
 * @see INFOBOX_COLORS
 * @see InfoBoxVariant
 */
function InfoBoxComponent(props: InfoBoxVariant) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, children, variant } = props;

  const currentVariant = variant || 'info';
  const variantKey = currentVariant.toUpperCase() as keyof typeof INFOBOX_COLORS;

  const iconMap: Record<'info' | 'warning' | 'success' | 'error', React.ReactElement> = {
    info: <Info className={cn(iconSize.md, INFOBOX_ICON_COLORS.INFO)} />,
    warning: <AlertTriangle className={cn(iconSize.md, INFOBOX_ICON_COLORS.WARNING)} />,
    success: <CheckCircle className={cn(iconSize.md, INFOBOX_ICON_COLORS.SUCCESS)} />,
    error: <AlertTriangle className={cn(iconSize.md, INFOBOX_ICON_COLORS.ERROR)} />,
  };

  return (
    <div
      itemScope={true}
      itemType="https://schema.org/Note"
      className={cn('my-6 rounded-r-lg border-l-4 p-6', INFOBOX_COLORS[variantKey])}
    >
      {title && (
        <div className={cn(cluster.compact, 'mb-3')}>
          {iconMap[currentVariant]}
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

/**
 * Renders a styled callout alert with an icon, optional title, and descriptive content selected by `type`.
 *
 * @param props - Component props.
 * @param props.type - Callout variant that determines the icon and visual intent: 'info', 'warning', 'error', 'success', or 'tip'.
 * @param props.title - Optional heading shown above the callout content.
 * @param props.children - Content displayed inside the callout.
 * @returns The callout element configured for the provided `type`.
 * @see InfoBoxComponent
 * @see UnifiedContentBox
 */
function CalloutComponent(props: CalloutVariant) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { type, title, children } = props;

  return (
    <Alert className="my-6">
      <div className="flex items-start gap-3">
        {type === 'info' && <Info className={iconSize.sm} />}
        {type === 'warning' && <AlertTriangle className={iconSize.sm} />}
        {type === 'error' && <AlertTriangle className={iconSize.sm} />}
        {type === 'success' && <CheckCircle className={iconSize.sm} />}
        {type === 'tip' && <Zap className={iconSize.sm} />}
        <div className="flex-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription className="mt-2">{children}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
}