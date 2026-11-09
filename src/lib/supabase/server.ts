import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { currentPulseUser, toAuthUser } from '@/lib/pulse-user';
import { mintDataJwt } from '@/lib/supabase/data-jwt';

/**
 * Per-request data-pulse client, identity from the Fraynix ID session.
 *
 * Drop-in for the old @supabase/ssr server client: `auth.getUser()` returns the Pulse user
 * (provisioned on first visit, `pulse` right checked live), and queries run with a short-lived
 * data-pulse JWT for that user, so RLS keeps scoping `supabase.from(...)` exactly as before.
 * Without a valid session the client is anonymous and getUser() returns no user.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const user = await currentPulseUser();

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: user
        ? { headers: { Authorization: `Bearer ${mintDataJwt(user.id, user.email)}` } }
        : undefined,
    },
  );

  // Identity comes from Fraynix ID, not from data-pulse GoTrue.
  const authUser = user ? toAuthUser(user) : null;
  (client.auth as unknown as { getUser: () => Promise<unknown> }).getUser = async () => ({
    data: { user: authUser },
    error: null,
  });

  return client;
}
