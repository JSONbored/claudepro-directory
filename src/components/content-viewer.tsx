import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContentViewerProps {
  content: string;
  language?: string;
  maxHeight?: number;
  className?: string;
}

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
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setShowExpandButton(contentHeight > maxHeight);
    }
  }, [content, maxHeight]);

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
        'relative rounded-lg border border-border bg-card',
        isFullscreen && 'fixed inset-0 z-50 bg-background p-4',
        className
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur p-2">
        <span className="text-sm font-medium text-muted-foreground px-2">
          {language.toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          {showExpandButton && !isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2"
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
            className="h-7 px-2"
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
          !isExpanded && !isFullscreen && showExpandButton && 'max-h-[600px]',
          isFullscreen && 'h-[calc(100vh-8rem)]'
        )}
        style={{
          maxHeight: !isExpanded && !isFullscreen && showExpandButton ? `${maxHeight}px` : undefined,
        }}
      >
        <pre
          className={cn(
            'p-4 text-sm font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere',
            'selection:bg-accent/20'
          )}
        >
          <code className="block w-full">{displayContent}</code>
        </pre>
      </div>

      {showExpandButton && !isExpanded && !isFullscreen && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none rounded-b-lg" />
      )}
    </div>
  );
};