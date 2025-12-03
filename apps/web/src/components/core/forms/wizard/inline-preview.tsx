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
  hoverBg,
  iconSize,
  alignItems,
  justify,
  muted,
  overflow,
  padding,
  paddingBottom,
  radius,
  shadow,
  size,
  spaceY,
  textColor,
  weight,
  zLayer,
  maxWidth,
  display,
  position,
  truncate,
  textAlign,
  height,
  width,
  translate,
  fixed,
} from '@heyclaude/web-runtime/design-system';
import type { SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
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
      transition={animation.spring.smooth}
    >
      <Card className={overflow.hidden}>
        <CardHeader className={`${spaceY.tight} ${paddingBottom.default}`}>
          <div className={`${display.flex} ${alignItems.start} ${justify.between} ${gap.compact}`}>
            <CardTitle className={`${truncate.lines2} ${size.base}`}>
              {formData.name || 'Untitled Submission'}
            </CardTitle>
            <Badge variant="outline" className={flexGrow.shrink0}>
              {formData.submission_type}
            </Badge>
          </div>
          {qualityScore > 0 && (
            <div className={cluster.compact}>
              <div className={`${iconSize.xs} ${flexGrow['1']} ${overflow.hidden} ${radius.full} ${bgColor.muted}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${qualityScore}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    `${height.full} ${radius.full}`,
                    qualityScore >= 80
                      ? bgColor.green
                      : qualityScore >= 60
                        ? bgColor.amber
                        : bgColor.red
                  )}
                />
              </div>
              <span className={`${muted.default} ${size.xs}`}>{qualityScore}%</span>
            </div>
          )}
        </CardHeader>
        <CardContent className={spaceY.default}>
          {formData.description ? (
            <p className={`${truncate.lines3} ${muted.sm}`}>{formData.description}</p>
          ) : (
            <p className={`${muted.default}/60 ${size.sm} italic`}>No description yet...</p>
          )}

          {formData.tags.length > 0 && (
            <div className={`${display.flex} ${flexWrap.wrap} ${gap.snug}`}>
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
      <div className={cn(`${display.none} lg:${display.block}`, className)}>
        <div className={spaceY.default}>
          <div className={`${display.flex} ${alignItems.center} ${justify.between}`}>
            <h3 className={`${weight.semibold} ${size.sm}`}>Live Preview</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className={`${height.buttonSm} ${padding.xTight}`}
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
                transition={animation.spring.smooth}
              >
                {previewCard}
              </motion.div>
            )}
          </AnimatePresence>

          {!isVisible && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${textAlign.center} ${muted.default} ${size.xs}`}
            >
              Preview hidden
            </motion.p>
          )}
        </div>
      </div>

      {/* Mobile Floating Button + Modal */}
      <div className={`lg:${display.none}`}>
        <Button
          onClick={() => setIsMobileModalOpen(true)}
          size="sm"
          variant="outline"
          className={`${fixed.bottomRight} ${zLayer.modal} ${gap.compact} ${shadow.lg}`}
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
                className={`${fixed.inset} ${zLayer.modal} ${bgColor.overlay} ${backdrop.sm}`}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={animation.spring.smooth}
                className={`${translate.centerY} sm:${translate.centerX} ${position.fixed} ${fixed.insetX4} ${fixed.topHalf} ${zLayer.modal} sm:${fixed.insetXAuto} sm:${fixed.leftHalf} sm:${width.full} ${maxWidth.smMd}`}
              >
                <div className={spaceY.default}>
                  <div className={`${display.flex} ${alignItems.center} ${justify.between}`}>
                    <h3 className={`${weight.semibold} ${size.sm} ${textColor.white}`}>Live Preview</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileModalOpen(false)}
                      className={`${height.buttonSm} ${padding.xTight} ${textColor.white} ${hoverBg.white10}`}
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
      <span className={`${display.none} sm:${display.inline}`}>{isVisible ? 'Hide' : 'Show'} Preview</span>
    </Button>
  );
}
