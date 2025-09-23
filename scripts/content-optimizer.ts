/**
 * Unified Content Optimizer for Claude Pro Directory
 * Handles ALL guide content types with single, modern optimization system
 * Built for September 2025 SEO standards, AI citation scoring, and content validation
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// =============================================================================
// Content Types and Interfaces
// =============================================================================

export type ContentType =
  | 'tutorials'
  | 'use-cases'
  | 'comparisons'
  | 'troubleshooting'
  | 'categories'
  | 'collections'
  | 'workflows';

export interface ContentMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  category?: string;
  dateUpdated?: string;
  readingTime?: string;
  difficulty?: string;
  aiOptimized?: boolean;
  citationReady?: boolean;
}

export interface OptimizationResult {
  filePath: string;
  contentType: ContentType;
  seoScore: number;
  citationScore: number;
  freshnessScore: number;
  validationErrors: string[];
  validationWarnings: string[];
  recommendations: string[];
  optimizedContent?: string;
}

export interface SEOMetrics {
  keywordDensity: number;
  readabilityScore: number;
  headingStructure: number;
  internalLinks: number;
  schemaMarkup: number;
  metaOptimization: number;
}

export interface CitationMetrics {
  paragraphLength: number;
  factualStatements: number;
  sourceAttribution: number;
  structuredData: number;
  extractableContent: number;
}

export interface FreshnessMetrics {
  lastUpdated: Date;
  contentAge: number;
  linkFreshness: number;
  technologyRelevance: number;
  accuracyScore: number;
}

// =============================================================================
// Core Content Optimizer Class
// =============================================================================

export class ContentOptimizer {
  private baseDir: string;

  constructor(baseDir: string = './') {
    this.baseDir = baseDir;
  }

  /**
   * Optimize a single content file
   */
  async optimizeContent(filePath: string): Promise<OptimizationResult> {
    const content = readFileSync(filePath, 'utf-8');
    const contentType = this.detectContentType(filePath);
    const metadata = this.extractMetadata(content);

    const result: OptimizationResult = {
      filePath,
      contentType,
      seoScore: 0,
      citationScore: 0,
      freshnessScore: 0,
      validationErrors: [],
      validationWarnings: [],
      recommendations: [],
    };

    // Run all optimization checks
    try {
      const seoMetrics = this.calculateSEOScore(content, metadata);
      const citationMetrics = this.calculateCitationScore(content);
      const freshnessMetrics = this.calculateFreshnessScore(filePath);

      result.seoScore = this.aggregateSEOScore(seoMetrics);
      result.citationScore = this.aggregateCitationScore(citationMetrics);
      result.freshnessScore = this.aggregateFreshnessScore(freshnessMetrics);

      // Generate recommendations
      result.recommendations = this.generateRecommendations(
        seoMetrics,
        citationMetrics,
        freshnessMetrics,
        contentType
      );

      // Validate content structure
      const validationResults = this.validateContent(content, contentType);
      result.validationErrors = validationResults.errors;
      result.validationWarnings = validationResults.warnings;
    } catch (error: any) {
      result.validationErrors.push(`Optimization failed: ${error.message || error}`);
    }

    return result;
  }

  /**
   * Optimize all content in the guides directory
   */
  async optimizeAllContent(): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];
    const seoDir = join(this.baseDir, 'seo');

    // Get all subdirectories in seo/
    const getAllMdxFiles = (dir: string): string[] => {
      const files: string[] = [];
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...getAllMdxFiles(fullPath));
          } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
      return files;
    };

    const contentFiles = getAllMdxFiles(seoDir);

    for (const file of contentFiles) {
      try {
        const result = await this.optimizeContent(file);
        results.push(result);
      } catch (error: any) {
        results.push({
          filePath: file,
          contentType: this.detectContentType(file),
          seoScore: 0,
          citationScore: 0,
          freshnessScore: 0,
          validationErrors: [`Failed to process: ${error.message || error}`],
          validationWarnings: [],
          recommendations: [],
        });
      }
    }

    return results;
  }

  // =============================================================================
  // Content Type Detection
  // =============================================================================

  private detectContentType(filePath: string): ContentType {
    if (filePath.includes('/tutorials/')) return 'tutorials';
    if (filePath.includes('/use-cases/')) return 'use-cases';
    if (filePath.includes('/comparisons/')) return 'comparisons';
    if (filePath.includes('/troubleshooting/')) return 'troubleshooting';
    if (filePath.includes('/categories/')) return 'categories';
    if (filePath.includes('/collections/')) return 'collections';
    if (filePath.includes('/workflows/')) return 'workflows';

    // Default fallback
    return 'tutorials';
  }

  // =============================================================================
  // Metadata Extraction
  // =============================================================================

  private extractMetadata(content: string): ContentMetadata {
    const metadata: ContentMetadata = {};

    // Safe extraction with proper null checks
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch || !frontmatterMatch[1]) {
      return metadata;
    }

    const frontmatter = frontmatterMatch[1];

    // Extract basic fields with proper validation
    const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
    if (titleMatch?.[1]) {
      metadata.title = titleMatch[1];
    }

    const descMatch = frontmatter.match(/description:\s*"([^"]+)"/);
    if (descMatch?.[1]) {
      metadata.description = descMatch[1];
    }

    const categoryMatch = frontmatter.match(/category:\s*"([^"]+)"/);
    if (categoryMatch?.[1]) {
      metadata.category = categoryMatch[1];
    }

    const difficultyMatch = frontmatter.match(/difficulty:\s*"([^"]+)"/);
    if (difficultyMatch?.[1]) {
      metadata.difficulty = difficultyMatch[1];
    }

    const readingTimeMatch = frontmatter.match(/readingTime:\s*"([^"]+)"/);
    if (readingTimeMatch?.[1]) {
      metadata.readingTime = readingTimeMatch[1];
    }

    // Extract keywords array with proper validation
    const keywordsMatch = frontmatter.match(/keywords:\s*\n((?:\s*-\s*"[^"]+"\n?)+)/);
    if (keywordsMatch?.[1]) {
      const keywordLines = keywordsMatch[1].match(/"([^"]+)"/g);
      if (keywordLines && keywordLines.length > 0) {
        metadata.keywords = keywordLines.map((k) => k.replace(/"/g, ''));
      }
    }

    return metadata;
  }

  // =============================================================================
  // SEO Scoring System
  // =============================================================================

  private calculateSEOScore(content: string, metadata: ContentMetadata): SEOMetrics {
    const metrics: SEOMetrics = {
      keywordDensity: 0,
      readabilityScore: 0,
      headingStructure: 0,
      internalLinks: 0,
      schemaMarkup: 0,
      metaOptimization: 0,
    };

    // Keyword density analysis
    if (metadata.keywords && metadata.keywords.length > 0) {
      const wordCount = content.split(/\s+/).length;
      let keywordOccurrences = 0;

      metadata.keywords.forEach((keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        keywordOccurrences += matches ? matches.length : 0;
      });

      const density = (keywordOccurrences / wordCount) * 100;
      // Optimal density: 1-3%
      metrics.keywordDensity =
        density >= 1 && density <= 3 ? 100 : Math.max(0, 100 - Math.abs(density - 2) * 25);
    }

    // Heading structure analysis
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    const h1Count = content.match(/^#\s+.+$/gm)?.length || 0;
    const h2Count = content.match(/^##\s+.+$/gm)?.length || 0;

    // Good structure: 1 H1, multiple H2s, logical hierarchy
    if (h1Count === 1 && h2Count >= 2 && headings.length >= 4) {
      metrics.headingStructure = 100;
    } else if (h1Count === 1 && h2Count >= 1) {
      metrics.headingStructure = 75;
    } else {
      metrics.headingStructure = 25;
    }

    // Internal link analysis
    const internalLinks = content.match(/\[([^\]]+)\]\(\/[^)]+\)/g) || [];
    metrics.internalLinks = Math.min(100, internalLinks.length * 20);

    // Schema markup analysis
    const schemaOccurrences = content.match(/itemScope|itemType|itemProp/g) || [];
    metrics.schemaMarkup = Math.min(100, schemaOccurrences.length * 5);

    // Meta optimization
    let metaScore = 0;
    if (metadata.title && metadata.title.length >= 30 && metadata.title.length <= 60)
      metaScore += 25;
    if (
      metadata.description &&
      metadata.description.length >= 120 &&
      metadata.description.length <= 160
    )
      metaScore += 25;
    if (metadata.keywords && metadata.keywords.length >= 3 && metadata.keywords.length <= 10)
      metaScore += 25;
    if (
      metadata.title &&
      metadata.keywords?.some((k) => metadata.title!.toLowerCase().includes(k.toLowerCase()))
    )
      metaScore += 25;
    metrics.metaOptimization = metaScore;

    // Readability analysis (simplified)
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    // Optimal: 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
      metrics.readabilityScore = 100;
    } else {
      metrics.readabilityScore = Math.max(0, 100 - Math.abs(avgWordsPerSentence - 17.5) * 5);
    }

    return metrics;
  }

  private aggregateSEOScore(metrics: SEOMetrics): number {
    const weights = {
      keywordDensity: 0.15,
      readabilityScore: 0.2,
      headingStructure: 0.2,
      internalLinks: 0.15,
      schemaMarkup: 0.2,
      metaOptimization: 0.1,
    };

    return Math.round(
      metrics.keywordDensity * weights.keywordDensity +
        metrics.readabilityScore * weights.readabilityScore +
        metrics.headingStructure * weights.headingStructure +
        metrics.internalLinks * weights.internalLinks +
        metrics.schemaMarkup * weights.schemaMarkup +
        metrics.metaOptimization * weights.metaOptimization
    );
  }

  // =============================================================================
  // AI Citation Scoring System (2025 Standards)
  // =============================================================================

  private calculateCitationScore(content: string): CitationMetrics {
    const metrics: CitationMetrics = {
      paragraphLength: 0,
      factualStatements: 0,
      sourceAttribution: 0,
      structuredData: 0,
      extractableContent: 0,
    };

    // Paragraph length analysis (60-100 words optimal for LLM extraction)
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    let optimalParagraphs = 0;

    paragraphs.forEach((paragraph) => {
      const words = paragraph.split(/\s+/).length;
      if (words >= 60 && words <= 100) {
        optimalParagraphs++;
      }
    });

    metrics.paragraphLength =
      paragraphs.length > 0 ? (optimalParagraphs / paragraphs.length) * 100 : 0;

    // Factual statements analysis (look for data, numbers, specific claims)
    const factualPatterns = [
      /\d+%/g, // Percentages
      /\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)/g, // Time measurements
      /\$\d+/g, // Prices
      /version\s+\d+/gi, // Version numbers
      /(according to|research shows|studies indicate|data reveals)/gi, // Research indicators
      /\d+\s*(users?|customers?|developers?|companies?)/g, // User metrics
    ];

    let factualCount = 0;
    factualPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      factualCount += matches ? matches.length : 0;
    });

    metrics.factualStatements = Math.min(100, factualCount * 10);

    // Source attribution analysis
    const sourcePatterns = [
      /\[RESEARCH:[^)]+\]/g, // Template research placeholders
      /Source:\s*[^\n]+/g, // Source citations
      /citation[^>]*>/g, // Schema citation markup
      /according to [A-Z][^.]+/g, // Attribution phrases
    ];

    let sourceCount = 0;
    sourcePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      sourceCount += matches ? matches.length : 0;
    });

    metrics.sourceAttribution = Math.min(100, sourceCount * 15);

    // Structured data analysis (Schema.org markup)
    const structuredElements = [
      /itemScope\s+itemType="https:\/\/schema\.org\/[^"]+"/g,
      /itemProp="[^"]+"/g,
      /<script[^>]*type="application\/ld\+json"[^>]*>/g,
    ];

    let structuredCount = 0;
    structuredElements.forEach((pattern) => {
      const matches = content.match(pattern);
      structuredCount += matches ? matches.length : 0;
    });

    metrics.structuredData = Math.min(100, structuredCount * 3);

    // Extractable content analysis (clear headings, lists, code blocks)
    const extractableElements = [
      /^#{2,3}\s+[^#\n]+$/gm, // H2-H3 headings
      /^\*\s+[^\n]+$/gm, // Bullet points
      /^\d+\.\s+[^\n]+$/gm, // Numbered lists
      /```[\s\S]*?```/g, // Code blocks
      /<Callout[^>]*>[\s\S]*?<\/Callout>/g, // Callout components
    ];

    let extractableCount = 0;
    extractableElements.forEach((pattern) => {
      const matches = content.match(pattern);
      extractableCount += matches ? matches.length : 0;
    });

    metrics.extractableContent = Math.min(100, extractableCount * 2);

    return metrics;
  }

  private aggregateCitationScore(metrics: CitationMetrics): number {
    const weights = {
      paragraphLength: 0.25,
      factualStatements: 0.2,
      sourceAttribution: 0.2,
      structuredData: 0.2,
      extractableContent: 0.15,
    };

    return Math.round(
      metrics.paragraphLength * weights.paragraphLength +
        metrics.factualStatements * weights.factualStatements +
        metrics.sourceAttribution * weights.sourceAttribution +
        metrics.structuredData * weights.structuredData +
        metrics.extractableContent * weights.extractableContent
    );
  }

  // =============================================================================
  // Content Freshness Scoring System
  // =============================================================================

  private calculateFreshnessScore(filePath: string): FreshnessMetrics {
    const now = new Date();
    const fileStats = statSync(filePath);
    const lastModified = fileStats.mtime;

    const metrics: FreshnessMetrics = {
      lastUpdated: lastModified,
      contentAge: 0,
      linkFreshness: 0,
      technologyRelevance: 0,
      accuracyScore: 0,
    };

    // Content age analysis
    const daysSinceUpdate = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 30) {
      metrics.contentAge = 100;
    } else if (daysSinceUpdate < 90) {
      metrics.contentAge = 80;
    } else if (daysSinceUpdate < 180) {
      metrics.contentAge = 60;
    } else if (daysSinceUpdate < 365) {
      metrics.contentAge = 40;
    } else {
      metrics.contentAge = 20;
    }

    // Link freshness (placeholder - would need actual link checking)
    metrics.linkFreshness = 75; // Assume most links are working

    // Technology relevance (check for current year, recent versions)
    const content = readFileSync(filePath, 'utf-8');
    const currentYear = now.getFullYear();
    const hasCurrentYear = content.includes(currentYear.toString());
    const hasRecentVersions = /version\s+[1-9]\d*\./gi.test(content);

    metrics.technologyRelevance = (hasCurrentYear ? 50 : 0) + (hasRecentVersions ? 50 : 0);

    // Accuracy score (based on structured content and fact patterns)
    const hasResearchPlaceholders = /\[RESEARCH:[^)]+\]/g.test(content);
    const hasSpecificData = /\d+%|\$\d+|version\s+\d+/gi.test(content);

    metrics.accuracyScore = (hasResearchPlaceholders ? 50 : 0) + (hasSpecificData ? 50 : 0);

    return metrics;
  }

  private aggregateFreshnessScore(metrics: FreshnessMetrics): number {
    const weights = {
      contentAge: 0.4,
      linkFreshness: 0.2,
      technologyRelevance: 0.25,
      accuracyScore: 0.15,
    };

    return Math.round(
      metrics.contentAge * weights.contentAge +
        metrics.linkFreshness * weights.linkFreshness +
        metrics.technologyRelevance * weights.technologyRelevance +
        metrics.accuracyScore * weights.accuracyScore
    );
  }

  // =============================================================================
  // Content Validation System
  // =============================================================================

  private validateContent(
    content: string,
    contentType: ContentType
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required frontmatter
    if (!content.startsWith('---')) {
      errors.push('Missing frontmatter section');
    }

    // Check for required components based on template type
    const requiredComponents = this.getRequiredComponents(contentType);
    requiredComponents.forEach((component) => {
      if (!content.includes(`<${component}`)) {
        warnings.push(`Missing recommended component: ${component}`);
      }
    });

    // Check for proper heading structure
    const h1Count = (content.match(/^#\s+/gm) || []).length;
    if (h1Count === 0) {
      errors.push('Missing H1 heading');
    } else if (h1Count > 1) {
      warnings.push('Multiple H1 headings detected');
    }

    // Check for [RESEARCH:] placeholders (should be filled)
    const researchPlaceholders = content.match(/\[RESEARCH:[^)]+\]/g);
    if (researchPlaceholders && researchPlaceholders.length > 0) {
      warnings.push(`${researchPlaceholders.length} research placeholders need to be filled`);
    }

    // Check for template-specific requirements
    this.validateTemplateSpecific(content, contentType, errors, warnings);

    return { errors, warnings };
  }

  private getRequiredComponents(contentType: ContentType): string[] {
    const common = ['TLDRSummary', 'AIOptimizedFAQ', 'RelatedResources'];

    switch (contentType) {
      case 'tutorials':
        return [...common, 'StepByStepGuide', 'CodeGroup', 'QuickReference'];
      case 'use-cases':
        return [...common, 'FeatureGrid', 'Tabs'];
      case 'comparisons':
        return [...common, 'Tabs', 'FeatureGrid'];
      case 'troubleshooting':
        return [...common, 'Accordion', 'Callout'];
      case 'categories':
        return [...common, 'FeatureGrid', 'Accordion'];
      case 'collections':
        return [...common, 'FeatureGrid'];
      case 'workflows':
        return [...common, 'StepByStepGuide', 'Tabs', 'CodeGroup'];
      default:
        return common;
    }
  }

  private validateTemplateSpecific(
    content: string,
    contentType: ContentType,
    _errors: string[],
    warnings: string[]
  ): void {
    switch (contentType) {
      case 'tutorials':
        if (!content.includes('Step-by-Step')) {
          warnings.push('Tutorial should include step-by-step instructions');
        }
        break;
      case 'comparisons':
        if (!content.includes('vs') && !content.includes('compared')) {
          warnings.push('Comparison content should include comparative language');
        }
        break;
      case 'troubleshooting':
        if (!content.includes('fix') && !content.includes('solve') && !content.includes('error')) {
          warnings.push('Troubleshooting content should include problem-solving language');
        }
        break;
    }
  }

  // =============================================================================
  // Recommendation Generation
  // =============================================================================

  private generateRecommendations(
    seo: SEOMetrics,
    citation: CitationMetrics,
    freshness: FreshnessMetrics,
    contentType: ContentType
  ): string[] {
    const recommendations: string[] = [];

    // SEO recommendations
    if (seo.keywordDensity < 50) {
      recommendations.push('Increase keyword density to 1-3% for better SEO');
    }
    if (seo.headingStructure < 75) {
      recommendations.push('Improve heading structure with clear H1 and multiple H2 sections');
    }
    if (seo.internalLinks < 60) {
      recommendations.push('Add more internal links to related content');
    }
    if (seo.schemaMarkup < 80) {
      recommendations.push('Add more Schema.org markup for better AI parsing');
    }

    // Citation recommendations
    if (citation.paragraphLength < 70) {
      recommendations.push('Optimize paragraph length to 60-100 words for AI citation');
    }
    if (citation.factualStatements < 60) {
      recommendations.push('Include more specific data points and metrics');
    }
    if (citation.sourceAttribution < 50) {
      recommendations.push('Add source citations and research attribution');
    }

    // Freshness recommendations
    if (freshness.contentAge < 60) {
      recommendations.push('Update content to reflect current information');
    }
    if (freshness.technologyRelevance < 70) {
      recommendations.push('Update version numbers and year references');
    }

    // Template-specific recommendations
    recommendations.push(...this.getTemplateSpecificRecommendations(contentType));

    return recommendations;
  }

  private getTemplateSpecificRecommendations(contentType: ContentType): string[] {
    switch (contentType) {
      case 'tutorials':
        return ['Include time estimates for each step', 'Add code examples and validation steps'];
      case 'use-cases':
        return [
          'Include ROI metrics and business impact data',
          'Add real-world implementation examples',
        ];
      case 'comparisons':
        return ['Include pricing and feature comparison tables', 'Add pros/cons analysis'];
      case 'troubleshooting':
        return ['Include common error messages and solutions', 'Add prevention strategies'];
      case 'workflows':
        return ['Include automation opportunities', 'Add integration examples'];
      default:
        return [];
    }
  }
}

