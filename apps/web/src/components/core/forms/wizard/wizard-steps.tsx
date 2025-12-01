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
import { iconSize, cluster, spaceY, muted, marginBottom, marginTop, weight ,size  , gap , padding , row , radius } from '@heyclaude/web-runtime/design-system';
import type { SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/ui/design-tokens/submission-form';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { Badge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';

interface FormData {
  submission_type: SubmissionContentType;
  name: string;
  description: string;
  author: string;
  author_profile_url?: string;
  github_url?: string;
  type_specific: Record<string, unknown>;
  tags: string[];
  examples: string[];
  category: string;
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
    <div className={spaceY.loose}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...TOKENS.animations.spring.bouncy, delay: 0.2 }}
          className={`${marginBottom.default} inline-flex`}
        >
          <Sparkles className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className={`${weight.bold} ${size['3xl']} text-foreground`}>Examples & Tags</h2>
        <p className={`${marginTop.compact} ${muted.lg}`}>
          Help users discover and understand your submission
        </p>
      </motion.div>

      {/* Examples Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.1 }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className={cluster.compact}>
              <Code className={iconSize.md} />
              Usage Examples
              <span className={`ml-auto font-normal ${muted.sm}`}>
                {data.examples.length} / 10
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className={spaceY.comfortable}>
            <p className={muted.sm}>
              Add examples to show how your configuration is used
            </p>

            {/* Add Example Input */}
            <div className={`flex ${gap.compact}`}>
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
                  className={`${gap.compact}`}
                  style={{
                    backgroundColor: TOKENS.colors.accent.primary,
                  }}
                >
                  <Plus className={iconSize.sm} />
                  Add
                </Button>
              </motion.div>
            </div>

            {/* Examples List */}
            <AnimatePresence mode="popLayout">
              {data.examples.length > 0 ? (
                <div className={spaceY.compact}>
                  {data.examples.map((example, index) => {
                    // Create stable key from example content
                    const exampleKey = `example-${index}-${example.slice(0, 20)}`;
                    return (
                      <motion.div
                        key={exampleKey}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={TOKENS.animations.spring.snappy}
                        className={`group ${row.default} ${radius.lg} border ${padding.compact} transition-all hover:border-accent-primary/50`}
                        style={{
                          backgroundColor: TOKENS.colors.background.primary,
                          borderColor: TOKENS.colors.border.default,
                        }}
                      >
                        <div
                          className={`${marginTop.micro} flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${weight.bold} ${size.xs}`}
                          style={{
                            backgroundColor: `${TOKENS.colors.accent.primary}20`,
                            color: TOKENS.colors.accent.primary,
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className={`flex-1 ${size.sm} leading-relaxed`}>{example}</span>
                        <motion.button
                          type="button"
                          onClick={() => removeExample(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`shrink-0 rounded-full ${padding.micro} opacity-0 transition-all group-hover:opacity-100`}
                          style={{
                            color: TOKENS.colors.error.text,
                          }}
                        >
                          <X className={iconSize.sm} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${radius.lg} border border-dashed ${padding.relaxed} text-center`}
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Code className={`mx-auto mb-3 h-10 w-10 ${muted.default}`} />
                  <p className={muted.sm}>
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
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.2 }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className={cluster.compact}>
              <Tag className={iconSize.md} />
              Tags
              <span className={`ml-auto font-normal ${muted.sm}`}>
                {data.tags.length} tags
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className={spaceY.comfortable}>
            <p className={muted.sm}>
              Add tags to help users discover your submission
            </p>

            {/* Add Tag Input */}
            <div className={`flex ${gap.compact}`}>
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
                  className={`${gap.compact}`}
                  style={{
                    backgroundColor: TOKENS.colors.accent.primary,
                  }}
                >
                  <Plus className={iconSize.sm} />
                  Add
                </Button>
              </motion.div>
            </div>

            {/* Tags List */}
            <AnimatePresence mode="popLayout">
              {data.tags.length > 0 ? (
                <div className={`flex flex-wrap ${gap.compact}`}>
                  {data.tags.map((tag) => {
                    // Use tag content as key (tags should be unique)
                    const tagKey = `tag-${tag}`;
                    return (
                      <motion.div
                        key={tagKey}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={TOKENS.animations.spring.bouncy}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Badge
                          variant="secondary"
                          className={`group ${gap.snug} pr-1 ${size.sm}`}
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
                            className={`ml-1 rounded-full ${padding.hair} transition-colors hover:bg-accent-primary/20`}
                          >
                            <X className={iconSize.xs} />
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
                  className={`${radius.lg} border border-dashed ${padding.comfortable} text-center`}
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Tag className={`mx-auto mb-2 h-8 w-8 ${muted.default}`} />
                  <p className={muted.sm}>
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
  qualityScore: number;
  onSubmit: () => void;
  isSubmitting: boolean;
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
    <div className={`relative ${spaceY.loose}`}>
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
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
              transition={TOKENS.animations.spring.bouncy}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 0.5,
                }}
              >
                <Rocket
                  className="mx-auto mb-6 h-24 w-24"
                  style={{ color: TOKENS.colors.accent.primary }}
                />
              </motion.div>
              <h2 className={`${marginBottom.compact} ${weight.bold} ${size['4xl']}`}>Submission Complete!</h2>
              <p className={muted.lg}>Your contribution is on its way 🎉</p>

              {/* Confetti Effect */}
              {[...Array(12)].map((_, i) => {
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
                      duration: 1.5,
                      delay: i * 0.05,
                      ease: 'easeOut',
                    }}
                    className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 rounded-full"
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
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...TOKENS.animations.spring.bouncy, delay: 0.2 }}
          className={`${marginBottom.default} inline-flex`}
        >
          <Eye className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className={`${weight.bold} ${size['3xl']} text-foreground`}>Review & Submit</h2>
        <p className={`${marginTop.compact} ${muted.lg}`}>
          Double-check everything looks good before submitting
        </p>
      </motion.div>

      {/* Quality Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.1 }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={`${marginBottom.compact} ${muted.sm}`}>Submission Quality</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={TOKENS.animations.spring.bouncy}
                className={`${marginBottom.default} inline-flex`}
              >
                <div className="relative">
                  {/* Circular Progress */}
                  <svg className="-rotate-90 h-32 w-32 transform">
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
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{
                        pathLength: qualityScore / 100,
                        strokeDasharray: '1 1',
                      }}
                    />
                  </svg>

                  {/* Score Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className={`${weight.bold} ${size['3xl']}`}
                      style={{ color: qualityLevel.color }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.5,
                        ...TOKENS.animations.spring.bouncy,
                      }}
                    >
                      {qualityScore}%
                    </motion.span>
                    <motion.span
                      className={`${muted.default} ${size.xs}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
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
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.2 }}
        className={`grid ${gap.comfortable} sm:grid-cols-2`}
      >
        {/* Basic Info Summary */}
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className={`${cluster.compact} ${size.base}`}>
              <Edit className={iconSize.sm} />
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className={`${spaceY.default} ${size.sm}`}>
            <div>
              <span className={muted.default}>Type:</span>
              <p className={weight.medium}>{data.submission_type}</p>
            </div>
            <div>
              <span className={muted.default}>Name:</span>
              <p className={weight.medium}>{data.name}</p>
            </div>
            <div>
              <span className={muted.default}>Author:</span>
              <p className={weight.medium}>{data.author}</p>
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
            <CardTitle className={`${cluster.compact} ${size.base}`}>
              <Sparkles className={iconSize.sm} />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className={`${spaceY.default} ${size.sm}`}>
            <div>
              <span className={muted.default}>Examples:</span>
              <p className={weight.medium}>{data.examples.length} added</p>
            </div>
            <div>
              <span className={muted.default}>Tags:</span>
              <p className={weight.medium}>{data.tags.length} tags</p>
            </div>
            <div>
              <span className={muted.default}>Config Fields:</span>
              <p className={weight.medium}>{Object.keys(data.type_specific).length} fields</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Description Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.3 }}
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
            <p className={`whitespace-pre-wrap ${size.sm} leading-relaxed`}>{data.description}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.4 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || qualityScore < 40}
            className={`group relative w-full ${gap.default} ${padding.yComfortable} ${size.lg}`}
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
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }}
                >
                  <Clock className={iconSize.md} />
                </motion.div>
                Submitting...
              </>
            ) : (
              <>
                <Rocket className="group-hover:-translate-y-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
                Submit for Review
              </>
            )}
          </Button>
        </motion.div>

        {qualityScore < 40 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${marginTop.compact} text-center ${muted.sm}`}
          >
            Complete more fields to reach the minimum quality threshold
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
