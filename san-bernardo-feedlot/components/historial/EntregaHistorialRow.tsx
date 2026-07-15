'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { TablaMH } from '@/components/corrales/TablaMH';
import { formatDecimal, formatFecha, formatKg } from '@/lib/utils';
import type { EntregaDiariaConCorral, LecturaTipo } from '@/types/database';

const ETIQUETAS_LECTURA: Record<LecturaTipo, { texto: string; clase: string }> = {
  FALTA: { texto: 'FALTA', clase: 'text-bad-600 bg-bad-100' },
  JUSTO: { texto: 'JUSTO', clase: 'text-good-600 bg-good-100' },
  SOBRA: { texto: 'SOBRA', clase: 'text-over-600 bg-over-100' },
};

export function EntregaHistorialRow({ entrega }: { entrega: EntregaDiariaConCorral }) {
  const [abierto, setAbierto] = useState(false);
  const lectura = entrega.lectura_comedero ? ETIQUETAS_LECTURA[entrega.lectura_comedero] : null;
  const hora = new Date(entrega.confirmado_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card>
      <button className="w-full text-left" onClick={() => setAbierto((v) => !v)}>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="text-center shrink-0 w-14">
              <p className="font-display font-bold text-earth-950 text-sm leading-tight">{formatFecha(entrega.fecha).slice(0, 5)}</p>
              <p className="text-[10px] text-earth-700/40">{hora}</p>
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-earth-950 truncate">{entrega.corral.nombre}</p>
              <p className="text-xs text-earth-700/60 truncate">{entrega.dieta_nombre} · {formatDecimal(entrega.consumo_objetivo_pct, 2)}% PV</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {lectura && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lectura.clase}`}>{lectura.texto}</span>
            )}
            <p className="font-display font-semibold text-earth-950 text-sm">{formatKg(entrega.total_mh_kg)} kg</p>
            <span className="text-earth-700/30">{abierto ? '−' : '+'}</span>
          </div>
        </CardContent>
      </button>

      {abierto && (
        <div className="px-4 pb-4 border-t border-earth-700/10 pt-3">
          <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-earth-700/40">Animales</p>
              <p className="font-medium text-earth-900">{entrega.cantidad_animales}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-earth-700/40">Peso prom.</p>
              <p className="font-medium text-earth-900">{formatDecimal(entrega.peso_promedio_kg, 0)} kg</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-earth-700/40">MS total</p>
              <p className="font-medium text-earth-900">{formatKg(entrega.consumo_ms_total_kg)} kg</p>
            </div>
          </div>
          <TablaMH detalle={entrega.detalle_mh} total={entrega.total_mh_kg} />
          <p className="text-[11px] text-earth-700/40 mt-2">Registrado por {entrega.usuario}</p>
        </div>
      )}
    </Card>
  );
}
