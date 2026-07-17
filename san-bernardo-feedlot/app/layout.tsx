import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';

export const metadata: Metadata = {
  title: 'San Bernardo Feedlot',
  description: 'Gestión simple y rápida de alimentación de corrales.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f6f3ea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="field-texture">
        <AuthProvider>
          <AuthGate>
            <div className="flex min-h-screen">
              <Nav />
              <main className="flex-1 min-w-0 pb-24 md:pb-0">{children}</main>
            </div>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
