'use client';

import { useState } from 'react';
import { useDietas } from '@/hooks/useDietas';
import { useAlimentos } from '@/hooks/useAlimentos';
import { guardarDieta, eliminarDieta } from '@/lib/services/dietas';
import { calcularIndicadoresDieta } from '@/lib/nutricion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DietaEditor } from '@/components/dietas/DietaEditor';
import { formatDecimal } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import type { DietaCompleta } from '@/types/database';

export default function DietasPage() {
  const { esAdministrador } = useAuth();
  const { dietas, loading, error, recargar } = useDietas();
  const { alimentos } = useAlimentos();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<DietaCompleta | undefined>(undefined);
  const [borrando, setBorrando] = useState<string | null>(null);

  function abrirNueva() {
    setEditando(undefined);
    setModalAbierto(true);
  }

  function abrirEditar(d: DietaCompleta) {
    setEditando(d);
    setModalAbierto(true);
  }

  async function handleGuardar(data: {
    nombre: string;
    capacidad_maxima_mh: number | null;
    ingredientes: Array<{ alimento_id: string; porcentaje_ms: number }>;
  }) {
    await guardarDieta(data, editando?.id);
    setModalAbierto(false);
    await recargar();
  }

  async function handleEliminar(id: string) {
    setBorrando(id);
    try {
      await eliminarDieta(id);
      await recargar();
    } finally {
      setBorrando(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-950">Dietas</h1>
          <p className="text-earth-700/60 text-sm mt-0.5">Composición nutricional en % de Materia Seca</p>
        </div>
        <Button onClick={abrirNueva} className={esAdministrador ? '' : 'hidden'}>+ Nueva dieta</Button>
      </header>

      {loading && <EstadoCargando />}
      {error && <p className="text-bad-600 bg-bad-100 rounded-xl px-4 py-3">{error}</p>}

      {!loading && !error && dietas.length === 0 && <EstadoVacio onCrear={abrirNueva} />}

      {!loading && dietas.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {dietas.map((d) => {
            const indicadores = calcularIndicadoresDieta(d.ingredientes);
            return (
              <Card key={d.id} className="hover:shadow-card-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display font-bold text-lg text-earth-950">{d.nombre}</h3>
                    {esAdministrador && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => abrirEditar(d)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleEliminar(d.id)} disabled={borrando === d.id}>
                          {borrando === d.id ? '…' : 'Eliminar'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {d.ingredientes.map((ing) => (
                      <div key={ing.id} className="flex justify-between text-sm">
                        <span className="text-earth-700/70">{ing.alimento.nombre}</span>
                        <span className="font-medium text-earth-900">{formatDecimal(ing.porcentaje_ms, 1)}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-earth-700/10">
                    <MiniIndicador label="MS" valor={`${formatDecimal(indicadores.materiaSecaPromedioPct, 0)}%`} />
                    <MiniIndicador label="EM" valor={formatDecimal(indicadores.energiaMetabolizable, 2)} />
                    <MiniIndicador label="PB" valor={`${formatDecimal(indicadores.proteinaBrutaPct, 1)}%`} />
                    <MiniIndicador label="PB/EM" valor={formatDecimal(indicadores.relacionPbEm, 0)} />
                  </div>

                  {d.capacidad_maxima_mh != null && (
                    <p className="text-xs text-earth-700/50 mt-3 pt-3 border-t border-earth-700/10">
                      Capacidad máxima del mixer: <span className="font-semibold text-earth-900">{formatDecimal(d.capacidad_maxima_mh, 0)} kg MH</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editando ? 'Editar dieta' : 'Nueva dieta'} wide>
        <DietaEditor alimentos={alimentos} inicial={editando} onGuardar={handleGuardar} onCancelar={() => setModalAbierto(false)} />
      </Modal>
    </div>
  );
}

function MiniIndicador({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-earth-700/40">{label}</p>
      <p className="font-display font-semibold text-earth-950 text-sm">{valor}</p>
    </div>
  );
}

function EstadoVacio({ onCrear }: { onCrear: () => void }) {
  return (
    <Card className="py-14 text-center">
      <CardContent>
        <p className="text-4xl mb-3">🥣</p>
        <p className="font-display font-semibold text-earth-950 mb-1">Todavía no armaste dietas</p>
        <p className="text-earth-700/60 text-sm mb-5">Combiná alimentos por % de Materia Seca hasta llegar a 100%.</p>
        <Button onClick={onCrear}>+ Crear primera dieta</Button>
      </CardContent>
    </Card>
  );
}

function EstadoCargando() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="h-48 rounded-card bg-earth-950/5 animate-pulse" />
      ))}
    </div>
  );
}
