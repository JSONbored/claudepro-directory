import Script from 'next/script';
import { serializeJsonLd } from '@/lib/schemas/form.schema';
import {
  buildBreadcrumb,
  buildCreativeWork,
  buildFAQPage,
  buildHowTo,
  buildSoftwareApplication,
  buildSoftwareSourceCode,
  buildWebPageSpeakable,
  type FAQItem,
  type SchemaObject,
} from '@/lib/structured-data/schema-builder';
import {
  isAgentContent,
  isCommandContent,
  isHookContent,
  isMcpContent,
  isRuleContent,
  isStatuslineContent,
  SCHEMA_CONFIGS,
  type UnifiedContent,
  type UnifiedStructuredDataProps,
} from '@/lib/structured-data/schema-types';

/**
 * Unified Structured Data Component
 * Handles schema.org JSON-LD generation for all content types (agents, commands, hooks, mcp, rules)
 *
 * Consolidates 5 previously separate schema components into one with type discrimination
 */
export function UnifiedStructuredData({ item }: UnifiedStructuredDataProps) {
  const schemas: SchemaObject[] = [];
  const config = SCHEMA_CONFIGS[item.category];

  // Type-safe property access
  const itemTitle = 'title' in item ? (item.title as string | undefined) : undefined;
  const itemName = 'name' in item ? (item.name as string | undefined) : undefined;
  const itemGithubUrl = 'githubUrl' in item ? (item.githubUrl as string | undefined) : undefined;
  const itemLastModified =
    'lastModified' in item ? (item.lastModified as string | undefined) : undefined;
  const itemFeatures = 'features' in item ? (item.features as string[] | undefined) : undefined;

  const displayName = itemTitle || itemName || item.slug;
  const displayTitle = itemTitle || itemName || item.slug;

  // 1. Generate SoftwareApplication Schema (agents, hooks, mcp, rules)
  if (config.generateApplication) {
    const appSchema = buildSoftwareApplication({
      slug: item.slug,
      name: displayName,
      description: item.description,
      category: item.category,
      applicationSubCategory: getApplicationSubCategory(item),
      keywords: getKeywords(item),
      author: item.author,
      githubUrl: itemGithubUrl,
      dateAdded: item.dateAdded,
      lastModified: itemLastModified,
      features: itemFeatures,
      requirements: getRequirements(item),
      configuration: getConfiguration(item),
    });
    schemas.push(appSchema);
  }

  // 2. Generate SoftwareSourceCode Schema (all types have some form of code/config)
  if (config.generateSourceCode) {
    const sourceCodeSchemas = getSourceCodeSchemas(item);
    schemas.push(...sourceCodeSchemas);
  }

  // 3. Generate CreativeWork Schema (agents, rules - for prompts/content)
  if (config.generateCreativeWork && item.content) {
    const creativeWorkSchema = buildCreativeWork({
      slug: item.slug,
      category: item.category,
      name: displayName,
      description: getCreativeWorkDescription(item),
      content: item.content,
      author: item.author,
    });
    schemas.push(creativeWorkSchema);
  }

  // 4. Generate HowTo Schema (all types)
  if (config.generateHowTo) {
    const howToSchema = buildHowTo({
      slug: item.slug,
      category: item.category,
      name: displayName,
      description: `Step-by-step guide to implement ${displayName}`,
      steps: getHowToSteps(item),
    });
    schemas.push(howToSchema);
  }

  // 5. Generate FAQPage Schema (mcp - has troubleshooting)
  if (
    config.generateFAQ &&
    isMcpContent(item) &&
    item.troubleshooting &&
    item.troubleshooting.length > 0
  ) {
    const faqSchema = buildFAQPage(
      item.slug,
      item.category,
      displayName,
      item.troubleshooting as FAQItem[]
    );
    schemas.push(faqSchema);
  }

  // 6. Generate Breadcrumb Schema (all types)
  if (config.generateBreadcrumb) {
    const breadcrumbSchema = buildBreadcrumb([
      { name: 'Home', url: '/' },
      { name: getCategoryName(item.category), url: `/${item.category}` },
      { name: displayTitle, url: `/${item.category}/${item.slug}` },
    ]);
    schemas.push(breadcrumbSchema);
  }

  // 7. Generate WebPage Speakable Schema (agents, rules)
  if (config.generateSpeakable) {
    const speakableSchema = buildWebPageSpeakable(item.slug, item.category);
    schemas.push(speakableSchema);
  }

  // Render all schemas as Script tags
  return (
    <>
      {schemas.map((schema, index) => {
        // Extract type-safe @id or @type for unique key
        const schemaWithId = schema as { '@id'?: string; '@type'?: string };
        const idFragment = schemaWithId['@id'] ? schemaWithId['@id'].split('#').pop() : null;
        const schemaId = idFragment || `${schemaWithId['@type'] || 'schema'}-${index}`;

        return (
          <Script
            key={`${item.category}-${item.slug}-${schemaId}`}
            id={`structured-data-${item.category}-${schemaId}`}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated Zod schemas
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(schema),
            }}
            strategy="afterInteractive"
          />
        );
      })}
    </>
  );
}

