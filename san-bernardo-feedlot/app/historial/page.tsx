'use client';

import { useMemo, useState } from 'react';
import { useHistorial } from '@/hooks/useHistorial';
import { useCorrales } from '@/hooks/useCorrales';
import { useDietas } from '@/hooks/useDietas';
import { Card, CardContent } from '@/components/ui/Card';
import { FieldGroup, Input, Label, Select } from '@/components/ui/Field';
import { EntregaHistorialRow } from '@/components/historial/EntregaHistorialRow';
import type { FiltroHistorial } from '@/lib/services/historial';

export default function HistorialPage() {
  const { corrales } = useCorrales();
  const { dietas } = useDietas();

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [corralId, setCorralId] = useState('');
  const [dietaId, setDietaId] = useState('');

  const filtro: FiltroHistorial = useMemo(
    () => ({
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      corralId: corralId || undefined,
      dietaId: dietaId || undefined,
      limite: 200,
    }),
    [fechaDesde, fechaHasta, corralId, dietaId]
  );

  const { entregas, loading, error } = useHistorial(filtro);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-earth-950">Historial</h1>
        <p className="text-earth-700/60 text-sm mt-0.5">Registro inmutable de entregas confirmadas</p>
      </header>

      <Card className="mb-5">
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <FieldGroup>
            <Label>Desde</Label>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Hasta</Label>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Corral</Label>
            <Select value={corralId} onChange={(e) => setCorralId(e.target.value)}>
              <option value="">Todos</option>
              {corrales.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label>Dieta</Label>
            <Select value={dietaId} onChange={(e) => setDietaId(e.target.value)}>
              <option value="">Todas</option>
              {dietas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </CardContent>
      </Card>

      {loading && <EstadoCargando />}
      {error && <p className="text-bad-600 bg-bad-100 rounded-xl px-4 py-3">{error}</p>}

      {!loading && !error && entregas.length === 0 && (
        <Card className="py-14 text-center">
          <CardContent>
            <p className="text-4xl mb-3">📋</p>
            <p className="font-display font-semibold text-earth-950 mb-1">Sin entregas registradas</p>
            <p className="text-earth-700/60 text-sm">
              Las entregas aparecen acá una vez que confirmás la carga del mixer en Corrales.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && entregas.length > 0 && (
        <div className="space-y-2.5">
          {entregas.map((e) => (
            <EntregaHistorialRow key={e.id} entrega={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function EstadoCargando() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-card bg-earth-950/5 animate-pulse" />
      ))}
    </div>
  );
}
