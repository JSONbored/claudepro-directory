export interface Author {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  website?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  company?: string;
  location?: string;
  joinedAt: string;
  totalContributions: number;
  featuredContributions: number;
  categories: string[];
  verified: boolean;
}

// Sample authors data - in production this would sync with GitHub contributors
export const authors: Author[] = [
  {
    id: '1',
    name: 'Alex Chen',
    username: 'alexchen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'AI researcher and prompt engineering enthusiast. Creating Claude configurations for better developer productivity.',
    website: 'https://alexchen.dev',
    github: 'alexchen',
    twitter: 'alexchen_ai',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    joinedAt: '2023-06-15',
    totalContributions: 12,
    featuredContributions: 3,
    categories: ['development', 'analysis'],
    verified: true
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    username: 'sarahj',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Technical writer and documentation expert. Focused on making AI accessible through clear communication.',
    github: 'sarahj-writes',
    linkedin: 'sarah-johnson-writer',
    company: 'GitLab',
    location: 'Remote',
    joinedAt: '2023-08-22',
    totalContributions: 8,
    featuredContributions: 2,
    categories: ['writing', 'creative'],
    verified: true
  },
  {
    id: '3',
    name: 'Marcus Rodriguez',
    username: 'mrodriguez',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Full-stack developer with a passion for AI integration. Building tools that make Claude more useful for everyone.',
    github: 'mrodriguez-dev',
    twitter: 'marcus_codes',
    website: 'https://marcusdev.io',
    location: 'Austin, TX',
    joinedAt: '2023-07-10',
    totalContributions: 15,
    featuredContributions: 4,
    categories: ['development', 'business'],
    verified: false
  },
  {
    id: '4',
    name: 'Dr. Emily Watson',
    username: 'ewatson',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    bio: 'Research scientist specializing in human-AI interaction. Creating configurations for academic and research use cases.',
    linkedin: 'emily-watson-phd',
    company: 'Stanford University',
    location: 'Palo Alto, CA',
    joinedAt: '2023-09-05',
    totalContributions: 6,
    featuredContributions: 2,
    categories: ['analysis', 'other'],
    verified: true
  },
  {
    id: '5',
    name: 'James Kim',
    username: 'jamesK',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    bio: 'Product manager and AI enthusiast. Sharing configurations that help teams be more productive.',
    github: 'jamesK-pm',
    twitter: 'james_kim_pm',
    company: 'Notion',
    location: 'San Francisco, CA',
    joinedAt: '2023-05-30',
    totalContributions: 10,
    featuredContributions: 1,
    categories: ['business', 'creative'],
    verified: false
  }
];

export const getAuthorByUsername = (username: string): Author | undefined => {
  return authors.find(author => author.username === username);
};

export const getAuthorsByCategory = (category: string): Author[] => {
  return authors.filter(author => author.categories.includes(category));
};

export const getTopContributors = (limit = 10): Author[] => {
  return authors
    .sort((a, b) => b.totalContributions - a.totalContributions)
    .slice(0, limit);
};

export const getFeaturedAuthors = (): Author[] => {
  return authors.filter(author => author.verified && author.featuredContributions > 0);
};