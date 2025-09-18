'use client';

import { CheckCircle, ExternalLink, FileJson, Github, Loader2, Send } from 'lucide-react';
import { useId, useState } from 'react';
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

interface FormData {
  type: string;
  name: string;
  description: string;
  category: string;
  author: string;
  github: string;
  content: string;
  tags: string;
}

export default function SubmitPage() {
  // Generate unique IDs for form elements
  const typeId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const authorId = useId();
  const githubId = useId();
  const contentId = useId();
  const tagsId = useId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIssueUrl, setSubmittedIssueUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    type: '',
    name: '',
    description: '',
    category: '',
    author: '',
    github: '',
    content: '',
    tags: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.type) newErrors.type = 'Please select a configuration type';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.author) newErrors.author = 'Author name is required';
    if (!formData.content) newErrors.content = 'Configuration content is required';

    // Validate JSON if content is provided
    if (formData.content) {
      try {
        JSON.parse(formData.content);
      } catch {
        newErrors.content = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Configuration Submitted!',
          description: 'Your configuration has been submitted for review.',
        });

        if (result.issueUrl) {
          setSubmittedIssueUrl(result.issueUrl);
        }

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
        setErrors({});
      } else if (result.fallback) {
        // Rate limited - show GitHub fallback
        toast({
          title: 'Please use GitHub',
          description: result.error,
          action: (
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/JSONbored/claudepro-directory/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open GitHub
              </a>
            </Button>
          ),
        });
      } else {
        toast({
          title: 'Submission Failed',
          description: result.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Network Error',
        description: 'Failed to submit. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Submit Your Configuration</h1>
        <p className="text-lg text-muted-foreground">
          Share your Claude configurations with the community
        </p>
      </div>

      {/* Success Message */}
      {submittedIssueUrl && (
        <Card className="max-w-2xl mx-auto mb-8 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Successfully submitted!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your configuration has been submitted for review.
                </p>
                <Button variant="link" size="sm" asChild className="mt-2 p-0 h-auto">
                  <a href={submittedIssueUrl} target="_blank" rel="noopener noreferrer">
                    View submission on GitHub
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form and Instructions */}
      <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
        {/* Submission Form - Takes up 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
            <CardDescription>
              Fill out the form below to submit your configuration for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type and Category Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={typeId}>
                    Configuration Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={typeId} className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">AI Agent</SelectItem>
                      <SelectItem value="mcp">MCP Server</SelectItem>
                      <SelectItem value="rule">Rule</SelectItem>
                      <SelectItem value="command">Command</SelectItem>
                      <SelectItem value="hook">Hook</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={categoryId}>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id={categoryId}
                      className={errors.category ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor={nameId}>
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={nameId}
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Code Review Assistant"
                  disabled={isSubmitting}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor={descriptionId}>
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={descriptionId}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what your configuration does and how it helps users..."
                  rows={3}
                  disabled={isSubmitting}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              {/* Author and GitHub Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={authorId}>
                    Your Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={authorId}
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                    className={errors.author ? 'border-red-500' : ''}
                  />
                  {errors.author && <p className="text-sm text-red-500">{errors.author}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={githubId}>GitHub Username</Label>
                  <Input
                    id={githubId}
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    placeholder="johndoe"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>
              </div>

              {/* Configuration Content */}
              <div className="space-y-2">
                <Label htmlFor={contentId}>
                  Configuration Content (JSON) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={contentId}
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder={'{\n  "name": "Your Config",\n  "description": "...",\n  ...\n}'}
                  rows={8}
                  className={`font-mono text-sm ${errors.content ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor={tagsId}>Tags</Label>
                <Input
                  id={tagsId}
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="productivity, automation, coding (comma-separated)"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Optional - Help others find your configuration
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Configuration
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column - Instructions */}
        <div className="space-y-6">
          {/* GitHub Alternative */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Github className="h-5 w-5" />
                Prefer GitHub?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You can also submit directly via GitHub:
              </p>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">1.</span>
                  <span>Fork the repository</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">2.</span>
                  <span>
                    Add your JSON file to{' '}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">content/[type]</code>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold">3.</span>
                  <span>Submit a pull request</span>
                </li>
              </ol>
              <Button variant="outline" size="sm" asChild className="w-full">
                <a
                  href="https://github.com/JSONbored/claudepro-directory"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4 mr-2" />
                  View Repository
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* JSON Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileJson className="h-5 w-5" />
                JSON Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Example format:</p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                {`{
  "name": "Config Name",
  "description": "What it does",
  "category": "development",
  "author": "Your Name",
  "tags": ["tag1", "tag2"],
  "content": "..."
}`}
              </pre>
            </CardContent>
          </Card>

          {/* Review Process */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Review Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-muted-foreground">Reviewed within 24-48 hours</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-muted-foreground">Quality and originality check</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-muted-foreground">Added to directory if approved</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-muted-foreground">Full credit to authors</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
