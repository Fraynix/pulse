'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingStep } from '@/components/pulse/onboarding-step';
import { SportSelector } from '@/components/pulse/sport-selector';
import { Confetti } from '@/components/pulse/confetti';
import { Button } from '@/components/pulse/button';
import { useAuthStore } from '@/stores/auth';

const TOTAL_STEPS = 5;

/* ─── Goal presets ─── */
const GOAL_PRESETS = [
  { id: 'run5k', emoji: '\u{1F3C3}', title: 'Courir 5km', desc: 'Objectif d\u00e9butant', target: '5 km' },
  { id: '10sessions', emoji: '\u{1F4AA}', title: '10 s\u00e9ances ce mois', desc: 'R\u00e9gulier', target: '10 s\u00e9ances' },
  { id: 'custom', emoji: '\u{1F3C6}', title: 'D\u00e9passer mes limites', desc: 'Ambitieux — personnalis\u00e9', target: '' },
] as const;

/* ─── Connector data ─── */
const CONNECTORS = [
  { id: 'strava', name: 'Strava', color: 'from-orange-500 to-orange-600', icon: '\u{1F3C3}\u200D\u2642\uFE0F' },
  { id: 'garmin', name: 'Garmin', color: 'from-sky-500 to-blue-600', icon: '\u231A' },
  { id: 'fitbit', name: 'Fitbit', color: 'from-teal-400 to-teal-600', icon: '\u{1F4F1}' },
  { id: 'apple', name: 'Apple Sant\u00e9', color: 'from-pink-500 to-red-500', icon: '\u{1F34E}' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { userId } = useAuthStore();

  const [step, setStep] = useState(0);
  const [sports, setSports] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [saving, setSaving] = useState(false);

  /* ─── Save sports to profile ─── */
  const saveSports = useCallback(async () => {
    if (!userId || sports.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sports_practiced: sports }),
      });
    } catch {
      // non-blocking — continue onboarding even if save fails
    }
    setSaving(false);
  }, [userId, sports]);

  /* ─── Save goal ─── */
  const saveGoal = useCallback(async () => {
    if (!userId || !selectedGoal) return;
    setSaving(true);
    try {
      const preset = GOAL_PRESETS.find((g) => g.id === selectedGoal);
      if (!preset) { setSaving(false); return; }

      const title = selectedGoal === 'custom' ? customTitle : preset.title;
      const targetStr = selectedGoal === 'custom' ? customTarget : preset.target;
      if (!title) { setSaving(false); return; }

      const targetNum = parseFloat(targetStr) || 10;
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: selectedGoal === 'run5k' ? 'performance' : selectedGoal === '10sessions' ? 'frequency' : 'custom',
          target_value: targetNum,
          unit: selectedGoal === 'run5k' ? 'km' : selectedGoal === '10sessions' ? 'séances' : '',
        }),
      });
    } catch {
      // non-blocking
    }
    setSaving(false);
  }, [userId, selectedGoal, customTitle, customTarget]);

  /* ─── Step navigation ─── */
  function skip() {
    localStorage.setItem('pulse_onboarded', 'true');
    router.push('/dashboard');
  }

  async function next() {
    if (step === 1) await saveSports();
    if (step === 2) await saveGoal();
    if (step === TOTAL_STEPS - 1) {
      localStorage.setItem('pulse_onboarded', 'true');
      router.push('/dashboard');
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* ─── Step 0: Welcome ─── */}
      {step === 0 && (
        <OnboardingStep step={0} totalSteps={TOTAL_STEPS}>
          <div className="flex flex-col items-center text-center gap-8">
            {/* Heartbeat SVG */}
            <div className="relative w-48 h-24">
              <svg viewBox="0 0 200 80" className="w-full h-full" fill="none">
                <path
                  d="M0 40 L40 40 L50 20 L60 60 L70 30 L80 50 L90 40 L200 40"
                  stroke="url(#pulse-grad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-heartbeat-line"
                />
                <defs>
                  <linearGradient id="pulse-grad" x1="0" y1="0" x2="200" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Pulsing dot */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            </div>

            {/* Logo text */}
            <h1 className="font-display text-6xl font-bold tracking-tight bg-gradient-to-r from-brand-400 via-cyan-400 to-brand-400 bg-clip-text text-transparent">
              Pulse
            </h1>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">
                Bienvenue sur Pulse
              </h2>
              <p className="text-base text-white/50 max-w-sm">
                Votre parcours sportif commence ici.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="mt-4 px-12"
              onClick={next}
            >
              Commencer
            </Button>
          </div>
        </OnboardingStep>
      )}

      {/* ─── Step 1: Choose sports ─── */}
      {step === 1 && (
        <OnboardingStep step={1} totalSteps={TOTAL_STEPS}>
          <div className="flex flex-col items-center text-center gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Quels sports pratiquez-vous ?
              </h2>
              <p className="text-sm text-white/50">
                S{'\u00e9'}lectionnez un ou plusieurs sports
              </p>
            </div>

            <SportSelector selected={sports} onChange={setSports} />

            <Button
              variant="primary"
              size="lg"
              className="mt-4 w-full"
              disabled={sports.length === 0}
              loading={saving}
              onClick={next}
            >
              Continuer
            </Button>
          </div>
        </OnboardingStep>
      )}

      {/* ─── Step 2: Set goal ─── */}
      {step === 2 && (
        <OnboardingStep step={2} totalSteps={TOTAL_STEPS}>
          <div className="flex flex-col items-center text-center gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Fixez votre premier objectif
              </h2>
              <p className="text-sm text-white/50">
                Choisissez un objectif ou personnalisez le v{'\u00f4'}tre
              </p>
            </div>

            <div className="w-full space-y-3">
              {GOAL_PRESETS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedGoal(goal.id)}
                  className={[
                    'w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200',
                    selectedGoal === goal.id
                      ? 'bg-gradient-to-r from-brand-500/20 to-cyan-500/20 border border-brand-500/50 scale-[1.02]'
                      : 'border border-white/10 bg-white/5 hover:bg-white/10',
                  ].join(' ')}
                >
                  <span className="text-3xl">{goal.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{goal.title}</p>
                    <p className="text-xs text-white/50">{goal.desc}</p>
                  </div>
                  {selectedGoal === goal.id && (
                    <div className="ml-auto h-5 w-5 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom goal inputs */}
            {selectedGoal === 'custom' && (
              <div className="w-full space-y-3 animate-fade-in">
                <input
                  type="text"
                  placeholder="Nom de l'objectif"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
                <input
                  type="text"
                  placeholder="Objectif (ex: 50 km, 20 s\u00e9ances...)"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            )}

            <div className="flex w-full gap-3 mt-2">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 text-white/50 hover:text-white"
                onClick={next}
              >
                Passer
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!selectedGoal || (selectedGoal === 'custom' && !customTitle)}
                loading={saving}
                onClick={next}
              >
                Continuer
              </Button>
            </div>
          </div>
        </OnboardingStep>
      )}

      {/* ─── Step 3: Connect apps ─── */}
      {step === 3 && (
        <OnboardingStep step={3} totalSteps={TOTAL_STEPS}>
          <div className="flex flex-col items-center text-center gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Connectez vos apps
              </h2>
              <p className="text-sm text-white/50">
                Importez automatiquement vos activit{'\u00e9'}s
              </p>
            </div>

            <div className="w-full space-y-3">
              {CONNECTORS.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-xl`}>
                    {c.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white">{c.name}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    Connecter
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="mt-2 text-sm text-white/40 underline underline-offset-4 hover:text-white/60 transition"
            >
              Plus tard
            </button>
          </div>
        </OnboardingStep>
      )}

      {/* ─── Step 4: Ready! ─── */}
      {step === 4 && (
        <>
          <Confetti />
          <OnboardingStep step={4} totalSteps={TOTAL_STEPS}>
            <div className="flex flex-col items-center text-center gap-8">
              {/* Celebration icon */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-5xl shadow-[0_0_60px_rgba(34,197,94,0.3)]">
                  {'\u2728'}
                </div>
                <div className="absolute inset-0 h-24 w-24 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 animate-ping opacity-20" />
              </div>

              <div className="space-y-3">
                <h2 className="font-display text-4xl font-bold bg-gradient-to-r from-brand-400 via-cyan-400 to-brand-400 bg-clip-text text-transparent">
                  Vous {'\u00ea'}tes pr{'\u00ea'}t !
                </h2>
                <p className="text-sm text-white/50">
                  {sports.length} sport{sports.length > 1 ? 's' : ''}
                  {selectedGoal ? ' \u00b7 1 objectif' : ''}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="px-12 mt-4"
                onClick={next}
              >
                D{'\u00e9'}couvrir Pulse
              </Button>
            </div>
          </OnboardingStep>
        </>
      )}

      {/* Global styles for this page */}
      <style>{`
        @keyframes heartbeat-line {
          0% { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-heartbeat-line {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: heartbeat-line 2s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
