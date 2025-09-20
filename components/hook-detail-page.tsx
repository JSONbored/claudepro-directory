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
  User,
  Webhook,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lazy, Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { slugToTitle } from '@/lib/utils';
import type { ContentItem, Hook } from '@/types/content';

// Lazy load CodeHighlight to split syntax-highlighter into its own chunk
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

interface HookDetailPageProps {
  item: Hook;
  relatedItems?: ContentItem[];
}

export function HookDetailPage({ item, relatedItems = [] }: HookDetailPageProps) {
  const router = useRouter();
  const [_copied, setCopied] = useState(false);

  // Auto-generate requirements based on script content analysis
  const generateRequirements = () => {
    const baseRequirements = ['Claude Desktop or Claude Code'];
    const scriptContent =
      typeof item.configuration?.scriptContent === 'string' ? item.configuration.scriptContent : '';
    const detectedRequirements: string[] = [];

    // Detect common tools and dependencies from script content
    const detections = [
      { pattern: /jq\s/, requirement: 'jq command-line tool for JSON parsing' },
      { pattern: /prettier\s|npx prettier/, requirement: 'Prettier code formatter' },
      { pattern: /black\s|python.*black/, requirement: 'Black Python formatter' },
      { pattern: /gofmt\s/, requirement: 'Go formatting tools (gofmt)' },
      { pattern: /rustfmt\s/, requirement: 'Rust formatting tools (rustfmt)' },
      { pattern: /ruff\s/, requirement: 'Ruff Python linter and formatter' },
      { pattern: /npm\s|npx\s/, requirement: 'Node.js and npm' },
      { pattern: /pip\s|python\s/, requirement: 'Python 3.x' },
      { pattern: /axe-core|puppeteer/, requirement: 'Node.js dependencies (axe-core, puppeteer)' },
      { pattern: /curl\s/, requirement: 'curl command-line tool' },
      { pattern: /git\s/, requirement: 'Git version control' },
      { pattern: /docker\s/, requirement: 'Docker container runtime' },
      { pattern: /kubectl\s/, requirement: 'Kubernetes CLI (kubectl)' },
      { pattern: /terraform\s/, requirement: 'Terraform CLI' },
      { pattern: /chmod\s/, requirement: 'Execute permissions on hook scripts' },
    ];

    // Check script content for patterns
    detections.forEach(({ pattern, requirement }) => {
      if (pattern.test(scriptContent) && !detectedRequirements.includes(requirement)) {
        detectedRequirements.push(requirement);
      }
    });

    // Add manual requirements if they exist, filtering out duplicates
    const manualRequirements = (item.requirements || []).filter(
      (req: string) =>
        !req.toLowerCase().includes('claude desktop') &&
        !req.toLowerCase().includes('claude code') &&
        !detectedRequirements.some(
          (detected) =>
            detected.toLowerCase().includes(req.toLowerCase()) ||
            req.toLowerCase().includes(detected.toLowerCase())
        )
    );

    return [...baseRequirements, ...detectedRequirements, ...manualRequirements];
  };

  // Auto-generate troubleshooting entries based on script content analysis
  const generateTroubleshooting = () => {
    const scriptContent =
      typeof item.configuration?.scriptContent === 'string' ? item.configuration.scriptContent : '';
    const generatedTroubleshooting: Array<{ issue: string; solution: string }> = [];

    // Common troubleshooting patterns based on detected tools
    const troubleshootingPatterns = [
      {
        pattern: /chmod\s/,
        issue: 'Script permission denied',
        solution: `Run chmod +x .claude/hooks/${item.slug}.sh to make script executable`,
      },
      {
        pattern: /jq\s/,
        issue: 'jq command not found',
        solution: 'Install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)',
      },
      {
        pattern: /prettier\s|npx prettier/,
        issue: 'Prettier not found in PATH',
        solution: 'Install Prettier: npm install -g prettier',
      },
      {
        pattern: /black\s|python.*black/,
        issue: 'Black formatter not found',
        solution: 'Install Black: pip install black',
      },
      {
        pattern: /gofmt\s/,
        issue: 'Go formatting tools not available',
        solution: 'Install Go development tools and ensure gofmt is in PATH',
      },
      {
        pattern: /rustfmt\s/,
        issue: 'Rust formatting tools not available',
        solution:
          "Install Rust toolchain: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
      },
      {
        pattern: /ruff\s/,
        issue: 'Ruff not found',
        solution: 'Install Ruff: pip install ruff',
      },
      {
        pattern: /npm\s|npx\s/,
        issue: 'Node.js or npm not found',
        solution: 'Install Node.js from https://nodejs.org/ or use nvm',
      },
      {
        pattern: /python\s/,
        issue: 'Python not found in PATH',
        solution: 'Install Python 3.x from https://python.org/ or use package manager',
      },
      {
        pattern: /git\s/,
        issue: 'Git command not available',
        solution: 'Install Git from https://git-scm.com/ or use package manager',
      },
      {
        pattern: /docker\s/,
        issue: 'Docker not running or not installed',
        solution: 'Install Docker Desktop and ensure Docker daemon is running',
      },
      {
        pattern: /curl\s/,
        issue: 'curl command not found',
        solution: 'Install curl: brew install curl (macOS) or apt-get install curl (Ubuntu)',
      },
      {
        pattern: /kubectl\s/,
        issue: 'kubectl not configured',
        solution: 'Install kubectl and configure cluster access: kubectl config view',
      },
      {
        pattern: /terraform\s/,
        issue: 'Terraform command not found',
        solution: 'Install Terraform from https://terraform.io/downloads',
      },
    ];

    // Generate troubleshooting entries based on script content
    troubleshootingPatterns.forEach(({ pattern, issue, solution }) => {
      if (pattern.test(scriptContent)) {
        generatedTroubleshooting.push({ issue, solution });
      }
    });

    // Add manual troubleshooting entries if they exist, avoiding duplicates
    const manualTroubleshooting = (item.troubleshooting || []).filter(
      (tip: string | { issue: string; solution: string }) => {
        const tipIssue = typeof tip === 'string' ? tip : tip.issue;
        return !generatedTroubleshooting.some(
          (generated) =>
            generated.issue.toLowerCase().includes(tipIssue.toLowerCase()) ||
            tipIssue.toLowerCase().includes(generated.issue.toLowerCase())
        );
      }
    );

    return [...generatedTroubleshooting, ...manualTroubleshooting];
  };

  // Auto-generate use cases based on hook metadata and tags
  const generateUseCases = () => {
    // If manual use cases exist, use them (they're usually more specific and valuable)
    if (item.useCases && item.useCases.length > 0) {
      return item.useCases;
    }

    const generatedUseCases: string[] = [];
    const tags = item.tags || [];
    const hookType = item.hookType;

    // Generate base use cases based on hook type
    if (hookType === 'PostToolUse') {
      generatedUseCases.push('Automate post-processing tasks after Claude modifies files');
      generatedUseCases.push('Maintain code quality and consistency across projects');
    } else if (hookType === 'PreToolUse') {
      generatedUseCases.push('Validate inputs before Claude processes files');
      generatedUseCases.push('Implement safety checks and permissions validation');
    }

    // Add tag-specific use cases
    const tagBasedUseCases: Record<string, string[]> = {
      formatting: [
        'Enforce consistent code style across team projects',
        'Reduce code review friction by handling formatting automatically',
      ],
      testing: ['Automated testing in CI/CD pipelines', 'Real-time feedback during development'],
      security: ['Continuous security monitoring', 'Automated vulnerability detection'],
      documentation: [
        'Keep documentation synchronized with code changes',
        'Generate comprehensive project documentation',
      ],
      git: ['Streamline version control workflows', 'Automate commit and branch management'],
      automation: ['Reduce manual development tasks', 'Improve development workflow efficiency'],
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
      generatedUseCases.push('Automate repetitive development tasks');
      generatedUseCases.push('Improve code quality and consistency');
      generatedUseCases.push('Streamline development workflows');
    }

    return generatedUseCases.slice(0, 5); // Limit to 5 use cases max
  };

  // Auto-generate installation steps based on hook metadata
  const generateInstallationSteps = () => {
    const fileExtension = item.hookType === 'PostToolUse' ? 'sh' : 'sh';
    const scriptName = `${item.slug}.${fileExtension}`;

    return {
      claudeDesktop: {
        steps: [
          'Create the hooks directory: mkdir -p .claude/hooks',
          `Create the script file: .claude/hooks/${scriptName}`,
          `Make the script executable: chmod +x .claude/hooks/${scriptName}`,
          'Add hook configuration to .claude.md file',
        ],
        configPath: {
          macOS: '~/.claude/config.json',
          windows: '%APPDATA%\\Claude\\config.json',
          linux: '~/.config/claude/config.json',
        },
      },
      requirements: generateRequirements(),
    };
  };

  // Use manual installation if provided, otherwise auto-generate
  const installation = item.installation || generateInstallationSteps();

  // Type guard for installation structure
  const isValidInstallation = (
    inst: unknown
  ): inst is {
    claudeDesktop?: {
      steps?: string[];
      configPath?: Record<string, string>;
    };
    requirements?: string[];
  } => {
    return typeof inst === 'object' && inst !== null;
  };

  // Use manual troubleshooting if provided, otherwise auto-generate
  const troubleshooting =
    item.troubleshooting && item.troubleshooting.length > 0
      ? item.troubleshooting
      : generateTroubleshooting();

  // Generate use cases (prioritizes manual over auto-generated)
  const useCases = generateUseCases();

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Hook Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested automation hook could not be found.
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

  const _handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Hook content has been copied to your clipboard.',
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

  // Dynamic script path replacement for display
  const getDisplayConfig = () => {
    if (!item.configuration?.hookConfig) return item.configuration;

    const config = JSON.parse(JSON.stringify(item.configuration)); // Deep clone
    const fileExtension = 'sh';
    const dynamicScriptPath = `./.claude/hooks/${item.slug}.${fileExtension}`;

    // Replace script paths in hookConfig
    if (config.hookConfig?.hooks) {
      Object.keys(config.hookConfig.hooks).forEach((hookType) => {
        if (config.hookConfig.hooks[hookType]?.script) {
          config.hookConfig.hooks[hookType].script = dynamicScriptPath;
        }
      });
    }

    return config;
  };

  const handleCopyConfig = async () => {
    try {
      const displayConfig = getDisplayConfig();
      const configText = JSON.stringify(displayConfig || {}, null, 2);
      await navigator.clipboard.writeText(configText);
      toast({
        title: 'Configuration copied!',
        description: 'Hook configuration has been copied to your clipboard.',
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
              onClick={() => router.push('/hooks')}
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Hooks
            </Button>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Webhook className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {item.title || item.name || slugToTitle(item.slug)}
                </h1>
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
            {item.features && item.features.length > 0 && (
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
                    {item.features.map((feature: string, _index: number) => (
                      <li key={feature.slice(0, 50)} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
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
                  <CardDescription>Hook configuration and script content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.configuration.hookConfig && (
                    <div>
                      <h4 className="font-medium mb-2">Hook Configuration</h4>
                      <Suspense
                        fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}
                      >
                        <CodeHighlight
                          code={JSON.stringify(getDisplayConfig().hookConfig, null, 2)}
                          language="json"
                        />
                      </Suspense>
                    </div>
                  )}
                  {item.configuration.scriptContent && (
                    <div>
                      <h4 className="font-medium mb-2">Script Content</h4>
                      <Suspense
                        fallback={<div className="animate-pulse bg-muted h-32 rounded-md" />}
                      >
                        <CodeHighlight
                          code={
                            typeof item.configuration?.scriptContent === 'string'
                              ? item.configuration.scriptContent
                              : ''
                          }
                          language="bash"
                        />
                      </Suspense>
                    </div>
                  )}
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
                {isValidInstallation(installation) && installation.claudeDesktop && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Claude Desktop Setup</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {installation.claudeDesktop.steps?.map((step: string, _index: number) => (
                          <li key={step.slice(0, 50)} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    {installation.claudeDesktop.configPath && (
                      <div>
                        <h4 className="font-medium mb-2">Configuration Paths</h4>
                        <div className="space-y-1 text-sm">
                          {Object.entries(installation.claudeDesktop.configPath).map(
                            ([os, path]) => (
                              <div key={os} className="flex gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {os}
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
            {useCases && useCases.length > 0 && (
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
            {isValidInstallation(installation) &&
              installation.requirements &&
              installation.requirements.length > 0 && (
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
                      {installation.requirements.map((requirement: string, _index: number) => (
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
            {troubleshooting && troubleshooting.length > 0 && (
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
                    {troubleshooting.map(
                      (tip: { issue: string; solution: string } | string, index: number) => (
                        <li
                          key={
                            typeof tip === 'string'
                              ? tip.slice(0, 50)
                              : tip.issue?.slice(0, 50) || `troubleshooting-${index}`
                          }
                          className="space-y-2"
                        >
                          {typeof tip === 'string' ? (
                            <div className="flex items-start gap-3">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                              <span className="text-sm leading-relaxed">{tip}</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                    {tip.issue}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{tip.solution}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    )}
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
                {/* Always show GitHub link to the hook file in our repo */}
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a
                    href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/hooks/${item.slug}.json`}
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

            {/* Hook Details */}
            <Card>
              <CardHeader>
                <CardTitle>Hook Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category - first */}
                {item.category && (
                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <Badge
                      variant="default"
                      className="text-xs font-medium bg-pink-500/20 text-pink-500 border-pink-500/30"
                    >
                      {item.category === 'hooks' ? 'Hook' : item.category}
                    </Badge>
                  </div>
                )}

                {/* Hook Type - second */}
                {item.hookType && (
                  <div>
                    <h4 className="font-medium mb-1">Hook Type</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant="default"
                        className={`text-xs font-medium ${
                          item.hookType === 'PreToolUse'
                            ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                            : 'bg-green-500/20 text-green-500 border-green-500/30'
                        }`}
                      >
                        {item.hookType}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Tool Matchers - third */}
                {(() => {
                  const hookTypeKey = item.hookType?.toLowerCase();
                  const matchers = (() => {
                    if (item.matchers) return item.matchers;
                    if (hookTypeKey && item.configuration?.hookConfig?.hooks) {
                      const hooks = item.configuration?.hookConfig?.hooks;
                      const hookConfig =
                        typeof hooks === 'object' && !Array.isArray(hooks)
                          ? (hooks as Record<string, unknown>)[hookTypeKey]
                          : undefined;
                      if (
                        hookConfig &&
                        typeof hookConfig === 'object' &&
                        !Array.isArray(hookConfig)
                      ) {
                        const config = hookConfig as Record<string, unknown>;
                        if (Array.isArray(config.matchers)) {
                          return config.matchers;
                        }
                      }
                    }
                    return [];
                  })();
                  return (
                    matchers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-1">Tool Matchers</h4>
                        <div className="flex flex-wrap gap-1">
                          {matchers.map((matcher: string, _index: number) => (
                            <Badge key={matcher} variant="outline" className="font-mono text-xs">
                              {matcher}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })()}

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

            {/* Related Hooks */}
            {relatedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Hooks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedItems.slice(0, 3).map((relatedItem) => (
                    <Button
                      key={relatedItem.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => router.push(`/hooks/${relatedItem.slug}`)}
                    >
                      <div className="text-left w-full min-w-0">
                        <div className="font-medium text-sm leading-tight mb-1">
                          {relatedItem.title || relatedItem.name}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {/* Show hook type if available */}
                          {relatedItem.configuration?.hookConfig?.hooks &&
                            Object.keys(relatedItem.configuration.hookConfig.hooks).map(
                              (hookType) => (
                                <Badge
                                  key={hookType}
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  {hookType}
                                </Badge>
                              )
                            )}
                          {/* Show primary tags */}
                          {relatedItem.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {/* Show matcher info if available */}
                          {(() => {
                            if (!relatedItem.configuration?.hookConfig?.hooks) return null;

                            const hookValues = Object.values(
                              relatedItem.configuration.hookConfig.hooks
                            );
                            for (const hookValue of hookValues) {
                              if (Array.isArray(hookValue)) {
                                for (const h of hookValue) {
                                  if (h && typeof h === 'object' && !Array.isArray(h)) {
                                    const hookObj = h as Record<string, unknown>;
                                    if (
                                      Array.isArray(hookObj.matchers) &&
                                      hookObj.matchers.length > 0
                                    ) {
                                      return (
                                        <span className="font-mono">
                                          {String(hookObj.matchers[0])}
                                        </span>
                                      );
                                    }
                                  }
                                }
                              } else if (hookValue && typeof hookValue === 'object') {
                                const hookObj = hookValue as Record<string, unknown>;
                                if (
                                  Array.isArray(hookObj.matchers) &&
                                  hookObj.matchers.length > 0
                                ) {
                                  return (
                                    <span className="font-mono">{String(hookObj.matchers[0])}</span>
                                  );
                                }
                              }
                            }
                            return null;
                          })()}
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
