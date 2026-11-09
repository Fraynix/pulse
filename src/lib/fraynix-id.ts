/**
 * Fraynix ID (shared SSO) — configuration and session helpers.
 *
 * The session is the @supabase/ssr cookie `sb-id-auth-token` set by auth.fraynix.com on the parent
 * domain `.fraynix.com`. Pulse never signs anyone in itself: it reads that cookie, and sends
 * visitors without one to the central portal.
 *
 * These variables are deliberately NOT named *SUPABASE_URL / *ANON_KEY: the build pipeline rewrites
 * those to the data-pulse database, which must stay what `admin.ts` talks to.
 * Server-only (never NEXT_PUBLIC_*). Safe to import from the edge middleware (no node APIs).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const FRAYNIX_ID_URL = process.env.FRAYNIX_ID_URL || 'https://id.fraynix.com';
export const FRAYNIX_ID_ANON_KEY = process.env.FRAYNIX_ID_ANON_KEY || '';
export const FRAYNIX_ID_PORTAL = process.env.FRAYNIX_ID_PORTAL || 'https://auth.fraynix.com';

export const FRAYNIX_COOKIE_NAME = 'sb-id-auth-token';
export const FRAYNIX_COOKIE_DOMAIN = '.fraynix.com';
export const PULSE_RIGHT = 'pulse';

export type CookieStore = {
  getAll: () => { name: string; value: string }[];
  setAll?: (cookies: { name: string; value: string; options: CookieOptions }[]) => void;
};

export function createFraynixIdClient(store: CookieStore) {
  return createServerClient(FRAYNIX_ID_URL, FRAYNIX_ID_ANON_KEY, {
    cookieOptions: { name: FRAYNIX_COOKIE_NAME, domain: FRAYNIX_COOKIE_DOMAIN },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookies) => store.setAll?.(cookies),
    },
  });
}

export function hasPulseRight(appMetadata: unknown): boolean {
  const apps = (appMetadata as { apps?: unknown } | undefined)?.apps;
  return Array.isArray(apps) && apps.includes(PULSE_RIGHT);
}

export function portalLoginUrl(next: string): string {
  const url = new URL('/login', FRAYNIX_ID_PORTAL);
  url.searchParams.set('next', next);
  return url.toString();
}

export function portalLogoutUrl(next: string): string {
  const url = new URL('/api/logout', FRAYNIX_ID_PORTAL);
  url.searchParams.set('next', next);
  return url.toString();
}

/** Public origin of this request. Behind the ingress nextUrl.host is the pod's internal name. */
export function publicOrigin(headers: Headers, fallbackHost: string): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? fallbackHost;
  const proto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  return `${proto}://${host}`;
}
