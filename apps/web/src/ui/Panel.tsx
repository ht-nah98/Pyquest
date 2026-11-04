import type { HTMLAttributes } from 'react';

export function Panel({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border-2 border-ink bg-paper shadow-hard ${className}`}
      {...rest}
    />
  );
}
