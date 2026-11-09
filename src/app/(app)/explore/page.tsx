'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/pulse/app-header';
import { Badge } from '@/components/pulse/badge';
import { Button } from '@/components/pulse/button';
import { EmptyState } from '@/components/pulse/empty-state';
import { SportGradient } from '@/components/pulse/sport-gradient';
import { SPORT_EMOJIS, type Sport } from '@/lib/sports';
import { ClubCard } from '@/components/clubs/club-card';
import Link from 'next/link';

type Tab = 'coaches' | 'events' | 'clubs';

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('coaches');
  const [coaches, setCoaches] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoaches = useCallback(() => {
    setLoading(true);
    fetch('/api/coaches?sortBy=relevance')
      .then(r => r.ok ? r.json() : { coaches: [] })
      .then(d => setCoaches(d.coaches || []))
      .catch(() => setCoaches([]))
      .finally(() => setLoading(false));
  }, []);

  const loadEvents = useCallback(() => {
    setLoading(true);
    fetch('/api/events?page=1&limit=20')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setEvents(d.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const loadClubs = useCallback(() => {
    setLoading(true);
    fetch('/api/clubs?limit=20')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setClubs(d.clubs || d.data || []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'coaches') loadCoaches();
    else if (tab === 'events') loadEvents();
    else loadClubs();
  }, [tab, loadCoaches, loadEvents, loadClubs]);

  return (
    <>
      <AppHeader title="Explorer" />
      <div className="p-4 md:p-8">
        <h1 className="hidden md:block text-2xl font-extrabold text-text mb-6">Explorer</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('coaches')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === 'coaches'
                ? 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white'
                : 'bg-surface text-muted hover:text-text'
            }`}
          >
            🔍 Coachs
          </button>
          <button
            onClick={() => setTab('events')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === 'events'
                ? 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white'
                : 'bg-surface text-muted hover:text-text'
            }`}
          >
            🎪 Événements
          </button>
          <button
            onClick={() => setTab('clubs')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === 'clubs'
                ? 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white'
                : 'bg-surface text-muted hover:text-text'
            }`}
          >
            🏟️ Clubs
          </button>
        </div>

        {loading ? (
          tab === 'clubs' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />)}
            </div>
          )
        ) : tab === 'coaches' ? (
          coaches.length > 0 ? (
            <div className="space-y-4">
              {coaches.map((c: any) => (
                <Link key={c.id} href={`/explore/coach/${c.id}`} className="block">
                  <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                    <SportGradient sport={(c.specialties?.[0] || 'autre').toLowerCase()} className="flex items-center gap-3 px-5 py-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-xl font-bold">
                        {(c.firstName?.[0] || '?')}{(c.lastName?.[0] || '')}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold">{c.firstName} {c.lastName}</p>
                        <p className="text-xs opacity-80">{(c.specialties || []).join(' · ')}</p>
                      </div>
                      {c.isVerified && <Badge variant="verified">✓ Vérifié</Badge>}
                    </SportGradient>
                    <div className="flex justify-between px-5 py-3">
                      <div className="text-center"><p className="font-mono text-lg font-bold text-text">{c.avgRating?.toFixed(1) || '—'}</p><p className="text-[10px] text-muted">★ Note</p></div>
                      <div className="text-center"><p className="font-mono text-lg font-bold text-text">{c.totalSessions || 0}</p><p className="text-[10px] text-muted">séances</p></div>
                      <div className="text-center"><p className="font-mono text-lg font-bold text-text">{c.hourlyRate || '—'}€</p><p className="text-[10px] text-muted">/heure</p></div>
                      {c.distanceKm && <div className="text-center"><p className="font-mono text-lg font-bold text-text">{c.distanceKm}</p><p className="text-[10px] text-muted">km</p></div>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🏋️"
              title="Les coachs arrivent bientôt"
              description="Nous construisons un réseau de coachs certifiés près de chez vous. Revenez vite ou devenez le premier !"
              actionLabel="Devenir coach"
              onAction={() => window.location.href = '/profile'}
            />
          )
        ) : tab === 'events' ? (
          events.length > 0 ? (
            <div className="space-y-4">
              {events.map((e: any) => (
                <Link key={e.id} href={`/explore/events/${e.id}`} className="block">
                  <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                    <SportGradient sport={(e.sport || 'autre').toLowerCase()} className="relative overflow-hidden px-5 py-4">
                      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/8" />
                      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">
                        {SPORT_EMOJIS[(e.sport || 'autre').toLowerCase() as Sport] || '⚡'} {e.sport} · {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="mt-1 text-lg font-bold">{e.title}</p>
                      {e.address && <p className="text-xs opacity-70 mt-1">📍 {e.address}</p>}
                    </SportGradient>
                    <div className="flex items-center justify-between px-5 py-3">
                      <div className="flex gap-4">
                        <span className="text-sm"><span className="font-mono font-bold text-text">{e.filledAthlete || 0}</span><span className="text-muted">/{e.slotsAthlete}</span></span>
                        <span className="text-sm font-bold">{e.price > 0 ? `${(e.price / 100).toFixed(0)}€` : <span className="text-brand-500">Gratuit</span>}</span>
                      </div>
                      <Button size="sm">S&apos;inscrire</Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🎯"
              title="Pas encore d'événements"
              description="Les premiers événements sportifs dans votre ville arrivent bientôt. En attendant, explorez les coachs disponibles !"
              actionLabel="Voir les coachs"
              onAction={() => setTab('coaches')}
            />
          )
        ) : (
          clubs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {clubs.map((club: any) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🏟️"
              title="Pas encore de clubs"
              description="Les clubs sportifs de votre région arrivent bientôt. Créez le premier club de votre sport !"
              actionLabel="Créer un club"
              onAction={() => window.location.href = '/clubs/create'}
            />
          )
        )}
      </div>
    </>
  );
}
