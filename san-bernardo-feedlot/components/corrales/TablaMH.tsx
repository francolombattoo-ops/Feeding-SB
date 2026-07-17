import { formatKg } from '@/lib/utils';
import type { DetalleMH } from '@/types/database';

export function TablaMH({ detalle, total }: { detalle: DetalleMH[]; total: number }) {
  return (
    <div className="rounded-xl overflow-hidden border border-earth-700/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-corn-100 text-corn-600">
            <th className="text-left font-semibold px-4 py-2.5">Ingrediente</th>
            <th className="text-right font-semibold px-4 py-2.5">Kg MH</th>
          </tr>
        </thead>
        <tbody>
          {detalle.map((d) => (
            <tr key={d.alimento_id} className="border-t border-earth-700/10 bg-white">
              <td className="px-4 py-2.5 text-earth-900">{d.nombre}</td>
              <td className="px-4 py-2.5 text-right font-display font-semibold text-earth-950">{formatKg(d.kg_mh)} kg</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-earth-950/10 bg-earth-950">
            <td className="px-4 py-3 text-cream font-display font-bold">Total a cargar</td>
            <td className="px-4 py-3 text-right text-corn-500 font-display font-bold text-lg">{formatKg(total)} kg</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
