/**
 * Schema Types - Database-First Architecture
 * All configuration from PostgreSQL, zero hardcoded rules
 */

import type { ContentItem, FullContentItem } from '@/src/lib/content/supabase-content-loader';
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
} from '@/src/lib/structured-data/schema-builder';
import { createClient } from '@/src/lib/supabase/server';
import { getContentItemUrl, transformMcpConfigForDisplay } from '@/src/lib/utils/content.utils';
import type { Database } from '@/src/types/database.types';

export type UnifiedContent = FullContentItem | ContentItem;

export interface UnifiedStructuredDataProps {
  item: UnifiedContent;
}

export function isAgentContent(
  item: UnifiedContent
): item is Database['public']['Tables']['agents']['Row'] & { category: 'agents' } {
  return item.category === 'agents';
}

export function isCommandContent(
  item: UnifiedContent
): item is Database['public']['Tables']['commands']['Row'] & { category: 'commands' } {
  return item.category === 'commands';
}

export function isCollectionContent(
  item: UnifiedContent
): item is Database['public']['Tables']['collections']['Row'] & { category: 'collections' } {
  return item.category === 'collections';
}

export function isHookContent(
  item: UnifiedContent
): item is Database['public']['Tables']['hooks']['Row'] & { category: 'hooks' } {
  return item.category === 'hooks';
}

export function isMcpContent(
  item: UnifiedContent
): item is Database['public']['Tables']['mcp']['Row'] & { category: 'mcp' } {
  return item.category === 'mcp';
}

export function isRuleContent(
  item: UnifiedContent
): item is Database['public']['Tables']['rules']['Row'] & { category: 'rules' } {
  return item.category === 'rules';
}

export function isStatuslineContent(
  item: UnifiedContent
): item is Database['public']['Tables']['statuslines']['Row'] & { category: 'statuslines' } {
  return item.category === 'statuslines';
}

export function isSkillContent(
  item: UnifiedContent
): item is Database['public']['Tables']['skills']['Row'] & { category: 'skills' } {
  return item.category === 'skills';
}

export function hasContentTroubleshooting(item: UnifiedContent): boolean {
  return 'troubleshooting' in item && Array.isArray(item.troubleshooting);
}

