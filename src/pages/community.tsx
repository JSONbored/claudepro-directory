import {
  BookOpen,
  ExternalLink,
  Github,
  Heart,
  MessageCircle,
  Star,
  Twitter,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Community = () => {
  const stats = [
    { label: 'Active Members', value: '25,000+', icon: Users },
    { label: 'Configurations Shared', value: '1,200+', icon: BookOpen },
    { label: 'GitHub Stars', value: '8,500+', icon: Star },
    { label: 'Community Contributions', value: '450+', icon: Heart },
  ];

  const resources = [
    {
      title: 'Claude Documentation',
      description: 'Official Anthropic documentation for Claude AI',
      url: 'https://docs.anthropic.com',
      icon: BookOpen,
      badge: 'Official',
    },
    {
      title: 'MCP Protocol Docs',
      description: 'Learn about the Model Context Protocol',
      url: 'https://modelcontextprotocol.io',
      icon: ExternalLink,
      badge: 'Documentation',
    },
    {
      title: 'GitHub Repository',
      description: 'Contribute to Claude Pro Directory',
      url: 'https://github.com/JSONbored/claudepro-directory',
      icon: Github,
      badge: 'Open Source',
    },
  ];

  const communityChannels = [
    {
      title: 'Discord Server',
      description: 'Join our Discord community for real-time discussions',
      url: 'https://discord.gg/claude',
      icon: MessageCircle,
      members: '15,000+ members',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      title: 'GitHub Discussions',
      description: 'Technical discussions and feature requests',
      url: 'https://github.com/JSONbored/claudepro-directory/discussions',
      icon: Github,
      members: '3,000+ discussions',
      color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    },
    {
      title: 'Twitter Community',
      description: 'Follow for updates and community highlights',
      url: 'https://twitter.com/anthropicai',
      icon: Twitter,
      members: '50,000+ followers',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Community
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Join the Claude Pro community and connect with developers, researchers, and AI
              enthusiasts sharing knowledge and configurations.
            </p>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <Heart className="h-3 w-3 mr-1" />
              Built by the community, for the community
            </Badge>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center card-gradient border-border/50">
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Community Channels */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Join the Conversation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {communityChannels.map((channel, index) => (
              <Card
                key={index}
                className="hover-lift transition-smooth card-gradient border-border/50 hover:border-primary/20"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <channel.icon className="h-8 w-8 text-primary" />
                    <Badge variant="outline" className={`border ${channel.color}`}>
                      {channel.members}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{channel.title}</CardTitle>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => window.open(channel.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Helpful Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <Card
                key={index}
                className="hover-lift transition-smooth card-gradient border-border/50 hover:border-primary/20"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <resource.icon className="h-8 w-8 text-primary" />
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/5 text-primary"
                    >
                      {resource.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => window.open(resource.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Explore
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="inline-block card-gradient border-border/50 p-8">
            <div className="max-w-md">
              <h3 className="text-2xl font-bold mb-4">Ready to Contribute?</h3>
              <p className="text-muted-foreground mb-6">
                Share your Claude configurations and help the community grow. Every contribution
                makes a difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => (window.location.href = '/submit')}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Submit Configuration
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-primary/5 hover:border-primary/30"
                  onClick={() =>
                    window.open('https://github.com/JSONbored/claudepro-directory', '_blank')
                  }
                >
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Community;
