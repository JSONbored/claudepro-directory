import Script from 'next/script';
import { APP_CONFIG } from '@/lib/constants';
import type { FAQItem, FAQStructuredDataProps } from '@/lib/schemas/component.schema';
import { jsonLdSafeSchema } from '@/lib/schemas/form.schema';
import {
  type FAQPage,
  faqPageSchema,
  type HowTo,
  howToSchema,
} from '@/lib/schemas/structured-data.schema';

/**
 * Generate FAQ structured data for guides and help pages
 * Helps content appear in Google's "People also ask" sections
 */
export function FAQStructuredData({ title, description, faqs, pageUrl }: FAQStructuredDataProps) {
  if (!faqs || faqs.length === 0) return null;

  const baseUrl = APP_CONFIG.url;

  const faqSchema: FAQPage = faqPageSchema.parse({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: title,
    description: description,
    url: `${baseUrl}${pageUrl}`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });

  // Add HowTo schema if the title suggests it's a tutorial
  const schemas: Array<FAQPage | HowTo> = [faqSchema];

  if (title.toLowerCase().includes('how to') || title.toLowerCase().includes('guide')) {
    const howToSteps = faqs
      .filter(
        (faq) =>
          faq.question.toLowerCase().includes('step') || faq.question.toLowerCase().includes('how')
      )
      .map((faq, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: faq.question,
        text: faq.answer,
      }));

    if (howToSteps.length > 0) {
      const howTo: HowTo = howToSchema.parse({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: title,
        description: description,
        url: `${baseUrl}${pageUrl}`,
        step: howToSteps,
      });
      schemas.push(howTo);
    }
  }

  // Sanitize schemas through Zod to prevent XSS
  const safeSchemas = schemas.map((schema) => jsonLdSafeSchema.parse(schema));

  return (
    <>
      {safeSchemas.map((schema) => {
        const schemaId = schema['@type'] || 'schema';
        return (
          <Script
            key={`faq-structured-data-${schemaId}`}
            id={`faq-structured-data-${schemaId}`}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is sanitized via Zod schema
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema),
            }}
            strategy="afterInteractive"
          />
        );
      })}
    </>
  );
}

/**
 * Extract FAQ items from MDX content
 * Looks for common patterns like headers with questions or FAQ sections
 */
export function extractFAQsFromContent(content: string): FAQItem[] {
  const faqs: FAQItem[] = [];

  // Pattern 1: Look for "## Question" followed by answer paragraphs
  const questionPattern = /##\s+(.+\?)\s*\n\n?([\s\S]*?)(?=\n##|\n#|$)/g;
  let match: RegExpExecArray | null;

  match = questionPattern.exec(content);
  while (match !== null) {
    const questionText = match[1];
    const answerText = match[2];

    if (questionText && answerText) {
      const question = questionText.trim();
      const answer = answerText
        .trim()
        .replace(/\n+/g, ' ')
        .replace(/[#*`]/g, '') // Remove markdown formatting
        .slice(0, 500); // Limit answer length for structured data

      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
    match = questionPattern.exec(content);
  }

  // Pattern 2: Look for FAQ sections with bullet points
  const faqSectionPattern =
    /##\s*(?:FAQ|Frequently Asked Questions|Common Questions)([\s\S]*?)(?=\n#|$)/gi;
  const faqSection = faqSectionPattern.exec(content);

  if (faqSection?.[1]) {
    const faqContent = faqSection[1];
    // Look for Q: and A: patterns
    const qaPattern =
      /(?:Q:|Question:)\s*(.+?)(?:\n|$)[\s\S]*?(?:A:|Answer:)\s*(.+?)(?=(?:\n(?:Q:|Question:))|$)/gi;

    match = qaPattern.exec(faqContent);
    while (match !== null) {
      const questionText = match[1];
      const answerText = match[2];

      if (questionText && answerText) {
        const question = questionText.trim();
        const answer = answerText.trim().replace(/\n+/g, ' ').replace(/[#*`]/g, '').slice(0, 500);

        if (question && answer) {
          faqs.push({ question, answer });
        }
      }
      match = qaPattern.exec(faqContent);
    }
  }

  // Pattern 3: Look for troubleshooting sections
  const troubleshootingPattern =
    /##\s*(?:Troubleshooting|Common Issues|Problems)([\s\S]*?)(?=\n#|$)/gi;
  const troubleshootingSection = troubleshootingPattern.exec(content);

  if (troubleshootingSection?.[1]) {
    const troubleContent = troubleshootingSection[1];
    // Look for "Issue:" or bullet points describing problems
    const issuePattern =
      /(?:Issue:|Problem:|\*\s+)(.+?)(?:Solution:|Fix:|Resolution:|:)(.+?)(?=(?:\n(?:Issue:|Problem:|\*))|$)/gi;

    match = issuePattern.exec(troubleContent);
    while (match !== null) {
      const issueText = match[1];
      const solutionText = match[2];

      if (issueText && solutionText) {
        const issue = issueText.trim();
        const solution = solutionText
          .trim()
          .replace(/\n+/g, ' ')
          .replace(/[#*`]/g, '')
          .slice(0, 500);

        if (issue && solution) {
          faqs.push({
            question: `How do I fix: ${issue}?`,
            answer: solution,
          });
        }
      }
      match = issuePattern.exec(troubleContent);
    }
  }

  // Limit to 10 FAQs for optimal structured data
  return faqs.slice(0, 10);
}

/**
 * Generate FAQs from frontmatter if no content FAQs are found
 */
export function generateFAQsFromMetadata(
  title: string,
  description: string,
  keywords: string[]
): FAQItem[] {
  const faqs: FAQItem[] = [];

  // Generate common questions based on title
  if (title.toLowerCase().includes('how to')) {
    faqs.push({
      question: title.endsWith('?') ? title : `${title}?`,
      answer: description || 'Follow the guide above for detailed instructions.',
    });
  }

  if (title.toLowerCase().includes('vs') || title.toLowerCase().includes('comparison')) {
    const [item1, item2] = title.split(/\s+vs\.?\s+/i);
    if (item1 && item2) {
      faqs.push({
        question: `What's the difference between ${item1} and ${item2}?`,
        answer:
          description ||
          `This guide compares ${item1} and ${item2} to help you choose the right option.`,
      });
      faqs.push({
        question: `Which is better: ${item1} or ${item2}?`,
        answer:
          'The choice depends on your specific needs. Read the full comparison to understand the pros and cons of each option.',
      });
    }
  }

  // Generate keyword-based questions
  if (keywords && keywords.length > 0) {
    const primaryKeyword = keywords[0];
    faqs.push({
      question: `What is ${primaryKeyword}?`,
      answer: description || `Learn about ${primaryKeyword} in this comprehensive guide.`,
    });
  }

  return faqs;
}
