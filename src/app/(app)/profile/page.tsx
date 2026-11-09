'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/pulse/app-header';
import { Button } from '@/components/pulse/button';
import { Badge } from '@/components/pulse/badge';
import { AddressAutocomplete } from '@/components/pulse/address-autocomplete';
import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { userRole, userId, setUser, clear } = useAuthStore();
  const [becomingCoach, setBecomingCoach] = useState(false);

  // Shared Fraynix ID session: sign out at the portal, which sends us back here.
  const handleLogout = () => {
    clear();
    window.location.href = '/api/logout';
  };

  const isCoach = userRole === 'coach' || userRole === 'both';

  return (
    <>
      <AppHeader title="Mon profil" />
      <div className="p-4 md:p-8 max-w-lg">
        <h1 className="hidden md:block text-2xl font-extrabold text-text mb-6">Mon profil</h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-2xl font-bold text-white">
            P
          </div>
          <div>
            <p className="text-lg font-bold text-text">Sportif</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="sport">🏃 Sportif</Badge>
              {isCoach && <Badge variant="pro">⚡ Coach</Badge>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isCoach ? (
            <Link href="/coach">
              <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚡</span>
                  <span className="text-sm font-semibold text-text">Mon espace coach</span>
                </div>
                <span className="text-muted">→</span>
              </div>
            </Link>
          ) : (
            <button
              onClick={async () => {
                setBecomingCoach(true);
                try {
                  const res = await fetch('/api/coaches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                  });
                  if (res.ok || res.status === 409) {
                    if (userId) setUser(userId, 'both');
                    router.push('/coach/profile/edit');
                  }
                } catch { /* ignore */ }
                setBecomingCoach(false);
              }}
              disabled={becomingCoach}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚡</span>
                  <span className="text-sm font-semibold text-violet-700">
                    {becomingCoach ? 'Création en cours...' : 'Devenir coach'}
                  </span>
                </div>
                <span className="text-violet-400">→</span>
              </div>
            </button>
          )}

          <Link href="/profile/connections">
            <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔗</span>
                <div>
                  <span className="text-sm font-semibold text-text">Connexions</span>
                  <p className="text-xs text-muted">Strava, Garmin, Fitbit</p>
                </div>
              </div>
              <span className="text-muted">→</span>
            </div>
          </Link>

          <Link href="/profile/cycle">
            <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔴</span>
                <div>
                  <span className="text-sm font-semibold text-text">Suivi du cycle</span>
                  <p className="text-xs text-muted">Adapter l&apos;entraînement au cycle menstruel</p>
                </div>
              </div>
              <span className="text-muted">→</span>
            </div>
          </Link>

          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm font-semibold text-text mb-3">Ma localisation</p>
            <AddressAutocomplete
              placeholder="Rechercher votre ville..."
              onSelect={async (result) => {
                await fetch('/api/profile', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    city: result.city,
                    postal_code: result.postalCode,
                    lat: result.lat,
                    lng: result.lng,
                  }),
                });
              }}
            />
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm font-semibold text-text mb-1">Paramètres</p>
            <p className="text-xs text-muted">Notifications, préférences</p>
          </div>

          <Button variant="ghost" className="w-full text-muted" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </>
  );
}
