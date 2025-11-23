// -----------------------------------------------------------------------------
// Edge Route Configuration
// -----------------------------------------------------------------------------

export interface RouteConfig {
  name: string;
  path: string; // Path pattern (e.g. "/", "/status", "/search/autocomplete")
  methods: string[];
  handler: {
    import: string; // Path relative to public-api/index.ts
    function: string;
  };
  analytics?: string; // Defaults to name
  rateLimit?: 'public' | 'heavy' | 'indexnow';
}

export const ROUTES: RouteConfig[] = [
  {
    name: 'root',
    path: '/',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/root.ts', function: 'handleDirectoryIndex' },
  },
  {
    name: 'og-image',
    path: '/og',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/og/index.ts', function: 'handleOGImageRequest' },
  },
  {
    name: 'search-autocomplete',
    path: '/search/autocomplete',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/search/index.ts', function: 'handleAutocomplete' },
  },
  {
    name: 'search-facets',
    path: '/search/facets',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/search/index.ts', function: 'handleFacets' },
  },
  {
    name: 'search-main',
    path: '/search',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/search/index.ts', function: 'handleSearch' },
  },
  {
    name: 'transform-highlight',
    path: '/transform/highlight',
    methods: ['POST', 'OPTIONS'],
    handler: { import: './routes/transform/index.ts', function: 'handleContentHighlightRoute' },
  },
  {
    name: 'transform-process',
    path: '/transform/process',
    methods: ['POST', 'OPTIONS'],
    handler: { import: './routes/transform/index.ts', function: 'handleContentProcessRoute' },
  },
  // Complex nested routes like content-generate need careful handling in the generator
  // or manual override support. For now, we'll use path prefixes.
  {
    name: 'content-generate',
    path: '/content/generate-package',
    methods: ['POST', 'OPTIONS'],
    handler: { import: './routes/content-generate/index.ts', function: 'handleGeneratePackage' },
  },
  {
    name: 'content',
    path: '/content',
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    rateLimit: 'public', // Dynamic rate limit in current code, generator needs to support this or default safe
    handler: { import: './routes/content.ts', function: 'handleContentRoute' },
  },
  {
    name: 'feeds',
    path: '/feeds',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/feeds.ts', function: 'handleFeedsRoute' },
  },
  {
    name: 'seo',
    path: '/seo',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/seo.ts', function: 'handleSeoRoute' },
  },
  {
    name: 'sitemap',
    path: '/sitemap',
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    rateLimit: 'heavy', // Dynamic in current code
    handler: { import: './routes/sitemap.ts', function: 'handleSitemapRoute' },
  },
  {
    name: 'status',
    path: '/status',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/status.ts', function: 'handleStatusRoute' },
  },
  {
    name: 'company',
    path: '/company',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/company.ts', function: 'handleCompanyRoute' },
  },
  {
    name: 'trending',
    path: '/trending',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/trending.ts', function: 'handleTrendingRoute' },
  },
];
