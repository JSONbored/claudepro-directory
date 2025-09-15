export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'remote';
  description: string;
  requirements: string[];
  tags: string[];
  salary?: string;
  slug: string;
  category: 'engineering' | 'design' | 'product' | 'marketing' | 'sales' | 'other';
  postedAt: string;
  expiresAt?: string;
  applyUrl: string;
  companyLogo?: string;
  companyDescription?: string;
  remote: boolean;
  featured: boolean;
  // Job approval and moderation fields
  approved: boolean;
  sponsored: boolean;
  priority: number; // Higher numbers show first (sponsored jobs get priority)
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Sample jobs data - in production this would come from GitHub or a CMS
export const jobs: Job[] = [
  {
    id: '1',
    title: 'Senior AI Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    type: 'full-time',
    description: 'Join our team building the next generation of AI safety tools. You\'ll work on Claude\'s core capabilities and help ensure AI systems remain helpful, harmless, and honest.',
    requirements: [
      '5+ years of experience in machine learning',
      'Strong Python programming skills',
      'Experience with transformer architectures',
      'PhD in Computer Science, ML, or related field preferred'
    ],
    tags: ['AI', 'Machine Learning', 'Python', 'Research'],
    salary: '$200,000 - $350,000',
    slug: 'senior-ai-engineer-anthropic',
    category: 'engineering',
    postedAt: '2024-01-15',
    applyUrl: 'https://anthropic.com/careers',
    companyDescription: 'Anthropic is an AI safety company that builds reliable, interpretable, and steerable AI systems.',
    remote: false,
    featured: true,
    approved: true,
    sponsored: true,
    priority: 10,
    approvedBy: 'admin',
    approvedAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Claude Integration Specialist',
    company: 'Claude Consulting',
    location: 'Remote',
    type: 'contract',
    description: 'Help enterprises integrate Claude AI into their workflows. Design custom rules and configurations for maximum productivity.',
    requirements: [
      'Experience with Claude API',
      'Strong understanding of prompt engineering',
      'Previous consulting experience',
      'Excellent communication skills'
    ],
    tags: ['Claude', 'Consulting', 'API Integration', 'Prompt Engineering'],
    salary: '$100 - $200/hour',
    slug: 'claude-integration-specialist',
    category: 'engineering',
    postedAt: '2024-01-14',
    applyUrl: 'mailto:jobs@claudeconsulting.com',
    remote: true,
    featured: false,
    approved: true,
    sponsored: false,
    priority: 5,
    approvedBy: 'admin',
    approvedAt: '2024-01-14'
  },
  {
    id: '3',
    title: 'AI Product Designer',
    company: 'Future Labs',
    location: 'New York, NY',
    type: 'full-time',
    description: 'Design intuitive interfaces for AI-powered products. Work closely with our engineering team to create delightful user experiences.',
    requirements: [
      '3+ years of product design experience',
      'Experience designing for AI/ML products',
      'Proficiency in Figma and design systems',
      'Understanding of human-AI interaction patterns'
    ],
    tags: ['Design', 'UI/UX', 'AI', 'Figma'],
    salary: '$130,000 - $180,000',
    slug: 'ai-product-designer',
    category: 'design',
    postedAt: '2024-01-13',
    applyUrl: 'https://futurelabs.com/careers',
    remote: true,
    featured: false,
    approved: true,
    sponsored: false,
    priority: 3,
    approvedBy: 'admin',
    approvedAt: '2024-01-13'
  }
];

export const getJobBySlug = (slug: string): Job | undefined => {
  return getApprovedJobs().find(job => job.slug === slug);
};

export const getJobsByCategory = (category: string): Job[] => {
  return getApprovedJobs().filter(job => job.category === category);
};

export const getFeaturedJobs = (): Job[] => {
  return getApprovedJobs().filter(job => job.featured);
};

export const getRemoteJobs = (): Job[] => {
  return getApprovedJobs().filter(job => job.remote);
};

// Core function to filter only approved jobs
export const getApprovedJobs = (): Job[] => {
  return jobs
    .filter(job => job.approved)
    .sort((a, b) => {
      // Sort by priority (sponsored jobs first), then by date
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
};

// Admin functions for managing jobs (would be protected in production)
export const getAllJobs = (): Job[] => {
  return jobs;
};

export const getPendingJobs = (): Job[] => {
  return jobs.filter(job => !job.approved);
};