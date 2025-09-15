import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Lightbulb, 
  BookOpen, 
  Server, 
  Send,
  Github,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Bot,
  Terminal,
  Webhook,
  Star,
  Briefcase,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Submit = () => {
  const [configType, setConfigType] = useState<'rule' | 'mcp' | 'agent' | 'command' | 'hook' | ''>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    content: '',
    repository: '',
    documentation: '',
    syntax: '',
    useCases: '',
    capabilities: '',
    triggerEvents: '',
    actions: '',
    configuration: '',
    platforms: '',
    requirements: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configuration submitted!",
      description: "Thank you for your contribution. We'll review it and add it to the directory soon.",
    });
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: '',
      tags: '',
      content: '',
      repository: '',
      documentation: '',
      syntax: '',
      useCases: '',
      capabilities: '',
      triggerEvents: '',
      actions: '',
      configuration: '',
      platforms: '',
      requirements: ''
    });
    setConfigType('');
  };

  const ruleCategories = ['development', 'writing', 'creative', 'business', 'analysis', 'other'];
  const mcpCategories = ['database', 'api', 'file-system', 'ai', 'productivity', 'development', 'automation', 'other'];
  const agentCategories = ['development', 'productivity', 'creative', 'research', 'analysis', 'customer-service', 'other'];
  const commandCategories = ['development', 'productivity', 'analysis', 'automation', 'content', 'other'];
  const hookCategories = ['automation', 'monitoring', 'development', 'deployment', 'analytics', 'other'];
  
  const getCategories = () => {
    switch(configType) {
      case 'rule': return ruleCategories;
      case 'mcp': return mcpCategories;
      case 'agent': return agentCategories;
      case 'command': return commandCategories;
      case 'hook': return hookCategories;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Submit Configuration
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              Share your Claude configurations with the community. Help others discover new ways to enhance their AI workflows.
            </p>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Free and open source
            </Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Featured Job Posting Section */}
          <div className="mb-12">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        Featured Job Opportunity
                      </CardTitle>
                      <CardDescription className="text-base">
                        Want to hire Claude experts or promote your services?
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Reach Claude Experts</div>
                      <div className="text-sm text-muted-foreground">Connect with skilled professionals</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Promote Services</div>
                      <div className="text-sm text-muted-foreground">Advertise your consulting</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Post Job/Ad
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Type Selection */}
          {!configType && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center mb-8">What would you like to submit?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card 
                  className="hover-lift transition-smooth cursor-pointer card-gradient border-border/50 hover:border-primary/20"
                  onClick={() => setConfigType('rule')}
                >
                  <CardHeader className="text-center">
                    <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">Claude Rule</CardTitle>
                    <CardDescription>
                      System prompts, instructions, and configurations that enhance Claude's behavior for specific tasks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full hover:bg-primary/5 hover:border-primary/30">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Submit Rule
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="hover-lift transition-smooth cursor-pointer card-gradient border-border/50 hover:border-primary/20"
                  onClick={() => setConfigType('mcp')}
                >
                  <CardHeader className="text-center">
                    <Server className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">MCP Server</CardTitle>
                    <CardDescription>
                      Model Context Protocol servers that extend Claude with external tools and integrations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full hover:bg-primary/5 hover:border-primary/30">
                      <Server className="h-4 w-4 mr-2" />
                      Submit MCP Server
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="hover-lift transition-smooth cursor-pointer card-gradient border-border/50 hover:border-primary/20"
                  onClick={() => setConfigType('agent')}
                >
                  <CardHeader className="text-center">
                    <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">AI Agent</CardTitle>
                    <CardDescription>
                      Specialized AI agents with defined roles, capabilities, and workflows for specific domains.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full hover:bg-primary/5 hover:border-primary/30">
                      <Bot className="h-4 w-4 mr-2" />
                      Submit Agent
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="hover-lift transition-smooth cursor-pointer card-gradient border-border/50 hover:border-primary/20"
                  onClick={() => setConfigType('command')}
                >
                  <CardHeader className="text-center">
                    <Terminal className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">Command</CardTitle>
                    <CardDescription>
                      Command-line style prompts and tools for specific tasks and operations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full hover:bg-primary/5 hover:border-primary/30">
                      <Terminal className="h-4 w-4 mr-2" />
                      Submit Command
                    </Button>
                  </CardContent>
                </Card>

                <Card 
                  className="hover-lift transition-smooth cursor-pointer card-gradient border-border/50 hover:border-primary/20"
                  onClick={() => setConfigType('hook')}
                >
                  <CardHeader className="text-center">
                    <Webhook className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">Hook</CardTitle>
                    <CardDescription>
                      Automated workflows and triggers that respond to events and execute actions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full hover:bg-primary/5 hover:border-primary/30">
                      <Webhook className="h-4 w-4 mr-2" />
                      Submit Hook
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Submission Form */}
          {configType && (
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {configType === 'rule' && <BookOpen className="h-6 w-6 text-primary" />}
                    {configType === 'mcp' && <Server className="h-6 w-6 text-primary" />}
                    {configType === 'agent' && <Bot className="h-6 w-6 text-primary" />}
                    {configType === 'command' && <Terminal className="h-6 w-6 text-primary" />}
                    {configType === 'hook' && <Webhook className="h-6 w-6 text-primary" />}
                    <CardTitle className="text-2xl">
                      Submit {
                        configType === 'rule' ? 'Claude Rule' :
                        configType === 'mcp' ? 'MCP Server' :
                        configType === 'agent' ? 'AI Agent' :
                        configType === 'command' ? 'Command' :
                        configType === 'hook' ? 'Hook' : ''
                      }
                    </CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setConfigType('')}
                    className="hover:bg-primary/10"
                  >
                    Change Type
                  </Button>
                </div>
                <CardDescription>
                  Fill out the form below to submit your {
                    configType === 'rule' ? 'Claude rule' :
                    configType === 'mcp' ? 'MCP server' :
                    configType === 'agent' ? 'AI agent' :
                    configType === 'command' ? 'command' :
                    configType === 'hook' ? 'hook' : 'configuration'
                  } to the directory.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        {configType === 'rule' ? 'Rule Title' :
                         configType === 'mcp' ? 'Server Name' :
                         configType === 'agent' ? 'Agent Name' :
                         configType === 'command' ? 'Command Name' :
                         configType === 'hook' ? 'Hook Title' : 'Title'} *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder={
                          configType === 'rule' ? 'e.g., TypeScript Expert' :
                          configType === 'mcp' ? 'e.g., PostgreSQL MCP Server' :
                          configType === 'agent' ? 'e.g., Code Review Assistant' :
                          configType === 'command' ? 'e.g., /analyze-code' :
                          configType === 'hook' ? 'e.g., Git Commit Analyzer' : 'Enter title'
                        }
                        required
                        className="bg-card/50 border-border/50 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger className="bg-card/50 border-border/50 focus:border-primary/50">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCategories().map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.replace('-', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder={
                        configType === 'rule' ? 'Describe what this rule does and how it helps...' :
                        configType === 'mcp' ? 'Describe what this MCP server provides and its capabilities...' :
                        configType === 'agent' ? 'Describe the agent\'s role and capabilities...' :
                        configType === 'command' ? 'Describe what this command does and its use cases...' :
                        configType === 'hook' ? 'Describe what events trigger this hook and what it does...' :
                        'Provide a detailed description...'
                      }
                      rows={3}
                      required
                      className="bg-card/50 border-border/50 focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="typescript, development, best-practices (comma separated)"
                      className="bg-card/50 border-border/50 focus:border-primary/50"
                    />
                  </div>

                  {/* Content/Configuration */}
                  <div className="space-y-2">
                    <Label htmlFor="content">
                      {configType === 'rule' ? 'Rule Content' :
                       configType === 'mcp' ? 'Configuration' :
                       configType === 'agent' ? 'Agent Instructions' :
                       configType === 'command' ? 'Command Implementation' :
                       configType === 'hook' ? 'Hook Configuration' : 'Content'} *
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder={
                        configType === 'rule' ? 'Enter the complete system prompt or configuration...' :
                        configType === 'mcp' ? 'Enter the MCP server configuration JSON...' :
                        configType === 'agent' ? 'Provide detailed instructions and capabilities for the agent...' :
                        configType === 'command' ? 'Describe the command syntax, parameters, and implementation...' :
                        configType === 'hook' ? 'Define trigger events, actions, and configuration options...' :
                        'Enter the main content...'
                      }
                      rows={12}
                      required
                      className="font-mono text-sm bg-card/50 border-border/50 focus:border-primary/50"
                    />
                  </div>

                  {/* Type-specific fields */}
                  {(configType === 'command') && (
                    <div className="space-y-2">
                      <Label htmlFor="syntax">Command Syntax</Label>
                      <Input
                        id="syntax"
                        value={formData.syntax}
                        onChange={(e) => setFormData({...formData, syntax: e.target.value})}
                        placeholder="e.g., /analyze-code [file] [--depth=quick|thorough]"
                        className="font-mono text-sm bg-card/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  )}

                  {(configType === 'agent') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="useCases">Use Cases</Label>
                        <Input
                          id="useCases"
                          value={formData.useCases}
                          onChange={(e) => setFormData({...formData, useCases: e.target.value})}
                          placeholder="code-review, mentorship, quality-assurance"
                          className="bg-card/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capabilities">Capabilities</Label>
                        <Input
                          id="capabilities"
                          value={formData.capabilities}
                          onChange={(e) => setFormData({...formData, capabilities: e.target.value})}
                          placeholder="analysis, feedback, recommendations"
                          className="bg-card/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                    </div>
                  )}

                  {(configType === 'hook') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="triggerEvents">Trigger Events</Label>
                        <Input
                          id="triggerEvents"
                          value={formData.triggerEvents}
                          onChange={(e) => setFormData({...formData, triggerEvents: e.target.value})}
                          placeholder="git-push, deploy-complete, error-occurred"
                          className="bg-card/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actions">Actions</Label>
                        <Input
                          id="actions"
                          value={formData.actions}
                          onChange={(e) => setFormData({...formData, actions: e.target.value})}
                          placeholder="send-notification, generate-report, update-status"
                          className="bg-card/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                    </div>
                  )}

                  {(configType === 'hook' || configType === 'mcp') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="platforms">Platforms</Label>
                        <Input
                          id="platforms"
                          value={formData.platforms}
                          onChange={(e) => setFormData({...formData, platforms: e.target.value})}
                          placeholder="Linux, Docker, AWS, Web"
                          className="bg-card/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requirements">Requirements</Label>
                        <Input
                          id="requirements"
                          value={formData.requirements}
                          onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                          placeholder="Node.js, API keys, network access"
                          className="bg-card/50 border-border/50 focus:border-primary/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Optional Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="repository">Repository URL</Label>
                      <Input
                        id="repository"
                        type="url"
                        value={formData.repository}
                        onChange={(e) => setFormData({...formData, repository: e.target.value})}
                        placeholder="https://github.com/username/repo"
                        className="bg-card/50 border-border/50 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documentation">Documentation URL</Label>
                      <Input
                        id="documentation"
                        type="url"
                        value={formData.documentation}
                        onChange={(e) => setFormData({...formData, documentation: e.target.value})}
                        placeholder="https://docs.example.com"
                        className="bg-card/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  {/* Submission Guidelines */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Submission Guidelines</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Ensure your configuration is tested and working</li>
                            <li>• Provide clear, descriptive documentation</li>
                            <li>• Follow security best practices (no sensitive data)</li>
                            <li>• Configurations should be helpful to the community</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-6">
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Configuration
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => window.open('https://github.com/JSONbored/claudepro-directory', '_blank')}
                      className="hover:bg-primary/5 hover:border-primary/30"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Alternative Submission Methods */}
          <div className="mt-12">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Alternative Submission Methods</CardTitle>
                <CardDescription>
                  Prefer to contribute directly? You can also submit via these platforms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline"
                    className="justify-start h-auto p-4 hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => window.open('https://github.com/JSONbored/claudepro-directory/issues/new', '_blank')}
                  >
                    <Github className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">GitHub Issue</div>
                      <div className="text-sm text-muted-foreground">Create an issue with your configuration</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="justify-start h-auto p-4 hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => window.open('https://github.com/JSONbored/claudepro-directory/fork', '_blank')}
                  >
                    <ExternalLink className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Pull Request</div>
                      <div className="text-sm text-muted-foreground">Fork and submit a pull request</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Submit;