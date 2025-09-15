import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Github } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ConfigCardProps {
  id: string;
  title?: string;
  name?: string;
  description: string;
  tags: string[];
  author: string;
  slug: string;
  category: string;
  popularity: number;
  type: 'rule' | 'mcp';
  repository?: string;
  documentation?: string;
}

export const ConfigCard = ({ 
  title,
  name,
  description, 
  tags, 
  author, 
  slug, 
  category, 
  popularity,
  type,
  repository,
  documentation
}: ConfigCardProps) => {
  const displayTitle = title || name || 'Untitled';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://claudepro.directory/${type}/${slug}`);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The config link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleViewConfig = () => {
    window.open(`/${type}/${slug}`, '_blank');
  };

  const getCategoryColor = (cat: string) => {
    const colors = {
      development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      writing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      analysis: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      creative: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      business: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      database: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      api: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'file-system': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      ai: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      productivity: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      automation: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[cat as keyof typeof colors] || colors.other;
  };

  return (
    <Card className="group hover:glow-effect transition-smooth cursor-pointer card-gradient border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors-smooth">
              {displayTitle}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Badge variant="secondary" className={getCategoryColor(category)}>
              {category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>by {author}</span>
            <span>•</span>
            <span>{popularity}% popular</span>
          </div>
          
          <div className="flex items-center gap-1">
            {repository && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(repository, '_blank');
                }}
              >
                <Github className="h-3 w-3" />
              </Button>
            )}
            
            {documentation && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(documentation, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleViewConfig();
              }}
            >
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};