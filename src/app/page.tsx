import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ─── Hero ─── */}
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Green halos */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[100px]" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="bg-gradient-to-r from-brand-500 to-cyan-500 bg-clip-text font-display text-2xl font-semibold text-transparent">
            Pulse
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-600 px-5 py-2.5 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
            >
              Ouvrir l'app
            </Link>
          </div>
        </nav>

        {/* Center content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 lg:flex-row lg:gap-16 lg:px-12">
          {/* Text side */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
              Votre sport.
              <br />
              <span className="bg-gradient-to-r from-brand-500 to-cyan-500 bg-clip-text text-transparent">
                Votre rythme.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-400">
              Planifiez vos séances, suivez vos progrès, trouvez votre coach.
              Tout dans une seule app.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-glow-green transition-all hover:from-brand-600 hover:to-brand-700"
              >
                Ouvrir mon espace
              </Link>
              <a
                href="#features"
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                Découvrir ↓
              </a>
            </div>
          </div>

          {/* Phone mockup — CSS-only */}
          <div className="mt-12 flex-shrink-0 lg:mt-0">
            <div className="relative mx-auto h-[420px] w-[220px] overflow-hidden rounded-[2.5rem] border-[3px] border-slate-600 bg-slate-800 p-3 shadow-2xl shadow-brand-500/10 sm:h-[480px] sm:w-[250px]">
              {/* Notch */}
              <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
              {/* Screen */}
              <div className="mt-6 flex h-full flex-col gap-3 overflow-hidden rounded-[1.8rem] bg-slate-900 p-3">
                {/* Mini header */}
                <div className="flex items-center justify-between">
                  <div className="h-3 w-12 rounded bg-brand-500/60" />
                  <div className="h-5 w-5 rounded-full bg-slate-700" />
                </div>
                {/* Greeting */}
                <div className="h-4 w-28 rounded bg-slate-700" />
                {/* Mini stat cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-800 p-2.5">
                    <div className="h-2 w-8 rounded bg-slate-600" />
                    <div className="mt-2 h-5 w-10 rounded bg-brand-500/50" />
                    <div className="mt-1 h-1.5 w-14 rounded bg-slate-700" />
                  </div>
                  <div className="rounded-xl bg-slate-800 p-2.5">
                    <div className="h-2 w-8 rounded bg-slate-600" />
                    <div className="mt-2 h-5 w-10 rounded bg-cyan-500/50" />
                    <div className="mt-1 h-1.5 w-14 rounded bg-slate-700" />
                  </div>
                </div>
                {/* Mini chart */}
                <div className="rounded-xl bg-slate-800 p-3">
                  <div className="h-2 w-16 rounded bg-slate-600" />
                  <div className="mt-3 flex items-end gap-1.5">
                    <div className="h-6 w-3 rounded-sm bg-brand-500/40" />
                    <div className="h-10 w-3 rounded-sm bg-brand-500/50" />
                    <div className="h-8 w-3 rounded-sm bg-brand-500/40" />
                    <div className="h-14 w-3 rounded-sm bg-brand-500/70" />
                    <div className="h-10 w-3 rounded-sm bg-brand-500/50" />
                    <div className="h-12 w-3 rounded-sm bg-brand-500/60" />
                    <div className="h-16 w-3 rounded-sm bg-brand-500" />
                  </div>
                </div>
                {/* Mini session card */}
                <div className="rounded-xl bg-slate-800 p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-cyan-500/40" />
                    <div className="flex-1">
                      <div className="h-2.5 w-20 rounded bg-slate-600" />
                      <div className="mt-1 h-2 w-14 rounded bg-slate-700" />
                    </div>
                  </div>
                </div>
                {/* Mini bottom bar */}
                <div className="mt-auto flex justify-around rounded-xl bg-slate-800 px-3 py-2">
                  <div className="h-4 w-4 rounded bg-brand-500/60" />
                  <div className="h-4 w-4 rounded bg-slate-700" />
                  <div className="h-4 w-4 rounded bg-slate-700" />
                  <div className="h-4 w-4 rounded bg-slate-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center font-display text-3xl font-semibold text-text">
            Comment ça marche
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '\u{1F3CB}\u{FE0F}',
                title: 'Planifier',
                desc: 'Créez vos séances, organisez votre semaine sportive.',
              },
              {
                icon: '\u{1F4CA}',
                title: 'Progresser',
                desc: 'Suivez vos performances, battez vos records.',
              },
              {
                icon: '\u{1F50D}',
                title: 'Explorer',
                desc: 'Trouvez un coach près de chez vous.',
              },
              {
                icon: '\u{1F3AA}',
                title: 'Participer',
                desc: 'Rejoignez des événements sportifs dans votre ville.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
              >
                <span className="text-4xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-text">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social proof ─── */}
      <section className="bg-surface px-4 py-16">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {[
            { value: '500+', label: 'sportifs' },
            { value: '50+', label: 'coachs' },
            { value: '4.8\u2605', label: 'note moyenne' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-white p-8 text-center"
            >
              <p className="bg-gradient-to-r from-brand-500 to-cyan-500 bg-clip-text font-mono text-5xl font-extrabold text-transparent">
                {s.value}
              </p>
              <p className="mt-2 text-sm font-medium text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Coach CTA ─── */}
      <section className="bg-white px-4 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold text-text">
          Vous êtes coach ?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Gérez vos clients, vos séances et vos revenus sur une seule plateforme.
        </p>
        <div className="mt-8">
          <Link
            href="/profile"
            className="inline-flex items-center rounded-xl bg-slate-900 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            Devenir coach
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-surface px-4 py-8 text-center">
        <span className="bg-gradient-to-r from-brand-500 to-cyan-500 bg-clip-text font-display text-lg font-semibold text-transparent">
          Pulse
        </span>
      </footer>
    </main>
  );
}
