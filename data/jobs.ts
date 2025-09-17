export interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  category: 'engineering' | 'design' | 'marketing' | 'sales' | 'support' | 'product';
  salary?: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  tags: string[];
  postedAt: string;
  expiresAt?: string;
  featured: boolean;
  applyUrl: string;
  contactEmail?: string;
}

// Example jobs for demonstration
export const jobs: Job[] = [
  {
    id: 'claude-ai-engineer-2025',
    slug: 'claude-ai-engineer-2025',
    title: 'Senior AI Engineer - Claude Integration Specialist',
    company: 'TechCorp AI',
    location: 'San Francisco, CA',
    remote: true,
    type: 'full-time',
    category: 'engineering',
    salary: '$180,000 - $250,000',
    description: `We're looking for a Senior AI Engineer with deep expertise in Claude and the Model Context Protocol (MCP) to lead our AI integration efforts. You'll work on cutting-edge projects implementing advanced Claude configurations, building custom MCP servers, and architecting AI-powered solutions.

This is a unique opportunity to work at the forefront of AI technology, directly impacting how businesses leverage Claude's capabilities. You'll collaborate with a talented team of engineers and researchers to push the boundaries of what's possible with AI assistants.`,
    requirements: [
      '5+ years of software engineering experience',
      'Deep understanding of Claude API and MCP protocol',
      'Experience building and deploying MCP servers',
      'Strong Python and TypeScript skills',
      'Experience with vector databases and embeddings',
      'Excellent problem-solving and communication skills',
    ],
    benefits: [
      'Competitive salary and equity',
      'Fully remote work',
      'Unlimited PTO',
      'Health, dental, and vision insurance',
      '$5,000 annual learning budget',
      'Latest AI tools and resources',
    ],
    tags: ['claude', 'mcp', 'ai', 'python', 'typescript', 'remote'],
    postedAt: '2025-09-10',
    featured: true,
    applyUrl: 'https://example.com/careers/claude-engineer',
    contactEmail: 'careers@techcorpai.com',
  },
  {
    id: 'mcp-developer-startup',
    slug: 'mcp-developer-startup',
    title: 'MCP Server Developer - Early Stage Startup',
    company: 'CloudMind Solutions',
    location: 'New York, NY',
    remote: true,
    type: 'full-time',
    category: 'engineering',
    salary: '$140,000 - $180,000',
    description: `Join our early-stage startup as we build the next generation of MCP servers for enterprise clients. We're creating innovative solutions that extend Claude's capabilities for specific industries including healthcare, finance, and legal.

As one of our first engineers, you'll have significant ownership and impact on our technical direction. You'll design and implement MCP servers, create documentation, and work directly with clients to understand their needs.`,
    requirements: [
      '3+ years of backend development experience',
      'Experience with MCP server development',
      'Strong Node.js/TypeScript skills',
      'Understanding of API design and microservices',
      'Experience with PostgreSQL and Redis',
      'Startup experience preferred',
    ],
    benefits: [
      'Competitive salary with equity',
      'Remote-first culture',
      'Flexible hours',
      'Health benefits',
      'Equipment stipend',
      'Conference attendance budget',
    ],
    tags: ['mcp', 'nodejs', 'typescript', 'startup', 'remote'],
    postedAt: '2025-09-12',
    featured: true,
    applyUrl: 'https://example.com/join-cloudmind',
    contactEmail: 'jobs@cloudmind.ai',
  },
  {
    id: 'ai-prompt-engineer',
    slug: 'ai-prompt-engineer',
    title: 'AI Prompt Engineer - Contract Position',
    company: 'Prompt Masters Inc',
    location: 'Remote',
    remote: true,
    type: 'contract',
    category: 'engineering',
    salary: '$100/hour',
    description: `We're seeking an experienced AI Prompt Engineer to help our clients optimize their Claude configurations and create effective prompt strategies. This is a 6-month contract position with potential for extension or full-time conversion.

You'll work with various clients to understand their needs, design custom Claude rules and agents, and provide training on best practices for AI interaction. This role requires both technical skills and excellent communication abilities.`,
    requirements: [
      '2+ years of experience with AI/LLM systems',
      'Proven track record creating Claude configurations',
      'Strong writing and documentation skills',
      'Experience with prompt engineering best practices',
      'Ability to explain technical concepts to non-technical stakeholders',
      'Self-motivated and able to work independently',
    ],
    tags: ['claude', 'prompt-engineering', 'ai', 'contract', 'remote'],
    postedAt: '2025-09-14',
    featured: false,
    applyUrl: 'https://example.com/prompt-engineer-contract',
    contactEmail: 'contracts@promptmasters.ai',
  },
];

// Helper function to get a job by slug
export function getJobBySlug(slug: string): Job | undefined {
  return jobs.find((job) => job.slug === slug);
}

// Helper function to get featured jobs
export function getFeaturedJobs(): Job[] {
  return jobs.filter((job) => job.featured);
}

// Helper function to get jobs by category
export function getJobsByCategory(category: string): Job[] {
  return jobs.filter((job) => job.category === category);
}
