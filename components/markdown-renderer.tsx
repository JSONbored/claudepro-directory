'use client';

import { useEffect, useRef } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Process the markdown content
    if (containerRef.current) {
      const processedContent = parseMarkdown(content);
      containerRef.current.innerHTML = processedContent;
    }
  }, [content]);

  return <div ref={containerRef} className={`prose prose-invert max-w-none ${className}`} />;
}

function parseMarkdown(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>');

  // Bold and italic (handle ** before * to avoid conflicts)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold italic">$1</strong>');
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-foreground">$1</strong>'
  );
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<em class="italic">$1</em>');

  // Links - handle internal vs external links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    // Check if it's an internal link (starts with / or is a relative path)
    const isInternal = url.startsWith('/') || !url.match(/^https?:\/\//);

    if (isInternal) {
      // Internal link - don't open in new tab
      return `<a href="${url}" class="text-primary hover:underline transition-colors">${text}</a>`;
    } else {
      // External link - open in new tab
      return `<a href="${url}" class="text-primary hover:underline transition-colors" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  });

  // Code blocks with language support
  html = html.replace(/```([a-z]*)?\n([\s\S]*?)```/g, (_match, _lang, code) => {
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    return `<pre class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto my-6"><code class="text-sm font-mono text-zinc-300 block">${escapedCode}</code></pre>`;
  });

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-zinc-300">$1</code>'
  );

  // Process lists - handle both ordered and unordered
  const lines = html.split('\n');
  const processedLines = [];
  let currentListType = null; // 'ul' or 'ol'
  const _lastIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unorderedMatch = line.match(/^(\s*)[-*] (.+)$/);
    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

    if (unorderedMatch) {
      const indent = unorderedMatch[1].length;
      const content = unorderedMatch[2];

      if (currentListType !== 'ul') {
        if (currentListType === 'ol') processedLines.push('</ol>');
        processedLines.push('<ul class="list-disc list-inside space-y-2 my-4 ml-4">');
        currentListType = 'ul';
      }

      processedLines.push(
        `<li class="text-muted-foreground leading-relaxed" style="margin-left: ${indent * 20}px">${content}</li>`
      );
    } else if (orderedMatch) {
      const indent = orderedMatch[1].length;
      const content = orderedMatch[3];

      if (currentListType !== 'ol') {
        if (currentListType === 'ul') processedLines.push('</ul>');
        processedLines.push('<ol class="list-decimal list-inside space-y-2 my-4 ml-4">');
        currentListType = 'ol';
      }

      processedLines.push(
        `<li class="text-muted-foreground leading-relaxed" style="margin-left: ${indent * 20}px">${content}</li>`
      );
    } else {
      // Close list if we hit an empty line or non-list content
      if (currentListType && (line.trim() === '' || !line.match(/^\s/))) {
        processedLines.push(currentListType === 'ul' ? '</ul>' : '</ol>');
        currentListType = null;
      }
      processedLines.push(line);
    }
  }

  // Close any open list at the end
  if (currentListType) {
    processedLines.push(currentListType === 'ul' ? '</ul>' : '</ol>');
  }

  html = processedLines.join('\n');

  // Tables
  const tableRegex = /\|(.+)\|\n\|([-:\s|]+)\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (_match, headers, _separator, rows) => {
    const headerCells = headers
      .split('|')
      .filter(Boolean)
      .map(
        (h: string) =>
          `<th class="border border-border px-4 py-2 text-left font-semibold">${h.trim()}</th>`
      )
      .join('');

    const rowsHtml = rows
      .trim()
      .split('\n')
      .map((row: string) => {
        const cells = row
          .split('|')
          .filter(Boolean)
          .map((cell: string) => `<td class="border border-border px-4 py-2">${cell.trim()}</td>`)
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
      <div class="overflow-x-auto my-6">
        <table class="w-full border-collapse">
          <thead class="bg-muted/30">
            <tr>${headerCells}</tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  });

  // Paragraphs - wrap content not already in tags
  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (trimmed && !trimmed.startsWith('<') && !trimmed.startsWith('#')) {
        return `<p class="text-muted-foreground leading-relaxed mb-4">${trimmed}</p>`;
      }
      return trimmed;
    })
    .join('\n');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-8 border-border">');

  return html;
}
