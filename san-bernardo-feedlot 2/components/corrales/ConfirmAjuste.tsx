'use client';

import { Button } from '@/components/ui/Button';
import { formatDecimal } from '@/lib/utils';
import type { LecturaTipo } from '@/types/database';

const ETIQUETAS: Record<LecturaTipo, string> = { FALTA: 'FALTA', JUSTO: 'JUSTO', SOBRA: 'SOBRA' };

export function ConfirmAjuste({
  mensaje,
  consumoActual,
  consumoNuevo,
  lecturaAyer,
  onConfirmar,
  onCancelar,
}: {
  mensaje: string;
  consumoActual: number;
  consumoNuevo: number;
  lecturaAyer?: LecturaTipo | null;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-earth-950/50 backdrop-blur-[2px]" onClick={onCancelar} />
      <div className="relative bg-white w-full md:w-[420px] rounded-t-card md:rounded-card p-6 shadow-card-lg">
        {lecturaAyer !== undefined && lecturaAyer !== null && (
          <p className="text-sm text-earth-700/60 mb-2">
            Lectura de ayer: <span className="font-semibold text-earth-900">{ETIQUETAS[lecturaAyer]}</span>
          </p>
        )}
        <p className="font-display font-semibold text-lg text-earth-950 mb-2 whitespace-pre-line">{mensaje}</p>
        <div className="flex items-center gap-3 my-4 bg-cream-dim rounded-xl p-4 justify-center">
          <span className="font-display text-2xl font-bold text-earth-700/50">{formatDecimal(consumoActual, 2)}%</span>
          <span className="text-earth-700/40">→</span>
          <span className="font-display text-2xl font-bold text-corn-600">{formatDecimal(consumoNuevo, 2)}%</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onCancelar}>
            No
          </Button>
          <Button className="flex-1" onClick={onConfirmar}>
            Sí, ajustar
          </Button>
        </div>
      </div>
    </div>
  );
}
