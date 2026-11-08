import type { HTMLAttributes } from 'react';

export const cardClassName = 'rounded-lg bg-surface p-6 shadow-[0_0_0_1px_var(--color-border-subtle)]';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`${cardClassName} ${className}`} {...props} />;
}
