'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Field';
import { LecturaBotones } from './LecturaBotones';
import { TablaMH } from './TablaMH';
import { ConfirmAjuste } from './ConfirmAjuste';
import {
  calcularConsumoMSTotal,
  calcularConsumoMSporAnimal,
  calcularDetalleMH,
  totalMH,
  aplicarAjusteSobra,
  aplicarAjusteFalta,
} from '@/lib/nutricion';
import {
  asignarDieta,
  obtenerLecturaHoy,
  obtenerLecturaAyer,
  registrarLectura,
  actualizarConsumoObjetivo,
  guardarHistorialDiario,
} from '@/lib/services/corrales';
import { formatDecimal, formatFecha, formatKg } from '@/lib/utils';
import type { CorralConDieta, DietaCompleta, LecturaTipo } from '@/types/database';

export function CorralCard({
  corral,
  dietas,
  onCambio,
}: {
  corral: CorralConDieta;
  dietas: DietaCompleta[];
  onCambio: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [lecturaHoy, setLecturaHoy] = useState<LecturaTipo | null>(null);
  const [cargandoLectura, setCargandoLectura] = useState(true);
  const [confirmando, setConfirmando] = useState<null | { tipo: 'SOBRA' | 'FALTA'; nuevoPct: number; mensaje: string }>(null);
  const [consumoLocal, setConsumoLocal] = useState(corral.consumo_objetivo_pct);
  const [asignando, setAsignando] = useState(false);

  useEffect(() => {
    setConsumoLocal(corral.consumo_objetivo_pct);
  }, [corral.consumo_objetivo_pct]);

  useEffect(() => {
    (async () => {
      setCargandoLectura(true);
      const l = await obtenerLecturaHoy(corral.id);
      setLecturaHoy(l?.lectura ?? null);
      setCargandoLectura(false);
    })();
  }, [corral.id]);

  const dietaCompleta = useMemo(
    () => dietas.find((d) => d.id === corral.dieta_id),
    [dietas, corral.dieta_id]
  );

  const consumoPorAnimal = calcularConsumoMSporAnimal(corral.peso_promedio_kg, consumoLocal);
  const consumoTotalMS = calcularConsumoMSTotal(corral.peso_promedio_kg, consumoLocal, corral.cantidad_animales);
  const detalleMH = dietaCompleta ? calcularDetalleMH(consumoTotalMS, dietaCompleta.ingredientes) : [];
  const total = totalMH(detalleMH);

  async function handleAsignarDieta(dietaId: string) {
    setAsignando(true);
    try {
      await asignarDieta(corral.id, dietaId);
      onCambio();
    } finally {
      setAsignando(false);
    }
  }

  async function persistirHistorial(pct: number) {
    if (!dietaCompleta) return;
    const msTotal = calcularConsumoMSTotal(corral.peso_promedio_kg, pct, corral.cantidad_animales);
    const detalle = calcularDetalleMH(msTotal, dietaCompleta.ingredientes);
    await guardarHistorialDiario({
      corral_id: corral.id,
      dieta_id: corral.dieta_id,
      cantidad_animales: corral.cantidad_animales,
      peso_promedio_kg: corral.peso_promedio_kg,
      consumo_objetivo_pct: pct,
      consumo_ms_total_kg: msTotal,
      detalle_mh: detalle,
    });
  }

  async function handleLectura(tipo: LecturaTipo) {
    setLecturaHoy(tipo);

    if (tipo === 'JUSTO') {
      await registrarLectura(corral.id, 'JUSTO', consumoLocal);
      await persistirHistorial(consumoLocal);
      return;
    }

    if (tipo === 'SOBRA') {
      const nuevoPct = aplicarAjusteSobra(consumoLocal);
      setConfirmando({ tipo: 'SOBRA', nuevoPct, mensaje: '¿Desea reducir el consumo un 5%?' });
      return;
    }

    if (tipo === 'FALTA') {
      const ayer = await obtenerLecturaAyer(corral.id);
      if (ayer?.lectura === 'FALTA') {
        const nuevoPct = aplicarAjusteFalta(consumoLocal);
        setConfirmando({
          tipo: 'FALTA',
          nuevoPct,
          mensaje: 'Se detectaron dos faltas consecutivas.\n¿Desea aumentar el consumo un 5%?',
        });
      } else {
        await registrarLectura(corral.id, 'FALTA', consumoLocal);
        await persistirHistorial(consumoLocal);
      }
    }
  }

  async function confirmarAjuste() {
    if (!confirmando) return;
    const { tipo, nuevoPct } = confirmando;
    await actualizarConsumoObjetivo(corral.id, nuevoPct);
    await registrarLectura(corral.id, tipo, consumoLocal, nuevoPct);
    setConsumoLocal(nuevoPct);
    await persistirHistorial(nuevoPct);
    setConfirmando(null);
    onCambio();
  }

  async function cancelarAjuste() {
    if (!confirmando) return;
    await registrarLectura(corral.id, confirmando.tipo, consumoLocal, null);
    await persistirHistorial(consumoLocal);
    setConfirmando(null);
  }

  return (
    <>
      <Card className="overflow-hidden">
        <button
          className="w-full text-left"
          onClick={() => setExpandido((v) => !v)}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-earth-950">{corral.nombre}</h3>
                <p className="text-xs text-earth-700/50 mt-0.5">Ingreso {formatFecha(corral.fecha_ingreso)}</p>
              </div>
              <span className="text-earth-700/30 text-xl">{expandido ? '−' : '+'}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniDato label="Animales" valor={String(corral.cantidad_animales)} />
              <MiniDato label="Peso prom." valor={`${formatDecimal(corral.peso_promedio_kg, 0)} kg`} />
              <MiniDato label="Origen" valor={corral.origen || '—'} />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wide text-earth-700/40 font-semibold">Consumo objetivo</span>
              <span className="text-corn-600 font-display font-bold">{formatDecimal(consumoLocal, 2)}% PV</span>
            </div>
          </CardContent>
        </button>

        {expandido && (
          <div className="px-5 pb-5 space-y-4 border-t border-earth-700/10 pt-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-earth-700/70 mb-1.5">
                Dieta asignada
              </label>
              <Select
                value={corral.dieta_id ?? ''}
                onChange={(e) => handleAsignarDieta(e.target.value)}
                disabled={asignando}
              >
                <option value="" disabled>
                  Seleccionar dieta…
                </option>
                {dietas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </Select>
            </div>

            {dietaCompleta ? (
              <>
                <div className="bg-cream-dim rounded-xl p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-earth-700/40">MS por animal</p>
                    <p className="font-display font-semibold text-earth-950">{formatDecimal(consumoPorAnimal, 2)} kg</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-earth-700/40">MS total corral</p>
                    <p className="font-display font-semibold text-earth-950">{formatKg(consumoTotalMS)} kg</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-earth-700/70 mb-2">
                    Carga del mixer — Materia Húmeda
                  </p>
                  <TablaMH detalle={detalleMH} total={total} />
                </div>
              </>
            ) : (
              <p className="text-sm text-earth-700/50 bg-cream-dim rounded-xl px-4 py-3">
                Asigná una dieta para ver los kilos a cargar.
              </p>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-earth-700/70 mb-2">
                Lectura de comedero de hoy
              </p>
              {!cargandoLectura && (
                <LecturaBotones seleccion={lecturaHoy} onSeleccionar={handleLectura} />
              )}
            </div>
          </div>
        )}
      </Card>

      {confirmando && (
        <ConfirmAjuste
          mensaje={confirmando.mensaje}
          consumoActual={consumoLocal}
          consumoNuevo={confirmando.nuevoPct}
          onConfirmar={confirmarAjuste}
          onCancelar={cancelarAjuste}
        />
      )}
    </>
  );
}

function MiniDato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-earth-700/40">{label}</p>
      <p className="font-medium text-earth-900 text-sm truncate">{valor}</p>
    </div>
  );
}
