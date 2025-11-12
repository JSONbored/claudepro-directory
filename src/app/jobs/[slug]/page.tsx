/**
 * Job Detail Page - Database-first job listing display
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { getJobBySlug } from '@/src/lib/data/jobs';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Users,
} from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PageProps } from '@/src/lib/schemas/app.schema';
import { slugParamsSchema } from '@/src/lib/schemas/app.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  return generatePageMetadata('/jobs/:slug', {
    params: { slug },
    item: job ? { ...job, tags: job.tags as string[] } : undefined,
    slug,
  });
}

export async function generateStaticParams() {
  const { getJobs } = await import('@/src/lib/data/jobs');
  const jobs = await getJobs();

  if (jobs.length === 0) {
    logger.warn('No jobs available - returning placeholder param');
    return [{ slug: 'placeholder' }];
  }

  return jobs.map((job) => ({ slug: job.slug }));
}

export default async function JobPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for job page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      { slug: String(rawParams.slug), errorCount: validationResult.error.issues.length }
    );
    notFound();
  }

  const { slug } = validationResult.data;
  const job = await getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  const tags = job.tags as unknown as string[];
  const requirements = job.requirements as unknown as string[];
  const benefits = job.benefits as unknown as string[];

  return (
    <>
      <StructuredData route={`/jobs/${slug}`} />

      <div className={'min-h-screen bg-background'}>
        <div className={'border-border/50 border-b bg-card/30'}>
          <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" asChild className="mb-6">
              <Link href={ROUTES.JOBS}>
                <ArrowLeft className={'mr-2 h-4 w-4'} />
                Back to Jobs
              </Link>
            </Button>

            <div className="max-w-4xl">
              <div className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3} mb-6 gap-4`}>
                <div className={'rounded-lg bg-accent/10 p-3'}>
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="mb-2 font-bold text-3xl">{job.title}</h1>
                  <p className={'text-muted-foreground text-xl'}>{job.company}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <DollarSign className="h-4 w-4" />
                  <span>{job.salary || 'Competitive'}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Clock className="h-4 w-4" />
                  <span>{job.type}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Users className="h-4 w-4" />
                  <span>{job.category}</span>
                </div>
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                  <Calendar className="h-4 w-4" />
                  <span>Posted {job.posted_at}</span>
                </div>
              </div>

              <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
                {tags.map((skill) => (
                  <UnifiedBadge key={skill} variant="base" style="secondary">
                    {skill}
                  </UnifiedBadge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className={'space-y-8 lg:col-span-2'}>
              <Card>
                <CardHeader>
                  <CardTitle>About this role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{job.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirements.map((req) => (
                      <li key={req} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                        <span className="mt-1 text-accent">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {benefits.map((benefit) => (
                        <li key={benefit} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                          <span className="mt-1 text-green-500">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Apply Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" asChild>
                    <a href={job.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className={'mr-2 h-4 w-4'} />
                      Apply Now
                    </a>
                  </Button>
                  {job.contact_email && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`mailto:${job.contact_email}`}>
                        <Building2 className={'mr-2 h-4 w-4'} />
                        Contact Company
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <Clock className={'h-4 w-4 text-muted-foreground'} />
                    <span>{job.type.charAt(0).toUpperCase() + job.type.slice(1)}</span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <MapPin className={'h-4 w-4 text-muted-foreground'} />
                    <span>{job.remote ? 'Remote Available' : 'On-site'}</span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
                    <Users className={'h-4 w-4 text-muted-foreground'} />
                    <span>{job.category.charAt(0).toUpperCase() + job.category.slice(1)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
