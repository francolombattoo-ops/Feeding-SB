'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { formatDecimal } from '@/lib/utils';
import { aplicarAjusteManual } from '@/lib/nutricion';
import type { AjusteDireccion } from '@/types/database';

export function AjusteManualDialog({
  direccion,
  consumoActual,
  onConfirmar,
  onCancelar,
}: {
  direccion: AjusteDireccion;
  consumoActual: number;
  onConfirmar: (porcentaje: number, nuevoPct: number) => void;
  onCancelar: () => void;
}) {
  const [porcentaje, setPorcentaje] = useState('5');
  const valor = Number(porcentaje);
  const valido = valor > 0 && valor <= 100;
  const nuevoPct = valido ? aplicarAjusteManual(consumoActual, valor, direccion) : consumoActual;
  const esAumento = direccion === 'AUMENTO';

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-earth-950/50 backdrop-blur-[2px]" onClick={onCancelar} />
      <div className="relative bg-white w-full md:w-[420px] rounded-t-card md:rounded-card p-6 shadow-card-lg">
        <p className="font-display font-semibold text-lg text-earth-950 mb-1">
          {esAumento ? 'Aumentar consumo' : 'Reducir consumo'}
        </p>
        <p className="text-sm text-earth-700/60 mb-4">Ajuste manual sobre Materia Seca (MS)</p>

        <label className="block text-xs font-semibold uppercase tracking-wide text-earth-700/70 mb-1.5">
          Porcentaje a {esAumento ? 'aumentar' : 'reducir'}
        </label>
        <div className="relative mb-4">
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0.5"
            max="100"
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
            className="pr-8 text-lg font-display font-semibold"
            autoFocus
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-700/40">%</span>
        </div>

        <div className="flex items-center gap-3 mb-5 bg-cream-dim rounded-xl p-4 justify-center">
          <span className="font-display text-2xl font-bold text-earth-700/50">{formatDecimal(consumoActual, 2)}%</span>
          <span className="text-earth-700/40">→</span>
          <span className={`font-display text-2xl font-bold ${esAumento ? 'text-good-600' : 'text-over-600'}`}>
            {formatDecimal(nuevoPct, 2)}%
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button className="flex-1" disabled={!valido} onClick={() => onConfirmar(valor, nuevoPct)}>
            Confirmar ajuste
          </Button>
        </div>
      </div>
    </div>
  );
}
