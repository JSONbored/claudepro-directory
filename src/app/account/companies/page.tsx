/**
 * Company Management Page - Database-First via Edge Function
 * Manages user's companies with CRUD operations via companies-handler
 */

import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/badges/badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { Briefcase, Building2, Calendar, Edit, ExternalLink, Eye, Plus } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';
import type { Tables } from '@/src/types/database.types';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/companies');

export default async function CompaniesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let companies: Array<Tables<'companies'>> = [];
  let hasError = false;

  if (user) {
    let data: unknown = null;
    let error: unknown = null;

    if (typeof supabase.rpc === 'function') {
      ({ data, error } = await supabase.rpc('get_user_companies', { p_user_id: user.id }));
    } else {
      logger.warn(
        'Supabase RPC unavailable (mock client fallback detected); skipping companies fetch.',
        { context: 'CompaniesPage' }
      );
      companies = [];
    }

    if (error) {
      logger.error(
        'Failed to fetch user companies',
        error instanceof Error ? error : new Error(String(error))
      );
      hasError = true;
    } else if (data !== null) {
      // Trust database types - PostgreSQL validates structure
      const result = data as { companies: Array<Tables<'companies'>> };
      companies = result.companies || [];
    }
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Failed to load companies. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 font-bold text-3xl">My Companies</h1>
          <p className="text-muted-foreground">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
        <Button asChild>
          <Link href={`${ROUTES.ACCOUNT_COMPANIES}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className={'flex flex-col items-center py-12'}>
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-xl">No companies yet</h3>
            <p className={'mb-4 max-w-md text-center text-muted-foreground'}>
              Create a company profile to showcase your organization and post job listings
            </p>
            <Button asChild>
              <Link href={`${ROUTES.ACCOUNT_COMPANIES}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Company
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => {
            const companyData = company as Tables<'companies'> & {
              stats?: {
                total_jobs?: number;
                active_jobs?: number;
                total_views?: number;
                total_clicks?: number;
                latest_job_posted_at?: string | null;
              };
            };
            return (
              <Card key={companyData.id}>
                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                    <div className="flex flex-1 items-start gap-4">
                      {companyData.logo ? (
                        <Image
                          src={companyData.logo}
                          alt={`${companyData.name} logo`}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-lg border object-cover"
                          priority
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-accent">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                          <CardTitle>{companyData.name}</CardTitle>
                          {companyData.featured && (
                            <UnifiedBadge variant="base" style="default">
                              Featured
                            </UnifiedBadge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {companyData.description || 'No description provided'}
                        </CardDescription>
                        {companyData.website && (
                          <a
                            href={companyData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-flex items-center gap-1 text-sm ${UI_CLASSES.LINK_ACCENT}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {companyData.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className={'mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm'}>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Briefcase className="h-4 w-4" />
                      {companyData.stats?.active_jobs || 0} active job
                      {(companyData.stats?.active_jobs || 0) !== 1 ? 's' : ''}
                    </div>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Eye className="h-4 w-4" />
                      {(companyData.stats?.total_views || 0).toLocaleString()} views
                    </div>
                    {companyData.stats?.latest_job_posted_at && (
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                        <Calendar className="h-4 w-4" />
                        Last job posted {formatRelativeDate(companyData.stats.latest_job_posted_at)}
                      </div>
                    )}
                  </div>

                  <div className={UI_CLASSES.FLEX_GAP_2}>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`${ROUTES.ACCOUNT_COMPANIES}/${companyData.id}/edit`}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/companies/${companyData.slug}`}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
