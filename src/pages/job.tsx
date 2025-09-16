import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  DollarSign,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getJobBySlug } from '@/data/jobs';

export default function Job() {
  const { slug } = useParams<{ slug: string }>();
  const job = slug ? getJobBySlug(slug) : null;

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center max-w-md mx-auto">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/jobs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
      'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      contract: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      freelance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/jobs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
          </Button>

          {/* Job Header */}
          <Card className="card-gradient glow-effect mb-8">
            <CardHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    {job.companyLogo && (
                      <img
                        src={job.companyLogo}
                        alt={`${job.company} logo`}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-5 w-5" />
                        <span className="text-lg font-medium">{job.company}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Posted {formatDate(job.postedAt)}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Badge className={`${getTypeColor(job.type)} text-sm`}>
                    {job.type.replace('-', ' ')}
                  </Badge>
                  {job.remote && <Badge variant="secondary">Remote</Badge>}
                  {job.featured && (
                    <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex gap-4">
                <Button size="lg" asChild className="flex-1 sm:flex-initial">
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                    Apply Now
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {job.requirements.map((requirement, index) => (
                      <li
                        key={requirement || `requirement-${index}`}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Company Description */}
              {job.companyDescription && (
                <Card>
                  <CardHeader>
                    <CardTitle>About {job.company}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {job.companyDescription}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Job Type</h4>
                    <Badge className={getTypeColor(job.type)}>{job.type.replace('-', ' ')}</Badge>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <p className="text-muted-foreground capitalize">{job.category}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-1">Location</h4>
                    <p className="text-muted-foreground">{job.location}</p>
                  </div>

                  {job.salary && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-1">Salary</h4>
                        <p className="text-muted-foreground">{job.salary}</p>
                      </div>
                    </>
                  )}

                  {job.expiresAt && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-1">Application Deadline</h4>
                        <p className="text-muted-foreground">{formatDate(job.expiresAt)}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Skills & Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills & Technologies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Apply Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-3">Ready to apply?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Take the next step in your career with {job.company}.
                  </p>
                  <Button size="lg" asChild className="w-full">
                    <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                      Apply Now
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
