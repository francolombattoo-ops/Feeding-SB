import { formatDecimal } from '@/lib/utils';
import type { ResumenDiaAnterior, LecturaTipo } from '@/types/database';

const ETIQUETAS_LECTURA: Record<LecturaTipo, { texto: string; clase: string }> = {
  FALTA: { texto: 'FALTA', clase: 'text-bad-600 bg-bad-100' },
  JUSTO: { texto: 'JUSTO', clase: 'text-good-600 bg-good-100' },
  SOBRA: { texto: 'SOBRA', clase: 'text-over-600 bg-over-100' },
};

function nombreDia(offset: 1 | 2): string {
  return offset === 1 ? 'Ayer' : 'Anteayer';
}

function fechaCorta(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

export function ResumenDiasAnteriores({ resumen }: { resumen: ResumenDiaAnterior[] }) {
  const conDatos = resumen.filter((r) => r.dietaNombre !== null);

  if (conDatos.length === 0) {
    return (
      <p className="text-xs text-earth-700/40 bg-cream-dim rounded-xl px-3 py-2.5">
        Todavía no hay entregas confirmadas en los últimos días.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {resumen.map((r, i) => {
        const offset = (i + 1) as 1 | 2;
        if (!r.dietaNombre) {
          return (
            <div key={r.fecha} className="bg-cream-dim rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-earth-700/40 font-semibold">
                {nombreDia(offset)} ({fechaCorta(r.fecha)})
              </p>
              <p className="text-xs text-earth-700/40 mt-1.5">Sin entrega registrada</p>
            </div>
          );
        }
        const lectura = r.lectura ? ETIQUETAS_LECTURA[r.lectura] : null;
        return (
          <div key={r.fecha} className="bg-cream-dim rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wide text-earth-700/40 font-semibold">
              {nombreDia(offset)} ({fechaCorta(r.fecha)})
            </p>
            <p className="text-sm font-display font-semibold text-earth-950 mt-1 truncate">{r.dietaNombre}</p>
            <p className="text-xs text-earth-700/60 mt-0.5">{formatDecimal(r.consumoObjetivoPct ?? 0, 2)}% PV</p>
            {lectura && (
              <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${lectura.clase}`}>
                {lectura.texto}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
