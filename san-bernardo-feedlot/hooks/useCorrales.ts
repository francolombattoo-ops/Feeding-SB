'use client';

import { useCallback, useEffect, useState } from 'react';
import { listarCorrales } from '@/lib/services/corrales';
import type { CorralConDieta } from '@/types/database';

export function useCorrales() {
  const [corrales, setCorrales] = useState<CorralConDieta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarCorrales();
      setCorrales(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar corrales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { corrales, loading, error, recargar };
}
