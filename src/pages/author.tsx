import { useParams } from 'react-router-dom';
import { ConfigCard } from '@/components/config-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Github, Globe, Calendar, Star } from 'lucide-react';
import { rules, mcp } from '@/generated/content';
import NotFound from './not-found';

const Author = () => {
  const { authorSlug } = useParams();
  
  if (!authorSlug) {
    return <NotFound />;
  }

  // Find all configs by this author
  const authorRules = rules.filter(rule => rule.author === authorSlug);
  const authorMcps = mcp.filter(mcpItem => mcpItem.author === authorSlug);
  const allConfigs = [...authorRules, ...authorMcps];

  if (allConfigs.length === 0) {
    return <NotFound />;
  }

  // Get author info from first config (in real app, this would be separate)
  const authorName = authorSlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const totalPopularity = allConfigs.reduce((sum, config) => sum + config.popularity, 0);
  const avgPopularity = Math.round(totalPopularity / allConfigs.length);

  // Mock author data (in real app, this would come from database)
  const authorData = {
    name: authorName,
    bio: `Expert in Claude configurations and AI automation. Passionate about creating efficient workflows and powerful integrations.`,
    website: authorSlug === 'claude-mcp-community' ? 'https://modelcontextprotocol.io' : undefined,
    github: authorSlug === 'claude-mcp-community' ? 'https://github.com/modelcontextprotocol' : undefined,
    joinDate: '2024-01-15',
    totalConfigs: allConfigs.length,
    totalRules: authorRules.length,
    totalMcps: authorMcps.length,
    avgPopularity
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Author Header */}
      <section className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/50 border-border/50 p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{authorData.name}</h1>
                    <p className="text-lg text-muted-foreground">{authorData.bio}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined {new Date(authorData.joinDate).toLocaleDateString()}
                    </Badge>
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      <Star className="h-3 w-3 mr-1" />
                      {authorData.avgPopularity}% avg popularity
                    </Badge>
                  </div>
                  
                  <div className="flex gap-3">
                    {authorData.github && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={authorData.github} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {authorData.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={authorData.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{authorData.totalConfigs}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{authorData.totalRules}</div>
                    <div className="text-sm text-muted-foreground">Rules</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{authorData.totalMcps}</div>
                    <div className="text-sm text-muted-foreground">MCPs</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Author Configurations */}
      <section className="container mx-auto px-4 py-12 space-y-12">
        {authorRules.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Claude Rules ({authorRules.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authorRules.map((rule) => (
                <ConfigCard
                  key={rule.id}
                  {...rule}
                  type="rule"
                />
              ))}
            </div>
          </div>
        )}

        {authorMcps.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">MCP Servers ({authorMcps.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authorMcps.map((mcpItem) => (
                <ConfigCard
                  key={mcpItem.id}
                  {...mcpItem}
                  type="mcp"
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Author;