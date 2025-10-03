'use client';

import { useActionState, useId, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { submitConfiguration } from '@/src/app/actions/submit-config';
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
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { CheckCircle, ExternalLink, FileJson, Github, Loader2, Send } from '@/src/lib/icons';
import { type ConfigSubmissionInput, configSubmissionSchema } from '@/src/lib/schemas/form.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    toast.success('Configuration Submitted!', {
      description: 'Your configuration has been submitted for review.',
    });
  } else if (state?.error && !isPending) {
    if (state.fallback) {
      toast.error('Please use GitHub', {
        description: state.error,
        action: {
          label: 'Open GitHub',
          onClick: () => window.open(`${SOCIAL_LINKS.github}/issues/new`, '_blank'),
        },
      });
    } else {
      toast.error('Submission Failed', {
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
      toast.error('Validation Failed', {
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

      {/* Success Message */}
      {state?.success && state.issueUrl && (
        <Card
          className={`${UI_CLASSES.MAX_W_2XL} ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.MB_8} border-green-500/20 bg-green-500/5`}
        >
          <CardContent className={UI_CLASSES.PT_6}>
            <div className={`flex ${UI_CLASSES.ITEMS_START} gap-3`}>
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className={UI_CLASSES.FONT_MEDIUM}>Successfully submitted!</p>
                <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                  Your configuration has been submitted for review.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className={`${UI_CLASSES.MT_2} p-0 h-auto`}
                >
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
      <div
        className={`${UI_CLASSES.GRID_RESPONSIVE_3_GAP_8} ${UI_CLASSES.MAX_W_6XL} ${UI_CLASSES.MX_AUTO}`}
      >
        {/* Submission Form - Takes up 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
            <CardDescription>
              Fill out the form below to submit your configuration for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className={UI_CLASSES.SPACE_Y_6}>
              {/* Type and Category Row */}
              <div className={UI_CLASSES.GRID_RESPONSIVE_2}>
                <div className={UI_CLASSES.SPACE_Y_2}>
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
                    className={`flex h-10 w-full rounded-md border border-input bg-background ${UI_CLASSES.PX_3} ${UI_CLASSES.PY_2} ${UI_CLASSES.TEXT_SM} ring-offset-background file:border-0 file:bg-transparent file:${UI_CLASSES.TEXT_SM} file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.type ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select type</option>
                    <option value="agents">AI Agent</option>
                    <option value="mcp">MCP Server</option>
                    <option value="rules">Rule</option>
                    <option value="commands">Command</option>
                    <option value="hooks">Hook</option>
                    <option value="statuslines">Statusline</option>
                  </select>
                  {errors.type && (
                    <p className={`${UI_CLASSES.TEXT_SM} text-red-500`}>{errors.type}</p>
                  )}
                </div>

                <div className={UI_CLASSES.SPACE_Y_2}>
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
                    className={`flex h-10 w-full rounded-md border border-input bg-background ${UI_CLASSES.PX_3} ${UI_CLASSES.PY_2} ${UI_CLASSES.TEXT_SM} ring-offset-background file:border-0 file:bg-transparent file:${UI_CLASSES.TEXT_SM} file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.category ? 'border-red-500' : ''}`}
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
                  {errors.category && (
                    <p className={`${UI_CLASSES.TEXT_SM} text-red-500`}>{errors.category}</p>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className={UI_CLASSES.SPACE_Y_2}>
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
                {errors.name && (
                  <p className={`${UI_CLASSES.TEXT_SM} text-red-500`}>{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className={UI_CLASSES.SPACE_Y_2}>
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
                {errors.description && (
                  <p className={`${UI_CLASSES.TEXT_SM} text-red-500`}>{errors.description}</p>
                )}
              </div>

              {/* Author and GitHub Row */}
              <div className={UI_CLASSES.GRID_RESPONSIVE_2}>
                <div className={UI_CLASSES.SPACE_Y_2}>
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
                  {errors.author && (
                    <p className={`${UI_CLASSES.TEXT_SM} text-red-500`}>{errors.author}</p>
                  )}
                </div>

                <div className={UI_CLASSES.SPACE_Y_2}>
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
                  <p className={UI_CLASSES.TEXT_XS_MUTED}>Optional</p>
                </div>
              </div>

              {/* Configuration Content */}
              <div className={UI_CLASSES.SPACE_Y_2}>
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
                  className={`font-mono ${UI_CLASSES.TEXT_SM} ${errors.content ? 'border-red-500' : ''}`}
                  disabled={isPending}
                  autoComplete="off"
                />
                {errors.content && (
                  <p className={`${UI_CLASSES.TEXT_SM} text-red-500`}>{errors.content}</p>
                )}
              </div>

              {/* Tags */}
              <div className={UI_CLASSES.SPACE_Y_2}>
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
                <p className={UI_CLASSES.TEXT_XS_MUTED}>
                  Optional - Help others find your configuration
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className={UI_CLASSES.W_FULL}
                disabled={isPending || isValidating}
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className={`h-4 w-4 ${UI_CLASSES.MR_2} animate-spin`} />
                    Submitting...
                  </>
                ) : isValidating ? (
                  <>
                    <Loader2 className={`h-4 w-4 ${UI_CLASSES.MR_2} animate-spin`} />
                    Validating...
                  </>
                ) : (
                  <>
                    <Send className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />
                    Submit Configuration
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column - Instructions */}
        <div className={UI_CLASSES.SPACE_Y_6}>
          {/* GitHub Alternative */}
          <Card>
            <CardHeader>
              <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_LG}`}>
                <Github className="h-5 w-5" />
                Prefer GitHub?
              </CardTitle>
            </CardHeader>
            <CardContent className={UI_CLASSES.SPACE_Y_3}>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                You can also submit directly via GitHub:
              </p>
              <ol className={`${UI_CLASSES.SPACE_Y_2} ${UI_CLASSES.TEXT_SM}`}>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className={`text-primary ${UI_CLASSES.FONT_SEMIBOLD}`}>1.</span>
                  <span>Fork the repository</span>
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className={`text-primary ${UI_CLASSES.FONT_SEMIBOLD}`}>2.</span>
                  <span>
                    Add your JSON file to{' '}
                    <code className="text-xs bg-muted px-1 ${UI_CLASSES.PY_1} rounded">
                      content/[type]
                    </code>
                  </span>
                </li>
                <li className={UI_CLASSES.FLEX_GAP_2}>
                  <span className={`text-primary ${UI_CLASSES.FONT_SEMIBOLD}`}>3.</span>
                  <span>Submit a pull request</span>
                </li>
              </ol>
              <Button variant="outline" size="sm" asChild className={UI_CLASSES.W_FULL}>
                <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer">
                  <Github className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />
                  View Repository
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* JSON Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_LG}`}>
                <FileJson className="h-5 w-5" />
                JSON Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MB_3}`}
              >
                Example format:
              </p>
              <pre className={`bg-muted p-3 rounded-lg text-xs ${UI_CLASSES.OVERFLOW_X_AUTO}`}>
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
              <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_LG}`}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Review Process
              </CardTitle>
            </CardHeader>
            <CardContent className={`${UI_CLASSES.SPACE_Y_2} ${UI_CLASSES.TEXT_SM}`}>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <span className="text-green-500">✓</span>
                <span className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Reviewed within 24-48 hours
                </span>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <span className="text-green-500">✓</span>
                <span className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Quality and originality check
                </span>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <span className="text-green-500">✓</span>
                <span className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Added to directory if approved
                </span>
              </div>
              <div className={UI_CLASSES.FLEX_GAP_2}>
                <span className="text-green-500">✓</span>
                <span className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Full credit to authors</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
