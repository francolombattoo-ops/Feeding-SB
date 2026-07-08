'use client';

import { cn } from '@/lib/utils';
import type { LecturaTipo } from '@/types/database';

const OPCIONES: { tipo: LecturaTipo; label: string; activoClass: string }[] = [
  { tipo: 'FALTA', label: 'Falta', activoClass: 'bg-bad-600 text-white border-bad-600' },
  { tipo: 'JUSTO', label: 'Justo', activoClass: 'bg-good-600 text-white border-good-600' },
  { tipo: 'SOBRA', label: 'Sobra', activoClass: 'bg-over-600 text-white border-over-600' },
];

export function LecturaBotones({
  seleccion,
  onSeleccionar,
  disabled,
}: {
  seleccion: LecturaTipo | null;
  onSeleccionar: (tipo: LecturaTipo) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPCIONES.map((op) => {
        const activo = seleccion === op.tipo;
        return (
          <button
            key={op.tipo}
            type="button"
            disabled={disabled}
            onClick={() => onSeleccionar(op.tipo)}
            className={cn(
              'py-3 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50',
              activo ? op.activoClass : 'bg-white text-earth-700/70 border-earth-700/15 hover:bg-earth-950/5'
            )}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
