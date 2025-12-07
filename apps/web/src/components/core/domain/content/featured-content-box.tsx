'use client';

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from '@heyclaude/web-runtime/icons';
import {
  type AccordionProps,
  type CalloutProps,
  type FAQProps,
  type InfoBoxProps,
} from '@heyclaude/web-runtime/types/component.types';
import {
  cn,
  INFOBOX_COLORS,
  INFOBOX_ICON_COLORS,
  UI_CLASSES,
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { useCallback, useState } from 'react';

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
  | CalloutVariant
  | FAQVariant
  | InfoBoxVariant;

/**
 * Renders a unified content box and delegates rendering to a specific box component based on `props.contentType`.
 *
 * @param props - Variant props determining which content box to render (accordion, faq, infobox, or callout).
 * @returns A React element: an AccordionBox, FAQBox, InfoBoxComponent, or CalloutComponent corresponding to `props.contentType`.
 *
 * @see AccordionBox
 * @see FAQBox
 * @see InfoBoxComponent
 * @see CalloutComponent
 */
export function UnifiedContentBox(props: UnifiedContentBoxProps) {
  switch (props.contentType) {
    case 'accordion': {
      return <AccordionBox {...props} />;
    }
    case 'faq': {
      return <FAQBox {...props} />;
    }
    case 'infobox': {
      return <InfoBoxComponent {...props} />;
    }
    case 'callout': {
      return <CalloutComponent {...props} />;
    }
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = props;
      return _exhaustive;
    }
  }
}

/**
 * Renders an accessible accordion list of titled items with expandable answers.
 *
 * Renders each item as a collapsible card; items marked `defaultOpen` are initially expanded. Tapping an item's header toggles its open state; when `allowMultiple` is false, opening one item closes others.
 *
 * @param props.items - Array of accordion items; each item should include `title`, `content`, and optional `defaultOpen`.
 * @param props.title - Optional section title displayed above the accordion.
 * @param props.description - Optional descriptive text shown under the section title.
 * @param props.allowMultiple - If true, multiple items may be open simultaneously; otherwise only one item is open at a time.
 * @returns The rendered accordion section as a React element.
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
      {title ? (
        <div className="mb-6">
          <h3 className="mb-2 text-xl font-bold">{title}</h3>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      <div className="space-y-2">
        {validItems.map((item, index) => (
          <Card
            key={`accordion-item-${index}-${item.title}`}
            itemScope
            itemType="https://schema.org/Question"
            className="border-border border"
          >
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="w-full text-left"
              aria-expanded={openItems.has(index)}
            >
              <CardHeader className="hover:bg-muted/30 transition-colors">
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} itemProp="name">
                  <span>{item.title}</span>
                  <div className="ml-4 shrink-0">
                    {openItems.has(index) ? (
                      <ChevronUp
                        className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-transform`}
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-transform`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
            </button>

            {openItems.has(index) && (
              <CardContent className="pt-0" itemScope itemType="https://schema.org/Answer">
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
 * Renders an FAQ section composed of question/answer cards.
 *
 * Renders a titled section with an optional description and a Card per question.
 *
 * @param props - Component props
 * @param props.questions - Array of FAQ entries; each entry should have `question` and `answer`. If empty or undefined, nothing is rendered.
 * @param props.title - Optional section title displayed above the questions.
 * @param props.description - Optional section description displayed under the title.
 * @returns A React element containing the FAQ section, or `null` when there are no questions.
 *
 * @see UnifiedContentBox
 * @see AccordionBox
 * @see InfoBoxComponent
 * @see CalloutComponent
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
        <h2 className="mb-2 text-2xl font-bold">{title}</h2>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>

      <div className="space-y-4">
        {validQuestions.map((faq) => (
          <Card key={faq.question} className="border-border bg-code/50 border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-start gap-3 text-lg font-semibold">
                <div className="bg-primary/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <span className="text-primary text-sm font-bold">Q</span>
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
 * Renders a styled informational note box with an optional title, icon, and body content.
 *
 * @param props.title - Optional heading text shown to the left of a variant-specific icon.
 * @param props.children - Body content rendered inside the note and exposed as the schema.org `text`.
 * @param props.variant - Variant of the info box; one of `"info"`, `"warning"`, `"success"`, or `"error"`. Defaults to `"info"`.
 * @returns A JSX element containing a schema.org `Note` with variant-specific styling, icon, optional title, and the provided content.
 *
 * @see INFOBOX_COLORS
 */
function InfoBoxComponent(props: InfoBoxVariant) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, children, variant } = props;

  const currentVariant = variant || 'info';
  const variantKey = currentVariant.toUpperCase() as keyof typeof INFOBOX_COLORS;

  const iconMap: Record<'error' | 'info' | 'success' | 'warning', React.ReactElement> = {
    info: <Info className={cn(UI_CLASSES.ICON_MD, INFOBOX_ICON_COLORS.INFO)} />,
    warning: <AlertTriangle className={cn(UI_CLASSES.ICON_MD, INFOBOX_ICON_COLORS.WARNING)} />,
    success: <CheckCircle className={cn(UI_CLASSES.ICON_MD, INFOBOX_ICON_COLORS.SUCCESS)} />,
    error: <AlertTriangle className={cn(UI_CLASSES.ICON_MD, INFOBOX_ICON_COLORS.ERROR)} />,
  };

  return (
    <div
      itemScope
      itemType="https://schema.org/Note"
      className={cn('my-6 rounded-r-lg border-l-4 p-6', INFOBOX_COLORS[variantKey])}
    >
      {title ? (
        <div className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2, 'mb-3')}>
          {iconMap[currentVariant]}
          <h4 className="text-foreground font-semibold" itemProp="name">
            {title}
          </h4>
        </div>
      ) : null}
      <div itemProp="text" className="text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/**
 * Renders a contextual callout alert with an icon, optional title, and descriptive content.
 *
 * @param props.type - The callout style, which determines the icon shown (`info`, `warning`, `error`, `success`, or `tip`).
 * @param props.title - Optional heading text displayed above the callout content.
 * @param props.children - The content displayed as the callout description.
 * @returns A React element representing an Alert containing the chosen icon, optional title, and the provided children as the description.
 *
 * @see Alert
 * @see AlertTitle
 * @see AlertDescription
 * @see InfoBoxComponent
 */
function CalloutComponent(props: CalloutVariant) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { type, title, children } = props;

  return (
    <Alert className="my-6">
      <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
        {type === 'info' && <Info className={UI_CLASSES.ICON_SM} />}
        {type === 'warning' && <AlertTriangle className={UI_CLASSES.ICON_SM} />}
        {type === 'error' && <AlertTriangle className={UI_CLASSES.ICON_SM} />}
        {type === 'success' && <CheckCircle className={UI_CLASSES.ICON_SM} />}
        {type === 'tip' && <Zap className={UI_CLASSES.ICON_SM} />}
        <div className="flex-1">
          {title ? <AlertTitle>{title}</AlertTitle> : null}
          <AlertDescription className="mt-2">{children}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
}