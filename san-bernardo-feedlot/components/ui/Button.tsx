import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-earth-950 text-cream hover:bg-earth-900 active:bg-earth-800',
  secondary: 'bg-corn-100 text-corn-600 hover:bg-corn-100/70 border border-corn-500/30',
  ghost: 'bg-transparent text-earth-950 hover:bg-earth-950/5',
  danger: 'bg-bad-100 text-bad-600 hover:bg-bad-100/70 border border-bad-600/20',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3.5 rounded-xl font-semibold',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
