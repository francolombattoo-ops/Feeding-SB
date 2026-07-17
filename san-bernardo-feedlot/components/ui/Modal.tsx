'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-earth-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative bg-cream w-full md:w-auto md:min-w-[480px] rounded-t-card md:rounded-card shadow-card-lg',
          'max-h-[90vh] overflow-y-auto',
          wide && 'md:min-w-[640px]'
        )}
      >
        <div className="sticky top-0 bg-cream/95 backdrop-blur px-5 py-4 border-b border-earth-700/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-earth-950">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full grid place-items-center hover:bg-earth-950/5 text-earth-700"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
