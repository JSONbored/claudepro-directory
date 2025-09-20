'use client';

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Copy,
  ExternalLink,
  Github,
  Lightbulb,
  PlayCircle,
  Settings,
  Tag,
  Thermometer,
  Type,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { getDisplayTitle } from '@/lib/utils';
import type { ContentItem, Rule } from '@/types/content';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

interface RuleDetailPageProps {
  item: Rule;
  relatedItems?: ContentItem[];
}

export function RuleDetailPage({ item, relatedItems = [] }: RuleDetailPageProps) {
  const router = useRouter();
  const [_copied, setCopied] = useState(false);

  // Auto-generate use cases based on rule metadata and tags
  const generateUseCases = () => {
    const generatedUseCases: string[] = [];
    const tags = item.tags || [];

    // Add tag-specific use cases for rules/system prompts
    const tagBasedUseCases: Record<string, string[]> = {
      api: [
        'Design and review RESTful APIs and GraphQL schemas',
        'Provide guidance on API versioning and documentation',
      ],
      security: [
        'Conduct security reviews and vulnerability assessments',
        'Guide implementation of security best practices',
      ],
      database: [
        'Optimize database queries and schema design',
        'Provide guidance on database architecture decisions',
      ],
      frontend: [
        'Review frontend architecture and component design',
        'Optimize user interface and user experience patterns',
      ],
      backend: [
        'Design scalable backend architectures',
        'Review server-side code and microservices patterns',
      ],
      devops: [
        'Guide CI/CD pipeline implementation and optimization',
        'Provide infrastructure as code best practices',
      ],
      testing: [
        'Design comprehensive testing strategies',
        'Review test coverage and quality assurance practices',
      ],
      'code-review': [
        'Conduct thorough code reviews with constructive feedback',
        'Enforce coding standards and best practices',
      ],
    };

    // Add use cases based on tags
    tags.forEach((tag: string) => {
      const tagUseCases = tagBasedUseCases[tag.toLowerCase()];
      if (tagUseCases) {
        tagUseCases.forEach((useCase) => {
          if (!generatedUseCases.includes(useCase)) {
            generatedUseCases.push(useCase);
          }
        });
      }
    });

    // Ensure we have at least some generic use cases
    if (generatedUseCases.length === 0) {
      generatedUseCases.push('Provide expert guidance and code reviews');
      generatedUseCases.push('Enforce best practices and coding standards');
      generatedUseCases.push('Offer specialized domain expertise');
    }

    return generatedUseCases.slice(0, 5); // Limit to 5 use cases max
  };

  // Auto-generate requirements based on rule configuration
  const generateRequirements = () => {
    const baseRequirements = ['Claude Desktop or Claude Code'];
    const detectedRequirements: string[] = [];

    // Check configuration for specific requirements
    if (item.configuration?.temperature !== undefined) {
      detectedRequirements.push('Supports temperature configuration');
    }
    if (item.configuration?.maxTokens !== undefined) {
      detectedRequirements.push('Supports token limit configuration');
    }
    if (item.configuration?.systemPrompt) {
      detectedRequirements.push('Custom system prompt support');
    }

    return [...baseRequirements, ...detectedRequirements];
  };

  // Generate use cases (prioritizes manual over auto-generated)
  const useCases = generateUseCases();
  const requirements = generateRequirements();

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Rule Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested Claude rule could not be found.
          </p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Rule content has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy content to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyConfig = async () => {
    try {
      const configText = JSON.stringify(item.configuration || {}, null, 2);
      await navigator.clipboard.writeText(configText);
      toast({
        title: 'Configuration copied!',
        description: 'Rule configuration has been copied to your clipboard.',
      });
    } catch (_error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy configuration to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Modern back navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/rules')}
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Rules
            </Button>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-accent/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{getDisplayTitle(item)}</h1>
                <p className="text-lg text-muted-foreground">{item.description}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {item.author && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{item.author}</span>
                  {item.githubUsername && (
                    <a
                      href={`https://github.com/${item.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1"
                    >
                      <Github className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              {(item.dateAdded || item.createdAt) && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(item.dateAdded || item.createdAt || '')}</span>
                </div>
              )}
              {item.category && <Badge variant="secondary">{item.category}</Badge>}
              {item.source && <Badge variant="outline">{item.source}</Badge>}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {item.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rule Content Section */}
            {item.content && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      System Prompt
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={handleCopyContent}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Content
                    </Button>
                  </div>
                  <CardDescription>
                    The system prompt that defines Claude's behavior and expertise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
                    <CodeHighlight code={item.content} language="markdown" />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {/* Configuration Section */}
            {item.configuration && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configuration
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={handleCopyConfig}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Config
                    </Button>
                  </div>
                  <CardDescription>Rule configuration parameters and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
                    <CodeHighlight
                      code={JSON.stringify(item.configuration, null, 2)}
                      language="json"
                    />
                  </Suspense>
                </CardContent>
              </Card>
            )}

            {/* Use Cases Section */}
            {useCases && useCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Use Cases
                  </CardTitle>
                  <CardDescription>Common scenarios and applications for this rule</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCases.map((useCase: string, _index: number) => (
                      <li key={useCase.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements Section */}
            {requirements && requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Requirements
                  </CardTitle>
                  <CardDescription>Prerequisites and compatibility requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirements.map((requirement: string, _index: number) => (
                      <li key={requirement.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 sticky top-20 self-start">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Always show GitHub link to the rule file in our repo */}
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a
                    href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/rules/${item.slug}.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    View on GitHub
                  </a>
                </Button>
                {item.documentationUrl && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={item.documentationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                )}
                {item.githubUrl && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={item.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      Related Project
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Rule Details */}
            <Card>
              <CardHeader>
                <CardTitle>Rule Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category - first */}
                {item.category && (
                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <Badge
                      variant="default"
                      className="text-xs font-medium bg-blue-500/20 text-blue-500 border-blue-500/30"
                    >
                      {item.category === 'rules' ? 'System Prompt' : item.category}
                    </Badge>
                  </div>
                )}

                {/* Expertise Areas - second */}
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">Expertise Areas</h4>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 4).map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="text-xs font-medium bg-green-500/20 text-green-500 border-green-500/30"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Configuration Parameters - third */}
                {item.configuration && (
                  <div>
                    <h4 className="font-medium mb-1">Configuration</h4>
                    <div className="space-y-2">
                      {item.configuration.temperature !== undefined && (
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Temperature: {item.configuration.temperature}
                          </span>
                        </div>
                      )}
                      {item.configuration.maxTokens !== undefined && (
                        <div className="flex items-center gap-2">
                          <Type className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Max Tokens: {item.configuration.maxTokens}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {item.source && (
                  <div>
                    <h4 className="font-medium mb-1">Source</h4>
                    <Badge variant="outline">{item.source}</Badge>
                  </div>
                )}
                {item.dateAdded && (
                  <div>
                    <h4 className="font-medium mb-1">Date Added</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(item.dateAdded)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Rules */}
            {relatedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedItems.slice(0, 3).map((relatedItem) => (
                    <Button
                      key={relatedItem.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => router.push(`/rules/${relatedItem.slug}`)}
                    >
                      <div className="text-left w-full min-w-0">
                        <div className="font-medium text-sm leading-tight mb-1">
                          {getDisplayTitle(relatedItem)}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {/* Show primary tags */}
                          {relatedItem.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {relatedItem.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
