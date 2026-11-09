import { NextResponse } from 'next/server';
import { currentPulseUser } from '@/lib/pulse-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

// GET /api/me — the signed-in Pulse user (id + role) for the client-side auth store.
export async function GET() {
  const user = await currentPulseUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: (profile as { role?: string } | null)?.role || 'athlete',
  });
}
