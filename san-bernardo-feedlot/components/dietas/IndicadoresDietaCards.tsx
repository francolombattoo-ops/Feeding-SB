import { formatDecimal } from '@/lib/utils';
import type { IndicadoresDieta } from '@/lib/nutricion';

export function IndicadoresDietaCards({ indicadores }: { indicadores: IndicadoresDieta }) {
  const items = [
    { label: 'MS dieta', valor: `${formatDecimal(indicadores.materiaSecaPromedioPct, 1)}%`, sub: 'materia seca' },
    { label: 'EM', valor: formatDecimal(indicadores.energiaMetabolizable, 2), sub: 'Mcal/kg MS' },
    { label: 'PB', valor: `${formatDecimal(indicadores.proteinaBrutaPct, 1)}%`, sub: 'proteína bruta' },
    { label: 'PB / EM', valor: formatDecimal(indicadores.relacionPbEm, 0), sub: 'g PB / Mcal' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-earth-950 rounded-card px-4 py-4 md:py-5">
          <p className="text-corn-500 text-[11px] font-semibold uppercase tracking-wide">{item.label}</p>
          <p className="font-display text-2xl md:text-3xl font-bold text-cream mt-1">{item.valor}</p>
          <p className="text-cream/40 text-xs mt-0.5">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
