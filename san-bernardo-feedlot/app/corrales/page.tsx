'use client';

import { useState } from 'react';
import { useCorrales } from '@/hooks/useCorrales';
import { useDietas } from '@/hooks/useDietas';
import { crearCorral } from '@/lib/services/corrales';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CorralForm } from '@/components/corrales/CorralForm';
import { CorralCard } from '@/components/corrales/CorralCard';

export default function CorralesPage() {
  const { corrales, loading, error, recargar } = useCorrales();
  const { dietas } = useDietas();
  const [modalAbierto, setModalAbierto] = useState(false);

  async function handleGuardar(data: Parameters<typeof crearCorral>[0]) {
    await crearCorral(data);
    setModalAbierto(false);
    await recargar();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-950">Corrales</h1>
          <p className="text-earth-700/60 text-sm mt-0.5">Tocá un corral para ver la carga del mixer</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>+ Nuevo corral</Button>
      </header>

      {loading && <EstadoCargando />}
      {error && <p className="text-bad-600 bg-bad-100 rounded-xl px-4 py-3">{error}</p>}

      {!loading && !error && corrales.length === 0 && <EstadoVacio onCrear={() => setModalAbierto(true)} />}

      {!loading && corrales.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {corrales.map((c) => (
            <CorralCard key={c.id} corral={c} dietas={dietas} onCambio={recargar} />
          ))}
        </div>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nuevo corral">
        <CorralForm dietas={dietas} onGuardar={handleGuardar} onCancelar={() => setModalAbierto(false)} />
      </Modal>
    </div>
  );
}

function EstadoVacio({ onCrear }: { onCrear: () => void }) {
  return (
    <Card className="py-14 text-center">
      <CardContent>
        <p className="text-4xl mb-3">🐂</p>
        <p className="font-display font-semibold text-earth-950 mb-1">Todavía no hay corrales</p>
        <p className="text-earth-700/60 text-sm mb-5">Creá el primer corral y asignale una dieta.</p>
        <Button onClick={onCrear}>+ Crear primer corral</Button>
      </CardContent>
    </Card>
  );
}

function EstadoCargando() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-56 rounded-card bg-earth-950/5 animate-pulse" />
      ))}
    </div>
  );
}
