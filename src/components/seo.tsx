import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: object;
  noIndex?: boolean;
}

const defaultMeta = {
  title: 'Claude Pro Directory',
  description:
    'Discover and share the best Claude configurations. Explore expert rules, browse powerful MCP servers, find specialized agents and commands, discover automation hooks, and connect with the community building the future of AI.',
  keywords: [
    'Claude',
    'AI',
    'configurations',
    'MCP',
    'agents',
    'automation',
    'rules',
    'commands',
    'hooks',
  ],
  author: 'Claude Pro Directory',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image' as const,
};

export function SEO({
  title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  author = defaultMeta.author,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = defaultMeta.ogImage,
  ogType = 'website',
  twitterCard = defaultMeta.twitterCard,
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData,
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${defaultMeta.title}` : defaultMeta.title;
  const finalOgTitle = ogTitle || title || defaultMeta.title;
  const finalOgDescription = ogDescription || description;
  const finalTwitterTitle = twitterTitle || finalOgTitle;
  const finalTwitterDescription = twitterDescription || finalOgDescription;
  const finalTwitterImage = twitterImage || ogImage;

  const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="author" content={author} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={defaultMeta.title} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={finalTwitterDescription} />
      <meta name="twitter:image" content={finalTwitterImage} />

      {/* Additional Meta for SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="en" />
      <meta name="theme-color" content="#000000" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}

// Helper function to generate structured data for content pages
export function generateContentStructuredData(content: {
  title: string;
  description: string;
  author: string;
  dateAdded: string;
  category: string;
  tags: string[];
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: content.title,
    description: content.description,
    author: {
      '@type': 'Person',
      name: content.author,
    },
    datePublished: content.dateAdded,
    applicationCategory: content.category,
    keywords: content.tags.join(', '),
    url: content.url,
    operatingSystem: 'Web',
    applicationSubCategory: 'AI Configuration',
  };
}

// Helper function for website structured data
export function generateWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: defaultMeta.title,
    description: defaultMeta.description,
    url: 'https://claudepro-directory.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://claudepro-directory.vercel.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: defaultMeta.title,
      description: 'Community-driven directory for Claude AI configurations',
    },
  };
}
