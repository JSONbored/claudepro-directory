'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Copy,
  ExternalLink,
  Github,
  Lightbulb,
  PlayCircle,
  Settings,
  Tag,
  Terminal,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { getDisplayTitle } from '@/lib/utils';
import type { Command, CommandInstallation, ContentItem } from '@/types/content';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

interface CommandDetailPageProps {
  item: Command;
  relatedItems?: ContentItem[];
}

export function CommandDetailPage({ item, relatedItems = [] }: CommandDetailPageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  // Auto-generate installation steps for Claude Code commands
  const generateInstallationSteps = (): CommandInstallation => {
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

  // Auto-generate use cases based on command content and tags
  const generateUseCases = (): string[] => {
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

  // Auto-generate features based on command content and tags
  const generateFeatures = (): string[] => {
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

  // Auto-generate requirements based on command content analysis
  const generateRequirements = (): string[] => {
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

  // Auto-generate troubleshooting based on command type and common issues
  const generateTroubleshooting = (): Array<{ issue: string; solution: string }> => {
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
          solution:
            'Create test files in standard locations (tests/, __tests__, *.test.* patterns)',
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

  // Use manual installation if provided, otherwise auto-generate
  const installation = item.installation || generateInstallationSteps();

  // Generate all sections (prioritizes manual over auto-generated)
  const features = generateFeatures();
  const requirements = generateRequirements();
  const troubleshooting = generateTroubleshooting();
  const useCases = generateUseCases();

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Command Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested command could not be found.</p>
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
        description: 'Command content has been copied to your clipboard.',
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
              onClick={() => router.push('/commands')}
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Commands
            </Button>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Terminal className="h-6 w-6 text-primary" />
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
            {/* Features Section */}
            {features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Features
                  </CardTitle>
                  <CardDescription>Key capabilities and functionality</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {features.map((feature: string) => (
                      <li key={feature.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Command Content Section */}
            {item.content && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      Command Content
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={handleCopyContent}>
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <CardDescription>Complete command configuration and prompt</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto rounded-md border">
                    <Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}>
                      <CodeHighlight code={item.content} language="markdown" />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Installation Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Installation
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const installText = JSON.stringify(installation, null, 2);
                      navigator.clipboard.writeText(installText);
                      toast({
                        title: 'Installation steps copied!',
                        description:
                          'Installation instructions have been copied to your clipboard.',
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Steps
                  </Button>
                </div>
                <CardDescription>Setup instructions and requirements</CardDescription>
              </CardHeader>
              <CardContent>
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
                          {Object.entries(installation.claudeCode.configPath).map(
                            ([type, path]) => (
                              <div key={type} className="flex gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {type}
                                </Badge>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {String(path)}
                                </code>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Use Cases Section */}
            {useCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Use Cases
                  </CardTitle>
                  <CardDescription>Common scenarios and applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCases.map((useCase: string) => (
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
            {requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Requirements
                  </CardTitle>
                  <CardDescription>Prerequisites and dependencies</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirements.map((requirement: string) => (
                      <li key={requirement.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Troubleshooting Section */}
            {troubleshooting.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Troubleshooting
                  </CardTitle>
                  <CardDescription>Common issues and solutions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {troubleshooting.map((trouble: { issue: string; solution: string }) => (
                      <li key={trouble.issue.slice(0, 50)} className="space-y-2">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">{trouble.issue}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {trouble.solution}
                              </p>
                            </div>
                          </div>
                        </div>
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
                {/* Always show GitHub link to the command file in our repo */}
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

            {/* Related Commands */}
            {relatedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Commands</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedItems.slice(0, 3).map((relatedItem) => (
                    <Button
                      key={relatedItem.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => router.push(`/commands/${relatedItem.slug}`)}
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
