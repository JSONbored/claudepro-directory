// Shared SEO utilities for all content generators
// Ensures consistency while maintaining category-specific targeting

export interface SEOConfig {
  category: string;
  title: string;
  description: string;
  keyword: string;
  tags: string[];
  relatedCategories: string[];
  baseUrl: string;
  examples?: Array<{
    title: string;
    description: string;
    prompt?: string;
  }>;
}

export interface PageData {
  title: string;
  description: string;
  url: string;
  category: string;
  keyword: string;
  wordCount?: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

// Generate comprehensive long-tail keywords for any category
export function generateLongTailKeywords(config: SEOConfig): string[] {
  const { category, keyword } = config;

  return [
    // How-to queries (highest conversion)
    `how to configure claude for ${keyword}`,
    `how to setup ${category} for ${keyword}`,
    `how to use claude ${category} for ${keyword}`,

    // Best queries (comparison intent)
    `best claude ${category} for ${keyword}`,
    `best ${category} for claude ${keyword}`,
    `top claude ${category} ${new Date().getFullYear()}`,

    // Tutorial queries (learning intent)
    `claude ${category} tutorial ${new Date().getFullYear()}`,
    `${keyword} claude configuration guide`,
    `claude ${category} setup tutorial`,

    // Problem-solving queries (support intent)
    `claude ${category} not working`,
    `${category} claude troubleshooting`,
    `fix claude ${category} issues`,

    // Professional/advanced queries
    `professional claude ${category} for ${keyword}`,
    `advanced claude ${category} configuration`,
    `enterprise claude ${category} setup`,

    // Specific use case queries
    `claude ${category} for ${keyword} projects`,
    `${keyword} automation with claude ${category}`,
    `claude ${category} ${keyword} integration`,
  ];
}

// Create comprehensive Article schema
export function createArticleSchema(pageData: PageData, keywords: string[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageData.title,
    description: pageData.description,
    author: {
      '@type': 'Organization',
      name: 'Claude Pro Directory',
      url: 'https://claudepro.directory',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Claude Pro Directory',
      logo: {
        '@type': 'ImageObject',
        url: 'https://claudepro.directory/logo.png',
      },
    },
    datePublished: new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageData.url,
    },
    articleSection: `Claude ${pageData.category.charAt(0).toUpperCase() + pageData.category.slice(1)} Guides`,
    keywords: keywords.join(', '),
    wordCount: pageData.wordCount || 2500,
    inLanguage: 'en-US',
    about: [
      {
        '@type': 'Thing',
        name: 'Claude AI',
        description: "Anthropic's AI assistant",
      },
      {
        '@type': 'Thing',
        name: pageData.title,
        description: pageData.description,
      },
    ],
  };
}

