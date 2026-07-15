'use client';

import { useCallback, useEffect, useState } from 'react';
import { listarDietasCompletas } from '@/lib/services/dietas';
import type { DietaCompleta } from '@/types/database';

export function useDietas() {
  const [dietas, setDietas] = useState<DietaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarDietasCompletas();
      setDietas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar dietas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { dietas, loading, error, recargar };
}
