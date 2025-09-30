'use client';

import { ExternalLink, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContentSidebarProps, UnifiedContentItem } from '@/lib/schemas';
import { getDisplayTitle } from '@/lib/utils';

export function ContentSidebar<T extends UnifiedContentItem>({
  item,
  relatedItems,
  type,
  typeName,
}: ContentSidebarProps<T>) {
  const router = useRouter();

  const contentType = (() => {
    if (type === 'commands') return 'Command Script';
    if (type === 'agents') return 'Agent Configuration';
    if (type === 'rules') return 'Project Rule';
    if (type === 'hooks') return 'Hook Configuration';
    if (type === 'mcp') return 'MCP Server';
    if (type === 'guides') return 'Guide';
    return 'Content';
  })();

  return (
    <div className="space-y-6 sticky top-20 self-start">
      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Always show GitHub link to the Content file in our repo */}
          <Button variant="outline" className="w-full justify-start" asChild>
            <a
              href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/${type}/${item.slug}.json`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </Button>
          {(() => {
            const docUrl =
              ('documentationUrl' in item && typeof item.documentationUrl === 'string'
                ? item.documentationUrl
                : '') ||
              ('documentation' in item &&
              typeof (item as { documentation?: string }).documentation === 'string'
                ? (item as { documentation: string }).documentation
                : '');
            return (
              docUrl && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={docUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentation
                  </a>
                </Button>
              )
            );
          })()}
        </CardContent>
      </Card>

      {/* Content Details */}
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          {item.category && (
            <div>
              <h4 className="font-medium mb-1">Category</h4>
              <Badge
                variant="default"
                className="text-xs font-medium bg-purple-500/20 text-purple-500 border-purple-500/30"
              >
                {item.category === type ? typeName : item.category}
              </Badge>
            </div>
          )}

          {/* Content Type */}
          <div>
            <h4 className="font-medium mb-1">Type</h4>
            <Badge variant="secondary" className="text-xs">
              {contentType}
            </Badge>
          </div>

          {/* Version */}
          {'version' in item && item.version ? (
            <div>
              <h4 className="font-medium mb-1">Version</h4>
              <p className="text-sm text-muted-foreground">{item.version as string}</p>
            </div>
          ) : null}

          {/* Author */}
          {item.author && (
            <div>
              <h4 className="font-medium mb-1">Author</h4>
              <p className="text-sm text-muted-foreground">{item.author}</p>
            </div>
          )}

          {/* Updated */}
          {'updated' in item && item.updated ? (
            <div>
              <h4 className="font-medium mb-1">Updated</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(item.updated as string).toLocaleDateString()}
              </p>
            </div>
          ) : null}

          {/* Status (for MCP servers) */}
          {'status' in item && item.status ? (
            <div>
              <h4 className="font-medium mb-1">Status</h4>
              <Badge
                variant={(item.status as string) === 'stable' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {item.status as string}
              </Badge>
            </div>
          ) : null}

          {/* Runtime (for MCP servers) */}
          {'runtime' in item && item.runtime ? (
            <div>
              <h4 className="font-medium mb-1">Runtime</h4>
              <Badge variant="secondary" className="text-xs">
                {item.runtime as string}
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Related Content */}
      {relatedItems && relatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related {typeName}s</CardTitle>
            <CardDescription>Similar content you might find useful</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {relatedItems.slice(0, 5).map((relatedItem, index) => (
              <Button
                key={`${relatedItem.slug}-${index}`}
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => router.push(`/${type}/${relatedItem.slug}`)}
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{getDisplayTitle(relatedItem)}</p>
                  {relatedItem.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {relatedItem.description}
                    </p>
                  )}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
