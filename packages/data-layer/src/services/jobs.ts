/**
 * Jobs Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types use postgres-types generator (Prisma doesn't generate RPC types).
 */

// Local types for converted RPCs (RPCs removed, using Prisma directly)
type GetJobsListReturns = Array<{
  id: string;
  slug: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  remote: boolean;
  salary: string | null;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null;
  category:
    | 'engineering'
    | 'design'
    | 'product'
    | 'marketing'
    | 'sales'
    | 'support'
    | 'research'
    | 'data'
    | 'operations'
    | 'leadership'
    | 'consulting'
    | 'education'
    | 'other'
    | null;
  tags: string[];
  requirements: string[] | null;
  benefits: string[] | null;
  link: string | null;
  contact_email: string | null;
  posted_at: string | null;
  expires_at: string | null;
  active: boolean;
  status:
    | 'draft'
    | 'pending_payment'
    | 'pending_review'
    | 'active'
    | 'expired'
    | 'rejected'
    | 'deleted'
    | null;
  plan: 'one-time' | 'subscription' | null;
  tier: 'standard' | 'featured' | null;
  order: number;
  created_at: string;
  updated_at: string;
}>;

type GetJobBillingSummariesArgs = {
  p_job_ids: string[];
};

type GetJobBillingSummariesReturns = Array<{
  job_id: string;
  plan: 'one-time' | 'subscription' | null;
  tier: 'standard' | 'featured' | null;
  price_cents: number | null;
  is_subscription: boolean | null;
  billing_cycle_days: number | null;
  job_expiry_days: number | null;
  last_payment_amount: number | null;
  last_payment_at: string | null;
  last_payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | null;
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'revoked' | null;
  subscription_renews_at: string | null;
}>;
// Import JobBillingSummary type directly from the function file
// Note: This type represents the job_billing_summary view structure
type JobBillingSummary = {
  job_id: string;
  plan: 'one-time' | 'subscription' | null;
  tier: 'standard' | 'featured' | null;
  price_cents: number | null;
  is_subscription: boolean | null;
  billing_cycle_days: number | null;
  job_expiry_days: number | null;
  last_payment_amount: number | null;
  last_payment_at: string | null;
  last_payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | null;
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'paused' | 'revoked' | null;
  subscription_renews_at: string | null;
};
import type { job_category } from '@prisma/client';

// Local types for migrated RPCs (RPCs removed, using Prisma directly)
type GetJobTitleByIdArgs = {
  p_job_id: string;
};

type GetJobDetailArgs = {
  p_slug: string;
};

type GetJobsByCategoryArgs = {
  p_category: job_category;
};

