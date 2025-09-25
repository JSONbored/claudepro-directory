import type { ContentMetadata } from '@/types/content';

export interface Job extends ContentMetadata {
  // Job-specific fields (ContentMetadata provides: slug, description, category, author, dateAdded, tags, etc.)
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary?: string;
  requirements: string[];
  benefits?: string[];
  postedAt: string;
  expiresAt?: string;
  featured: boolean;
  applyUrl: string;
  contactEmail?: string;
}

// Example jobs for demonstration - currently empty
// Template job structure for future reference:
/*
{
  // ContentMetadata required fields
  id: 'example-job-id',
  slug: 'example-job-slug',
  description: 'Job description here...',
  category: 'engineering', // or 'design', 'marketing', 'sales', 'support', 'product'
  author: 'Company Name',
  dateAdded: '2025-01-15',
  tags: ['tag1', 'tag2', 'remote'],

  // Job-specific fields
  title: 'Job Title',
  company: 'Company Name',
  location: 'Location',
  remote: true/false,
  type: 'full-time', // or 'part-time', 'contract', 'internship'
  salary: '$X - $Y',
  requirements: ['req1', 'req2'],
  benefits: ['benefit1', 'benefit2'],
  postedAt: '2025-01-15',
  featured: false,
  applyUrl: 'https://company.com/apply',
  contactEmail: 'jobs@company.com'
}
*/

export const jobs: Job[] = [
  // No jobs currently - will be populated when real job listings are available
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