// =============================================================================
// CLI Interface
// =============================================================================

export async function optimizeContentCLI(filePath?: string): Promise<void> {
  const optimizer = new ContentOptimizer();

  if (filePath) {
    // Optimize single file
    const result = await optimizer.optimizeContent(filePath);
    console.log(`\n📊 Content Optimization Report: ${result.filePath}`);
    console.log(`📂 Type: ${result.contentType}`);
    console.log(`🔍 SEO Score: ${result.seoScore}/100`);
    console.log(`🤖 Citation Score: ${result.citationScore}/100`);
    console.log(`📅 Freshness Score: ${result.freshnessScore}/100`);

    if (result.validationErrors.length > 0) {
      console.log(`\n❌ Errors (${result.validationErrors.length}):`);
      for (const error of result.validationErrors) {
        console.log(`  • ${error}`);
      }
    }

    if (result.validationWarnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.validationWarnings.length}):`);
      for (const warning of result.validationWarnings) {
        console.log(`  • ${warning}`);
      }
    }

    if (result.recommendations.length > 0) {
      console.log(`\n💡 Recommendations (${result.recommendations.length}):`);
      for (const rec of result.recommendations) {
        console.log(`  • ${rec}`);
      }
    }
  } else {
    // Optimize all content
    const results = await optimizer.optimizeAllContent();

    console.log(`\n📊 Content Optimization Summary (${results.length} files)`);
    console.log('='.repeat(60));

    const avgSEO = Math.round(results.reduce((sum, r) => sum + r.seoScore, 0) / results.length);
    const avgCitation = Math.round(
      results.reduce((sum, r) => sum + r.citationScore, 0) / results.length
    );
    const avgFreshness = Math.round(
      results.reduce((sum, r) => sum + r.freshnessScore, 0) / results.length
    );

    console.log(`🔍 Average SEO Score: ${avgSEO}/100`);
    console.log(`🤖 Average Citation Score: ${avgCitation}/100`);
    console.log(`📅 Average Freshness Score: ${avgFreshness}/100`);

    const totalErrors = results.reduce((sum, r) => sum + r.validationErrors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.validationWarnings.length, 0);

    console.log(`\n❌ Total Errors: ${totalErrors}`);
    console.log(`⚠️  Total Warnings: ${totalWarnings}`);

    // Show top issues
    if (totalErrors > 0) {
      console.log('\n🔥 Files with Errors:');
      const errorResults = results.filter((r) => r.validationErrors.length > 0).slice(0, 5);
      for (const r of errorResults) {
        console.log(`  • ${r.filePath} (${r.validationErrors.length} errors)`);
      }
    }

    // Show files needing attention
    const lowScoreFiles = results.filter((r) => r.seoScore < 70 || r.citationScore < 70);
    if (lowScoreFiles.length > 0) {
      console.log('\n📈 Files Needing Optimization:');
      const topLowScoreFiles = lowScoreFiles.slice(0, 5);
      for (const r of topLowScoreFiles) {
        console.log(`  • ${r.filePath} (SEO: ${r.seoScore}, Citation: ${r.citationScore})`);
      }
    }
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];
  optimizeContentCLI(filePath).catch(console.error);
}
