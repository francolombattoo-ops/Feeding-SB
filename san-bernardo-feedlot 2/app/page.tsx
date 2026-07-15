'use client';

import Link from 'next/link';
import { useDashboard } from '@/hooks/useDashboard';
import { Card, CardContent } from '@/components/ui/Card';
import { formatKg } from '@/lib/utils';

export default function DashboardPage() {
  const { resumen, loading, error } = useDashboard();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-earth-950">Panel</h1>
        <p className="text-earth-700/60 text-sm mt-0.5">Estado general del feedlot hoy</p>
      </header>

      {error && <p className="text-bad-600 bg-bad-100 rounded-xl px-4 py-3 mb-4">{error}</p>}

      {loading ? (
        <EstadoCargando />
      ) : resumen.cantidadCorrales === 0 ? (
        <EstadoVacio />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Corrales" valor={String(resumen.cantidadCorrales)} icono="🏠" />
            <StatCard label="Animales" valor={String(resumen.totalAnimales)} icono="🐂" />
            <StatCard label="Consumo total MS" valor={`${formatKg(resumen.totalMS)} kg`} icono="🌾" />
            <StatCard label="Alimento hoy (MH)" valor={`${formatKg(resumen.totalMHHoy)} kg`} icono="🚜" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-earth-700/50 mb-2.5">
              Lecturas de comedero de hoy
            </p>
            <div className="grid grid-cols-3 gap-3">
              <LecturaStat label="Falta" valor={resumen.faltas} colorBg="bg-bad-100" colorText="text-bad-600" />
              <LecturaStat label="Justo" valor={resumen.justos} colorBg="bg-good-100" colorText="text-good-600" />
              <LecturaStat label="Sobra" valor={resumen.sobras} colorBg="bg-over-100" colorText="text-over-600" />
            </div>
            {resumen.sinLectura > 0 && (
              <p className="text-xs text-earth-700/50 mt-2.5">
                {resumen.sinLectura} corral{resumen.sinLectura !== 1 ? 'es' : ''} todavía sin lectura hoy.
              </p>
            )}
          </div>

          <Link href="/corrales" className="block">
            <Card className="hover:shadow-card-lg transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-earth-950">Ir a Corrales</p>
                  <p className="text-sm text-earth-700/60">Cargar lecturas y ver kilos a entregar</p>
                </div>
                <span className="text-corn-600 text-xl">→</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, valor, icono }: { label: string; valor: string; icono: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xl mb-1">{icono}</p>
        <p className="font-display text-2xl font-bold text-earth-950">{valor}</p>
        <p className="text-xs text-earth-700/50 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function LecturaStat({
  label,
  valor,
  colorBg,
  colorText,
}: {
  label: string;
  valor: number;
  colorBg: string;
  colorText: string;
}) {
  return (
    <div className={`${colorBg} rounded-card px-4 py-4 text-center`}>
      <p className={`font-display text-3xl font-bold ${colorText}`}>{valor}</p>
      <p className={`text-xs font-semibold uppercase tracking-wide mt-1 ${colorText}`}>{label}</p>
    </div>
  );
}

function EstadoVacio() {
  return (
    <Card className="py-16 text-center">
      <CardContent>
        <p className="text-5xl mb-4">🌅</p>
        <p className="font-display font-semibold text-lg text-earth-950 mb-1">Bienvenido a San Bernardo</p>
        <p className="text-earth-700/60 text-sm max-w-sm mx-auto mb-5">
          Empezá cargando tus alimentos, armá una dieta y creá el primer corral para ver el panel completo.
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/alimentos" className="text-sm font-medium text-corn-600 hover:text-corn-500 bg-corn-100 px-4 py-2 rounded-xl">
            1. Cargar alimentos
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function EstadoCargando() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 rounded-card bg-earth-950/5 animate-pulse" />
      ))}
    </div>
  );
}
