'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/pulse/empty-state';
import { SessionsManager } from './sessions-manager';
import type { SessionTemplate } from '@/components/coach/session-wizard-modal';

function SessionsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <div className="h-7 w-36 animate-pulse rounded-lg bg-gray-200" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

export default function CoachSessionsPage() {
  const [sessions, setSessions] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/coaches/me/sessions')
      .then((r) => {
        if (r.status === 401) throw new Error('auth');
        if (r.status === 403) throw new Error('not-coach');
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message || 'fetch failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SessionsSkeleton />;

  if (error) {
    const isAuth = error === 'auth';
    const isNotCoach = error === 'not-coach';
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-text mb-6">Mes séances</h1>
        <EmptyState
          icon={isAuth ? '🔒' : isNotCoach ? '🚫' : '⚠️'}
          title={
            isAuth
              ? 'Session expirée, rechargez la page'
              : isNotCoach
                ? 'Cette page est réservée aux coachs'
                : 'Impossible de charger les séances. Réessayez.'
          }
          description={
            isAuth
              ? 'Votre session a expiré.'
              : isNotCoach
                ? 'Seuls les comptes coach peuvent accéder à cette page.'
                : 'Vérifiez votre connexion et réessayez.'
          }
          actionLabel={isAuth ? 'Recharger' : isNotCoach ? undefined : 'Réessayer'}
          onAction={
            isAuth
              ? () => (window.location.reload())
              : isNotCoach
                ? undefined
                : () => window.location.reload()
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">Mes séances</h1>
      <SessionsManager initialSessions={sessions} />
    </div>
  );
}
