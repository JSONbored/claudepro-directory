import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BreadcrumbSchema } from '@/src/components/structured-data/breadcrumb-schema';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { APP_CONFIG, ROUTES } from '@/src/lib/constants';
import { jobs } from '@/src/lib/data/jobs';
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

  // Load job data for metadata generation
  const job = jobs.find((j) => j.slug === slug);

  return generatePageMetadata('/jobs/:slug', {
    params: { slug },
    item: job || undefined,
    slug,
  });
}

export async function generateStaticParams() {
  return jobs.map((job) => ({
    slug: job.slug,
  }));
}

// Enable ISR - revalidate every 4 hours

export default async function JobPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for job page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        slug: String(rawParams.slug),
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const { slug } = validationResult.data;

  logger.info('Job page accessed', {
    slug: slug,
    validated: true,
  });

  const job = jobs.find((j) => j.slug === slug);

  if (!job) {
    notFound();
  }

  return (
    <>
      {/* Breadcrumb Schema - SEO optimization */}
      {
        await (
          <BreadcrumbSchema
            items={[
              {
                name: 'Jobs',
                url: `${APP_CONFIG.url}/jobs`,
              },
              {
                name: job.title,
                url: `${APP_CONFIG.url}/jobs/${job.slug}`,
              },
            ]}
          />
        )
      }

      <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
        {/* Header */}
        <div className={`${UI_CLASSES.BORDER_B} border-border/50 ${UI_CLASSES.BG_CARD}/30`}>
          <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" asChild className={UI_CLASSES.MB_6}>
              <Link href={ROUTES.JOBS}>
                <ArrowLeft className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />
                Back to Jobs
              </Link>
            </Button>

            <div className={UI_CLASSES.MAX_W_4XL}>
              <div className={`${UI_CLASSES.FLEX_ITEMS_START_GAP_3} gap-4 mb-6`}>
                <div className={`p-3 ${UI_CLASSES.BG_ACCENT_10} ${UI_CLASSES.ROUNDED_LG}`}>
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <p className={`${UI_CLASSES.TEXT_XL} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    {job.company}
                  </p>
                </div>
              </div>

              {/* Job Meta */}
              <div className={UI_CLASSES.FLEX_WRAP_MUTED}>
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
                  <span>Posted {job.postedAt}</span>
                </div>
              </div>

              {/* Tags */}
              <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
                {job.tags.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className={`lg:col-span-2 ${UI_CLASSES.SPACE_Y_8}`}>
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About this role</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>{job.description}</p>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className={UI_CLASSES.SPACE_Y_2}>
                    {job.requirements.map((req) => (
                      <li key={req} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                        <span className="text-accent mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className={UI_CLASSES.SPACE_Y_2}>
                      {job.benefits.map((benefit) => (
                        <li key={benefit} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className={UI_CLASSES.SPACE_Y_6}>
              {/* Apply Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                </CardHeader>
                <CardContent className={UI_CLASSES.SPACE_Y_2}>
                  <Button className={UI_CLASSES.W_FULL} asChild>
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />
                      Apply Now
                    </a>
                  </Button>
                  {job.contactEmail && (
                    <Button variant="outline" className={UI_CLASSES.W_FULL} asChild>
                      <a href={`mailto:${job.contactEmail}`}>
                        <Building2 className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />
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
                <CardContent className={UI_CLASSES.SPACE_Y_2}>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_SM}`}>
                    <Clock className={`h-4 w-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`} />
                    <span>{job.type.charAt(0).toUpperCase() + job.type.slice(1)}</span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_SM}`}>
                    <MapPin className={`h-4 w-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`} />
                    <span>{job.remote ? 'Remote Available' : 'On-site'}</span>
                  </div>
                  <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_SM}`}>
                    <Users className={`h-4 w-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`} />
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
