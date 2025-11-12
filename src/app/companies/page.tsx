import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/badge';
import { Button } from '@/src/components/primitives/ui/button';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { Briefcase, Building, ExternalLink, Plus, Star, TrendingUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

// Database-first types (from generated database schema)
type CompanyJobStats = Database['public']['Views']['company_job_stats']['Row'];

export async function generateMetadata() {
  return await generatePageMetadata('/companies');
}

// Page is fully static - updates only on deployment (not when materialized view refreshes)
// To see hourly DB updates: implement revalidatePath('/companies') via webhook or cron
export const revalidate = false;

export default async function CompaniesPage() {
  const supabase = await createAdminClient();

  // Fetch companies - Optimized: Select only needed columns (9/14 = 36% reduction)
  const { data: companies } = await supabase
    .from('companies')
    .select('id, slug, name, logo, website, description, size, industry, featured, created_at')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  // Fetch job stats using materialized view (performance optimized)
  const companyIds = companies?.map((c) => c.id) || [];

  let stats: CompanyJobStats[] = [];
  if (companyIds.length > 0) {
    const { data } = await supabase
      .from('company_job_stats')
      .select('*')
      .in('company_id', companyIds);
    stats = data || [];
  }

  const statsMap = new Map(stats.map((stat) => [stat.company_id, stat]));

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero */}
      <section className={`${UI_CLASSES.CONTAINER_OVERFLOW_BORDER}`}>
        <div className={'container mx-auto px-4 py-20'}>
          <div className={'mx-auto max-w-3xl text-center'}>
            <div className={'mb-6 flex justify-center'}>
              <div className={'rounded-full bg-accent/10 p-3'}>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Companies Directory</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover companies building the future with Claude and Cursor
            </p>

            <div className={'mb-8 flex justify-center gap-2'}>
              <UnifiedBadge variant="base" style="secondary">
                <Building className="mr-1 h-3 w-3" />
                {companies?.length || 0} Companies
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Verified Profiles
              </UnifiedBadge>
            </div>

            <Button variant="outline" asChild>
              <Link href={ROUTES.ACCOUNT_COMPANIES}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your Company
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className={'container mx-auto px-4 py-12'}>
        {!companies || companies.length === 0 ? (
          <Card>
            <CardContent className={'flex flex-col items-center py-12'}>
              <Building className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-xl">No companies yet</h3>
              <p className={'mb-4 max-w-md text-center text-muted-foreground'}>
                Be the first company to join the directory!
              </p>
              <Button asChild>
                <Link href={ROUTES.ACCOUNT_COMPANIES}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your Company
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
            {companies.map((company, index) => (
              <Card key={company.id} className={UI_CLASSES.CARD_GRADIENT_HOVER}>
                {company.featured && (
                  <div className="-top-2 -right-2 absolute z-10">
                    <UnifiedBadge variant="base" className="bg-accent text-accent-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </UnifiedBadge>
                  </div>
                )}

                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    {company.logo && (
                      <Image
                        src={company.logo}
                        alt={`${company.name} logo`}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                        priority={index < 6}
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle>
                        <Link
                          href={`/companies/${company.slug}`}
                          className="transition-colors-smooth group-hover:text-accent"
                        >
                          {company.name}
                        </Link>
                      </CardTitle>
                      {company.industry && <CardDescription>{company.industry}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {company.description && (
                    <p className={'mb-4 line-clamp-2 text-muted-foreground text-sm'}>
                      {company.description}
                    </p>
                  )}

                  {/* Job Statistics from Materialized View */}
                  {(() => {
                    const stats = statsMap.get(company.id);
                    if (stats && (stats.active_jobs ?? 0) > 0) {
                      return (
                        <div className={'mb-4 flex flex-wrap gap-2'}>
                          <UnifiedBadge variant="base" style="secondary" className="text-xs">
                            <Briefcase className="mr-1 h-3 w-3" />
                            {stats.active_jobs} Active {stats.active_jobs === 1 ? 'Job' : 'Jobs'}
                          </UnifiedBadge>

                          {stats.total_views !== null && stats.total_views > 0 && (
                            <UnifiedBadge variant="base" style="outline" className="text-xs">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              {stats.total_views.toLocaleString()} views
                            </UnifiedBadge>
                          )}

                          {stats.remote_jobs !== null && stats.remote_jobs > 0 && (
                            <UnifiedBadge variant="base" style="outline" className="text-xs">
                              {stats.remote_jobs} Remote
                            </UnifiedBadge>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    {company.size && (
                      <UnifiedBadge variant="base" style="outline" className="text-xs">
                        {company.size} employees
                      </UnifiedBadge>
                    )}

                    {company.website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture source="content_page" variant="hero" context="companies-page" />
      </section>
    </div>
  );
}
