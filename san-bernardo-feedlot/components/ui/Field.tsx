import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide text-earth-700/70 mb-1.5">{children}</label>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-earth-700/15 bg-white px-3.5 py-2.5 text-earth-950 text-[15px]',
        'placeholder:text-earth-700/40 focus:border-corn-500 focus:ring-2 focus:ring-corn-500/20 outline-none transition',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-earth-700/15 bg-white px-3.5 py-2.5 text-earth-950 text-[15px]',
        'focus:border-corn-500 focus:ring-2 focus:ring-corn-500/20 outline-none transition appearance-none',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-1', className)}>{children}</div>;
}
