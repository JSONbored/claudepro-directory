import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from '@/lib/icons';
import type { ContentViewerProps } from '@/lib/schemas/component.schema';
import { UI_CLASSES } from '@/lib/ui-constants';
import { cn } from '@/lib/utils';

// ContentViewerProps is now imported from component.schema.ts

export const ContentViewer = ({
  content,
  language = 'markdown',
  maxHeight = 600,
  className,
}: ContentViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Use ResizeObserver to avoid forced reflow
    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to batch DOM reads
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const contentHeight = entry.target.scrollHeight;
          setShowExpandButton(contentHeight > maxHeight);
        }
      });
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [maxHeight]);

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatContent = () => {
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    }
    return content;
  };

  const displayContent = formatContent();

  return (
    <div
      ref={containerRef}
      className={cn(
        `relative ${UI_CLASSES.ROUNDED_LG} border border-border bg-card container-card contain-content`,
        isFullscreen &&
          `fixed ${UI_CLASSES.INSET_0} ${UI_CLASSES.Z_50} bg-background ${UI_CLASSES.P_4}`,
        className
      )}
    >
      <div
        className={`sticky ${UI_CLASSES.TOP_0} ${UI_CLASSES.Z_10} ${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.BORDER_B} border-border bg-card/95 backdrop-blur ${UI_CLASSES.P_2}`}
      >
        <span className={`text-sm font-medium text-muted-foreground ${UI_CLASSES.PX_2}`}>
          {language.toUpperCase()}
        </span>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          {showExpandButton && !isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`h-7 ${UI_CLASSES.PX_2}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className={`h-7 ${UI_CLASSES.PX_2}`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1" />
                Exit
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-1" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        ref={contentRef}
        className={cn(
          'overflow-auto transition-all duration-300',
          !(isExpanded || isFullscreen) && showExpandButton && 'max-h-[600px]',
          isFullscreen && 'h-[calc(100vh-8rem)]'
        )}
        style={{
          maxHeight:
            !(isExpanded || isFullscreen) && showExpandButton ? `${maxHeight}px` : undefined,
        }}
      >
        <pre
          className={cn(
            `${UI_CLASSES.P_4} text-sm font-mono ${UI_CLASSES.WHITESPACE_PRE_WRAP} break-words overflow-wrap-anywhere`,
            'selection:bg-accent/20'
          )}
        >
          <code className={`${UI_CLASSES.BLOCK} ${UI_CLASSES.W_FULL}`}>{displayContent}</code>
        </pre>
      </div>

      {showExpandButton && !isExpanded && !isFullscreen && (
        <div
          className={`${UI_CLASSES.ABSOLUTE} ${UI_CLASSES.BOTTOM_0} ${UI_CLASSES.LEFT_0} ${UI_CLASSES.RIGHT_0} h-24 bg-gradient-to-t from-card via-card/80 to-transparent ${UI_CLASSES.POINTER_EVENTS_NONE} rounded-b-lg`}
        />
      )}
    </div>
  );
};