export async function generateAllSchemasForContent(item: UnifiedContent): Promise<SchemaObject[]> {
  const schemas: SchemaObject[] = [];
  const supabase = await createClient();

  const { data: config } = await supabase.rpc('get_structured_data_config', {
    p_category: item.category,
  });

  if (!config) return schemas;

  const dbConfig = config as unknown as {
    schemaTypes: {
      application: boolean;
      sourceCode: boolean;
      howTo: boolean;
      creativeWork: boolean;
      faq: boolean;
      breadcrumb: boolean;
      speakable: boolean;
    };
    categoryDisplayName: string;
    applicationSubCategory: string;
    defaultKeywords: string[];
    defaultRequirements: string[];
    creativeWorkDescription: string;
  };

  const itemTitle = 'title' in item ? (item.title as string | undefined) : undefined;
  const itemName = 'name' in item ? (item.name as string | undefined) : undefined;
  const itemGithubUrl = 'githubUrl' in item ? (item.githubUrl as string | undefined) : undefined;
  const itemLastModified =
    'lastModified' in item ? (item.lastModified as string | undefined) : undefined;
  const itemFeatures = 'features' in item ? (item.features as string[] | undefined) : undefined;

  const displayName = itemTitle || itemName || item.slug;
  const displayTitle = itemTitle || itemName || item.slug;

  const itemTags = Array.isArray(item.tags) ? item.tags : [];
  const keywords = [
    ...(Array.isArray(dbConfig.defaultKeywords) ? (dbConfig.defaultKeywords as string[]) : []),
    item.category,
    ...itemTags,
  ];

  let requirements = [
    ...(Array.isArray(dbConfig.defaultRequirements)
      ? (dbConfig.defaultRequirements as string[])
      : []),
  ];
  if (isCollectionContent(item) && item.prerequisites && Array.isArray(item.prerequisites)) {
    requirements = [...requirements, ...item.prerequisites];
  } else if (isHookContent(item) && item.requirements && Array.isArray(item.requirements)) {
    requirements = [...requirements, ...item.requirements];
  } else if (isMcpContent(item)) {
    const installation = item.installation as { requirements?: string[] } | null;
    if (installation?.requirements && Array.isArray(installation.requirements)) {
      requirements = [...requirements, ...installation.requirements];
    }
  } else if (isStatuslineContent(item)) {
    const skillReqs = 'requirements' in item ? item.requirements : undefined;
    if (Array.isArray(skillReqs)) {
      requirements = [...requirements, ...skillReqs];
    }
  } else if (isSkillContent(item)) {
    const skillReqs = 'requirements' in item ? item.requirements : undefined;
    if (Array.isArray(skillReqs)) {
      requirements = skillReqs;
    }
  }

  let configuration: unknown;
  if (isAgentContent(item) || isCommandContent(item) || isRuleContent(item)) {
    configuration = item.configuration;
  } else if (isHookContent(item) || isMcpContent(item) || isStatuslineContent(item)) {
    configuration = item.configuration;
  }

  if (dbConfig.schemaTypes.application) {
    schemas.push(
      buildSoftwareApplication({
        slug: item.slug,
        name: displayName,
        description: item.description,
        category: item.category as any,
        applicationSubCategory: dbConfig.applicationSubCategory,
        keywords: keywords as string[],
        author: 'author' in item ? (item.author as string) : '',
        githubUrl: itemGithubUrl,
        date_added: 'date_added' in item ? (item.date_added as string) : '',
        lastModified: itemLastModified,
        features: itemFeatures,
        requirements,
        configuration,
      })
    );
  }

  if (dbConfig.schemaTypes.sourceCode) {
    schemas.push(...(await generateSourceCodeSchemas(item, displayName, itemGithubUrl)));
  }

  const itemContent = 'content' in item ? (item.content as string | null) : null;
  if (dbConfig.schemaTypes.creativeWork && itemContent) {
    schemas.push(
      buildCreativeWork({
        slug: item.slug,
        category: item.category as any,
        name: displayName,
        description: dbConfig.creativeWorkDescription,
        content: itemContent,
        author: 'author' in item ? (item.author as string) : '',
      })
    );
  }

  if (dbConfig.schemaTypes.howTo) {
    schemas.push(
      buildHowTo({
        slug: item.slug,
        category: item.category as any,
        name: displayName,
        description: `Step-by-step guide to implement ${displayName}`,
        steps: generateHowToSteps(item, displayName, dbConfig.categoryDisplayName),
      })
    );
  }

  if (dbConfig.schemaTypes.faq && hasContentTroubleshooting(item)) {
    const troubleshooting =
      'troubleshooting' in item ? (item.troubleshooting as unknown as FAQItem[]) : undefined;
    if (Array.isArray(troubleshooting) && troubleshooting.length > 0) {
      schemas.push(buildFAQPage(item.slug, item.category, displayName, troubleshooting));
    }
  }

  if (dbConfig.schemaTypes.breadcrumb) {
    schemas.push(
      buildBreadcrumb([
        { name: 'Home', url: '/' },
        { name: dbConfig.categoryDisplayName, url: `/${item.category}` },
        {
          name: displayTitle,
          url: getContentItemUrl({ category: item.category as any, slug: item.slug }),
        },
      ])
    );
  }

  if (dbConfig.schemaTypes.speakable) {
    schemas.push(buildWebPageSpeakable(item.slug, item.category));
  }

  return schemas;
}

