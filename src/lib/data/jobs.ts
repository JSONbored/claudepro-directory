import type { JobContent } from '@/src/lib/schemas/content/content-types';

// Use Zod schema type instead of interface
export type Job = JobContent;

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
