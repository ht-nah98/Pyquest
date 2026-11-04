import type { ButtonHTMLAttributes } from 'react';

type Tone = 'brand' | 'go' | 'sun' | 'plain' | 'oops';

const TONES: Record<Tone, string> = {
  brand: 'bg-brand text-white',
  go: 'bg-go text-white',
  sun: 'bg-sun text-ink',
  plain: 'bg-paper text-ink',
  oops: 'bg-oops text-white',
};

/** One button for the whole app. min-h-11 keeps every target finger-sized on iPad (≥ 44 px). */
export function Button({
  tone = 'plain',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border-2 border-ink px-4 font-display text-[17px] font-extrabold shadow-hard transition-transform active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone]} ${className}`}
      {...rest}
    />
  );
}