// Create FAQ schema for rich snippets
export function createFAQSchema(faqs: FAQ[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Create HowTo schema for tutorial content
export function createHowToSchema(title: string, description: string, steps: HowToStep[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description: description,
    image: 'https://claudepro.directory/tutorial-image.png',
    totalTime: 'PT5M', // 5 minutes average setup time
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0', // Free setup
    },
    supply: [
      {
        '@type': 'HowToSupply',
        name: 'Claude Desktop or Claude Pro access',
      },
    ],
    tool: [
      {
        '@type': 'HowToTool',
        name: 'Text editor or Claude interface',
      },
    ],
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  };
}

// Create Product schema for individual items
export function createProductSchema(itemData: {
  name: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  url: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: itemData.name,
    description: itemData.description,
    applicationCategory: `Claude ${itemData.category}`,
    operatingSystem: 'Cross-platform',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    creator: {
      '@type': 'Person',
      name: itemData.author,
    },
    keywords: itemData.tags.join(', '),
    url: itemData.url,
    softwareVersion: '1.0',
    datePublished: new Date().toISOString().split('T')[0],
  };
}

// Create BreadcrumbList schema for navigation
export function createBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

// Generate standard FAQs for any category
export function generateStandardFAQs(config: SEOConfig): FAQ[] {
  const { category, keyword } = config;

  return [
    {
      question: `What are Claude ${category} and why do they matter?`,
      answer: `Claude ${category} are specialized configurations that enhance Claude's capabilities for specific domains like ${keyword}. They provide consistent, expert-level responses by defining context, expertise areas, and response patterns upfront.`,
    },
    {
      question: `How long does it take to set up Claude ${category} for ${keyword}?`,
      answer: `Most users complete the setup in under 2 minutes. Simply copy the configuration from our directory and paste it into Claude Desktop's configuration file or start your web conversation with the system prompt.`,
    },
    {
      question: `Can I use multiple ${keyword} ${category} together?`,
      answer: `Yes! Many professionals combine complementary ${category}. For example, pairing a primary ${keyword} ${category} with a code review or project management configuration creates comprehensive expertise coverage.`,
    },
    {
      question: `Do Claude ${category} work with both Claude Desktop and Claude Pro web?`,
      answer: `Absolutely. ${category.charAt(0).toUpperCase() + category.slice(1)} work with both platforms, though the setup process differs slightly. Desktop users add configurations to their config file, while web users start conversations with the system prompt.`,
    },
    {
      question: `How often should I update my ${keyword} ${category}?`,
      answer: `${category.charAt(0).toUpperCase() + category.slice(1)} are designed to be evergreen, but we recommend checking for updates quarterly. Our community continuously refines configurations based on real-world usage and feedback.`,
    },
  ];
}

// Generate cross-category internal links
export function generateInternalLinks(config: SEOConfig): {
  essential: Array<{ title: string; url: string; description: string }>;
  related: Array<{ title: string; url: string; description: string }>;
  combinations: Array<{ title: string; url: string; description: string }>;
  community: Array<{ title: string; url: string; description: string }>;
} {
  const { category, keyword, relatedCategories } = config;

  return {
    essential: [
      {
        title: `Complete Claude ${category.charAt(0).toUpperCase() + category.slice(1)} Setup Guide`,
        url: `/guides/tutorials/claude-${category}-setup`,
        description: 'Master the basics of configuration and setup',
      },
      {
        title: `Claude Configuration Best Practices`,
        url: `/guides/best-practices/claude-configuration`,
        description: 'Optimize your setup for maximum effectiveness',
      },
      {
        title: `Troubleshooting Common Issues`,
        url: `/guides/troubleshooting/claude-${category}`,
        description: 'Solve setup problems and common errors',
      },
    ],
    related: relatedCategories.map((relatedCategory) => ({
      title: `${relatedCategory.charAt(0).toUpperCase() + relatedCategory.slice(1)} for ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`,
      url: `/guides/categories/${relatedCategory}-for-${keyword}`,
      description: `Specialized ${relatedCategory} configurations for ${keyword} professionals`,
    })),
    combinations: [
      {
        title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} + Code Review Configuration`,
        url: `/guides/combinations/${keyword}-code-review`,
        description: 'Comprehensive quality assurance setup',
      },
      {
        title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} + Project Management`,
        url: `/guides/combinations/${keyword}-project-management`,
        description: 'End-to-end workflow optimization',
      },
      {
        title: `Multi-${category.charAt(0).toUpperCase() + category.slice(1)} Configuration Guide`,
        url: `/guides/advanced/multi-${category}-configuration`,
        description: 'Professional-grade setup strategies',
      },
    ],
    community: [
      {
        title: `Submit Your ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        url: '/submit',
        description: 'Share your successful configurations with the community',
      },
      {
        title: 'Success Stories',
        url: '/success-stories',
        description: 'Real-world transformation examples',
      },
      {
        title: 'Discord Community',
        url: 'https://discord.gg/claude-pro',
        description: 'Get help from fellow users and experts',
      },
      {
        title: 'Monthly Reviews',
        url: '/blog/monthly-reviews',
        description: 'Latest community insights and updates',
      },
    ],
  };
}

// Generate realistic setup information (no fake metrics)
export function generateSetupInfo(
  _category: string,
  _keyword: string
): {
  setupTime: string;
  maintenance: string;
  difficulty: string;
  compatibility: string;
} {
  return {
    setupTime: 'Under 5 minutes',
    maintenance: 'Minimal ongoing maintenance',
    difficulty: 'Beginner-friendly',
    compatibility: 'Works with Claude Desktop & Claude Code',
  };
}
