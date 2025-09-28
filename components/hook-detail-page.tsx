'use client';

import { AlertTriangle, Copy, ExternalLink, Github, Lightbulb, Webhook } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { BaseDetailPage } from '@/components/base-detail-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { hookContentSchema } from '@/lib/schemas/content.schema';
import { getDisplayTitle } from '@/lib/utils';
import { ConfigDisplay } from './hook-detail-page/config-display';
import {
  generateInstallationSteps,
  generateTroubleshooting,
  generateUseCases,
} from './hook-detail-page/helpers';
import {
  HookDetailsSection,
  InstallationSteps,
  RequirementsSection,
  TroubleshootingSection,
  UseCasesSection,
} from './hook-detail-page/sections';

// Use Zod schema types consistently
type HookContent = z.infer<typeof hookContentSchema>;

// Zod schema for component props
const hookDetailPagePropsSchema = z.object({
  item: hookContentSchema,
  relatedItems: z.array(hookContentSchema).optional(),
});

type HookDetailPageProps = z.infer<typeof hookDetailPagePropsSchema>;

// Type guard for installation - moved outside component to avoid re-creation
type InstallationType = HookContent['installation'];
const isValidInstallation = (
  inst: InstallationType
): inst is NonNullable<InstallationType> & {
  claudeDesktop?: {
    steps?: string[];
    configPath?: Record<string, string>;
  };
  requirements?: string[];
} => typeof inst === 'object' && inst !== null && !Array.isArray(inst);

// Optimized helper with memoization
const getDisplayConfig = (item: HookContent): HookContent['configuration'] => {
  if (!item.configuration?.hookConfig) return item.configuration;
  const config = structuredClone(item.configuration);
  const dynamicScriptPath = `./.claude/hooks/${item.slug}.sh`;
  if (config.hookConfig?.hooks) {
    Object.values(config.hookConfig.hooks).forEach((hook) => {
      if (typeof hook === 'object' && hook !== null && 'script' in hook) {
        (hook as { script: string }).script = dynamicScriptPath;
      }
    });
  }
  return config;
};

// Consolidated copy handler
const handleCopy = async (
  content: HookContent['configuration'] | HookContent['installation'],
  type: 'config' | 'installation'
) => {
  const text = JSON.stringify(content || {}, null, 2);
  const success = await copyToClipboard(text, {
    component: 'hook-detail-page',
    action: `copy-${type}`,
  });
  toast({
    title: success
      ? `${type === 'config' ? 'Configuration' : 'Installation steps'} copied!`
      : 'Copy failed',
    description: success
      ? `${type === 'config' ? 'Hook configuration' : 'Installation instructions'} has been copied to your clipboard.`
      : 'Unable to copy to clipboard.',
  });
};

