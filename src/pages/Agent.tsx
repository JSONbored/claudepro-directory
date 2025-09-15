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
  Bot, 
  Calendar, 
  User, 
  Tag, 
  Star, 
  CheckCircle,
  Target,
  Zap,
  Settings,
  Copy,
  Check,
  ExternalLink,
  Github
} from 'lucide-react';
import { getAgentBySlug, agents } from '@/data/agents';
import { toast } from '@/hooks/use-toast';
import NotFound from './NotFound';

const Agent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  
  if (!slug) {
    return <NotFound />;
  }

  const agent = getAgentBySlug(slug);
  
  if (!agent) {
    return <NotFound />;
  }

  const relatedAgents = agents
    .filter(a => a.id !== agent.id && a.category === agent.category)
    .slice(0, 3);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(agent.content);
      setCopied(true);
      toast({
        title: "Configuration copied!",
        description: "The agent configuration has been copied to your clipboard.",
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
        description: "The agent link has been copied to your clipboard.",
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
            <Link to="/agents" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Link>
          </Button>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{agent.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{agent.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">{agent.category}</Badge>
                {agent.featured && (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {agent.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {agent.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(agent.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Popularity: {agent.popularity}%
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
          {agent.repository && (
            <Button 
              variant="outline" 
              onClick={() => window.open(agent.repository!, '_blank')}
            >
              <Github className="h-4 w-4 mr-2" />
              Repository
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Agent Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Agent Configuration
                </CardTitle>
                <CardDescription>
                  Copy and paste this configuration to set up the agent in Claude
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeHighlight
                  code={agent.content}
                  language="markdown"
                  showCopy={true}
                />
              </CardContent>
            </Card>

            {/* Capabilities */}
            {agent.capabilities && agent.capabilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {agent.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Use Cases */}
            {agent.useCases && agent.useCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {agent.useCases.map((useCase, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        <span>{useCase}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requirements */}
            {agent.requirements && agent.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agent.requirements.map((req, index) => (
                      <div key={index} className="text-sm">{req}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integrations */}
            {agent.integrations && agent.integrations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Integrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.integrations.map((integration) => (
                      <Badge key={integration} variant="outline">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Agents */}
        {relatedAgents.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-8" />
            <RelatedConfigs
              title="Related Agents"
              configs={relatedAgents}
              type="agent"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent;