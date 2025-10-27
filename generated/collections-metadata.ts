/**
 * Auto-generated metadata file
 * Category: Collections
 * Generated: 2025-10-23T12:46:56.704Z
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { CollectionContent } from '@/src/lib/schemas/content/collection.schema';

export type CollectionMetadata = Pick<CollectionContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source' | 'collectionType' | 'difficulty' | 'estimatedSetupTime'>;

export const collectionsMetadata: CollectionMetadata[] = [
  {
    "slug": "api-development-starter-kit",
    "title": "API Development Starter Kit",
    "seoTitle": "API Development Kit",
    "description": "Complete toolkit for building and documenting RESTful APIs with automated testing and documentation generation. Perfect for backend developers starting new API projects.",
    "author": "JSONbored",
    "tags": [
      "api",
      "backend",
      "rest",
      "development",
      "documentation",
      "testing"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "starter-kit",
    "difficulty": "beginner",
    "estimatedSetupTime": "20 minutes"
  },
  {
    "slug": "aws-cloud-infrastructure-bundle",
    "title": "AWS Cloud Infrastructure Bundle",
    "seoTitle": "AWS Infra Bundle",
    "description": "Complete AWS infrastructure management toolkit combining cloud architecture expertise, CloudFormation validation, and AWS services integration. Perfect for teams building and maintaining cloud-native applications on AWS.",
    "author": "JSONbored",
    "tags": [
      "aws",
      "cloud",
      "infrastructure",
      "devops",
      "cloudformation",
      "serverless"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "use-case",
    "difficulty": "advanced",
    "estimatedSetupTime": "40 minutes"
  },
  {
    "slug": "backend-development-suite",
    "title": "Backend Development Suite",
    "seoTitle": "Backend Development",
    "description": "Full-featured backend development environment combining architecture planning, database design, and cloud services integration. Perfect for building scalable server-side applications.",
    "author": "JSONbored",
    "tags": [
      "backend",
      "architecture",
      "database",
      "cloud",
      "aws",
      "infrastructure"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "use-case",
    "difficulty": "advanced",
    "estimatedSetupTime": "30 minutes"
  },
  {
    "slug": "code-quality-toolkit",
    "title": "Code Quality & Review Toolkit",
    "seoTitle": "Code Quality & Review",
    "description": "Comprehensive suite of tools for maintaining high code quality through automated reviews, testing, and best practice enforcement. Essential for teams focused on code excellence.",
    "author": "JSONbored",
    "tags": [
      "code-quality",
      "review",
      "testing",
      "best-practices",
      "refactoring"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "workflow",
    "difficulty": "intermediate",
    "estimatedSetupTime": "15 minutes"
  },
  {
    "slug": "content-creation-workflow",
    "title": "Content Creation Workflow",
    "seoTitle": "Content Creation",
    "description": "Streamlined workflow for content creators and marketers. Manage projects across multiple platforms, design graphics, and automate content distribution with integrated tools.",
    "author": "JSONbored",
    "tags": [
      "content",
      "marketing",
      "design",
      "workflow",
      "automation",
      "social-media"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "workflow",
    "difficulty": "beginner",
    "estimatedSetupTime": "25 minutes"
  },
  {
    "slug": "data-engineering-suite",
    "title": "Data Engineering Suite",
    "seoTitle": "Data Engineering Suite",
    "description": "Comprehensive toolkit for data engineers working with databases, ETL pipelines, and data infrastructure. Includes database design, optimization, and cloud services integration.",
    "author": "JSONbored",
    "tags": [
      "data",
      "database",
      "etl",
      "sql",
      "cloud",
      "engineering"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "use-case",
    "difficulty": "intermediate",
    "estimatedSetupTime": "30 minutes"
  },
  {
    "slug": "debugging-troubleshooting-system",
    "title": "Debugging & Troubleshooting System",
    "seoTitle": "Debug & Troubleshoot",
    "description": "Complete debugging toolkit for identifying, analyzing, and resolving complex software issues. Combines AI-assisted debugging with powerful diagnostic commands.",
    "author": "JSONbored",
    "tags": [
      "debugging",
      "troubleshooting",
      "error-handling",
      "diagnostics",
      "problem-solving"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "advanced-system",
    "difficulty": "intermediate",
    "estimatedSetupTime": "10 minutes"
  },
  {
    "slug": "developer-productivity-booster",
    "title": "Developer Productivity Booster",
    "seoTitle": "Productivity Booster",
    "description": "Maximize your development efficiency with automated workflows, smart backups, code formatting, and enhanced visual feedback. This collection combines productivity hooks, informative statuslines, and time-saving commands for a streamlined development experience.",
    "author": "JSONbored",
    "tags": [
      "productivity",
      "automation",
      "workflow",
      "efficiency",
      "developer-tools"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "workflow",
    "difficulty": "beginner",
    "estimatedSetupTime": "15 minutes"
  },
  {
    "slug": "production-readiness-toolkit",
    "title": "Production Readiness Toolkit",
    "seoTitle": "Production Toolkit",
    "description": "Comprehensive system for ensuring code quality, security, and compliance before production deployment. Includes automated code reviews, complexity monitoring, backup strategies, and production-grade rules for professional development teams.",
    "author": "JSONbored",
    "tags": [
      "production",
      "code-quality",
      "security",
      "compliance",
      "deployment",
      "best-practices"
    ],
    "category": "collections",
    "dateAdded": "2025-10-02",
    "source": "community",
    "collectionType": "advanced-system",
    "difficulty": "advanced",
    "estimatedSetupTime": "45 minutes"
  }
];

export const collectionsMetadataBySlug = new Map(collectionsMetadata.map(item => [item.slug, item]));

export function getCollectionMetadataBySlug(slug: string): CollectionMetadata | null {
  return collectionsMetadataBySlug.get(slug) || null;
}
