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
    featured: true
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
    featured: false
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
    featured: false
  }
];

export const getJobBySlug = (slug: string): Job | undefined => {
  return jobs.find(job => job.slug === slug);
};

export const getJobsByCategory = (category: string): Job[] => {
  return jobs.filter(job => job.category === category);
};

export const getFeaturedJobs = (): Job[] => {
  return jobs.filter(job => job.featured);
};

export const getRemoteJobs = (): Job[] => {
  return jobs.filter(job => job.remote);
};