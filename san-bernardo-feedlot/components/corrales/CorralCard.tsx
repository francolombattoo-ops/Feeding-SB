'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { LecturaBotones } from './LecturaBotones';
import { TablaMH } from './TablaMH';
import { ConfirmAjuste } from './ConfirmAjuste';
import { AjusteManualDialog } from './AjusteManualDialog';
import { ResumenDiasAnteriores } from './ResumenDiasAnteriores';
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
  registrarLectura,
  actualizarConsumoObjetivo,
} from '@/lib/services/corrales';
import {
  obtenerResumenDiasAnteriores,
  obtenerLecturaAyerContexto,
  registrarAjusteConsumo,
} from '@/lib/services/historial';
import { formatDecimal, formatFecha, formatKg } from '@/lib/utils';
import type { CorralConDieta, DietaCompleta, LecturaTipo, ResumenDiaAnterior, AjusteDireccion } from '@/types/database';

export function CorralCard({
  corral,
  dietas,
  seleccionado,
  onToggleSeleccion,
  onCambio,
}: {
  corral: CorralConDieta;
  dietas: DietaCompleta[];
  seleccionado: boolean;
  onToggleSeleccion: (corralId: string) => void;
  onCambio: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [lecturaHoy, setLecturaHoy] = useState<LecturaTipo | null>(null);
  const [cargandoLectura, setCargandoLectura] = useState(true);
  const [confirmando, setConfirmando] = useState<null | {
    tipo: 'SOBRA' | 'FALTA';
    nuevoPct: number;
    mensaje: string;
    lecturaAyer?: LecturaTipo | null;
  }>(null);
  const [ajusteManual, setAjusteManual] = useState<AjusteDireccion | null>(null);
  const [consumoLocal, setConsumoLocal] = useState(corral.consumo_objetivo_pct);
  const [asignando, setAsignando] = useState(false);
  const [resumenDias, setResumenDias] = useState<ResumenDiaAnterior[]>([]);

  useEffect(() => {
    setConsumoLocal(corral.consumo_objetivo_pct);
  }, [corral.consumo_objetivo_pct]);

  useEffect(() => {
    (async () => {
      setCargandoLectura(true);
      const [l, resumen] = await Promise.all([
        obtenerLecturaHoy(corral.id),
        obtenerResumenDiasAnteriores(corral.id),
      ]);
      setLecturaHoy(l?.lectura ?? null);
      setResumenDias(resumen);
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

  // Nota v2: ya no se persiste automáticamente en cada lectura — el registro
  // definitivo del día ("foto") se crea al confirmar la entrega desde el
  // panel de Preparación del mixer. Acá solo se guarda la lectura y, si
  // corresponde, el ajuste de consumo.

  async function handleLectura(tipo: LecturaTipo) {
    setLecturaHoy(tipo);

    if (tipo === 'JUSTO') {
      await registrarLectura(corral.id, 'JUSTO', consumoLocal);
      return;
    }

    if (tipo === 'SOBRA') {
      const nuevoPct = aplicarAjusteSobra(consumoLocal);
      setConfirmando({ tipo: 'SOBRA', nuevoPct, mensaje: '¿Desea reducir el consumo un 5%?' });
      return;
    }

    if (tipo === 'FALTA') {
      // Punto 3: siempre mostrar contexto de ayer y siempre preguntar, nunca automático.
      const lecturaAyer = await obtenerLecturaAyerContexto(corral.id);
      const nuevoPct = aplicarAjusteFalta(consumoLocal);
      setConfirmando({
        tipo: 'FALTA',
        nuevoPct,
        mensaje: '¿Desea aumentar el consumo un 5%?',
        lecturaAyer,
      });
    }
  }

  async function confirmarAjusteLectura() {
    if (!confirmando) return;
    const { tipo, nuevoPct } = confirmando;
    await actualizarConsumoObjetivo(corral.id, nuevoPct);
    await registrarLectura(corral.id, tipo, consumoLocal, nuevoPct);
    await registrarAjusteConsumo({
      corral_id: corral.id,
      origen: tipo === 'SOBRA' ? 'LECTURA_SOBRA' : 'LECTURA_FALTA',
      porcentaje_ajuste: 5,
      direccion: tipo === 'SOBRA' ? 'REDUCCION' : 'AUMENTO',
      consumo_anterior_pct: consumoLocal,
      consumo_nuevo_pct: nuevoPct,
    });
    setConsumoLocal(nuevoPct);
    setConfirmando(null);
    onCambio();
  }

  async function cancelarAjusteLectura() {
    if (!confirmando) return;
    await registrarLectura(corral.id, confirmando.tipo, consumoLocal, null);
    setConfirmando(null);
  }

  async function confirmarAjusteManual(porcentaje: number, nuevoPct: number) {
    if (!ajusteManual) return;
    await actualizarConsumoObjetivo(corral.id, nuevoPct);
    await registrarAjusteConsumo({
      corral_id: corral.id,
      origen: 'MANUAL',
      porcentaje_ajuste: porcentaje,
      direccion: ajusteManual,
      consumo_anterior_pct: consumoLocal,
      consumo_nuevo_pct: nuevoPct,
    });
    setConsumoLocal(nuevoPct);
    setAjusteManual(null);
    onCambio();
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-start gap-1 p-5 pb-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSeleccion(corral.id);
            }}
            aria-label={seleccionado ? 'Quitar de la carga del mixer' : 'Agregar a la carga del mixer'}
            className={`w-6 h-6 rounded-md border-2 shrink-0 mt-0.5 grid place-items-center transition-colors ${
              seleccionado ? 'bg-corn-500 border-corn-500 text-earth-950' : 'border-earth-700/25 text-transparent'
            }`}
          >
            ✓
          </button>
          <button className="flex-1 text-left" onClick={() => setExpandido((v) => !v)}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-earth-950">{corral.nombre}</h3>
                <p className="text-xs text-earth-700/50 mt-0.5">Ingreso {formatFecha(corral.fecha_ingreso)}</p>
              </div>
              <span className="text-earth-700/30 text-xl">{expandido ? '−' : '+'}</span>
            </div>
          </button>
        </div>

        <button className="w-full text-left" onClick={() => setExpandido((v) => !v)}>
          <CardContent className="pt-3">
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

            {/* Ajuste manual — punto 4 */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-earth-700/70 mb-1.5">
                Ajuste manual de consumo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setAjusteManual('REDUCCION')}>
                  ➖ Reducir consumo
                </Button>
                <Button variant="secondary" onClick={() => setAjusteManual('AUMENTO')}>
                  ➕ Aumentar consumo
                </Button>
              </div>
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

            {/* Resumen de ayer / anteayer — punto 2 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-earth-700/70 mb-2">
                Últimos días
              </p>
              {!cargandoLectura && <ResumenDiasAnteriores resumen={resumenDias} />}
            </div>

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
          lecturaAyer={confirmando.tipo === 'FALTA' ? confirmando.lecturaAyer : undefined}
          onConfirmar={confirmarAjusteLectura}
          onCancelar={cancelarAjusteLectura}
        />
      )}

      {ajusteManual && (
        <AjusteManualDialog
          direccion={ajusteManual}
          consumoActual={consumoLocal}
          onConfirmar={confirmarAjusteManual}
          onCancelar={() => setAjusteManual(null)}
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
