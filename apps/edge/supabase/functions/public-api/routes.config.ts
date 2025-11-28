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
    name: 'og-image',
    path: '/og',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    handler: { import: './routes/og/index.ts', function: 'handleOGImageRequest' },
  },
  {
    name: 'transform-image',
    path: '/transform/image',
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    handler: { import: './routes/transform/index.ts', function: 'handleTransformImageRoute' },
  },
  // Complex nested routes like content-generate need careful handling in the generator
  // or manual override support. For now, we'll use path prefixes.
  {
    name: 'content-generate',
    path: '/content/generate-package',
    methods: ['POST', 'OPTIONS'],
    handler: { import: './routes/content-generate/index.ts', function: 'handleGeneratePackage' },
  },
];
