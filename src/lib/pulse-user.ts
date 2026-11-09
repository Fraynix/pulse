import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createFraynixIdClient, hasPulseRight } from '@/lib/fraynix-id';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Bridge between the Fraynix ID session and Pulse's own user table (data-pulse).
 *
 * Pulse's data (profiles, programs, payments, Stripe metadata...) is keyed by the data-pulse
 * auth.users id. A Fraynix ID account is mapped onto it on first visit:
 *   1. a data-pulse user already has the Fraynix ID uuid           -> use it
 *   2. a data-pulse user already has the same e-mail (legacy signup) -> link it, KEEP ITS ID
 *   3. otherwise create the user with the SAME uuid as Fraynix ID, no password
 *      (if this GoTrue refuses a client-supplied id, create without it; step 2 then finds it by
 *      e-mail on every later visit).
 * The `pulse` right is re-checked here on every call, not only in the middleware.
 */

export type PulseUser = {
  id: string;
  email: string | null;
  fraynixId: string;
  fullName: string | null;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const mapped = new Map<string, { pulseId: string; exp: number }>();

function isAlreadyExists(message: string | undefined): boolean {
  return !!message && /already (been )?registered|already exists|duplicate/i.test(message);
}

async function findByEmail(email: string): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

async function provision(fraynixId: string, email: string | null, fullName: string | null): Promise<string> {
  const hit = mapped.get(fraynixId);
  if (hit && hit.exp > Date.now()) return hit.pulseId;

  const admin = getSupabaseAdminClient();
  let pulseId: string | null = null;

  // 1. same uuid already provisioned
  const byId = await admin.auth.admin.getUserById(fraynixId);
  if (byId.data?.user) pulseId = byId.data.user.id;

  // 2. legacy account with the same e-mail
  if (!pulseId && email) {
    pulseId = await findByEmail(email);
    if (pulseId) {
      await admin.auth.admin
        .updateUserById(pulseId, { app_metadata: { fraynix_id: fraynixId } })
        .catch(() => undefined);
    }
  }

  // 3. brand-new user
  if (!pulseId) {
    if (!email) throw new Error('Fraynix ID account has no e-mail');
    const attrs = {
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? '' },
      app_metadata: { fraynix_id: fraynixId },
    };
    let res = await admin.auth.admin.createUser({ id: fraynixId, ...attrs } as Parameters<
      typeof admin.auth.admin.createUser
    >[0]);
    if (res.error && !isAlreadyExists(res.error.message)) {
      // This GoTrue does not accept a client-supplied id: create without it.
      res = await admin.auth.admin.createUser(attrs);
    }
    if (res.data?.user) {
      pulseId = res.data.user.id;
    } else if (isAlreadyExists(res.error?.message)) {
      // Lost a race with a concurrent first request.
      pulseId = (await findByEmail(email)) ?? fraynixId;
    } else {
      throw new Error(`Pulse user provisioning failed: ${res.error?.message ?? 'unknown'}`);
    }
  }

  mapped.set(fraynixId, { pulseId, exp: Date.now() + CACHE_TTL_MS });
  return pulseId;
}

/** The Pulse user for the current request, or null (no session / no `pulse` right). */
export async function currentPulseUser(): Promise<PulseUser | null> {
  const cookieStore = await cookies();
  // Server Components cannot write cookies; the middleware already refreshes them.
  const idClient = createFraynixIdClient({ getAll: () => cookieStore.getAll() });
  const { data } = await idClient.auth.getUser();
  const fu = data?.user;
  if (!fu || !hasPulseRight(fu.app_metadata)) return null;

  const meta = (fu.user_metadata ?? {}) as { full_name?: string; name?: string };
  const fullName = meta.full_name || meta.name || null;
  const email = fu.email ? fu.email.toLowerCase() : null;
  const id = await provision(fu.id, email, fullName);
  return { id, email, fraynixId: fu.id, fullName };
}

/** Minimal supabase-js `User` shape for the ~120 `auth.getUser()` call sites. */
export function toAuthUser(u: PulseUser): User {
  return {
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email ?? undefined,
    app_metadata: {},
    user_metadata: { full_name: u.fullName ?? undefined },
    created_at: new Date(0).toISOString(),
  } as User;
}
