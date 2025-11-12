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

// Dynamic imports for extracted sections (code splitting)
const FeaturesSection = dynamic(() => import('@/src/components/content/sections/features-section'));
const RequirementsSection = dynamic(
  () => import('@/src/components/content/sections/requirements-section')
);
const UseCasesSection = dynamic(
  () => import('@/src/components/content/sections/use-cases-section')
);
const SecuritySection = dynamic(() => import('@/src/components/content/sections/security-section'));
const TroubleshootingSection = dynamic(
  () => import('@/src/components/content/sections/troubleshooting-section')
);
const InstallationSection = dynamic(
  () => import('@/src/components/content/sections/installation-section')
);
const ConfigurationSection = dynamic(
  () => import('@/src/components/content/sections/configuration-section')
);
const ExamplesSection = dynamic(() => import('@/src/components/content/sections/examples-section'));

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
      return <FeaturesSection features={features} category={item.category as CategoryId} />;

    case 'requirements':
      if (requirements.length === 0) return null;
      return (
        <RequirementsSection requirements={requirements} category={item.category as CategoryId} />
      );

    case 'use_cases':
      if (!config.sections.use_cases || useCases.length === 0) return null;
      return <UseCasesSection useCases={useCases} category={item.category as CategoryId} />;

    case 'installation':
      if (!(config.sections.installation && installationData)) return null;
      return <InstallationSection installationData={installationData} item={item} />;

    case 'configuration':
      if (!(config.sections.configuration && configData)) return null;
      return (
        <ConfigurationSection
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
      return <ExamplesSection examples={examplesData} />;

    case 'troubleshooting':
      if (!config.sections.troubleshooting || troubleshooting.length === 0) return null;
      return <TroubleshootingSection items={troubleshooting} />;

    case 'security':
      if (!(config.sections.security && 'security' in item)) return null;
      return (
        <SecuritySection
          securityItems={item.security as string[]}
          category={item.category as CategoryId}
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
      return collectionSections ? <>{collectionSections}</> : null;

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
