'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldGroup, Input, Label, Select } from '@/components/ui/Field';
import type { DietaCompleta } from '@/types/database';

const HOY = new Date().toISOString().slice(0, 10);

export function CorralForm({
  dietas,
  onGuardar,
  onCancelar,
}: {
  dietas: DietaCompleta[];
  onGuardar: (data: {
    nombre: string;
    cantidad_animales: number;
    fecha_ingreso: string;
    peso_promedio_kg: number;
    origen?: string;
    dieta_id?: string;
    consumo_objetivo_pct: number;
  }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [animales, setAnimales] = useState('');
  const [fecha, setFecha] = useState(HOY);
  const [peso, setPeso] = useState('');
  const [origen, setOrigen] = useState('');
  const [dietaId, setDietaId] = useState('');
  const [consumo, setConsumo] = useState('2.40');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valido =
    nombre.trim().length > 0 &&
    Number(animales) > 0 &&
    Number(peso) > 0 &&
    Number(consumo) > 0 &&
    Number(consumo) <= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        cantidad_animales: Number(animales),
        fecha_ingreso: fecha,
        peso_promedio_kg: Number(peso),
        origen: origen.trim() || undefined,
        dieta_id: dietaId || undefined,
        consumo_objetivo_pct: Number(consumo),
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
        <Label>Nombre del corral</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Corral 12" autoFocus />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Cantidad de animales</Label>
          <Input type="number" inputMode="numeric" min="1" value={animales} onChange={(e) => setAnimales(e.target.value)} placeholder="120" />
        </FieldGroup>
        <FieldGroup>
          <Label>Peso promedio (kg)</Label>
          <Input type="number" inputMode="decimal" min="1" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="305" />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Fecha de ingreso</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label>Origen</Label>
          <Input value={origen} onChange={(e) => setOrigen(e.target.value)} placeholder="Ej: La Pampa" />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Dieta inicial (opcional)</Label>
          <Select value={dietaId} onChange={(e) => setDietaId(e.target.value)}>
            <option value="">Sin asignar</option>
            {dietas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label>Consumo objetivo (% PV)</Label>
          <Input type="number" inputMode="decimal" step="0.01" min="0.1" max="10" value={consumo} onChange={(e) => setConsumo(e.target.value)} />
        </FieldGroup>
      </div>

      {error && <p className="text-sm text-bad-600 bg-bad-100 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valido || guardando}>
          {guardando ? 'Guardando…' : 'Crear corral'}
        </Button>
      </div>
    </form>
  );
}
