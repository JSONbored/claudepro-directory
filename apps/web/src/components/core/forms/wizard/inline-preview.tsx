'use client';

/**
 * Inline Preview Component
 *
 * Live preview of submission card as user fills the wizard.
 * Shows on desktop (sidebar) and mobile (modal).
 */

import { Eye, Sparkles, X } from '@heyclaude/web-runtime/icons';
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
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">
              {formData.name || 'Untitled Submission'}
            </CardTitle>
            <Badge variant="outline" className="shrink-0">
              {formData.submission_type}
            </Badge>
          </div>
          {qualityScore > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${qualityScore}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    qualityScore >= 80
                      ? 'bg-green-500'
                      : qualityScore >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                />
              </div>
              <span className="text-muted-foreground text-xs">{qualityScore}%</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.description ? (
            <p className="line-clamp-3 text-muted-foreground text-sm">{formData.description}</p>
          ) : (
            <p className="text-muted-foreground/60 text-sm italic">No description yet...</p>
          )}

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {formData.tags.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{formData.tags.length - 5}
                </Badge>
              )}
            </div>
          )}

          {formData.examples.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Sparkles className="h-3 w-3" />
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Live Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="h-7 px-2"
            >
              {isVisible ? <Eye className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
              className="text-center text-muted-foreground text-xs"
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
          className="fixed right-4 bottom-4 z-50 gap-2 shadow-lg"
        >
          <Eye className="h-4 w-4" />
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
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={TOKENS.animations.spring.smooth}
                className="-translate-y-1/2 sm:-translate-x-1/2 fixed inset-x-4 top-1/2 z-50 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-white">Live Preview</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileModalOpen(false)}
                      className="h-7 px-2 text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
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
    <Button variant="outline" size="sm" onClick={onClick} className={cn('gap-2', className)}>
      {isVisible ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      <span className="hidden sm:inline">{isVisible ? 'Hide' : 'Show'} Preview</span>
    </Button>
  );
}
