'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { JobCard } from './job-card';

const meta = {
  title: 'Cards/JobCard',
  component: JobCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Job listing card component with company logo, location, salary, job type, and action buttons. Features responsive layout with hover effects and badge system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    job: {
      control: 'object',
      description: 'Job data object',
    },
  },
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default job card
 */
export const Default: Story = {
  args: {
    job: {
      slug: 'senior-ai-engineer',
      title: 'Senior AI Engineer',
      company: 'TechCorp Inc.',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=techcorp',
      location: 'San Francisco, CA',
      type: 'full-time',
      remote: true,
      salary: '$150k - $200k',
      description:
        'We are looking for a Senior AI Engineer to join our team and help build the next generation of AI-powered products. You will work with cutting-edge technologies and collaborate with a talented team.',
      tags: ['Python', 'TensorFlow', 'LLMs', 'Machine Learning', 'AWS'],
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Featured job listing
 */
export const Featured: Story = {
  args: {
    job: {
      slug: 'ml-researcher',
      title: 'Machine Learning Researcher',
      company: 'AI Labs',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=ailabs',
      location: 'Remote',
      type: 'full-time',
      remote: true,
      salary: '$180k - $250k',
      description:
        'Join our research team to push the boundaries of machine learning. Work on cutting-edge projects in natural language processing, computer vision, and reinforcement learning.',
      tags: ['Research', 'Deep Learning', 'PyTorch', 'NLP', 'Computer Vision'],
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      applyUrl: 'https://example.com/apply',
      featured: true,
    },
  },
};

/**
 * Contract position
 */
export const Contract: Story = {
  args: {
    job: {
      slug: 'freelance-ai-consultant',
      title: 'AI Consultant',
      company: 'Consulting Partners',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=consulting',
      location: 'New York, NY',
      type: 'contract',
      remote: false,
      salary: '$100/hour',
      description:
        'Seeking an experienced AI consultant to help our clients integrate AI solutions into their businesses. Must have strong communication skills and proven track record.',
      tags: ['Consulting', 'AI Strategy', 'Client Facing', 'Project Management'],
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Part-time position
 */
export const PartTime: Story = {
  args: {
    job: {
      slug: 'part-time-ml-engineer',
      title: 'Part-Time ML Engineer',
      company: 'StartupXYZ',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=startupxyz',
      location: 'Austin, TX',
      type: 'part-time',
      remote: true,
      salary: '$60k - $80k',
      description:
        'Looking for a part-time ML engineer to help build our recommendation system. Flexible hours, perfect for someone looking for work-life balance.',
      tags: ['Recommendation Systems', 'Scikit-learn', 'Flask', 'Docker'],
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Internship position
 */
export const Internship: Story = {
  args: {
    job: {
      slug: 'ai-research-intern',
      title: 'AI Research Intern',
      company: 'University Lab',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=unilab',
      location: 'Boston, MA',
      type: 'internship',
      remote: false,
      description:
        'Summer internship opportunity in our AI research lab. Work alongside PhD researchers on cutting-edge projects. Great learning experience for students.',
      tags: ['Research', 'Python', 'Academic', 'Learning'],
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Without salary information
 */
export const NoSalary: Story = {
  args: {
    job: {
      slug: 'ai-engineer',
      title: 'AI Engineer',
      company: 'Enterprise Corp',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=enterprise',
      location: 'Seattle, WA',
      type: 'full-time',
      remote: true,
      description:
        'Join our team to build enterprise-scale AI solutions. We offer competitive compensation and excellent benefits.',
      tags: ['Enterprise', 'Azure', 'MLOps', 'CI/CD'],
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * Many tags (overflow scenario)
 */
export const ManyTags: Story = {
  args: {
    job: {
      slug: 'full-stack-ai-engineer',
      title: 'Full-Stack AI Engineer',
      company: 'Tech Innovators',
      companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=techinnovators',
      location: 'Remote',
      type: 'full-time',
      remote: true,
      salary: '$140k - $180k',
      description:
        'We need a versatile engineer who can work across the stack. From frontend to ML models to infrastructure.',
      tags: [
        'Python',
        'TypeScript',
        'React',
        'FastAPI',
        'PyTorch',
        'AWS',
        'Docker',
        'Kubernetes',
        'PostgreSQL',
        'Redis',
      ],
      postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows how the card handles overflow when there are many tags (shows first 4 + count).',
      },
    },
  },
};

/**
 * Without company logo
 */
export const NoLogo: Story = {
  args: {
    job: {
      slug: 'prompt-engineer',
      title: 'Prompt Engineer',
      company: 'AI Startup',
      location: 'Los Angeles, CA',
      type: 'full-time',
      remote: true,
      salary: '$120k - $160k',
      description:
        'Help us design and optimize prompts for our AI products. Experience with LLMs required.',
      tags: ['LLMs', 'Prompt Engineering', 'GPT-4', 'Claude', 'API Integration'],
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      applyUrl: 'https://example.com/apply',
      featured: false,
    },
  },
};

/**
 * All job types showcase
 */
export const AllJobTypes: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <JobCard
        job={{
          slug: 'full-time-1',
          title: 'Full-Time Position',
          company: 'Company A',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companya',
          location: 'San Francisco, CA',
          type: 'full-time',
          remote: true,
          salary: '$150k - $200k',
          description: 'Full-time position with benefits.',
          tags: ['Python', 'ML', 'Remote'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
      <JobCard
        job={{
          slug: 'part-time-1',
          title: 'Part-Time Position',
          company: 'Company B',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companyb',
          location: 'Austin, TX',
          type: 'part-time',
          remote: true,
          salary: '$60k - $80k',
          description: 'Part-time flexible hours.',
          tags: ['Python', 'Data Science'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
      <JobCard
        job={{
          slug: 'contract-1',
          title: 'Contract Position',
          company: 'Company C',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companyc',
          location: 'New York, NY',
          type: 'contract',
          remote: false,
          salary: '$100/hour',
          description: '6-month contract role.',
          tags: ['Consulting', 'AI'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
      <JobCard
        job={{
          slug: 'internship-1',
          title: 'Internship Position',
          company: 'Company D',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=companyd',
          location: 'Boston, MA',
          type: 'internship',
          remote: false,
          description: 'Summer internship program.',
          tags: ['Research', 'Learning'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
    </div>
  ),
};

/**
 * Grid layout showcase
 */
export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
      <JobCard
        job={{
          slug: 'job-1',
          title: 'Senior AI Engineer',
          company: 'TechCorp',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=job1',
          location: 'Remote',
          type: 'full-time',
          remote: true,
          salary: '$150k - $200k',
          description: 'Build AI solutions.',
          tags: ['Python', 'ML'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: true,
        }}
      />
      <JobCard
        job={{
          slug: 'job-2',
          title: 'ML Researcher',
          company: 'AI Labs',
          companyLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=job2',
          location: 'San Francisco, CA',
          type: 'full-time',
          remote: false,
          salary: '$180k - $250k',
          description: 'Research position.',
          tags: ['Research', 'Deep Learning'],
          postedAt: new Date(),
          applyUrl: '#',
          featured: false,
        }}
      />
    </div>
  ),
};
