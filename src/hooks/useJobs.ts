import { useState, useMemo } from 'react';
import { jobs, Job } from '@/data/jobs';

export interface JobFilters {
  category: string;
  type: string;
  remote: boolean;
  featured: boolean;
}

export interface JobSorting {
  field: 'postedAt' | 'title' | 'company' | 'salary';
  direction: 'asc' | 'desc';
}

export const useJobs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<JobFilters>({
    category: 'all',
    type: 'all',
    remote: false,
    featured: false,
  });
  const [sorting, setSorting] = useState<JobSorting>({
    field: 'postedAt',
    direction: 'desc',
  });

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      // Search filter
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = filters.category === 'all' || job.category === filters.category;

      // Type filter
      const matchesType = filters.type === 'all' || job.type === filters.type;

      // Remote filter
      const matchesRemote = !filters.remote || job.remote;

      // Featured filter
      const matchesFeatured = !filters.featured || job.featured;

      return matchesSearch && matchesCategory && matchesType && matchesRemote && matchesFeatured;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sorting.field) {
        case 'postedAt':
          comparison = new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'salary':
          // Simple salary comparison (would need more sophisticated parsing in real app)
          const aSalary = a.salary ? parseInt(a.salary.replace(/\D/g, '')) : 0;
          const bSalary = b.salary ? parseInt(b.salary.replace(/\D/g, '')) : 0;
          comparison = aSalary - bSalary;
          break;
        default:
          comparison = 0;
      }

      return sorting.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [searchQuery, filters, sorting]);

  const updateFilter = (key: keyof JobFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateSorting = (field: JobSorting['field'], direction?: JobSorting['direction']) => {
    setSorting(prev => ({
      field,
      direction: direction || (prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'),
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      category: 'all',
      type: 'all',
      remote: false,
      featured: false,
    });
  };

  // Get filter options from the data
  const filterOptions = useMemo(() => {
    const categories = [...new Set(jobs.map(job => job.category))];
    const types = [...new Set(jobs.map(job => job.type))];
    
    return {
      categories: categories.map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })),
      types: types.map(type => ({ value: type, label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
    };
  }, []);

  return {
    jobs: filteredAndSortedJobs,
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    sorting,
    updateSorting,
    clearFilters,
    filterOptions,
    totalJobs: jobs.length,
    filteredCount: filteredAndSortedJobs.length,
  };
};