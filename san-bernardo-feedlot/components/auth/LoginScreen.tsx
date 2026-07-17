'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { FieldGroup, Input, Label } from '@/components/ui/Field';
import { LogoFull } from '@/components/Logo';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setError(
        error.includes('Invalid login credentials')
          ? 'Email o contraseña incorrectos.'
          : error
      );
    }
    setCargando(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream field-texture px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <LogoFull />
        </div>

        <div className="bg-white rounded-card shadow-card-lg p-6">
          <h1 className="font-display font-bold text-xl text-earth-950 mb-1">Ingresar</h1>
          <p className="text-earth-700/60 text-sm mb-6">Accedé con tu usuario del feedlot</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus
                required
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </FieldGroup>

            {error && <p className="text-sm text-bad-600 bg-bad-100 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-earth-700/40 mt-5">
          Los usuarios se crean desde Supabase por un Administrador.
        </p>
      </div>
    </div>
  );
}
