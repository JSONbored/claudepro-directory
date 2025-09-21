'use client';

import { AlertTriangle, Copy, Lightbulb, PlayCircle, Settings, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { getDisplayTitle } from '@/lib/utils';
import type { Command, CommandInstallation, ContentItem } from '@/types/content';
import { BaseDetailPage, type BaseDetailPageProps } from './base-detail-page';

interface CommandDetailPageProps {
  item: Command;
  relatedItems?: ContentItem[];
}

// Helper functions for command-specific logic
const generateInstallationSteps = (item: Command): CommandInstallation => {
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

const generateUseCases = (item: Command): string[] => {
  // If manual use cases exist, prioritize them
  if (item.useCases && item.useCases.length > 0) {
    return item.useCases;
  }

  const generatedUseCases: string[] = [];
  const tags = item.tags;

  // Generate base use cases based on common command patterns
  const commandName = getDisplayTitle(item);
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

const generateFeatures = (item: Command): string[] => {
  // If manual features exist, prioritize them
  if (item.features && item.features.length > 0) {
    return item.features;
  }

  const generatedFeatures: string[] = [];
  const tags = item.tags;

  // Generate base features based on command type
  const commandName = getDisplayTitle(item);
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

const generateRequirements = (item: Command): string[] => {
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

const generateTroubleshooting = (item: Command): Array<{ issue: string; solution: string }> => {
  const generatedTroubleshooting: Array<{ issue: string; solution: string }> = [];
  const tags = item.tags;
  const commandName = getDisplayTitle(item);

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

export function CommandDetailPage({ item, relatedItems = [] }: CommandDetailPageProps) {
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
        variant: 'destructive',
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
          {installation.claudeCode && (
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
        </div>
      ),
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
          },
        ]
      : []),
  ];

  // Command-specific secondary actions
  const secondaryActions: BaseDetailPageProps['secondaryActions'] = [
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
    // Documentation link if available
    ...(item.documentationUrl
      ? [
          {
            label: 'Documentation',
            icon: <Terminal className="h-4 w-4 mr-2" />,
            onClick: () => {
              window.open(item.documentationUrl, '_blank', 'noopener,noreferrer');
            },
          },
        ]
      : []),
  ];

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName="Command"
      customSections={customSections}
      secondaryActions={secondaryActions}
    />
  );
}
