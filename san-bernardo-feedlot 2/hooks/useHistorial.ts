'use client';

import { useCallback, useEffect, useState } from 'react';
import { listarHistorial, type FiltroHistorial } from '@/lib/services/historial';
import type { EntregaDiariaConCorral } from '@/types/database';

export function useHistorial(filtro: FiltroHistorial) {
  const [entregas, setEntregas] = useState<EntregaDiariaConCorral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarHistorial(filtro);
      setEntregas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro.fechaDesde, filtro.fechaHasta, filtro.corralId, filtro.dietaId, filtro.limite]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { entregas, loading, error, recargar };
}
