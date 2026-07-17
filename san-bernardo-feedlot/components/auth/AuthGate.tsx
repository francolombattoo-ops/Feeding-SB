'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { LoginScreen } from './LoginScreen';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream field-texture">
        <div className="w-8 h-8 rounded-full border-2 border-earth-950/20 border-t-earth-950 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