async function generateSourceCodeSchemas(
  item: UnifiedContent,
  displayName: string,
  githubUrl?: string
): Promise<SchemaObject[]> {
  const schemas: SchemaObject[] = [];

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
        githubUrl,
        fragmentId: 'configuration',
      })
    );
  }

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
        githubUrl,
        fragmentId: 'command',
      })
    );
  }

  if (isHookContent(item) && item.configuration) {
    const config = item.configuration as { scriptContent?: string; hookConfig?: unknown };
    if (config.scriptContent) {
      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Script`,
          description: `${item.hook_type || 'Hook'} script for Claude`,
          programmingLanguage: 'Shell Script',
          code: config.scriptContent,
          encodingFormat: 'text/x-shellscript',
          githubUrl,
          fragmentId: 'script',
        })
      );

      if (config.hookConfig) {
        schemas.push(
          buildSoftwareSourceCode({
            slug: item.slug,
            category: item.category,
            name: `${displayName} - Configuration`,
            description: 'Hook configuration',
            programmingLanguage: 'JSON',
            code: JSON.stringify(config.hookConfig, null, 2),
            encodingFormat: 'application/json',
            githubUrl,
            fragmentId: 'config',
          })
        );
      }
    }
  }

  if (isMcpContent(item) && item.configuration) {
    const config = item.configuration as {
      claudeDesktop?: Record<string, unknown>;
      claudeCode?: Record<string, unknown>;
    };

    if (config.claudeDesktop) {
      const displayConfig = transformMcpConfigForDisplay(config.claudeDesktop);

      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Claude Desktop Config`,
          description: 'Configuration for Claude Desktop',
          programmingLanguage: 'JSON',
          code: JSON.stringify(displayConfig, null, 2),
          encodingFormat: 'application/json',
          githubUrl,
          fragmentId: 'claude-desktop-config',
        })
      );
    }

    if (config.claudeCode) {
      const displayConfig = transformMcpConfigForDisplay(config.claudeCode);

      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Claude Code Config`,
          description: 'Configuration for Claude Code',
          programmingLanguage: 'JSON',
          code: JSON.stringify(displayConfig, null, 2),
          encodingFormat: 'application/json',
          githubUrl,
          fragmentId: 'claude-code-config',
        })
      );
    }
  }

  if (isStatuslineContent(item) && item.content) {
    const config = item.configuration as { format?: string } | null;
    const isPython = config?.format === 'python';

    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Script`,
        description: `${item.statusline_type || 'Statusline'} script for Claude Code`,
        programmingLanguage: isPython ? 'Python' : 'Shell Script',
        code: item.content,
        encodingFormat: isPython ? 'text/x-python' : 'text/x-shellscript',
        githubUrl,
        fragmentId: 'script',
      })
    );
  }

  return schemas;
}

function generateHowToSteps(
  item: UnifiedContent,
  displayName: string,
  categoryDisplayName: string
) {
  const baseSteps = [
    {
      position: 1,
      name: 'Open Claude Desktop or Claude Code',
      text: 'Launch your Claude application',
    },
    {
      position: 2,
      name: `Navigate to ${categoryDisplayName}`,
      text: `Access the ${item.category} configuration section`,
    },
  ];

  if (isAgentContent(item) || isCommandContent(item) || isRuleContent(item)) {
    const configCode = (item as { configuration?: unknown }).configuration
      ? JSON.stringify((item as { configuration?: unknown }).configuration, null, 2)
      : undefined;
    baseSteps.push({
      position: 3,
      name: 'Apply configuration',
      text: `Copy and apply the ${displayName} configuration`,
      ...(configCode && { code: configCode, programmingLanguage: 'json' }),
    });
  }

  if (isHookContent(item)) {
    const config = item.configuration as { scriptContent?: string } | null;
    const scriptContent = config?.scriptContent;
    baseSteps.push({
      position: 3,
      name: 'Create hook script',
      text: 'Create the hook script file',
      ...(scriptContent && {
        code: scriptContent,
        programmingLanguage: 'bash',
      }),
    });
  }

  if (isMcpContent(item)) {
    const installation = item.installation as { claudeCode?: string } | null;
    const installText =
      typeof installation?.claudeCode === 'string'
        ? installation.claudeCode
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
