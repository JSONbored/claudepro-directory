'use client';

import { useEffect, useRef } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && content) {
      // Process content line by line for better control
      const lines = content.split('\n');
      const processedLines = [];
      let inList = false;
      let listType = '';
      let inCodeBlock = false;
      let codeLines = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle code blocks
        if (line?.trim().startsWith('```')) {
          if (!inCodeBlock) {
            // Starting code block
            inCodeBlock = true;
            codeLines = [];
            continue;
          } else {
            // Ending code block
            inCodeBlock = false;
            const codeContent = codeLines.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            processedLines.push(
              `<pre class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto my-6"><code class="text-sm font-mono text-zinc-300 block">${codeContent}</code></pre>`
            );
            continue;
          }
        }

        if (inCodeBlock) {
          codeLines.push(line || '');
          continue;
        }

        // End any open list if we hit a non-list line
        const isBulletItem = line ? /^[-*+]\s+/.test(line.trim()) : false;
        const isNumberedItem = line ? /^\d+\.\s+/.test(line.trim()) : false;
        const isListItem = isBulletItem || isNumberedItem;

        if (!isListItem && inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = '';
        }

        if (isListItem) {
          if (!inList) {
            // Starting a new list
            listType = isBulletItem ? 'ul' : 'ol';
            const listClass = isBulletItem ? 'list-disc' : 'list-decimal';
            processedLines.push(`<${listType} class="${listClass} space-y-2 my-4 ml-6">`);
            inList = true;
          }
          // Process list item
          let itemText = line ? line.replace(/^[-*+]\s+|^\d+\.\s+/, '').trim() : '';

          // Apply inline formatting to list items
          itemText = itemText.replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold text-foreground">$1</strong>'
          );
          itemText = itemText.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
          itemText = itemText.replace(
            /`([^`]+)`/g,
            '<code class="bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-zinc-300">$1</code>'
          );
          itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
            const isInternal = href.startsWith('/') || !href.match(/^https?:\/\//);
            const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
            return `<a href="${href}" class="text-primary hover:underline transition-colors"${target}>${text}</a>`;
          });

          processedLines.push(`<li class="text-muted-foreground leading-relaxed">${itemText}</li>`);
        } else if (line?.trim()) {
          // Process regular content line

          // Headers with anchor IDs
          if (line.startsWith('### ')) {
            const headerText = line.replace('### ', '');
            const id = headerText
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            processedLines.push(
              `<h3 id="${id}" class="text-xl font-semibold mt-6 mb-3 scroll-mt-16">${headerText}</h3>`
            );
          } else if (line.startsWith('## ')) {
            const headerText = line.replace('## ', '');
            const id = headerText
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            processedLines.push(
              `<h2 id="${id}" class="text-2xl font-bold mt-8 mb-4 scroll-mt-16">${headerText}</h2>`
            );
          } else if (line.startsWith('# ')) {
            const headerText = line.replace('# ', '');
            const id = headerText
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            processedLines.push(
              `<h1 id="${id}" class="text-3xl font-bold mt-8 mb-6 scroll-mt-16">${headerText}</h1>`
            );
          } else {
            // Regular paragraph - apply inline formatting

            // Bold and italic
            line = line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-semibold text-foreground">$1</strong>'
            );
            line = line.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

            // Inline code
            line = line.replace(
              /`([^`]+)`/g,
              '<code class="bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-zinc-300">$1</code>'
            );

            // Links
            line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
              const isInternal = href.startsWith('/') || !href.match(/^https?:\/\//);
              const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
              return `<a href="${href}" class="text-primary hover:underline transition-colors"${target}>${text}</a>`;
            });

            processedLines.push(
              `<p class="text-muted-foreground leading-relaxed mb-4">${line}</p>`
            );
          }
        } else {
          // Empty line
          processedLines.push('');
        }
      }

      // Close any remaining open list
      if (inList) {
        processedLines.push(`</${listType}>`);
      }

      // Close any remaining open code block
      if (inCodeBlock) {
        const codeContent = codeLines.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        processedLines.push(
          `<pre class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto my-6"><code class="text-sm font-mono text-zinc-300 block">${codeContent}</code></pre>`
        );
      }

      containerRef.current.innerHTML = processedLines.join('\n');
    }
  }, [content]);

  return <div ref={containerRef} className={`prose prose-invert max-w-none ${className}`} />;
}
