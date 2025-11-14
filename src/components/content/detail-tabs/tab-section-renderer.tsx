/**
 * Tab Section Renderer - Maps section IDs to extracted section components
 * Uses dynamic imports for optimal code splitting and performance
 */

import dynamic from 'next/dynamic';
import { JSONSectionRenderer } from '@/src/components/content/json-to-sections';
import { ReviewListSection } from '@/src/components/core/domain/reviews/review-list-section';
import type { CategoryId, SectionId } from '@/src/lib/config/category-config.types';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import type { ProcessedSectionData } from '@/src/lib/types/detail-tabs.types';
import type { Database } from '@/src/types/database.types';

// Dynamic import for unified section component (code splitting)
const UnifiedSection = dynamic(() => import('@/src/components/content/sections/unified-section'));

export interface TabSectionRendererProps {
  sectionId: SectionId;
  item: ContentItem;
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

    case 'features':
      if (!config.sections.features || features.length === 0) return null;
      return (
        <UnifiedSection
          variant="list"
          title="Features"
          description="Key capabilities and functionality"
          items={features}
          category={item.category as CategoryId}
          dotColor="bg-primary"
        />
      );

    case 'requirements':
      if (requirements.length === 0) return null;
      return (
        <UnifiedSection
          variant="list"
          title="Requirements"
          description="Prerequisites and dependencies"
          items={requirements}
          category={item.category as CategoryId}
          dotColor="bg-orange-500"
        />
      );

    case 'use_cases':
      if (!config.sections.use_cases || useCases.length === 0) return null;
      return (
        <UnifiedSection
          variant="list"
          title="Use Cases"
          description="Common scenarios and applications"
          items={useCases}
          category={item.category as CategoryId}
          dotColor="bg-accent"
        />
      );

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

    case 'security':
      if (!(config.sections.security && 'security' in item)) return null;
      return (
        <UnifiedSection
          variant="list"
          title="Security Best Practices"
          description="Important security considerations"
          items={item.security as string[]}
          category={item.category as CategoryId}
          dotColor="bg-orange-500"
        />
      );

    case 'reviews':
      return (
        <div className="border-t pt-8">
          <ReviewListSection contentType={item.category as CategoryId} contentSlug={item.slug} />
        </div>
      );

    case 'related':
      // Related items handled in sidebar
      return null;

    case 'collection_items':
      // Collection sections passed as pre-rendered React nodes
      return collectionSections ? collectionSections : null;

    case 'guide_sections':
      if (!guideSections || guideSections.length === 0) return null;
      return (
        <JSONSectionRenderer
          sections={
            guideSections as unknown as Database['public']['Tables']['content']['Row']['metadata']
          }
        />
      );

    default:
      return null;
  }
}
