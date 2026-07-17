'use client';

import { useMemo } from 'react';
import { useCorrales } from './useCorrales';
import { useDietas } from './useDietas';
import { calcularConsumoMSTotal, calcularDetalleMH, totalMH } from '@/lib/nutricion';
import { useEffect, useState } from 'react';
import { obtenerLecturaHoy } from '@/lib/services/corrales';
import type { LecturaTipo } from '@/types/database';

export function useDashboard() {
  const { corrales, loading: loadingCorrales, error: errorCorrales, recargar } = useCorrales();
  const { dietas, loading: loadingDietas } = useDietas();
  const [lecturas, setLecturas] = useState<Record<string, LecturaTipo | null>>({});
  const [loadingLecturas, setLoadingLecturas] = useState(true);

  useEffect(() => {
    if (corrales.length === 0) {
      setLoadingLecturas(false);
      return;
    }
    (async () => {
      setLoadingLecturas(true);
      const entries = await Promise.all(
        corrales.map(async (c) => {
          const l = await obtenerLecturaHoy(c.id);
          return [c.id, l?.lectura ?? null] as const;
        })
      );
      setLecturas(Object.fromEntries(entries));
      setLoadingLecturas(false);
    })();
  }, [corrales]);

  const resumen = useMemo(() => {
    let totalAnimales = 0;
    let totalMS = 0;
    let totalMHHoy = 0;
    let faltas = 0;
    let sobras = 0;
    let justos = 0;
    let sinLectura = 0;

    for (const c of corrales) {
      totalAnimales += c.cantidad_animales;
      const ms = calcularConsumoMSTotal(c.peso_promedio_kg, c.consumo_objetivo_pct, c.cantidad_animales);
      totalMS += ms;

      const dieta = dietas.find((d) => d.id === c.dieta_id);
      if (dieta) {
        const detalle = calcularDetalleMH(ms, dieta.ingredientes);
        totalMHHoy += totalMH(detalle);
      }

      const lectura = lecturas[c.id];
      if (lectura === 'FALTA') faltas += 1;
      else if (lectura === 'SOBRA') sobras += 1;
      else if (lectura === 'JUSTO') justos += 1;
      else sinLectura += 1;
    }

    return {
      cantidadCorrales: corrales.length,
      totalAnimales,
      totalMS: Math.round(totalMS * 100) / 100,
      totalMHHoy: Math.round(totalMHHoy * 100) / 100,
      faltas,
      sobras,
      justos,
      sinLectura,
    };
  }, [corrales, dietas, lecturas]);

  return {
    resumen,
    corrales,
    loading: loadingCorrales || loadingDietas || loadingLecturas,
    error: errorCorrales,
    recargar,
  };
}
