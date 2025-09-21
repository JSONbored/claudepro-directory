'use client';

import { Check, Copy, ExternalLink, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { getDisplayTitle } from '@/lib/utils';

interface ConfigCardProps {
  id: string;
  title?: string;
  name?: string;
  description: string;
  tags: string[];
  author: string;
  slug: string;
  category: string;
  source?: string;
  popularity?: number;
  type: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks';
  repository?: string;
  documentation?: string;
}

export const ConfigCard = memo(
  ({
    title,
    name,
    description,
    tags,
    author,
    slug,
    category: _category,
    source,
    popularity,
    type,
    repository,
    documentation,
  }: ConfigCardProps) => {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const displayTitle = getDisplayTitle({
      title: title || '',
      name: name || '',
      slug,
      category: type,
    });

    // Map types to their actual route paths - fixed routing
    const targetPath = `/${type}/${slug}`;

    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();

      const success = await copyToClipboard(`${window.location.origin}${targetPath}`, {
        component: 'config-card',
        action: 'copy-link',
      });

      setCopied(true);
      if (success) {
        toast({
          title: 'Link copied!',
          description: 'The config link has been copied to your clipboard.',
        });
      } else {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy the link to clipboard.',
          variant: 'destructive',
        });
      }
      setTimeout(() => setCopied(false), 2000);
    };

    const handleViewConfig = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(targetPath);
    };

    const handleCardClick = () => {
      router.push(targetPath);
    };
    const getSourceColor = (src: string) => {
      const colors = {
        official: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        partner: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        community: 'bg-green-500/10 text-green-400 border-green-500/20',
        verified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        experimental: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      };
      return colors[src as keyof typeof colors] || colors.other;
    };

    return (
      <Card
        className="group hover:glow-effect hover-lift transition-smooth cursor-pointer card-gradient border-border/50 hover:border-accent/20"
        onClick={handleCardClick}
        role="article"
        aria-label={`${displayTitle} - ${type} by ${author}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="default"
                  className={`text-xs font-medium ${
                    type === 'rules'
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                      : type === 'mcp'
                        ? 'bg-purple-500/20 text-purple-500 border-purple-500/30'
                        : type === 'agents'
                          ? 'bg-green-500/20 text-green-500 border-green-500/30'
                          : type === 'commands'
                            ? 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                            : type === 'hooks'
                              ? 'bg-pink-500/20 text-pink-500 border-pink-500/30'
                              : 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                  }`}
                >
                  {type === 'mcp'
                    ? 'MCP'
                    : type === 'rules'
                      ? 'Rule'
                      : type === 'agents'
                        ? 'Agent'
                        : type === 'commands'
                          ? 'Command'
                          : 'Hook'}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors-smooth">
                {displayTitle}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </CardDescription>
            </div>
            {source && (
              <div className="flex items-center gap-1 ml-2">
                <Badge variant="outline" className={`border ${getSourceColor(source)}`}>
                  {source}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-muted-foreground/20 text-muted-foreground hover:border-accent/30 hover:text-accent transition-colors-smooth"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && (
              <Badge
                variant="outline"
                className="text-xs border-muted-foreground/20 text-muted-foreground"
              >
                +{tags.length - 4}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>by {author}</span>
              {popularity !== undefined && (
                <>
                  <span>•</span>
                  <span>{popularity}% popular</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              {repository && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(repository, '_blank');
                  }}
                  aria-label={`View ${displayTitle} repository on GitHub`}
                >
                  <Github className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}

              {documentation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(documentation, '_blank');
                  }}
                  aria-label={`View ${displayTitle} documentation`}
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-accent/10 hover:text-accent"
                onClick={handleCopy}
                aria-label={copied ? 'Link copied to clipboard' : `Copy link to ${displayTitle}`}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-3 w-3" aria-hidden="true" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs hover:bg-accent/10 hover:text-accent"
                onClick={handleViewConfig}
                aria-label={`View details for ${displayTitle}`}
              >
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ConfigCard.displayName = 'ConfigCard';
