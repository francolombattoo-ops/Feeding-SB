'use client';

import { useState } from 'react';
import { useAlimentos } from '@/hooks/useAlimentos';
import { crearAlimento, actualizarAlimento, eliminarAlimento } from '@/lib/services/alimentos';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AlimentoForm } from '@/components/alimentos/AlimentoForm';
import { formatDecimal } from '@/lib/utils';
import type { Alimento } from '@/types/database';

export default function AlimentosPage() {
  const { alimentos, loading, error, recargar } = useAlimentos();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Alimento | undefined>(undefined);
  const [borrando, setBorrando] = useState<string | null>(null);

  function abrirNuevo() {
    setEditando(undefined);
    setModalAbierto(true);
  }

  function abrirEditar(a: Alimento) {
    setEditando(a);
    setModalAbierto(true);
  }

  async function handleGuardar(data: {
    nombre: string;
    materia_seca_pct: number;
    energia_metabolizable: number;
    proteina_bruta_pct: number;
  }) {
    if (editando) {
      await actualizarAlimento(editando.id, data);
    } else {
      await crearAlimento(data);
    }
    setModalAbierto(false);
    await recargar();
  }

  async function handleEliminar(id: string) {
    setBorrando(id);
    try {
      await eliminarAlimento(id);
      await recargar();
    } finally {
      setBorrando(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-950">Alimentos</h1>
          <p className="text-earth-700/60 text-sm mt-0.5">Ingredientes disponibles para armar dietas</p>
        </div>
        <Button onClick={abrirNuevo}>+ Nuevo alimento</Button>
      </header>

      {loading && <EstadoCargando />}
      {error && <p className="text-bad-600 bg-bad-100 rounded-xl px-4 py-3">{error}</p>}

      {!loading && !error && alimentos.length === 0 && (
        <EstadoVacio onCrear={abrirNuevo} />
      )}

      {!loading && alimentos.length > 0 && (
        <div className="space-y-2.5">
          {/* Encabezado de tabla en desktop */}
          <div className="hidden md:grid grid-cols-[1fr_100px_120px_120px_90px] gap-4 px-5 text-xs font-semibold uppercase tracking-wide text-earth-700/50">
            <span>Nombre</span>
            <span>MS (%)</span>
            <span>EM (Mcal/kg)</span>
            <span>PB (%)</span>
            <span></span>
          </div>

          {alimentos.map((a) => (
            <Card key={a.id} className="hover:shadow-card-lg transition-shadow">
              <CardContent className="p-4 md:p-4">
                <div className="grid grid-cols-2 md:grid-cols-[1fr_100px_120px_120px_90px] gap-x-4 gap-y-2 items-center">
                  <div className="col-span-2 md:col-span-1">
                    <p className="font-display font-semibold text-earth-950">{a.nombre}</p>
                  </div>
                  <Dato label="MS" valor={`${formatDecimal(a.materia_seca_pct, 1)}%`} />
                  <Dato label="EM" valor={`${formatDecimal(a.energia_metabolizable, 2)}`} />
                  <Dato label="PB" valor={`${formatDecimal(a.proteina_bruta_pct, 1)}%`} />
                  <div className="flex gap-1.5 col-span-2 md:col-span-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => abrirEditar(a)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleEliminar(a.id)}
                      disabled={borrando === a.id}
                    >
                      {borrando === a.id ? '…' : 'Eliminar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editando ? 'Editar alimento' : 'Nuevo alimento'}>
        <AlimentoForm inicial={editando} onGuardar={handleGuardar} onCancelar={() => setModalAbierto(false)} />
      </Modal>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="md:contents">
      <p className="text-[11px] uppercase tracking-wide text-earth-700/40 md:hidden">{label}</p>
      <p className="font-medium text-earth-900">{valor}</p>
    </div>
  );
}

function EstadoVacio({ onCrear }: { onCrear: () => void }) {
  return (
    <Card className="py-14 text-center">
      <CardContent>
        <p className="text-4xl mb-3">🌾</p>
        <p className="font-display font-semibold text-earth-950 mb-1">Todavía no cargaste alimentos</p>
        <p className="text-earth-700/60 text-sm mb-5">Empezá agregando maíz, silaje, expeller o núcleo.</p>
        <Button onClick={onCrear}>+ Cargar primer alimento</Button>
      </CardContent>
    </Card>
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
