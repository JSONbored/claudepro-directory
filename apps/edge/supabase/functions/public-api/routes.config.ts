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
  // Queue processing routes (migrated from flux-station)
  {
    name: 'embedding-process',
    path: '/embedding/process',
    methods: ['POST', 'OPTIONS'],
    handler: { import: './routes/embedding/index.ts', function: 'handleEmbeddingGenerationQueue' },
    rateLimit: 'heavy',
  },
  {
    name: 'embedding-webhook',
    path: '/embedding/webhook',
    methods: ['POST', 'OPTIONS'],
    handler: { import: './routes/embedding/index.ts', function: 'handleEmbeddingWebhook' },
    rateLimit: 'public',
  },
  {
    name: 'image-generation-process',
    path: '/image-generation/process',
    methods: ['POST', 'OPTIONS'],
    handler: { import: './routes/image-generation/index.ts', function: 'handleImageGenerationQueue' },
    rateLimit: 'heavy',
  },
];
