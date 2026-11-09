'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/pulse/app-header';
import { Button, EmptyState } from '@/components/pulse';
import { useToast } from '@/components/pulse/toast';
import { SPORT_LABELS, SPORT_EMOJIS, type Sport } from '@/lib/sports';
import { ProgramWizardModal, type ProgramData } from '@/components/coach/program-wizard-modal';

const SPORT_ACCENT_COLORS: Record<string, string> = {
  running: '#3b82f6',
  trail: '#10b981',
  triathlon: '#0ea5e9',
  crossfit: '#ef4444',
  musculation: '#10b981',
  cyclisme: '#14b8a6',
  natation: '#0ea5e9',
  yoga: '#8b5cf6',
  boxe: '#f59e0b',
  fitness: '#f97316',
  pilates: '#a78bfa',
  meditation: '#6366f1',
  duathlon: '#22c55e',
  autre: '#64748b',
};

function getSportColor(sport: string): string {
  return SPORT_ACCENT_COLORS[sport] || '#64748b';
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '100,116,139';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

export default function CoachProgramsPage() {
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<ProgramData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPrograms = useCallback(async () => {
    try {
      setError(null);
      const meRes = await fetch('/api/coaches/me');
      if (meRes.status === 401) { setError('auth'); return; }
      if (meRes.status === 403) { setError('not-coach'); return; }
      if (!meRes.ok) { setError('fetch'); return; }
      const coach = await meRes.json();

      const progsRes = await fetch(`/api/programs?coach_id=${coach.id}`);
      if (progsRes.ok) {
        setPrograms(await progsRes.json());
      } else {
        setError('fetch');
      }
    } catch {
      setError('fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleSaved = () => {
    toast('success', editProgram ? 'Modifié' : 'Créé', editProgram ? 'Programme modifié' : 'Programme créé avec succès');
    setEditProgram(null);
    fetchPrograms();
  };

  const handleEdit = (e: React.MouseEvent, program: ProgramData) => {
    e.preventDefault();
    e.stopPropagation();
    setEditProgram(program);
    setWizardOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, program: ProgramData) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(program.id!);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent, program: ProgramData) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/programs/${program.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('success', 'Supprimé', 'Programme supprimé');
      fetchPrograms();
    } else {
      toast('error', 'Erreur', 'Impossible de supprimer le programme');
    }
    setDeletingId(null);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(null);
  };

  const publishedCount = programs.filter(p => p.is_published).length;
  const draftCount = programs.filter(p => !p.is_published).length;

  return (
    <>
      <AppHeader title="Programmes" />
      <div className="p-4 md:p-8 max-w-6xl mx-auto">

        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text">Mes programmes</h1>
            {!loading && programs.length > 0 && (
              <p className="text-sm text-muted mt-0.5">
                {publishedCount > 0 && (
                  <span className="text-emerald-600 font-medium">
                    {publishedCount} publié{publishedCount > 1 ? 's' : ''}
                  </span>
                )}
                {publishedCount > 0 && draftCount > 0 && <span className="text-muted"> · </span>}
                {draftCount > 0 && (
                  <span>{draftCount} brouillon{draftCount > 1 ? 's' : ''}</span>
                )}
              </p>
            )}
          </div>
          <Button onClick={() => { setEditProgram(null); setWizardOpen(true); }}>
            + Nouveau programme
          </Button>
        </div>

        {/* Programs list */}
        {error ? (
          <EmptyState
            icon={error === 'auth' ? '🔒' : error === 'not-coach' ? '🚫' : '⚠️'}
            title={
              error === 'auth'
                ? 'Session expirée, rechargez la page'
                : error === 'not-coach'
                  ? 'Cette page est réservée aux coachs'
                  : 'Impossible de charger les programmes. Réessayez.'
            }
            description={
              error === 'auth'
                ? 'Votre session a expiré.'
                : error === 'not-coach'
                  ? 'Seuls les comptes coach peuvent accéder à cette page.'
                  : 'Vérifiez votre connexion et réessayez.'
            }
            actionLabel={error === 'auth' ? 'Recharger' : error === 'not-coach' ? undefined : 'Réessayer'}
            onAction={
              error === 'auth'
                ? () => (window.location.reload())
                : error === 'not-coach'
                  ? undefined
                  : () => { setError(null); setLoading(true); fetchPrograms(); }
            }
          />
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : programs.length === 0 ? (
          /* Compelling empty state CTA */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 text-3xl">
              📋
            </div>
            <h2 className="text-lg font-bold text-text mb-2">Créez votre premier programme</h2>
            <p className="text-sm text-muted max-w-sm mb-6">
              Structurez des plans d&apos;entraînement sur mesure pour vos athlètes ou publiez-les sur le marketplace.
            </p>
            <Button onClick={() => { setEditProgram(null); setWizardOpen(true); }}>
              + Créer un programme
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => {
              const accentColor = getSportColor(p.sport);
              const rgbColor = hexToRgb(accentColor);
              const price = (p as unknown as { price?: number }).price;
              return (
                <Link
                  key={p.id}
                  href={`/coach/programs/${p.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-md"
                  style={{ borderTop: `3px solid ${accentColor}` }}
                >
                  {/* Card body */}
                  <div className="flex-1 px-5 pt-4 pb-3">
                    {/* Sport icon + title + status row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `rgba(${rgbColor}, 0.1)` }}
                      >
                        {SPORT_EMOJIS[p.sport as Sport] || '⚡'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text leading-tight truncate">{p.title}</h3>
                        <p className="text-xs text-muted mt-0.5">{SPORT_LABELS[p.sport as Sport] || p.sport}</p>
                      </div>
                      {/* Status badge */}
                      <span
                        className={`flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          p.is_published
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>

                    {/* Description */}
                    {p.description && (
                      <p className="text-xs text-muted line-clamp-2 mb-3">{p.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        <span className="font-medium text-text">{p.duration_weeks}</span> sem.
                      </span>
                      {p.is_published && price !== undefined && (
                        <span
                          className="ml-auto font-bold text-sm"
                          style={{ color: accentColor }}
                        >
                          {price === 0 ? 'Gratuit' : `${price}€`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action row — revealed on hover */}
                  {deletingId === p.id ? (
                    <div className="border-t border-border px-4 py-2.5 flex items-center gap-2 bg-red-50">
                      <span className="flex-1 text-xs font-medium text-red-700">Supprimer ce programme ?</span>
                      <button
                        onClick={handleDeleteCancel}
                        className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition border border-gray-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={(e) => handleDeleteConfirm(e, p)}
                        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-border px-4 py-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEdit(e, p)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-600 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, p)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
                      >
                        🗑️ Supprimer
                      </button>
                      <span className="ml-auto text-xs text-muted pr-1">Ouvrir →</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <ProgramWizardModal
        open={wizardOpen}
        onClose={() => { setWizardOpen(false); setEditProgram(null); }}
        onSaved={handleSaved}
        editProgram={editProgram}
      />
    </>
  );
}
