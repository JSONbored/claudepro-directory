'use client';

import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Github,
  Lightbulb,
  PlayCircle,
  Settings,
  Terminal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type {
  ActionButton,
  BaseDetailPageProps,
  CommandDetailPageProps,
} from '@/lib/schemas/component.schema';
import type { UnifiedContentItem } from '@/lib/schemas/components';
import { getDisplayTitle } from '@/lib/utils';
import { BaseDetailPage } from './base-detail-page';

// Helper functions for command-specific logic
const generateInstallationSteps = (item: UnifiedContentItem) => {
  return {
    claudeCode: {
      steps: [
        'Create the commands directory: mkdir -p .claude/commands',
        `Create the command file: .claude/commands/${item.slug}.md`,
        'Add the command configuration from below',
        'Restart Claude Code to reload commands',
      ],
      configFormat: 'Markdown with YAML frontmatter',
      configPath: {
        project: '.claude/commands/',
        user: '~/.claude/commands/',
      },
    },
    requirements: ['Claude Code CLI', 'Command-specific dependencies (see content below)'],
  };
};

const generateUseCases = (item: UnifiedContentItem): string[] => {
  // If manual use cases exist, prioritize them
  if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
    return [...item.useCases];
  }

  const generatedUseCases: string[] = [];
  const tags = item.tags;

  // Generate base use cases based on common command patterns
  const commandName = getDisplayTitle({
    title: item.title,
    name: item.name,
    slug: item.slug,
    category: item.category,
  });
  generatedUseCases.push(`Execute ${commandName} to automate repetitive tasks`);
  generatedUseCases.push(`Integrate ${commandName} into development workflows`);

  // Add tag-specific use cases
  const tagBasedUseCases: Record<string, string[]> = {
    debugging: ['Streamline debugging workflows', 'Automate error analysis and troubleshooting'],
    testing: ['Automated test generation and execution', 'Continuous testing in development'],
    documentation: [
      'Generate comprehensive project documentation',
      'Keep docs synchronized with code',
    ],
    git: ['Enhance version control workflows', 'Automate commit and branch management'],
    performance: ['Identify and resolve performance bottlenecks', 'Optimize code efficiency'],
    security: ['Automated security scanning and analysis', 'Continuous security monitoring'],
    refactoring: ['Improve code structure and maintainability', 'Apply coding best practices'],
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

  return generatedUseCases.slice(0, 4); // Limit to 4 use cases max
};

const generateFeatures = (item: UnifiedContentItem): string[] => {
  // If manual features exist, prioritize them
  if ('features' in item && Array.isArray(item.features) && item.features.length > 0) {
    return [...item.features];
  }

  const generatedFeatures: string[] = [];
  const tags = item.tags;

  // Generate base features based on command type
  const commandName = getDisplayTitle({
    title: item.title,
    name: item.name,
    slug: item.slug,
    category: item.category,
  });
  generatedFeatures.push(`${commandName} command execution with customizable parameters`);
  generatedFeatures.push('Seamless integration with Claude Code workflows');

  // Add tag-specific features
  const tagBasedFeatures: Record<string, string[]> = {
    debugging: [
      'Advanced error analysis and diagnosis',
      'Step-by-step troubleshooting guidance',
      'Automated fix suggestions',
    ],
    testing: [
      'Automated test case generation',
      'Comprehensive test coverage analysis',
      'Multiple testing framework support',
    ],
    documentation: [
      'Intelligent documentation generation',
      'API specification creation',
      'Interactive example generation',
    ],
    git: [
      'Smart commit message generation',
      'Branch management automation',
      'Conflict resolution assistance',
    ],
    performance: [
      'Performance bottleneck identification',
      'Optimization recommendations',
      'Resource usage monitoring',
    ],
    security: [
      'Vulnerability scanning and detection',
      'Security best practice enforcement',
      'Compliance checking',
    ],
    refactoring: [
      'Code structure analysis and improvement',
      'Design pattern application',
      'Legacy code modernization',
    ],
    review: [
      'Comprehensive code quality analysis',
      'Best practice enforcement',
      'Detailed improvement suggestions',
    ],
    explanation: [
      'Code behavior analysis and explanation',
      'Step-by-step code walkthrough',
      'Visual diagram generation',
    ],
  };

  // Add features based on tags
  tags.forEach((tag: string) => {
    const tagFeatures = tagBasedFeatures[tag.toLowerCase()];
    if (tagFeatures) {
      tagFeatures.forEach((feature) => {
        if (!generatedFeatures.includes(feature)) {
          generatedFeatures.push(feature);
        }
      });
    }
  });

  return generatedFeatures.slice(0, 6); // Limit to 6 features max
};

