/**
 * Custom Sidebar Renderers
 *
 * Type-specific sidebar rendering logic for detail pages.
 * Provides customized sidebar content based on content type.
 */

import { ExternalLink, Github, Thermometer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UnifiedContentItem } from '@/lib/schemas/components';
import { getDisplayTitle } from '@/lib/utils';

/**
 * Agent Sidebar Renderer
 *
 * Displays agent-specific metadata (temperature, tokens, tools)
 */
export function renderAgentSidebar(
  item: UnifiedContentItem,
  relatedItems: UnifiedContentItem[],
  router: { push: (path: string) => void }
): React.ReactNode {
  return (
    <div className="space-y-6">
      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a
              href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/agents/${item.slug}.json`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </Button>
          {item.documentationUrl && (
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={item.documentationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Agent Details */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.category && (
            <div>
              <h4 className="font-medium mb-1">Category</h4>
              <Badge
                variant="default"
                className="text-xs font-medium bg-purple-500/20 text-purple-500 border-purple-500/30"
              >
                {item.category === 'agents' ? 'Agent' : item.category}
              </Badge>
            </div>
          )}

          {'configuration' in item &&
            typeof item.configuration === 'object' &&
            item.configuration &&
            'temperature' in item.configuration && (
              <div>
                <h4 className="font-medium mb-1">Temperature</h4>
                <div className="flex items-center gap-2">
                  <Thermometer className="h-3 w-3 text-orange-500" />
                  <Badge
                    variant="outline"
                    className="text-xs font-medium bg-orange-500/10 text-orange-600 border-orange-500/30"
                  >
                    {String((item.configuration as { temperature: number }).temperature)}
                  </Badge>
                </div>
              </div>
            )}

          {item.source && (
            <div>
              <h4 className="font-medium mb-1">Source</h4>
              <Badge variant="outline">{item.source}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Agents */}
      {relatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedItems.slice(0, 3).map((relatedItem) => (
              <Button
                key={relatedItem.slug}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => router.push(`/agents/${relatedItem.slug}`)}
              >
                <div className="text-left w-full min-w-0">
                  <div className="font-medium text-sm leading-tight mb-1">
                    {getDisplayTitle(relatedItem)}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {relatedItem.description}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * MCP Server Sidebar Renderer
 *
 * Displays MCP-specific metadata (package, auth, permissions)
 */
export function renderMCPSidebar(
  item: UnifiedContentItem,
  relatedItems: UnifiedContentItem[],
  router: { push: (path: string) => void }
): React.ReactNode {
  return (
    <div className="space-y-6">
      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a
              href={`https://github.com/JSONbored/claudepro-directory/blob/main/content/mcp/${item.slug}.json`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </Button>
          {item.documentationUrl && (
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={item.documentationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* MCP Server Details */}
      <Card>
        <CardHeader>
          <CardTitle>MCP Server Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.category && (
            <div>
              <h4 className="font-medium mb-1">Category</h4>
              <Badge
                variant="default"
                className="text-xs font-medium bg-green-500/20 text-green-500 border-green-500/30"
              >
                {item.category === 'mcp' ? 'MCP Server' : item.category}
              </Badge>
            </div>
          )}

          {item.source && (
            <div>
              <h4 className="font-medium mb-1">Source</h4>
              <Badge variant="outline">{item.source}</Badge>
            </div>
          )}

          {'package' in item && item.package && (
            <div>
              <h4 className="font-medium mb-1">Package</h4>
              <Badge variant="outline" className="font-mono text-xs">
                {String(item.package)}
              </Badge>
            </div>
          )}

          {'requiresAuth' in item && item.requiresAuth !== undefined && (
            <div>
              <h4 className="font-medium mb-1">Authentication</h4>
              <p className="text-sm text-muted-foreground">
                {item.requiresAuth ? 'Required' : 'Not required'}
              </p>
            </div>
          )}

          {'permissions' in item &&
            Array.isArray(item.permissions) &&
            (item.permissions as string[]).length > 0 && (
              <div>
                <h4 className="font-medium mb-1">Permissions</h4>
                <div className="flex flex-wrap gap-1">
                  {(item.permissions as string[]).map((perm: string) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Related MCP Servers */}
      {relatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related MCP Servers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedItems.slice(0, 3).map((relatedItem) => (
              <Button
                key={relatedItem.slug}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => router.push(`/mcp/${relatedItem.slug}`)}
              >
                <div className="text-left w-full min-w-0">
                  <div className="font-medium text-sm leading-tight mb-1">
                    {getDisplayTitle(relatedItem)}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {relatedItem.description}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
