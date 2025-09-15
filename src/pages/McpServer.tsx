import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Copy, Check, Calendar, User, TrendingUp, ExternalLink, Github } from 'lucide-react';
import { getMcpBySlug, mcpServers } from '@/data/mcp';
import { rules } from '@/data/rules';
import { RelatedConfigs } from '@/components/RelatedConfigs';
import { getRelatedConfigs } from '@/lib/recommendations';
import { toast } from '@/hooks/use-toast';

const McpServer = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const mcp = slug ? getMcpBySlug(slug) : null;
  const relatedConfigs = mcp ? getRelatedConfigs(mcp, rules, mcpServers, 4) : [];

  if (!mcp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">MCP Server Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested MCP server could not be found.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(mcp.config);
      setCopied(true);
      toast({
        title: "Configuration copied!",
        description: "The MCP server configuration has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the configuration to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "The MCP server link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      database: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      api: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'file-system': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      ai: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      productivity: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      automation: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </Button>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Copy className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{mcp.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{mcp.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default" className={getCategoryColor(mcp.category)}>
                  {mcp.category}
                </Badge>
                <Badge variant="outline">MCP Server</Badge>
                {mcp.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {mcp.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(mcp.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Popularity: {mcp.popularity}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button onClick={handleCopyConfig} className="flex items-center gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Config
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Share Link
          </Button>
          {mcp.repository && (
            <Button 
              variant="outline" 
              onClick={() => window.open(mcp.repository, '_blank')}
            >
              <Github className="h-4 w-4 mr-2" />
              Repository
            </Button>
          )}
          {mcp.documentation && (
            <Button 
              variant="outline" 
              onClick={() => window.open(mcp.documentation, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Configuration */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Configuration</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyConfig}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add this configuration to your Claude Desktop app's MCP settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/30 p-6 rounded-lg border overflow-x-auto">
                    <code>{mcp.config}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Installation Instructions */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle>Installation Instructions</CardTitle>
                <CardDescription>
                  How to set up this MCP server with Claude Desktop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Locate your Claude Desktop config file:</h4>
                  <div className="bg-muted/30 p-3 rounded text-sm font-mono">
                    <div><strong>macOS:</strong> ~/Library/Application Support/Claude/claude_desktop_config.json</div>
                    <div><strong>Windows:</strong> %APPDATA%\Claude\claude_desktop_config.json</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">2. Add the configuration:</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy the configuration above and merge it into your existing config file.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. Restart Claude Desktop:</h4>
                  <p className="text-sm text-muted-foreground">
                    Completely quit and restart Claude Desktop for the changes to take effect.
                  </p>
                </div>

                {mcp.documentation && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">4. Additional Setup:</h4>
                    <p className="text-sm text-muted-foreground">
                      Check the{' '}
                      <button 
                        onClick={() => window.open(mcp.documentation, '_blank')}
                        className="text-primary hover:underline"
                      >
                        official documentation
                      </button>
                      {' '}for any additional configuration steps.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* MCP Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MCP Server Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Category</div>
                  <Badge variant="secondary" className={getCategoryColor(mcp.category)}>
                    {mcp.category}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Popularity</div>
                  <div className="text-sm">{mcp.popularity}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <div className="text-sm">{new Date(mcp.createdAt).toLocaleDateString()}</div>
                </div>
                {mcp.repository && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Repository</div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => window.open(mcp.repository, '_blank')}
                    >
                      View on GitHub
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Configurations */}
        {relatedConfigs.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-8" />
            <RelatedConfigs configs={relatedConfigs} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Found this MCP server helpful?{' '}
              <button 
                onClick={handleCopyLink}
                className="text-primary hover:underline"
              >
                Share it with others
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default McpServer;