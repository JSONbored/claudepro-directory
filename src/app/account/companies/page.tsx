/**
 * Company Management Page - Database-First via Edge Function
 * Manages user's companies with CRUD operations via companies-handler
 */

import Image from 'next/image';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserCompanies } from '@/src/lib/data/account/user-data';
import { ROUTES } from '@/src/lib/data/config/constants';
import { Briefcase, Building2, Calendar, Edit, ExternalLink, Eye, Plus } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetGetUserCompaniesReturn } from '@/src/types/database-overrides';

export const metadata = generatePageMetadata('/account/companies');

export default async function CompaniesPage() {
  const { user } = await getAuthenticatedUser({ context: 'CompaniesPage' });

  if (!user) {
    logger.warn('CompaniesPage: unauthenticated access attempt detected');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let companies: GetGetUserCompaniesReturn['companies'] = [];
  let hasError = false;

  // User-scoped edge-cached RPC via centralized data layer
  try {
    const data = await getUserCompanies(user.id);

    if (data) {
      companies = data.companies ?? [];
    } else {
      logger.warn('CompaniesPage: getUserCompanies returned null', { userId: user.id });
      hasError = true;
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch user companies');
    logger.error('CompaniesPage: getUserCompanies threw', normalized, { userId: user.id });
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Companies unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your companies. Please refresh the page or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true} variant="outline">
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (companies.length === 0) {
    logger.info('CompaniesPage: user has no companies', { userId: user.id });
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
        <Button asChild={true}>
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
            <Button asChild={true}>
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
            return (
              <Card key={company.id}>
                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                    <div className="flex flex-1 items-start gap-4">
                      {company.logo ? (
                        <Image
                          src={company.logo}
                          alt={`${company.name} logo`}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-lg border object-cover"
                          priority={true}
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-accent">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                          <CardTitle>{company.name}</CardTitle>
                          {company.featured && (
                            <UnifiedBadge variant="base" style="default">
                              Featured
                            </UnifiedBadge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {company.description || 'No description provided'}
                        </CardDescription>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-flex items-center gap-1 text-sm ${UI_CLASSES.LINK_ACCENT}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {company.website.replace(/^https?:\/\//, '')}
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
                      {company.stats?.active_jobs || 0} active job
                      {(company.stats?.active_jobs || 0) !== 1 ? 's' : ''}
                    </div>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Eye className="h-4 w-4" />
                      {(company.stats?.total_views || 0).toLocaleString()} views
                    </div>
                    {company.stats?.latest_job_posted_at && (
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                        <Calendar className="h-4 w-4" />
                        Last job posted {formatRelativeDate(company.stats.latest_job_posted_at)}
                      </div>
                    )}
                  </div>

                  <div className={UI_CLASSES.FLEX_GAP_2}>
                    <Button variant="outline" size="sm" asChild={true}>
                      <Link href={`${ROUTES.ACCOUNT_COMPANIES}/${company.id}/edit`}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild={true}>
                      <Link href={`/companies/${company.slug}`}>
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
