import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jobs, Job } from '@/data/jobs';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  Star,
  Search,
  Filter,
  Briefcase,
  Building
} from 'lucide-react';

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
      const matchesType = selectedType === 'all' || job.type === selectedType;
      const matchesRemote = !showRemoteOnly || job.remote;
      
      return matchesSearch && matchesCategory && matchesType && matchesRemote;
    });
  }, [searchQuery, selectedCategory, selectedType, showRemoteOnly]);

  const getTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
      'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'contract': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'freelance': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'remote': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
    return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const formatSalary = (salary?: string) => {
    if (!salary) return 'Salary not specified';
    return salary;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-10" />
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary">
              <Briefcase className="h-3 w-3 mr-1" />
              Jobs Board
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Find Your Dream Job in AI
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover opportunities with companies building the future of artificial intelligence. 
              From startups to industry giants, find your perfect role.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <Card className="card-gradient glow-effect">
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant={showRemoteOnly ? "default" : "outline"}
                  onClick={() => setShowRemoteOnly(!showRemoteOnly)}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Remote Only
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Jobs Grid */}
      <section className="px-4 pb-16">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Available Positions</h2>
              <p className="text-muted-foreground">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
              </p>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or check back later for new opportunities.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setShowRemoteOnly(false);
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="card-gradient hover-lift transition-smooth group relative">
                  {job.featured && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {job.companyLogo && (
                            <img 
                              src={job.companyLogo} 
                              alt={`${job.company} logo`}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                              {job.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building className="h-4 w-4" />
                              <span className="font-medium">{job.company}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(job.postedAt)}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job.salary)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getTypeColor(job.type)}>
                          {job.type.replace('-', ' ')}
                        </Badge>
                        {job.remote && (
                          <Badge variant="secondary">Remote</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {job.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.tags.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button asChild className="flex-1">
                        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                          Apply Now
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to={`/jobs/${job.slug}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}