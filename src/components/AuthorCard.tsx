import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Author } from '@/data/authors';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  ExternalLink, 
  MapPin, 
  Building, 
  Check,
  Star,
  Calendar
} from 'lucide-react';

interface AuthorCardProps {
  author: Author;
  showStats?: boolean;
}

export const AuthorCard = ({ author, showStats = true }: AuthorCardProps) => {
  const formatJoinDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <Card className="card-gradient hover-lift transition-smooth group">
      <CardHeader className="text-center pb-4">
        <div className="relative mx-auto mb-4">
          <img 
            src={author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.username}`}
            alt={`${author.name} avatar`}
            className="h-20 w-20 rounded-full object-cover border-2 border-border"
          />
          {author.verified && (
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {author.name}
          </h3>
          <p className="text-muted-foreground text-sm">@{author.username}</p>
          
          {author.company && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              {author.company}
            </div>
          )}
          
          {author.location && (
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {author.location}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {author.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {author.bio}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1 mb-4">
          {author.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="outline" className="text-xs">
              {category}
            </Badge>
          ))}
          {author.categories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{author.categories.length - 3}
            </Badge>
          )}
        </div>
        
        {showStats && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-center">
            <div>
              <div className="text-lg font-semibold text-primary">
                {author.totalContributions}
              </div>
              <div className="text-xs text-muted-foreground">Contributions</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-primary flex items-center justify-center gap-1">
                <Star className="h-3 w-3" />
                {author.featuredContributions}
              </div>
              <div className="text-xs text-muted-foreground">Featured</div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 mb-4">
          {author.github && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`https://github.com/${author.github}`} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
              </a>
            </Button>
          )}
          {author.twitter && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`https://twitter.com/${author.twitter}`} target="_blank" rel="noopener noreferrer">
                <Twitter className="h-4 w-4" />
              </a>
            </Button>
          )}
          {author.linkedin && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`https://linkedin.com/in/${author.linkedin}`} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          )}
          {author.website && (
            <Button variant="ghost" size="sm" asChild>
              <a href={author.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Joined {formatJoinDate(author.joinedAt)}
        </div>
        
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link to={`/author/${author.username}`}>
            View Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};