// Memoized sidebar renderer
const renderHookSidebar = (
  item: HookContent,
  relatedItems: HookContent[],
  router: ReturnType<typeof useRouter>
): ReactNode => (
  <div className="space-y-6 sticky top-20 self-start">
    {/* Resources */}
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Always show GitHub link to the Hook file in our repo */}
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

    {/* Hook Details - Use shared component */}
    <Card>
      <CardHeader>
        <CardTitle>Hook Details</CardTitle>
      </CardHeader>
      <CardContent>
        <HookDetailsSection item={item} />
        {/* Execution Context */}
        {item.configuration && (
          <div className="mt-4">
            <h4 className="font-medium mb-1">Execution Context</h4>
            <Badge variant="outline" className="text-xs">
              {item.configuration.hookConfig ? 'Claude Desktop' : 'Script-based'}
            </Badge>
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
              key={relatedItem.slug}
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-left"
              onClick={() => router.push(`/hooks/${relatedItem.slug}`)}
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
);

export function HookDetailPage({ item, relatedItems = [] }: HookDetailPageProps) {
  const router = useRouter();

  // Memoize all generated data
  const { installation, troubleshooting, useCases, displayConfig } = useMemo(
    () => ({
      installation: item.installation || generateInstallationSteps(item),
      troubleshooting: item.troubleshooting?.length
        ? item.troubleshooting
        : generateTroubleshooting(item),
      useCases: generateUseCases(item),
      displayConfig: getDisplayConfig(item),
    }),
    [item]
  );

  // Reusable list component
  const List = useCallback(
    ({ items, dotColor = 'primary' }: { items: string[]; dotColor?: string }) => (
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.slice(0, 50)} className="flex items-start gap-3">
            <div className={`h-1.5 w-1.5 rounded-full bg-${dotColor} mt-2 flex-shrink-0`} />
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    ),
    []
  );

  const handleCopyConfig = useCallback(() => {
    handleCopy(displayConfig, 'config');
  }, [displayConfig]);

  const createConfigurationContent = useCallback(
    () => <ConfigDisplay item={item} displayConfig={displayConfig} onCopy={handleCopyConfig} />,
    [item, displayConfig, handleCopyConfig]
  );

  const createInstallationContent = useCallback(() => {
    if (Array.isArray(installation)) return <InstallationSteps steps={installation} />;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium">Installation Instructions</h4>
            <p className="text-sm text-muted-foreground">Setup steps and requirements</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(installation, 'installation')}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Steps
          </Button>
        </div>
        {isValidInstallation(installation) && installation.claudeCode && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Claude Code Setup</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {installation.claudeCode?.steps?.map((step: string) => (
                  <li key={step.slice(0, 50)} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            {installation.claudeCode?.configPath && (
              <div>
                <h4 className="font-medium mb-2">Configuration Paths</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(installation.claudeCode.configPath).map(([os, path]) => (
                    <div key={os} className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {os}
                      </Badge>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{String(path)}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {isValidInstallation(installation) &&
          installation.requirements &&
          installation.requirements.length > 0 && (
            <RequirementsSection requirements={[...(installation.requirements || [])]} />
          )}
      </div>
    );
  }, [installation]);

  const createUseCasesContent = useCallback(
    () => <UseCasesSection useCases={[...useCases]} />,
    [useCases]
  );

  const createTroubleshootingContent = useCallback(
    () => <TroubleshootingSection troubleshooting={[...troubleshooting]} />,
    [troubleshooting]
  );

  const createHookDetailsContent = useCallback(() => <HookDetailsSection item={item} />, [item]);

  // Optimized sections with conditional rendering
  const customSections = useMemo(
    () => [
      ...(item.features?.length
        ? [
            {
              title: 'Features',
              icon: <Lightbulb className="h-5 w-5" />,
              content: (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Key capabilities and functionality
                  </p>
                  <List items={[...(item.features || [])]} />
                </div>
              ),
              collapsible: false,
              defaultCollapsed: false,
            },
          ]
        : []),
      {
        title: 'Hook Details',
        icon: <Webhook className="h-5 w-5" />,
        content: createHookDetailsContent(),
        collapsible: false,
        defaultCollapsed: false,
      },
      ...(troubleshooting?.length
        ? [
            {
              title: 'Troubleshooting',
              icon: <AlertTriangle className="h-5 w-5" />,
              content: (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Common issues and solutions</p>
                  {createTroubleshootingContent()}
                </div>
              ),
              collapsible: false,
              defaultCollapsed: false,
            },
          ]
        : []),
    ],
    [item.features, createHookDetailsContent, troubleshooting, createTroubleshootingContent, List]
  );

  return (
    <BaseDetailPage
      item={item}
      relatedItems={relatedItems}
      typeName="Hook"
      primaryAction={{
        label: 'View on GitHub',
        icon: <Webhook className="h-4 w-4 mr-2" />,
        onClick: () =>
          window.open(
            `https://github.com/JSONbored/claudepro-directory/blob/main/content/hooks/${item.slug}.json`,
            '_blank'
          ),
      }}
      customSections={customSections}
      showConfiguration={!!item.configuration}
      showInstallation
      showUseCases={!!useCases?.length}
      configurationContent={createConfigurationContent()}
      installationContent={createInstallationContent()}
      useCasesContent={useCases?.length ? createUseCasesContent() : undefined}
      customSidebar={renderHookSidebar(item, relatedItems, router)}
    />
  );
}