/**
 * Helper: Get application sub-category based on content type
 */
function getApplicationSubCategory(item: UnifiedContent): string {
  if (isAgentContent(item)) return 'AI Agent';
  if (isHookContent(item)) return `${item.hookType || 'Hook'} - Claude Hook`;
  if (isMcpContent(item)) return 'MCP Server';
  if (isRuleContent(item)) return 'Development Rule';
  if (isStatuslineContent(item)) return `${item.statuslineType || 'Statusline'} - CLI Statusline`;
  return 'Claude Configuration';
}

/**
 * Helper: Get keywords for SEO
 */
function getKeywords(item: UnifiedContent): string[] {
  const baseKeywords = [item.category, 'Claude', ...(item.tags || [])];

  if (isAgentContent(item)) {
    return ['Claude Agent', 'AI Assistant Agent', ...baseKeywords];
  }
  if (isCommandContent(item)) {
    return ['Claude Command', 'AI Assistant Command', ...baseKeywords];
  }
  if (isHookContent(item)) {
    return ['Claude Hook', item.hookType || 'Hook', 'Automation', ...baseKeywords];
  }
  if (isMcpContent(item)) {
    return ['MCP Server', 'Model Context Protocol', 'AI Development', ...baseKeywords];
  }
  if (isRuleContent(item)) {
    return ['Development Rule', 'Code Standards', 'Best Practices', ...baseKeywords];
  }
  if (isStatuslineContent(item)) {
    return ['Claude Statusline', 'CLI Statusline', 'Terminal Customization', ...baseKeywords];
  }

  return baseKeywords;
}

/**
 * Helper: Get software requirements
 */
function getRequirements(item: UnifiedContent): string[] {
  const baseRequirements = ['Claude Desktop or Claude Code'];

  if (isHookContent(item) && item.requirements) {
    return [...baseRequirements, ...item.requirements];
  }

  if (isMcpContent(item) && item.installation?.requirements) {
    return [...baseRequirements, ...item.installation.requirements];
  }

  if (isStatuslineContent(item) && item.requirements) {
    return [...baseRequirements, ...item.requirements];
  }

  return baseRequirements;
}

/**
 * Helper: Get configuration object
 */
function getConfiguration(item: UnifiedContent): unknown {
  if (isAgentContent(item)) return item.configuration;
  if (isHookContent(item)) return item.configuration;
  if (isMcpContent(item)) return item.configuration;
  if (isStatuslineContent(item)) return item.configuration;
  return undefined;
}

/**
 * Helper: Get source code schemas
 */