// Local type for getJobDetail (matches RPC return structure)
type GetJobDetailReturns = {
  id: string | null;
  slug: string | null;
  title: string | null;
  company: string | null;
  description: string | null;
  location: string | null;
  remote: boolean | null;
  salary: string | null;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null;
  category:
    | 'engineering'
    | 'design'
    | 'product'
    | 'marketing'
    | 'sales'
    | 'support'
    | 'research'
    | 'data'
    | 'operations'
    | 'leadership'
    | 'consulting'
    | 'education'
    | 'other'
    | null;
  tags: string[] | null;
  requirements: string[] | null;
  benefits: string[] | null;
  link: string | null;
  contact_email: string | null;
  posted_at: string | null;
  expires_at: string | null;
  active: boolean | null;
  status:
    | 'draft'
    | 'pending_payment'
    | 'pending_review'
    | 'active'
    | 'expired'
    | 'rejected'
    | 'deleted'
    | null;
  plan: 'one-time' | 'subscription' | null;
  tier: 'standard' | 'featured' | null;
  order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type GetPaymentPlanCatalogReturns = Array<{
  plan: 'one-time' | 'subscription' | null;
  tier: 'standard' | 'featured' | null;
  price_cents: number | null;
  is_subscription: boolean | null;
  billing_cycle_days: number | null;
  job_expiry_days: number | null;
  description: string | null;
  benefits: Record<string, unknown> | null;
  product_type:
    | 'job_listing'
    | 'mcp_listing'
    | 'user_content'
    | 'subscription'
    | 'premium_membership'
    | null;
}>;

import { prisma } from '../prisma/client';
import { BasePrismaService } from './base-prisma-service';
import { withSmartCache } from '../utils/request-cache';

// Type helper: Extract model type from Prisma query result (non-nullable)
type Job = NonNullable<Awaited<ReturnType<typeof prisma.jobs.findUnique>>>;
export class JobsService extends BasePrismaService {
  /**
   * Get active jobs list
   *
   * OPTIMIZATION: Converted from RPC to Prisma query for better type safety and performance.
   * NOTE: This method is currently not used in the codebase (getFilteredJobs uses SearchService instead).
   * Keeping for API compatibility.
   *
   * Returns active jobs ordered by order DESC, posted_at DESC.
   */
  async getJobs(): Promise<GetJobsListReturns> {
    return withSmartCache(
      'getJobs',
      'getJobs',
      async () => {
        const jobs = await prisma.jobs.findMany({
          where: {
            status: 'active',
            active: true,
          },
          orderBy: [{ order: 'desc' }, { posted_at: 'desc' }],
          select: {
            id: true,
            slug: true,
            title: true,
            company: true,
            description: true,
            location: true,
            remote: true,
            salary: true,
            type: true,
            category: true,
            tags: true,
            requirements: true,
            benefits: true,
            link: true,
            contact_email: true,
            posted_at: true,
            expires_at: true,
            active: true,
            status: true,
            plan: true,
            tier: true,
            order: true,
            created_at: true,
            updated_at: true,
          },
        });

        // Transform to match RPC return structure (jobs_list_item composite type)
        // RPC returns dates as strings, Prisma returns Date objects - convert to ISO strings
        // GetJobsListReturns is typed as unknown[] (composite type), so we cast through unknown
        return jobs.map((job) => ({
          id: job.id,
          slug: job.slug,
          title: job.title,
          company: job.company,
          description: job.description,
          location: job.location,
          remote: job.remote,
          salary: job.salary,
          type: job.type,
          category: job.category,
          tags: job.tags,
          requirements: job.requirements,
          benefits: job.benefits,
          link: job.link,
          contact_email: job.contact_email,
          posted_at: job.posted_at?.toISOString() ?? null,
          expires_at: job.expires_at?.toISOString() ?? null,
          active: job.active,
          status: job.status,
          plan: job.plan,
          tier: job.tier,
          order: job.order,
          created_at: job.created_at.toISOString(),
          updated_at: job.updated_at.toISOString(),
        })) as unknown as GetJobsListReturns;
      },
      {}
    );
  }

  /**
   * Get job by slug
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was returning a composite type (JobDetailResult), but we can use Prisma
   * to fetch the job and transform to match the RPC return structure.
   *
   * @param args - Arguments with slug
   * @returns Job detail matching RPC return structure
   */
  async getJobBySlug(args: GetJobDetailArgs): Promise<GetJobDetailReturns | null> {
    return withSmartCache(
      'getJobBySlug',
      'getJobBySlug',
      async () => {
        // OPTIMIZATION: Use relationLoadStrategy: 'join' to fetch job and company in a single query
        // OPTIMIZATION: Use select instead of fetching entire record
        // OPTIMIZATION: Use relationLoadStrategy: 'join' for better performance
        const job = await prisma.jobs.findUnique({
          where: { slug: args.p_slug },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            location: true,
            remote: true,
            salary: true,
            type: true,
            category: true,
            tags: true,
            requirements: true,
            benefits: true,
            link: true,
            contact_email: true,
            posted_at: true,
            expires_at: true,
            active: true,
            status: true,
            plan: true,
            tier: true,
            order: true,
            created_at: true,
            updated_at: true,
            companies: {
              select: {
                name: true,
              },
            },
          },
          relationLoadStrategy: 'join', // Use JOIN for better performance (requires relationJoins preview feature)
        });

        if (!job) {
          return null;
        }

        // Transform Prisma model to match RPC composite type structure (JobDetailResult)
        // RPC uses snake_case and string dates, we transform to match
        return {
          id: job.id,
          slug: job.slug,
          title: job.title,
          company: job.companies?.name ?? null,
          description: job.description,
          location: job.location,
          remote: job.remote ?? false,
          salary: job.salary,
          type: job.type,
          category: job.category,
          tags: job.tags,
          requirements: job.requirements,
          benefits: job.benefits,
          link: job.link,
          contact_email: job.contact_email,
          posted_at: job.posted_at?.toISOString() ?? null,
          expires_at: job.expires_at?.toISOString() ?? null,
          active: job.active ?? false,
          status: job.status,
          plan: job.plan,
          tier: job.tier,
          order: job.order,
          created_at: job.created_at.toISOString(),
          updated_at: job.updated_at.toISOString(),
        };
      },
      args
    );
  }

  /**
   * Get featured jobs
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC had complex UNION ALL logic with placeholders, but we can replicate this with Prisma.
   *
   * @returns Array of featured jobs (real + placeholders, max 6 total)
   */
  async getFeaturedJobs() {
    return withSmartCache(
      'getFeaturedJobs',
      'getFeaturedJobs',
      async () => {
        // Count real featured jobs
        const realJobCount = await prisma.jobs.count({
          where: {
            status: 'active',
            active: true,
            featured: true,
            is_placeholder: false,
          },
        });

        // Calculate how many placeholders we need (minimum 3 total, max 6)
        const neededPlaceholders = Math.min(Math.max(3 - realJobCount, 0), 6 - realJobCount);

        // OPTIMIZATION: Fetch real jobs and placeholder jobs in parallel when both are needed
        // This reduces sequential queries from 2 to 1 parallel batch
        // OPTIMIZATION: Use select to fetch only required fields (17 fields: 14 display + 3 sorting)
        // This reduces data transfer significantly (from 30+ fields to 17 fields per job)
        const [realJobs, placeholderJobs] = await Promise.all([
          prisma.jobs.findMany({
            where: {
              status: 'active',
              active: true,
              featured: true,
              is_placeholder: false,
            },
            select: {
              // Display fields (14)
              slug: true,
              title: true,
              company: true,
              company_logo: true,
              location: true,
              remote: true,
              type: true,
              category: true,
              tags: true,
              posted_at: true,
              link: true,
              tier: true,
              description: true,
              salary: true,
              // Sorting fields (3) - needed for combined.sort() logic
              is_placeholder: true,
              featured: true,
              order: true,
            },
            orderBy: [{ order: 'desc' }, { posted_at: 'desc' }],
            take: 6,
          }),
          neededPlaceholders > 0
            ? prisma.jobs.findMany({
                where: {
                  status: 'active',
                  active: true,
                  is_placeholder: true,
                },
                select: {
                  // Display fields (14)
                  slug: true,
                  title: true,
                  company: true,
                  company_logo: true,
                  location: true,
                  remote: true,
                  type: true,
                  category: true,
                  tags: true,
                  posted_at: true,
                  link: true,
                  tier: true,
                  description: true,
                  salary: true,
                  // Sorting fields (3) - needed for combined.sort() logic
                  is_placeholder: true,
                  featured: true,
                  order: true,
                },
                orderBy: [{ featured: 'desc' }, { order: 'desc' }, { created_at: 'desc' }],
                take: neededPlaceholders,
              })
            : Promise.resolve([]),
        ]);

        // Combine and sort: real jobs first, then placeholders
        const combined = [...realJobs, ...placeholderJobs];

        // Sort combined result: placeholders last, then by featured, order, posted_at
        combined.sort((a, b) => {
          // Placeholders go last
          const aIsPlaceholder = a.is_placeholder ?? false;
          const bIsPlaceholder = b.is_placeholder ?? false;
          if (aIsPlaceholder !== bIsPlaceholder) {
            return aIsPlaceholder ? 1 : -1;
          }
          // Featured first
          const aFeatured = a.featured ?? false;
          const bFeatured = b.featured ?? false;
          if (aFeatured !== bFeatured) {
            return aFeatured ? -1 : 1;
          }
          // Then by order (desc, nulls last)
          const aOrder = a.order ?? null;
          const bOrder = b.order ?? null;
          if (aOrder !== bOrder) {
            if (aOrder === null) return 1;
            if (bOrder === null) return -1;
            return bOrder - aOrder;
          }
          // Finally by posted_at (desc, nulls last)
          const aPostedAt = a.posted_at;
          const bPostedAt = b.posted_at;
          if (aPostedAt && bPostedAt) {
            return bPostedAt.getTime() - aPostedAt.getTime();
          }
          if (aPostedAt) return -1;
          if (bPostedAt) return 1;
          return 0;
        });

        return combined.slice(0, 6);
      },
      {}
    );
  }

  /**
   * Get jobs by category
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT with WHERE/ORDER BY, which Prisma handles perfectly.
   *
   * @param args - Arguments with p_category
   * @returns Array of jobs in the specified category
   */
  async getJobsByCategory(args: GetJobsByCategoryArgs) {
    return withSmartCache(
      'getJobsByCategory',
      'getJobsByCategory',
      async () => {
        // OPTIMIZATION: Use select to fetch only required fields (14 fields)
        // This reduces data transfer significantly (from 30+ fields to 14 fields per job)
        // Fields match JobCard component requirements (used on job listing pages)
        const jobs = await prisma.jobs.findMany({
          where: {
            status: 'active',
            active: true,
            category: args.p_category as job_category,
          },
          select: {
            slug: true,
            title: true,
            company: true,
            company_logo: true,
            location: true,
            remote: true,
            type: true,
            category: true,
            tags: true,
            posted_at: true,
            link: true,
            tier: true,
            description: true,
            salary: true,
          },
          orderBy: [{ featured: 'desc' }, { order: 'desc' }, { posted_at: 'desc' }],
        });
        return jobs;
      },
      args
    );
  }

  /**
   * Get jobs count
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple COUNT query, which Prisma handles perfectly.
   *
   * @returns Count of active jobs
   */
  async getJobsCount(): Promise<number> {
    return withSmartCache<number>(
      'getJobsCount',
      'getJobsCount',
      async () => {
        const count = await prisma.jobs.count({
          where: {
            status: 'active',
            active: true,
          },
        });
        return count;
      },
      {}
    );
  }

  async getJobStatsById(jobId: string): Promise<{
    view_count: NonNullable<Job>['view_count'];
    click_count: NonNullable<Job>['click_count'];
    status: NonNullable<Job>['status'];
  } | null> {
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: {
        view_count: true,
        click_count: true,
        status: true,
      },
    });
    return job;
  }

  async getJobStatusById(jobId: string): Promise<{
    status: NonNullable<Job>['status'];
    expires_at: NonNullable<Job>['expires_at'];
  } | null> {
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: {
        status: true,
        expires_at: true,
      },
    });
    return job;
  }

  /**
   * Get payment plan catalog
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT from payment_plan_catalog, which Prisma handles perfectly.
   *
   * @returns Array of payment plan catalog entries
   */
  async getPaymentPlanCatalog(): Promise<GetPaymentPlanCatalogReturns> {
    return withSmartCache(
      'getPaymentPlanCatalog',
      'getPaymentPlanCatalog',
      async () => {
        // OPTIMIZATION: Use select to fetch only required fields (9 fields, excluding created_at/updated_at)
        // This reduces data transfer (from 11 fields to 9 fields per plan)
        const plans = await prisma.payment_plan_catalog.findMany({
          select: {
            plan: true,
            tier: true,
            price_cents: true,
            is_subscription: true,
            billing_cycle_days: true,
            job_expiry_days: true,
            description: true,
            benefits: true,
            product_type: true,
          },
          orderBy: [{ plan: 'asc' }, { tier: 'asc' }],
        });

        // Transform to match RPC return structure (GetPaymentPlanCatalogReturnRow[])
        return plans.map((plan) => ({
          plan: plan.plan,
          tier: plan.tier,
          price_cents: plan.price_cents,
          is_subscription: plan.is_subscription,
          billing_cycle_days: plan.billing_cycle_days,
          job_expiry_days: plan.job_expiry_days,
          description: plan.description,
          benefits: plan.benefits as Record<string, unknown> | null,
          product_type: plan.product_type,
        }));
      },
      {}
    );
  }

  /**
   * Get job billing summaries for a list of job IDs
   *
   * OPTIMIZATION: Uses Prisma $queryRaw to query job_billing_summary view directly.
   * The RPC was just filtering the view by job_ids, which we can do directly.
   *
   * The view uses LATERAL joins to get latest payment and subscription, which is
   * complex to replicate in Prisma, so we query the view directly.
   *
   * @param args - Arguments with p_job_ids array
   * @returns Array of job billing summary records
   */
  async getJobBillingSummaries(
    args: GetJobBillingSummariesArgs
  ): Promise<GetJobBillingSummariesReturns> {
    return withSmartCache(
      'get_job_billing_summaries',
      'getJobBillingSummaries',
      async () => {
        if (args.p_job_ids.length === 0) {
          return [];
        }

        // Query the view directly using Prisma $queryRaw
        // The view already handles the complex LATERAL joins
        const result = await prisma.$queryRaw<JobBillingSummary[]>`
          SELECT 
            job_id,
            plan,
            tier,
            price_cents,
            is_subscription,
            billing_cycle_days,
            job_expiry_days,
            last_payment_amount,
            last_payment_at,
            last_payment_status,
            subscription_status,
            subscription_renews_at
          FROM public.job_billing_summary
          WHERE job_id = ANY(${args.p_job_ids}::uuid[])
        `;

        return result;
      },
      args
    );
  }

  /**
   * Get job title by ID
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT title FROM jobs WHERE id = ?, which Prisma handles perfectly.
   *
   * @param args - Arguments with job_id
   * @returns Job title string or null if not found
   */
  async getJobTitleById(args: GetJobTitleByIdArgs): Promise<string | null> {
    return withSmartCache(
      'getJobTitleById',
      'getJobTitleById',
      async () => {
        const job = await prisma.jobs.findUnique({
          where: { id: args.p_job_id },
          select: { title: true },
        });
        return job?.title ?? null;
      },
      args
    );
  }

  /**
   * Get active job slugs for static generation
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better performance.
   * Only fetches slugs needed for generateStaticParams, avoiding unnecessary data processing.
   *
   * @param limit - Maximum number of slugs to return
   * @returns Array of job slugs
   */
  async getActiveJobSlugs(limit: number): Promise<string[]> {
    return withSmartCache(
      'getActiveJobSlugs',
      'getActiveJobSlugs',
      async () => {
        const jobs = await prisma.jobs.findMany({
          where: {
            active: true,
            status: 'active',
          },
          select: {
            slug: true,
          },
          orderBy: {
            created_at: 'desc',
          },
          take: limit,
        });
        return jobs.map((job) => job.slug);
      },
      { limit }
    );
  }
}
