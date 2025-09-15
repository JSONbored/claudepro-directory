import { useParams, Link } from 'react-router-dom';
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
  Settings
} from 'lucide-react';
import { getAgentBySlug, agents } from '@/data/agents';
import NotFound from './NotFound';

const Agent = () => {
  const { slug } = useParams<{ slug: string }>();
  
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(agent.content)}
                >
                  Copy Agent Configuration
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
                  onClick={() => window.open(`https://github.com/JSONbored/claudepro-directory/blob/main/src/data/agents/${agent.slug}.ts`, '_blank')}
                >
                  Repository
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/submit">
                    Submit Improvement
                  </Link>
                </Button>
              </CardContent>
            </Card>
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