function getSourceCodeSchemas(item: UnifiedContent): SchemaObject[] {
  const schemas: SchemaObject[] = [];
  const itemTitle = 'title' in item ? item.title : undefined;
  const itemName = 'name' in item ? item.name : undefined;
  const itemGithubUrl = 'githubUrl' in item ? item.githubUrl : undefined;
  const displayName = itemTitle || itemName || item.slug;

  // Agent configuration
  if (isAgentContent(item) && item.configuration) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Configuration`,
        description: 'Agent configuration for Claude',
        programmingLanguage: 'JSON',
        code: JSON.stringify(item.configuration, null, 2),
        encodingFormat: 'application/json',
        githubUrl: itemGithubUrl,
        fragmentId: 'configuration',
      })
    );
  }

  // Command content
  if (isCommandContent(item) && item.content) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Command`,
        description: 'Command syntax and configuration',
        programmingLanguage: 'Claude Command',
        code: item.content,
        encodingFormat: 'text/plain',
        githubUrl: itemGithubUrl,
        fragmentId: 'command',
      })
    );
  }

  // Hook script
  if (isHookContent(item) && item.configuration?.scriptContent) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Script`,
        description: `${item.hookType || 'Hook'} script for Claude`,
        programmingLanguage: 'Shell Script',
        code: item.configuration.scriptContent,
        encodingFormat: 'text/x-shellscript',
        githubUrl: itemGithubUrl,
        fragmentId: 'script',
      })
    );

    if (item.configuration?.hookConfig) {
      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Configuration`,
          description: 'Hook configuration',
          programmingLanguage: 'JSON',
          code: JSON.stringify(item.configuration.hookConfig, null, 2),
          encodingFormat: 'application/json',
          githubUrl: itemGithubUrl,
          fragmentId: 'config',
        })
      );
    }
  }

  // MCP configurations
  if (isMcpContent(item)) {
    if (item.configuration?.claudeDesktop) {
      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Claude Desktop Config`,
          description: 'Configuration for Claude Desktop',
          programmingLanguage: 'JSON',
          code: JSON.stringify(item.configuration.claudeDesktop, null, 2),
          encodingFormat: 'application/json',
          githubUrl: itemGithubUrl,
          fragmentId: 'claude-desktop-config',
        })
      );
    }

    if (item.configuration?.claudeCode) {
      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Claude Code Config`,
          description: 'Configuration for Claude Code',
          programmingLanguage: 'JSON',
          code: JSON.stringify(item.configuration.claudeCode, null, 2),
          encodingFormat: 'application/json',
          githubUrl: itemGithubUrl,
          fragmentId: 'claude-code-config',
        })
      );
    }
  }

  // Statusline script (stored in top-level content field)
  if (isStatuslineContent(item) && item.content) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Script`,
        description: `${item.statuslineType || 'Statusline'} script for Claude Code`,
        programmingLanguage: item.configuration?.format === 'python' ? 'Python' : 'Shell Script',
        code: item.content,
        encodingFormat:
          item.configuration?.format === 'python' ? 'text/x-python' : 'text/x-shellscript',
        githubUrl: itemGithubUrl,
        fragmentId: 'script',
      })
    );
  }

  return schemas;
}

/**
 * Helper: Get CreativeWork description
 */
function getCreativeWorkDescription(item: UnifiedContent): string {
  if (isAgentContent(item)) return 'Agent system prompt and instructions';
  if (isRuleContent(item)) return 'Development rule and best practices';
  return 'Content template';
}

/**
 * Helper: Get HowTo steps
 */
function getHowToSteps(item: UnifiedContent) {
  const itemTitle = 'title' in item ? item.title : undefined;
  const itemName = 'name' in item ? item.name : undefined;
  const displayName = itemTitle || itemName || item.slug;
  const baseSteps = [
    {
      position: 1,
      name: 'Open Claude Desktop or Claude Code',
      text: 'Launch your Claude application',
    },
    {
      position: 2,
      name: `Navigate to ${getCategoryName(item.category)}`,
      text: `Access the ${item.category} configuration section`,
    },
  ];

  if (isAgentContent(item) || isCommandContent(item) || isRuleContent(item)) {
    const configCode = item.configuration ? JSON.stringify(item.configuration, null, 2) : undefined;
    baseSteps.push({
      position: 3,
      name: 'Apply configuration',
      text: `Copy and apply the ${displayName} configuration`,
      ...(configCode && { code: configCode, programmingLanguage: 'json' }),
    });
  }

  if (isHookContent(item)) {
    const scriptContent = item.configuration?.scriptContent;
    baseSteps.push({
      position: 3,
      name: 'Create hook script',
      text: 'Create the hook script file',
      ...(scriptContent && { code: scriptContent, programmingLanguage: 'bash' }),
    });
  }

  if (isMcpContent(item)) {
    const installText =
      typeof item.installation?.claudeCode === 'string'
        ? item.installation.claudeCode
        : item.package
          ? `npm install ${item.package}`
          : 'Install the MCP server package';
    baseSteps.push({
      position: 3,
      name: 'Install MCP server',
      text: installText,
    });
  }

  return baseSteps;
}

/**
 * Helper: Get category display name
 */
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    agents: 'Agents',
    commands: 'Commands',
    hooks: 'Hooks',
    mcp: 'MCP Servers',
    rules: 'Rules',
    statuslines: 'Statuslines',
  };
  return names[category] || category;
}
