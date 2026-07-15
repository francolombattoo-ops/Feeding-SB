'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldGroup, Input, Label } from '@/components/ui/Field';
import type { Alimento } from '@/types/database';

export function AlimentoForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: Alimento;
  onGuardar: (data: {
    nombre: string;
    materia_seca_pct: number;
    energia_metabolizable: number;
    proteina_bruta_pct: number;
  }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [ms, setMs] = useState(inicial?.materia_seca_pct?.toString() ?? '');
  const [em, setEm] = useState(inicial?.energia_metabolizable?.toString() ?? '');
  const [pb, setPb] = useState(inicial?.proteina_bruta_pct?.toString() ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valido =
    nombre.trim().length > 0 &&
    Number(ms) > 0 &&
    Number(ms) <= 100 &&
    Number(em) > 0 &&
    Number(pb) >= 0 &&
    Number(pb) <= 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        materia_seca_pct: Number(ms),
        energia_metabolizable: Number(em),
        proteina_bruta_pct: Number(pb),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Label>Nombre</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Maíz" autoFocus />
      </FieldGroup>

      <div className="grid grid-cols-3 gap-3">
        <FieldGroup>
          <Label>Materia seca (%)</Label>
          <Input type="number" inputMode="decimal" step="0.1" min="0" max="100" value={ms} onChange={(e) => setMs(e.target.value)} placeholder="88" />
        </FieldGroup>
        <FieldGroup>
          <Label>EM (Mcal/kg MS)</Label>
          <Input type="number" inputMode="decimal" step="0.01" min="0" value={em} onChange={(e) => setEm(e.target.value)} placeholder="3.20" />
        </FieldGroup>
        <FieldGroup>
          <Label>Proteína bruta (%)</Label>
          <Input type="number" inputMode="decimal" step="0.1" min="0" max="100" value={pb} onChange={(e) => setPb(e.target.value)} placeholder="9" />
        </FieldGroup>
      </div>

      {error && <p className="text-sm text-bad-600 bg-bad-100 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valido || guardando}>
          {guardando ? 'Guardando…' : 'Guardar alimento'}
        </Button>
      </div>
    </form>
  );
}
