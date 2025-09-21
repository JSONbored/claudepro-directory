'use client';

import { BookOpen, Copy, Lightbulb, Settings } from 'lucide-react';
import { BaseDetailPage } from '@/components/base-detail-page';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { ContentItem, Rule } from '@/types/content';

interface RuleDetailPageProps {
  item: Rule;
  relatedItems?: ContentItem[];
}

export function RuleDetailPage({ item, relatedItems = [] }: RuleDetailPageProps) {
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
    tags.forEach((tag) => {
      const tagUseCases = tagBasedUseCases[tag];
      if (tagUseCases) {
        generatedUseCases.push(...tagUseCases);
      }
    });

    // Add fallback use cases if no tag-specific ones found
    if (generatedUseCases.length === 0) {
      generatedUseCases.push(
        'Improve code quality and consistency across projects',
        'Provide specialized guidance in your domain of expertise',
        'Ensure best practices are followed in development workflows'
      );
    }

    return generatedUseCases;
  };

  const handleCopyConfig = async () => {
    const configText = JSON.stringify(item.configuration || {}, null, 2);

    const success = await copyToClipboard(configText, {
      component: 'rule-detail-page',
      action: 'copy-config',
    });

    if (success) {
      toast({
        title: 'Configuration copied!',
        description: 'Rule configuration has been copied to your clipboard.',
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy configuration to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const useCases = generateUseCases();

  // Custom sections for rules
  const customSections = [
    {
      title: 'Use Cases',
      icon: <Lightbulb className="h-5 w-5" />,
      content: (
        <>
          <CardDescription className="mb-4">
            Here are some practical applications for this rule:
          </CardDescription>
          <ul className="space-y-2">
            {useCases.map((useCase) => (
              <li key={useCase} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{useCase}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
  ];

  // Add configuration section if available
  if (item.configuration) {
    customSections.push({
      title: 'Configuration',
      icon: <Settings className="h-5 w-5" />,
      content: (
        <>
          <div className="flex items-center justify-between mb-4">
            <CardDescription>Configuration settings for this rule.</CardDescription>
            <Button size="sm" variant="outline" onClick={handleCopyConfig}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
          </div>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(item.configuration, null, 2)}
          </pre>
        </>
      ),
    });
  }

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName="Rule"
      primaryAction={{
        label: 'Use Rule',
        icon: <BookOpen className="h-4 w-4 mr-2" />,
        onClick: () => {
          // This could trigger a modal or redirect to integration instructions
          toast({
            title: 'Rule Integration',
            description: 'Copy the rule content and add it to your Claude configuration.',
          });
        },
      }}
      customSections={customSections}
    />
  );
}
