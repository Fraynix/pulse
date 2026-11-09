'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/pulse/app-header';
import { Badge } from '@/components/pulse/badge';
import { useAuthStore } from '@/stores/auth';
import { SPORT_EMOJIS, SPORT_LABELS, SPORT_GRADIENTS, type Sport } from '@/lib/sports';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */

const LEVEL_LABELS: Record<string, string> = {
  all: 'Tous niveaux',
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface Workout {
  id: string;
  week_number: number;
  day_number: number;
  title: string;
  description: string;
  duration_minutes: number;
  workout_data: { exercises: Array<Record<string, unknown>> };
}

interface TargetEvent {
  id: string;
  name: string;
  sport: string;
  distance_km: number | null;
  terrain_type: string | null;
  location: string | null;
  event_date: string | null;
  elevation_m: number | null;
}

interface SimilarProgram {
  id: string;
  title: string;
  sport: string;
  level: string;
  duration_weeks: number;
  price: number;
  cover_image_url: string | null;
  coach_profiles: { display_name: string; avatar_url: string | null } | null;
  program_enrollments?: Array<{ count: number }>;
}

interface Program {
  id: string;
  title: string;
  description: string;
  sport: string;
  level: string;
  duration_weeks: number;
  price: number;
  is_published: boolean;
  cover_image_url: string | null;
  coach_profiles: { display_name: string; avatar_url: string | null } | null;
  program_workouts: Workout[];
  program_enrollments?: Array<{ count: number }>;
  target_events?: TargetEvent | null;
}

interface Enrollment {
  id: string;
  enrolled_at?: string;
  created_at?: string;
  program_id: string;
  athlete_id: string;
}

export default function ProgramDetailAthleteView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [pushingGarmin, setPushingGarmin] = useState(false);
  const [garminConnected, setGarminConnected] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [similarPrograms, setSimilarPrograms] = useState<SimilarProgram[]>([]);

  useEffect(() => {
    fetch(`/api/programs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) {
          router.push('/explore/programs');
          return;
        }
        setProgram(data);
      })
      .catch(() => router.push('/explore/programs'))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!userId) return;
    setEnrollmentLoading(true);
    fetch(`/api/programs/${id}/enroll`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error) setEnrollment(data);
      })
      .catch(() => {})
      .finally(() => setEnrollmentLoading(false));
  }, [id, userId]);

  useEffect(() => {
    fetch('/api/connectors')
      .then(r => r.ok ? r.json() : { connections: [] })
      .then(d => {
        const conns = d.connections || [];
        setGarminConnected(conns.some((c: any) => c.provider === 'garmin' && c.is_active));
      })
      .catch(() => {});
  }, []);

  // Fetch similar programs
  useEffect(() => {
    if (!program) return;
    const p = new URLSearchParams();
    p.set('sport', program.sport);
    p.set('limit', '6');
    p.set('published', 'true');
    fetch(`/api/programs?${p.toString()}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: SimilarProgram[]) => {
        const filtered = Array.isArray(data) ? data.filter((pr: SimilarProgram) => pr.id !== id) : [];
        setSimilarPrograms(filtered.slice(0, 3));
      })
      .catch(() => {});
  }, [program, id]);

  const handleEnroll = async () => {
    if (!userId) {
      window.location.reload();
      return;
    }
    setEnrolling(true);
    try {
      const res = await fetch(`/api/programs/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setEnrollment(data);
      } else if (res.status === 409) {
        // already enrolled — re-fetch
        const check = await fetch(`/api/programs/${id}/enroll`);
        if (check.ok) setEnrollment(await check.json());
      }
    } catch { /* ignore */ }
    setEnrolling(false);
  };

  const handleUnenroll = async () => {
    if (!confirm('Se désinscrire de ce programme ?')) return;
    try {
      await fetch(`/api/programs/${id}/enroll`, { method: 'DELETE' });
      setEnrollment(null);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Programme" />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </>
    );
  }

  if (!program) return null;

  const sportEmoji = SPORT_EMOJIS[program.sport as Sport] || '⚡';
  const sportLabel = SPORT_LABELS[program.sport as Sport] || program.sport;
  const gradient = SPORT_GRADIENTS[program.sport as Sport] || SPORT_GRADIENTS['autre'];
  const coachName = program.coach_profiles?.display_name || 'Coach';
  const coachAvatar = program.coach_profiles?.avatar_url;
  const enrollCount = program.program_enrollments?.[0]?.count ?? 0;

  const workouts = program.program_workouts || [];
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
  const totalExercises = workouts.reduce((sum, w) => sum + (w.workout_data?.exercises?.length || 0), 0);

  // Group workouts by week
  const weeks: Record<number, Workout[]> = {};
  for (const w of workouts) {
    if (!weeks[w.week_number]) weeks[w.week_number] = [];
    weeks[w.week_number].push(w);
  }
  const weekNumbers = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);

  const isAlreadyEnrolled = !!enrollment;
  const enrolledDate = enrollment?.enrolled_at || enrollment?.created_at;

  return (
    <>
      <AppHeader title={program.title} />
      <div className="pb-32">
        {/* Hero */}
        <div
          className="relative h-56 md:h-72 flex items-end"
          style={{ background: program.cover_image_url ? undefined : gradient }}
        >
          {program.cover_image_url && (
            <img
              src={program.cover_image_url}
              alt={program.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative z-10 px-6 pb-6 w-full">
            <div className="flex items-end gap-3">
              <span className="text-4xl drop-shadow">{sportEmoji}</span>
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-extrabold text-white drop-shadow leading-tight">
                  {program.title}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="sport">{sportLabel}</Badge>
                  <Badge variant="info">{LEVEL_LABELS[program.level] || program.level}</Badge>
                  <Badge variant="success">{program.duration_weeks} semaines</Badge>
                  {enrollCount > 0 && (
                    <span className="text-xs text-white/70">{enrollCount} inscrits</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
          {/* Target Event Info */}
          {program.target_events && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div className="flex-1">
                  <h2 className="font-semibold text-amber-900 mb-1">Événement ciblé</h2>
                  <p className="text-sm font-bold text-amber-800">{program.target_events.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-amber-700">
                    {program.target_events.event_date && (
                      <span>📅 {new Date(program.target_events.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    )}
                    {program.target_events.location && (
                      <span>📍 {program.target_events.location}</span>
                    )}
                    {program.target_events.distance_km && (
                      <span>📏 {program.target_events.distance_km} km</span>
                    )}
                    {program.target_events.elevation_m && (
                      <span>⛰️ D+ {program.target_events.elevation_m} m</span>
                    )}
                    {program.target_events.terrain_type && (
                      <span>🗺️ {program.target_events.terrain_type === 'road' ? 'Route' : program.target_events.terrain_type === 'trail' ? 'Trail' : program.target_events.terrain_type === 'mixed' ? 'Mixte' : program.target_events.terrain_type}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coach info */}
          <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl border border-border bg-white">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {coachAvatar ? (
                <img src={coachAvatar} alt={coachName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{coachName[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">Coach</p>
              <p className="font-semibold text-text">{coachName}</p>
            </div>
            <Link
              href="/explore"
              className="text-xs text-brand-500 hover:text-brand-600 font-medium"
            >
              Voir le profil
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Séances', value: totalWorkouts },
              { label: 'Minutes', value: totalDuration || '—' },
              { label: 'Exercices', value: totalExercises || '—' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-border bg-white p-3 text-center">
                <p className="text-xl font-extrabold text-text">{stat.value}</p>
                <p className="text-xs text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {program.description && (
            <div className="mb-6 rounded-2xl border border-border bg-white p-4">
              <h2 className="font-semibold text-text mb-2">À propos</h2>
              <p className="text-sm text-muted leading-relaxed">{program.description}</p>
            </div>
          )}

          {/* Program structure */}
          {weekNumbers.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-text mb-3">Structure du programme</h2>
              <div className="space-y-2">
                {weekNumbers.map(weekNum => {
                  const weekWorkouts = weeks[weekNum];
                  const isExpanded = expandedWeek === weekNum;
                  return (
                    <div key={weekNum} className="rounded-2xl border border-border bg-white overflow-hidden">
                      <button
                        onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white bg-brand-500 rounded-full px-2 py-0.5">
                            S{weekNum}
                          </span>
                          <span className="text-sm font-semibold text-text">
                            Semaine {weekNum}
                          </span>
                          <span className="text-xs text-muted">
                            {weekWorkouts.length} séance{weekWorkouts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-muted text-sm">{isExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border/50 divide-y divide-border/40">
                          {weekWorkouts
                            .sort((a, b) => a.day_number - b.day_number)
                            .map(w => (
                              <div key={w.id} className="px-4 py-3 flex items-start gap-3">
                                <span className="text-[10px] font-bold text-muted bg-surface rounded px-1.5 py-0.5 mt-0.5 flex-shrink-0">
                                  {DAY_LABELS[(w.day_number - 1) % 7] || `J${w.day_number}`}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text truncate">{w.title}</p>
                                  {w.description && (
                                    <p className="text-xs text-muted truncate">{w.description}</p>
                                  )}
                                </div>
                                {w.duration_minutes > 0 && (
                                  <span className="text-xs text-muted flex-shrink-0">
                                    {w.duration_minutes} min
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Similar Programs */}
          {similarPrograms.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-text mb-3">Programmes similaires</h2>
              <div className="space-y-2">
                {similarPrograms.map(sp => {
                  const spEmoji = SPORT_EMOJIS[sp.sport as Sport] || '⚡';
                  const spGrad = SPORT_GRADIENTS[sp.sport as Sport] || SPORT_GRADIENTS['autre'];
                  const spCoach = sp.coach_profiles?.display_name || 'Coach';
                  const spEnroll = sp.program_enrollments?.[0]?.count ?? 0;
                  return (
                    <Link
                      key={sp.id}
                      href={`/explore/programs/${sp.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-white hover:shadow-md transition-all group"
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: sp.cover_image_url ? undefined : spGrad }}
                      >
                        {sp.cover_image_url ? (
                          <img src={sp.cover_image_url} alt={sp.title} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-xl">{spEmoji}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate group-hover:text-brand-600 transition-colors">{sp.title}</p>
                        <p className="text-xs text-muted truncate">{spCoach} · {sp.duration_weeks} sem. · {LEVEL_LABELS[sp.level] || sp.level}</p>
                        {spEnroll > 0 && <p className="text-[10px] text-muted">{spEnroll} inscrits</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {sp.price === 0 ? (
                          <span className="text-xs font-bold text-emerald-600">Gratuit</span>
                        ) : (
                          <span className="text-xs font-bold text-text">{sp.price}€</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-xl px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto">
          {isAlreadyEnrolled ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-green-50 py-3 text-center text-sm font-semibold text-green-700 border border-green-100">
                ✓ Inscrit
                {enrolledDate && (
                  <span className="text-xs text-green-500 ml-2">
                    depuis le {new Date(enrolledDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {garminConnected && (
                  <button
                    onClick={async () => {
                      setPushingGarmin(true);
                      try {
                        const res = await fetch(`/api/programs/${id}/push-garmin`, { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) alert(`${data.pushed} séances envoyées sur votre Garmin !`);
                        else alert(data.error || 'Erreur');
                      } catch { /* ignore */ }
                      setPushingGarmin(false);
                    }}
                    disabled={pushingGarmin}
                    className="flex-1 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                  >
                    {pushingGarmin ? 'Envoi...' : '⌚ Garmin'}
                  </button>
                )}
                <button
                  onClick={handleUnenroll}
                  className="px-4 rounded-xl border border-border py-2.5 text-sm font-medium text-muted transition hover:text-red-500 hover:border-red-200"
                >
                  Se désinscrire
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted">
                  {program.price === 0 ? 'Accès gratuit' : `Accès unique`}
                </p>
                <p className="font-bold text-text text-lg">
                  {program.price === 0 ? 'Gratuit' : `${program.price}€`}
                </p>
              </div>
              <button
                onClick={handleEnroll}
                disabled={enrolling || enrollmentLoading}
                className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {enrolling || enrollmentLoading
                  ? 'Chargement...'
                  : program.price > 0
                    ? `Acheter — ${program.price}€`
                    : "S'inscrire gratuitement"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
