/**
 * Tab Section Renderer - Maps section IDs to extracted section components
 * Uses dynamic imports for optimal code splitting and performance
 */

import type { Database } from '@heyclaude/database-types';
import { ensureStringArray, isValidCategory } from '@heyclaude/web-runtime/core';
import type {
  ContentItem,
  ProcessedSectionData,
  SectionId,
} from '@heyclaude/web-runtime/types/component.types';
import dynamic from 'next/dynamic';
import { JSONSectionRenderer } from '@/src/components/content/json-to-sections';
import { ReviewListSection } from '@/src/components/core/domain/reviews/review-list-section';

// Dynamic import for unified section component (code splitting)
const UnifiedSection = dynamic(() => import('@/src/components/content/sections/unified-section'));

export interface TabSectionRendererProps {
  sectionId: SectionId;
  item:
    | ContentItem
    | (Database['public']['Functions']['get_content_detail_complete']['Returns']['content'] &
        ContentItem);
  sectionData: ProcessedSectionData;
  config: {
    typeName: string;
    sections: {
      features: boolean;
      installation: boolean;
      use_cases: boolean;
      configuration: boolean;
      security: boolean;
      troubleshooting: boolean;
      examples: boolean;
      requirements: boolean;
    };
  };
}

/**
 * Renders a single section based on section ID
 * Returns null if section should not be displayed
 */
export function TabSectionRenderer({
  sectionId,
  item,
  sectionData,
  config,
}: TabSectionRendererProps) {
  const {
    configData,
    installationData,
    examplesData,
    features = [],
    useCases = [],
    requirements = [],
    troubleshooting = [],
    guideSections,
    collectionSections,
  } = sectionData;

  switch (sectionId) {
    case 'description':
      // Description is handled in header/metadata, not as a separate section
      return null;

    case 'content':
    case 'code': {
      if (!sectionData.contentData) return null;
      const contentData = sectionData.contentData;
      if (Array.isArray(contentData)) {
        // Render multiple code blocks from markdown
        return (
          <>
            {contentData.map((block, index) => (
              <UnifiedSection
                key={`content-block-${index}`}
                variant="code"
                title={
                  index === 0
                    ? `${config.typeName} Content`
                    : `${config.typeName} Content (${index + 1})`
                }
                description={
                  index === 0
                    ? `The main content for this ${config.typeName.toLowerCase()}.`
                    : `Additional code example for this ${config.typeName.toLowerCase()}.`
                }
                html={block.html}
                code={block.code}
                language={block.language}
                filename={block.filename}
              />
            ))}
          </>
        );
      }
      // Render single code block
      return (
        <UnifiedSection
          variant="code"
          title={`${config.typeName} Content`}
          description={`The main content for this ${config.typeName.toLowerCase()}.`}
          html={contentData.html}
          code={contentData.code}
          language={contentData.language}
          filename={contentData.filename}
        />
      );
    }

    case 'features': {
      if (!config.sections.features || features.length === 0) return null;
      const validCategory = isValidCategory(item.category) ? item.category : 'agents';
      return (
        <UnifiedSection
          variant="list"
          title="Features"
          description="Key capabilities and functionality"
          items={features}
          category={validCategory}
          dotColor="bg-primary"
        />
      );
    }

    case 'requirements': {
      if (!config.sections.requirements || requirements.length === 0) return null;
      const validCategory = isValidCategory(item.category) ? item.category : 'agents';
      return (
        <UnifiedSection
          variant="list"
          title="Requirements"
          description="Prerequisites and dependencies"
          items={requirements}
          category={validCategory}
          dotColor="bg-orange-500"
        />
      );
    }

    case 'use_cases': {
      if (!config.sections.use_cases || useCases.length === 0) return null;
      const validCategory = isValidCategory(item.category) ? item.category : 'agents';
      return (
        <UnifiedSection
          variant="list"
          title="Use Cases"
          description="Common scenarios and applications"
          items={useCases}
          category={validCategory}
          dotColor="bg-accent"
        />
      );
    }

    case 'installation':
      if (!(config.sections.installation && installationData)) return null;
      return (
        <UnifiedSection variant="installation" installationData={installationData} item={item} />
      );

    case 'configuration':
      if (!(config.sections.configuration && configData)) return null;
      return (
        <UnifiedSection
          variant="configuration"
          {...(configData.format === 'multi'
            ? { format: 'multi' as const, configs: configData.configs }
            : configData.format === 'hook'
              ? {
                  format: 'hook' as const,
                  hookConfig: configData.hookConfig,
                  scriptContent: configData.scriptContent,
                }
              : {
                  format: 'json' as const,
                  html: configData.html,
                  code: configData.code,
                  filename: configData.filename,
                })}
        />
      );

    case 'examples':
      if (!(config.sections.examples && examplesData) || examplesData.length === 0) return null;
      return <UnifiedSection variant="examples" examples={examplesData} />;

    case 'troubleshooting':
      if (!config.sections.troubleshooting || troubleshooting.length === 0) return null;
      return (
        <UnifiedSection
          variant="enhanced-list"
          title="Troubleshooting"
          description="Common issues and solutions"
          items={troubleshooting}
          dotColor="bg-red-500"
        />
      );

    case 'security': {
      // Cast item to ContentItem for property access (content is Json type from RPC)
      const contentItem = item as ContentItem;
      if (!(config.sections.security && 'security' in contentItem)) return null;
      const securityItems = ensureStringArray(contentItem['security']);
      if (securityItems.length === 0) return null;
      const validCategory = isValidCategory(item.category) ? item.category : 'agents';
      return (
        <UnifiedSection
          variant="list"
          title="Security Best Practices"
          description="Important security considerations"
          items={securityItems}
          category={validCategory}
          dotColor="bg-orange-500"
        />
      );
    }

    case 'reviews': {
      const validCategory = isValidCategory(item.category) ? item.category : 'agents';
      const validSlug = item.slug ?? '';
      if (!validSlug) return null;
      return (
        <div className="border-t pt-8">
          <ReviewListSection contentType={validCategory} contentSlug={validSlug} />
        </div>
      );
    }

    case 'related':
      // Related items handled in sidebar
      return null;

    case 'collection_items':
      // Collection sections passed as pre-rendered React nodes
      return collectionSections ? collectionSections : null;

    case 'guide_sections':
      if (!guideSections || guideSections.length === 0) {
        // Log warning for debugging - guides should always have sections
        if (item.category === 'guides') {
          console.warn('Guide sections missing or empty', {
            slug: item.slug,
            guideSectionsLength: guideSections?.length ?? 0,
            guideSectionsType: typeof guideSections,
          });
        }
        return null;
      }
      // guideSections is already a processed array of sections with html
      // JSONSectionRenderer accepts arrays (checks Array.isArray internally)
      return <JSONSectionRenderer sections={guideSections} />;

    default:
      return null;
  }
}
