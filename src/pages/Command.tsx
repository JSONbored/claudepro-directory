import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CodeHighlight } from '@/components/CodeHighlight';
import { RelatedConfigs } from '@/components/RelatedConfigs';
import { 
  ArrowLeft, 
  Terminal, 
  Calendar, 
  User, 
  Tag, 
  Star, 
  Code,
  Play,
  Settings,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Github
} from 'lucide-react';
import { getCommandBySlug, commands } from '@/data/commands';
import { toast } from '@/hooks/use-toast';
import NotFound from './NotFound';

const Command = () => {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  
  if (!slug) {
    return <NotFound />;
  }

  const command = getCommandBySlug(slug);
  
  if (!command) {
    return <NotFound />;
  }

  const relatedCommands = commands
    .filter(c => c.id !== command.id && c.category === command.category)
    .slice(0, 3);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(command.content);
      setCopied(true);
      toast({
        title: "Configuration copied!",
        description: "The command configuration has been copied to your clipboard.",
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
        description: "The command link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/commands" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Commands
            </Link>
          </Button>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Terminal className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{command.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{command.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">{command.category}</Badge>
                {command.featured && (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {command.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {command.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(command.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Popularity: {command.popularity}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button onClick={handleCopyContent} className="flex items-center gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Configuration
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Share Link
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open(`https://github.com/JSONbored/claudepro-directory/blob/main/src/data/commands/${command.slug}.ts`, '_blank')}
          >
            <Github className="h-4 w-4 mr-2" />
            Repository
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Syntax */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Command Syntax
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CodeHighlight
                  code={command.syntax}
                  language="bash"
                />
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: command.content.replace(/\n/g, '<br>') }} />
                </div>
              </CardContent>
            </Card>

            {/* Parameters */}
            {command.parameters && command.parameters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {command.parameters.map((param, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {param.name}
                          </code>
                          <Badge variant={param.required ? 'destructive' : 'secondary'} className="text-xs">
                            {param.required ? 'Required' : 'Optional'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {param.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{param.description}</p>
                        {param.default !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Default: <code className="bg-muted px-1 rounded">{String(param.default)}</code>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Examples */}
            {command.examples && command.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {command.examples.map((example, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="font-medium">{example.title}</h4>
                        <p className="text-sm text-muted-foreground">{example.description}</p>
                        <CodeHighlight
                          code={example.command}
                          language="bash"
                        />
                        {example.output && (
                          <div>
                            <p className="text-sm font-medium mb-1">Output:</p>
                            <CodeHighlight
                              code={example.output}
                              language="text"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platforms */}
            {command.platforms && command.platforms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Supported Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {command.platforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(command.syntax)}
                >
                  Copy Command
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  Share Link
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(`https://github.com/JSONbored/claudepro-directory/blob/main/src/data/commands/${command.slug}.ts`, '_blank')}
                >
                  Repository
                </Button>
                {command.repository && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(command.repository, '_blank')}
                  >
                    Documentation
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/submit">
                    Submit Improvement
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Commands */}
        {relatedCommands.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-8" />
            <RelatedConfigs
              title="Related Commands"
              configs={relatedCommands}
              type="command"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Command;