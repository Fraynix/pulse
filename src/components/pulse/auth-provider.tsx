'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

// Identity comes from the Fraynix ID session (read server-side): the client only asks /api/me.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clear } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { id?: string; role?: string } | null) => {
        if (cancelled) return;
        if (me?.id) setUser(me.id, (me.role || 'athlete') as Parameters<typeof setUser>[1]);
        else clear();
      })
      .catch(() => {
        // Offline / transient error: keep the persisted store as is.
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, clear]);

  return <>{children}</>;
}
