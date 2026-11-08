import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-success text-on-color shadow-[0_3px_0_var(--color-success-dark)]',
  secondary: 'bg-surface text-text-body shadow-[inset_0_0_0_1px_var(--color-border)]',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: keyof typeof variants;
}

export function Button({ variant, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md px-4 font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
