'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard-utils';

type CopyButtonProps = {
  text: string;
  label?: string;
  variant?: 'outline' | 'default' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
};

export function CopyButton({
  text,
  label = 'Copy',
  variant = 'outline',
  size = 'default',
  className = '',
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast({
        title: 'Failed to copy',
        description: 'Please try again or copy manually',
      });
    }
  };

  return (
    <Button onClick={handleCopy} variant={variant} size={size} className={className}>
      {isCopied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
