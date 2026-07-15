'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldGroup, Input, Label, Select } from '@/components/ui/Field';
import { IndicadoresDietaCards } from './IndicadoresDietaCards';
import { calcularIndicadoresDieta } from '@/lib/nutricion';
import { formatDecimal, cn } from '@/lib/utils';
import type { Alimento, DietaCompleta } from '@/types/database';

interface FilaIngrediente {
  key: string;
  alimento_id: string;
  porcentaje_ms: string;
}

let contador = 0;
function nuevaKey() {
  contador += 1;
  return `fila-${contador}-${Date.now()}`;
}

export function DietaEditor({
  alimentos,
  inicial,
  onGuardar,
  onCancelar,
}: {
  alimentos: Alimento[];
  inicial?: DietaCompleta;
  onGuardar: (data: {
    nombre: string;
    capacidad_maxima_mh: number | null;
    ingredientes: Array<{ alimento_id: string; porcentaje_ms: number }>;
  }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [capacidadMaxima, setCapacidadMaxima] = useState(
    inicial?.capacidad_maxima_mh != null ? String(inicial.capacidad_maxima_mh) : ''
  );
  const [filas, setFilas] = useState<FilaIngrediente[]>(() =>
    inicial && inicial.ingredientes.length > 0
      ? inicial.ingredientes.map((i) => ({ key: nuevaKey(), alimento_id: i.alimento_id, porcentaje_ms: String(i.porcentaje_ms) }))
      : [{ key: nuevaKey(), alimento_id: alimentos[0]?.id ?? '', porcentaje_ms: '' }]
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indicadores = useMemo(() => {
    const ingredientesValidos = filas
      .filter((f) => f.alimento_id && Number(f.porcentaje_ms) > 0)
      .map((f) => {
        const alimento = alimentos.find((a) => a.id === f.alimento_id)!;
        return { porcentaje_ms: Number(f.porcentaje_ms), alimento };
      })
      .filter((i) => i.alimento);
    return calcularIndicadoresDieta(ingredientesValidos);
  }, [filas, alimentos]);

  function agregarFila() {
    const usados = new Set(filas.map((f) => f.alimento_id));
    const disponible = alimentos.find((a) => !usados.has(a.id));
    setFilas((f) => [...f, { key: nuevaKey(), alimento_id: disponible?.id ?? '', porcentaje_ms: '' }]);
  }

  function quitarFila(key: string) {
    setFilas((f) => f.filter((x) => x.key !== key));
  }

  function actualizarFila(key: string, cambios: Partial<FilaIngrediente>) {
    setFilas((f) => f.map((x) => (x.key === key ? { ...x, ...cambios } : x)));
  }

  const sumaOk = indicadores.esValida;
  const puedeGuardar = nombre.trim().length > 0 && sumaOk && filas.every((f) => f.alimento_id && Number(f.porcentaje_ms) > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeGuardar) return;
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        capacidad_maxima_mh: capacidadMaxima.trim() ? Number(capacidadMaxima) : null,
        ingredientes: filas.map((f) => ({ alimento_id: f.alimento_id, porcentaje_ms: Number(f.porcentaje_ms) })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  if (alimentos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-earth-700/70">Primero necesitás cargar alimentos en el módulo Alimentos.</p>
        <Button variant="ghost" className="mt-3" onClick={onCancelar}>Cerrar</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup>
        <Label>Nombre de la dieta</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Terminación" autoFocus />
      </FieldGroup>

      <FieldGroup>
        <Label>Capacidad máxima recomendada del mixer (kg MH) — opcional</Label>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="50"
          value={capacidadMaxima}
          onChange={(e) => setCapacidadMaxima(e.target.value)}
          placeholder="Ej: 8000"
        />
      </FieldGroup>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Ingredientes (% de Materia Seca)</Label>
          <span
            className={cn(
              'text-sm font-semibold px-2.5 py-1 rounded-lg',
              sumaOk ? 'text-good-600 bg-good-100' : 'text-bad-600 bg-bad-100'
            )}
          >
            Suma: {formatDecimal(indicadores.sumaPorcentajes, 1)}%
          </span>
        </div>

        <div className="space-y-2">
          {filas.map((fila) => (
            <div key={fila.key} className="flex gap-2 items-center">
              <Select
                className="flex-1"
                value={fila.alimento_id}
                onChange={(e) => actualizarFila(fila.key, { alimento_id: e.target.value })}
              >
                {alimentos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </Select>
              <div className="relative w-28">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="100"
                  value={fila.porcentaje_ms}
                  onChange={(e) => actualizarFila(fila.key, { porcentaje_ms: e.target.value })}
                  placeholder="0"
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-700/40 text-sm">%</span>
              </div>
              <button
                type="button"
                onClick={() => quitarFila(fila.key)}
                aria-label="Quitar ingrediente"
                className="w-9 h-9 shrink-0 grid place-items-center rounded-lg text-earth-700/50 hover:bg-bad-100 hover:text-bad-600 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={agregarFila}
          className="mt-2 text-sm font-medium text-corn-600 hover:text-corn-500"
        >
          + Agregar ingrediente
        </button>

        {!sumaOk && (
          <p className="text-sm text-bad-600 bg-bad-100 rounded-lg px-3 py-2 mt-3">
            La suma de porcentajes debe ser exactamente 100% para poder guardar.
          </p>
        )}
      </div>

      <div>
        <Label>Vista previa de indicadores</Label>
        <IndicadoresDietaCards indicadores={indicadores} />
      </div>

      {error && <p className="text-sm text-bad-600 bg-bad-100 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!puedeGuardar || guardando}>
          {guardando ? 'Guardando…' : 'Guardar dieta'}
        </Button>
      </div>
    </form>
  );
}
