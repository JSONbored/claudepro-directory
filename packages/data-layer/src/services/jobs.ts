/**
 * Jobs Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types remain using Database type (Prisma doesn't generate RPC types).
 */

import type { Database } from '@heyclaude/database-types';
import type { Prisma } from '@heyclaude/data-layer/prisma';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
export class JobsService extends BasePrismaService {
  async getJobs(): Promise<Database['public']['Functions']['get_jobs_list']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_jobs_list']['Returns']>(
      'get_jobs_list',
      {},
      { methodName: 'getJobs' }
    );
  }

  async getJobBySlug(
    args: Database['public']['Functions']['get_job_detail']['Args']
  ): Promise<Database['public']['Functions']['get_job_detail']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_job_detail']['Returns']>(
      'get_job_detail',
      args,
      { methodName: 'getJobBySlug' }
    );
  }

  async getFeaturedJobs(): Promise<Database['public']['Functions']['get_featured_jobs']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_featured_jobs']['Returns']>(
      'get_featured_jobs',
      {},
      { methodName: 'getFeaturedJobs' }
    );
  }

  async getJobsByCategory(
    args: Database['public']['Functions']['get_jobs_by_category']['Args']
  ): Promise<Database['public']['Functions']['get_jobs_by_category']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_jobs_by_category']['Returns']>(
      'get_jobs_by_category',
      args,
      { methodName: 'getJobsByCategory' }
    );
  }

  async getJobsCount(): Promise<Database['public']['Functions']['get_jobs_count']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_jobs_count']['Returns']>(
      'get_jobs_count',
      {},
      { methodName: 'getJobsCount' }
    );
  }

  async getJobStatsById(jobId: string): Promise<{
    view_count: Prisma.jobsGetPayload<{}>['view_count'];
    click_count: Prisma.jobsGetPayload<{}>['click_count'];
    status: Prisma.jobsGetPayload<{}>['status'];
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
    status: Prisma.jobsGetPayload<{}>['status'];
    expires_at: Prisma.jobsGetPayload<{}>['expires_at'];
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

  async getPaymentPlanCatalog(): Promise<
    Database['public']['Functions']['get_payment_plan_catalog']['Returns']
  > {
    return this.callRpc<Database['public']['Functions']['get_payment_plan_catalog']['Returns']>(
      'get_payment_plan_catalog',
      {},
      { methodName: 'getPaymentPlanCatalog' }
    );
  }

  async getJobBillingSummaries(
    args: Database['public']['Functions']['get_job_billing_summaries']['Args']
  ): Promise<Database['public']['Functions']['get_job_billing_summaries']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_job_billing_summaries']['Returns']>(
      'get_job_billing_summaries',
      args,
      { methodName: 'getJobBillingSummaries' }
    );
  }

  async getJobTitleById(
    args: Database['public']['Functions']['get_job_title_by_id']['Args']
  ): Promise<Database['public']['Functions']['get_job_title_by_id']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_job_title_by_id']['Returns']>(
      'get_job_title_by_id',
      args,
      { methodName: 'getJobTitleById' }
    );
  }
}