const generateRequirements = (item: UnifiedContentItem): string[] => {
  const baseRequirements = ['Claude Code CLI installed and configured'];
  const detectedRequirements: string[] = [];

  // Add command-specific requirements based on tags and content
  const tags = item.tags;
  tags.forEach((tag: string) => {
    switch (tag.toLowerCase()) {
      case 'git':
        if (!detectedRequirements.includes('Git version control system')) {
          detectedRequirements.push('Git version control system');
        }
        break;
      case 'testing':
        if (!detectedRequirements.includes('Testing framework (Jest, pytest, etc.)')) {
          detectedRequirements.push('Testing framework (Jest, pytest, etc.)');
        }
        break;
      case 'documentation':
        if (!detectedRequirements.includes('Project source code access')) {
          detectedRequirements.push('Project source code access');
        }
        break;
      case 'performance':
        if (!detectedRequirements.includes('Performance monitoring tools')) {
          detectedRequirements.push('Performance monitoring tools');
        }
        break;
      case 'security':
        if (!detectedRequirements.includes('Security scanning tools')) {
          detectedRequirements.push('Security scanning tools');
        }
        break;
    }
  });

  // Always add project access requirement
  if (!detectedRequirements.includes('Active development project')) {
    detectedRequirements.push('Active development project');
  }

  return [...baseRequirements, ...detectedRequirements];
};

const generateTroubleshooting = (
  item: UnifiedContentItem
): Array<{ issue: string; solution: string }> => {
  const generatedTroubleshooting: Array<{ issue: string; solution: string }> = [];
  const tags = item.tags;
  const commandName = getDisplayTitle({
    title: item.title,
    name: item.name,
    slug: item.slug,
    category: item.category,
  });

  // Common troubleshooting patterns based on command type
  const troubleshootingPatterns: Record<string, Array<{ issue: string; solution: string }>> = {
    git: [
      {
        issue: 'Git repository not found',
        solution: 'Ensure you are in a valid Git repository directory with .git folder',
      },
      {
        issue: 'Git permissions denied',
        solution: 'Check your Git credentials and repository access permissions',
      },
    ],
    testing: [
      {
        issue: 'Test framework not detected',
        solution: 'Install and configure a supported testing framework (Jest, pytest, etc.)',
      },
      {
        issue: 'No test files found',
        solution: 'Create test files in standard locations (tests/, __tests__, *.test.* patterns)',
      },
    ],
    documentation: [
      {
        issue: 'Source code not accessible',
        solution: 'Ensure the command has read access to your project source files',
      },
      {
        issue: 'Documentation format issues',
        solution: 'Check your project structure and ensure standard documentation formats',
      },
    ],
    debugging: [
      {
        issue: 'Debug information not available',
        solution: 'Enable debug mode and ensure error logs are accessible',
      },
      {
        issue: 'Stack trace analysis failed',
        solution: 'Provide complete error logs and stack traces for analysis',
      },
    ],
  };

  // Add base troubleshooting entries
  generatedTroubleshooting.push({
    issue: `${commandName} command not recognized`,
    solution:
      'Ensure Claude Code is properly installed and the command is configured in .claude/commands/',
  });

  generatedTroubleshooting.push({
    issue: 'Command execution timeout',
    solution:
      'Check your network connection and try again. For large projects, consider breaking down the task.',
  });

  // Add tag-specific troubleshooting
  tags.forEach((tag: string) => {
    const tagTroubleshooting = troubleshootingPatterns[tag.toLowerCase()];
    if (tagTroubleshooting) {
      tagTroubleshooting.forEach((trouble) => {
        if (!generatedTroubleshooting.some((t) => t.issue === trouble.issue)) {
          generatedTroubleshooting.push(trouble);
        }
      });
    }
  });

  return generatedTroubleshooting.slice(0, 5); // Limit to 5 troubleshooting entries
};

