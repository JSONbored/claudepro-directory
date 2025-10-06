"use client";

/**
 * Card Copy Action Component
 *
 * Reusable copy-to-clipboard button for card components.
 * Provides consistent behavior with toast notifications and analytics tracking.
 *
 * Used in: ConfigCard, CollectionCard
 */

import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { useCopyWithEmailCapture } from "@/src/hooks/use-copy-with-email-capture";
import { trackCopy } from "@/src/lib/actions/track-view";
import { Check, Copy } from "@/src/lib/icons";
import type { ContentCategory } from "@/src/lib/schemas/shared.schema";
import { UI_CLASSES } from "@/src/lib/ui-constants";

export interface CardCopyActionProps {
  /** Full URL to copy to clipboard */
  url: string;
  /** Content category for analytics tracking */
  category: ContentCategory;
  /** Content slug for analytics tracking */
  slug: string;
  /** Display title for aria-label */
  title: string;
  /** Component name for analytics context */
  componentName: string;
}

export function CardCopyAction({
  url,
  category,
  slug,
  title,
  componentName,
}: CardCopyActionProps) {
  const referrer =
    typeof window !== "undefined" ? window.location.pathname : undefined;
  const { copied, copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: "link",
      category,
      slug,
      ...(referrer && { referrer }),
    },
    onSuccess: () => {
      // Track copy action for analytics (silent fail)
      trackCopy({ category, slug }).catch(() => {
        // Silent fail - don't break UX
      });

      toast.success("Link copied!", {
        description: "The link has been copied to your clipboard.",
      });
    },
    onError: () => {
      toast.error("Failed to copy", {
        description: "Could not copy the link to clipboard.",
      });
    },
    context: {
      component: componentName,
      action: "copy-link",
    },
  });

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copy(url);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
      onClick={handleCopy}
      aria-label={copied ? "Link copied to clipboard" : `Copy link to ${title}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
    </Button>
  );
}
