'use client';

import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { CheckCircle, ExternalLink, FileJson, Github, Send, AlertCircle } from '@/src/lib/icons';
import { type ConfigSubmissionInput, configSubmissionSchema } from '@/src/lib/schemas/form.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { submitConfiguration } from '@/src/lib/actions/submission-actions';
import Link from 'next/link';

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

  // Local form state with proper typing
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
  const [isPending, startTransition] = useTransition();
  const [submissionResult, setSubmissionResult] = useState<{
    prUrl: string;
    prNumber: number;
    slug: string;
    warnings?: string[];
  } | null>(null);

  // Client-side validation with Zod
  const validateField = (fieldName: string, value: string | undefined) => {
    try {
      // Validate individual field using Zod schema
      const fieldSchema =
        configSubmissionSchema.shape[fieldName as keyof typeof configSubmissionSchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error.issues[0]?.message || 'Invalid value',
        }));
      }
    }
  };

  // Handle input changes with validation
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Handle form submission - create automated PR
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        // Validate entire form
        const validatedData = configSubmissionSchema.parse(formData);
        setErrors({});

        // Submit via server action
        const result = await submitConfiguration(validatedData);

        if (result?.data?.success) {
          setSubmissionResult({
            prUrl: result.data.prUrl,
            prNumber: result.data.prNumber,
            slug: result.data.slug,
            warnings: [],
          });

          toast.success('Submission Created!', {
            description: `Your ${validatedData.type} has been submitted for review.`,
          });

          // Scroll to success message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of error.issues) {
            const fieldName = issue.path.join('.');
            fieldErrors[fieldName] = issue.message;
          }
          setErrors(fieldErrors);
          toast.error('Validation Error', {
            description: 'Please check the form for errors.',
          });
        } else if (error instanceof Error) {
          toast.error('Submission Error', {
            description: error.message,
          });
        }
      }
    });
  };

  return (
    <div className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
      {/* Header */}
      <div
        className={`${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.TEXT_CENTER} ${UI_CLASSES.MB_12}`}
      >
        <h1 className="text-4xl font-bold mb-4">Submit Your Configuration</h1>
        <p className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
          Share your Claude configurations with the community
        </p>
      </div>

      {/* Success Message with PR Link */}
      {submissionResult && (
        <Card
          className={`${UI_CLASSES.MAX_W_2XL} ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.MB_8} border-green-500/20 bg-green-500/5`}
        >
          <CardContent className={UI_CLASSES.PT_6}>
            <div className={`flex ${UI_CLASSES.ITEMS_START} gap-3`}>
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className={UI_CLASSES.FONT_MEDIUM}>Submission Successful! 🎉</p>
                <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                  Your configuration has been submitted for review. We&apos;ve created Pull Request #{submissionResult.prNumber} on GitHub.
                </p>
                
                {submissionResult.warnings && submissionResult.warnings.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className={`${UI_CLASSES.TEXT_XS} text-yellow-500 font-medium`}>Suggestions:</p>
                        <ul className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1 space-y-1`}>
                          {submissionResult.warnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                  >
                    <a href={submissionResult.prUrl} target="_blank" rel="noopener noreferrer">
                      View Pull Request
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href="/account/submissions">
                      View My Submissions
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form Card */}
      <Card className={`${UI_CLASSES.MAX_W_2XL} ${UI_CLASSES.MX_AUTO}`}>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
          <CardDescription>
            Fill out the form below to generate a pre-filled GitHub issue for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor={typeId}>Type *</Label>
              <select
                id={typeId}
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.type ? 'border-destructive' : ''
                }`}
              >
                <option value="agents">Agent</option>
                <option value="mcp">MCP Server</option>
                <option value="rules">Rule</option>
                <option value="commands">Command</option>
                <option value="hooks">Hook</option>
                <option value="statuslines">Statusline</option>
              </select>
              {errors.type && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.type}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor={nameId}>Name *</Label>
              <Input
                id={nameId}
                name="name"
                placeholder="e.g., Code Review Assistant"
                value={formData.name}
                onChange={handleChange}
                required
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor={descriptionId}>Description *</Label>
              <Textarea
                id={descriptionId}
                name="description"
                placeholder="Brief description of what your configuration does..."
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor={categoryId}>Category *</Label>
              <Input
                id={categoryId}
                name="category"
                placeholder="e.g., Development, Productivity, Writing"
                value={formData.category}
                onChange={handleChange}
                required
                className={errors.category ? 'border-destructive' : ''}
              />
              {errors.category && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.category}</p>
              )}
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor={authorId}>Author *</Label>
              <Input
                id={authorId}
                name="author"
                placeholder="Your name or GitHub username"
                value={formData.author}
                onChange={handleChange}
                required
                className={errors.author ? 'border-destructive' : ''}
              />
              {errors.author && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.author}</p>
              )}
            </div>

            {/* GitHub URL */}
            <div className="space-y-2">
              <Label htmlFor={githubId}>GitHub URL (optional)</Label>
              <div className="flex gap-2">
                <Github className="h-5 w-5 mt-2.5 text-muted-foreground" />
                <Input
                  id={githubId}
                  name="github"
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={formData.github}
                  onChange={handleChange}
                  className={errors.github ? 'border-destructive' : ''}
                />
              </div>
              {errors.github && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.github}</p>
              )}
            </div>

            {/* Configuration Content */}
            <div className="space-y-2">
              <Label htmlFor={contentId}>Configuration (JSON) *</Label>
              <div className="flex gap-2 items-start">
                <FileJson className="h-5 w-5 mt-2.5 text-muted-foreground" />
                <Textarea
                  id={contentId}
                  name="content"
                  placeholder='{"name": "example", "version": "1.0.0"}'
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={8}
                  className={`font-mono text-sm ${errors.content ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.content && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.content}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor={tagsId}>Tags (optional)</Label>
              <Input
                id={tagsId}
                name="tags"
                placeholder="productivity, ai, automation (comma-separated)"
                value={formData.tags}
                onChange={handleChange}
                className={errors.tags ? 'border-destructive' : ''}
              />
              {errors.tags && (
                <p className={`${UI_CLASSES.TEXT_SM} text-destructive`}>{errors.tags}</p>
              )}
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                Separate multiple tags with commas (max 10)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? (
                  <>
                    <Github className="mr-2 h-4 w-4 animate-pulse" />
                    Creating Pull Request...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>

            {/* Info Message */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Github className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} text-blue-400`}>
                    How submissions work
                  </p>
                  <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                    When you submit, we&apos;ll automatically create a GitHub Pull Request with your
                    configuration. Our team will review it, and you&apos;ll be notified when it&apos;s approved.
                    You must be signed in to submit.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
