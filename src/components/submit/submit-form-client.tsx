'use client';

/**
 * Submit Form Client Component
 * Handles all form logic, state, and submission
 * Integrated with template selector and duplicate detection
 *
 * RESPONSIVE DESIGN:
 * - Desktop: Full-width form fields, grid layouts for numeric inputs
 * - Tablet: Responsive grids (grid-cols-2 → grid-cols-1 on small screens)
 * - Mobile: Single column, optimized spacing
 */

import Link from 'next/link';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
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
import { submitConfiguration } from '@/src/lib/actions/submission-actions';
import { CheckCircle, ExternalLink, Github, Send } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { DuplicateWarning } from './duplicate-warning';
import { TemplateSelector } from './template-selector';

type ContentType = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines';

export function SubmitFormClient() {
  const [contentType, setContentType] = useState<ContentType>('agents');
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [submissionResult, setSubmissionResult] = useState<{
    prUrl: string;
    prNumber: number;
    slug: string;
  } | null>(null);

  // Generate unique IDs for all form fields
  const typeId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const authorId = useId();
  const githubId = useId();
  const tagsId = useId();
  const systemPromptId = useId();
  const temperatureIdAgents = useId();
  const maxTokensIdAgents = useId();
  const temperatureIdCommands = useId();
  const maxTokensIdCommands = useId();
  const npmPackageId = useId();
  const installCommandId = useId();
  const configCommandId = useId();
  const serverTypeId = useId();
  const toolsDescriptionId = useId();
  const envVarsId = useId();
  const hookScriptId = useId();
  const hookTypeId = useId();
  const triggeredById = useId();
  const commandContentId = useId();
  const rulesContentId = useId();
  const statuslineScriptId = useId();
  const statuslineTypeId = useId();
  const refreshIntervalId = useId();
  const positionId = useId();

  // Handle template selection
  // biome-ignore lint/suspicious/noExplicitAny: Templates have dynamic fields based on content type
  const handleTemplateSelect = (template: any) => {
    // Pre-fill form with template data
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    // Set name
    if (template.name) {
      setName(template.name);
      const nameInput = form.querySelector('#name') as HTMLInputElement;
      if (nameInput) nameInput.value = template.name;
    }

    // Set description
    if (template.description) {
      const descInput = form.querySelector('#description') as HTMLTextAreaElement;
      if (descInput) descInput.value = template.description;
    }

    // Set category
    if (template.category) {
      const categoryInput = form.querySelector('#category') as HTMLInputElement;
      if (categoryInput) categoryInput.value = template.category;
    }

    // Set tags
    if (template.tags) {
      const tagsInput = form.querySelector('#tags') as HTMLInputElement;
      if (tagsInput) tagsInput.value = template.tags;
    }

    // Type-specific fields
    if (contentType === 'agents' && template.systemPrompt) {
      const promptInput = form.querySelector('#systemPrompt') as HTMLTextAreaElement;
      if (promptInput) promptInput.value = template.systemPrompt;

      if (template.temperature !== undefined) {
        const tempInput = form.querySelector('#temperature') as HTMLInputElement;
        if (tempInput) tempInput.value = template.temperature.toString();
      }

      if (template.maxTokens !== undefined) {
        const tokensInput = form.querySelector('#maxTokens') as HTMLInputElement;
        if (tokensInput) tokensInput.value = template.maxTokens.toString();
      }
    }

    if (contentType === 'rules' && template.rulesContent) {
      const rulesInput = form.querySelector('#rulesContent') as HTMLTextAreaElement;
      if (rulesInput) rulesInput.value = template.rulesContent;
    }

    if (contentType === 'mcp') {
      if (template.npmPackage) {
        const npmInput = form.querySelector('#npmPackage') as HTMLInputElement;
        if (npmInput) npmInput.value = template.npmPackage;
      }
      if (template.serverType) {
        const typeInput = form.querySelector('#serverType') as HTMLSelectElement;
        if (typeInput) typeInput.value = template.serverType;
      }
      if (template.installCommand) {
        const installInput = form.querySelector('#installCommand') as HTMLInputElement;
        if (installInput) installInput.value = template.installCommand;
      }
      if (template.configCommand) {
        const configInput = form.querySelector('#configCommand') as HTMLInputElement;
        if (configInput) configInput.value = template.configCommand;
      }
      if (template.toolsDescription) {
        const toolsInput = form.querySelector('#toolsDescription') as HTMLTextAreaElement;
        if (toolsInput) toolsInput.value = template.toolsDescription;
      }
      if (template.envVars) {
        const envInput = form.querySelector('#envVars') as HTMLTextAreaElement;
        if (envInput) envInput.value = template.envVars;
      }
    }

    if (contentType === 'commands' && template.commandContent) {
      const cmdInput = form.querySelector('#commandContent') as HTMLTextAreaElement;
      if (cmdInput) cmdInput.value = template.commandContent;
    }

    toast.success('Template Applied!', {
      description: 'Form has been pre-filled. Customize as needed.',
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        const formData = new FormData(event.currentTarget);

        // Build submission data based on type
        const baseData = {
          type: contentType,
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          category: formData.get('category') as string,
          author: formData.get('author') as string,
          github: (formData.get('github') as string) || undefined,
          tags: (formData.get('tags') as string) || undefined,
        };

        // biome-ignore lint/suspicious/noExplicitAny: Dynamic form data with type-specific fields added in switch statement
        const submissionData: any = { ...baseData };

        // Add type-specific fields
        switch (contentType) {
          case 'agents':
            submissionData.systemPrompt = formData.get('systemPrompt') as string;
            submissionData.temperature =
              Number.parseFloat(formData.get('temperature') as string) || 0.7;
            submissionData.maxTokens =
              Number.parseInt(formData.get('maxTokens') as string, 10) || 8000;
            break;

          case 'rules':
            submissionData.rulesContent = formData.get('rulesContent') as string;
            submissionData.temperature =
              Number.parseFloat(formData.get('temperature') as string) || 0.7;
            submissionData.maxTokens =
              Number.parseInt(formData.get('maxTokens') as string, 10) || 8000;
            break;

          case 'commands':
            submissionData.commandContent = formData.get('commandContent') as string;
            break;

          case 'hooks':
            submissionData.hookScript = formData.get('hookScript') as string;
            submissionData.hookType = formData.get('hookType') as string;
            submissionData.triggeredBy = (formData.get('triggeredBy') as string) || undefined;
            break;

          case 'statuslines':
            submissionData.statuslineScript = formData.get('statuslineScript') as string;
            submissionData.statuslineType = formData.get('statuslineType') as string;
            submissionData.refreshInterval =
              Number.parseInt(formData.get('refreshInterval') as string, 10) || 1000;
            submissionData.position = formData.get('position') as string;
            break;

          case 'mcp':
            submissionData.npmPackage = formData.get('npmPackage') as string;
            submissionData.serverType = formData.get('serverType') as string;
            submissionData.installCommand = formData.get('installCommand') as string;
            submissionData.configCommand = formData.get('configCommand') as string;
            submissionData.toolsDescription =
              (formData.get('toolsDescription') as string) || undefined;
            submissionData.envVars = (formData.get('envVars') as string) || undefined;
            break;
        }

        const result = await submitConfiguration(submissionData);

        if (result?.data?.success) {
          setSubmissionResult({
            prUrl: result.data.prUrl,
            prNumber: result.data.prNumber,
            slug: result.data.slug,
          });

          toast.success('Submission Created!', {
            description: `Your ${contentType} has been submitted for review.`,
          });

          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        toast.error('Submission Error', {
          description: error instanceof Error ? error.message : 'Failed to submit',
        });
      }
    });
  };

  return (
    <>
      {/* Success Message */}
      {submissionResult && (
        <Card className={`${UI_CLASSES.MB_6} border-green-500/20 bg-green-500/5`}>
          <CardContent className={`${UI_CLASSES.PT_6}`}>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={UI_CLASSES.FONT_MEDIUM}>Submission Successful! 🎉</p>
                <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                  Your configuration has been submitted for review. Pull Request #
                  {submissionResult.prNumber} created on GitHub.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3">
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <a href={submissionResult.prUrl} target="_blank" rel="noopener noreferrer">
                      View PR <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href="/account/submissions">Track Status</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Configuration Details</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Fill out the form - we'll handle the technical formatting for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Type Selection + Template Selector */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={typeId}>Content Type *</Label>
                <select
                  id={typeId}
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value as ContentType);
                    setName(''); // Reset name when type changes
                  }}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="agents">Claude Agent (System Prompt)</option>
                  <option value="mcp">MCP Server</option>
                  <option value="rules">Claude Rule (Expertise)</option>
                  <option value="commands">Command</option>
                  <option value="hooks">Hook</option>
                  <option value="statuslines">Statusline</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Quick Start</Label>
                <TemplateSelector contentType={contentType} onSelect={handleTemplateSelect} />
              </div>
            </div>

            {/* Name Field + Duplicate Warning */}
            <div className="space-y-2">
              <Label htmlFor={nameId}>Name *</Label>
              <Input
                id={nameId}
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g., ${contentType === 'agents' ? 'Code Review Assistant' : contentType === 'mcp' ? 'GitHub MCP Server' : `My ${contentType}`}`}
                required
              />
              <DuplicateWarning contentType={contentType} name={name} />
            </div>

            {/* Base Fields (All Types) */}
            <div className="space-y-2">
              <Label htmlFor={descriptionId}>Description *</Label>
              <Textarea
                id={descriptionId}
                name="description"
                placeholder="Brief description of what this does..."
                required
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={categoryId}>Category *</Label>
                <Input
                  id={categoryId}
                  name="category"
                  placeholder="e.g., Development, Productivity"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={authorId}>Your Name *</Label>
                <Input
                  id={authorId}
                  name="author"
                  placeholder="Your name or GitHub username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={githubId}>GitHub Repository (optional)</Label>
              <div className="flex gap-2">
                <Github className="h-5 w-5 mt-2.5 text-muted-foreground flex-shrink-0" />
                <Input
                  id={githubId}
                  name="github"
                  type="url"
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </div>

            {/* Type-Specific Fields */}
            {contentType === 'agents' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={systemPromptId}>System Prompt * (Plaintext)</Label>
                  <Textarea
                    id={systemPromptId}
                    name="systemPrompt"
                    placeholder="You are an expert in... [Write your Claude system prompt here in plain English]"
                    required
                    rows={12}
                    className="font-mono text-sm resize-y"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Write your Claude system prompt in plain text. No JSON formatting needed!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={temperatureIdAgents}>Temperature (0-1)</Label>
                    <Input
                      id={temperatureIdAgents}
                      name="temperature"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={maxTokensIdAgents}>Max Tokens</Label>
                    <Input
                      id={maxTokensIdAgents}
                      name="maxTokens"
                      type="number"
                      min="100"
                      max="200000"
                      defaultValue="8000"
                    />
                  </div>
                </div>
              </>
            )}

            {contentType === 'rules' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={rulesContentId}>Claude Rules Content * (Plaintext)</Label>
                  <Textarea
                    id={rulesContentId}
                    name="rulesContent"
                    placeholder="You are an expert in... [Write your Claude expertise rules in plain text]"
                    required
                    rows={12}
                    className="font-mono text-sm resize-y"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Define Claude's expertise and guidelines in plain text.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={temperatureIdCommands}>Temperature (0-1)</Label>
                    <Input
                      id={temperatureIdCommands}
                      name="temperature"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={maxTokensIdCommands}>Max Tokens</Label>
                    <Input
                      id={maxTokensIdCommands}
                      name="maxTokens"
                      type="number"
                      min="100"
                      max="200000"
                      defaultValue="8000"
                    />
                  </div>
                </div>
              </>
            )}

            {contentType === 'commands' && (
              <div className="space-y-2">
                <Label htmlFor={commandContentId}>Command Content * (Plaintext)</Label>
                <Textarea
                  id={commandContentId}
                  name="commandContent"
                  placeholder="---&#10;description: What this command does&#10;model: claude-3-5-sonnet-20241022&#10;---&#10;&#10;Command instructions here..."
                  required
                  rows={12}
                  className="font-mono text-sm resize-y"
                />
                <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                  Provide command content in markdown format with frontmatter. No JSON needed!
                </p>
              </div>
            )}

            {contentType === 'hooks' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={hookScriptId}>Hook Script * (Bash)</Label>
                  <Textarea
                    id={hookScriptId}
                    name="hookScript"
                    placeholder="#!/usr/bin/env bash&#10;# Your hook script here...&#10;&#10;echo 'Hook running...'&#10;exit 0"
                    required
                    rows={12}
                    className="font-mono text-sm resize-y"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Write your bash hook script in plain text.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={hookTypeId}>Hook Type *</Label>
                    <select
                      id={hookTypeId}
                      name="hookType"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="pre-tool-use">Pre Tool Use</option>
                      <option value="post-tool-use">Post Tool Use</option>
                      <option value="pre-command">Pre Command</option>
                      <option value="post-command">Post Command</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={triggeredById}>Triggered By (optional)</Label>
                    <Input id={triggeredById} name="triggeredBy" placeholder="tool1, tool2" />
                  </div>
                </div>
              </>
            )}

            {contentType === 'statuslines' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={statuslineScriptId}>Statusline Script * (Bash)</Label>
                  <Textarea
                    id={statuslineScriptId}
                    name="statuslineScript"
                    placeholder="#!/usr/bin/env bash&#10;&#10;read -r input&#10;echo 'Your statusline output'"
                    required
                    rows={12}
                    className="font-mono text-sm resize-y"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Write your bash statusline script in plain text.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={statuslineTypeId}>Type</Label>
                    <select
                      id={statuslineTypeId}
                      name="statuslineType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="custom">Custom</option>
                      <option value="minimal">Minimal</option>
                      <option value="extended">Extended</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={refreshIntervalId}>Refresh (ms)</Label>
                    <Input
                      id={refreshIntervalId}
                      name="refreshInterval"
                      type="number"
                      defaultValue="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={positionId}>Position</Label>
                    <select
                      id={positionId}
                      name="position"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {contentType === 'mcp' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={npmPackageId}>NPM Package Name *</Label>
                  <Input
                    id={npmPackageId}
                    name="npmPackage"
                    placeholder="@company/mcp-server-name"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={serverTypeId}>Server Type *</Label>
                    <select
                      id={serverTypeId}
                      name="serverType"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="stdio">STDIO</option>
                      <option value="sse">SSE</option>
                      <option value="websocket">WebSocket</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={installCommandId}>Installation Command *</Label>
                    <Input
                      id={installCommandId}
                      name="installCommand"
                      placeholder="npm install -g @company/mcp-server"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={configCommandId}>Configuration Command *</Label>
                  <Input
                    id={configCommandId}
                    name="configCommand"
                    placeholder="mcp-server-name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={toolsDescriptionId}>Tools/Capabilities (optional)</Label>
                  <Textarea
                    id={toolsDescriptionId}
                    name="toolsDescription"
                    placeholder="Describe what tools and capabilities this MCP server provides..."
                    rows={4}
                    className="resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={envVarsId}>Environment Variables (optional)</Label>
                  <Textarea
                    id={envVarsId}
                    name="envVars"
                    placeholder="API_KEY=your-key-here&#10;DATABASE_URL=postgres://..."
                    rows={4}
                    className="font-mono text-sm resize-y"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    One per line, format: KEY=value
                  </p>
                </div>
              </>
            )}

            {/* Tags (All Types) */}
            <div className="space-y-2">
              <Label htmlFor={tagsId}>Tags (optional)</Label>
              <Input
                id={tagsId}
                name="tags"
                placeholder="productivity, ai, automation (comma-separated)"
              />
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                Separate multiple tags with commas (max 10)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button type="submit" disabled={isPending} className="w-full sm:flex-1">
                {isPending ? (
                  <>
                    <Github className="mr-2 h-4 w-4 animate-pulse" />
                    Creating PR...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <Github className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} text-blue-400`}>
                    How it works
                  </p>
                  <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                    We'll automatically create a Pull Request with your submission. Our team reviews
                    for quality and accuracy, then merges it to make your contribution live!
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
