'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TablaMH } from './TablaMH';
import { calcularMixer, calcularConsumoMSTotal, calcularDetalleMH, totalMH, type CorralParaMixer } from '@/lib/nutricion';
import { confirmarEntrega } from '@/lib/services/historial';
import { obtenerLecturaHoy } from '@/lib/services/corrales';
import { formatKg } from '@/lib/utils';
import type { CorralConDieta, DietaCompleta } from '@/types/database';

export function PanelMixer({
  corralesSeleccionados,
  dietas,
  onLimpiarSeleccion,
  onEntregaConfirmada,
}: {
  corralesSeleccionados: CorralConDieta[];
  dietas: DietaCompleta[];
  onLimpiarSeleccion: () => void;
  onEntregaConfirmada: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const corralesParaCalculo: CorralParaMixer[] = useMemo(
    () =>
      corralesSeleccionados.map((c) => ({
        corralId: c.id,
        corralNombre: c.nombre,
        dietaId: c.dieta_id,
        dietaNombre: c.dieta?.nombre ?? null,
        pesoPromedioKg: c.peso_promedio_kg,
        cantidadAnimales: c.cantidad_animales,
        consumoObjetivoPct: c.consumo_objetivo_pct,
      })),
    [corralesSeleccionados]
  );

  const dietasParaCalculo = useMemo(
    () => dietas.map((d) => ({ id: d.id, ingredientes: d.ingredientes, capacidad_maxima_mh: d.capacidad_maxima_mh })),
    [dietas]
  );

  const resultado = useMemo(
    () => calcularMixer(corralesParaCalculo, dietasParaCalculo),
    [corralesParaCalculo, dietasParaCalculo]
  );

  if (corralesSeleccionados.length === 0) return null;

  async function handleConfirmarEntrega() {
    if (!resultado.valido) return;
    setConfirmando(true);
    setError(null);
    try {
      await Promise.all(
        corralesSeleccionados.map(async (corral) => {
          const dieta = dietas.find((d) => d.id === corral.dieta_id);
          if (!dieta) return;
          const consumoMsTotal = calcularConsumoMSTotal(corral.peso_promedio_kg, corral.consumo_objetivo_pct, corral.cantidad_animales);
          const detalle = calcularDetalleMH(consumoMsTotal, dieta.ingredientes);
          const lectura = await obtenerLecturaHoy(corral.id);

          await confirmarEntrega({
            corral_id: corral.id,
            cantidad_animales: corral.cantidad_animales,
            peso_promedio_kg: corral.peso_promedio_kg,
            dieta_id: dieta.id,
            dieta_nombre: dieta.nombre,
            consumo_objetivo_pct: corral.consumo_objetivo_pct,
            consumo_ms_total_kg: consumoMsTotal,
            detalle_mh: detalle,
            total_mh_kg: totalMH(detalle),
            lectura_comedero: lectura?.lectura ?? null,
          });
        })
      );
      setConfirmado(true);
      setTimeout(() => {
        setConfirmado(false);
        onEntregaConfirmada();
        onLimpiarSeleccion();
      }, 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al confirmar la entrega');
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="fixed bottom-16 md:bottom-4 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
      <div className="w-full max-w-2xl bg-earth-950 rounded-card shadow-card-lg pointer-events-auto overflow-hidden">
        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-corn-500 text-xs font-semibold uppercase tracking-wide">Preparación del mixer</p>
              <p className="text-cream font-display font-semibold">
                {corralesSeleccionados.length} corral{corralesSeleccionados.length !== 1 ? 'es' : ''} seleccionado
                {corralesSeleccionados.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onLimpiarSeleccion}
              className="text-cream/50 hover:text-cream text-sm px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Limpiar
            </button>
          </div>

          {!resultado.valido ? (
            <p className="text-sm text-bad-100 bg-bad-600/20 border border-bad-600/30 rounded-xl px-4 py-3">
              {resultado.motivoInvalido}
            </p>
          ) : (
            <>
              <div className="bg-white rounded-xl overflow-hidden mb-3 max-h-56 overflow-y-auto">
                <TablaMH detalle={resultado.detalleAgregado} total={resultado.totalMhKg} />
              </div>

              {resultado.excedeCapacidad && (
                <p className="text-sm text-corn-100 bg-corn-600/20 border border-corn-500/40 rounded-xl px-4 py-3 mb-3">
                  ⚠️ Advertencia: la carga ({formatKg(resultado.totalMhKg)} kg) supera la capacidad recomendada del
                  mixer para "{resultado.dietaNombre}" ({formatKg(resultado.capacidadMaximaMh ?? 0)} kg).
                </p>
              )}

              {error && (
                <p className="text-sm text-bad-100 bg-bad-600/20 border border-bad-600/30 rounded-xl px-4 py-3 mb-3">
                  {error}
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleConfirmarEntrega}
                disabled={confirmando || confirmado}
              >
                {confirmado ? '✓ Entrega confirmada' : confirmando ? 'Confirmando…' : 'CONFIRMAR ENTREGA'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
