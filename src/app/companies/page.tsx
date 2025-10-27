import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { Briefcase, Building, ExternalLink, Plus, Star, TrendingUp } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

// Database-first types (from generated database schema)
type CompanyJobStats = Database['public']['Views']['company_job_stats']['Row'];

export const metadata = generatePageMetadata('/companies');

// ISR: Revalidate every 1 hour (materialized view refreshes hourly)
export const revalidate = 3600;

export default async function CompaniesPage() {
  const supabase = await createAdminClient();

  // Fetch companies
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
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
          <div className={'text-center max-w-3xl mx-auto'}>
            <div className={'flex justify-center mb-6'}>
              <div className={'p-3 bg-accent/10 rounded-full'}>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className={UI_CLASSES.TEXT_HEADING_HERO}>Companies Directory</h1>

            <p className={UI_CLASSES.TEXT_HEADING_MEDIUM}>
              Discover companies building the future with Claude and Cursor
            </p>

            <div className={'flex justify-center gap-2 mb-8'}>
              <UnifiedBadge variant="base" style="secondary">
                <Building className="h-3 w-3 mr-1" />
                {companies?.length || 0} Companies
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="outline">
                Verified Profiles
              </UnifiedBadge>
            </div>

            <Button variant="outline" asChild>
              <Link href={ROUTES.ACCOUNT_COMPANIES}>
                <Plus className="h-4 w-4 mr-2" />
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
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No companies yet</h3>
              <p className={'text-muted-foreground text-center max-w-md mb-4'}>
                Be the first company to join the directory!
              </p>
              <Button asChild>
                <Link href={ROUTES.ACCOUNT_COMPANIES}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your Company
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
            {companies.map((company) => (
              <Card key={company.id} className={UI_CLASSES.CARD_GRADIENT_HOVER}>
                {company.featured && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <UnifiedBadge variant="base" className="bg-accent text-accent-foreground">
                      <Star className="h-3 w-3 mr-1" />
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
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle>
                        <Link
                          href={`/companies/${company.slug}`}
                          className="group-hover:text-accent transition-colors-smooth"
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
                    <p className={'text-sm text-muted-foreground mb-4 line-clamp-2'}>
                      {company.description}
                    </p>
                  )}

                  {/* Job Statistics from Materialized View */}
                  {(() => {
                    const stats = statsMap.get(company.id);
                    if (stats && (stats.active_jobs ?? 0) > 0) {
                      return (
                        <div className={'flex flex-wrap gap-2 mb-4'}>
                          <UnifiedBadge variant="base" style="secondary" className="text-xs">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {stats.active_jobs} Active {stats.active_jobs === 1 ? 'Job' : 'Jobs'}
                          </UnifiedBadge>

                          {stats.total_views !== null && stats.total_views > 0 && (
                            <UnifiedBadge variant="base" style="outline" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
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
