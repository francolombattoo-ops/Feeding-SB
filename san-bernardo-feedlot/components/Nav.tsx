'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoFull } from './Logo';
import { useAuth } from '@/lib/auth/AuthContext';

const ITEMS = [
  { href: '/', label: 'Panel', icon: IconGrid, soloAdmin: false },
  { href: '/corrales', label: 'Corrales', icon: IconPen, soloAdmin: false },
  { href: '/dietas', label: 'Dietas', icon: IconBowl, soloAdmin: false },
  { href: '/alimentos', label: 'Alimentos', icon: IconGrain, soloAdmin: true },
  { href: '/historial', label: 'Historial', icon: IconHistorial, soloAdmin: false },
];

export function Nav() {
  const pathname = usePathname();
  const { perfil, esAdministrador, signOut } = useAuth();
  const items = ITEMS.filter((item) => !item.soloAdmin || esAdministrador);

  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-earth-700/10 bg-white/60 backdrop-blur-sm">
        <div className="px-6 py-6">
          <LogoFull />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-earth-950 text-cream'
                    : 'text-earth-700/80 hover:bg-earth-950/5'
                )}
              >
                <item.icon className="w-[18px] h-[18px]" active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-earth-700/10">
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-earth-950 truncate">{perfil?.nombre ?? '…'}</p>
              <p className="text-[11px] text-earth-700/50">{esAdministrador ? 'Administrador' : 'Encargado'}</p>
            </div>
            <button
              onClick={signOut}
              className="text-xs font-medium text-earth-700/60 hover:text-bad-600 px-2 py-1 rounded-lg hover:bg-bad-100"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile: bottom nav grande, para uso con una mano en el corral */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-earth-700/10 pb-[env(safe-area-inset-bottom)]">
        <div className={cn('grid', items.length === 5 ? 'grid-cols-5' : 'grid-cols-4')}>
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 py-2.5"
              >
                <item.icon className="w-6 h-6" active={active} />
                <span className={cn('text-[11px] font-medium', active ? 'text-earth-950' : 'text-earth-700/50')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

type IconProps = { className?: string; active?: boolean };

function IconGrid({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" className={active ? 'fill-corn-500' : 'fill-earth-700/30'} />
      <rect x="13" y="3" width="8" height="8" rx="2" className={active ? 'fill-corn-500' : 'fill-earth-700/30'} />
      <rect x="3" y="13" width="8" height="8" rx="2" className={active ? 'fill-corn-500' : 'fill-earth-700/30'} />
      <rect x="13" y="13" width="8" height="8" rx="2" className={active ? 'fill-corn-500' : 'fill-earth-700/30'} />
    </svg>
  );
}

function IconPen({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke={active ? '#17140f' : '#3d362880'} strokeWidth="1.8">
      <path d="M4 10 L4 20 L20 20 L20 10 L12 4 Z" strokeLinejoin="round" />
      <path d="M9 20 L9 14 L15 14 L15 20" strokeLinejoin="round" />
    </svg>
  );
}

function IconBowl({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke={active ? '#17140f' : '#3d362880'} strokeWidth="1.8">
      <path d="M3 11 h18 a1 1 0 0 1 -1 3 c-2 3 -5 5 -8 5 s-6 -2 -8 -5 a1 1 0 0 1 -1 -3 Z" />
      <path d="M8 11 c0 -3 1.5 -6 4 -6 s4 3 4 6" strokeLinecap="round" />
    </svg>
  );
}

function IconGrain({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke={active ? '#17140f' : '#3d362880'} strokeWidth="1.8">
      <path d="M12 3 C9 6 9 9 12 12 C15 9 15 6 12 3 Z" />
      <path d="M12 12 v9" strokeLinecap="round" />
      <path d="M12 15 C10 15 8.5 16 8 18" strokeLinecap="round" />
      <path d="M12 17 C14 17 15.5 18 16 20" strokeLinecap="round" />
    </svg>
  );
}

function IconHistorial({ className, active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke={active ? '#17140f' : '#3d362880'} strokeWidth="1.8">
      <path d="M3 12 a9 9 0 1 0 2.6-6.3" strokeLinecap="round" />
      <path d="M3 4 v5 h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8 v4.5 l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
