'use client';

/**
 * Unified content box component (accordion, FAQ, infobox, callout)
 */

import Script from 'next/script';
import { useCallback, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/primitives/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  Zap,
} from '@/src/lib/icons';
import type {
  AccordionProps,
  CalloutProps,
  FAQProps,
  InfoBoxProps,
} from '@/src/lib/schemas/component.schema';
import {
  accordionPropsSchema,
  calloutPropsSchema,
  faqPropsSchema,
  infoBoxPropsSchema,
} from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { serializeJsonLd } from '@/src/lib/utils/jsonld.utils';

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

function AccordionBox(props: AccordionVariant) {
  const validated = accordionPropsSchema.parse(props);
  const { items, title, description, allowMultiple } = validated;
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
            itemScope
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
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} itemProp="name">
                  <span>{item.title}</span>
                  <div className="ml-4 flex-shrink-0">
                    {openItems.has(index) ? (
                      <ChevronUp
                        className="h-4 w-4 text-muted-foreground transition-transform"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        className="h-4 w-4 text-muted-foreground transition-transform"
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

function FAQBox(props: FAQVariant) {
  const validated = faqPropsSchema.parse(props);
  const { questions, title, description } = validated;
  const validQuestions = questions;

  if (validQuestions.length === 0) {
    return null;
  }

  // Generate FAQPage JSON-LD with proper mainEntity structure
  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage' as const,
    name: title,
    description: description || `Frequently asked questions about ${title}`,
    mainEntity: validQuestions.map((faq) => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: faq.answer,
      },
    })),
  };

  // Generate unique ID based on title to prevent duplicates
  const scriptId = `faq-structured-data-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <>
      {/* JSON-LD Structured Data - Arcjet CSP + Next.js Script handle nonce automatically */}
      <Script
        id={scriptId}
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated Zod schemas
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(faqPageSchema),
        }}
        strategy="afterInteractive"
      />

      {/* Visual FAQ Component - No schema.org microdata to avoid duplicate declarations */}
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
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
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
    </>
  );
}

function InfoBoxComponent(props: InfoBoxVariant) {
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
      className={cn('my-6 rounded-r-lg border-l-4 p-6', variantStyles[variant])}
    >
      {title && (
        <div className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2, 'mb-3')}>
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

function CalloutComponent(props: CalloutVariant) {
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
