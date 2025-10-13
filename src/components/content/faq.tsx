import { headers } from 'next/headers';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { serializeJsonLd } from '@/src/lib/schemas/form.schema';
import { type FAQProps, faqPropsSchema } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * AIOptimizedFAQ - FAQ component optimized for AI citation and SEO
 * Used in 26+ MDX files across the codebase
 *
 * Generates proper JSON-LD FAQPage structured data with mainEntity array
 * per Schema.org specification. Removes microdata to prevent duplicate
 * FAQPage declarations that cause Google Search Console errors.
 */
export async function AIOptimizedFAQ(props: FAQProps) {
  const validated = faqPropsSchema.parse(props);
  const { questions, title, description } = validated;
  const validQuestions = questions;

  if (validQuestions.length === 0) {
    return null;
  }

  // Extract nonce from CSP header for script security
  const headersList = await headers();
  const cspHeader = headersList.get('content-security-policy');
  const nonce = cspHeader?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];

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

  // Generate unique ID based on title to prevent duplicates if component used multiple times
  const scriptId = `faq-structured-data-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <>
      {/* JSON-LD Structured Data - Single FAQPage declaration with mainEntity */}
      <Script
        id={scriptId}
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated Zod schemas
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(faqPageSchema),
        }}
        strategy="afterInteractive"
        nonce={nonce}
      />

      {/* Visual FAQ Component - No schema.org microdata attributes */}
      <section className="my-8 space-y-6">
        <div className={UI_CLASSES.MB_6}>
          <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`}>{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>

        <div className="space-y-4">
          {validQuestions.map((faq) => (
            <Card key={faq.question} className="border border-border bg-code/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle
                  className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} flex ${UI_CLASSES.ITEMS_START} gap-3`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 bg-primary/10 ${UI_CLASSES.ROUNDED_FULL} flex ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} mt-0.5`}
                  >
                    <span className={`text-primary text-sm ${UI_CLASSES.FONT_BOLD}`}>Q</span>
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