// Helper function to render Command sidebar with resources and details
const renderCommandSidebar = (
  item: UnifiedContentItem,
  relatedItems: UnifiedContentItem[],
  router: ReturnType<typeof useRouter>
): React.ReactNode => (
  <div className="space-y-6 sticky top-20 self-start">
    {/* Resources */}
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Always show GitHub link to the Command file in our repo */}
        <Button variant="outline" className="w-full justify-start" asChild>
          <a
            href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/commands/${item.slug}.json`}
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
      </CardContent>
    </Card>

    {/* Command Details */}
    <Card>
      <CardHeader>
        <CardTitle>Command Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category */}
        {item.category && (
          <div>
            <h4 className="font-medium mb-1">Category</h4>
            <Badge
              variant="default"
              className="text-xs font-medium bg-orange-500/20 text-orange-500 border-orange-500/30"
            >
              {item.category === 'commands' ? 'Command' : item.category}
            </Badge>
          </div>
        )}

        {/* Command Type */}
        {item.tags && item.tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-1">Command Type</h4>
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs capitalize">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {(() => {
          const requirements = generateRequirements(item);
          const dependencies = requirements.filter(
            (req) => !(req.includes('Claude Code') || req.includes('Active development'))
          );
          return (
            dependencies.length > 0 && (
              <div>
                <h4 className="font-medium mb-1">Dependencies</h4>
                <div className="flex flex-wrap gap-1">
                  {dependencies.slice(0, 2).map((dep: string) => (
                    <Badge key={dep} variant="outline" className="text-xs">
                      {dep.replace(' installed and configured', '').replace(' system', '')}
                    </Badge>
                  ))}
                  {dependencies.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{dependencies.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )
          );
        })()}

        {/* Platforms */}
        {(() => {
          const platforms = ['Claude Code CLI'];
          return (
            <div>
              <h4 className="font-medium mb-1">Platforms</h4>
              <div className="flex flex-wrap gap-1">
                {platforms.map((platform: string) => (
                  <Badge key={platform} variant="outline" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })()}

        {item.source && (
          <div>
            <h4 className="font-medium mb-1">Source</h4>
            <Badge variant="outline">{item.source}</Badge>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Related Commands */}
    {relatedItems.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Related Commands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {relatedItems.slice(0, 3).map((relatedItem) => (
            <Button
              key={relatedItem.slug}
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-left"
              onClick={() => router.push(`/commands/${relatedItem.slug}`)}
            >
              <div className="text-left w-full min-w-0">
                <div className="font-medium text-sm leading-tight mb-1">
                  {getDisplayTitle({
                    title: relatedItem.title,
                    name: relatedItem.name,
                    slug: relatedItem.slug,
                    category: relatedItem.category,
                  })}
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
);

export function CommandDetailPage({ item, relatedItems = [] }: CommandDetailPageProps) {
  const router = useRouter();
  // Use manual installation if provided, otherwise auto-generate
  const installation = item.installation || generateInstallationSteps(item);

  // Generate all sections (prioritizes manual over auto-generated)
  const features = generateFeatures(item);
  const requirements = generateRequirements(item);
  const troubleshooting = generateTroubleshooting(item);
  const useCases = generateUseCases(item);

  // Command-specific actions
  const handleCopyInstallation = async () => {
    const installText = JSON.stringify(installation, null, 2);
    const success = await copyToClipboard(installText, {
      component: 'command-detail-page',
      action: 'copy-installation',
    });

    if (success) {
      toast({
        title: 'Installation steps copied!',
        description: 'Installation instructions have been copied to your clipboard.',
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy installation steps to clipboard.',
      });
    }
  };

  // Create command-specific custom sections for BaseDetailPage
  const customSections: BaseDetailPageProps['customSections'] = [
    // Features Section
    ...(features.length > 0
      ? [
          {
            title: 'Features',
            icon: <Lightbulb className="h-5 w-5" />,
            content: (
              <div>
                <p className="text-muted-foreground mb-4">Key capabilities and functionality</p>
                <ul className="space-y-2">
                  {features.map((feature: string) => (
                    <li key={feature.slice(0, 50)} className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
            collapsible: false,
            defaultCollapsed: false,
          },
        ]
      : []),

    // Installation Section
    {
      title: 'Installation',
      icon: <Settings className="h-5 w-5" />,
      content: (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">Setup instructions and requirements</p>
            <Button size="sm" variant="outline" onClick={handleCopyInstallation}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Steps
            </Button>
          </div>
          {typeof installation === 'object' && installation.claudeCode && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Claude Code Setup</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {installation.claudeCode.steps.map((step: string) => (
                    <li key={step.slice(0, 50)} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              {installation.claudeCode.configPath && (
                <div>
                  <h4 className="font-medium mb-2">Configuration Paths</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(installation.claudeCode.configPath).map(([type, path]) => (
                      <div key={type} className="flex gap-2">
                        <Badge variant="outline" className="capitalize">
                          {type}
                        </Badge>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{String(path)}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {typeof installation === 'string' && (
            <div className="prose prose-sm max-w-none">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{installation}</code>
              </pre>
            </div>
          )}
        </div>
      ),
      collapsible: false,
      defaultCollapsed: false,
    },

    // Use Cases Section
    ...(useCases.length > 0
      ? [
          {
            title: 'Use Cases',
            icon: <PlayCircle className="h-5 w-5" />,
            content: (
              <div>
                <p className="text-muted-foreground mb-4">Common scenarios and applications</p>
                <ul className="space-y-2">
                  {useCases.map((useCase: string) => (
                    <li key={useCase.slice(0, 50)} className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
            collapsible: false,
            defaultCollapsed: false,
          },
        ]
      : []),

    // Requirements Section
    ...(requirements.length > 0
      ? [
          {
            title: 'Requirements',
            icon: <AlertTriangle className="h-5 w-5" />,
            content: (
              <div>
                <p className="text-muted-foreground mb-4">Prerequisites and dependencies</p>
                <ul className="space-y-2">
                  {requirements.map((requirement: string) => (
                    <li key={requirement.slice(0, 50)} className="flex items-start gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
            collapsible: false,
            defaultCollapsed: false,
          },
        ]
      : []),

    // Troubleshooting Section
    ...(troubleshooting.length > 0
      ? [
          {
            title: 'Troubleshooting',
            icon: <AlertTriangle className="h-5 w-5" />,
            content: (
              <div>
                <p className="text-muted-foreground mb-4">Common issues and solutions</p>
                <ul className="space-y-4">
                  {troubleshooting.map((trouble: { issue: string; solution: string }) => (
                    <li key={trouble.issue.slice(0, 50)} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{trouble.issue}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {trouble.solution}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ),
            collapsible: false,
            defaultCollapsed: false,
          },
        ]
      : []),
  ];

  // Command-specific secondary actions
  const baseActions: ActionButton[] = [
    // GitHub link to the command file in our repo
    {
      label: 'View on GitHub',
      icon: <Terminal className="h-4 w-4 mr-2" />,
      onClick: () => {
        window.open(
          `https://github.com/JSONbored/claudepro-directory/blob/main/content/commands/${item.slug}.json`,
          '_blank',
          'noopener,noreferrer'
        );
      },
    },
  ];

  // Add documentation action if available
  const documentationAction: ActionButton[] =
    'documentationUrl' in item && (item as { documentationUrl?: string }).documentationUrl
      ? [
          {
            label: 'Documentation',
            icon: <Terminal className="h-4 w-4 mr-2" />,
            onClick: () => {
              window.open(
                (item as { documentationUrl: string }).documentationUrl,
                '_blank',
                'noopener,noreferrer'
              );
            },
          },
        ]
      : [];

  const secondaryActions = [...baseActions, ...documentationAction] as ActionButton[];

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName="Command"
      customSections={customSections}
      secondaryActions={secondaryActions}
      customSidebar={renderCommandSidebar(item, relatedItems, router)}
    />
  );
}
