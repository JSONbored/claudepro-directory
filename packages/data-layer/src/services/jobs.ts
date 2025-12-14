/**
 * Jobs Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All table types use Prisma types.
 * RPC function types remain using Database type (Prisma doesn't generate RPC types).
 */

import type {
  GetJobsListReturns,
  GetJobDetailArgs,
  GetJobDetailReturns,
  GetFeaturedJobsReturns,
  GetJobsByCategoryArgs,
  GetJobsByCategoryReturns,
  GetJobsCountReturns,
  GetPaymentPlanCatalogReturns,
  GetJobBillingSummariesArgs,
  GetJobBillingSummariesReturns,
  GetJobTitleByIdArgs,
  GetJobTitleByIdReturns,
} from '@heyclaude/database-types/postgres-types';
import type { Prisma } from '@heyclaude/data-layer/prisma';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
export class JobsService extends BasePrismaService {
  async getJobs(): Promise<GetJobsListReturns> {
    return this.callRpc<GetJobsListReturns>(
      'get_jobs_list',
      {},
      { methodName: 'getJobs' }
    );
  }

  async getJobBySlug(
    args: GetJobDetailArgs
  ): Promise<GetJobDetailReturns> {
    return this.callRpc<GetJobDetailReturns>(
      'get_job_detail',
      args,
      { methodName: 'getJobBySlug' }
    );
  }

  async getFeaturedJobs(): Promise<GetFeaturedJobsReturns> {
    return this.callRpc<GetFeaturedJobsReturns>(
      'get_featured_jobs',
      {},
      { methodName: 'getFeaturedJobs' }
    );
  }

  async getJobsByCategory(
    args: GetJobsByCategoryArgs
  ): Promise<GetJobsByCategoryReturns> {
    return this.callRpc<GetJobsByCategoryReturns>(
      'get_jobs_by_category',
      args,
      { methodName: 'getJobsByCategory' }
    );
  }

  async getJobsCount(): Promise<GetJobsCountReturns> {
    return this.callRpc<GetJobsCountReturns>(
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

  async getPaymentPlanCatalog(): Promise<GetPaymentPlanCatalogReturns> {
    return this.callRpc<GetPaymentPlanCatalogReturns>(
      'get_payment_plan_catalog',
      {},
      { methodName: 'getPaymentPlanCatalog' }
    );
  }

  async getJobBillingSummaries(
    args: GetJobBillingSummariesArgs
  ): Promise<GetJobBillingSummariesReturns> {
    return this.callRpc<GetJobBillingSummariesReturns>(
      'get_job_billing_summaries',
      args,
      { methodName: 'getJobBillingSummaries' }
    );
  }

  async getJobTitleById(
    args: GetJobTitleByIdArgs
  ): Promise<GetJobTitleByIdReturns> {
    return this.callRpc<GetJobTitleByIdReturns>(
      'get_job_title_by_id',
      args,
      { methodName: 'getJobTitleById' }
    );
  }
}
