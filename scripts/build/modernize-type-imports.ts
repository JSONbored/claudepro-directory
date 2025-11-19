#!/usr/bin/env tsx
/**
 * Modernize all type imports to use new type names (GetGet* prefix)
 *
 * Updates all files importing from database-overrides.ts to use the new
 * consolidated type names without backward compatibility aliases.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '@/src/lib/logger';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');

// Type name mappings: old name -> new name
const TYPE_MAPPINGS: Record<string, string> = {
  // Batch 1-3: Get* -> GetGet*
  GetUserSettingsReturn: 'GetGetUserSettingsReturn',
  GetUserDashboardReturn: 'GetGetUserDashboardReturn',
  GetUserProfileReturn: 'GetGetUserProfileReturn',
  GetHomepageCompleteReturn: 'GetGetHomepageCompleteReturn',
  GetContentDetailCompleteReturn: 'GetGetContentDetailCompleteReturn',
  GetJobsListReturn: 'GetGetJobsListReturn',
  GetCollectionDetailWithItemsReturn: 'GetGetCollectionDetailWithItemsReturn',
  GetReviewsWithStatsReturn: 'GetGetReviewsWithStatsReturn',
  GetMySubmissionsReturn: 'GetGetMySubmissionsReturn',
  GetPendingSubmissionsReturn: 'GetGetPendingSubmissionsReturn',
  GetUserActivitySummaryReturn: 'GetGetUserActivitySummaryReturn',
  GetUserActivityTimelineReturn: 'GetGetUserActivityTimelineReturn',
  GetUserIdentitiesReturn: 'GetGetUserIdentitiesReturn',
  GetUserLibraryReturn: 'GetGetUserLibraryReturn',
  GetUserAffinitiesReturn: 'GetGetUserAffinitiesReturn',
  GetUserInteractionSummaryReturn: 'GetGetUserInteractionSummaryReturn',
  GetUserRecentInteractionsReturn: 'GetGetUserRecentInteractionsReturn',
  GetAccountDashboardReturn: 'GetGetAccountDashboardReturn',
  GetCollectionItemsGroupedReturn: 'GetGetCollectionItemsGroupedReturn',
  GetChangelogWithCategoryStatsReturn: 'GetGetChangelogWithCategoryStatsReturn',
  GetSubmissionStatsReturn: 'GetGetSubmissionStatsReturn',
  GetTopContributorsReturn: 'GetGetTopContributorsReturn',
  GetRecentMergedReturn: 'GetGetRecentMergedReturn',
  GetSubmissionDashboardReturn: 'GetGetSubmissionDashboardReturn',
  GetUserCollectionDetailReturn: 'GetGetUserCollectionDetailReturn',
  GetUserCompaniesReturn: 'GetGetUserCompaniesReturn',
  GetSimilarContentReturn: 'GetGetSimilarContentReturn',
  // Batch 6: Config types
  GetCategoryConfigReturn: 'GetGetCategoryConfigReturn',
  GetFormFieldConfigReturn: 'GetGetFormFieldConfigReturn',
  GetFormFieldsGroupedReturn: 'GetGetFormFieldsGroupedReturn',
  GetGenerationConfigReturn: 'GetGetGenerationConfigReturn',
  GetStructuredDataConfigReturn: 'GetGetStructuredDataConfigReturn',
  GetAllStructuredDataConfigsReturn: 'GetGetAllStructuredDataConfigsReturn',
  GetPerformanceBaselineReturn: 'GetGetPerformanceBaselineReturn',
  GetDatabaseFingerprintReturn: 'GetGetDatabaseFingerprintReturn',
  GetQuizConfigurationReturn: 'GetGetQuizConfigurationReturn',
  // Batch 7: Content/Company types
  GetRecommendationsReturn: 'GetGetRecommendationsReturn',
  GetCompanyProfileReturn: 'GetGetCompanyProfileReturn',
  GetCompaniesListReturn: 'GetGetCompaniesListReturn',
  GetCommunityDirectoryReturn: 'GetGetCommunityDirectoryReturn',
  GetPaginatedContentReturn: 'GetGetContentPaginatedSlimReturn',
  GetFormFieldsForContentTypeReturn: 'GetGetFormFieldsForContentTypeReturn',
  GetCompanyAdminProfileReturn: 'GetGetCompanyAdminProfileReturn',
  GetRecentContentReturn: 'GetGetRecentContentReturn',
  GetJobDetailReturn: 'GetGetJobDetailReturn',
  // Batch 8: Admin/Generate types
  GetApiHealthReturn: 'GetGetApiHealthReturn',
  GetAppSettingsReturn: 'GetGetAppSettingsReturn',
  GetNavigationMenuReturn: 'GetGetNavigationMenuReturn',
  GetSponsorshipAnalyticsReturn: 'GetGetSponsorshipAnalyticsReturn',
  GetContentTemplatesReturn: 'GetGetContentTemplatesReturn',
  GetUserSponsorshipsReturn: 'GetGetUserSponsorshipsReturn',
  GetWeeklyDigestReturn: 'GetGetWeeklyDigestReturn',
  GetDueSequenceEmailsReturn: 'GetGetDueSequenceEmailsReturn',
  // Batch 9: Utility types
  GetSearchSuggestionsReturn: 'GetGetSearchSuggestionsReturn',
  GetSearchCountReturn: 'GetGetSearchCountReturn',
  GetSearchFacetsReturn: 'GetGetSearchFacetsReturn',
  GetJobsByCategoryReturn: 'GetGetJobsByCategoryReturn',
  GetFeaturedJobsReturn: 'GetGetFeaturedJobsReturn',
  GetRelatedContentReturn: 'GetGetRelatedContentReturn',
  GetContactCommandsReturn: 'GetGetContactCommandsReturn',
  // Special case
  FilterJobsReturn: 'GetFilterJobsReturn',
};

function modernizeFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  let updated = content;
  let changed = false;

  // Update type imports
  for (const [oldName, newName] of Object.entries(TYPE_MAPPINGS)) {
    // Update in import statements
    const importRegex = new RegExp(
      `(import\\s+(?:type\\s+)?\\{[^}]*\\b)${oldName}(\\b[^}]*\\}\\s+from\\s+['"]@/src/types/database-overrides['"])`,
      'g'
    );
    const afterImport = updated.replace(importRegex, `$1${newName}$2`);
    if (afterImport !== updated) {
      updated = afterImport;
      changed = true;
    }

    // Update type references in code (but skip import lines which are already handled)
    const importLineRegex = new RegExp(
      `^\\s*import\\s+(?:type\\s+)?\\{[^}]*\\b${oldName}\\b[^}]*\\}\\s+from`,
      'gm'
    );
    const hasImportLine = importLineRegex.test(updated);
    if (!hasImportLine) {
      const typeRefRegex = new RegExp(`\\b${oldName}\\b`, 'g');
      if (typeRefRegex.test(updated)) {
        updated = updated.replace(typeRefRegex, newName);
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, updated, 'utf-8');
    return true;
  }

  return false;
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (stat.isFile()) {
      const ext = extname(file);
      if (
        (ext === '.ts' || ext === '.tsx') &&
        !file.includes('.generated.') &&
        file !== 'database-overrides.ts' &&
        file !== 'database.types.ts'
      ) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function main() {
  logger.info('🔄 Modernizing type imports across codebase...\n', {
    script: 'modernize-type-imports',
  });

  const srcDir = join(ROOT, 'src');
  const files = getAllFiles(srcDir);

  let updatedCount = 0;
  for (const filePath of files) {
    if (modernizeFile(filePath)) {
      const relativePath = filePath.replace(`${ROOT}/`, '');
      updatedCount++;
      logger.info(`   ✅ ${relativePath}`, {
        script: 'modernize-type-imports',
        file: relativePath,
      });
    }
  }

  logger.info(`\n✅ Updated ${updatedCount} files`, {
    script: 'modernize-type-imports',
    updatedCount,
  });
  logger.info('   Run pnpm type-check to verify\n', { script: 'modernize-type-imports' });
}

try {
  main();
} catch (error: unknown) {
  logger.error('❌ Error', error instanceof Error ? error : new Error(String(error)), {
    script: 'modernize-type-imports',
  });
  process.exit(1);
}
