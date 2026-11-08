import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-success text-on-color shadow-[0_3px_0_var(--color-success-dark)]',
  secondary: 'bg-surface text-text-body shadow-[inset_0_0_0_1px_var(--color-border)]',
  danger: 'bg-surface text-danger-dark shadow-[inset_0_0_0_1px_var(--color-danger-soft)]',
  ghost: 'bg-transparent text-text-body hover:bg-surface-subtle',
} as const;

const sizes = {
  md: 'min-h-10 px-4',
  sm: 'min-h-8 px-2.5 text-[13px]',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  variant,
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
