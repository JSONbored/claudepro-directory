import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('yaml', yaml);

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodeHighlightProps {
  code: string;
  language?: string;
  title?: string;
  showCopy?: boolean;
}

export const CodeHighlight = ({
  code,
  language = 'typescript',
  title,
  showCopy = true,
}: CodeHighlightProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const customStyle = {
    ...oneDark,
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      background: 'hsl(var(--card))',
      color: 'hsl(var(--foreground))',
    },
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '0.5rem',
      margin: 0,
    },
    '.token.comment': {
      color: 'hsl(var(--muted-foreground))',
    },
    '.token.string': {
      color: 'hsl(var(--primary))',
    },
    '.token.keyword': {
      color: '#ff8c00', // Claude orange
    },
    '.token.function': {
      color: '#00bcd4',
    },
    '.token.number': {
      color: '#4caf50',
    },
  };

  return (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between bg-card/50 border-x border-t border-border rounded-t-lg px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {showCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
      )}

      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          customStyle={{
            borderTopLeftRadius: title ? 0 : '0.5rem',
            borderTopRightRadius: title ? 0 : '0.5rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          showLineNumbers
        >
          {code}
        </SyntaxHighlighter>

        {showCopy && !title && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};
