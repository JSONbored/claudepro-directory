'use client';

/**
 * Inline Preview Component
 *
 * Live preview of submission card as user fills the wizard.
 * Shows on desktop (sidebar) and mobile (modal).
 */

import { Eye, Sparkles, X } from '@heyclaude/web-runtime/icons';
import {
  backdrop,
  bgColor,
  cluster,
  flexGrow,
  flexWrap,
  gap,
  iconSize,
  alignItems,
  justify,
  muted,
  overflow,
  padding,
  radius,
  shadow,
  size,
  spaceY,
  textColor,
  weight,
  zLayer,
} from '@heyclaude/web-runtime/design-system';
import type { SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/ui/design-tokens/submission-form';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Badge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

interface InlinePreviewProps {
  formData: {
    submission_type: SubmissionContentType;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
    type_specific: Record<string, unknown>;
  };
  qualityScore: number;
  className?: string;
}

export function InlinePreview({ formData, qualityScore, className }: InlinePreviewProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const previewCard = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={TOKENS.animations.spring.smooth}
    >
      <Card className="overflow-hidden">
        <CardHeader className={`${spaceY.tight} pb-3`}>
          <div className={`flex ${alignItems.start} ${justify.between} ${gap.compact}`}>
            <CardTitle className={`line-clamp-2 ${size.base}`}>
              {formData.name || 'Untitled Submission'}
            </CardTitle>
            <Badge variant="outline" className="shrink-0">
              {formData.submission_type}
            </Badge>
          </div>
          {qualityScore > 0 && (
            <div className={cluster.compact}>
              <div className={`h-1.5 ${flexGrow['1']} ${overflow.hidden} ${radius.full} ${bgColor.muted}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${qualityScore}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    `h-full ${radius.full}`,
                    qualityScore >= 80
                      ? 'bg-green-500'
                      : qualityScore >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                />
              </div>
              <span className={`${muted.default} ${size.xs}`}>{qualityScore}%</span>
            </div>
          )}
        </CardHeader>
        <CardContent className={spaceY.default}>
          {formData.description ? (
            <p className={`line-clamp-3 ${muted.sm}`}>{formData.description}</p>
          ) : (
            <p className={`${muted.default}/60 ${size.sm} italic`}>No description yet...</p>
          )}

          {formData.tags.length > 0 && (
            <div className={`flex ${flexWrap.wrap} ${gap.snug}`}>
              {formData.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className={size.xs}>
                  {tag}
                </Badge>
              ))}
              {formData.tags.length > 5 && (
                <Badge variant="secondary" className={size.xs}>
                  +{formData.tags.length - 5}
                </Badge>
              )}
            </div>
          )}

          {formData.examples.length > 0 && (
            <div className={`${cluster.snug} ${muted.default} ${size.xs}`}>
              <Sparkles className={iconSize.xs} />
              <span>
                {formData.examples.length} example{formData.examples.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <>
      {/* Desktop Sidebar Preview */}
      <div className={cn('hidden lg:block', className)}>
        <div className={spaceY.default}>
          <div className={`flex ${alignItems.center} ${justify.between}`}>
            <h3 className={`${weight.semibold} ${size.sm}`}>Live Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className={`h-7 ${padding.xTight}`}
            >
              {isVisible ? <Eye className={iconSize.xsPlus} /> : <Eye className={iconSize.xsPlus} />}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={TOKENS.animations.spring.smooth}
              >
                {previewCard}
              </motion.div>
            )}
          </AnimatePresence>

          {!isVisible && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center ${muted.default} ${size.xs}`}
            >
              Preview hidden
            </motion.p>
          )}
        </div>
      </div>

      {/* Mobile Floating Button + Modal */}
      <div className="lg:hidden">
        <Button
          onClick={() => setIsMobileModalOpen(true)}
          size="sm"
          variant="outline"
          className={`fixed right-4 bottom-4 ${zLayer.modal} ${gap.compact} ${shadow.lg}`}
        >
          <Eye className={iconSize.sm} />
          Preview
        </Button>

        <AnimatePresence>
          {isMobileModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileModalOpen(false)}
                className={`fixed inset-0 ${zLayer.modal} ${bgColor.overlay} ${backdrop.sm}`}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={TOKENS.animations.spring.smooth}
                className={`-translate-y-1/2 sm:-translate-x-1/2 fixed inset-x-4 top-1/2 ${zLayer.modal} sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md`}
              >
                <div className={spaceY.default}>
                  <div className={`flex ${alignItems.center} ${justify.between}`}>
                    <h3 className={`${weight.semibold} ${size.sm} ${textColor.white}`}>Live Preview</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileModalOpen(false)}
                      className={`h-7 ${padding.xTight} ${textColor.white} hover:bg-white/10`}
                    >
                      <X className={iconSize.sm} />
                    </Button>
                  </div>
                  {previewCard}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/**
 * Preview Toggle Button (for wizard header)
 */
interface PreviewToggleProps {
  onClick: () => void;
  isVisible: boolean;
  className?: string;
}

export function PreviewToggle({ onClick, isVisible, className }: PreviewToggleProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className={cn(
  `${gap.compact}`, className)}>
      {isVisible ? <Eye className={iconSize.sm} /> : <Eye className={iconSize.sm} />}
      <span className="hidden sm:inline">{isVisible ? 'Hide' : 'Show'} Preview</span>
    </Button>
  );
}
