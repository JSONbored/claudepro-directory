'use client';

import { CheckCircle, FileJson, Github, Send } from 'lucide-react';
import { useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export default function SubmitPage() {
  const _typeId = useId();
  const _nameId = useId();
  const _descriptionId = useId();
  const _categoryId = useId();
  const _authorId = useId();
  const _githubId = useId();
  const _contentId = useId();
  const _tagsId = useId();

  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    category: '',
    author: '',
    github: '',
    content: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, this would submit to an API
    toast({
      title: 'Configuration Submitted!',
      description: "Thank you for your contribution. We'll review it soon.",
    });

    // Reset form
    setFormData({
      type: '',
      name: '',
      description: '',
      category: '',
      author: '',
      github: '',
      content: '',
      tags: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6 border-accent/20 bg-accent/5 text-accent">
              <Send className="h-3 w-3 mr-1 text-accent" />
              Submit Configuration
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">Share Your Configuration</h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Contribute to the Claude community by sharing your configurations, agents, MCP
              servers, rules, commands, or hooks. Help others build amazing things with Claude.
            </p>
          </div>
        </div>
      </section>

      {/* Submission Form */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Configuration</CardTitle>
              <CardDescription>
                Fill out the form below to submit your configuration for review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={_typeId}>Configuration Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id={_typeId}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rule">Rule</SelectItem>
                      <SelectItem value="mcp">MCP Server</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="command">Command</SelectItem>
                      <SelectItem value="hook">Hook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={_nameId}>Name</Label>
                  <Input
                    id={_nameId}
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Awesome Configuration"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={_descriptionId}>Description</Label>
                  <Textarea
                    id={_descriptionId}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what your configuration does..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={_categoryId}>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id={_categoryId}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={_authorId}>Your Name</Label>
                  <Input
                    id={_authorId}
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={_githubId}>GitHub Username (Optional)</Label>
                  <Input
                    id={_githubId}
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    placeholder="johndoe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={_contentId}>Configuration Content</Label>
                  <Textarea
                    id={_contentId}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Paste your configuration JSON or content here..."
                    rows={6}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={_tagsId}>Tags (comma-separated)</Label>
                  <Input
                    id={_tagsId}
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="productivity, automation, coding"
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Configuration
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* GitHub Instructions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Submit via GitHub
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Prefer to submit directly via GitHub? Follow these steps:
                </p>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">1.</span>
                    Fork the repository
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">2.</span>
                    Add your configuration JSON file
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">3.</span>
                    Submit a pull request
                  </li>
                </ol>
                <Button variant="outline" asChild className="w-full">
                  <a
                    href="https://github.com/JSONbored/claudepro-directory"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    View on GitHub
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  JSON Format
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Your configuration should follow this format:
                </p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {`{
  "name": "Configuration Name",
  "description": "What it does",
  "category": "development",
  "author": "Your Name",
  "tags": ["tag1", "tag2"],
  "content": "...",
  "popularity": 0
}`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Review Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Submissions are reviewed within 48 hours</p>
                <p>• We check for quality and originality</p>
                <p>• Approved configs are added to the directory</p>
                <p>• You&apos;ll be credited as the author</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
