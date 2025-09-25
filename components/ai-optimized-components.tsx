'use client';

/**
 * AI-Optimized Components for Claude Pro Directory Templates
 * Built for 2025 SEO standards, AI citation scoring, and perfect template integration
 * Supports: tutorials, use-cases, comparisons, troubleshooting, categories, collections, workflows
 */

import { BadgeDelta, Flex, Grid, Metric, Text, Card as TremorCard } from '@tremor/react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  ExternalLink,
  Info,
  Star,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// =============================================================================
// Core Template Components - Used across all template types
// =============================================================================

/**
 * TLDRSummary - Opening summary component for all templates
 * Schema: Article with abstract for AI citation
 */
export function TLDRSummary({
  content,
  keyPoints,
  title = 'TL;DR',
}: {
  content: string;
  keyPoints?: string[];
  title?: string;
}) {
  return (
    <Card
      itemScope
      itemType="https://schema.org/Article"
      className="my-8 border-l-4 border-primary bg-primary/5"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p itemProp="abstract" className="text-muted-foreground leading-relaxed mb-4">
          {content}
        </p>

        {keyPoints && keyPoints.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Key Takeaways:</h4>
            <ul className="space-y-1">
              {keyPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Callout - Alert-style component using shadcn/ui Alert
 * Perfect for templates with different alert types
 */
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'success' | 'error' | 'tip';
  title?: string;
  children: React.ReactNode;
}) {
  const variant = type === 'warning' || type === 'error' ? 'destructive' : 'default';

  return (
    <Alert variant={variant} className="my-6">
      <div className="flex items-start gap-3">
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

// =============================================================================
// Tutorial Template Components
// =============================================================================

/**
 * StepByStepGuide - Core component for tutorial templates
 * Schema: HowTo with structured steps for AI parsing
 */
export interface GuideStep {
  title: string;
  description: string;
  code?: string;
  tip?: string;
  time?: string;
}

export function StepByStepGuide({
  steps = [],
  title = 'Step-by-Step Guide',
  description,
  totalTime,
}: {
  steps?: GuideStep[];
  title?: string;
  description?: string;
  totalTime?: string;
}) {
  const validSteps = steps && Array.isArray(steps) ? steps : [];
  return (
    <section itemScope itemType="https://schema.org/HowTo" className="my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" itemProp="name">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mb-4" itemProp="description">
            {description}
          </p>
        )}
        {totalTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span itemProp="totalTime">Total time: {totalTime}</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {validSteps.map((step, index) => {
          const isLastStep = index === validSteps.length - 1;
          return (
            <div key={step.title} className="relative">
              {/* Connecting line */}
              {!isLastStep && (
                <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10"></div>
              )}

              <Card
                itemScope
                itemType="https://schema.org/HowToStep"
                className="border-2 border-primary/20 bg-gradient-to-br from-card via-card/80 to-transparent hover:shadow-2xl transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-4" itemProp="name">
                    <div className="relative">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-primary-foreground text-base font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20"></div>
                    </div>
                    <span className="text-xl font-bold">{step.title}</span>
                    {step.time && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-primary/10 text-primary border-primary/30"
                      >
                        ⏱ {step.time}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-14">
                  <div itemProp="text" className="text-base mb-6 leading-relaxed">
                    {step.description}
                  </div>

                  {step.code && (
                    <div className="mb-6">
                      <div className="rounded-xl overflow-hidden shadow-xl bg-black border border-accent/20">
                        <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-xs text-zinc-400 font-mono">
                            step-{index + 1}.sh
                          </span>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed bg-black">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {step.tip && (
                    <Callout type="tip" title="💡 Pro tip">
                      {step.tip}
                    </Callout>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// =============================================================================
// Multi-Template Components - Used across template types
// =============================================================================

/**
 * FeatureGrid - Used in tutorials, use-cases, categories, workflows
 * Schema: ItemList for structured feature presentation
 */
export interface Feature {
  title: string;
  description: string;
  badge?: string;
}

export function FeatureGrid({
  features = [],
  title = 'Key Features',
  description,
  columns = 2,
}: {
  features?: Feature[];
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
}) {
  const validFeatures = features && Array.isArray(features) ? features : [];
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  // Handle undefined or empty features array
  if (validFeatures.length === 0) {
    return null;
  }

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" itemProp="name">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground" itemProp="description">
            {description}
          </p>
        )}
      </div>

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
        {validFeatures.map((feature, index) => (
          <Card
            key={feature.title}
            itemScope
            itemType="https://schema.org/ListItem"
            className="relative border border-border/50 bg-gradient-to-br from-card/30 via-card/50 to-card/30 hover:from-card/50 hover:via-card/70 hover:to-card/50 transition-all duration-300 h-full group overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out forwards',
            }}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <CardHeader>
              <CardTitle className="flex items-start justify-between relative z-10" itemProp="name">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-semibold">
                  {feature.title}
                </span>
                {feature.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-gradient-to-r from-primary/20 to-primary/30 border-primary/30 shadow-sm"
                  >
                    {feature.badge}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p itemProp="description" className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * Tabs - Interactive content organization for comparisons, workflows
 * Schema: ItemList with accessible tab interface
 */
export interface TabItem {
  label: string;
  value: string;
  content: React.ReactNode;
}

export function Tabs({
  items = [],
  title,
  description,
  defaultValue,
}: {
  items?: TabItem[];
  title?: string;
  description?: string;
  defaultValue?: string;
}) {
  const validItems = items && Array.isArray(items) ? items : [];
  const [activeTab, setActiveTab] = React.useState(defaultValue || validItems[0]?.value || '');

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      {title && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2" itemProp="name">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl overflow-hidden shadow-xl bg-black border border-accent/20">
        {/* Tab header */}
        <div className="bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-1 p-1" role="tablist">
            {items.map((item, index) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`relative px-6 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                  activeTab === item.value
                    ? 'bg-black text-white shadow-lg border-t border-l border-r border-zinc-700 -mb-px z-10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                role="tab"
                aria-selected={activeTab === item.value}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeIn 0.3s ease-out forwards',
                }}
              >
                {activeTab === item.value && (
                  <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent rounded-t-lg pointer-events-none" />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="relative bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative z-10 p-6">
            {items.map((item) => (
              <div
                key={item.value}
                className={`${activeTab === item.value ? 'block animate-fadeIn' : 'hidden'}`}
                role="tabpanel"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <div itemProp="description" className="text-zinc-100">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Accordion - Collapsible content sections for categories, troubleshooting
 * Schema: FAQPage for optimal AI citation
 */
export interface AccordionItem {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({
  items = [],
  title,
  description,
  allowMultiple = false,
}: {
  items?: AccordionItem[];
  title?: string;
  description?: string;
  allowMultiple?: boolean;
}) {
  const validItems = items && Array.isArray(items) ? items : [];
  const [openItems, setOpenItems] = React.useState<Set<number>>(
    new Set(
      validItems.map((item, index) => (item.defaultOpen ? index : -1)).filter((i) => i !== -1)
    )
  );

  const toggleItem = (index: number) => {
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
  };

  return (
    <section itemScope itemType="https://schema.org/FAQPage" className="my-8">
      {title && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2" itemProp="name">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {validItems.map((item, index) => (
          <Card
            key={item.title}
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
              <CardHeader className="hover:bg-muted/30 transition-colors">
                <CardTitle className="flex items-center justify-between" itemProp="name">
                  <span>{item.title}</span>
                  <div className="ml-4 flex-shrink-0">
                    {openItems.has(index) ? (
                      <div className="w-4 h-4 text-muted-foreground">−</div>
                    ) : (
                      <div className="w-4 h-4 text-muted-foreground">+</div>
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
 * CodeGroup - Multi-language code examples for tutorials, workflows
 * Schema: SoftwareSourceCode for technical content
 */
export interface CodeExample {
  language: string;
  filename?: string;
  code: string;
}

export function CodeGroup({
  examples = [],
  title,
  description,
}: {
  examples?: CodeExample[];
  title?: string;
  description?: string;
}) {
  const validExamples = examples && Array.isArray(examples) ? examples : [];
  const [activeExample, setActiveExample] = React.useState(0);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (validExamples.length === 0) {
    return null;
  }

  return (
    <section itemScope itemType="https://schema.org/SoftwareSourceCode" className="my-10">
      {title && (
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2" itemProp="name">
            {title}
          </h3>
          {description && (
            <p className="text-base text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl overflow-hidden shadow-2xl bg-black border border-accent/20">
        {/* Terminal Header */}
        <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-zinc-400 font-mono">
              {validExamples[activeExample]?.filename || 'terminal'}
            </span>
          </div>
          <div className="w-16"></div>
        </div>

        {/* Tabs */}
        <div className="bg-zinc-900/50 border-b border-zinc-800">
          <div className="flex overflow-x-auto scrollbar-hide">
            {validExamples.map((example, index) => {
              const isActive = activeExample === index;
              return (
                <button
                  type="button"
                  key={example.language + (example.filename || '')}
                  onClick={() => setActiveExample(index)}
                  className={`
                    relative px-6 py-3 text-sm font-medium whitespace-nowrap
                    transition-all duration-200
                    ${
                      isActive
                        ? 'text-white bg-black border-t-2 border-accent'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{example.language}</span>
                    {example.filename && (
                      <span className="text-xs text-zinc-500">• {example.filename}</span>
                    )}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content */}
        <div className="relative bg-black">
          {validExamples.map((example, index) => (
            <div
              key={`${example.language}${example.filename || ''}-content`}
              className={activeExample === index ? 'block' : 'hidden'}
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  type="button"
                  onClick={() => handleCopy(example.code, index)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 rounded-md transition-all hover:scale-105"
                  aria-label="Copy code"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <pre
                className="p-6 overflow-x-auto text-sm leading-relaxed"
                itemProp="codeRepository"
              >
                <code
                  itemProp="programmingLanguage"
                  data-language={example.language}
                  className="text-zinc-300 font-mono"
                >
                  {example.code}
                </code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * AIOptimizedFAQ - FAQ component for all templates
 * Schema: FAQPage optimized for 2025 AI citation
 */
export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export function AIOptimizedFAQ({
  questions = [],
  title = 'Frequently Asked Questions',
  description,
}: {
  questions?: FAQItem[];
  title?: string;
  description?: string;
}) {
  const validQuestions = questions && Array.isArray(questions) ? questions : [];

  if (validQuestions.length === 0) {
    return null;
  }
  return (
    <section itemScope itemType="https://schema.org/FAQPage" className="my-8 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" itemProp="headline">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground" itemProp="description">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {validQuestions.map((faq) => (
          <Card
            key={faq.question}
            itemScope
            itemType="https://schema.org/Question"
            className="border border-border/50 bg-card/30"
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-start gap-3" itemProp="name">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-primary text-sm font-bold">Q</span>
                </div>
                {faq.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div itemScope itemType="https://schema.org/Answer" className="pl-9">
                <div itemProp="text" className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * RelatedResources - Cross-template resource linking
 * Schema: ItemList for related content discovery
 */
export interface RelatedResource {
  title: string;
  description: string;
  url: string;
  type: 'tutorial' | 'guide' | 'example';
}

export function RelatedResources({
  resources = [],
  title = 'Related Resources',
  description,
}: {
  resources?: RelatedResource[];
  title?: string;
  description?: string;
}) {
  const validResources = resources && Array.isArray(resources) ? resources : [];

  if (validResources.length === 0) {
    return null;
  }
  const typeColors = {
    tutorial: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    guide: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    example: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
  };

  return (
    <section itemScope itemType="https://schema.org/ItemList" className="my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" itemProp="name">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground" itemProp="description">
            {description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {validResources.map((resource) => (
          <Card
            key={resource.title}
            itemScope
            itemType="https://schema.org/ListItem"
            className="border border-border/50 bg-card/30 hover:bg-card/50 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base leading-tight" itemProp="name">
                  {resource.title}
                </CardTitle>
                <Badge variant="secondary" className={`${typeColors[resource.type]} text-xs`}>
                  {resource.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-4 leading-relaxed" itemProp="description">
                {resource.description}
              </CardDescription>

              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href={resource.url} itemProp="url">
                  View Resource
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * QuickReference - Reference tables for tutorials, workflows
 * Schema: Table for structured reference data
 */
export interface QuickReferenceItem {
  label: string;
  value: string;
  description?: string;
}

export function QuickReference({
  title,
  description,
  items = [],
  columns = 1,
}: {
  title: string;
  description?: string;
  items?: QuickReferenceItem[];
  columns?: 1 | 2;
}) {
  const validItems = items && Array.isArray(items) ? items : [];

  if (validItems.length === 0) {
    return null;
  }
  return (
    <Card
      itemScope
      itemType="https://schema.org/Table"
      className="my-8 border-l-4 border-accent bg-accent/5"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent-foreground" />
          {title}
        </CardTitle>
        {description && <CardDescription itemProp="description">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
          {items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              itemScope
              itemType="https://schema.org/PropertyValue"
              className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-3 bg-card/50 rounded-lg border"
            >
              <div className="sm:w-1/3">
                <dt itemProp="name" className="font-medium text-sm text-muted-foreground">
                  {item.label}
                </dt>
              </div>
              <div className="sm:w-2/3">
                <dd itemProp="value" className="font-semibold text-foreground mb-1">
                  {item.value}
                </dd>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ComparisonTable - Comparison component for comparison templates
 * Schema: Table with structured comparison data
 */
export interface ComparisonItem {
  feature: string;
  option1: string | boolean;
  option2: string | boolean;
  option3?: string | boolean;
  winner?: string;
}

export function ComparisonTable({
  title,
  description,
  headers = [],
  items = [],
}: {
  title?: string;
  description?: string;
  headers?: string[];
  items?: ComparisonItem[];
}) {
  const validHeaders = headers && Array.isArray(headers) ? headers : [];
  const validItems = items && Array.isArray(items) ? items : [];

  if (validHeaders.length === 0 || validItems.length === 0) {
    return null;
  }
  return (
    <Card className="my-8">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4 font-medium">Feature</th>
                {validHeaders.map((header) => (
                  <th key={header} className="text-left p-4 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.feature} className="border-b last:border-0">
                  <td className="p-4 font-medium">{item.feature}</td>
                  <td className="p-4">
                    {typeof item.option1 === 'boolean' ? (
                      item.option1 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      item.option1
                    )}
                  </td>
                  <td className="p-4">
                    {typeof item.option2 === 'boolean' ? (
                      item.option2 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      item.option2
                    )}
                  </td>
                  {item.option3 !== undefined && (
                    <td className="p-4">
                      {typeof item.option3 === 'boolean' ? (
                        item.option3 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        item.option3
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ExpertQuote - Expert opinion component for authority
 * Schema: Quotation with author attribution
 */
export function ExpertQuote({
  quote,
  author,
  role,
  company,
  imageUrl,
}: {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  imageUrl?: string;
}) {
  return (
    <blockquote
      itemScope
      itemType="https://schema.org/Quotation"
      className="my-8 border-l-4 border-primary bg-muted/30 p-6 rounded-r-lg"
    >
      <p itemProp="text" className="text-lg italic leading-relaxed mb-4">
        "{quote}"
      </p>
      <footer className="flex items-center gap-4">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={author}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        )}
        <div itemProp="author" itemScope itemType="https://schema.org/Person">
          <cite className="not-italic">
            <span itemProp="name" className="font-semibold text-foreground">
              {author}
            </span>
            {(role || company) && (
              <span className="text-muted-foreground">
                {role && <span itemProp="jobTitle">, {role}</span>}
                {company && (
                  <span itemProp="worksFor">
                    {role ? ' at ' : ', '}
                    {company}
                  </span>
                )}
              </span>
            )}
          </cite>
        </div>
      </footer>
    </blockquote>
  );
}

/**
 * MetricsDisplay - KPI metrics visualization using Tremor
 * Schema: Dataset with performance metrics
 */
export interface MetricData {
  label?: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  // Support old healthcare guide format
  metric?: string;
  before?: string;
  after?: string;
  improvement?: string;
}

export function MetricsDisplay({
  title,
  metrics = [],
  description,
}: {
  title?: string;
  metrics?: MetricData[];
  description?: string;
}) {
  const validMetrics = metrics && Array.isArray(metrics) ? metrics : [];

  return (
    <section itemScope itemType="https://schema.org/Dataset" className="my-12">
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <h3 className="text-xl font-semibold mb-3 text-foreground" itemProp="name">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
        {validMetrics.map((metric, index) => {
          // Support both new and old formats
          const metricLabel = metric.label || metric.metric || `Metric ${index + 1}`;
          const metricValue = metric.value || metric.improvement || metric.after || 'N/A';
          const metricChange = metric.change || (metric.before ? `From: ${metric.before}` : '');
          const deltaType =
            metric.trend === 'up' ? 'increase' : metric.trend === 'down' ? 'decrease' : 'unchanged';

          // Choose gradient based on trend
          const gradientClass =
            metric.trend === 'up'
              ? 'from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40'
              : metric.trend === 'down'
                ? 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40'
                : 'from-gray-500/10 to-slate-500/10 border-gray-500/20 hover:border-gray-500/40';

          return (
            <TremorCard
              key={`${metricLabel}-${metricValue}`}
              className={`bg-gradient-to-br ${gradientClass} border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {metricLabel}
              </Text>
              <Metric className="mt-2 text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {metricValue}
              </Metric>
              {metricChange && (
                <Flex className="mt-4 items-center">
                  <BadgeDelta deltaType={deltaType} className="font-semibold" />
                  <Text className="ml-2 text-sm font-medium">{metricChange}</Text>
                </Flex>
              )}
            </TremorCard>
          );
        })}
      </Grid>
    </section>
  );
}

/**
 * Checklist - Interactive checklist component for prerequisites, testing, security
 * Schema: ItemList with checkable items
 */
export interface ChecklistItem {
  task: string;
  description?: string;
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export function Checklist({
  title,
  items,
  description,
  type = 'prerequisites',
}: {
  title?: string;
  items: ChecklistItem[];
  description?: string;
  type?: 'prerequisites' | 'security' | 'testing';
}) {
  const validItems = items && Array.isArray(items) ? items : [];

  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(
    new Set(validItems.map((item, index) => (item.completed ? index : -1)).filter((i) => i !== -1))
  );

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (checkedItems.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const progress =
    validItems.length > 0 ? Math.round((checkedItems.size / validItems.length) * 100) : 0;

  const priorityColors = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-green-600 dark:text-green-400',
  };

  const typeIcons = {
    prerequisites: <BookOpen className="h-5 w-5" />,
    security: <AlertTriangle className="h-5 w-5" />,
    testing: <CheckCircle className="h-5 w-5" />,
  };

  return (
    <Card itemScope itemType="https://schema.org/ItemList" className="my-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {typeIcons[type]}
            {title || `${type.charAt(0).toUpperCase() + type.slice(1)} Checklist`}
          </CardTitle>
          <Badge variant={progress === 100 ? 'default' : 'secondary'}>{progress}% Complete</Badge>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="space-y-3">
          {validItems.map((item, index) => (
            <div
              key={`${item.task}-${index}`}
              itemScope
              itemType="https://schema.org/ListItem"
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className="flex-shrink-0 mt-0.5"
                aria-label={`Mark ${item.task} as ${checkedItems.has(index) ? 'incomplete' : 'complete'}`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    checkedItems.has(index)
                      ? 'bg-primary border-primary'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {checkedItems.has(index) && (
                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    itemProp="name"
                    className={`font-medium ${checkedItems.has(index) ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {item.task}
                  </span>
                  {item.priority && (
                    <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1" itemProp="description">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CaseStudy - Rich case study presentation component
 * Schema: Article with organization and results
 */
export interface CaseStudyMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down';
}

export function CaseStudy({
  company,
  industry,
  challenge,
  solution,
  results,
  metrics,
  testimonial,
  logo,
}: {
  company: string;
  industry?: string;
  challenge: string;
  solution: string;
  results: string;
  metrics?: CaseStudyMetric[];
  testimonial?: { quote: string; author: string; role?: string };
  logo?: string;
}) {
  return (
    <Card itemScope itemType="https://schema.org/Article" className="my-8 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl" itemProp="headline">
              {company} Case Study
            </CardTitle>
            {industry && (
              <Badge variant="outline" className="mt-2">
                {industry}
              </Badge>
            )}
          </div>
          {logo && (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold text-destructive mb-2">Challenge</h4>
          <p className="text-muted-foreground">{challenge}</p>
        </div>

        <div>
          <h4 className="font-semibold text-primary mb-2">Solution</h4>
          <p className="text-muted-foreground">{solution}</p>
        </div>

        <div>
          <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Results</h4>
          <p className="text-muted-foreground">{results}</p>
        </div>

        {metrics && Array.isArray(metrics) && metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  {metric.value}
                  {metric.trend && (
                    <span className={metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                      {metric.trend === 'up' ? '↑' : '↓'}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {testimonial && (
          <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-lg">
            <p className="italic text-muted-foreground mb-2">"{testimonial.quote}"</p>
            <footer className="text-sm">
              <cite className="not-italic font-semibold">{testimonial.author}</cite>
              {testimonial.role && (
                <span className="text-muted-foreground">, {testimonial.role}</span>
              )}
            </footer>
          </blockquote>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ErrorTable - Specialized error display table
 * Schema: Table with error information
 */
export interface ErrorItem {
  code: string;
  message: string;
  solution: string;
  severity: 'critical' | 'warning' | 'info';
}

export function ErrorTable({
  title = 'Common Errors & Solutions',
  errors,
  description,
}: {
  title?: string;
  errors: ErrorItem[];
  description?: string;
}) {
  const validErrors = errors && Array.isArray(errors) ? errors : [];

  const severityColors = {
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  };

  const severityIcons = {
    critical: <AlertTriangle className="h-4 w-4" />,
    warning: <Info className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left p-4 font-medium">Error Code</th>
                <th className="text-left p-4 font-medium">Severity</th>
                <th className="text-left p-4 font-medium">Message</th>
                <th className="text-left p-4 font-medium">Solution</th>
              </tr>
            </thead>
            <tbody>
              {validErrors.map((error, index) => (
                <tr
                  key={error.code}
                  className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className="p-4 font-mono text-sm">{error.code}</td>
                  <td className="p-4">
                    <Badge className={severityColors[error.severity]} variant="secondary">
                      <span className="flex items-center gap-1">
                        {severityIcons[error.severity]}
                        {error.severity}
                      </span>
                    </Badge>
                  </td>
                  <td className="p-4 text-sm">{error.message}</td>
                  <td className="p-4 text-sm text-muted-foreground">{error.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * DiagnosticFlow - Interactive diagnostic flowchart (simplified version)
 * Schema: HowTo with decision tree structure
 */
export interface DiagnosticStep {
  question: string;
  yesPath?: string;
  noPath?: string;
  solution?: string;
}

export function DiagnosticFlow({
  title = 'Diagnostic Flow',
  steps = [],
  description,
}: {
  title?: string;
  steps?: DiagnosticStep[];
  description?: string;
}) {
  const validSteps =
    steps && Array.isArray(steps) && steps.length > 0
      ? steps
      : [{ question: 'No diagnostic steps available', solution: 'Please check configuration' }];

  const [currentStep, setCurrentStep] = React.useState(0);
  const [path, setPath] = React.useState<string[]>([]);

  const handleAnswer = (answer: 'yes' | 'no') => {
    const step = validSteps[currentStep];
    if (!step) return;

    const newPath = [...path, `${step.question} - ${answer.toUpperCase()}`];
    setPath(newPath);

    const nextStepId = answer === 'yes' ? step.yesPath : step.noPath;
    if (nextStepId) {
      const nextIndex = validSteps.findIndex((s) => s.question === nextStepId);
      if (nextIndex !== -1) {
        setCurrentStep(nextIndex);
      }
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setPath([]);
  };

  const currentStepData = validSteps[currentStep];
  const isComplete = currentStepData?.solution !== undefined;

  return (
    <Card itemScope itemType="https://schema.org/HowTo" className="my-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {path.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Diagnostic Path:</p>
              <ol className="list-decimal list-inside space-y-1">
                {path.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              {!isComplete ? (
                <div className="space-y-4">
                  <p className="text-lg font-medium">{currentStepData?.question}</p>
                  <div className="flex gap-4">
                    <Button onClick={() => handleAnswer('yes')} variant="default">
                      Yes
                    </Button>
                    <Button onClick={() => handleAnswer('no')} variant="outline">
                      No
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Solution Found:</p>
                  </div>
                  <p className="text-muted-foreground">{currentStepData?.solution}</p>
                  <Button onClick={reset} variant="outline">
                    Start Over
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * InfoBox - Information highlight box
 * Schema: Note with structured information
 */
export function InfoBox({
  title,
  children,
  variant = 'default',
}: {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'important' | 'success' | 'warning';
}) {
  const variantStyles = {
    default: 'border-border bg-card',
    important: 'border-primary bg-primary/5',
    success: 'border-green-500 bg-green-500/5',
    warning: 'border-yellow-500 bg-yellow-500/5',
  };

  const iconMap = {
    default: <Info className="h-5 w-5" />,
    important: <Star className="h-5 w-5 text-primary" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  return (
    <div
      itemScope
      itemType="https://schema.org/Note"
      className={`my-6 border-l-4 rounded-r-lg p-6 ${variantStyles[variant]}`}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3">
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
