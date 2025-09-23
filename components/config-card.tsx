'use client';

import { Check, Copy, ExternalLink, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import { trackCopy } from '@/app/actions/track-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge, TagBadge, TypeBadge } from '@/components/ui/config-badge';
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
        // Track copy action for analytics (silent fail)
        trackCopy(type, slug).catch(() => {
          // Silent fail - don't break UX
        });

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
                <TypeBadge type={type} />
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
                <SourceBadge source={source} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <TagBadge key={tag} tag={tag} />
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
