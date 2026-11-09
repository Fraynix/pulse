import { NextResponse, type NextRequest } from 'next/server';
import {
  FRAYNIX_COOKIE_DOMAIN,
  FRAYNIX_ID_ANON_KEY,
  createFraynixIdClient,
  hasPulseRight,
  portalLoginUrl,
  portalLogoutUrl,
  publicOrigin,
} from '@/lib/fraynix-id';

/**
 * Fraynix ID gate. Pulse is a private app: every page and API route needs a Fraynix ID session
 * carrying the `pulse` right (app_metadata.apps, set from the Hub, not writable by the user).
 * getUser() asks GoTrue live, so a revoked right cuts access on the next request.
 *
 * Machine callers carry no SSO cookie and authenticate themselves (Stripe/Strava signatures,
 * CRON_SECRET bearer), so they pass through.
 */
const EXEMPT_PREFIXES = ['/api/webhooks/', '/api/cron/'];
const EXEMPT_EXACT = ['/sw.js', '/manifest.webmanifest', '/manifest.json', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (EXEMPT_EXACT.includes(pathname) || EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith('/api/');

  // Fail closed: a missing anon key must never open a private app.
  if (!FRAYNIX_ID_ANON_KEY) {
    return isApi
      ? NextResponse.json({ error: 'Authentification indisponible' }, { status: 503 })
      : page('Service indisponible', "L'authentification Fraynix n'est pas configurée.", 503);
  }

  let response = NextResponse.next({ request });
  const supabase = createFraynixIdClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => {
      // Token refresh: make the new cookies visible to the route handler AND the browser.
      for (const { name, value } of cookies) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of cookies) {
        response.cookies.set({ name, value, ...options, domain: FRAYNIX_COOKIE_DOMAIN });
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = publicOrigin(request.headers, request.nextUrl.host);

  if (!user) {
    const login = portalLoginUrl(`${origin}${pathname}${request.nextUrl.search}`);
    if (isApi) return NextResponse.json({ error: 'Non authentifié', login }, { status: 401 });
    return NextResponse.redirect(login);
  }

  if (!hasPulseRight(user.app_metadata)) {
    if (isApi) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    return page(
      "Pas d'accès à Pulse",
      "Ton compte Fraynix n'a pas accès à cette app. Demande à Dimitri de te l'ouvrir.",
      403,
      { href: portalLogoutUrl(`${origin}/`), label: 'Changer de compte' },
    );
  }

  return response;
}

function page(title: string, message: string, status: number, link?: { href: string; label: string }) {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Pulse</title></head>
<body style="margin:0;min-height:100dvh;display:grid;place-items:center;background:#f8fafc;font-family:system-ui,sans-serif;color:#0f172a;padding:24px">
<main style="max-width:380px;background:#fff;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,.08);text-align:center">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
<p style="margin:0 0 20px;line-height:1.5">${message}</p>
${link ? `<a href="${link.href}" style="color:#16a34a;font-weight:600">${link.label}</a>` : ''}
</main></body></html>`;
  return new NextResponse(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// Everything except Next assets and static images from /public. sw.js and the manifest are
// exempted in code above (they must load before/without a session for the PWA to install).
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
