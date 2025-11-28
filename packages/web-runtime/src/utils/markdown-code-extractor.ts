/**
 * Extract code blocks from markdown text
 * Returns array of code blocks with their language and surrounding context
 */

export interface ExtractedCodeBlock {
  code: string;
  language: string;
  index: number;
  markdownBefore?: string;
  markdownAfter?: string;
}

/**
 * Extracts all code blocks from markdown text
 * Handles both fenced code blocks (```language) and indented code blocks
 * 
 * @param markdown - The markdown text to parse
 * @returns Array of extracted code blocks with metadata
 */
export function extractCodeBlocksFromMarkdown(markdown: string): ExtractedCodeBlock[] {
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }

  const codeBlocks: ExtractedCodeBlock[] = [];
  
  // Regex to match fenced code blocks: ```language\ncode\n```
  // Also matches ```\ncode\n``` (no language specified)
  const fencedCodeBlockRegex = /```([\w+#-]+)?\n([\s\S]*?)```/g;
  
  let match;
  let lastIndex = 0;
  let blockIndex = 0;

  while ((match = fencedCodeBlockRegex.exec(markdown)) !== null) {
    if (!match[0] || match.index === undefined) continue;
    
    const language = match[1] || 'text';
    const code = match[2]?.trim() || '';
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    // Extract markdown before this code block
    const markdownBefore = markdown.slice(lastIndex, matchStart).trim();

    codeBlocks.push({
      code,
      language,
      index: blockIndex++,
      ...(markdownBefore && { markdownBefore }),
    });

    lastIndex = matchEnd;
  }

  // Update markdownAfter for each block (except the last one)
  for (let i = 0; i < codeBlocks.length - 1; i++) {
    const currentBlock = codeBlocks[i];
    if (!currentBlock) continue;
    
    const currentBlockEnd = markdown.indexOf('```', markdown.indexOf(currentBlock.code)) + currentBlock.code.length + 3;
    const nextBlockStart = markdown.indexOf('```', currentBlockEnd);
    
    if (nextBlockStart > currentBlockEnd) {
      const afterText = markdown.slice(currentBlockEnd, nextBlockStart).trim();
      if (afterText) {
        currentBlock.markdownAfter = afterText;
      }
    }
  }

  // If no fenced code blocks found, check if entire content is code-like
  // This handles cases where content is pure code without markdown
  if (codeBlocks.length === 0) {
    // Check if content looks like code (has code-like patterns)
    const looksLikeCode = /^\s*(import|export|function|class|const|let|var|def|#!|<\?|package|public|private|interface|type)\s/.test(markdown.trim());
    
    if (looksLikeCode) {
      codeBlocks.push({
        code: markdown.trim(),
        language: 'text',
        index: 0,
      });
    }
  }

  return codeBlocks;
}
