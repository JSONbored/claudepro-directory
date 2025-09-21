'use client';

import {
  AlertTriangle,
  Bot,
  Copy,
  ExternalLink,
  Github,
  Lightbulb,
  Settings,
  Thermometer,
} from 'lucide-react';
import { BaseDetailPage } from '@/components/base-detail-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { Agent, ContentItem } from '@/types/content';

interface AgentDetailPageProps {
  item: Agent;
  relatedItems?: ContentItem[];
}

export function AgentDetailPage({ item, relatedItems = [] }: AgentDetailPageProps) {
  // Auto-generate requirements based on agent configuration
  const generateRequirements = () => {
    const baseRequirements = ['Claude Code or Claude SDK'];
    const detectedRequirements: string[] = [];

    // Add agent-specific requirements based on configuration
    if (
      item.configuration?.tools &&
      Array.isArray(item.configuration.tools) &&
      item.configuration.tools.length > 0
    ) {
      detectedRequirements.push('Access to specified tools and functions');
    }

    if (item.configuration?.temperature || item.configuration?.maxTokens) {
      detectedRequirements.push('Claude API access with custom parameters');
    }

    return [...baseRequirements, ...detectedRequirements];
  };

  // Auto-generate installation steps based on agent metadata
  const generateInstallationSteps = () => {
    const agentFileName = `${item.slug}.md`;

    return {
      claudeCode: {
        steps: [
          'Create agent directory: mkdir -p .claude/agents (project-level) or ~/.claude/agents (user-level)',
          `Create agent file: ${agentFileName} in the agents directory`,
          'Use YAML frontmatter format with name, description, and optional tools',
          "Add your agent's system prompt as markdown content below the frontmatter",
          'Use /agents command in Claude Code to manage your subagents',
        ],
        configFormat: 'Markdown file with YAML frontmatter',
        configPath: {
          project: `.claude/agents/${agentFileName}`,
          user: `~/.claude/agents/${agentFileName}`,
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
    claudeCode?: {
      steps?: string[];
      configPath?: Record<string, string>;
    };
    requirements?: string[];
  } => {
    return typeof inst === 'object' && inst !== null;
  };

  const handleCopyConfig = async () => {
    const configText = JSON.stringify(item.configuration || {}, null, 2);

    const success = await copyToClipboard(configText, {
      component: 'agent-detail-page',
      action: 'copy-config',
    });

    if (success) {
      toast({
        title: 'Configuration copied!',
        description: 'Agent configuration has been copied to your clipboard.',
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy configuration to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleCopyInstallation = async () => {
    const installText = JSON.stringify(installation, null, 2);
    const success = await copyToClipboard(installText, {
      component: 'agent-detail-page',
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

  // Build custom sections for agent-specific content
  const customSections = [];

  // Features section
  if (item.features && item.features.length > 0) {
    customSections.push({
      title: 'Features',
      icon: <Lightbulb className="h-5 w-5" />,
      content: (
        <>
          <CardDescription className="mb-4">Key capabilities and functionality</CardDescription>
          <ul className="space-y-2">
            {item.features.map((feature: string) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    });
  }

  // Configuration section
  if (item.configuration) {
    customSections.push({
      title: 'Configuration',
      icon: <Settings className="h-5 w-5" />,
      content: (
        <>
          <div className="flex items-center justify-between mb-4">
            <CardDescription>Agent configuration and parameters</CardDescription>
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

  // Installation section
  const installationContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <CardDescription>Setup instructions and requirements</CardDescription>
        <Button size="sm" variant="outline" onClick={handleCopyInstallation}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Steps
        </Button>
      </div>
      {isValidInstallation(installation) && installation.claudeCode && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Claude Code Setup</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {installation.claudeCode.steps?.map((step: string) => (
                <li key={step} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
          {installation.claudeCode.configPath && (
            <div>
              <h4 className="font-medium mb-2">Configuration Paths</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(installation.claudeCode.configPath).map(([location, path]) => (
                  <div key={location} className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {location}
                    </Badge>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{String(path)}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  // Use cases section
  const useCases = item.useCases || [];
  const useCasesContent = useCases.length > 0 && (
    <>
      <CardDescription className="mb-4">Common scenarios and applications</CardDescription>
      <ul className="space-y-2">
        {useCases.map((useCase: string) => (
          <li key={useCase} className="flex items-start gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
            <span className="text-sm leading-relaxed">{useCase}</span>
          </li>
        ))}
      </ul>
    </>
  );

  // Requirements section
  if (
    isValidInstallation(installation) &&
    installation.requirements &&
    installation.requirements.length > 0
  ) {
    customSections.push({
      title: 'Requirements',
      icon: <AlertTriangle className="h-5 w-5" />,
      content: (
        <>
          <CardDescription className="mb-4">Prerequisites and dependencies</CardDescription>
          <ul className="space-y-2">
            {installation.requirements.map((requirement: string) => (
              <li key={requirement} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{requirement}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    });
  }

  // Secondary actions for agent-specific links
  const secondaryActions = [];

  // Always show GitHub link to the agent file in our repo
  secondaryActions.push({
    label: 'View on GitHub',
    icon: <Github className="h-4 w-4 mr-2" />,
    onClick: () =>
      window.open(
        `https://github.com/JSONbored/claudepro-directory/blob/main/content/agents/${item.slug}.json`,
        '_blank'
      ),
  });

  if (item.documentationUrl) {
    secondaryActions.push({
      label: 'Documentation',
      icon: <ExternalLink className="h-4 w-4 mr-2" />,
      onClick: () => window.open(item.documentationUrl, '_blank'),
    });
  }

  // Agent sidebar content for BaseDetailPage
  const agentSidebarContent = (
    <div className="space-y-6">
      {/* Agent Details */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          {item.category && (
            <div>
              <h4 className="font-medium mb-1">Category</h4>
              <Badge
                variant="default"
                className="text-xs font-medium bg-purple-500/20 text-purple-500 border-purple-500/30"
              >
                {item.category === 'agents' ? 'Agent' : item.category}
              </Badge>
            </div>
          )}

          {/* Temperature */}
          {item.configuration?.temperature && (
            <div>
              <h4 className="font-medium mb-1">Temperature</h4>
              <div className="flex items-center gap-2">
                <Thermometer className="h-3 w-3 text-orange-500" />
                <Badge
                  variant="outline"
                  className="text-xs font-medium bg-orange-500/10 text-orange-600 border-orange-500/30"
                >
                  {item.configuration.temperature}
                </Badge>
              </div>
            </div>
          )}

          {/* Max Tokens */}
          {item.configuration?.maxTokens && (
            <div>
              <h4 className="font-medium mb-1">Max Tokens</h4>
              <Badge variant="outline" className="font-mono text-xs">
                {item.configuration.maxTokens}
              </Badge>
            </div>
          )}

          {/* Tools */}
          {item.configuration?.tools &&
            Array.isArray(item.configuration.tools) &&
            item.configuration.tools.length > 0 && (
              <div>
                <h4 className="font-medium mb-1">Tools</h4>
                <div className="flex flex-wrap gap-1">
                  {item.configuration.tools.slice(0, 3).map((tool: string) => (
                    <Badge key={tool} variant="outline" className="font-mono text-xs">
                      {tool}
                    </Badge>
                  ))}
                  {item.configuration.tools.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.configuration.tools.length - 3} more
                    </Badge>
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
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName="Agent"
      primaryAction={{
        label: 'Deploy Agent',
        icon: <Bot className="h-4 w-4 mr-2" />,
        onClick: () => {
          toast({
            title: 'Agent Deployment',
            description: 'Copy the agent content and follow the installation instructions.',
          });
        },
      }}
      secondaryActions={secondaryActions}
      customSections={customSections}
      showInstallation={true}
      showUseCases={useCases.length > 0}
      installationContent={installationContent}
      useCasesContent={useCasesContent}
      customSidebar={agentSidebarContent}
    />
  );
}
