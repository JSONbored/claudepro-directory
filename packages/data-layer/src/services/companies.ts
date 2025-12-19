/**
 * Companies Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Uses generated Prisma postgres-types for RPC function types and Zod schemas.
 */

// Local types for converted RPCs (RPCs removed, using Prisma directly)
// These RPC functions were removed and converted to Prisma direct queries
// Types are defined locally to match the original RPC return structures
// Exported for use in web-runtime

export type GetCompanyAdminProfileArgs = {
  p_company_id: string;
};

export type GetCompanyAdminProfileReturns = Array<{
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  logo: string | null;
  website: string | null;
  description: string | null;
  size: string | null;
  industry: string | null;
  using_cursor_since: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}>;

export type GetCompanyProfileArgs = {
  p_slug: string;
};

export type CompanyProfileStats = {
  total_jobs: number;
  active_jobs: number;
  featured_jobs: number;
  remote_jobs: number;
  avg_salary_min: number | null;
  total_views: number;
  total_clicks: number;
  click_through_rate: number | null;
  latest_job_posted_at: string | null;
};

export type CompanyProfileJobItem = {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string | null;
  description: string;
  salary: string | null;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | null;
  workplace: string | null;
  experience: string | null;
  category: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines' | 'skills' | 'collections' | 'guides' | 'jobs' | 'changelog';
  tags: string[];
  plan: 'free' | 'basic' | 'premium' | null;
  tier: 'standard' | 'featured' | null;
  posted_at: string | null;
  expires_at: string | null;
  view_count: number;
  click_count: number;
  link: string | null;
};

export type GetCompanyProfileReturns = {
  company: {
    id: string;
    owner_id: string;
    slug: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    size: string | null; // Stored as enum in DB but returned as string
    industry: string | null;
    using_cursor_since: string | null;
    featured: boolean;
    created_at: string;
    updated_at: string;
    json_ld: Record<string, unknown> | null;
  } | null;
  active_jobs: CompanyProfileJobItem[] | null;
  stats: CompanyProfileStats | null;
};

export type GetCompaniesListArgs = {
  p_limit?: number;
  p_offset?: number;
};

export type CompanyJobStatsItem = {
  active_jobs: number;
  total_jobs: number;
  remote_jobs: number;
  total_views: number;
  total_clicks: number;
  latest_job_posted_at: string | null;
};

export type CompanyListItem = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  website: string | null;
  description: string | null;
  size: string | null;
  industry: string | null;
  featured: boolean;
  created_at: string;
  stats: CompanyJobStatsItem;
};

export type GetCompaniesListReturns = {
  companies: CompanyListItem[] | null;
  total: number;
};
import { BasePrismaService } from './base-prisma-service.ts';
import { prisma } from '../prisma/client.ts';
import { withSmartCache } from '../utils/request-cache.ts';

