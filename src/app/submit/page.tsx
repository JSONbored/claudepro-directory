'use client';

import { useState, useTransition } from 'react';
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
import { CheckCircle, ExternalLink, Github, Send } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { submitConfiguration } from '@/src/lib/actions/submission-actions';
import Link from 'next/link';

type ContentType = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines';

export default function SubmitPage() {
  const [contentType, setContentType] = useState<ContentType>('agents');
  const [isPending, startTransition] = useTransition();
  const [submissionResult, setSubmissionResult] = useState<{
    prUrl: string;
    prNumber: number;
    slug: string;
  } | null>(null);

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

        let submissionData: any = { ...baseData };

        // Add type-specific fields
        switch (contentType) {
          case 'agents':
            submissionData.systemPrompt = formData.get('systemPrompt') as string;
            submissionData.temperature = parseFloat(formData.get('temperature') as string) || 0.7;
            submissionData.maxTokens = parseInt(formData.get('maxTokens') as string) || 8000;
            break;

          case 'rules':
            submissionData.rulesContent = formData.get('rulesContent') as string;
            submissionData.temperature = parseFloat(formData.get('temperature') as string) || 0.7;
            submissionData.maxTokens = parseInt(formData.get('maxTokens') as string) || 8000;
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
            submissionData.refreshInterval = parseInt(formData.get('refreshInterval') as string) || 1000;
            submissionData.position = formData.get('position') as string;
            break;

          case 'mcp':
            submissionData.npmPackage = formData.get('npmPackage') as string;
            submissionData.serverType = formData.get('serverType') as string;
            submissionData.installCommand = formData.get('installCommand') as string;
            submissionData.configCommand = formData.get('configCommand') as string;
            submissionData.toolsDescription = (formData.get('toolsDescription') as string) || undefined;
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
    <div className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
      {/* Header */}
      <div className={`${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.TEXT_CENTER} ${UI_CLASSES.MB_12}`}>
        <h1 className="text-4xl font-bold mb-4">Submit Your Configuration</h1>
        <p className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
          Share your Claude configurations with the community - no JSON formatting required!
        </p>
      </div>

      {/* Success Message */}
      {submissionResult && (
        <Card className={`${UI_CLASSES.MAX_W_2XL} ${UI_CLASSES.MX_AUTO} ${UI_CLASSES.MB_8} border-green-500/20 bg-green-500/5`}>
          <CardContent className={UI_CLASSES.PT_6}>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className={UI_CLASSES.FONT_MEDIUM}>Submission Successful! 🎉</p>
                <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                  Your configuration has been submitted for review. Pull Request #{submissionResult.prNumber} created on GitHub.
                </p>
                <div className="flex gap-3 mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={submissionResult.prUrl} target="_blank" rel="noopener noreferrer">
                      View PR <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/account/submissions">
                      Track Status
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card className={`${UI_CLASSES.MAX_W_2XL} ${UI_CLASSES.MX_AUTO}`}>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
          <CardDescription>
            Fill out the form - we'll handle the technical formatting for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type">Content Type *</Label>
              <select
                id="type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
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

            {/* Base Fields (All Types) */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder={`e.g., ${contentType === 'agents' ? 'Code Review Assistant' : contentType === 'mcp' ? 'GitHub MCP Server' : 'My ' + contentType}`}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of what this does..."
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Development, Productivity, Data Analysis"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Your Name *</Label>
              <Input
                id="author"
                name="author"
                placeholder="Your name or GitHub username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub Repository (optional)</Label>
              <div className="flex gap-2">
                <Github className="h-5 w-5 mt-2.5 text-muted-foreground" />
                <Input
                  id="github"
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
                  <Label htmlFor="systemPrompt">System Prompt * (Plaintext)</Label>
                  <Textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    placeholder="You are an expert in... [Write your Claude system prompt here in plain English]"
                    required
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Write your Claude system prompt in plain text. No JSON formatting needed!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (0-1)</Label>
                    <Input
                      id="temperature"
                      name="temperature"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
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
                  <Label htmlFor="rulesContent">Claude Rules Content * (Plaintext)</Label>
                  <Textarea
                    id="rulesContent"
                    name="rulesContent"
                    placeholder="You are an expert in... [Write your Claude expertise rules in plain text]"
                    required
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Define Claude's expertise and guidelines in plain text.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (0-1)</Label>
                    <Input
                      id="temperature"
                      name="temperature"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
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
                <Label htmlFor="commandContent">Command Content * (Plaintext)</Label>
                <Textarea
                  id="commandContent"
                  name="commandContent"
                  placeholder="---&#10;description: What this command does&#10;model: claude-3-5-sonnet-20241022&#10;---&#10;&#10;Command instructions here..."
                  required
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                  Provide command content in markdown format with frontmatter. No JSON needed!
                </p>
              </div>
            )}

            {contentType === 'hooks' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hookScript">Hook Script * (Bash)</Label>
                  <Textarea
                    id="hookScript"
                    name="hookScript"
                    placeholder="#!/usr/bin/env bash&#10;# Your hook script here...&#10;&#10;echo 'Hook running...'&#10;exit 0"
                    required
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Write your bash hook script in plain text.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hookType">Hook Type *</Label>
                    <select
                      id="hookType"
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
                    <Label htmlFor="triggeredBy">Triggered By (optional)</Label>
                    <Input
                      id="triggeredBy"
                      name="triggeredBy"
                      placeholder="tool1, tool2"
                    />
                  </div>
                </div>
              </>
            )}

            {contentType === 'statuslines' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="statuslineScript">Statusline Script * (Bash)</Label>
                  <Textarea
                    id="statuslineScript"
                    name="statuslineScript"
                    placeholder="#!/usr/bin/env bash&#10;&#10;read -r input&#10;echo 'Your statusline output'"
                    required
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    Write your bash statusline script in plain text.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="statuslineType">Type</Label>
                    <select
                      id="statuslineType"
                      name="statuslineType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="custom">Custom</option>
                      <option value="minimal">Minimal</option>
                      <option value="extended">Extended</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">Refresh (ms)</Label>
                    <Input
                      id="refreshInterval"
                      name="refreshInterval"
                      type="number"
                      defaultValue="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <select
                      id="position"
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
                  <Label htmlFor="npmPackage">NPM Package Name *</Label>
                  <Input
                    id="npmPackage"
                    name="npmPackage"
                    placeholder="@company/mcp-server-name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serverType">Server Type *</Label>
                  <select
                    id="serverType"
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
                  <Label htmlFor="installCommand">Installation Command *</Label>
                  <Input
                    id="installCommand"
                    name="installCommand"
                    placeholder="npm install -g @company/mcp-server"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="configCommand">Configuration Command *</Label>
                  <Input
                    id="configCommand"
                    name="configCommand"
                    placeholder="mcp-server-name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toolsDescription">Tools/Capabilities (optional)</Label>
                  <Textarea
                    id="toolsDescription"
                    name="toolsDescription"
                    placeholder="Describe what tools and capabilities this MCP server provides..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="envVars">Environment Variables (optional)</Label>
                  <Textarea
                    id="envVars"
                    name="envVars"
                    placeholder="API_KEY=your-key-here&#10;DATABASE_URL=postgres://..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    One per line, format: KEY=value
                  </p>
                </div>
              </>
            )}

            {/* Tags (All Types) */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="productivity, ai, automation (comma-separated)"
              />
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                Separate multiple tags with commas (max 10)
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isPending} className="flex-1">
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

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Github className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} text-blue-400`}>
                    How it works
                  </p>
                  <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                    We'll automatically create a Pull Request with your submission. Our team reviews for quality and accuracy, then merges it to make your contribution live!
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
