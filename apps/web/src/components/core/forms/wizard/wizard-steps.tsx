'use client';

/**
 * Wizard Steps - Modular Step Components
 *
 * Contains Step 4 (Examples & Tags) and Step 5 (Review & Submit)
 * with gorgeous animations, micro-interactions, and celebration effects.
 */

import {
  Clock,
  Code,
  Edit,
  Eye,
  Plus,
  Rocket,
  Sparkles,
  Tag,
  X,
} from '@heyclaude/web-runtime/icons';
import { type SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/design-tokens';
import { SPRING, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useState } from 'react';

interface FormData {
  author: string;
  author_profile_url?: string;
  category: string;
  description: string;
  examples: string[];
  github_url?: string;
  name: string;
  submission_type: SubmissionContentType;
  tags: string[];
  type_specific: Record<string, unknown>;
}

/**
 * Step 4: Examples & Tags
 */
export function StepExamplesTags({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const [newExample, setNewExample] = useState('');
  const [newTag, setNewTag] = useState('');

  const addExample = useCallback(() => {
    if (newExample.trim() && data.examples.length < 10) {
      onChange({ examples: [...data.examples, newExample.trim()] });
      setNewExample('');
    }
  }, [newExample, data.examples, onChange]);

  const removeExample = useCallback(
    (index: number) => {
      onChange({
        examples: data.examples.filter((_, i) => i !== index),
      });
    },
    [data.examples, onChange]
  );

  const addTag = useCallback(() => {
    if (newTag.trim() && !data.tags.includes(newTag.trim().toLowerCase())) {
      onChange({ tags: [...data.tags, newTag.trim().toLowerCase()] });
      setNewTag('');
    }
  }, [newTag, data.tags, onChange]);

  const removeTag = useCallback(
    (index: number) => {
      onChange({
        tags: data.tags.filter((_, i) => i !== index),
      });
    },
    [data.tags, onChange]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...SPRING.bouncy, delay: STAGGER.default }}
          className="mb-4 inline-flex"
        >
          <Sparkles className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="text-foreground text-3xl font-bold">Examples & Tags</h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Help users discover and understand your submission
        </p>
      </motion.div>

      {/* Examples Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.fast }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Usage Examples
              <span className="text-muted-foreground ml-auto text-sm font-normal">
                {data.examples.length} / 10
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add examples to show how your configuration is used
            </p>

            {/* Add Example Input */}
            <div className="flex gap-2">
              <Input
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExample();
                  }
                }}
                placeholder="e.g., 'Create a React component with TypeScript'"
                className="flex-1"
                maxLength={200}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  onClick={addExample}
                  disabled={!newExample.trim() || data.examples.length >= 10}
                  className="gap-2"
                  style={{
                    backgroundColor: TOKENS.colors.accent.primary,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </motion.div>
            </div>

            {/* Examples List */}
            <AnimatePresence mode="popLayout">
              {data.examples.length > 0 ? (
                <div className="space-y-2">
                  {data.examples.map((example, index) => {
                    // Create stable key from example content
                    const exampleKey = `example-${index}-${example.slice(0, 20)}`;
                    return (
                      <motion.div
                        key={exampleKey}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={SPRING.snappy}
                        className="group hover:border-accent-primary/50 flex items-start gap-3 rounded-lg border p-3 transition-all"
                        style={{
                          backgroundColor: TOKENS.colors.background.primary,
                          borderColor: TOKENS.colors.border.default,
                        }}
                      >
                        <div
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${TOKENS.colors.accent.primary}20`,
                            color: TOKENS.colors.accent.primary,
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className="flex-1 text-sm leading-relaxed">{example}</span>
                        <motion.button
                          type="button"
                          onClick={() => removeExample(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="shrink-0 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100"
                          style={{
                            color: TOKENS.colors.error.text,
                          }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-dashed p-8 text-center"
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Code className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                  <p className="text-muted-foreground text-sm">
                    No examples yet. Add some to help users understand!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tags Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.default }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
              <span className="text-muted-foreground ml-auto text-sm font-normal">
                {data.tags.length} tags
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add tags to help users discover your submission
            </p>

            {/* Add Tag Input */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g., 'react', 'typescript', 'api'"
                className="flex-1"
                maxLength={30}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="gap-2"
                  style={{
                    backgroundColor: TOKENS.colors.accent.primary,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </motion.div>
            </div>

            {/* Tags List */}
            <AnimatePresence mode="popLayout">
              {data.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag) => {
                    // Use tag content as key (tags should be unique)
                    const tagKey = `tag-${tag}`;
                    return (
                      <motion.div
                        key={tagKey}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={SPRING.bouncy}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Badge
                          variant="secondary"
                          className="group gap-1.5 pr-1 text-sm"
                          style={{
                            backgroundColor: `${TOKENS.colors.accent.primary}15`,
                            borderColor: `${TOKENS.colors.accent.primary}30`,
                            color: TOKENS.colors.accent.primary,
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const tagIndex = data.tags.indexOf(tag);
                              if (tagIndex !== -1) {
                                removeTag(tagIndex);
                              }
                            }}
                            className="hover:bg-accent-primary/20 ml-1 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-dashed p-6 text-center"
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Tag className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground text-sm">
                    No tags yet. Add tags to improve discoverability!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Step 5: Review & Submit with Celebration
 */
export function StepReviewSubmit({
  data,
  qualityScore,
  onSubmit,
  isSubmitting,
  showCelebration,
}: {
  data: FormData;
  isSubmitting: boolean;
  onSubmit: () => void;
  qualityScore: number;
  showCelebration: boolean;
}) {
  // Quality level
  const qualityLevel =
    qualityScore >= 90
      ? { label: 'Perfect!', color: TOKENS.colors.success.text }
      : qualityScore >= 70
        ? { label: 'Excellent', color: TOKENS.colors.accent.primary }
        : qualityScore >= 50
          ? { label: 'Good', color: TOKENS.colors.warning.text }
          : { label: 'Needs Work', color: TOKENS.colors.error.text };

  return (
    <div className="relative space-y-8">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{
              backgroundColor: `${TOKENS.colors.background.primary}cc`,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={SPRING.bouncy}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: DURATION.extended,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 0.5,
                }}
              >
                <Rocket
                  className="mx-auto mb-6 h-24 w-24"
                  style={{ color: TOKENS.colors.accent.primary }}
                />
              </motion.div>
              <h2 className="mb-3 text-4xl font-bold">Submission Complete!</h2>
              <p className="text-muted-foreground text-lg">Your contribution is on its way 🎉</p>

              {/* Confetti Effect */}
              {Array.from({ length: 12 }).map((_, i) => {
                // Create stable key for confetti particles
                const confettiKey = `confetti-${i}`;
                return (
                  <motion.div
                    key={confettiKey}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{
                      opacity: [1, 1, 0],
                      x: Math.cos((i / 12) * Math.PI * 2) * 200,
                      y: Math.sin((i / 12) * Math.PI * 2) * 200,
                      scale: [1, 1.5, 0],
                    }}
                    transition={{
                      duration: DURATION.veryExtended,
                      delay: i * STAGGER.micro,
                      ease: 'easeOut',
                    }}
                    className="pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      backgroundColor: [
                        TOKENS.colors.accent.primary,
                        TOKENS.colors.success.text,
                        TOKENS.colors.info.text,
                        TOKENS.colors.warning.text,
                      ][i % 4],
                    }}
                  />
                );
              })}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...SPRING.bouncy, delay: STAGGER.default }}
          className="mb-4 inline-flex"
        >
          <Eye className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="text-foreground text-3xl font-bold">Review & Submit</h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Double-check everything looks good before submitting
        </p>
      </motion.div>

      {/* Quality Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.fast }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-3 text-sm">Submission Quality</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={SPRING.bouncy}
                className="mb-4 inline-flex"
              >
                <div className="relative">
                  {/* Circular Progress */}
                  <svg className="h-32 w-32 -rotate-90 transform">
                    {/* Background Circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={TOKENS.colors.border.default}
                      strokeWidth="8"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={qualityLevel.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: qualityScore / 100 }}
                      transition={{ duration: DURATION.veryLong, ease: 'easeOut' }}
                      style={{
                        pathLength: qualityScore / 100,
                        strokeDasharray: '1 1',
                      }}
                    />
                  </svg>

                  {/* Score Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className="text-3xl font-bold"
                      style={{ color: qualityLevel.color }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: STAGGER.loose,
                        ...SPRING.bouncy,
                      }}
                    >
                      {qualityScore}%
                    </motion.span>
                    <motion.span
                      className="text-muted-foreground text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: STAGGER.veryExtended }}
                    >
                      {qualityLevel.label}
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.default }}
        className="grid gap-4 sm:grid-cols-2"
      >
        {/* Basic Info Summary */}
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Edit className="h-4 w-4" />
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium">{data.submission_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{data.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Author:</span>
              <p className="font-medium">{data.author}</p>
            </div>
          </CardContent>
        </Card>

        {/* Meta Summary */}
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Examples:</span>
              <p className="font-medium">{data.examples.length} added</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tags:</span>
              <p className="font-medium">{data.tags.length} tags</p>
            </div>
            <div>
              <span className="text-muted-foreground">Config Fields:</span>
              <p className="font-medium">{Object.keys(data.type_specific).length} fields</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Description Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.slow }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.description}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.relaxed }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || qualityScore < 40}
            className="group relative w-full gap-3 py-6 text-lg"
            size="lg"
            style={{
              backgroundColor: TOKENS.colors.accent.primary,
              boxShadow: TOKENS.shadows.glow.orange,
            }}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: DURATION.veryLong,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }}
                >
                  <Clock className="h-5 w-5" />
                </motion.div>
                Submitting...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                Submit for Review
              </>
            )}
          </Button>
        </motion.div>

        {qualityScore < 40 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground mt-3 text-center text-sm"
          >
            Complete more fields to reach the minimum quality threshold
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
