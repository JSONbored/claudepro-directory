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

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold italic">$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

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

  // Code blocks
  html = html.replace(
    /```(.*?)\n([\s\S]*?)```/g,
    '<pre class="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm font-mono">$2</code></pre>'
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted/50 px-2 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Lists - handle nested structure properly
  const _listPattern = /^(\s*)[-*] (.+)$/gm;
  const lines = html.split('\n');
  let inList = false;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^(\s*)[-*] (.+)$/);

    if (listMatch) {
      if (!inList) {
        processedLines.push('<ul class="list-disc list-inside space-y-2 my-4 ml-4">');
        inList = true;
      }
      const indent = listMatch[1].length;
      const content = listMatch[2];
      processedLines.push(
        `<li class="text-muted-foreground" style="margin-left: ${indent * 20}px">${content}</li>`
      );
    } else {
      if (inList && line.trim() === '') {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
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
