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
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Submit = () => {
  const [configType, setConfigType] = useState<'rule' | 'mcp' | ''>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    content: '',
    repository: '',
    documentation: ''
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
      documentation: ''
    });
    setConfigType('');
  };

  const ruleCategories = ['development', 'writing', 'creative', 'business', 'analysis', 'other'];
  const mcpCategories = ['database', 'api', 'file-system', 'ai', 'productivity', 'development', 'automation', 'other'];

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
          {/* Configuration Type Selection */}
          {!configType && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center mb-8">What would you like to submit?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card 
                  className="hover-lift transition-smooth cursor-pointer card-gradient border-border/50 hover:border-primary/20"
                  onClick={() => setConfigType('rule')}
                >
                  <CardHeader className="text-center">
                    <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">Claude Rule</CardTitle>
                    <CardDescription>
                      System prompts, instructions, and configurations that enhance Claude's behavior for specific tasks or domains.
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
                      Model Context Protocol servers that extend Claude with external tools, databases, and integrations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full hover:bg-primary/5 hover:border-primary/30">
                      <Server className="h-4 w-4 mr-2" />
                      Submit MCP Server
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
                    {configType === 'rule' ? (
                      <BookOpen className="h-6 w-6 text-primary" />
                    ) : (
                      <Server className="h-6 w-6 text-primary" />
                    )}
                    <CardTitle className="text-2xl">
                      Submit {configType === 'rule' ? 'Claude Rule' : 'MCP Server'}
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
                  Fill out the form below to submit your {configType === 'rule' ? 'Claude rule' : 'MCP server'} to the directory.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        {configType === 'rule' ? 'Rule Title' : 'Server Name'} *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder={configType === 'rule' ? 'e.g., TypeScript Expert' : 'e.g., PostgreSQL MCP Server'}
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
                          {(configType === 'rule' ? ruleCategories : mcpCategories).map((category) => (
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
                      placeholder={configType === 'rule' 
                        ? 'Describe what this rule does and how it helps...' 
                        : 'Describe what this MCP server provides and its capabilities...'
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
                      {configType === 'rule' ? 'Rule Content' : 'Configuration'} *
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder={configType === 'rule' 
                        ? 'Enter the complete system prompt or configuration...' 
                        : 'Enter the MCP server configuration JSON...'
                      }
                      rows={12}
                      required
                      className="font-mono text-sm bg-card/50 border-border/50 focus:border-primary/50"
                    />
                  </div>

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