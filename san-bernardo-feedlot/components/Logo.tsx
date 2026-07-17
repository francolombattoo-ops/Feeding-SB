import { cn } from '@/lib/utils';

/**
 * Monograma "SB": una colina/silo estilizado (arco) atravesado por líneas
 * horizontales que evocan una tranquera de corral. Minimalista, vectorial,
 * funciona a cualquier tamaño (favicon, header, impresión).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn('w-9 h-9', className)} xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#17140f" />
      {/* Arco = colina de campo / silo */}
      <path
        d="M8 26 C8 16 14 10 20 10 C26 10 32 16 32 26"
        stroke="#d99a2b"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Líneas de tranquera / corral */}
      <line x1="8" y1="26" x2="32" y2="26" stroke="#f6f3ea" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="8" y1="30.5" x2="32" y2="30.5" stroke="#f6f3ea" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      {/* Poste central */}
      <line x1="20" y1="10" x2="20" y2="30.5" stroke="#f6f3ea" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

/** Logo completo con nombre del establecimiento y la empresa, para el header. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <div>
        <p className="font-display font-semibold text-earth-950 leading-tight">San Bernardo</p>
        <p className="text-[11px] text-earth-700/50 leading-tight">Colombatto Hermanos</p>
      </div>
    </div>
  );
}
