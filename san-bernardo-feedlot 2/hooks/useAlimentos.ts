'use client';

import { useCallback, useEffect, useState } from 'react';
import { listarAlimentos } from '@/lib/services/alimentos';
import type { Alimento } from '@/types/database';

export function useAlimentos() {
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarAlimentos();
      setAlimentos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar alimentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { alimentos, loading, error, recargar };
}
