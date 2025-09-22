'use client';

import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ExternalLink,
  Info,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// AI-Optimized FAQ Component with Schema.org markup
export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export function AIOptimizedFAQ({
  questions,
  title = 'Frequently Asked Questions',
  description,
}: {
  questions: FAQItem[];
  title?: string;
  description?: string;
}) {
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
        {questions.map((faq, index) => (
          <Card
            key={`faq-${faq.question.slice(0, 20)}-${index}`}
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

// AI-Optimized Comparison Table Component
export interface ComparisonItem {
  [key: string]: string | number | boolean | React.ReactNode;
}

export function ComparisonTable({
  data,
  headers,
  title,
  description,
  highlightColumn,
}: {
  data: ComparisonItem[];
  headers: string[];
  title?: string;
  description?: string;
  highlightColumn?: number;
}) {
  return (
    <section className="my-8">
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-lg">
        <table itemScope itemType="https://schema.org/Table" className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {headers.map((header, index) => (
                <th
                  key={`header-${header}`}
                  className={`px-4 py-3 text-left font-semibold border-b border-border ${
                    highlightColumn === index ? 'bg-primary/10' : ''
                  }`}
                  itemProp="name"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={`row-${rowIndex}-${Object.values(row)[0]}`}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                itemScope
                itemType="https://schema.org/TableRow"
              >
                {headers.map((header, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}-${header}`}
                    className={`px-4 py-3 ${
                      highlightColumn === colIndex ? 'bg-primary/5 font-medium' : ''
                    }`}
                    itemProp="text"
                  >
                    {typeof row[header] === 'boolean' ? (
                      <div className="flex items-center">
                        {row[header] ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                    ) : (
                      row[header]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// AI-Optimized Step-by-Step Guide Component
export interface GuideStep {
  title: string;
  description: string;
  code?: string;
  tip?: string;
  time?: string;
}

export function StepByStepGuide({
  steps,
  title = 'Step-by-Step Guide',
  description,
  totalTime,
}: {
  steps: GuideStep[];
  title?: string;
  description?: string;
  totalTime?: string;
}) {
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

      <div className="space-y-6">
        {steps.map((step, index) => (
          <Card
            key={`step-${step.title.slice(0, 20)}-${index}`}
            itemScope
            itemType="https://schema.org/HowToStep"
            className="border-l-4 border-primary/20 bg-card/50"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3" itemProp="name">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">{index + 1}</span>
                </div>
                {step.title}
                {step.time && (
                  <Badge variant="secondary" className="ml-auto">
                    {step.time}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-11">
              <div itemProp="text" className="text-muted-foreground mb-4 leading-relaxed">
                {step.description}
              </div>

              {step.code && (
                <div className="mb-4">
                  <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm font-mono text-zinc-300">
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {step.tip && (
                <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">{step.tip}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// AI-Optimized Feature Grid Component
export interface Feature {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  link?: string;
}

export function FeatureGrid({
  features,
  title = 'Key Features',
  description,
  columns = 2,
}: {
  features: Feature[];
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <section className="my-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
        {features.map((feature, index) => (
          <Card
            key={`feature-${feature.title.slice(0, 20)}-${index}`}
            itemScope
            itemType="https://schema.org/Thing"
            className="border border-border/50 bg-card/30 hover:bg-card/50 transition-colors h-full"
          >
            <CardHeader>
              <CardTitle className="flex items-start gap-3" itemProp="name">
                {feature.icon && (
                  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">{feature.icon}</div>
                )}
                <div className="flex-1">
                  {feature.title}
                  {feature.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p itemProp="description" className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              {feature.link && (
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href={feature.link}>
                    Learn More
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// AI-Optimized TL;DR Summary Component
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
              {keyPoints.map((point, index) => (
                <li
                  key={`point-${point.slice(0, 20)}-${index}`}
                  className="flex items-start gap-2 text-sm"
                >
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

// AI-Optimized Expert Quote Component
export function ExpertQuote({
  quote,
  author,
  title,
  company,
  image,
  rating,
}: {
  quote: string;
  author: string;
  title?: string;
  company?: string;
  image?: string;
  rating?: number;
}) {
  return (
    <Card
      itemScope
      itemType="https://schema.org/Review"
      className="my-8 bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20"
    >
      <CardContent className="pt-6">
        <blockquote
          itemProp="reviewBody"
          className="text-lg italic text-foreground mb-4 leading-relaxed"
        >
          "{quote}"
        </blockquote>

        <div className="flex items-center justify-between">
          <div itemScope itemType="https://schema.org/Person" className="flex items-center gap-3">
            {image && (
              <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                <Image
                  src={image}
                  alt={author}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  itemProp="image"
                />
              </div>
            )}
            <div>
              <div className="font-semibold" itemProp="name">
                {author}
              </div>
              {(title || company) && (
                <div className="text-sm text-muted-foreground">
                  {title && <span itemProp="jobTitle">{title}</span>}
                  {title && company && <span> at </span>}
                  {company && <span itemProp="worksFor">{company}</span>}
                </div>
              )}
            </div>
          </div>

          {rating && (
            <div itemScope itemType="https://schema.org/Rating" className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <Star
                  key={`star-${starValue}`}
                  className={`h-4 w-4 ${
                    starValue <= rating ? 'text-yellow-500 fill-current' : 'text-muted-foreground'
                  }`}
                />
              ))}
              <span className="sr-only" itemProp="ratingValue">
                {rating}
              </span>
              <span className="sr-only" itemProp="bestRating">
                5
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// AI-Optimized Related Resources Component
export interface RelatedResource {
  title: string;
  description: string;
  url: string;
  type: 'guide' | 'tutorial' | 'documentation' | 'example';
  external?: boolean;
}

export function RelatedResources({
  resources,
  title = 'Related Resources',
  description,
}: {
  resources: RelatedResource[];
  title?: string;
  description?: string;
}) {
  const typeIcons = {
    guide: <Users className="h-4 w-4" />,
    tutorial: <Zap className="h-4 w-4" />,
    documentation: <Info className="h-4 w-4" />,
    example: <CheckCircle className="h-4 w-4" />,
  };

  const typeColors = {
    guide: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    tutorial: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    documentation: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
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
        {resources.map((resource, index) => (
          <Card
            key={`resource-${resource.title.slice(0, 20)}-${index}`}
            itemScope
            itemType="https://schema.org/ListItem"
            className="border border-border/50 bg-card/30 hover:bg-card/50 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base leading-tight" itemProp="name">
                  {resource.title}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={`${typeColors[resource.type]} flex items-center gap-1 text-xs`}
                >
                  {typeIcons[resource.type]}
                  {resource.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-4 leading-relaxed" itemProp="description">
                {resource.description}
              </CardDescription>

              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                {resource.external ? (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" itemProp="url">
                    View Resource
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link href={resource.url} itemProp="url">
                    View Resource
                    <span>→</span>
                  </Link>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// InfoBox Component for highlighting important information
export interface InfoBoxProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: React.ReactNode;
}

export function InfoBox({ type = 'info', title, children }: InfoBoxProps) {
  const typeStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      titleColor: 'text-blue-900 dark:text-blue-100',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
      titleColor: 'text-yellow-900 dark:text-yellow-100',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
      titleColor: 'text-green-900 dark:text-green-100',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />,
      titleColor: 'text-red-900 dark:text-red-100',
    },
  };

  const style = typeStyles[type];

  return (
    <div className={`my-6 p-4 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="flex-1">
          {title && <h4 className={`font-semibold mb-2 ${style.titleColor}`}>{title}</h4>}
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

// QuickReference Component for displaying reference information
export interface QuickReferenceProps {
  title: string;
  description?: string;
  items: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  columns?: number;
}

export function QuickReference({ title, description, items, columns = 1 }: QuickReferenceProps) {
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
          {items.map((item) => (
            <div
              key={item.label}
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