/**
 * Companies Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions (returns composite types)
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class CompaniesService extends BasePrismaService {
  /**
   * Get company admin profile
   * 
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT from companies table, which Prisma handles perfectly.
   * 
   * @param args - Arguments with company_id
   * @returns Company admin profile (array with single row or empty)
   */
  async getCompanyAdminProfile(
    args: GetCompanyAdminProfileArgs
  ): Promise<GetCompanyAdminProfileReturns> {
    return withSmartCache(
      'get_company_admin_profile',
      'getCompanyAdminProfile',
      async () => {
        const company = await prisma.companies.findUnique({
          where: { id: args.p_company_id },
          select: {
            id: true,
            owner_id: true,
            name: true,
            slug: true,
            logo: true,
            website: true,
            description: true,
            size: true,
            industry: true,
            using_cursor_since: true,
            featured: true,
            created_at: true,
            updated_at: true,
          },
        });

        if (!company) {
          return [] as GetCompanyAdminProfileReturns;
        }

        // Transform to match RPC return structure (table row)
        return [{
          id: company.id,
          owner_id: company.owner_id,
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          website: company.website,
          description: company.description,
          size: company.size ? String(company.size) : null, // company_size enum to string
          industry: company.industry,
          using_cursor_since: company.using_cursor_since?.toISOString().split('T')[0] ?? null, // Date to string
          featured: company.featured ?? false,
          created_at: company.created_at.toISOString(),
          updated_at: company.updated_at.toISOString(),
        }] as GetCompanyAdminProfileReturns;
      },
      args
    );
  }

  /**
   * Get company profile by slug
   * 
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing multiple queries and aggregations, which Prisma handles with includes and manual calculations.
   * 
   * @param args - Arguments with slug
   * @returns Company profile (composite type)
   */
  async getCompanyProfile(
    args: GetCompanyProfileArgs
  ): Promise<GetCompanyProfileReturns> {
    return withSmartCache(
      'get_company_profile',
      'getCompanyProfile',
      async () => {
        // Fetch company without jobs first (eliminates new Date() call in nested query)
        const company = await prisma.companies.findFirst({
          where: {
            slug: args.p_slug,
            owner_id: { not: null },
          },
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            website: true,
            description: true,
            size: true,
            industry: true,
            using_cursor_since: true,
            featured: true,
            json_ld: true,
            owner_id: true, // Used in transformation
            created_at: true, // Used in transformation
            updated_at: true, // Used in transformation
          },
        });

        if (!company) {
          return {
            company: null,
            active_jobs: null,
            stats: null,
          } as GetCompanyProfileReturns;
        }

        // Fetch active jobs using raw SQL with database NOW() (eliminates new Date() call)
        // More efficient: database handles date comparison natively
        // Use Prisma query with date comparison (Prisma translates to SQL, but we still need Date object)
        // Actually, let's use Prisma's query builder but calculate date once and reuse
        // Since we're in withSmartCache (skips during build), Date.now() is safe here
        // But user wants elimination, so use raw SQL with proper type casting
        const activeJobsDataRaw = await prisma.$queryRawUnsafe<Array<{
          id: string;
          slug: string;
          title: string;
          company: string;
          company_logo: string | null;
          location: string | null;
          description: string;
          salary: string | null;
          remote: boolean;
          type: string;
          workplace: string | null;
          experience: string | null;
          category: string;
          tags: string[];
          plan: string;
          tier: string;
          posted_at: Date | null;
          expires_at: Date | null;
          view_count: number;
          click_count: number;
          link: string | null;
        }>>(
          `
          SELECT 
            id, slug, title, company, company_logo, location, description,
            salary, remote, type::text, workplace, experience, category::text, tags,
            plan::text, tier::text, posted_at, expires_at, view_count, click_count, link
          FROM public.jobs
          WHERE company_id = $1::uuid
            AND status = 'active'
            AND active = true
            AND expires_at > NOW()
          ORDER BY tier DESC, posted_at DESC
          `,
          company.id
        );

        // Transform active jobs to match RPC return structure (company_profile_job_item)
        // Cast enum types from strings returned by raw SQL
        const activeJobs: CompanyProfileJobItem[] = activeJobsDataRaw.map((job) => ({
          id: job.id,
          slug: job.slug,
          title: job.title,
          company: job.company,
          company_logo: job.company_logo,
          location: job.location,
          description: job.description,
          salary: job.salary,
          remote: job.remote,
          type: (job.type as CompanyProfileJobItem['type']) ?? null, // Cast enum from string
          workplace: job.workplace,
          experience: job.experience,
          category: job.category as CompanyProfileJobItem['category'], // Cast enum from string
          tags: job.tags,
          plan: job.plan as CompanyProfileJobItem['plan'], // Cast enum from string
          tier: job.tier as CompanyProfileJobItem['tier'], // Cast enum from string
          posted_at: job.posted_at?.toISOString() ?? null,
          expires_at: job.expires_at?.toISOString() ?? null,
          view_count: job.view_count,
          click_count: job.click_count,
          link: job.link,
        } as CompanyProfileJobItem));

        // Get all jobs for stats calculation
        const allJobs = await prisma.jobs.findMany({
          where: {
            company_id: company.id,
          },
          select: {
            status: true,
            active: true,
            expires_at: true,
            tier: true,
            remote: true,
            salary: true,
            view_count: true,
            click_count: true,
            posted_at: true,
          },
        });

        // OPTIMIZATION: Use count() queries for statistics instead of fetching all records and filtering
        // This reduces data transfer and improves performance
        const [
          totalJobs,
          activeJobsCount,
          featuredJobs,
          remoteJobs,
          viewsAggregate,
          clicksAggregate,
        ] = await Promise.all([
          prisma.jobs.count({ where: { company_id: company.id } }),
          // Use raw SQL with database NOW() for date comparison (eliminates new Date() call)
          prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `
            SELECT COUNT(*)::bigint as count
            FROM public.jobs
            WHERE company_id = $1::uuid
              AND status = 'active'
              AND active = true
              AND expires_at > NOW()
            `,
            company.id
          ).then((result) => Number(result[0]?.count ?? 0)),
          prisma.jobs.count({
            where: { company_id: company.id, tier: 'featured' },
          }),
          prisma.jobs.count({
            where: { company_id: company.id, remote: true },
          }),
          prisma.jobs.aggregate({
            where: { company_id: company.id },
            _sum: { view_count: true },
          }),
          prisma.jobs.aggregate({
            where: { company_id: company.id },
            _sum: { click_count: true },
          }),
        ]);

        // Calculate average salary (extract numbers from salary strings)
        // NOTE: This requires in-memory processing due to string parsing, so we still need salary field
        const salaryNumbers = allJobs
          .map((j) => {
            if (!j.salary) return null;
            const numbers = j.salary.replace(/[^0-9]/g, '');
            return numbers ? parseFloat(numbers) : null;
          })
          .filter((n): n is number => n !== null);
        const avgSalaryMin = salaryNumbers.length > 0
          ? salaryNumbers.reduce((sum, n) => sum + n, 0) / salaryNumbers.length
          : null;

        // OPTIMIZATION: Use aggregate results instead of in-memory reduce
        const totalViews = viewsAggregate._sum.view_count ?? 0;
        const totalClicks = clicksAggregate._sum.click_count ?? 0;
        const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) : null;

        // OPTIMIZATION: Use aggregate for latest posted date
        const latestJobAggregate = await prisma.jobs.findFirst({
          where: { company_id: company.id },
          select: { posted_at: true },
          orderBy: { posted_at: 'desc' },
        });
        const latestJobPostedAt = latestJobAggregate?.posted_at ?? null;

        const stats: CompanyProfileStats = {
          total_jobs: totalJobs,
          active_jobs: activeJobsCount,
          featured_jobs: featuredJobs,
          remote_jobs: remoteJobs,
          avg_salary_min: avgSalaryMin,
          total_views: totalViews,
          total_clicks: totalClicks,
          click_through_rate: clickThroughRate,
          latest_job_posted_at: latestJobPostedAt?.toISOString() ?? null,
        };

        // Return structure matching RPC (company_profile_result)
        return {
          company: {
            id: company.id,
            owner_id: company.owner_id,
            slug: company.slug,
            name: company.name,
            logo: company.logo,
            website: company.website,
            description: company.description,
            size: company.size, // Keep as enum, not string (Companies type expects enum)
            industry: company.industry,
            using_cursor_since: company.using_cursor_since?.toISOString().split('T')[0] ?? null, // Date to string
            featured: company.featured ?? false,
            created_at: company.created_at.toISOString(),
            updated_at: company.updated_at.toISOString(),
            json_ld: company.json_ld as Record<string, unknown> | null,
          },
          active_jobs: activeJobs.length > 0 ? activeJobs : null,
          stats,
        } as GetCompanyProfileReturns;
      },
      args
    );
  }

  /**
   * Get companies list
   * 
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a CTE with job stats aggregation, which Prisma handles with includes and manual aggregation.
   * 
   * @param args - Pagination and filter arguments
   * @returns Companies list with job stats
   */
  async getCompaniesList(
    args: GetCompaniesListArgs
  ): Promise<GetCompaniesListReturns> {
    return withSmartCache(
      'get_companies_list',
      'getCompaniesList',
      async () => {
        const limit = args.p_limit ?? 50;
        const offset = args.p_offset ?? 0;

        // Get total count for pagination
        const total = await prisma.companies.count({
          where: {
            owner_id: { not: null },
          },
        });

        // OPTIMIZATION: Use relationLoadStrategy: 'join' to fetch companies and jobs in a single query
        // OPTIMIZATION: Use select to fetch only needed company fields, reducing data transfer
        // This reduces database round-trips and improves performance
        const companies = await prisma.companies.findMany({
          where: {
            owner_id: { not: null },
          },
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            website: true,
            description: true,
            size: true,
            industry: true,
            using_cursor_since: true,
            featured: true,
            created_at: true,
            jobs: {
              select: {
                id: true,
                status: true,
                remote: true,
                view_count: true,
                click_count: true,
                posted_at: true,
                created_at: true,
              },
            },
          },
          orderBy: [
            { featured: 'desc' },
            { created_at: 'desc' },
          ],
          take: limit,
          skip: offset,
          relationLoadStrategy: 'join' // Use JOIN for better performance (requires relationJoins preview feature)
        });

        // Transform to match RPC return structure (company_list_result)
        const companiesList: CompanyListItem[] = companies.map((company) => {
          // Calculate job stats (matching CTE logic from RPC)
          const activeJobs = company.jobs.filter(
            (j) => j.status === 'active'
          ).length;
          const totalJobs = company.jobs.length;
          // OPTIMIZATION: Count is already calculated from included jobs, but we can optimize further
          // Since we already have jobs loaded, we can count in-memory (already efficient)
          const remoteJobs = company.jobs.filter((j) => j.remote === true).length;
          const totalViews = company.jobs.reduce(
            (sum, j) => sum + (j.view_count ?? 0),
            0
          );
          const totalClicks = company.jobs.reduce(
            (sum, j) => sum + (j.click_count ?? 0),
            0
          );
          const latestJobPostedAt = company.jobs.length > 0
            ? company.jobs.reduce((latest, j) => {
                const jobDate = j.posted_at;
                return !latest || (jobDate && jobDate > latest) ? jobDate : latest;
              }, null as Date | null)
            : null;

          const stats: CompanyJobStatsItem = {
            active_jobs: activeJobs,
            total_jobs: totalJobs,
            remote_jobs: remoteJobs,
            total_views: totalViews,
            total_clicks: totalClicks,
            latest_job_posted_at: latestJobPostedAt?.toISOString() ?? null,
          };

          return {
            id: company.id,
            slug: company.slug,
            name: company.name,
            logo: company.logo,
            website: company.website,
            description: company.description,
            size: company.size ? String(company.size) : null, // company_size enum to string
            industry: company.industry,
            featured: company.featured ?? false,
            created_at: company.created_at.toISOString(),
            stats,
          };
        });

        // Return structure matching RPC (company_list_result)
        return {
          companies: companiesList.length > 0 ? companiesList : null,
          total,
        } as GetCompaniesListReturns;
      },
      args
    );
  }
}
