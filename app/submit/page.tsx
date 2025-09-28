'use client';

import { CheckCircle, ExternalLink, FileJson, Github, Loader2, Send } from 'lucide-react';
import { useActionState, useId, useState } from 'react';
import { z } from 'zod';
import { submitConfiguration } from '@/app/actions/submit-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { SOCIAL_LINKS } from '@/lib/constants';
import { type ConfigSubmissionInput, configSubmissionSchema } from '@/lib/schemas/form.schema';

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

  // React 19 useActionState for Server Actions
  const [state, formAction, isPending] = useActionState(submitConfiguration, null);

  // Local form state for validation and UX with proper typing
  const [formData, setFormData] = useState<ConfigSubmissionInput>({
    type: 'agents', // Default to first valid enum value
    name: '',
    description: '',
    category: '',
    author: '',
    github: '',
    content: '',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Show toast notifications based on server action state
  if (state?.success && !isPending) {
    toast({
      title: 'Configuration Submitted!',
      description: 'Your configuration has been submitted for review.',
    });
  } else if (state?.error && !isPending) {
    if (state.fallback) {
      toast({
        title: 'Please use GitHub',
        description: state.error,
        action: (
          <Button variant="outline" size="sm" asChild>
            <a href={`${SOCIAL_LINKS.github}/issues/new`} target="_blank" rel="noopener noreferrer">
              Open GitHub
            </a>
          </Button>
        ),
      });
    } else {
      toast({
        title: 'Submission Failed',
        description: state.error,
      });
    }
  }

  // Client-side validation with Zod
  const validateField = (fieldName: string, value: string | undefined) => {
    try {
      // Validate individual field using Zod schema
      const fieldSchema =
        configSubmissionSchema.shape[fieldName as keyof typeof configSubmissionSchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues[0]?.message || 'Invalid value';
        setErrors((prev) => ({ ...prev, [fieldName]: errorMessage }));
      }
    }
  };

  const validateAllFields = () => {
    try {
      configSubmissionSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          fieldErrors[path] = issue.message;
        }
        setErrors(fieldErrors);
        return false;
      }
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field on change for immediate feedback
    validateField(name, value);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field on change for immediate feedback
    validateField(name, value);
  };

  // Enhanced form submission with client-side validation
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsValidating(true);

    // Run client-side validation before submitting
    const isValid = validateAllFields();

    if (!isValid) {
      setIsValidating(false);
      toast({
        title: 'Validation Failed',
        description: 'Please fix the errors below before submitting.',
      });
      return;
    }

    setIsValidating(false);

    // If validation passes, submit via Server Action
    const formData = new FormData(event.currentTarget);
    formAction(formData);
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
      {state?.success && state.issueUrl && (
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
                  <a href={state.issueUrl} target="_blank" rel="noopener noreferrer">
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
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Type and Category Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={typeId}>
                    Configuration Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    name="type"
                    id={typeId}
                    value={formData.type}
                    onChange={(e) => handleSelectChange('type', e.target.value)}
                    disabled={isPending}
                    autoComplete="off"
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.type ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select type</option>
                    <option value="agents">AI Agent</option>
                    <option value="mcp">MCP Server</option>
                    <option value="rules">Rule</option>
                    <option value="commands">Command</option>
                    <option value="hooks">Hook</option>
                  </select>
                  {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={categoryId}>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <select
                    name="category"
                    id={categoryId}
                    value={formData.category}
                    onChange={(e) => handleSelectChange('category', e.target.value)}
                    disabled={isPending}
                    autoComplete="off"
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.category ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select category</option>
                    <option value="development">Development</option>
                    <option value="writing">Writing</option>
                    <option value="analysis">Analysis</option>
                    <option value="creative">Creative</option>
                    <option value="business">Business</option>
                    <option value="productivity">Productivity</option>
                    <option value="other">Other</option>
                  </select>
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
                  disabled={isPending}
                  autoComplete="off"
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
                  disabled={isPending}
                  autoComplete="off"
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
                    disabled={isPending}
                    autoComplete="name"
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
                    disabled={isPending}
                    autoComplete="username"
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
                  disabled={isPending}
                  autoComplete="off"
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
                  disabled={isPending}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Optional - Help others find your configuration
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || isValidating}
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
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
                <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer">
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
