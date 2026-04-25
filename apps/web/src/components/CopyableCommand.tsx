'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  command: string;
  className?: string;
}

export function CopyableCommand({ command, className }: Props) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard might be unavailable in iframes — silently ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-3 rounded-md border border-border bg-bg px-4 py-2.5 font-mono text-sm shadow-sm hover:border-fg/50',
        className,
      )}
    >
      <span className="text-muted">$</span>
      <code className="text-fg">{command}</code>
      <span className="text-xs text-muted group-hover:text-fg">{copied ? '복사됨' : '복사'}</span>
    </button>
  );
}
